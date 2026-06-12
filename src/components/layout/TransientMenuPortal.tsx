import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  computeContextMenuPosition,
  computeDropdownMenuPosition,
  computeSubmenuPosition,
  constrainStudioMenuToViewport,
  resetStudioMenuViewportConstraint,
} from './constrainStudioMenuToViewport';

interface TransientMenuPortalProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  align?: 'start' | 'end';
  offsetY?: number;
  pointerPosition?: { x: number; y: number } | null;
  children: ReactNode;
  onClose?: () => void;
  portalRef?: React.RefObject<HTMLDivElement | null>;
  ignoreRefs?: React.RefObject<HTMLElement | null>[];
}

export function TransientMenuPortal({
  open,
  anchorRef,
  align = 'end',
  offsetY = 4,
  pointerPosition = null,
  children,
  onClose,
  portalRef,
  ignoreRefs = [],
}: TransientMenuPortalProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const menuRef = portalRef ?? localRef;
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = () => {
    const menu = menuRef.current;
    if (!menu) return;

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    let next: { top: number; left: number };

    if (pointerPosition) {
      next = computeContextMenuPosition(
        pointerPosition.x,
        pointerPosition.y,
        menuWidth,
        menuHeight,
      );
    } else {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      next = computeDropdownMenuPosition(
        anchorRect,
        menuWidth,
        align,
        offsetY,
      );
    }

    setPosition((current) =>
      current?.top === next.top && current?.left === next.left ? current : next,
    );
    constrainStudioMenuToViewport(menu);
  };

  useLayoutEffect(() => {
    if (!open) {
      resetStudioMenuViewportConstraint(menuRef.current);
      setPosition(null);
      return;
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, anchorRef, align, offsetY, menuRef, pointerPosition]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => {
      updatePosition();
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, anchorRef, align, offsetY, menuRef, pointerPosition]);

  useEffect(() => {
    if (!open || !onClose) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!pointerPosition && anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      if (ignoreRefs.some((ref) => ref.current?.contains(target))) return;
      onClose();
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => window.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open, onClose, anchorRef, menuRef, ignoreRefs, pointerPosition]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="transient-menu-portal"
      style={
        position
          ? { top: position.top, left: position.left }
          : { visibility: 'hidden' }
      }
    >
      {children}
    </div>,
    document.body,
  );
}

interface TransientSubmenuPortalProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  placement?: 'side' | 'below';
  offsetX?: number;
  offsetY?: number;
  repositionKey?: string | number | null;
  children: ReactNode;
  portalRef?: React.RefObject<HTMLDivElement | null>;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function TransientSubmenuPortal({
  open,
  anchorRef,
  placement = 'side',
  offsetX = 4,
  offsetY = 4,
  repositionKey,
  children,
  portalRef,
  onPointerEnter,
  onPointerLeave,
}: TransientSubmenuPortalProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const menuRef = portalRef ?? localRef;
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = () => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const menuWidth = menu?.offsetWidth ?? 0;
    const next =
      placement === 'below'
        ? computeDropdownMenuPosition(anchorRect, menuWidth, 'start', offsetY)
        : computeSubmenuPosition(anchorRect, menuWidth, offsetX, anchor);
    setPosition((current) =>
      current?.top === next.top && current?.left === next.left ? current : next,
    );
    constrainStudioMenuToViewport(menu);
  };

  useLayoutEffect(() => {
    if (!open) {
      resetStudioMenuViewportConstraint(menuRef.current);
      setPosition(null);
      return;
    }

    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, anchorRef, placement, offsetX, offsetY, menuRef, repositionKey]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => {
      updatePosition();
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, anchorRef, placement, offsetX, offsetY, menuRef, repositionKey]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="transient-menu-portal transient-submenu-portal"
      style={
        position
          ? { top: position.top, left: position.left }
          : { visibility: 'hidden' }
      }
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>,
    document.body,
  );
}
