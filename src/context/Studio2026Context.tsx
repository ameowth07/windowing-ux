import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_STUDIO_2026_ENABLED } from '../config/studio2026';

const STORAGE_KEY = 'studio-2026-enabled';

interface Studio2026ContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const Studio2026Context = createContext<Studio2026ContextValue | null>(null);

function readStoredEnabled(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return DEFAULT_STUDIO_2026_ENABLED;
}

export function Studio2026Provider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(readStoredEnabled);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ enabled, setEnabled }),
    [enabled, setEnabled],
  );

  return (
    <Studio2026Context.Provider value={value}>
      {children}
    </Studio2026Context.Provider>
  );
}

export function useStudio2026() {
  const context = useContext(Studio2026Context);
  if (!context) {
    throw new Error('useStudio2026 must be used within Studio2026Provider');
  }
  return context;
}

export function useStudio2026Enabled(override?: boolean): boolean {
  const context = useContext(Studio2026Context);
  if (override !== undefined) return override;
  return context?.enabled ?? DEFAULT_STUDIO_2026_ENABLED;
}
