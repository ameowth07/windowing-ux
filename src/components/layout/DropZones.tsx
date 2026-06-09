import { useDndContext, useDroppable } from '@dnd-kit/core';
import { getZonesForVariant } from '../../config/dropZones';
import { useDropZoneVariant } from '../../context/DropZoneVariantContext';
import { useShowDropzones } from '../../context/ShowDropzonesContext';
import { usePanelGroupingBlocked } from '../../hooks/usePanelGroupingBlocked';
import { isPanelDrag, isTabGroupDrag } from '../dnd/dragTypes';
import type { DropTargetData, DropZone, PanelHoverData, PanelId, TabInsertTargetData } from '../../types/layout';
import './DropZones.css';

interface DropZonesProps {
  nodeId: string;
  panelIds?: PanelId[];
  /** When true, zones only show while the drag is over this panel body. */
  scoped?: boolean;
}

function isDragOverPanelBody(
  over: ReturnType<typeof useDndContext>['over'],
  nodeId: string,
  includeCenterZone: boolean,
): boolean {
  const data = over?.data.current as
    | DropTargetData
    | PanelHoverData
    | TabInsertTargetData
    | undefined;

  if (!data) return false;
  if (data.type === 'tab-insert') return false;
  if (data.type === 'panel-body-hover' && data.nodeId === nodeId) return true;
  if (
    data.type === 'drop-target' &&
    data.nodeId === nodeId &&
    (data.zone !== 'center' || includeCenterZone)
  ) {
    return true;
  }
  return false;
}

export function DropZones({ nodeId, panelIds = [], scoped }: DropZonesProps) {
  const { active, over } = useDndContext();
  const { variant } = useDropZoneVariant();
  const { enabled: showDropzones } = useShowDropzones();
  const isDropBlocked = usePanelGroupingBlocked(panelIds);
  const isDraggingPanel = isPanelDrag(active?.data.current);
  const isDraggingTabGroup = isTabGroupDrag(active?.data.current);
  const isDragging = isDraggingPanel || isDraggingTabGroup;

  if (isDropBlocked) {
    return null;
  }

  if (!isDragging && !showDropzones) {
    return null;
  }
  if (
    scoped &&
    !showDropzones &&
    !isDragOverPanelBody(over, nodeId, isDraggingTabGroup)
  ) {
    return null;
  }

  const zones = getZonesForVariant(variant).filter(
    ({ zone }) => !scoped || zone !== 'center' || isDraggingTabGroup || showDropzones,
  );

  if (zones.length === 0) return null;

  return (
    <div className={`drop-zones drop-zones--${variant}`}>
      {zones.map(({ zone, label }) => (
        <DropZone
          key={zone}
          nodeId={nodeId}
          zone={zone}
          label={label}
          interactive={isDragging}
        />
      ))}
    </div>
  );
}

function DropZone({
  nodeId,
  zone,
  label,
  interactive,
}: {
  nodeId: string;
  zone: DropZone;
  label: string;
  interactive: boolean;
}) {
  const data: DropTargetData = { type: 'drop-target', nodeId, zone };
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-${nodeId}-${zone}`,
    data,
    disabled: !interactive,
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        'drop-zone',
        `drop-zone--${zone}`,
        isOver ? 'drop-zone--active' : '',
        !interactive ? 'drop-zone--debug' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
    />
  );
}
