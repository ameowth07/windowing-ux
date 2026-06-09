import type { LayoutNode, LayoutState, PanelId } from '../types/layout';

function createMainWorkspace(mainDocumentPanelId: PanelId): LayoutNode {
  return {
    type: 'split',
    id: 'root-split',
    direction: 'horizontal',
    ratio: 0.72,
    first: {
      type: 'panel',
      id: `node-${mainDocumentPanelId}`,
      panelId: mainDocumentPanelId,
    },
    second: {
      type: 'split',
      id: 'right-split',
      direction: 'vertical',
      ratio: 0.5,
      first: {
        type: 'panel',
        id: 'node-explorer',
        panelId: 'explorer',
      },
      second: {
        type: 'panel',
        id: 'node-properties',
        panelId: 'properties',
      },
    },
  };
}

function createInitialRoot(mainDocumentPanelId: PanelId): LayoutNode {
  return {
    type: 'split',
    id: 'outer-split',
    direction: 'horizontal',
    ratio: 0.22,
    first: {
      type: 'split',
      id: 'left-split',
      direction: 'vertical',
      ratio: 0.5,
      first: {
        type: 'panel',
        id: 'node-assistant',
        panelId: 'assistant',
      },
      second: {
        type: 'panel',
        id: 'node-toolbox',
        panelId: 'toolbox',
      },
    },
    second: createMainWorkspace(mainDocumentPanelId),
  };
}

export function createInitialLayoutState(
  mainDocumentPanelId: PanelId = 'place',
): LayoutState {
  return {
    root: createInitialRoot(mainDocumentPanelId),
    floating: [],
  };
}

const SCOPE_TAB_MAIN_DOCUMENT: Record<string, PanelId> = {
  'project-1': 'place',
  'project-2': 'place',
  'asset-1': 'ui',
  'asset-2': 'avatar',
};

export type PlaceSkeletonVariant = 'racetrack' | 'fps';

const SCOPE_TAB_PLACE_SKELETON: Record<string, PlaceSkeletonVariant> = {
  'project-1': 'racetrack',
  'project-2': 'fps',
};

export function getPlaceSkeletonVariant(scopeTabId: string): PlaceSkeletonVariant {
  return SCOPE_TAB_PLACE_SKELETON[scopeTabId] ?? 'racetrack';
}

export function getExpectedMainDocumentForScopeTab(
  scopeTabId: string,
): PanelId {
  return SCOPE_TAB_MAIN_DOCUMENT[scopeTabId] ?? 'place';
}

export function getMainWorkspaceDocumentId(
  root: LayoutNode | null,
): PanelId | null {
  if (!root || root.type !== 'split') return null;

  const mainWorkspace = root.second;
  if (!mainWorkspace || mainWorkspace.type !== 'split') return null;

  const mainDocument = mainWorkspace.first;
  if (mainDocument.type === 'panel') return mainDocument.panelId;
  if (mainDocument.type === 'tabs') {
    return mainDocument.activeTabId ?? mainDocument.panels[0] ?? null;
  }

  return null;
}

export function shouldResetScopeTabLayout(
  layout: LayoutState,
  scopeTabId: string,
): boolean {
  const expected = getExpectedMainDocumentForScopeTab(scopeTabId);
  const actual = getMainWorkspaceDocumentId(layout.root);
  return actual !== expected;
}

export function getInitialLayoutForScopeTab(scopeTabId: string): LayoutState {
  const mainDocumentPanelId = getExpectedMainDocumentForScopeTab(scopeTabId);
  return createInitialLayoutState(mainDocumentPanelId);
}

export const initialLayoutState = createInitialLayoutState('place');
