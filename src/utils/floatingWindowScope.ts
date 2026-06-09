import type { FloatingWindow } from '../types/layout';

export function floatingWindowMatchesScope(
  window: FloatingWindow | undefined,
  activeScopeTabId: string,
  projectTabBarEnabled: boolean,
): boolean {
  if (!window) return false;
  if (!projectTabBarEnabled) return true;
  if (!window.scopeTabId) return true;
  return window.scopeTabId === activeScopeTabId;
}

export function findFloatingWindowForPanel(
  floating: FloatingWindow[],
  panelId: string,
): FloatingWindow | undefined {
  return floating.find((window) => window.panels.includes(panelId));
}
