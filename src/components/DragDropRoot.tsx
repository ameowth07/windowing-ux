import { useCallback, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { FloatDragPreviewProvider } from '../context/FloatDragPreviewContext';
import { useAuxiliaryWindowSize } from '../context/AuxiliaryWindowSizeContext';
import { getFloatingPosition, useFloatingContainer } from '../context/FloatingContainerContext';
import { useEnforceDocumentRegionEnabled } from '../context/EnforceDocumentRegionContext';
import {
  canGroupDragWithTarget,
  getTargetPanelIdsForNode,
} from '../utils/panelGrouping';
import { isFloatingWindowId } from '../model/layoutOperations';
import { usePrimaryWindowId } from '../context/PrimaryWindowContext';
import { useProjectTabBarEnabled } from '../context/ProjectTabBarContext';
import { useScopeTabs } from '../context/ScopeTabContext';
import { useLayout } from '../context/LayoutContext';
import {
  findFloatingWindowForPanel,
  floatingWindowMatchesScope,
} from '../utils/floatingWindowScope';
import {
  TabBarDragSnapshotProvider,
  useTabBarDragSnapshotRegistry,
  type TabBarDragSnapshot,
} from '../context/TabBarDragSnapshotContext';
import type { DragData, DragPanelData, DragTabGroupData, DropTargetData } from '../types/layout';
import {
  isFloatingWindowDrag,
  isFloatingTabGroupDrag,
  isPanelDrag,
  isTabGroupDrag,
} from './dnd/dragTypes';
import { TabGroupDragOverlay } from './layout/TabGroupDragOverlay';
import { ShellEdgeZoneActivationTracker } from './layout/ShellEdgeZoneActivationTracker';
import { TabPreview } from './layout/TabPreview';
import {
  getPointerFromDragEvent,
  resolveFloatDropPreview,
  type FloatDragPreview,
} from './floating/resolveFloatDropPreview';
import { isFloatingBodyHover, isTabInsertTarget } from './layout/tabInsertUtils';
import './DragDropRoot.css';

const SHELL_EDGE_HIT_PRIORITY = [
  'shell-edge-left',
  'shell-edge-right',
  'shell-edge-top',
  'shell-edge-bottom',
] as const;

function pickShellEdgeHit(shellHits: { id: string | number }[]) {
  if (shellHits.length <= 1) return shellHits[0];
  for (const id of SHELL_EDGE_HIT_PRIORITY) {
    const hit = shellHits.find((candidate) => String(candidate.id) === id);
    if (hit) return hit;
  }
  return shellHits[0];
}

interface DragDropRootProps {
  children: ReactNode;
  workspaceRef: React.RefObject<HTMLDivElement | null>;
}

function createTabBarDragSnapshotFallback(
  dragData: DragTabGroupData,
): TabBarDragSnapshot {
  return {
    nodeId: dragData.nodeId,
    width: 320,
    visiblePanelIds: dragData.panels,
    overflowPanelIds: [],
    activeTabId: dragData.activeTabId,
    variant: dragData.source,
  };
}

export function DragDropRoot({ children, workspaceRef }: DragDropRootProps) {
  return (
    <TabBarDragSnapshotProvider>
      <DragDropRootInner workspaceRef={workspaceRef}>{children}</DragDropRootInner>
    </TabBarDragSnapshotProvider>
  );
}

function DragDropRootInner({ children, workspaceRef }: DragDropRootProps) {
  const { getSnapshot } = useTabBarDragSnapshotRegistry();
  const { getSize: getIdealAuxiliarySize } = useAuxiliaryWindowSize();
  const floatingContainerRef = useFloatingContainer();
  const {
    state,
    dockPanel,
    dockPanelAtTabIndex,
    dockTabGroup,
    dockTabGroupAtTabIndex,
    floatPanel,
    floatTabGroup,
    mergeFloatingTab,
    mergeTabGroupIntoFloating,
    mergeFloatingWindowIntoFloating,
    dockFloatingWindow,
    dockFloatingWindowAtTabIndex,
    moveFloating,
  } = useLayout();
  const projectTabBar = useProjectTabBarEnabled();
  const enforceDocumentRegion = useEnforceDocumentRegionEnabled();
  const windowId = usePrimaryWindowId();
  const { getActiveTabForWindow } = useScopeTabs();
  const activeTabId = getActiveTabForWindow(windowId);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [tabGroupDragSnapshot, setTabGroupDragSnapshot] =
    useState<TabBarDragSnapshot | null>(null);
  const [floatPreview, setFloatPreview] = useState<FloatDragPreview | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const collisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) {
      const shellHits = pointerHits.filter((hit) =>
        String(hit.id).startsWith('shell-edge-'),
      );
      const shellHit = pickShellEdgeHit(shellHits);
      if (shellHit) return [shellHit];

      const floatingBodyHit = pointerHits.find((hit) => {
        const data = hit.data?.current;
        if (!isFloatingBodyHover(data)) return false;
        if (
          isFloatingWindowDrag(args.active.data.current) &&
          data.floatingWindowId === args.active.data.current.floatingWindowId
        ) {
          return false;
        }
        if (
          isFloatingTabGroupDrag(args.active.data.current) &&
          data.floatingWindowId === args.active.data.current.nodeId
        ) {
          return false;
        }
        return true;
      });
      if (floatingBodyHit) return [floatingBodyHit];

      const floatingTabHit = pointerHits.find((hit) => {
        const data = hit.data?.current;
        return (
          isTabInsertTarget(data) &&
          isFloatingWindowId(state.floating, data.nodeId)
        );
      });
      if (floatingTabHit) return [floatingTabHit];

      return pointerHits;
    }
    return rectIntersection(args);
  };

  const updateFloatPreview = useCallback(
    (event: DragMoveEvent | DragOverEvent, dragData: DragPanelData | DragTabGroupData) => {
      const pointer = getPointerFromDragEvent(event);
      setFloatPreview(
        resolveFloatDropPreview({
          dragData,
          overData: event.over?.data.current,
          pointer,
          workspaceRect: workspaceRef.current?.getBoundingClientRect() ?? null,
          floatingContainer: floatingContainerRef?.current ?? null,
          floatingWindows: state.floating,
          getIdealSize: getIdealAuxiliarySize,
          enforceDocumentRegion,
        }),
      );
    },
    [enforceDocumentRegion, floatingContainerRef, getIdealAuxiliarySize, state.floating, workspaceRef],
  );

  const updateFloatingWindowPosition = useCallback(
    (
      event: DragMoveEvent | DragOverEvent | DragEndEvent,
      floatingWindowId: string,
    ) => {
      const floatingWindow = state.floating.find(
        (window) => window.id === floatingWindowId,
      );
      if (!floatingWindow) return;

      const pointer = getPointerFromDragEvent(event);
      const { x, y } = getFloatingPosition(
        floatingContainerRef?.current ?? null,
        pointer.x,
        pointer.y,
        floatingWindow.width,
        floatingWindow.height,
      );
      moveFloating(floatingWindowId, x, y);
    },
    [floatingContainerRef, moveFloating, state.floating],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (isPanelDrag(data) || isTabGroupDrag(data)) {
      setActiveDrag(data);
      setFloatPreview(null);
      if (isTabGroupDrag(data)) {
        setTabGroupDragSnapshot(
          getSnapshot(data.nodeId) ?? createTabBarDragSnapshotFallback(data),
        );
      } else {
        setTabGroupDragSnapshot(null);
      }
      return;
    }

    if (isFloatingWindowDrag(data)) {
      setFloatPreview(null);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const data = event.active.data.current;
    if (isPanelDrag(data) || isTabGroupDrag(data)) {
      updateFloatPreview(event, data);
    } else if (isFloatingWindowDrag(data)) {
      updateFloatingWindowPosition(event, data.floatingWindowId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const data = event.active.data.current;
    if (isPanelDrag(data) || isTabGroupDrag(data)) {
      updateFloatPreview(event, data);
    } else if (isFloatingWindowDrag(data)) {
      updateFloatingWindowPosition(event, data.floatingWindowId);
    }
  };

  const clearDragState = () => {
    setActiveDrag(null);
    setTabGroupDragSnapshot(null);
    setFloatPreview(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const dragData = event.active.data.current;
    clearDragState();

    if (isFloatingWindowDrag(dragData)) {
      handleFloatingWindowDragEnd(event, dragData);
      return;
    }

    if (isTabGroupDrag(dragData)) {
      handleTabGroupDragEnd(event, dragData);
      return;
    }

    if (!isPanelDrag(dragData)) return;

    handlePanelDragEnd(event, dragData);
  };

  const handleFloatingWindowDragEnd = (
    event: DragEndEvent,
    dragData: Extract<DragData, { type: 'floating-window' }>,
  ) => {
    updateFloatingWindowPosition(event, dragData.floatingWindowId);
  };

  const handleTabGroupDragEnd = (
    event: DragEndEvent,
    dragData: DragTabGroupData,
  ) => {
    if (dragData.source === 'floating') {
      handleFloatingTabGroupDragEnd(event, dragData);
      return;
    }

    const overData = event.over?.data.current;

    if (isTabInsertTarget(overData)) {
      if (overData.nodeId === dragData.nodeId) return;
      if (isFloatingWindowId(state.floating, overData.nodeId)) {
        const target = state.floating.find(
          (window) => window.id === overData.nodeId,
        );
        if (!floatingWindowMatchesScope(target, activeTabId, projectTabBar)) {
          return;
        }
        if (!canGroupWithNode(dragData, overData.nodeId)) {
          return;
        }
        mergeTabGroupIntoFloating(dragData.nodeId, overData.nodeId);
        return;
      }
      if (!canGroupWithNode(dragData, overData.nodeId)) {
        return;
      }
      dockTabGroupAtTabIndex(
        dragData.nodeId,
        overData.nodeId,
        overData.index,
      );
      return;
    }

    if (isFloatingBodyHover(overData)) {
      const target = state.floating.find(
        (window) => window.id === overData.floatingWindowId,
      );
      if (
        !target ||
        dragData.panels.every((panelId) => target.panels.includes(panelId)) ||
        !floatingWindowMatchesScope(target, activeTabId, projectTabBar)
      ) {
        return;
      }
      if (!canGroupWithNode(dragData, overData.floatingWindowId)) {
        return;
      }
      mergeTabGroupIntoFloating(dragData.nodeId, overData.floatingWindowId);
      return;
    }

    if ((overData as DropTargetData | undefined)?.type === 'drop-target') {
      const dropData = overData as DropTargetData;
      if (
        dropData.nodeId !== '__workspace_root__' &&
        !canGroupWithNode(dragData, dropData.nodeId)
      ) {
        return;
      }
      dockTabGroup(dragData.nodeId, dropData.nodeId, dropData.zone);
      return;
    }

    const workspaceEl = workspaceRef.current;
    if (!workspaceEl) return;

    const pointer = getPointerFromDragEvent(event);
    const preview = resolveFloatDropPreview({
      dragData,
      overData,
      pointer,
      workspaceRect: workspaceEl.getBoundingClientRect(),
      floatingContainer: floatingContainerRef?.current ?? null,
      floatingWindows: state.floating,
      getIdealSize: getIdealAuxiliarySize,
      enforceDocumentRegion,
    });

    if (preview?.kind === 'window') {
      floatTabGroup(
        dragData.nodeId,
        preview.x,
        preview.y,
        preview.width,
        preview.height,
      );
    }
  };

  const handleFloatingTabGroupDragEnd = (
    event: DragEndEvent,
    dragData: DragTabGroupData,
  ) => {
    const floatingWindowId = dragData.nodeId;
    const floatingWindow = state.floating.find(
      (window) => window.id === floatingWindowId,
    );
    if (!floatingWindow) return;

    const overData = event.over?.data.current;

    if (isTabInsertTarget(overData)) {
      if (overData.nodeId === floatingWindowId) return;
      if (isFloatingWindowId(state.floating, overData.nodeId)) {
        const target = state.floating.find(
          (window) => window.id === overData.nodeId,
        );
        if (
          !floatingWindowMatchesScope(floatingWindow, activeTabId, projectTabBar) ||
          !floatingWindowMatchesScope(target, activeTabId, projectTabBar)
        ) {
          return;
        }
        if (!canGroupWithNode(dragData, overData.nodeId)) {
          return;
        }
        mergeFloatingWindowIntoFloating(
          floatingWindowId,
          overData.nodeId,
          overData.index,
        );
        return;
      }
      if (!canDockFloatingToWorkspace(floatingWindowId)) return;
      if (!canGroupWithNode(dragData, overData.nodeId)) {
        return;
      }
      dockFloatingWindowAtTabIndex(
        floatingWindowId,
        overData.nodeId,
        overData.index,
      );
      return;
    }

    if (isFloatingBodyHover(overData)) {
      if (overData.floatingWindowId === floatingWindowId) return;
      const target = state.floating.find(
        (window) => window.id === overData.floatingWindowId,
      );
      if (
        !floatingWindowMatchesScope(floatingWindow, activeTabId, projectTabBar) ||
        !floatingWindowMatchesScope(target, activeTabId, projectTabBar)
      ) {
        return;
      }
      if (!canGroupWithNode(dragData, overData.floatingWindowId)) {
        return;
      }
      mergeFloatingWindowIntoFloating(
        floatingWindowId,
        overData.floatingWindowId,
      );
      return;
    }

    if ((overData as DropTargetData | undefined)?.type === 'drop-target') {
      if (!canDockFloatingToWorkspace(floatingWindowId)) return;
      const dropData = overData as DropTargetData;
      if (
        dropData.nodeId !== '__workspace_root__' &&
        !canGroupWithNode(dragData, dropData.nodeId)
      ) {
        return;
      }
      dockFloatingWindow(
        floatingWindowId,
        dropData.nodeId,
        dropData.zone,
      );
      return;
    }

    const pointer = getPointerFromDragEvent(event);
    const { x, y } = getFloatingPosition(
      floatingContainerRef?.current ?? null,
      pointer.x,
      pointer.y,
      floatingWindow.width,
      floatingWindow.height,
    );
    moveFloating(floatingWindowId, x, y);
  };

  const getFloatingSourceWindow = (dragData: DragPanelData) => {
    if (dragData.source !== 'floating') return undefined;
    if (dragData.floatingWindowId) {
      return state.floating.find(
        (window) => window.id === dragData.floatingWindowId,
      );
    }
    return findFloatingWindowForPanel(state.floating, dragData.panelId);
  };

  const canDockFloatingToWorkspace = (floatingWindowId: string) => {
    const window = state.floating.find((entry) => entry.id === floatingWindowId);
    return floatingWindowMatchesScope(window, activeTabId, projectTabBar);
  };

  const canGroupWithNode = (
    dragData: DragPanelData | DragTabGroupData,
    nodeId: string,
  ) =>
    canGroupDragWithTarget(
      dragData,
      getTargetPanelIdsForNode(state.root, state.floating, nodeId),
      enforceDocumentRegion,
    );

  const handlePanelDragEnd = (
    event: DragEndEvent,
    dragData: DragPanelData,
  ) => {
    const overData = event.over?.data.current;
    const sourceFloatingWindow = getFloatingSourceWindow(dragData);

    if (isTabInsertTarget(overData)) {
      if (isFloatingWindowId(state.floating, overData.nodeId)) {
        const target = state.floating.find(
          (window) => window.id === overData.nodeId,
        );
        if (
          sourceFloatingWindow &&
          !floatingWindowMatchesScope(target, activeTabId, projectTabBar)
        ) {
          return;
        }
        if (!canGroupWithNode(dragData, overData.nodeId)) {
          return;
        }
        mergeFloatingTab(
          dragData.panelId,
          overData.nodeId,
          overData.index,
        );
      } else {
        if (
          sourceFloatingWindow &&
          !floatingWindowMatchesScope(
            sourceFloatingWindow,
            activeTabId,
            projectTabBar,
          )
        ) {
          return;
        }
        if (!canGroupWithNode(dragData, overData.nodeId)) {
          return;
        }
        dockPanelAtTabIndex(
          dragData.panelId,
          overData.nodeId,
          overData.index,
        );
      }
      return;
    }

    if (isFloatingBodyHover(overData)) {
      const target = state.floating.find(
        (window) => window.id === overData.floatingWindowId,
      );
      if (!target || target.panels.includes(dragData.panelId)) {
        return;
      }
      if (
        sourceFloatingWindow &&
        !floatingWindowMatchesScope(target, activeTabId, projectTabBar)
      ) {
        return;
      }
      if (!canGroupWithNode(dragData, overData.floatingWindowId)) {
        return;
      }
      mergeFloatingTab(
        dragData.panelId,
        overData.floatingWindowId,
        target.panels.length,
      );
      return;
    }

    if ((overData as DropTargetData | undefined)?.type === 'drop-target') {
      if (
        sourceFloatingWindow &&
        !floatingWindowMatchesScope(
          sourceFloatingWindow,
          activeTabId,
          projectTabBar,
        )
      ) {
        return;
      }
      const dropData = overData as DropTargetData;
      if (
        dropData.nodeId !== '__workspace_root__' &&
        !canGroupWithNode(dragData, dropData.nodeId)
      ) {
        return;
      }
      dockPanel(dragData.panelId, dropData.nodeId, dropData.zone);
      return;
    }

    const workspaceEl = workspaceRef.current;
    if (!workspaceEl) return;

    const pointer = getPointerFromDragEvent(event);
    const preview = resolveFloatDropPreview({
      dragData,
      overData,
      pointer,
      workspaceRect: workspaceEl.getBoundingClientRect(),
      floatingContainer: floatingContainerRef?.current ?? null,
      floatingWindows: state.floating,
      getIdealSize: getIdealAuxiliarySize,
      enforceDocumentRegion,
    });

    if (preview?.kind === 'window') {
      floatPanel(
        dragData.panelId,
        preview.x,
        preview.y,
        preview.width,
        preview.height,
      );
    }
  };

  return (
    <FloatDragPreviewProvider preview={floatPreview}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={clearDragState}
      >
        <ShellEdgeZoneActivationTracker />
        <div className="drag-drop-root">{children}</div>
        <DragOverlay dropAnimation={null}>
          {isPanelDrag(activeDrag) && floatPreview?.kind !== 'window' ? (
            <div className="drag-overlay-tab">
              <TabPreview panelId={activeDrag.panelId} />
            </div>
          ) : null}
          {isTabGroupDrag(activeDrag) &&
          tabGroupDragSnapshot &&
          floatPreview?.kind !== 'window' ? (
            <TabGroupDragOverlay snapshot={tabGroupDragSnapshot} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </FloatDragPreviewProvider>
  );
}
