import {
  DEFAULT_FLOAT_HEIGHT,
  DEFAULT_FLOAT_WIDTH,
  MIN_FLOAT_HEIGHT,
  MIN_FLOAT_WIDTH,
} from './floatingWindow';
import { getBasePanelId } from '../utils/panelId';
import type { PanelId } from '../types/layout';

export interface AuxiliaryWindowSize {
  width: number;
  height: number;
}

export const DEFAULT_AUXILIARY_WINDOW_SIZES: Record<PanelId, AuxiliaryWindowSize> = {
  output: { width: 480, height: 320 },
  'asset-manager': { width: 364, height: 522 },
  assistant: { width: 360, height: 640 },
  toolbox: { width: 320, height: 480 },
  place: { width: 640, height: 480 },
  explorer: { width: 320, height: 520 },
  properties: { width: 300, height: 520 },
  viewport: { width: 800, height: 600 },
};

export const AUXILIARY_WINDOW_SIZE_PANEL_ORDER: PanelId[] = [
  'output',
  'asset-manager',
  'assistant',
  'toolbox',
  'place',
  'explorer',
  'properties',
  'viewport',
];

export function clampAuxiliaryWindowSize(
  size: AuxiliaryWindowSize,
): AuxiliaryWindowSize {
  return {
    width: Math.max(MIN_FLOAT_WIDTH, Math.round(size.width)),
    height: Math.max(MIN_FLOAT_HEIGHT, Math.round(size.height)),
  };
}

export function getDefaultAuxiliaryWindowSize(panelId: PanelId): AuxiliaryWindowSize {
  return (
    DEFAULT_AUXILIARY_WINDOW_SIZES[getBasePanelId(panelId)] ?? {
      width: DEFAULT_FLOAT_WIDTH,
      height: DEFAULT_FLOAT_HEIGHT,
    }
  );
}
