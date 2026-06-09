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
import { PROJECT_NAME } from '../config/project';

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
  const context = useContext(AppWindowContext);
  return context?.projectName ?? PROJECT_NAME;
}
