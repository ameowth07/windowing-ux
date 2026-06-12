import type { PanelId } from '../types/layout';

export interface DocumentMenuItem {
  id: PanelId;
  label: string;
}

export const DOCUMENT_MENU_ITEMS: DocumentMenuItem[] = [
  { id: 'animation', label: 'Animation' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'place', label: 'Place' },
  { id: 'script', label: 'Script' },
  { id: 'ui', label: 'UI' },
];

export const STUDIO_2026_SCRIPT_DOCUMENT_MENU_ITEMS: DocumentMenuItem[] = [
  { id: 'script', label: 'Script' },
  { id: 'modulescript', label: 'ModuleScript' },
  { id: 'localscript', label: 'LocalScript' },
];
