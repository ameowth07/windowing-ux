import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEventHandler,
} from 'react';
import { clampFloatingPosition } from '../../context/FloatingContainerContext';

export const DEPENDENT_WINDOW_MIN_WIDTH = 288;
export const DEPENDENT_WINDOW_MIN_HEIGHT = 200;

export type DependentWindowResizeEdge =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw';

export const DEPENDENT_WINDOW_RESIZE_EDGES: DependentWindowResizeEdge[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
];

interface DependentWindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseDependentWindowDragOptions {
  open: boolean;
  container: HTMLElement | null;
  width: number;
  height: number;
  initialPosition: { x: number; y: number } | null;
  enabled?: boolean;
}

function applyResizeDelta(
  edge: DependentWindowResizeEdge,
  dx: number,
  dy: number,
  orig: DependentWindowBounds,
): DependentWindowBounds {
  let { x, y, width, height } = orig;

  if (edge.includes('e')) width = orig.width + dx;
  if (edge.includes('w')) {
    width = orig.width - dx;
    x = orig.x + dx;
  }
  if (edge.includes('s')) height = orig.height + dy;
  if (edge.includes('n')) {
    height = orig.height - dy;
    y = orig.y + dy;
  }

  return { x, y, width, height };
}

function clampDependentWindowBounds(
  container: HTMLElement | null,
  edge: DependentWindowResizeEdge,
  bounds: DependentWindowBounds,
  orig: DependentWindowBounds,
): DependentWindowBounds {
  let { x, y, width, height } = bounds;

  if (width < DEPENDENT_WINDOW_MIN_WIDTH) {
    if (edge.includes('w')) {
      x = orig.x + orig.width - DEPENDENT_WINDOW_MIN_WIDTH;
    }
    width = DEPENDENT_WINDOW_MIN_WIDTH;
  }

  if (height < DEPENDENT_WINDOW_MIN_HEIGHT) {
    if (edge.includes('n')) {
      y = orig.y + orig.height - DEPENDENT_WINDOW_MIN_HEIGHT;
    }
    height = DEPENDENT_WINDOW_MIN_HEIGHT;
  }

  if (container) {
    width = Math.min(width, container.clientWidth);
    height = Math.min(height, container.clientHeight);
    ({ x, y } = clampFloatingPosition(container, x, y, width, height));
  }

  return { x, y, width, height };
}

export function useDependentWindowDrag({
  open,
  container,
  width,
  height,
  initialPosition,
  enabled = true,
}: UseDependentWindowDragOptions) {
  const [bounds, setBounds] = useState<DependentWindowBounds | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    edge: DependentWindowResizeEdge;
    startX: number;
    startY: number;
    orig: DependentWindowBounds;
  } | null>(null);

  useEffect(() => {
    if (open && initialPosition) {
      setBounds({
        x: initialPosition.x,
        y: initialPosition.y,
        width,
        height,
      });
    } else if (!open) {
      setBounds(null);
      setIsResizing(false);
      resizeRef.current = null;
    }
  }, [open, initialPosition?.x, initialPosition?.y, width, height]);

  const onTitleBarPointerDown: PointerEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (!enabled || event.button !== 0 || !container || !bounds || isResizing) return;

      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = bounds.x;
      const originY = bounds.y;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const next = clampFloatingPosition(
          container,
          originX + (moveEvent.clientX - startX),
          originY + (moveEvent.clientY - startY),
          bounds.width,
          bounds.height,
        );
        setBounds((current) =>
          current ? { ...current, x: next.x, y: next.y } : current,
        );
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [bounds, container, enabled, isResizing],
  );

  const startResize = useCallback(
    (edge: DependentWindowResizeEdge, event: React.PointerEvent) => {
      if (!enabled || !container || !bounds) return;

      event.preventDefault();
      event.stopPropagation();
      resizeRef.current = {
        edge,
        startX: event.clientX,
        startY: event.clientY,
        orig: bounds,
      };
      setIsResizing(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [bounds, container, enabled],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!resizeRef.current || !container) return;

      const { edge, startX, startY, orig } = resizeRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const next = applyResizeDelta(edge, dx, dy, orig);
      const clamped = clampDependentWindowBounds(container, edge, next, orig);
      setBounds(clamped);
    };

    const handlePointerUp = () => {
      if (resizeRef.current) {
        resizeRef.current = null;
        setIsResizing(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [container]);

  return { bounds, onTitleBarPointerDown, startResize, isResizing };
}

export function getCenteredDependentWindowPosition(
  container: HTMLElement | null,
  anchorWindow: HTMLElement | null,
  width: number,
  height: number,
): { x: number; y: number } {
  if (!container) {
    return { x: 120, y: 120 };
  }

  if (anchorWindow) {
    const containerRect = container.getBoundingClientRect();
    const windowRect = anchorWindow.getBoundingClientRect();
    const x = windowRect.left - containerRect.left + (windowRect.width - width) / 2;
    const y = windowRect.top - containerRect.top + (windowRect.height - height) / 2;
    return clampFloatingPosition(container, x, y, width, height);
  }

  const x = Math.max(0, (container.clientWidth - width) / 2);
  const y = Math.max(0, (container.clientHeight - height) / 2);
  return clampFloatingPosition(container, x, y, width, height);
}
