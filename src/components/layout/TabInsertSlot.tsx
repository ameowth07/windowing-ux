import { useDndContext, useDroppable } from '@dnd-kit/core';
import { isPanelDrag, isTabGroupDrag } from '../dnd/dragTypes';
import type { TabInsertTargetData } from '../../types/layout';
import { TabInsertIndicator } from './TabInsertIndicator';
import type { TabInsertSlotProps } from './tabInsertUtils';
import { getTabInsertDropId } from './tabInsertUtils';
import './TabInsertSlot.css';

interface TabInsertSlotOverlayProps extends TabInsertSlotProps {
  left: number;
  dropBlocked?: boolean;
}

export function TabInsertSlotOverlay({
  nodeId,
  index,
  hidden,
  left,
  dropBlocked = false,
}: TabInsertSlotOverlayProps) {
  const { active } = useDndContext();
  const isDraggingTab =
    isPanelDrag(active?.data.current) || isTabGroupDrag(active?.data.current);

  const data: TabInsertTargetData = {
    type: 'tab-insert',
    nodeId,
    index,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: getTabInsertDropId(nodeId, index),
    data,
    disabled: !isDraggingTab || hidden || dropBlocked,
  });

  if (!isDraggingTab || hidden || dropBlocked) return null;

  return (
    <div
      className="tab-insert-slot tab-insert-slot--overlay"
      style={{ left }}
      aria-label={`Insert tab at position ${index + 1}`}
    >
      <div ref={setNodeRef} className="tab-insert-slot__hit">
        <TabInsertIndicator active={isOver} />
      </div>
    </div>
  );
}

export function shouldHideTabInsertSlot(
  panelIds: string[],
  draggedPanelId: string | undefined,
  index: number,
): boolean {
  if (!draggedPanelId || !panelIds.includes(draggedPanelId)) return false;
  const currentIndex = panelIds.indexOf(draggedPanelId);
  return index === currentIndex || index === currentIndex + 1;
}
