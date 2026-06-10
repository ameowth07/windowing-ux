import type { PlaceSkeletonVariant } from '../data/initialLayout';
import type { LayoutNode, LayoutState, PanelId } from '../types/layout';
import { cloneLayoutState } from '../utils/cloneLayoutState';

export type RecentProjectId = 'playground' | 'avatar-package';

export interface RecentProjectDefinition {
  id: RecentProjectId;
  label: string;
  menuActionId: string;
  emptyPlace?: boolean;
  placeSkeletonVariant?: PlaceSkeletonVariant;
  createSeedLayout: (studio2026: boolean) => LayoutState;
}

function createStudioShellSeedLayout(centerTop: LayoutNode): LayoutState {
  return {
    root: {
      type: 'split',
      id: 'outer-split',
      direction: 'horizontal',
      ratio: 0.1,
      first: {
        type: 'panel',
        id: 'node-setup',
        panelId: 'setup',
      },
      second: {
        type: 'split',
        id: 'left-tool-split',
        direction: 'horizontal',
        ratio: 0.14,
        first: {
          type: 'split',
          id: 'tool-assistant-split',
          direction: 'vertical',
          ratio: 0.5,
          first: {
            type: 'panel',
            id: 'node-toolbox',
            panelId: 'toolbox',
          },
          second: {
            type: 'panel',
            id: 'node-assistant',
            panelId: 'assistant',
          },
        },
        second: {
          type: 'split',
          id: 'main-right-split',
          direction: 'horizontal',
          ratio: 0.67,
          first: {
            type: 'split',
            id: 'document-bottom-split',
            direction: 'vertical',
            ratio: 0.74,
            first: centerTop,
            second: {
              type: 'tabs',
              id: 'node-bottom-tabs',
              activeTabId: 'asset-manager',
              panels: ['asset-manager', 'output'],
            },
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
        },
      },
    },
    floating: [],
  };
}

function createPlaygroundSeedLayout(): LayoutState {
  return createStudioShellSeedLayout({
    type: 'panel',
    id: 'node-place',
    panelId: 'place',
  });
}

function createAvatarPackageSeedLayout(studio2026: boolean): LayoutState {
  if (studio2026) {
    return createStudioShellSeedLayout({
      type: 'tabs',
      id: 'node-document-tabs',
      activeTabId: 'place',
      panels: ['place', 'ui'],
    });
  }

  return createPackageStyleSeedLayout(['avatar', 'ui'], 'avatar');
}

function createPackageStyleSeedLayout(
  documentPanels: PanelId[],
  activeTabId: PanelId,
): LayoutState {
  return {
    root: {
      type: 'split',
      id: 'outer-split',
      direction: 'horizontal',
      ratio: 0.28,
      first: {
        type: 'split',
        id: 'left-split',
        direction: 'vertical',
        ratio: 0.55,
        first: {
          type: 'panel',
          id: 'node-output',
          panelId: 'output',
        },
        second: {
          type: 'panel',
          id: 'node-asset-manager',
          panelId: 'asset-manager',
        },
      },
      second: {
        type: 'split',
        id: 'root-split',
        direction: 'horizontal',
        ratio: 0.68,
        first: {
          type: 'tabs',
          id: 'node-document-tabs',
          activeTabId,
          panels: documentPanels,
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
      },
    },
    floating: [],
  };
}

function replaceAvatarDocumentsWithPlace(node: LayoutNode): LayoutNode {
  if (node.type === 'split') {
    return {
      ...node,
      first: replaceAvatarDocumentsWithPlace(node.first),
      second: replaceAvatarDocumentsWithPlace(node.second),
    };
  }

  if (node.type === 'tabs') {
    const panels = node.panels.map((panelId) =>
      panelId === 'avatar' ? 'place' : panelId,
    );
    const dedupedPanels = panels.filter(
      (panelId, index) => panels.indexOf(panelId) === index,
    );
    const activeTabId =
      node.activeTabId === 'avatar'
        ? 'place'
        : dedupedPanels.includes(node.activeTabId)
          ? node.activeTabId
          : (dedupedPanels[0] ?? 'place');

    return {
      ...node,
      panels: dedupedPanels,
      activeTabId,
    };
  }

  if (node.type === 'panel' && node.panelId === 'avatar') {
    return {
      ...node,
      panelId: 'place',
    };
  }

  return node;
}

export function adaptRecentLayoutForStudio2026(state: LayoutState): LayoutState {
  const next = cloneLayoutState(state);
  if (next.root) {
    next.root = replaceAvatarDocumentsWithPlace(next.root);
  }

  next.floating = next.floating.map((window) => {
    const panels = window.panels.map((panelId) =>
      panelId === 'avatar' ? 'place' : panelId,
    );
    const dedupedPanels = panels.filter(
      (panelId, index) => panels.indexOf(panelId) === index,
    );
    const activeTabId =
      window.activeTabId === 'avatar'
        ? 'place'
        : dedupedPanels.includes(window.activeTabId)
          ? window.activeTabId
          : (dedupedPanels[0] ?? 'place');

    return {
      ...window,
      panels: dedupedPanels,
      activeTabId,
      layout: window.layout
        ? replaceAvatarDocumentsWithPlace(window.layout)
        : window.layout,
    };
  });

  return next;
}

export function createRecentProjectSeedLayout(
  projectId: RecentProjectId,
  studio2026: boolean,
): LayoutState {
  if (studio2026) {
    switch (projectId) {
      case 'playground':
        return createPlaygroundSeedLayout();
      case 'avatar-package':
        return createAvatarPackageSeedLayout(true);
    }
  }

  switch (projectId) {
    case 'playground':
      return createPlaygroundSeedLayout();
    case 'avatar-package':
      return createAvatarPackageSeedLayout(false);
  }
}

export function getRecentProjectStorageKey(
  projectId: RecentProjectId,
  studio2026: boolean,
): string {
  const mode = studio2026 ? '2026' : 'legacy';
  if (projectId === 'playground') {
    return `studio-recent-project-layout:playground:${mode}:v2`;
  }
  if (projectId === 'avatar-package') {
    return `studio-recent-project-layout:avatar-package:${mode}:v2`;
  }
  return studio2026
    ? `studio-recent-project-layout:${projectId}:2026`
    : `studio-recent-project-layout:${projectId}`;
}

export const RECENT_PROJECTS: Record<RecentProjectId, RecentProjectDefinition> = {
  playground: {
    id: 'playground',
    label: 'Playground',
    menuActionId: 'recent-playground',
    placeSkeletonVariant: 'racetrack',
    createSeedLayout: (studio2026) =>
      createRecentProjectSeedLayout('playground', studio2026),
  },
  'avatar-package': {
    id: 'avatar-package',
    label: 'Avatar_Package',
    menuActionId: 'recent-avatar-package',
    createSeedLayout: (studio2026) =>
      createRecentProjectSeedLayout('avatar-package', studio2026),
  },
};

export const RECENT_PROJECT_LIST = Object.values(RECENT_PROJECTS);

export function getRecentProjectIdForMenuAction(
  actionId: string,
): RecentProjectId | null {
  const match = RECENT_PROJECT_LIST.find(
    (project) => project.menuActionId === actionId,
  );
  return match?.id ?? null;
}

export function getRecentProjectTabId(projectId: RecentProjectId): string {
  return `recent-${projectId}`;
}
