import { getBasePanelId } from '../utils/panelId';
import type { PanelId } from '../types/layout';

export const DEFAULT_STUDIO_2026_ENABLED = true;

export function resolveAddTabMenuPanelId(menuPanelId: PanelId): PanelId {
  return menuPanelId;
}

export function isAddTabMenuItemOpen(
  menuPanelId: PanelId,
  openPanelIds: ReadonlySet<PanelId>,
): boolean {
  const targetPanelId = resolveAddTabMenuPanelId(menuPanelId);

  if (openPanelIds.has(targetPanelId)) {
    return true;
  }

  return [...openPanelIds].some(
    (openPanelId) => getBasePanelId(openPanelId) === targetPanelId,
  );
}

/** Studio 2026 Window menu "Viewport" maps to the Place document panel. */
export const VIEWPORT_PANEL_ID: PanelId = 'place';

export function isViewportOpen(openPanelIds: ReadonlySet<PanelId>): boolean {
  if (openPanelIds.has(VIEWPORT_PANEL_ID)) {
    return true;
  }

  return [...openPanelIds].some(
    (openPanelId) => getBasePanelId(openPanelId) === VIEWPORT_PANEL_ID,
  );
}
