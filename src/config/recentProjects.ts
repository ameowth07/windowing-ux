import { createInitialLayoutState } from '../data/initialLayout';
import type { PlaceSkeletonVariant } from '../data/initialLayout';
import type { LayoutState } from '../types/layout';

export type RecentProjectId = 'playground' | 'avatar-package';

export interface RecentProjectDefinition {
  id: RecentProjectId;
  label: string;
  menuActionId: string;
  emptyPlace?: boolean;
  placeSkeletonVariant?: PlaceSkeletonVariant;
  createSeedLayout: () => LayoutState;
}

function createAvatarPackageSeedLayout(): LayoutState {
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
          id: 'node-avatar-docs',
          activeTabId: 'avatar',
          panels: ['avatar', 'ui'],
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

export const RECENT_PROJECTS: Record<RecentProjectId, RecentProjectDefinition> = {
  playground: {
    id: 'playground',
    label: 'Playground',
    menuActionId: 'recent-playground',
    placeSkeletonVariant: 'racetrack',
    createSeedLayout: () => createInitialLayoutState('place'),
  },
  'avatar-package': {
    id: 'avatar-package',
    label: 'Avatar_Package',
    menuActionId: 'recent-avatar-package',
    createSeedLayout: createAvatarPackageSeedLayout,
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
