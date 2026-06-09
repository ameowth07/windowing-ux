export const EDGE_DROP_ZONE_DELAY_PRESETS = [250, 500, 750, 1000, 1500] as const;

export type EdgeDropZoneDelayPreset = (typeof EDGE_DROP_ZONE_DELAY_PRESETS)[number];

export const DEFAULT_EDGE_DROP_ZONE_DELAY_ENABLED = false;
export const DEFAULT_EDGE_DROP_ZONE_DELAY_MS: EdgeDropZoneDelayPreset = 500;
