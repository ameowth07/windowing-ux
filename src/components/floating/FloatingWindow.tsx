import { useRef } from 'react';
import { useDraggable, useDndContext, useDroppable } from '@dnd-kit/core';
import { useProjectName } from '../../context/AppWindowContext';
import { useProjectTabBarEnabled } from '../../context/ProjectTabBarContext';
import { useScopeTabLabel } from '../../context/ScopeTabContext';
import { useFloatDragPreview } from '../../context/FloatDragPreviewContext';
import { useCollapsedTabBar } from '../../context/CollapsedTabBarContext';
import { useDialogInteractionLocked } from '../../context/DialogModalContext';
import { useLayout } from '../../context/LayoutContext';
import type { DragFloatingWindowData, FloatingBodyHoverData, LayoutNode, PanelId } from '../../types/layout';
import { useFloatingPanelDockingEnabled } from '../../context/FloatingPanelDockingContext';
import { FloatingLayoutProvider } from '../../context/FloatingLayoutContext';
import { LayoutRenderer } from '../layout/LayoutRenderer';
import { usePanelGroupingBlocked } from '../../hooks/usePanelGroupingBlocked';
import { isTabGroupDrag } from '../dnd/dragTypes';
import { PanelContent } from '../panels/PanelContent';
import { DraggableTab } from '../layout/DraggableTab';
import { DraggableTabBar } from '../layout/DraggableTabBar';
import { TabBarOverflowMenu } from '../layout/TabBarOverflowMenu';
import { PanelTabBarMenu } from '../layout/PanelTabBarMenu';
import { TabInsertOverlay } from '../layout/TabInsertOverlay';
import { TabPreview } from '../layout/TabPreview';
import { useRegisterTabBarDragSnapshot } from '../layout/useRegisterTabBarDragSnapshot';
import { useTabBarOverflow } from '../layout/useTabBarOverflow';
import { DialogWindowScrim } from '../layout/DialogWindowScrim';
import { FloatingWindowResizeHandles } from './FloatingWindowResizeHandles';
import { FloatingEdgeDropZones } from './FloatingEdgeDropZones';
import { useFloatingWindowResize } from './useFloatingWindowResize';
import './FloatingWindow.css';

interface FloatingWindowProps {
  id: string;
  panels: PanelId[];
  activeTabId: PanelId;
  layout?: LayoutNode | null;
  x: number;
  y: number;
  width: number;
  height: number;
  scopeTabId?: string;
  isMergeTarget?: boolean;
  dragOverlay?: boolean;
}

