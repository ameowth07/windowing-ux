const VIEWPORT_EDGE_PADDING = 8;

function clampHorizontalPosition(left: number, menuWidth: number): number {
  const minLeft = VIEWPORT_EDGE_PADDING;
  const maxLeft = Math.max(
    minLeft,
    window.innerWidth - VIEWPORT_EDGE_PADDING - menuWidth,
  );
  return Math.min(Math.max(left, minLeft), maxLeft);
}

export function computeContextMenuPosition(
  clientX: number,
  clientY: number,
  menuWidth: number,
  menuHeight: number,
): { top: number; left: number } {
  let left = clientX;
  if (left + menuWidth > window.innerWidth - VIEWPORT_EDGE_PADDING) {
    left = clientX - menuWidth;
  }
  left = clampHorizontalPosition(left, menuWidth);

  let top = clientY;
  if (top + menuHeight > window.innerHeight - VIEWPORT_EDGE_PADDING) {
    top = clientY - menuHeight;
  }
  top = Math.min(
    Math.max(top, VIEWPORT_EDGE_PADDING),
    Math.max(
      VIEWPORT_EDGE_PADDING,
      window.innerHeight - VIEWPORT_EDGE_PADDING - menuHeight,
    ),
  );

  return { top, left };
}

export function computeDropdownMenuPosition(
  anchorRect: DOMRect,
  menuWidth: number,
  align: 'start' | 'end',
  offsetY: number,
): { top: number; left: number } {
  let left =
    align === 'end'
      ? anchorRect.right - menuWidth
      : anchorRect.left;

  if (left + menuWidth > window.innerWidth - VIEWPORT_EDGE_PADDING) {
    left = anchorRect.left;
  }

  if (left + menuWidth > window.innerWidth - VIEWPORT_EDGE_PADDING) {
    left = anchorRect.right - menuWidth;
  }

  return {
    top: anchorRect.bottom + offsetY,
    left: clampHorizontalPosition(left, menuWidth),
  };
}

export function computeSubmenuPosition(
  anchorRect: DOMRect,
  menuWidth: number,
  offsetX: number,
  anchorElement: HTMLElement | null,
): { top: number; left: number } {
  let left = anchorRect.right + offsetX;

  if (left + menuWidth > window.innerWidth - VIEWPORT_EDGE_PADDING) {
    const parentMenu = anchorElement?.closest('.studio-menu');
    const parentRect = parentMenu?.getBoundingClientRect();
    if (parentRect) {
      left = parentRect.left - menuWidth - offsetX;
    } else {
      left = anchorRect.left - menuWidth - offsetX;
    }
  }

  return {
    top: anchorRect.top,
    left: clampHorizontalPosition(left, menuWidth),
  };
}

export function constrainStudioMenuToViewport(portalEl: HTMLElement | null) {
  if (!portalEl) return;

  const menu = portalEl.querySelector('.studio-menu');
  if (!(menu instanceof HTMLElement)) return;

  menu.style.maxHeight = '';
  menu.classList.remove('studio-menu--scrollable');

  const portalTop = portalEl.getBoundingClientRect().top;
  const availableHeight = window.innerHeight - portalTop - VIEWPORT_EDGE_PADDING;
  const naturalHeight = menu.scrollHeight;

  if (naturalHeight > availableHeight && availableHeight > 0) {
    menu.style.maxHeight = `${availableHeight}px`;
    menu.classList.add('studio-menu--scrollable');
  }
}

export function resetStudioMenuViewportConstraint(portalEl: HTMLElement | null) {
  if (!portalEl) return;

  const menu = portalEl.querySelector('.studio-menu');
  if (!(menu instanceof HTMLElement)) return;

  menu.style.maxHeight = '';
  menu.classList.remove('studio-menu--scrollable');
}
