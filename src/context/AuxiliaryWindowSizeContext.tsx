import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  AUXILIARY_WINDOW_SIZE_PANEL_ORDER,
  clampAuxiliaryWindowSize,
  getDefaultAuxiliaryWindowSize,
  type AuxiliaryWindowSize,
} from '../config/auxiliaryWindowSizes';
import type { PanelId } from '../types/layout';

const STORAGE_KEY = 'studio-auxiliary-window-sizes';

type SizeOverrides = Partial<Record<PanelId, AuxiliaryWindowSize>>;

interface AuxiliaryWindowSizeContextValue {
  getSize: (panelId: PanelId) => AuxiliaryWindowSize;
  setSize: (panelId: PanelId, size: AuxiliaryWindowSize) => void;
  resetSize: (panelId: PanelId) => void;
}

const AuxiliaryWindowSizeContext =
  createContext<AuxiliaryWindowSizeContextValue | null>(null);

function readStoredOverrides(): SizeOverrides {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as SizeOverrides;
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeStoredOverrides(overrides: SizeOverrides) {
  try {
    if (Object.keys(overrides).length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

function sanitizeOverride(value: unknown): AuxiliaryWindowSize | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<AuxiliaryWindowSize>;
  if (
    typeof candidate.width !== 'number' ||
    typeof candidate.height !== 'number' ||
    !Number.isFinite(candidate.width) ||
    !Number.isFinite(candidate.height)
  ) {
    return null;
  }
  return clampAuxiliaryWindowSize({
    width: candidate.width,
    height: candidate.height,
  });
}

function sanitizeStoredOverrides(raw: SizeOverrides): SizeOverrides {
  const next: SizeOverrides = {};
  for (const panelId of AUXILIARY_WINDOW_SIZE_PANEL_ORDER) {
    const size = sanitizeOverride(raw[panelId]);
    if (size) {
      next[panelId] = size;
    }
  }
  return next;
}

export function AuxiliaryWindowSizeProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<SizeOverrides>(() =>
    sanitizeStoredOverrides(readStoredOverrides()),
  );

  const getSize = useCallback(
    (panelId: PanelId): AuxiliaryWindowSize => {
      return overrides[panelId] ?? getDefaultAuxiliaryWindowSize(panelId);
    },
    [overrides],
  );

  const setSize = useCallback((panelId: PanelId, size: AuxiliaryWindowSize) => {
    const nextSize = clampAuxiliaryWindowSize(size);
    setOverrides((current) => {
      const next = { ...current, [panelId]: nextSize };
      writeStoredOverrides(next);
      return next;
    });
  }, []);

  const resetSize = useCallback((panelId: PanelId) => {
    setOverrides((current) => {
      if (!(panelId in current)) return current;
      const next = { ...current };
      delete next[panelId];
      writeStoredOverrides(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ getSize, setSize, resetSize }),
    [getSize, setSize, resetSize],
  );

  return (
    <AuxiliaryWindowSizeContext.Provider value={value}>
      {children}
    </AuxiliaryWindowSizeContext.Provider>
  );
}

export function useAuxiliaryWindowSize() {
  const context = useContext(AuxiliaryWindowSizeContext);
  if (!context) {
    throw new Error(
      'useAuxiliaryWindowSize must be used within AuxiliaryWindowSizeProvider',
    );
  }
  return context;
}
