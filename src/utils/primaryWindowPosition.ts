import type { MonitorCount } from '../config/monitorLayout';
import {
  DEFAULT_WINDOW_SIZE_PRESET,
  WINDOW_SIZE_PRESETS,
} from '../config/windowSizes';
import {
  getMonitorIndexAtPoint,
  getWindowContainerAtPoint,
  getWindowContainerElement,
  getWindowContainerSize,
} from './monitorSpace';

const MIN_WIDTH = 800;
const MIN_HEIGHT = 500;

/** Minimum visible strip when a primary window is dragged off-screen. */
export const PRIMARY_WINDOW_MIN_VISIBLE = 48;

export function clampPrimaryWindowPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  container: { width: number; height: number },
): { x: number; y: number } {
  const minVisible = PRIMARY_WINDOW_MIN_VISIBLE;
  const minX = -width + minVisible;
  const maxX = container.width - minVisible;
  const minY = -height + minVisible;
  const maxY = container.height - minVisible;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

export function clampPrimaryWindowBounds(
  bounds: PrimaryWindowDropBounds,
  monitorCount: number,
): PrimaryWindowDropBounds {
  const monitorIndex = Math.min(
    Math.max(bounds.monitorIndex ?? 0, 0),
    monitorCount - 1,
  );
  const container = getWindowContainerSize(monitorIndex, monitorCount);
  const width = Math.min(Math.max(bounds.width, MIN_WIDTH), container.width);
  const height = Math.min(Math.max(bounds.height, MIN_HEIGHT), container.height);
  const { x, y } = clampPrimaryWindowPosition(
    bounds.x,
    bounds.y,
    width,
    height,
    container,
  );

  return { monitorIndex, x, y, width, height };
}

/** Center of the first scope tab in a single-tab project window. */
export const PRIMARY_WINDOW_SCOPE_TAB_ANCHOR = {
  x: 119,
  y: 20,
};

export interface PrimaryWindowDropBounds {
  monitorIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PRIMARY_WINDOW_CASCADE_OFFSET = 48;

export function getCascadedPrimaryWindowBounds(
  reference: PrimaryWindowDropBounds,
  container: { width: number; height: number },
  offset = PRIMARY_WINDOW_CASCADE_OFFSET,
): Omit<PrimaryWindowDropBounds, 'monitorIndex'> {
  let x = reference.x + offset;
  let y = reference.y + offset;

  if (x + reference.width > container.width) {
    x = Math.max(0, reference.x - offset);
  }
  if (y + reference.height > container.height) {
    y = Math.max(0, reference.y - offset);
  }

  const width = reference.width;
  const height = reference.height;
  const position = clampPrimaryWindowPosition(x, y, width, height, container);
  return { ...position, width, height };
}

export function getPrimaryWindowDropBounds(
  clientX: number,
  clientY: number,
  monitorCount: MonitorCount,
): PrimaryWindowDropBounds {
  const monitorIndex = getMonitorIndexAtPoint(clientX, clientY);
  const container = getWindowContainerAtPoint(clientX, clientY, monitorCount);
  const containerSize = getWindowContainerSize(monitorIndex, monitorCount);
  const preset = WINDOW_SIZE_PRESETS[DEFAULT_WINDOW_SIZE_PRESET];
  const containerRect = container?.getBoundingClientRect();
  const anchor = PRIMARY_WINDOW_SCOPE_TAB_ANCHOR;

  const width = Math.min(
    Math.max(preset.width, MIN_WIDTH),
    containerSize.width,
  );
  const height = Math.min(
    Math.max(preset.height, MIN_HEIGHT),
    containerSize.height,
  );

  const { x, y } = clampPrimaryWindowPosition(
    clientX - (containerRect?.left ?? 0) - anchor.x,
    clientY - (containerRect?.top ?? 0) - anchor.y,
    width,
    height,
    containerSize,
  );

  return { monitorIndex, x, y, width, height };
}

export function getPrimaryWindowGhostScreenBounds(
  clientX: number,
  clientY: number,
  monitorCount: MonitorCount,
) {
  const bounds = getPrimaryWindowDropBounds(clientX, clientY, monitorCount);
  const container = getWindowContainerElement(bounds.monitorIndex, monitorCount);
  const rect = container?.getBoundingClientRect() ?? { left: 0, top: 0 };

  return {
    ...bounds,
    screenX: rect.left + bounds.x,
    screenY: rect.top + bounds.y,
  };
}
