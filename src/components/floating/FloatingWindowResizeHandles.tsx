import {
  FLOATING_RESIZE_EDGES,
  type FloatingResizeEdge,
} from './useFloatingWindowResize';
import './FloatingWindowResizeHandles.css';

interface FloatingWindowResizeHandlesProps {
  onResizeStart: (edge: FloatingResizeEdge, event: React.PointerEvent) => void;
}

export function FloatingWindowResizeHandles({
  onResizeStart,
}: FloatingWindowResizeHandlesProps) {
  return (
    <>
      {FLOATING_RESIZE_EDGES.map((edge) => (
        <div
          key={edge}
          className={`floating-window__resize floating-window__resize--${edge}`}
          onPointerDown={(event) => onResizeStart(edge, event)}
        />
      ))}
    </>
  );
}
