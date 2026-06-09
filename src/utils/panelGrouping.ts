import { isPanelDrag, isTabGroupDrag } from '../components/dnd/dragTypes';
import { getPanelDefinition } from '../data/panels';
import { findNodeById } from '../model/layoutOperations';
import type { DragData, FloatingWindow, LayoutNode, PanelId, PanelType } from '../types/layout';

export function getTargetPanelIdsForNode(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  nodeId: string,
): PanelId[] {
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

export function canGroupWithTarget(
  draggedPanelIds: PanelId[],
  targetPanelIds: PanelId[],
  enforce: boolean,
): boolean {
  if (!enforce || draggedPanelIds.length === 0) {
    return true;
  }

  const draggedType = getPanelType(draggedPanelIds[0]);
  if (!draggedPanelIds.every((id) => getPanelType(id) === draggedType)) {
    return false;
  }

  if (targetPanelIds.length === 0) {
    return true;
  }

  const targetType = getPanelType(targetPanelIds[0]);
  if (!targetPanelIds.every((id) => getPanelType(id) === targetType)) {
    return false;
  }

  return draggedType === targetType;
}

export function canGroupDragWithTarget(
  dragData: DragData | null | undefined,
  targetPanelIds: PanelId[],
  enforce: boolean,
): boolean {
  if (!dragData) return true;
  return canGroupWithTarget(
    getPanelIdsFromDrag(dragData),
    targetPanelIds,
    enforce,
  );
}
