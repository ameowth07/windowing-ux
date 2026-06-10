import { RECENT_PROJECT_LIST } from '../config/recentProjects';
import type { PanelId } from '../types/layout';

export interface StudioMenuLeafItem {
  id: string;
  label: string;
  panelId: PanelId;
}

export interface StudioMenuCategory {
  id: string;
  label: string;
  items: StudioMenuLeafItem[];
}

export const STUDIO_MENU_CATEGORIES: StudioMenuCategory[] = [
  {
    id: 'general',
    label: 'General',
    items: [
      leaf('asset-manager', 'Asset Manager'),
      leaf('assistant', 'Assistant'),
      leaf('explorer', 'Explorer'),
      leaf('output', 'Output'),
      leaf('properties', 'Properties'),
      leaf('toolbox', 'Toolbox'),
    ],
  },
  {
    id: '3d',
    label: '3D',
    items: [
      leaf('align', 'Align'),
      leaf('collision', 'Collision'),
      leaf('material', 'Material'),
      leaf('material-generator', 'Material Generator'),
      leaf('terrain', 'Terrain'),
      leaf('texture-generator', 'Texture Generator'),
    ],
  },
  {
    id: 'activity',
    label: 'Activity',
    items: [leaf('activity-history', 'Activity History')],
  },
  {
    id: 'avatar',
    label: 'Avatar',
    items: [
      leaf('clip-editor', 'Clip Editor'),
      leaf('accessory', 'Accessory'),
      leaf('setup', 'Setup'),
    ],
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    items: [
      leaf('comments', 'Comments'),
      leaf('live-collaborators', 'Live Collaborators'),
      leaf('manage-collaborators', 'Manage Collaborators'),
      leaf('team-create', 'Team Create'),
    ],
  },
  {
    id: 'debug',
    label: 'Debug',
    items: [
      leaf('breakpoints', 'Breakpoints'),
      leaf('call-stack', 'Call Stack'),
      leaf('watch', 'Watch'),
      leaf('internal-debug', 'Internal Debug'),
    ],
  },
  {
    id: 'insert',
    label: 'Insert',
    items: [leaf('insert-object', 'Insert Object')],
  },
  {
    id: 'localization',
    label: 'Localization',
    items: [leaf('localization-tools', 'Localization Tools')],
  },
  {
    id: 'performance-summary',
    label: 'Performance Summary',
    items: [
      leaf('performance-diagnostics', 'Performance Diagnostics'),
      leaf('microprofiler', 'Microprofiler'),
      leaf('network-summary', 'Network Summary'),
      leaf('performance-summary-panel', 'Performance Summary'),
      leaf('physics', 'Physics'),
      leaf('render', 'Render'),
      leaf('stats', 'Stats'),
    ],
  },
  {
    id: 'script',
    label: 'Script',
    items: [
      leaf('command-bar', 'Command Bar'),
      leaf('find-in-place', 'Find in Place'),
      leaf('object-browser', 'Object Browser'),
      leaf('analysis', 'Analysis'),
      leaf('script-activity', 'Script Activity'),
      leaf('run-script', 'Run Script'),
      leaf('tag-editor', 'Tag Editor'),
      leaf('task-scheduler', 'Task Scheduler'),
    ],
  },
  {
    id: 'versioning',
    label: 'Versioning',
    items: [leaf('versioning-history', 'Versioning History')],
  },
];

function leaf(id: string, label: string): StudioMenuLeafItem {
  return { id, label, panelId: id };
}

export function getAddTabMenuCategories(studio2026: boolean): StudioMenuCategory[] {
  if (!studio2026) {
    return STUDIO_MENU_CATEGORIES;
  }

  return STUDIO_MENU_CATEGORIES.map((category) => {
    if (category.id !== 'general') {
      return category;
    }

    if (category.items.some((item) => item.panelId === 'viewport')) {
      return category;
    }

    return {
      ...category,
      items: [...category.items, leaf('viewport', 'Viewport')].sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    };
  });
}

export interface StudioMenuItem {
  id: string;
  label: string;
}

export const APP_BAR_MENU_ITEMS: StudioMenuItem[] = [
  { id: 'file', label: 'File' },
  { id: 'edit', label: 'Edit' },
  { id: 'view', label: 'View' },
  { id: 'plugins', label: 'Plugins' },
  { id: 'test', label: 'Test' },
  { id: 'window', label: 'Window' },
  { id: 'help', label: 'Help' },
];

export interface FileMenuAction {
  id: string;
  label: string;
}

export const FILE_MENU_ACTIONS: FileMenuAction[] = [
  { id: 'new-project', label: 'New Project' },
  { id: 'save-project', label: 'Save Project' },
];

export function getFileMenuActions(studio2026: boolean): FileMenuAction[] {
  if (!studio2026) {
    return FILE_MENU_ACTIONS;
  }

  return FILE_MENU_ACTIONS.map((action) => {
    if (action.id === 'new-project') {
      return { ...action, label: 'New Place' };
    }
    if (action.id === 'save-project') {
      return { ...action, label: 'Save Place' };
    }
    return action;
  });
}

export const FILE_MENU_RECENT_ITEMS: FileMenuAction[] = RECENT_PROJECT_LIST.map(
  (project) => ({
    id: project.menuActionId,
    label: project.label,
  }),
);

export const FILE_MENU_SETTINGS_ACTIONS: FileMenuAction[] = [
  { id: 'project-settings', label: 'Studio Settings' },
];
