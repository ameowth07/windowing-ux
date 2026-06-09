import { useDndContext, useDroppable } from '@dnd-kit/core';
import { getZonesForVariant } from '../../config/dropZones';
import { useDropZoneVariant } from '../../context/DropZoneVariantContext';
import type { DropTargetData, DropZone } from '../../types/layout';
import './EmptyWorkspaceDrop.css';

export function EmptyWorkspaceDrop() {
  const { active } = useDndContext();
  const { variant } = useDropZoneVariant();
  const isDraggingPanel = active?.data.current?.type === 'panel';

  if (!isDraggingPanel) return null;

  if (variant === 'four') {
    return (
      <div className="empty-workspace-drop empty-workspace-drop--zones drop-zones drop-zones--four">
        {getZonesForVariant('four').map(({ zone, label }) => (
          <EmptyWorkspaceZone key={zone} zone={zone} label={label} />
        ))}
      </div>
    );
  }

  return <EmptyWorkspaceCenterDrop />;
}

function EmptyWorkspaceCenterDrop() {
  const data: DropTargetData = {
    type: 'drop-target',
    nodeId: '__workspace_root__',
    zone: 'center',
  };

  const { isOver, setNodeRef } = useDroppable({
    id: 'drop-workspace-root',
    data,
  });

  return (
    <div
      ref={setNodeRef}
      className={`empty-workspace-drop ${isOver ? 'empty-workspace-drop--active' : ''}`}
    >
      Drop here to dock
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
