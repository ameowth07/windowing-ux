import {
  createContext,
  useContext,
  type RefObject,
  type ReactNode,
} from 'react';

const FloatingContainerContext =
  createContext<RefObject<HTMLElement | null> | null>(null);

export function FloatingContainerProvider({
  containerRef,
  children,
}: {
  containerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  return (
    <FloatingContainerContext.Provider value={containerRef}>
      {children}
    </FloatingContainerContext.Provider>
  );
}

export function useFloatingContainer() {
  return useContext(FloatingContainerContext);
}

export function getFloatingPosition(
  container: HTMLElement | null,
  clientX: number,
  clientY: number,
  windowWidth = 364,
  windowHeight = 522,
): { x: number; y: number } {
  if (!container) {
    return {
      x: clientX - windowWidth / 2,
      y: Math.max(8, clientY - 24),
    };
  }

  const rect = container.getBoundingClientRect();
  const x = clientX - rect.left - windowWidth / 2;
  const y = clientY - rect.top - 24;
  return clampFloatingPosition(container, x, y, windowWidth, windowHeight);
}

export function getUndockPosition(
  container: HTMLElement | null,
  windowWidth = 364,
  windowHeight = 522,
): { x: number; y: number } {
  const appWindow = container?.querySelector('.resizable-app-window');
  if (container && appWindow) {
    const containerRect = container.getBoundingClientRect();
    const appRect = appWindow.getBoundingClientRect();
    const x = appRect.left - containerRect.left + appRect.width / 2 - windowWidth / 2;
    const y = appRect.top - containerRect.top + 80;
    return clampFloatingPosition(container, x, y, windowWidth, windowHeight);
  }

  return {
    x: Math.max(0, (container?.clientWidth ?? 800) / 2 - windowWidth / 2),
    y: 120,
  };
}

export function clampFloatingPosition(
  container: HTMLElement,
  x: number,
  y: number,
  width: number,
  _height: number,
): { x: number; y: number } {
  const minVisible = 48;
  const maxX = Math.max(0, container.clientWidth - minVisible);
  const maxY = Math.max(0, container.clientHeight - minVisible);
  return {
    x: Math.min(Math.max(x, -width + minVisible), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
}
