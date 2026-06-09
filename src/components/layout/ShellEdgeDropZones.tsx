import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useEdgeDropZoneDelay } from '../../context/EdgeDropZoneDelayContext';
import { useShowDropzones } from '../../context/ShowDropzonesContext';
import { isDockingDrag } from '../dnd/dragTypes';
import type { DropTargetData, DropZone } from '../../types/layout';
import './ShellEdgeDropZones.css';

export const SHELL_EDGE_TARGET = '__workspace_root__';

const EDGE_ZONES: { zone: DropZone; label: string }[] = [
  { zone: 'top', label: 'Dock as new top row' },
  { zone: 'bottom', label: 'Dock as new bottom row' },
  { zone: 'left', label: 'Dock as new left column' },
  { zone: 'right', label: 'Dock as new right column' },
];

export function ShellEdgeDropZones() {
  const { active } = useDndContext();
  const { enabled: showDropzones } = useShowDropzones();
  const isDragging = isDockingDrag(active?.data.current);

  if (!isDragging && !showDropzones) return null;

  return (
    <div
      className={[
        'shell-edge-zones',
        showDropzones && !isDragging ? 'shell-edge-zones--debug' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!isDragging}
    >
      {EDGE_ZONES.map(({ zone, label }) => (
        <ShellEdgeZone
          key={zone}
          zone={zone}
          label={label}
          interactive={isDragging}
        />
      ))}
    </div>
  );
}

function ShellEdgeZone({
  zone,
  label,
  interactive,
}: {
  zone: DropZone;
  label: string;
  interactive: boolean;
}) {
  const { enabled, activatedZones } = useEdgeDropZoneDelay();
  const isActivated = !enabled || activatedZones.has(zone);

  const data: DropTargetData = {
    type: 'drop-target',
    nodeId: SHELL_EDGE_TARGET,
    zone,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `shell-edge-${zone}`,
    data,
    disabled: !interactive || !isActivated,
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        'shell-edge-zone',
        `shell-edge-zone--${zone}`,
        isOver && isActivated ? 'shell-edge-zone--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    />
  );
}
