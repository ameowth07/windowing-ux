import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getRecentProjectTabId,
  RECENT_PROJECTS,
  type RecentProjectId,
} from '../config/recentProjects';
import { PROJECT_NAME } from '../config/project';
import { usePrimaryWindowIdOptional } from './PrimaryWindowContext';
import { INITIAL_WINDOW_ID, usePrimaryWindows } from './PrimaryWindowsContext';

export type ScopeTabIcon = 'project' | 'asset-ui' | 'asset-avatar';

export function normalizeScopeTabIcon(icon: string): ScopeTabIcon {
  switch (icon) {
    case 'project':
    case 'asset-ui':
    case 'asset-avatar':
      return icon;
    case 'asset-mesh':
      return 'asset-ui';
    default:
      return 'project';
  }
}

function normalizeScopeTab(tab: ScopeTab): ScopeTab {
  return {
    ...tab,
    icon: normalizeScopeTabIcon(tab.icon),
  };
}

export interface ScopeTab {
  id: string;
  label: 'Project' | 'Asset';
  icon: ScopeTabIcon;
  windowId: string;
  projectName?: string;
  recentProjectId?: RecentProjectId;
  /** When true, the Place document renders empty (no skeleton preview). */
  emptyPlace?: boolean;
}

const INITIAL_TABS: ScopeTab[] = [
  { id: 'project-1', label: 'Project', icon: 'project', windowId: INITIAL_WINDOW_ID },
  { id: 'project-2', label: 'Project', icon: 'project', windowId: INITIAL_WINDOW_ID },
  { id: 'asset-1', label: 'Asset', icon: 'asset-ui', windowId: INITIAL_WINDOW_ID },
  { id: 'asset-2', label: 'Asset', icon: 'asset-avatar', windowId: INITIAL_WINDOW_ID },
];

const DEFAULT_ACTIVE_TAB_ID = 'project-2';

