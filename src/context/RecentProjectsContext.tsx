import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  adaptRecentLayoutForStudio2026,
  createRecentProjectSeedLayout,
  getRecentProjectStorageKey,
  type RecentProjectId,
} from '../config/recentProjects';
import type { LayoutState } from '../types/layout';
import { cloneLayoutState } from '../utils/cloneLayoutState';
import { useStudio2026Enabled } from './Studio2026Context';

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

function readStoredLayout(
  projectId: RecentProjectId,
  studio2026: boolean,
): LayoutState | null {
  try {
    const raw = localStorage.getItem(
      getRecentProjectStorageKey(projectId, studio2026),
    );
    if (!raw) return null;
    const parsed = cloneLayoutState(JSON.parse(raw) as LayoutState);
    return studio2026 ? adaptRecentLayoutForStudio2026(parsed) : parsed;
  } catch {
    return null;
  }
}

function writeStoredLayout(
  projectId: RecentProjectId,
  studio2026: boolean,
  state: LayoutState,
) {
  localStorage.setItem(
    getRecentProjectStorageKey(projectId, studio2026),
    JSON.stringify(state),
  );
}

export function RecentProjectsProvider({ children }: { children: ReactNode }) {
  const studio2026 = useStudio2026Enabled();

  const getLayoutForRecentProject = useCallback(
    (projectId: RecentProjectId) => {
      return (
        readStoredLayout(projectId, studio2026) ??
        cloneLayoutState(createRecentProjectSeedLayout(projectId, studio2026))
      );
    },
    [studio2026],
  );

  const saveLayoutForRecentProject = useCallback(
    (projectId: RecentProjectId, state: LayoutState) => {
      writeStoredLayout(projectId, studio2026, cloneLayoutState(state));
    },
    [studio2026],
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
