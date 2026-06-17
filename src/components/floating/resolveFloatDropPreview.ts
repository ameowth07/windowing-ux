import type { AuxiliaryWindowSize } from '../../config/auxiliaryWindowSizes';
import { resolveFloatingPlacement } from '../../context/FloatingContainerContext';
import { isFloatingWindowId } from '../../model/layoutOperations';
import type {
  DragPanelData,
  DragTabGroupData,
  DropTargetData,
  FloatingWindow,
  PanelId,
} from '../../types/layout';
import { canTabGroupWithTarget, getPanelIdsFromDrag } from '../../utils/panelGrouping';
import { isFloatingBodyHover, isTabInsertTarget } from '../layout/tabInsertUtils';

export type FloatDragPreview =
  | {
      kind: 'window';
      panelId: PanelId;
      panelIds: PanelId[];
      activeTabId: PanelId;
      x: number;
      y: number;
      width: number;
      height: number;
      monitorIndex: number;
    }
  | {
      kind: 'merge';
      floatingWindowId: string;
      panelId: PanelId;
    };

type FloatDragInput = DragPanelData | DragTabGroupData;

interface ResolveFloatDropPreviewInput {
  dragData: FloatDragInput;
  overData: unknown;
  pointer: { x: number; y: number };
  workspaceRect: DOMRect | null;
  floatingWindows: FloatingWindow[];
  getIdealSize: (panelId: PanelId) => AuxiliaryWindowSize;
  enforceDocumentRegion?: boolean;
  monitorCount?: number;
}

function isDropTarget(data: unknown): data is DropTargetData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as DropTargetData).type === 'drop-target'
  );
}

function isInsideWorkspace(
  pointer: { x: number; y: number },
  workspaceRect: DOMRect | null,
): boolean {
  if (!workspaceRect) return false;
  return (
    pointer.x >= workspaceRect.left &&
    pointer.x <= workspaceRect.right &&
    pointer.y >= workspaceRect.top &&
    pointer.y <= workspaceRect.bottom
  );
}

function getGroupFromDragData(dragData: FloatDragInput): {
  panelIds: PanelId[];
  activeTabId: PanelId;
} {
  if (dragData.type === 'tab-group') {
    return {
      panelIds: dragData.panels,
      activeTabId: dragData.activeTabId,
    };
  }
  return {
    panelIds: [dragData.panelId],
    activeTabId: dragData.panelId,
  };
}

export function resolveFloatDropPreview({
  dragData,
  overData,
  pointer,
  workspaceRect,
  floatingWindows,
  getIdealSize,
  enforceDocumentRegion = false,
  monitorCount = 1,
}: ResolveFloatDropPreviewInput): FloatDragPreview | null {
  const { panelIds, activeTabId } = getGroupFromDragData(dragData);

  const canMergeWithFloatingWindow = (floatingWindowId: string) =>
    canTabGroupWithTarget(
      getPanelIdsFromDrag(dragData),
      floatingWindows.find((window) => window.id === floatingWindowId)?.panels ??
        [],
      enforceDocumentRegion,
    );

  if (isTabInsertTarget(overData)) {
    if (dragData.type === 'tab-group' && overData.nodeId === dragData.nodeId) {
      return null;
    }
    if (isFloatingWindowId(floatingWindows, overData.nodeId)) {
      if (!canMergeWithFloatingWindow(overData.nodeId)) {
        return null;
      }
      return {
        kind: 'merge',
        floatingWindowId: overData.nodeId,
        panelId: activeTabId,
      };
    }
    return null;
  }

  if (isFloatingBodyHover(overData)) {
    const target = floatingWindows.find(
      (window) => window.id === overData.floatingWindowId,
    );
    if (
      !target ||
      panelIds.every((panelId) => target.panels.includes(panelId)) ||
      !canMergeWithFloatingWindow(overData.floatingWindowId)
    ) {
      return null;
    }
    return {
      kind: 'merge',
      floatingWindowId: overData.floatingWindowId,
      panelId: activeTabId,
    };
  }

  if (isDropTarget(overData)) {
    return null;
  }

  if (isInsideWorkspace(pointer, workspaceRect)) {
    return null;
  }

  const existing = floatingWindows.find((window) =>
    panelIds.some((panelId) => window.panels.includes(panelId)),
  );
  const idealSize = getIdealSize(activeTabId);
  const width = existing?.width ?? idealSize.width;
  const height = existing?.height ?? idealSize.height;
  const { x, y, monitorIndex } = resolveFloatingPlacement(
    pointer.x,
    pointer.y,
    width,
    height,
    monitorCount,
  );

  return {
    kind: 'window',
    panelId: activeTabId,
    panelIds,
    activeTabId,
    x,
    y,
    width,
    height,
    monitorIndex,
  };
}

export function getPointerFromDragEvent(event: {
  activatorEvent: Event;
  delta: { x: number; y: number };
}): { x: number; y: number } {
  const activator = event.activatorEvent as PointerEvent;
  return {
    x: activator.clientX + event.delta.x,
    y: activator.clientY + event.delta.y,
  };
}
