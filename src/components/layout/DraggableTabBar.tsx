import { useDraggable } from '@dnd-kit/core';
import type { DragTabGroupData, PanelId } from '../../types/layout';
import './DraggableTabBar.css';

interface DraggableTabBarProps {
  nodeId: string;
  panels: PanelId[];
  activeTabId: PanelId;
  source?: 'docked' | 'floating';
}

/** Full tab-bar surface for dragging the whole group; sits behind individual tabs. */
export function DraggableTabBar({
  nodeId,
  panels,
  activeTabId,
  source = 'docked',
}: DraggableTabBarProps) {
  const dragData: DragTabGroupData = {
    type: 'tab-group',
    nodeId,
    panels,
    activeTabId,
    source,
  };

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `tab-group-${nodeId}`,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      className="tab-group-drag-layer"
      aria-label="Drag tab group"
      title="Drag tab group"
      {...listeners}
      {...attributes}
    />
  );
}
