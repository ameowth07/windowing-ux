import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_PROJECT_TAB_BAR_ENABLED } from '../config/projectTabBar';
import { useStudio2026Enabled } from './Studio2026Context';

const STORAGE_KEY = 'studio-project-tab-bar-enabled';

interface ProjectTabBarContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const ProjectTabBarContext = createContext<ProjectTabBarContextValue | null>(null);

function readStoredEnabled(): boolean {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return DEFAULT_PROJECT_TAB_BAR_ENABLED;
}

export function ProjectTabBarProvider({ children }: { children: ReactNode }) {
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
    <ProjectTabBarContext.Provider value={value}>
      {children}
    </ProjectTabBarContext.Provider>
  );
}

export function useProjectTabBar() {
  const context = useContext(ProjectTabBarContext);
  if (!context) {
    throw new Error('useProjectTabBar must be used within ProjectTabBarProvider');
  }
  return context;
}

export function useProjectTabBarEnabled(override?: boolean): boolean {
  const studio2026 = useStudio2026Enabled();
  if (studio2026) return false;
  const context = useContext(ProjectTabBarContext);
  if (override !== undefined) return override;
  return context?.enabled ?? DEFAULT_PROJECT_TAB_BAR_ENABLED;
}
