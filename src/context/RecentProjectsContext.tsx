import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  RECENT_PROJECTS,
  type RecentProjectId,
} from '../config/recentProjects';
import type { LayoutState } from '../types/layout';
import { cloneLayoutState } from '../utils/cloneLayoutState';

interface RecentProjectsContextValue {
  getLayoutForRecentProject: (projectId: RecentProjectId) => LayoutState;
  saveLayoutForRecentProject: (
    projectId: RecentProjectId,
    state: LayoutState,
  ) => void;
}

const RecentProjectsContext = createContext<RecentProjectsContextValue | null>(
  null,
);

function storageKey(projectId: RecentProjectId) {
  return `studio-recent-project-layout:${projectId}`;
}

function readStoredLayout(projectId: RecentProjectId): LayoutState | null {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    return cloneLayoutState(JSON.parse(raw) as LayoutState);
  } catch {
    return null;
  }
}

function writeStoredLayout(projectId: RecentProjectId, state: LayoutState) {
  localStorage.setItem(storageKey(projectId), JSON.stringify(state));
}

export function RecentProjectsProvider({ children }: { children: ReactNode }) {
  const getLayoutForRecentProject = useCallback((projectId: RecentProjectId) => {
    return (
      readStoredLayout(projectId) ??
      cloneLayoutState(RECENT_PROJECTS[projectId].createSeedLayout())
    );
  }, []);

  const saveLayoutForRecentProject = useCallback(
    (projectId: RecentProjectId, state: LayoutState) => {
      writeStoredLayout(projectId, cloneLayoutState(state));
    },
    [],
  );

  const value = useMemo(
    () => ({ getLayoutForRecentProject, saveLayoutForRecentProject }),
    [getLayoutForRecentProject, saveLayoutForRecentProject],
  );

  return (
    <RecentProjectsContext.Provider value={value}>
      {children}
    </RecentProjectsContext.Provider>
  );
}

export function useRecentProjects() {
  const context = useContext(RecentProjectsContext);
  if (!context) {
    throw new Error(
      'useRecentProjects must be used within RecentProjectsProvider',
    );
  }
  return context;
}

export function useRecentProjectsOptional() {
  return useContext(RecentProjectsContext);
}
