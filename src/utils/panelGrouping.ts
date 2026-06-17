import { isPanelDrag, isTabGroupDrag } from '../components/dnd/dragTypes';
import { getPanelDefinition } from '../data/panels';
import { findNodeById, findFloatingWindowByLayoutNodeId } from '../model/layoutOperations';
import type { DragData, FloatingWindow, LayoutNode, PanelId, PanelType } from '../types/layout';

export function getTargetPanelIdsForNode(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  nodeId: string,
): PanelId[] {
  const floatByLayout = findFloatingWindowByLayoutNodeId(floating, nodeId);
  if (floatByLayout?.layout) {
    const node = findNodeById(floatByLayout.layout, nodeId);
    if (!node) return [];
    if (node.type === 'panel') return [node.panelId];
    if (node.type === 'tabs') return node.panels;
    if (node.id === floatByLayout.layout.id) return floatByLayout.panels;
    return [];
  }

  const floatingWindow = floating.find((window) => window.id === nodeId);
  if (floatingWindow) {
    return floatingWindow.panels;
  }

  const node = findNodeById(root, nodeId);
  if (!node) return [];
  if (node.type === 'panel') return [node.panelId];
  if (node.type === 'tabs') return node.panels;
  return [];
}

export function getPanelType(panelId: PanelId): PanelType {
  return getPanelDefinition(panelId)?.panelType ?? 'auxiliary';
}

/** Returns the shared panel type when all panels match; null for empty or mixed groups. */
export function getPanelGroupType(panelIds: PanelId[]): PanelType | null {
  if (panelIds.length === 0) return null;

  const groupType = getPanelType(panelIds[0]);
  if (!panelIds.every((id) => getPanelType(id) === groupType)) {
    return null;
  }

  return groupType;
}

export function getPanelIdsFromDrag(dragData: unknown): PanelId[] {
  if (isPanelDrag(dragData)) {
    return [dragData.panelId];
  }
  if (isTabGroupDrag(dragData)) {
    return dragData.panels;
  }
  return [];
}

function draggedPanelsHaveUniformType(draggedPanelIds: PanelId[]): boolean {
  if (draggedPanelIds.length === 0) return true;
  const draggedType = getPanelType(draggedPanelIds[0]);
  return draggedPanelIds.every((id) => getPanelType(id) === draggedType);
}

/** Tab bar merge / tab insert — document and auxiliary cannot share a tab group when enforced. */
export function canTabGroupWithTarget(
  draggedPanelIds: PanelId[],
  targetPanelIds: PanelId[],
  enforce: boolean,
): boolean {
  if (!enforce || draggedPanelIds.length === 0) {
    return true;
  }

  if (!draggedPanelsHaveUniformType(draggedPanelIds)) {
    return false;
  }

  const draggedType = getPanelType(draggedPanelIds[0]);

  if (targetPanelIds.length === 0) {
    return true;
  }

  const targetType = getPanelType(targetPanelIds[0]);
  if (!targetPanelIds.every((id) => getPanelType(id) === targetType)) {
    return false;
  }

  return draggedType === targetType;
}

/** Edge / gutter split docking — cross-type splits are allowed even when document region is enforced. */
export function canSplitDockWithTarget(
  draggedPanelIds: PanelId[],
  _targetPanelIds: PanelId[],
  _enforce: boolean,
): boolean {
  return draggedPanelsHaveUniformType(draggedPanelIds);
}

export function canTabGroupDragWithTarget(
  dragData: DragData | null | undefined,
  targetPanelIds: PanelId[],
  enforce: boolean,
): boolean {
  if (!dragData) return true;
  return canTabGroupWithTarget(
    getPanelIdsFromDrag(dragData),
    targetPanelIds,
    enforce,
  );
}

export function canSplitDockDragWithTarget(
  dragData: DragData | null | undefined,
  targetPanelIds: PanelId[],
  enforce: boolean,
): boolean {
  if (!dragData) return true;
  return canSplitDockWithTarget(
    getPanelIdsFromDrag(dragData),
    targetPanelIds,
    enforce,
  );
}

/** @deprecated Use canTabGroupWithTarget for tab merges or canSplitDockWithTarget for edge/gutter docks. */
export function canGroupWithTarget(
  draggedPanelIds: PanelId[],
  targetPanelIds: PanelId[],
  enforce: boolean,
): boolean {
  return canTabGroupWithTarget(draggedPanelIds, targetPanelIds, enforce);
}

/** @deprecated Use canTabGroupDragWithTarget or canSplitDockDragWithTarget. */
export function canGroupDragWithTarget(
  dragData: DragData | null | undefined,
  targetPanelIds: PanelId[],
  enforce: boolean,
): boolean {
  return canTabGroupDragWithTarget(dragData, targetPanelIds, enforce);
}
