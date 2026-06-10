import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_FLOATING_PANEL_DOCKING_ENABLED } from '../config/floatingPanelDocking';

const STORAGE_KEY = 'studio-floating-panel-docking-enabled';

interface FloatingPanelDockingContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const FloatingPanelDockingContext =
  createContext<FloatingPanelDockingContextValue | null>(null);

function readStoredEnabled(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return DEFAULT_FLOATING_PANEL_DOCKING_ENABLED;
}

export function FloatingPanelDockingProvider({
  children,
}: {
  children: ReactNode;
}) {
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
    <FloatingPanelDockingContext.Provider value={value}>
      {children}
    </FloatingPanelDockingContext.Provider>
  );
}

export function useFloatingPanelDocking() {
  const context = useContext(FloatingPanelDockingContext);
  if (!context) {
    throw new Error(
      'useFloatingPanelDocking must be used within FloatingPanelDockingProvider',
    );
  }
  return context;
}

export function useFloatingPanelDockingEnabled(override?: boolean): boolean {
  const context = useContext(FloatingPanelDockingContext);
  if (override !== undefined) return override;
  return context?.enabled ?? DEFAULT_FLOATING_PANEL_DOCKING_ENABLED;
}
