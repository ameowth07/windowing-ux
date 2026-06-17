import { useDndContext, useDroppable } from '@dnd-kit/core';
import { PANEL_DROP_ZONES } from '../../config/dropZones';
import { useShowDropzones } from '../../context/ShowDropzonesContext';
import { useSplitDockBlocked } from '../../hooks/usePanelGroupingBlocked';
import { isPanelDrag, isTabGroupDrag } from '../dnd/dragTypes';
import type { DropTargetData, DropZone, PanelHoverData, PanelId, TabInsertTargetData } from '../../types/layout';
import './DropZones.css';

interface DropZonesProps {
  nodeId: string;
  panelIds?: PanelId[];
  /** When true, zones only show while the drag is over this panel body. */
  scoped?: boolean;
  dropBlocked?: boolean;
}

function isDragOverPanelBody(
  over: ReturnType<typeof useDndContext>['over'],
  nodeId: string,
): boolean {
  const data = over?.data.current as
    | DropTargetData
    | PanelHoverData
    | TabInsertTargetData
    | undefined;

  if (!data) return false;
  if (data.type === 'tab-insert') return false;
  if (data.type === 'panel-body-hover' && data.nodeId === nodeId) return true;
  if (data.type === 'drop-target' && data.nodeId === nodeId) {
    return true;
  }
  return false;
}

export function DropZones({
  nodeId,
  panelIds = [],
  scoped,
  dropBlocked: dropBlockedProp,
}: DropZonesProps) {
  const { active, over } = useDndContext();
  const { enabled: showDropzones } = useShowDropzones();
  const splitDockBlocked = useSplitDockBlocked(panelIds);
  const isDropBlocked = dropBlockedProp ?? splitDockBlocked;
  const isDraggingPanel = isPanelDrag(active?.data.current);
  const isDraggingTabGroup = isTabGroupDrag(active?.data.current);
  const isDragging = isDraggingPanel || isDraggingTabGroup;

  if (isDropBlocked) {
    return null;
  }

  if (!isDragging && !showDropzones) {
    return null;
  }
  if (scoped && !showDropzones && !isDragOverPanelBody(over, nodeId)) {
    return null;
  }

  return (
    <div className="drop-zones">
      {PANEL_DROP_ZONES.map(({ zone, label }) => (
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
