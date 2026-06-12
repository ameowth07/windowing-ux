import { getWindowContainerElement } from './monitorSpace';

export interface ContainerBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getDesktopPortalRoot(
  monitorIndex: number,
  monitorCount: number,
  getContainerElement: (index: number) => HTMLElement | null,
): HTMLElement {
  return (
    getContainerElement(monitorIndex) ??
    getWindowContainerElement(monitorIndex, monitorCount) ??
    document.body
  );
}

export function getPrimaryWindowElement(windowId: string | null): HTMLElement | null {
  if (!windowId) return null;
  return document.querySelector<HTMLElement>(
    `.resizable-app-window[data-primary-window-id="${windowId}"]`,
  );
}

export function getElementBoundsInContainer(
  element: HTMLElement,
  container: HTMLElement,
): ContainerBounds {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  return {
    left: elementRect.left - containerRect.left,
    top: elementRect.top - containerRect.top,
    width: elementRect.width,
    height: elementRect.height,
  };
}

export function getPrimaryWindowBoundsInContainer(
  windowId: string | null,
  container: HTMLElement,
): ContainerBounds {
  const windowElement = getPrimaryWindowElement(windowId);
  if (!windowElement) {
    return {
      left: 0,
      top: 0,
      width: container.clientWidth,
      height: container.clientHeight,
    };
  }

  return getElementBoundsInContainer(windowElement, container);
}