function createProjectTabId(existingTabs: ScopeTab[]): string {
  let max = 0;
  for (const tab of existingTabs) {
    const match = tab.id.match(/^project-(\d+)$/);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `project-${max + 1}`;
}

interface ScopeTabContextValue {
  tabs: ScopeTab[];
  activeTabId: string;
  getTabsForWindow: (windowId: string) => ScopeTab[];
  getActiveTabForWindow: (windowId: string) => string;
  setActiveTabId: (tabId: string) => void;
  setActiveTabForWindow: (windowId: string, tabId: string) => void;
  closeTab: (tabId: string) => void;
  detachTabToNewWindow: (
    tabId: string,
    bounds: {
      monitorIndex?: number;
      x: number;
      y: number;
      width?: number;
      height?: number;
    },
  ) => void;
  attachTabToWindow: (tabId: string, targetWindowId: string) => void;
  reorderTabInWindow: (
    windowId: string,
    tabId: string,
    toIndex: number,
  ) => void;
  closePrimaryWindow: (windowId: string) => void;
  createNewProject: () => string;
  openRecentProject: (projectId: RecentProjectId) => string;
}

const ScopeTabContext = createContext<ScopeTabContextValue | null>(null);

function getNeighborTabId(tabs: ScopeTab[], closedIndex: number): string {
  const neighbor = tabs[closedIndex] ?? tabs[closedIndex - 1];
  return neighbor?.id ?? tabs[0].id;
}

export function ScopeTabProvider({ children }: { children: ReactNode }) {
  const { windows, createWindowAt, removeWindow, focusWindow, getFocusedWindow } =
    usePrimaryWindows();
  const [tabs, setTabs] = useState(() => INITIAL_TABS.map(normalizeScopeTab));

  useEffect(() => {
    setTabs((current) => {
      const next = current.map(normalizeScopeTab);
      const changed = next.some(
        (tab, index) => tab.icon !== current[index]?.icon,
      );
      return changed ? next : current;
    });
  }, []);
  const [activeTabByWindow, setActiveTabByWindow] = useState<
    Record<string, string>
  >(() => ({
    [INITIAL_WINDOW_ID]: DEFAULT_ACTIVE_TAB_ID,
  }));

  const getTabsForWindow = useCallback(
    (windowId: string) => tabs.filter((tab) => tab.windowId === windowId),
    [tabs],
  );

  const getActiveTabForWindow = useCallback(
    (windowId: string) => {
      const windowTabs = tabs.filter((tab) => tab.windowId === windowId);
      const active = activeTabByWindow[windowId];
      if (active && windowTabs.some((tab) => tab.id === active)) {
        return active;
      }
      return windowTabs[0]?.id ?? DEFAULT_ACTIVE_TAB_ID;
    },
    [tabs, activeTabByWindow],
  );

  const setActiveTabForWindow = useCallback((windowId: string, tabId: string) => {
    setActiveTabByWindow((current) => ({ ...current, [windowId]: tabId }));
  }, []);

  const setActiveTabId = useCallback(
    (tabId: string) => {
      const tab = tabs.find((entry) => entry.id === tabId);
      if (!tab) return;
      setActiveTabForWindow(tab.windowId, tabId);
    },
    [tabs, setActiveTabForWindow],
  );

  const activeTabId = useMemo(
    () => activeTabByWindow[INITIAL_WINDOW_ID] ?? DEFAULT_ACTIVE_TAB_ID,
    [activeTabByWindow],
  );

  const closeTab = useCallback(
    (tabId: string) => {
      const tab = tabs.find((entry) => entry.id === tabId);
      if (!tab) return;

      const windowTabs = tabs.filter((entry) => entry.windowId === tab.windowId);
      if (windowTabs.length <= 1) return;

      setTabs((current) => {
        const closedIndex = current.findIndex((entry) => entry.id === tabId);
        if (closedIndex === -1) return current;

        const nextTabs = current.filter((entry) => entry.id !== tabId);
        setActiveTabByWindow((currentActive) => {
          if (currentActive[tab.windowId] !== tabId) return currentActive;
          const remaining = nextTabs.filter(
            (entry) => entry.windowId === tab.windowId,
          );
          return {
            ...currentActive,
            [tab.windowId]: getNeighborTabId(remaining, closedIndex),
          };
        });
        return nextTabs;
      });
    },
    [tabs],
  );

  const moveTabToWindow = useCallback(
    (tabId: string, targetWindowId: string) => {
      const tab = tabs.find((entry) => entry.id === tabId);
      if (!tab || tab.windowId === targetWindowId) return;

      const sourceWindowId = tab.windowId;
      const sourceTabs = tabs.filter((entry) => entry.windowId === sourceWindowId);
      const isLastTabInSource = sourceTabs.length === 1;

      setTabs((current) =>
        current.map((entry) =>
          entry.id === tabId ? { ...entry, windowId: targetWindowId } : entry,
        ),
      );

      setActiveTabByWindow((current) => {
        const next = { ...current, [targetWindowId]: tabId };
        if (current[sourceWindowId] === tabId) {
          const remaining = tabs.filter(
            (entry) => entry.windowId === sourceWindowId && entry.id !== tabId,
          );
          if (remaining.length > 0) {
            const closedIndex = sourceTabs.findIndex((entry) => entry.id === tabId);
            next[sourceWindowId] = getNeighborTabId(remaining, closedIndex);
          } else {
            delete next[sourceWindowId];
          }
        }
        return next;
      });

      if (isLastTabInSource) {
        removeWindow(sourceWindowId);
      }
    },
    [tabs, removeWindow],
  );

  const detachTabToNewWindow = useCallback(
    (
      tabId: string,
      bounds: {
        monitorIndex?: number;
        x: number;
        y: number;
        width?: number;
        height?: number;
      },
    ) => {
      const tab = tabs.find((entry) => entry.id === tabId);
      if (!tab) return;

      const newWindowId = createWindowAt(bounds);

      moveTabToWindow(tabId, newWindowId);
    },
    [tabs, createWindowAt, moveTabToWindow],
  );

  const attachTabToWindow = useCallback(
    (tabId: string, targetWindowId: string) => {
      moveTabToWindow(tabId, targetWindowId);
    },
    [moveTabToWindow],
  );

  const closePrimaryWindow = useCallback(
    (windowId: string) => {
      const isLastWindow = windows.length <= 1;

      setTabs((current) => current.filter((tab) => tab.windowId !== windowId));
      setActiveTabByWindow((current) => {
        const next = { ...current };
        delete next[windowId];
        return next;
      });

      if (isLastWindow) {
        const newWindowId = createWindowAt({});
        setTabs(
          INITIAL_TABS.map((tab) => ({
            ...normalizeScopeTab(tab),
            windowId: newWindowId,
          })),
        );
        setActiveTabByWindow({ [newWindowId]: DEFAULT_ACTIVE_TAB_ID });
        removeWindow(windowId);
        focusWindow(newWindowId);
        return;
      }

      const survivorId = windows.find((entry) => entry.id !== windowId)?.id;
      removeWindow(windowId);
      if (survivorId) {
        focusWindow(survivorId);
      }
    },
    [windows, createWindowAt, removeWindow, focusWindow],
  );

  const createNewProject = useCallback(() => {
    const newTabId = createProjectTabId(tabs);
    const focusedWindow = getFocusedWindow();
    const newWindowId = createWindowAt(
      {},
      focusedWindow ? { cascadeFromWindowId: focusedWindow.id } : undefined,
    );

    setTabs((current) => [
      ...current,
      {
        id: newTabId,
        label: 'Project',
        icon: 'project',
        windowId: newWindowId,
        projectName: PROJECT_NAME,
        emptyPlace: true,
      },
    ]);
    setActiveTabByWindow((current) => ({
      ...current,
      [newWindowId]: newTabId,
    }));
    focusWindow(newWindowId);
    return newWindowId;
  }, [tabs, createWindowAt, focusWindow, getFocusedWindow]);

  const openRecentProject = useCallback(
    (projectId: RecentProjectId) => {
      const existing = tabs.find((tab) => tab.recentProjectId === projectId);
      if (existing) {
        focusWindow(existing.windowId);
        setActiveTabForWindow(existing.windowId, existing.id);
        return existing.windowId;
      }

      const project = RECENT_PROJECTS[projectId];
      const focusedWindow = getFocusedWindow();
      const newWindowId = createWindowAt(
        {},
        focusedWindow ? { cascadeFromWindowId: focusedWindow.id } : undefined,
      );
      const tabId = getRecentProjectTabId(projectId);

      setTabs((current) => [
        ...current,
        {
          id: tabId,
          label: 'Project',
          icon: 'project',
          windowId: newWindowId,
          projectName: project.label,
          recentProjectId: projectId,
          emptyPlace: project.emptyPlace,
        },
      ]);
      setActiveTabByWindow((current) => ({
        ...current,
        [newWindowId]: tabId,
      }));
      focusWindow(newWindowId);
      return newWindowId;
    },
    [tabs, createWindowAt, focusWindow, getFocusedWindow, setActiveTabForWindow],
  );

  const reorderTabInWindow = useCallback(
    (windowId: string, tabId: string, toIndex: number) => {
      setTabs((current) => {
        const windowTabIds = current
          .filter((tab) => tab.windowId === windowId)
          .map((tab) => tab.id);
        const fromIndex = windowTabIds.indexOf(tabId);
        if (fromIndex === -1) return current;

        const targetIndex = Math.max(
          0,
          Math.min(toIndex, windowTabIds.length - 1),
        );
        if (targetIndex === fromIndex) return current;

        const reordered = [...windowTabIds];
        reordered.splice(fromIndex, 1);
        reordered.splice(targetIndex, 0, tabId);
        if (reordered.join(',') === windowTabIds.join(',')) return current;

        const windowTabMap = new Map(
          current
            .filter((tab) => tab.windowId === windowId)
            .map((tab) => [tab.id, tab]),
        );
        const reorderedWindowTabs = reordered.map(
          (id) => windowTabMap.get(id)!,
        );

        const next: ScopeTab[] = [];
        let inserted = false;
        for (const tab of current) {
          if (tab.windowId === windowId) {
            if (!inserted) {
              next.push(...reorderedWindowTabs);
              inserted = true;
            }
            continue;
          }
          next.push(tab);
        }
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      tabs,
      activeTabId,
      getTabsForWindow,
      getActiveTabForWindow,
      setActiveTabId,
      setActiveTabForWindow,
      closeTab,
      detachTabToNewWindow,
      attachTabToWindow,
      reorderTabInWindow,
      closePrimaryWindow,
      createNewProject,
      openRecentProject,
    }),
    [
      tabs,
      activeTabId,
      getTabsForWindow,
      getActiveTabForWindow,
      setActiveTabId,
      setActiveTabForWindow,
      closeTab,
      detachTabToNewWindow,
      attachTabToWindow,
      reorderTabInWindow,
      closePrimaryWindow,
      createNewProject,
      openRecentProject,
    ],
  );

  return (
    <ScopeTabContext.Provider value={value}>{children}</ScopeTabContext.Provider>
  );
}

export function useScopeTabsOptional() {
  return useContext(ScopeTabContext);
}

export function useScopeTabs() {
  const context = useScopeTabsOptional();
  if (!context) {
    throw new Error('useScopeTabs must be used within ScopeTabProvider');
  }
  return context;
}

export function useScopeTabsForWindow(windowId: string) {
  const {
    getTabsForWindow,
    getActiveTabForWindow,
    setActiveTabForWindow,
    closeTab,
    detachTabToNewWindow,
    attachTabToWindow,
    reorderTabInWindow,
  } = useScopeTabs();

  return useMemo(
    () => ({
      tabs: getTabsForWindow(windowId),
      activeTabId: getActiveTabForWindow(windowId),
      setActiveTabId: (tabId: string) => setActiveTabForWindow(windowId, tabId),
      closeTab,
      detachTabToNewWindow,
      attachTabToWindow,
      reorderTabInWindow: (tabId: string, toIndex: number) =>
        reorderTabInWindow(windowId, tabId, toIndex),
    }),
    [
      windowId,
      getTabsForWindow,
      getActiveTabForWindow,
      setActiveTabForWindow,
      closeTab,
      detachTabToNewWindow,
      attachTabToWindow,
      reorderTabInWindow,
    ],
  );
}

export function isScopeTabEmptyPlace(
  scopeTabId: string,
  tabs: ScopeTab[],
): boolean {
  return tabs.find((tab) => tab.id === scopeTabId)?.emptyPlace ?? false;
}

export function useScopeTabLabel(scopeTabId?: string): string | null {
  const { tabs, getActiveTabForWindow } = useScopeTabs();
  const windowId = usePrimaryWindowIdOptional();
  const id =
    scopeTabId ?? (windowId ? getActiveTabForWindow(windowId) : undefined);
  if (!id) return null;
  return tabs.find((tab) => tab.id === id)?.label ?? null;
}
