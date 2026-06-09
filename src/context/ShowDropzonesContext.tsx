import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'studio-show-dropzones';

interface ShowDropzonesContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ShowDropzonesContext = createContext<ShowDropzonesContextValue | null>(null);

function readStoredEnabled(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return false;
}

export function ShowDropzonesProvider({ children }: { children: ReactNode }) {
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
    <ShowDropzonesContext.Provider value={value}>
      {children}
    </ShowDropzonesContext.Provider>
  );
}

export function useShowDropzones() {
  const context = useContext(ShowDropzonesContext);
  if (!context) {
    throw new Error('useShowDropzones must be used within ShowDropzonesProvider');
  }
  return context;
}
