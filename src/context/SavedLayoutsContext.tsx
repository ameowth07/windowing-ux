import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useProjectName } from './AppWindowContext';
import type { LayoutState } from '../types/layout';
import type { SavedLayout } from '../types/savedLayout';
import { cloneLayoutState } from '../utils/cloneLayoutState';

interface SavedLayoutsContextValue {
  savedLayouts: SavedLayout[];
  saveLayout: (name: string, state: LayoutState) => SavedLayout;
  deleteLayout: (id: string) => void;
}

const SavedLayoutsContext = createContext<SavedLayoutsContextValue | null>(null);

function storageKey(projectName: string) {
  return `studio-saved-layouts:${projectName}`;
}

function readLayouts(projectName: string): SavedLayout[] {
  try {
    const raw = localStorage.getItem(storageKey(projectName));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedLayout[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLayouts(projectName: string, layouts: SavedLayout[]) {
  localStorage.setItem(storageKey(projectName), JSON.stringify(layouts));
}

function createLayoutId() {
  return `layout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SavedLayoutsProvider({ children }: { children: ReactNode }) {
  const projectName = useProjectName();
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(() =>
    readLayouts(projectName),
  );

  useEffect(() => {
    setSavedLayouts(readLayouts(projectName));
  }, [projectName]);

  const saveLayout = useCallback(
    (name: string, state: LayoutState) => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new Error('Layout name is required');
      }

      const entry: SavedLayout = {
        id: createLayoutId(),
        name: trimmed,
        state: cloneLayoutState(state),
        savedAt: Date.now(),
      };

      setSavedLayouts((current) => {
        const next = [...current, entry];
        writeLayouts(projectName, next);
        return next;
      });

      return entry;
    },
    [projectName],
  );

  const deleteLayout = useCallback(
    (id: string) => {
      setSavedLayouts((current) => {
        const next = current.filter((layout) => layout.id !== id);
        writeLayouts(projectName, next);
        return next;
      });
    },
    [projectName],
  );

  const value = useMemo(
    () => ({ savedLayouts, saveLayout, deleteLayout }),
    [savedLayouts, saveLayout, deleteLayout],
  );

  return (
    <SavedLayoutsContext.Provider value={value}>
      {children}
    </SavedLayoutsContext.Provider>
  );
}

export function useSavedLayouts() {
  const context = useContext(SavedLayoutsContext);
  if (!context) {
    throw new Error('useSavedLayouts must be used within SavedLayoutsProvider');
  }
  return context;
}
