import type { DropZone } from '../types/layout';

export interface DropZoneDefinition {
  zone: DropZone;
  label: string;
}

export const PANEL_DROP_ZONES: DropZoneDefinition[] = [
  { zone: 'left', label: 'Dock left' },
  { zone: 'right', label: 'Dock right' },
  { zone: 'top', label: 'Dock top' },
  { zone: 'bottom', label: 'Dock bottom' },
];
