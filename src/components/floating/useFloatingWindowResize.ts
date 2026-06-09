import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MIN_FLOAT_HEIGHT,
  MIN_FLOAT_WIDTH,
} from '../../config/floatingWindow';
import {
  clampFloatingPosition,
  useFloatingContainer,
} from '../../context/FloatingContainerContext';
import { useLayout } from '../../context/LayoutContext';
import { usePrimaryWindowId } from '../../context/PrimaryWindowContext';
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';

export type FloatingResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface FloatingBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function applyResizeDelta(
  edge: FloatingResizeEdge,
  dx: number,
  dy: number,
  orig: FloatingBounds,
): FloatingBounds {
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

function clampResizeBounds(
  container: HTMLElement | null,
  edge: FloatingResizeEdge,
  bounds: FloatingBounds,
  orig: FloatingBounds,
): FloatingBounds {
  let { x, y, width, height } = bounds;

  if (width < MIN_FLOAT_WIDTH) {
    if (edge.includes('w')) {
      x = orig.x + orig.width - MIN_FLOAT_WIDTH;
    }
    width = MIN_FLOAT_WIDTH;
  }

  if (height < MIN_FLOAT_HEIGHT) {
    if (edge.includes('n')) {
      y = orig.y + orig.height - MIN_FLOAT_HEIGHT;
    }
    height = MIN_FLOAT_HEIGHT;
  }

  if (container) {
    width = Math.min(width, container.clientWidth);
    height = Math.min(height, container.clientHeight);
    ({ x, y } = clampFloatingPosition(container, x, y, width, height));
  }

  return { x, y, width, height };
}

export function useFloatingWindowResize(
  floatingWindowId: string,
  bounds: FloatingBounds,
) {
  const windowId = usePrimaryWindowId();
  const { getWindow } = usePrimaryWindows();
  const primaryMonitorIndex = getWindow(windowId)?.monitorIndex ?? 0;
  const { state, resizeFloating } = useLayout();
  const floatingWindow = state.floating.find(
    (window) => window.id === floatingWindowId,
  );
  const floatMonitorIndex =
    floatingWindow?.monitorIndex ?? primaryMonitorIndex;
  const floatingContainerRef = useFloatingContainer(floatMonitorIndex);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    edge: FloatingResizeEdge;
    startX: number;
    startY: number;
    orig: FloatingBounds;
  } | null>(null);

  const startResize = useCallback(
    (edge: FloatingResizeEdge, event: React.PointerEvent) => {
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
    [bounds],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!resizeRef.current) return;

      const { edge, startX, startY, orig } = resizeRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const next = applyResizeDelta(edge, dx, dy, orig);
      const clamped = clampResizeBounds(
        floatingContainerRef?.current ?? null,
        edge,
        next,
        orig,
      );
      resizeFloating(
        floatingWindowId,
        clamped.x,
        clamped.y,
        clamped.width,
        clamped.height,
      );
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
  }, [floatingContainerRef, floatingWindowId, resizeFloating]);

  return { startResize, isResizing };
}

export const FLOATING_RESIZE_EDGES: FloatingResizeEdge[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
];
