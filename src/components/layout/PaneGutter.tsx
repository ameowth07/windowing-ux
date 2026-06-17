import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useEdgeDropZoneDelay } from '../../context/EdgeDropZoneDelayContext';
import { useShowDropzones } from '../../context/ShowDropzonesContext';
import { isDockingDrag } from '../dnd/dragTypes';
import type { DropTargetData, DropZone } from '../../types/layout';
import { SHELL_EDGE_TARGET } from './ShellEdgeDropZones';
import './PaneGutter.css';

export const PANE_GUTTER_SIZE = 4;

export type ShellGutterEdgeZone = 'top' | 'bottom';

interface GutterDropTargetConfig {
  splitId: string;
  secondNodeId: string;
  orientation: 'horizontal' | 'vertical';
}

interface PaneGutterProps {
  /** Vertical gutter sits between columns; horizontal gutter sits between rows. */
  orientation: 'horizontal' | 'vertical';
  onResizeStart?: (event: React.MouseEvent) => void;
  active?: boolean;
  className?: string;
  ariaValueNow?: number;
  ariaValueMin?: number;
  ariaValueMax?: number;
  gutterDrop?: GutterDropTargetConfig;
  shellEdgeDrop?: ShellGutterEdgeZone;
}

export function PaneGutter({
  orientation,
  onResizeStart,
  active = false,
  className,
  ariaValueNow,
  ariaValueMin,
  ariaValueMax,
  gutterDrop,
  shellEdgeDrop,
}: PaneGutterProps) {
  const isResizable = Boolean(onResizeStart);

  return (
    <div
      className={[
        'pane-gutter',
        `pane-gutter--${orientation}`,
        active ? 'pane-gutter--active' : '',
        isResizable ? 'pane-gutter--resizable' : '',
        gutterDrop || shellEdgeDrop ? 'pane-gutter--dockable' : '',
        shellEdgeDrop ? 'pane-gutter--shell-edge' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={isResizable ? 'separator' : undefined}
      aria-orientation={
        isResizable
          ? orientation === 'horizontal'
            ? 'horizontal'
            : 'vertical'
          : undefined
      }
      aria-valuenow={isResizable ? ariaValueNow : undefined}
      aria-valuemin={isResizable ? ariaValueMin : undefined}
      aria-valuemax={isResizable ? ariaValueMax : undefined}
      onMouseDown={onResizeStart}
    >
      {shellEdgeDrop ? (
        <ShellGutterDropTarget zone={shellEdgeDrop} />
      ) : null}
      {gutterDrop ? <SplitGutterDropTarget {...gutterDrop} /> : null}
      <div className="pane-gutter__line" />
      <div className="pane-gutter__line" />
    </div>
  );
}

function SplitGutterDropTarget({
  splitId,
  secondNodeId,
  orientation,
}: GutterDropTargetConfig) {
  const { active } = useDndContext();
  const { enabled: showDropzones } = useShowDropzones();
  const isDragging = isDockingDrag(active?.data.current);
  const zone: DropZone = orientation === 'vertical' ? 'left' : 'top';

  const data: DropTargetData = {
    type: 'drop-target',
    nodeId: secondNodeId,
    zone,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `gutter-drop-${splitId}`,
    data,
    disabled: !isDragging,
  });

  const isVisible = isDragging || showDropzones;

  return (
    <div
      ref={setNodeRef}
      className={[
        'pane-gutter__drop-target',
        isOver ? 'pane-gutter__drop-target--active' : '',
        !isDragging && showDropzones ? 'pane-gutter__drop-target--debug' : '',
        isVisible ? '' : 'pane-gutter__drop-target--hidden',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!isVisible}
      aria-label="Dock at gutter"
    />
  );
}

function ShellGutterDropTarget({ zone }: { zone: ShellGutterEdgeZone }) {
  const { active } = useDndContext();
  const { enabled: showDropzones } = useShowDropzones();
  const { enabled: edgeDelayEnabled, activatedZones } = useEdgeDropZoneDelay();
  const isDragging = isDockingDrag(active?.data.current);
  const isActivated = !edgeDelayEnabled || activatedZones.has(zone);

  const data: DropTargetData = {
    type: 'drop-target',
    nodeId: SHELL_EDGE_TARGET,
    zone,
  };

  const { isOver, setNodeRef } = useDroppable({
    id: `shell-gutter-${zone}`,
    data,
    disabled: !isDragging || !isActivated,
  });

  const isVisible = isDragging || showDropzones;

  return (
    <div
      ref={setNodeRef}
      className={[
        'pane-gutter__drop-target',
        'pane-gutter__drop-target--shell-edge',
        isOver && isActivated ? 'pane-gutter__drop-target--active' : '',
        !isDragging && showDropzones ? 'pane-gutter__drop-target--debug' : '',
        isVisible ? '' : 'pane-gutter__drop-target--hidden',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!isVisible}
      aria-label={zone === 'top' ? 'Dock as new top row' : 'Dock as new bottom row'}
    />
  );
}
