import type { DropZone } from '../types/layout';

export type DropZoneVariant = 'five' | 'four';

export interface DropZoneDefinition {
  zone: DropZone;
  label: string;
}

export const DROP_ZONE_VARIANTS: Record<
  DropZoneVariant,
  { label: string; description: string; zones: DropZoneDefinition[] }
> = {
  five: {
    label: '5 zones',
    description: 'Split edges on panel body; tab bar uses insert slots for order',
    zones: [
      { zone: 'left', label: 'Dock left' },
      { zone: 'right', label: 'Dock right' },
      { zone: 'top', label: 'Dock top' },
      { zone: 'bottom', label: 'Dock bottom' },
      { zone: 'center', label: 'Tab group' },
    ],
  },
  four: {
    label: '4 zones',
    description: 'Split edges on panel body; tab bar uses insert slots for order',
    zones: [
      { zone: 'left', label: 'Dock left' },
      { zone: 'right', label: 'Dock right' },
      { zone: 'top', label: 'Dock top' },
      { zone: 'bottom', label: 'Dock bottom' },
    ],
  },
};

export function getZonesForVariant(variant: DropZoneVariant): DropZoneDefinition[] {
  return DROP_ZONE_VARIANTS[variant].zones;
}
