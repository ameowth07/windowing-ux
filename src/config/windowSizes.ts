export type WindowSizePreset = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';

export interface WindowSizeDefinition {
  label: string;
  width: number;
  height: number;
}

export const WINDOW_SIZE_PRESETS: Record<WindowSizePreset, WindowSizeDefinition> = {
  xs: { label: 'XS', width: 1024, height: 640 },
  s: { label: 'S', width: 1280, height: 720 },
  m: { label: 'M', width: 1440, height: 904 },
  l: { label: 'L', width: 1600, height: 900 },
  xl: { label: 'XL', width: 1920, height: 1080 },
  xxl: { label: 'XXL', width: 2560, height: 1440 },
};

export const WINDOW_SIZE_PRESET_ORDER: WindowSizePreset[] = [
  'xs',
  's',
  'm',
  'l',
  'xl',
  'xxl',
];

export const DEFAULT_WINDOW_SIZE_PRESET: WindowSizePreset = 'm';
