import {
  DEFAULT_WINDOW_SIZE_PRESET,
  WINDOW_SIZE_PRESETS,
} from '../config/windowSizes';

const MIN_WIDTH = 800;
const MIN_HEIGHT = 500;

/** Center of the first scope tab in a single-tab project window. */
export const PRIMARY_WINDOW_SCOPE_TAB_ANCHOR = {
  x: 119,
  y: 20,
};

export interface PrimaryWindowDropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getPrimaryWindowDropBounds(
  clientX: number,
  clientY: number,
  container: HTMLElement | null,
): PrimaryWindowDropBounds {
  const preset = WINDOW_SIZE_PRESETS[DEFAULT_WINDOW_SIZE_PRESET];
  const containerSize = container
    ? { width: container.clientWidth, height: container.clientHeight }
    : { width: window.innerWidth, height: window.innerHeight };
  const containerRect = container?.getBoundingClientRect();
  const anchor = PRIMARY_WINDOW_SCOPE_TAB_ANCHOR;

  let x = clientX - (containerRect?.left ?? 0) - anchor.x;
  let y = clientY - (containerRect?.top ?? 0) - anchor.y;

  const width = Math.min(
    Math.max(preset.width, MIN_WIDTH),
    containerSize.width,
  );
  const height = Math.min(
    Math.max(preset.height, MIN_HEIGHT),
    containerSize.height,
  );

  x = Math.min(Math.max(x, 0), Math.max(0, containerSize.width - width));
  y = Math.min(Math.max(y, 0), Math.max(0, containerSize.height - height));

  return { x, y, width, height };
}

export function getPrimaryWindowGhostScreenBounds(
  clientX: number,
  clientY: number,
  container: HTMLElement | null,
) {
  const bounds = getPrimaryWindowDropBounds(clientX, clientY, container);
  const rect = container?.getBoundingClientRect() ?? { left: 0, top: 0 };

  return {
    ...bounds,
    screenX: rect.left + bounds.x,
    screenY: rect.top + bounds.y,
  };
}
