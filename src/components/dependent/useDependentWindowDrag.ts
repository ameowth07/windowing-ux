import { useCallback, useEffect, useState, type PointerEventHandler } from 'react';
import { clampFloatingPosition } from '../../context/FloatingContainerContext';

interface UseDependentWindowDragOptions {
  open: boolean;
  container: HTMLElement | null;
  width: number;
  height: number;
  initialPosition: { x: number; y: number } | null;
  enabled?: boolean;
}

export function useDependentWindowDrag({
  open,
  container,
  width,
  height,
  initialPosition,
  enabled = true,
}: UseDependentWindowDragOptions) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (open && initialPosition) {
      setPosition(initialPosition);
    } else if (!open) {
      setPosition(null);
    }
  }, [open, initialPosition?.x, initialPosition?.y]);

  const onTitleBarPointerDown: PointerEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (!enabled || event.button !== 0 || !container || !position) return;

      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = position.x;
      const originY = position.y;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const next = clampFloatingPosition(
          container,
          originX + (moveEvent.clientX - startX),
          originY + (moveEvent.clientY - startY),
          width,
          height,
        );
        setPosition(next);
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [container, enabled, height, position, width],
  );

  return { position, onTitleBarPointerDown };
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
