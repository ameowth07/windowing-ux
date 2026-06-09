import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DropZoneVariant } from '../config/dropZones';

const STORAGE_KEY = 'studio-drop-zone-variant';

interface DropZoneVariantContextValue {
  variant: DropZoneVariant;
  setVariant: (variant: DropZoneVariant) => void;
  toggleVariant: () => void;
}

const DropZoneVariantContext =
  createContext<DropZoneVariantContextValue | null>(null);

function readStoredVariant(): DropZoneVariant {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'four' || stored === 'five') return stored;
  } catch {
    /* ignore */
  }
  return 'five';
}

export function DropZoneVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<DropZoneVariant>(readStoredVariant);

  const setVariant = useCallback((next: DropZoneVariant) => {
    setVariantState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleVariant = useCallback(() => {
    setVariant(variant === 'five' ? 'four' : 'five');
  }, [setVariant, variant]);

  const value = useMemo(
    () => ({ variant, setVariant, toggleVariant }),
    [variant, setVariant, toggleVariant],
  );

  return (
    <DropZoneVariantContext.Provider value={value}>
      {children}
    </DropZoneVariantContext.Provider>
  );
}

export function useDropZoneVariant() {
  const context = useContext(DropZoneVariantContext);
  if (!context) {
    throw new Error(
      'useDropZoneVariant must be used within DropZoneVariantProvider',
    );
  }
  return context;
}
