import { useDndContext, useDroppable } from '@dnd-kit/core';
import { PANEL_DROP_ZONES } from '../../config/dropZones';
import type { DropTargetData, DropZone } from '../../types/layout';
import './EmptyWorkspaceDrop.css';

export function EmptyWorkspaceDrop() {
  const { active } = useDndContext();
  const isDraggingPanel = active?.data.current?.type === 'panel';

  if (!isDraggingPanel) return null;

  return (
    <div className="empty-workspace-drop empty-workspace-drop--zones drop-zones">
      {PANEL_DROP_ZONES.map(({ zone, label }) => (
        <EmptyWorkspaceZone key={zone} zone={zone} label={label} />
      ))}
    </div>
  );
}

function EmptyWorkspaceZone({
  zone,
  label,
}: {
  zone: DropZone;
  label: string;
}) {
  const data: DropTargetData = {
    type: 'drop-target',
    nodeId: '__workspace_root__',
    zone,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `drop-workspace-root-${zone}`,
    data,
  });

  return (
    <div
      ref={setNodeRef}
      className={`drop-zone drop-zone--${zone} ${isOver ? 'drop-zone--active' : ''}`}
      aria-label={label}
    />
  );
}
