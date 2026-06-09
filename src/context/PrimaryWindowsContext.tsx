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
  WINDOW_SIZE_PRESETS,
} from '../config/windowSizes';

export interface PrimaryWindowBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_WIDTH = 800;
const MIN_HEIGHT = 500;
const INITIAL_WINDOW_ID = 'window-1';

function getContainerSize(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

function clampBounds(
  bounds: Omit<PrimaryWindowBounds, 'id'>,
  container: { width: number; height: number },
): Omit<PrimaryWindowBounds, 'id'> {
  const width = Math.min(Math.max(bounds.width, MIN_WIDTH), container.width);
  const height = Math.min(Math.max(bounds.height, MIN_HEIGHT), container.height);
  const x = Math.min(Math.max(bounds.x, 0), Math.max(0, container.width - width));
  const y = Math.min(Math.max(bounds.y, 0), Math.max(0, container.height - height));
  return { x, y, width, height };
}

function createInitialBounds(): Omit<PrimaryWindowBounds, 'id'> {
  const container = getContainerSize();
  const target = WINDOW_SIZE_PRESETS[DEFAULT_WINDOW_SIZE_PRESET];
  const width = Math.min(target.width, container.width);
  const height = Math.min(target.height, container.height);
  return clampBounds(
    {
      x: (container.width - width) / 2,
      y: (container.height - height) / 2,
      width,
      height,
    },
    container,
  );
}

function createWindowId() {
  return `window-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface PrimaryWindowsContextValue {
  windows: PrimaryWindowBounds[];
  getWindow: (windowId: string) => PrimaryWindowBounds | undefined;
  getWindowZIndex: (windowId: string) => number;
  focusWindow: (windowId: string) => void;
  updateWindowBounds: (
    windowId: string,
    bounds: Omit<PrimaryWindowBounds, 'id'>,
  ) => void;
  createWindowAt: (
    bounds: Partial<Omit<PrimaryWindowBounds, 'id'>>,
  ) => string;
  removeWindow: (windowId: string) => void;
}

const PrimaryWindowsContext = createContext<PrimaryWindowsContextValue | null>(
  null,
);

export function PrimaryWindowsProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<PrimaryWindowBounds[]>(() => [
    { id: INITIAL_WINDOW_ID, ...createInitialBounds() },
  ]);
  const [stackOrder, setStackOrder] = useState<string[]>([INITIAL_WINDOW_ID]);

  const getWindow = useCallback(
    (windowId: string) => windows.find((entry) => entry.id === windowId),
    [windows],
  );

  const focusWindow = useCallback((windowId: string) => {
    setStackOrder((current) => {
      if (!current.includes(windowId)) return current;
      if (current[current.length - 1] === windowId) return current;
      return [...current.filter((id) => id !== windowId), windowId];
    });
  }, []);

  const getWindowZIndex = useCallback(
    (windowId: string) => {
      const index = stackOrder.indexOf(windowId);
      return index === -1 ? 10 : 10 + index;
    },
    [stackOrder],
  );

  const updateWindowBounds = useCallback(
    (windowId: string, bounds: Omit<PrimaryWindowBounds, 'id'>) => {
      setWindows((current) =>
        current.map((entry) =>
          entry.id === windowId
            ? { id: windowId, ...clampBounds(bounds, getContainerSize()) }
            : entry,
        ),
      );
    },
    [],
  );

  const createWindowAt = useCallback(
    (bounds: Partial<Omit<PrimaryWindowBounds, 'id'>>) => {
      const id = createWindowId();
      const target = WINDOW_SIZE_PRESETS[DEFAULT_WINDOW_SIZE_PRESET];
      const nextBounds = clampBounds(
        {
          x: bounds.x ?? 120,
          y: bounds.y ?? 80,
          width: bounds.width ?? target.width,
          height: bounds.height ?? target.height,
        },
        getContainerSize(),
      );

      setWindows((current) => [...current, { id, ...nextBounds }]);
      setStackOrder((current) => [...current, id]);
      return id;
    },
    [],
  );

  const removeWindow = useCallback((windowId: string) => {
    setWindows((current) => {
      if (current.length <= 1) return current;
      return current.filter((entry) => entry.id !== windowId);
    });
    setStackOrder((current) => current.filter((id) => id !== windowId));
  }, []);

  const value = useMemo(
    () => ({
      windows,
      getWindow,
      getWindowZIndex,
      focusWindow,
      updateWindowBounds,
      createWindowAt,
      removeWindow,
    }),
    [
      windows,
      getWindow,
      getWindowZIndex,
      focusWindow,
      updateWindowBounds,
      createWindowAt,
      removeWindow,
    ],
  );

  return (
    <PrimaryWindowsContext.Provider value={value}>
      {children}
    </PrimaryWindowsContext.Provider>
  );
}

export function usePrimaryWindows() {
  const context = useContext(PrimaryWindowsContext);
  if (!context) {
    throw new Error('usePrimaryWindows must be used within PrimaryWindowsProvider');
  }
  return context;
}

export { INITIAL_WINDOW_ID };
