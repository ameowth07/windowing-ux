import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { PanelId } from '../types/layout';

export interface TabBarDragSnapshot {
  nodeId: string;
  width: number;
  visiblePanelIds: PanelId[];
  overflowPanelIds: PanelId[];
  activeTabId: PanelId;
  variant: 'docked' | 'floating';
}

interface TabBarDragSnapshotContextValue {
  registerSnapshot: (nodeId: string, snapshot: TabBarDragSnapshot) => void;
  getSnapshot: (nodeId: string) => TabBarDragSnapshot | undefined;
}

const TabBarDragSnapshotContext =
  createContext<TabBarDragSnapshotContextValue | null>(null);

export function TabBarDragSnapshotProvider({ children }: { children: ReactNode }) {
  const snapshotsRef = useRef(new Map<string, TabBarDragSnapshot>());

  const registerSnapshot = useCallback(
    (nodeId: string, snapshot: TabBarDragSnapshot) => {
      snapshotsRef.current.set(nodeId, snapshot);
    },
    [],
  );

  const getSnapshot = useCallback((nodeId: string) => {
    return snapshotsRef.current.get(nodeId);
  }, []);

  const value = useMemo(
    () => ({ registerSnapshot, getSnapshot }),
    [registerSnapshot, getSnapshot],
  );

  return (
    <TabBarDragSnapshotContext.Provider value={value}>
      {children}
    </TabBarDragSnapshotContext.Provider>
  );
}

export function useTabBarDragSnapshotRegistry() {
  const context = useContext(TabBarDragSnapshotContext);
  if (!context) {
    throw new Error(
      'useTabBarDragSnapshotRegistry must be used within TabBarDragSnapshotProvider',
    );
  }
  return context;
}
