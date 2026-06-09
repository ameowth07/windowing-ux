import { DOCUMENT_MENU_ITEMS } from './documentPanels';
import { STUDIO_MENU_CATEGORIES } from './studioMenuItems';
import { getBasePanelId } from '../utils/panelId';
import type { PanelDefinition, PanelId } from '../types/layout';

const DOCUMENT_PANELS: Record<string, PanelDefinition> = {
  place: {
    id: 'place',
    title: 'Place',
    panelType: 'document',
    icon: 'globe',
    skeleton: true,
  },
  script: {
    id: 'script',
    title: 'Script',
    panelType: 'document',
    icon: 'script',
    skeleton: true,
  },
  avatar: {
    id: 'avatar',
    title: 'Avatar',
    panelType: 'document',
    icon: 'avatar',
    skeleton: true,
  },
  animation: {
    id: 'animation',
    title: 'Animation',
    panelType: 'document',
    icon: 'document',
    skeleton: true,
  },
  markdown: {
    id: 'markdown',
    title: 'Markdown',
    panelType: 'document',
    icon: 'document',
    skeleton: true,
  },
  ui: {
    id: 'ui',
    title: 'UI',
    panelType: 'document',
    icon: 'document',
    skeleton: true,
  },
};

const AUXILIARY_PANELS: Record<string, PanelDefinition> = {
  output: { id: 'output', title: 'Output', panelType: 'auxiliary', skeleton: true },
  'asset-manager': {
    id: 'asset-manager',
    title: 'Asset Manager',
    panelType: 'auxiliary',
    skeleton: true,
  },
  assistant: { id: 'assistant', title: 'Assistant', panelType: 'auxiliary', skeleton: true },
  toolbox: { id: 'toolbox', title: 'Toolbox', panelType: 'auxiliary', skeleton: true },
  explorer: { id: 'explorer', title: 'Explorer', panelType: 'auxiliary', skeleton: true },
  properties: { id: 'properties', title: 'Properties', panelType: 'auxiliary', skeleton: true },
  viewport: { id: 'viewport', title: 'Viewport', panelType: 'auxiliary', skeleton: true },
};

function buildPanelDefinitions(): Record<string, PanelDefinition> {
  const definitions: Record<string, PanelDefinition> = {
    ...DOCUMENT_PANELS,
    ...AUXILIARY_PANELS,
  };

  for (const category of STUDIO_MENU_CATEGORIES) {
    for (const item of category.items) {
      if (definitions[item.id]) continue;
      definitions[item.id] = {
        id: item.id,
        title: item.label,
        panelType: 'auxiliary',
        skeleton: true,
      };
    }
  }

  for (const item of DOCUMENT_MENU_ITEMS) {
    if (definitions[item.id]) continue;
    definitions[item.id] = {
      id: item.id,
      title: item.label,
      panelType: 'document',
      icon: 'document',
      skeleton: true,
    };
  }

  for (const [id, definition] of Object.entries(definitions)) {
    if (definition.panelType === 'document' && !definition.icon) {
      definitions[id] = { ...definition, icon: 'document' };
    }
  }

  return definitions;
}

export const PANEL_DEFINITIONS: Record<string, PanelDefinition> =
  buildPanelDefinitions();

export function getPanelDefinition(panelId: PanelId): PanelDefinition | undefined {
  return PANEL_DEFINITIONS[getBasePanelId(panelId)];
}

export const ALL_PANEL_IDS = Object.keys(PANEL_DEFINITIONS);

export const ADDABLE_PANEL_IDS: PanelId[] = STUDIO_MENU_CATEGORIES.flatMap(
  (category) => category.items.map((item) => item.panelId),
);
