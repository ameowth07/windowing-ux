import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SKELETON_CONTENT_ENABLED } from '../config/skeletonContent';

const STORAGE_KEY = 'studio-skeleton-content-enabled';

interface SkeletonContentContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const SkeletonContentContext = createContext<SkeletonContentContextValue | null>(
  null,
);

function readStoredEnabled(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return DEFAULT_SKELETON_CONTENT_ENABLED;
}

export function SkeletonContentProvider({ children }: { children: ReactNode }) {
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
    <SkeletonContentContext.Provider value={value}>
      {children}
    </SkeletonContentContext.Provider>
  );
}

export function useSkeletonContent() {
  const context = useContext(SkeletonContentContext);
  if (!context) {
    throw new Error(
      'useSkeletonContent must be used within SkeletonContentProvider',
    );
  }
  return context;
}

export function useSkeletonContentEnabled(override?: boolean): boolean {
  const context = useContext(SkeletonContentContext);
  if (override !== undefined) return override;
  return context?.enabled ?? DEFAULT_SKELETON_CONTENT_ENABLED;
}
