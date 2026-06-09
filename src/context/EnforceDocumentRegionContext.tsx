import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_ENFORCE_DOCUMENT_REGION_ENABLED } from '../config/enforceDocumentRegion';

const STORAGE_KEY = 'studio-enforce-document-region-enabled';

interface EnforceDocumentRegionContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const EnforceDocumentRegionContext =
  createContext<EnforceDocumentRegionContextValue | null>(null);

function readStoredEnabled(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return DEFAULT_ENFORCE_DOCUMENT_REGION_ENABLED;
}

export function EnforceDocumentRegionProvider({
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
    <EnforceDocumentRegionContext.Provider value={value}>
      {children}
    </EnforceDocumentRegionContext.Provider>
  );
}

export function useEnforceDocumentRegion() {
  const context = useContext(EnforceDocumentRegionContext);
  if (!context) {
    throw new Error(
      'useEnforceDocumentRegion must be used within EnforceDocumentRegionProvider',
    );
  }
  return context;
}

export function useEnforceDocumentRegionEnabled(override?: boolean): boolean {
  const context = useContext(EnforceDocumentRegionContext);
  if (override !== undefined) return override;
  return context?.enabled ?? DEFAULT_ENFORCE_DOCUMENT_REGION_ENABLED;
}
