import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_EDGE_DROP_ZONE_DELAY_ENABLED,
  DEFAULT_EDGE_DROP_ZONE_DELAY_MS,
  EDGE_DROP_ZONE_DELAY_PRESETS,
  type EdgeDropZoneDelayPreset,
} from '../config/edgeDropZones';
import type { DropZone } from '../types/layout';

const STORAGE_KEY_ENABLED = 'studio-edge-drop-zone-delay-enabled';
const STORAGE_KEY_DELAY_MS = 'studio-edge-drop-zone-delay-ms';

const SHELL_EDGE_ZONES: DropZone[] = ['left', 'right', 'top', 'bottom'];

interface EdgeDropZoneDelayContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  delayMs: EdgeDropZoneDelayPreset;
  setDelayMs: (delayMs: EdgeDropZoneDelayPreset) => void;
  activatedZones: ReadonlySet<DropZone>;
  resetActivation: () => void;
  setActivatedZones: (zones: ReadonlySet<DropZone>) => void;
}

const EdgeDropZoneDelayContext =
  createContext<EdgeDropZoneDelayContextValue | null>(null);

function readStoredEnabled(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_ENABLED);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return DEFAULT_EDGE_DROP_ZONE_DELAY_ENABLED;
}

function readStoredDelayMs(): EdgeDropZoneDelayPreset {
  try {
    const stored = Number(sessionStorage.getItem(STORAGE_KEY_DELAY_MS));
    if (EDGE_DROP_ZONE_DELAY_PRESETS.includes(stored as EdgeDropZoneDelayPreset)) {
      return stored as EdgeDropZoneDelayPreset;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_EDGE_DROP_ZONE_DELAY_MS;
}

export function EdgeDropZoneDelayProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(readStoredEnabled);
  const [delayMs, setDelayMsState] = useState<EdgeDropZoneDelayPreset>(readStoredDelayMs);
  const [activatedZones, setActivatedZonesState] = useState<ReadonlySet<DropZone>>(
    () => new Set(),
  );

  const resetActivation = useCallback(() => {
    setActivatedZonesState(new Set());
  }, []);

  const setActivatedZones = useCallback((zones: ReadonlySet<DropZone>) => {
    setActivatedZonesState(new Set(zones));
  }, []);

  const setEnabled = useCallback(
    (next: boolean) => {
      setEnabledState(next);
      resetActivation();
      try {
        sessionStorage.setItem(STORAGE_KEY_ENABLED, String(next));
      } catch {
        /* ignore */
      }
    },
    [resetActivation],
  );

  const setDelayMs = useCallback(
    (next: EdgeDropZoneDelayPreset) => {
      setDelayMsState(next);
      resetActivation();
      try {
        sessionStorage.setItem(STORAGE_KEY_DELAY_MS, String(next));
      } catch {
        /* ignore */
      }
    },
    [resetActivation],
  );

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      delayMs,
      setDelayMs,
      activatedZones,
      resetActivation,
      setActivatedZones,
    }),
    [
      enabled,
      setEnabled,
      delayMs,
      setDelayMs,
      activatedZones,
      resetActivation,
      setActivatedZones,
    ],
  );

  return (
    <EdgeDropZoneDelayContext.Provider value={value}>
      {children}
    </EdgeDropZoneDelayContext.Provider>
  );
}

export function useEdgeDropZoneDelay() {
  const context = useContext(EdgeDropZoneDelayContext);
  if (!context) {
    throw new Error(
      'useEdgeDropZoneDelay must be used within EdgeDropZoneDelayProvider',
    );
  }
  return context;
}

export function getAllShellEdgeZones(): DropZone[] {
  return SHELL_EDGE_ZONES;
}

export function getShellEdgeZoneAtPoint(x: number, y: number): DropZone | null {
  const container = document.querySelector('.shell-edge-zones');
  if (!container) return null;

  const rect = container.getBoundingClientRect();
  const localX = x - rect.left;
  const localY = y - rect.top;
  const styles = getComputedStyle(container);
  const side = Number.parseFloat(styles.getPropertyValue('--shell-edge-zone-side-size')) || 24;
  const endBandHeight =
    Number.parseFloat(styles.getPropertyValue('--shell-edge-zone-end-size')) || 24;
  const bottomBandTop = rect.height - endBandHeight;

  if (localX >= 0 && localX <= side && localY >= endBandHeight && localY <= bottomBandTop) {
    return 'left';
  }

  if (
    localX >= rect.width - side &&
    localX <= rect.width &&
    localY >= endBandHeight &&
    localY <= bottomBandTop
  ) {
    return 'right';
  }

  if (
    localY >= 0 &&
    localY <= endBandHeight &&
    localX >= side &&
    localX <= rect.width - side
  ) {
    return 'top';
  }

  if (
    localY >= bottomBandTop &&
    localY <= rect.height &&
    localX >= side &&
    localX <= rect.width - side
  ) {
    return 'bottom';
  }

  return null;
}
