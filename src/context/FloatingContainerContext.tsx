import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import {
  getMonitorIndexAtPoint,
  getWindowContainerElement,
} from '../utils/monitorSpace';
import { useMonitorWindows } from './MonitorWindowsContext';

interface FloatingContainerContextValue {
  getContainer: (monitorIndex?: number) => HTMLElement | null;
}

const FloatingContainerContext =
  createContext<FloatingContainerContextValue | null>(null);

export function FloatingContainerProvider({ children }: { children: ReactNode }) {
  const { getContainerElement } = useMonitorWindows();

  return (
    <FloatingContainerContext.Provider
      value={{
        getContainer: (monitorIndex = 0) => getContainerElement(monitorIndex),
      }}
    >
      {children}
    </FloatingContainerContext.Provider>
  );
}

export function useFloatingContainer(monitorIndex = 0) {
  const context = useContext(FloatingContainerContext);
  const container = context?.getContainer(monitorIndex) ?? null;
  return { current: container };
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

export function resolveFloatingPlacement(
  clientX: number,
  clientY: number,
  windowWidth: number,
  windowHeight: number,
  monitorCount: number,
): { x: number; y: number; monitorIndex: number } {
  const monitorIndex =
    monitorCount > 1 ? getMonitorIndexAtPoint(clientX, clientY) : 0;
  const container = getWindowContainerElement(monitorIndex, monitorCount);
  const { x, y } = getFloatingPosition(
    container,
    clientX,
    clientY,
    windowWidth,
    windowHeight,
  );
  return { x, y, monitorIndex };
}
