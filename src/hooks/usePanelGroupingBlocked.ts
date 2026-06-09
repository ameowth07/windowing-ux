import { useDndContext } from '@dnd-kit/core';
import { useEnforceDocumentRegionEnabled } from '../context/EnforceDocumentRegionContext';
import type { DragData, PanelId } from '../types/layout';
import { canGroupDragWithTarget } from '../utils/panelGrouping';

export function usePanelGroupingBlocked(targetPanelIds: PanelId[]): boolean {
  const { active } = useDndContext();
  const enforce = useEnforceDocumentRegionEnabled();

  if (!enforce || !active) {
    return false;
  }

  return !canGroupDragWithTarget(
    active.data.current as DragData | null | undefined,
    targetPanelIds,
    enforce,
  );
}
