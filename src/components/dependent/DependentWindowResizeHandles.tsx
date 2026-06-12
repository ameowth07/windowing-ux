import {
  DEPENDENT_WINDOW_RESIZE_EDGES,
  type DependentWindowResizeEdge,
} from './useDependentWindowDrag';
import './DependentWindowResizeHandles.css';

interface DependentWindowResizeHandlesProps {
  onResizeStart?: (edge: DependentWindowResizeEdge, event: React.PointerEvent) => void;
}

export function DependentWindowResizeHandles({
  onResizeStart,
}: DependentWindowResizeHandlesProps) {
  if (!onResizeStart) return null;

  return (
    <>
      {DEPENDENT_WINDOW_RESIZE_EDGES.map((edge) => (
        <div
          key={edge}
          className={`dependent-window__resize dependent-window__resize--${edge}`}
          onPointerDown={(event) => onResizeStart(edge, event)}
        />
      ))}
    </>
  );
}
