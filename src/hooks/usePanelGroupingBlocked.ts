import { useDndContext } from '@dnd-kit/core';
import { useEnforceDocumentRegionEnabled } from '../context/EnforceDocumentRegionContext';
import type { DragData, PanelId } from '../types/layout';
import {
  canSplitDockDragWithTarget,
  canTabGroupDragWithTarget,
} from '../utils/panelGrouping';

export function useTabGroupBlocked(targetPanelIds: PanelId[]): boolean {
  const { active } = useDndContext();
  const enforce = useEnforceDocumentRegionEnabled();

  if (!enforce || !active) {
    return false;
  }

  return !canTabGroupDragWithTarget(
    active.data.current as DragData | null | undefined,
    targetPanelIds,
    enforce,
  );
}

export function useSplitDockBlocked(targetPanelIds: PanelId[]): boolean {
  const { active } = useDndContext();
  const enforce = useEnforceDocumentRegionEnabled();

  if (!active) {
    return false;
  }

  return !canSplitDockDragWithTarget(
    active.data.current as DragData | null | undefined,
    targetPanelIds,
    enforce,
  );
}

/** @deprecated Use useTabGroupBlocked or useSplitDockBlocked. */
export function usePanelGroupingBlocked(targetPanelIds: PanelId[]): boolean {
  return useTabGroupBlocked(targetPanelIds);
}
