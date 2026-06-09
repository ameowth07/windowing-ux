import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { getPanelDefinition } from '../../data/panels';
import type { DragPanelData, PanelId } from '../../types/layout';
import { TabPanelIcon } from './TabPanelIcon';
import './DraggableTab.css';

interface DraggableTabProps {
  panelId: PanelId;
  active: boolean;
  onSelect: () => void;
  source?: 'docked' | 'floating';
  floatingWindowId?: string;
  tabIndex?: number;
}

export function DraggableTab({
  panelId,
  active,
  onSelect,
  source = 'docked',
  floatingWindowId,
  tabIndex,
}: DraggableTabProps) {
  const def = getPanelDefinition(panelId);
  const dragData: DragPanelData = {
    type: 'panel',
    panelId,
    source,
    floatingWindowId,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `tab-${source}-${panelId}`,
      data: dragData,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-tab-index={tabIndex}
      data-panel-id={panelId}
      className={`draggable-tab ${active ? 'draggable-tab--active' : ''} ${isDragging ? 'draggable-tab--dragging' : ''}`}
      style={style}
      onClick={onSelect}
      {...listeners}
      {...attributes}
    >
      {def?.icon ? <TabPanelIcon icon={def.icon} /> : null}
      <span>{def?.title ?? panelId}</span>
    </button>
  );
}