export function FloatingWindow({
  id,
  panels,
  activeTabId,
  layout = null,
  x,
  y,
  width,
  height,
  scopeTabId,
  isMergeTarget = false,
  dragOverlay = false,
}: FloatingWindowProps) {
  const floatingPanelDocking = useFloatingPanelDockingEnabled();
  const useLayoutBody = floatingPanelDocking && layout != null;
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const { active } = useDndContext();
  const floatPreview = useFloatDragPreview();
  const projectName = useProjectName();
  const projectTabBar = useProjectTabBarEnabled();
  const scopeTabLabel = useScopeTabLabel(scopeTabId);
  const windowTitle =
    projectTabBar && scopeTabLabel ? scopeTabLabel : projectName;
  const { closeTab, setFloatingActiveTab, selectFloatingOverflowTab } = useLayout();
  const { isTabBarCollapsed, expandTabBar } = useCollapsedTabBar();
  const isCollapsed = isTabBarCollapsed(id);
  const isAnyDragActive = active != null;
  const isDropBlocked = usePanelGroupingBlocked(panels);
  const isDialogInteractionLocked = useDialogInteractionLocked();
  const { visiblePanelIds, overflowPanelIds } = useTabBarOverflow(
    tabBarRef,
    measureRef,
    panels,
    isAnyDragActive || isCollapsed,
  );

  useRegisterTabBarDragSnapshot(id, tabBarRef, {
    visiblePanelIds,
    overflowPanelIds,
    activeTabId,
    variant: 'floating',
  });

  const isThisTabGroupDragging =
    isTabGroupDrag(active?.data.current) &&
    active.data.current.nodeId === id;
  const isFloatWindowPreviewActive =
    floatPreview?.kind === 'window' && isThisTabGroupDragging;

  const tabBarDragClass = isFloatWindowPreviewActive
    ? 'floating-window__tab-bar--dragging-source-hidden'
    : isThisTabGroupDragging
      ? 'floating-window__tab-bar--dragging-source'
      : '';
  const { startResize, isResizing } = useFloatingWindowResize(id, {
    x,
    y,
    width,
    height,
  });

  const dragData: DragFloatingWindowData = {
    type: 'floating-window',
    floatingWindowId: id,
  };
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `float-window-${id}`,
    data: dragData,
    disabled: dragOverlay,
  });

  const bodyHoverData: FloatingBodyHoverData = {
    type: 'floating-body-hover',
    floatingWindowId: id,
  };
  const { setNodeRef: setBodyRef } = useDroppable({
    id: `floating-body-${id}`,
    data: bodyHoverData,
    disabled: isDropBlocked || dragOverlay || useLayoutBody,
  });

  const draggedPanelId = (active?.data.current as { panelId?: PanelId } | undefined)
    ?.panelId;

  const handleClose = () => {
    for (const panelId of panels) {
      closeTab(panelId);
    }
  };

  const handleOverflowSelect = (panelId: PanelId) => {
    const rightmostVisible = visiblePanelIds[visiblePanelIds.length - 1];
    if (rightmostVisible && rightmostVisible !== panelId) {
      selectFloatingOverflowTab(id, panelId, rightmostVisible);
      return;
    }
    setFloatingActiveTab(id, panelId);
  };

  return (
    <div
      className={[
        'floating-window',
        isMergeTarget ? 'floating-window--merge-target' : '',
        isDropBlocked ? 'floating-window--drop-blocked' : '',
        isResizing ? 'floating-window--resizing' : '',
        isDialogInteractionLocked ? 'floating-window--dialog-chrome-locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: x, top: y, width, height }}
    >
      <div
        ref={setNodeRef}
        className="floating-window__app-bar"
        {...listeners}
        {...attributes}
      >
        <div className="floating-window__title">{windowTitle}</div>
        <div
          className="floating-window__window-controls"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="floating-window__window-btn"
            aria-label="Minimize"
          >
            <MinimizeIcon />
          </button>
          <button
            type="button"
            className="floating-window__window-btn"
            aria-label="Maximize"
          >
            <MaximizeIcon />
          </button>
          <button
            type="button"
            className="floating-window__window-btn floating-window__window-btn--close"
            aria-label="Close"
            onClick={handleClose}
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div
        ref={setBodyRef}
        className={[
          'floating-window__panel',
          isCollapsed ? 'floating-window__panel--tab-bar-collapsed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {isCollapsed ? (
          <button
            type="button"
            className="floating-window__expand-tab-bar"
            aria-label="Expand tab bar"
            title="Expand tab bar"
            onClick={() => expandTabBar(id)}
          />
        ) : useLayoutBody ? null : (
          <>
        <div
          ref={tabBarRef}
          className={['floating-window__tab-bar', tabBarDragClass].filter(Boolean).join(' ')}
        >
          <div ref={measureRef} className="floating-window__tabs-measure" aria-hidden="true">
            {panels.map((panelId) => (
              <div key={panelId} data-measure-panel-id={panelId}>
                <TabPreview
                  panelId={panelId}
                  active={panelId === activeTabId}
                />
              </div>
            ))}
          </div>
          <div ref={tabsRef} className="floating-window__tabs">
            <DraggableTabBar
              nodeId={id}
              panels={panels}
              activeTabId={activeTabId}
              source="floating"
            />
            {visiblePanelIds.map((panelId) => (
              <DraggableTab
                key={panelId}
                panelId={panelId}
                tabIndex={panels.indexOf(panelId)}
                active={panelId === activeTabId}
                onSelect={() => setFloatingActiveTab(id, panelId)}
                source="floating"
                floatingWindowId={id}
              />
            ))}
            <TabInsertOverlay
              nodeId={id}
              panelIds={panels}
              draggedPanelId={draggedPanelId}
              tabsContainerRef={tabsRef}
              dropBlocked={isDropBlocked}
            />
          </div>
          <TabBarOverflowMenu
            overflowPanelIds={overflowPanelIds}
            activeTabId={activeTabId}
            onSelect={handleOverflowSelect}
          />
          <div className="floating-window__actions" data-tab-bar-actions>
            <PanelTabBarMenu
              variant="floating"
              nodeId={id}
              panelIds={panels}
              activePanelId={activeTabId}
              tabBarRef={tabBarRef}
            />
          </div>
        </div>
        <div className="floating-window__tab-divider" />
          </>
        )}
        <div
          className={[
            'floating-window__body',
            useLayoutBody ? 'floating-window__body--layout' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {useLayoutBody && layout ? (
            <FloatingLayoutProvider floatingWindowId={id}>
              <div className="floating-window__layout-area">
                <LayoutRenderer node={layout} />
                <FloatingEdgeDropZones
                  floatingWindowId={id}
                  layoutRootNodeId={layout.id}
                  panelIds={panels}
                />
              </div>
            </FloatingLayoutProvider>
          ) : (
            <PanelContent panelId={activeTabId} />
          )}
        </div>
      </div>
      <FloatingWindowResizeHandles
        onResizeStart={dragOverlay || isDialogInteractionLocked ? undefined : startResize}
      />
      <DialogWindowScrim variant="auxiliary" />
    </div>
  );
}

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1 5.5h8" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="7"
        height="7"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
