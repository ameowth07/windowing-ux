import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useProjectTabBarEnabled } from './ProjectTabBarContext';
import { useScopeTabs } from './ScopeTabContext';

interface CollapsedTabBarContextValue {
  isTabBarCollapsed: (nodeId: string) => boolean;
  collapseTabBar: (nodeId: string) => void;
  expandTabBar: (nodeId: string) => void;
}

const CollapsedTabBarContext = createContext<CollapsedTabBarContextValue | null>(
  null,
);

export function CollapsedTabBarProvider({
  windowId,
  children,
}: {
  windowId: string;
  children: ReactNode;
}) {
  const projectTabBar = useProjectTabBarEnabled();
  const { tabs, getActiveTabForWindow } = useScopeTabs();
  const activeTabId = getActiveTabForWindow(windowId);
  const collapseScopeId = projectTabBar ? activeTabId : windowId;
  const [scopedCollapsedNodeIds, setScopedCollapsedNodeIds] = useState<
    Record<string, Set<string>>
  >({});
  const collapseScopeIdRef = useRef(collapseScopeId);
  collapseScopeIdRef.current = collapseScopeId;

  const collapsedNodeIds = useMemo(
    () => scopedCollapsedNodeIds[collapseScopeId] ?? new Set<string>(),
    [scopedCollapsedNodeIds, collapseScopeId],
  );

  const updateCollapsed = useCallback(
    (updater: (current: Set<string>) => Set<string>) => {
      setScopedCollapsedNodeIds((current) => {
        const scopeId = collapseScopeIdRef.current;
        const scopeCollapsed = current[scopeId] ?? new Set<string>();
        return {
          ...current,
          [scopeId]: updater(scopeCollapsed),
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!projectTabBar) return;

    const openTabIds = new Set(
      tabs.filter((tab) => tab.windowId === windowId).map((tab) => tab.id),
    );
    setScopedCollapsedNodeIds((current) => {
      let changed = false;
      const next = { ...current };
      for (const tabId of Object.keys(next)) {
        if (!openTabIds.has(tabId)) {
          delete next[tabId];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [projectTabBar, tabs, windowId]);

  const collapseTabBar = useCallback(
    (nodeId: string) => {
      updateCollapsed((current) => {
        const next = new Set(current);
        next.add(nodeId);
        return next;
      });
    },
    [updateCollapsed],
  );

  const expandTabBar = useCallback(
    (nodeId: string) => {
      updateCollapsed((current) => {
        if (!current.has(nodeId)) return current;
        const next = new Set(current);
        next.delete(nodeId);
        return next;
      });
    },
    [updateCollapsed],
  );

  const isTabBarCollapsed = useCallback(
    (nodeId: string) => collapsedNodeIds.has(nodeId),
    [collapsedNodeIds],
  );

  const value = useMemo(
    () => ({ isTabBarCollapsed, collapseTabBar, expandTabBar }),
    [isTabBarCollapsed, collapseTabBar, expandTabBar],
  );

  return (
    <CollapsedTabBarContext.Provider value={value}>
      {children}
    </CollapsedTabBarContext.Provider>
  );
}

export function useCollapsedTabBar() {
  const context = useContext(CollapsedTabBarContext);
  if (!context) {
    throw new Error(
      'useCollapsedTabBar must be used within CollapsedTabBarProvider',
    );
  }
  return context;
}
