import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_WINDOW_SIZE_PRESET,
  type WindowSizePreset,
} from '../config/windowSizes';
import { PLACE_NAME, PROJECT_NAME } from '../config/project';
import { usePrimaryWindowIdOptional } from './PrimaryWindowContext';
import { useScopeTabsOptional } from './ScopeTabContext';
import { useStudio2026Enabled } from './Studio2026Context';

interface AppWindowContextValue {
  projectName: string;
  sizePreset: WindowSizePreset;
  setSizePreset: (preset: WindowSizePreset) => void;
}

const AppWindowContext = createContext<AppWindowContextValue | null>(null);

export function AppWindowProvider({ children }: { children: ReactNode }) {
  const [sizePreset, setSizePresetState] = useState<WindowSizePreset>(
    DEFAULT_WINDOW_SIZE_PRESET,
  );

  const setSizePreset = useCallback((preset: WindowSizePreset) => {
    setSizePresetState(preset);
  }, []);

  const value = useMemo(
    () => ({ projectName: PROJECT_NAME, sizePreset, setSizePreset }),
    [sizePreset, setSizePreset],
  );

  return (
    <AppWindowContext.Provider value={value}>{children}</AppWindowContext.Provider>
  );
}

export function useAppWindow() {
  const context = useContext(AppWindowContext);
  if (!context) {
    throw new Error('useAppWindow must be used within AppWindowProvider');
  }
  return context;
}

export function useProjectName() {
  const studio2026 = useStudio2026Enabled();
  const context = useContext(AppWindowContext);
  const windowId = usePrimaryWindowIdOptional();
  const scopeTabs = useScopeTabsOptional();

  if (windowId && scopeTabs) {
    const activeTabId = scopeTabs.getActiveTabForWindow(windowId);
    const activeTab = scopeTabs.tabs.find((tab) => tab.id === activeTabId);
    if (activeTab?.projectName) {
      if (studio2026 && activeTab.projectName === PROJECT_NAME) {
        return PLACE_NAME;
      }
      return activeTab.projectName;
    }
  }

  if (studio2026) {
    return PLACE_NAME;
  }

  return context?.projectName ?? PROJECT_NAME;
}
