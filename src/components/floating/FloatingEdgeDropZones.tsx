import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useEdgeDropZoneDelay } from '../../context/EdgeDropZoneDelayContext';
import { useShowDropzones } from '../../context/ShowDropzonesContext';
import { useSplitDockBlocked } from '../../hooks/usePanelGroupingBlocked';
import { isDockingDrag } from '../dnd/dragTypes';
import type { DropTargetData, DropZone, PanelId } from '../../types/layout';
import './FloatingEdgeDropZones.css';

const EDGE_ZONES: { zone: DropZone; label: string }[] = [
  { zone: 'top', label: 'Dock as new top row' },
  { zone: 'bottom', label: 'Dock as new bottom row' },
  { zone: 'left', label: 'Dock as new left column' },
  { zone: 'right', label: 'Dock as new right column' },
];

interface FloatingEdgeDropZonesProps {
  floatingWindowId: string;
  layoutRootNodeId: string;
  panelIds: PanelId[];
}

export function FloatingEdgeDropZones({
  floatingWindowId,
  layoutRootNodeId,
  panelIds,
}: FloatingEdgeDropZonesProps) {
  const { active } = useDndContext();
  const { enabled: showDropzones } = useShowDropzones();
  const isDropBlocked = useSplitDockBlocked(panelIds);
  const isDragging = isDockingDrag(active?.data.current);

  if (isDropBlocked || (!isDragging && !showDropzones)) {
    return null;
  }

  return (
    <div
      className={[
        'floating-edge-zones',
        showDropzones && !isDragging ? 'floating-edge-zones--debug' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!isDragging}
    >
      {EDGE_ZONES.map(({ zone, label }) => (
        <FloatingEdgeZone
          key={zone}
          floatingWindowId={floatingWindowId}
          layoutRootNodeId={layoutRootNodeId}
          zone={zone}
          label={label}
          interactive={isDragging}
        />
      ))}
    </div>
  );
}

function FloatingEdgeZone({
  floatingWindowId,
  layoutRootNodeId,
  zone,
  label,
  interactive,
}: {
  floatingWindowId: string;
  layoutRootNodeId: string;
  zone: DropZone;
  label: string;
  interactive: boolean;
}) {
  const { enabled, activatedZones } = useEdgeDropZoneDelay();
  const isActivated = !enabled || activatedZones.has(zone);

  const data: DropTargetData = {
    type: 'drop-target',
    nodeId: layoutRootNodeId,
    zone,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `float-edge-${floatingWindowId}-${zone}`,
    data,
    disabled: !interactive || !isActivated,
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        'floating-edge-zone',
        `floating-edge-zone--${zone}`,
        isOver && isActivated ? 'floating-edge-zone--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    />
  );
}
