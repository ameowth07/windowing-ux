import { getBasePanelId } from '../utils/panelId';
import type { PanelId } from '../types/layout';

export const DEFAULT_STUDIO_2026_ENABLED = true;

export function resolveAddTabMenuPanelId(
  menuPanelId: PanelId,
  studio2026: boolean,
): PanelId {
  if (studio2026 && menuPanelId === 'viewport') {
    return 'place';
  }
  return menuPanelId;
}

export function isAddTabMenuItemOpen(
  menuPanelId: PanelId,
  openPanelIds: ReadonlySet<PanelId>,
  studio2026: boolean,
): boolean {
  const targetPanelId = resolveAddTabMenuPanelId(menuPanelId, studio2026);

  if (openPanelIds.has(targetPanelId)) {
    return true;
  }

  return [...openPanelIds].some(
    (openPanelId) => getBasePanelId(openPanelId) === targetPanelId,
  );
}
