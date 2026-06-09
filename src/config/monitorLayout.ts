export type MonitorCount = 1 | 2 | 3;

export const DEFAULT_MONITOR_COUNT: MonitorCount = 1;

export const MONITOR_COUNT_OPTIONS: MonitorCount[] = [1, 2, 3];

export const MONITOR_COUNT_LABELS: Record<MonitorCount, string> = {
  1: '1 desktop',
  2: '2 desktops',
  3: '3 desktops',
};
