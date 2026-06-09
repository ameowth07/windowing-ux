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
import {
  DEFAULT_WINDOW_SIZE_PRESET,
  WINDOW_SIZE_PRESETS,
} from '../config/windowSizes';
import { useMonitorLayout } from './MonitorLayoutContext';
import { getCascadedPrimaryWindowBounds, clampPrimaryWindowBounds } from '../utils/primaryWindowPosition';
import {
  getMonitorIndexAtPoint,
  getWindowContainerElement,
  getWindowContainerSize,
} from '../utils/monitorSpace';

export interface PrimaryWindowBounds {
  id: string;
  monitorIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const INITIAL_WINDOW_ID = 'window-1';

function createInitialBounds(monitorCount: number): Omit<PrimaryWindowBounds, 'id'> {
  const monitorIndex = 0;
  const container = getWindowContainerSize(monitorIndex, monitorCount);
  const target = WINDOW_SIZE_PRESETS[DEFAULT_WINDOW_SIZE_PRESET];
  const width = Math.min(target.width, container.width);
  const height = Math.min(target.height, container.height);
  return clampPrimaryWindowBounds(
    {
      monitorIndex,
      x: (container.width - width) / 2,
      y: (container.height - height) / 2,
      width,
      height,
    },
    monitorCount,
  );
}

function createWindowId() {
  return `window-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface WindowDragSession {
  windowId: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface PrimaryWindowsContextValue {
  windows: PrimaryWindowBounds[];
  getWindow: (windowId: string) => PrimaryWindowBounds | undefined;
  getFocusedWindow: () => PrimaryWindowBounds | undefined;
  getWindowZIndex: (windowId: string) => number;
  focusWindow: (windowId: string) => void;
  updateWindowBounds: (
    windowId: string,
    bounds: Omit<PrimaryWindowBounds, 'id'>,
    options?: { clamp?: boolean },
  ) => void;
  createWindowAt: (
    bounds: Partial<Omit<PrimaryWindowBounds, 'id'>>,
    options?: { cascadeFromWindowId?: string },
  ) => string;
  draggingWindowId: string | null;
  dragScreenPosition: { x: number; y: number } | null;
  dragTargetMonitorIndex: number | null;
  startWindowDrag: (windowId: string, clientX: number, clientY: number) => void;
  removeWindow: (windowId: string) => void;
}

const PrimaryWindowsContext = createContext<PrimaryWindowsContextValue | null>(
  null,
);

export function PrimaryWindowsProvider({ children }: { children: ReactNode }) {
  const { monitorCount } = useMonitorLayout();
  const [windows, setWindows] = useState<PrimaryWindowBounds[]>(() => [
    { id: INITIAL_WINDOW_ID, ...createInitialBounds(1) },
  ]);
  const [stackOrder, setStackOrder] = useState<string[]>([INITIAL_WINDOW_ID]);
  const [draggingWindowId, setDraggingWindowId] = useState<string | null>(null);
  const [dragScreenPosition, setDragScreenPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragTargetMonitorIndex, setDragTargetMonitorIndex] = useState<number | null>(
    null,
  );
  const dragSessionRef = useRef<WindowDragSession | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setWindows((current) =>
        current.map((entry) => ({
          ...entry,
          ...clampPrimaryWindowBounds(entry, monitorCount),
        })),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [monitorCount]);

  const getWindow = useCallback(
    (windowId: string) => windows.find((entry) => entry.id === windowId),
    [windows],
  );

  const getFocusedWindow = useCallback(() => {
    const focusedId = stackOrder[stackOrder.length - 1];
    return focusedId ? windows.find((entry) => entry.id === focusedId) : undefined;
  }, [windows, stackOrder]);

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
    (
      windowId: string,
      bounds: Omit<PrimaryWindowBounds, 'id'>,
      options?: { clamp?: boolean },
    ) => {
      setWindows((current) =>
        current.map((entry) =>
          entry.id === windowId
            ? {
                id: windowId,
                ...(options?.clamp === false ? bounds : clampPrimaryWindowBounds(bounds, monitorCount)),
              }
            : entry,
        ),
      );
    },
    [monitorCount],
  );

  const startWindowDrag = useCallback(
    (windowId: string, clientX: number, clientY: number) => {
      const window = windows.find((entry) => entry.id === windowId);
      if (!window) return;

      const container = getWindowContainerElement(window.monitorIndex, monitorCount);
      const rect = container?.getBoundingClientRect();
      const windowScreenX = (rect?.left ?? 0) + window.x;
      const windowScreenY = (rect?.top ?? 0) + window.y;

      dragSessionRef.current = {
        windowId,
        offsetX: clientX - windowScreenX,
        offsetY: clientY - windowScreenY,
        width: window.width,
        height: window.height,
      };
      setDraggingWindowId(windowId);
      if (monitorCount > 1) {
        setDragScreenPosition({
          x: clientX - dragSessionRef.current.offsetX,
          y: clientY - dragSessionRef.current.offsetY,
        });
        setDragTargetMonitorIndex(window.monitorIndex);
      } else {
        setDragScreenPosition(null);
        setDragTargetMonitorIndex(null);
      }
      focusWindow(windowId);
    },
    [windows, monitorCount, focusWindow],
  );

  useEffect(() => {
    if (!draggingWindowId) return;

    const handleMouseMove = (event: MouseEvent) => {
      const drag = dragSessionRef.current;
      if (!drag || drag.windowId !== draggingWindowId) return;

      if (monitorCount > 1) {
        setDragScreenPosition({
          x: event.clientX - drag.offsetX,
          y: event.clientY - drag.offsetY,
        });
        setDragTargetMonitorIndex(getMonitorIndexAtPoint(event.clientX, event.clientY));
        return;
      }

      const monitorIndex = getMonitorIndexAtPoint(event.clientX, event.clientY);
      const container = getWindowContainerElement(monitorIndex, monitorCount);
      const rect = container?.getBoundingClientRect();
      const x = event.clientX - drag.offsetX - (rect?.left ?? 0);
      const y = event.clientY - drag.offsetY - (rect?.top ?? 0);

      updateWindowBounds(
        drag.windowId,
        {
          monitorIndex,
          x,
          y,
          width: drag.width,
          height: drag.height,
        },
        { clamp: false },
      );
    };

    const handleMouseUp = (event: MouseEvent) => {
      const drag = dragSessionRef.current;
      if (!drag) return;

      const monitorIndex = getMonitorIndexAtPoint(event.clientX, event.clientY);
      const container = getWindowContainerElement(monitorIndex, monitorCount);
      const rect = container?.getBoundingClientRect();
      const x = event.clientX - drag.offsetX - (rect?.left ?? 0);
      const y = event.clientY - drag.offsetY - (rect?.top ?? 0);

      updateWindowBounds(drag.windowId, {
        monitorIndex,
        x,
        y,
        width: drag.width,
        height: drag.height,
      });

      dragSessionRef.current = null;
      setDraggingWindowId(null);
      setDragScreenPosition(null);
      setDragTargetMonitorIndex(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingWindowId, monitorCount, updateWindowBounds]);

  const createWindowAt = useCallback(
    (
      bounds: Partial<Omit<PrimaryWindowBounds, 'id'>>,
      options?: { cascadeFromWindowId?: string },
    ) => {
      const id = createWindowId();
      const target = WINDOW_SIZE_PRESETS[DEFAULT_WINDOW_SIZE_PRESET];
      const monitorIndex = bounds.monitorIndex ?? 0;

      setWindows((current) => {
        const referenceWindow = options?.cascadeFromWindowId
          ? current.find((entry) => entry.id === options.cascadeFromWindowId)
          : undefined;
        const referenceMonitorIndex = referenceWindow?.monitorIndex ?? monitorIndex;
        const container = getWindowContainerSize(referenceMonitorIndex, monitorCount);
        const baseBounds = referenceWindow
          ? getCascadedPrimaryWindowBounds(referenceWindow, container)
          : {
              x: bounds.x ?? 120,
              y: bounds.y ?? 80,
              width: bounds.width ?? target.width,
              height: bounds.height ?? target.height,
            };
        const nextBounds = clampPrimaryWindowBounds(
          {
            monitorIndex: bounds.monitorIndex ?? referenceMonitorIndex,
            x: bounds.x ?? baseBounds.x,
            y: bounds.y ?? baseBounds.y,
            width: bounds.width ?? baseBounds.width,
            height: bounds.height ?? baseBounds.height,
          },
          monitorCount,
        );

        return [...current, { id, ...nextBounds }];
      });
      setStackOrder((current) => [...current, id]);
      return id;
    },
    [monitorCount],
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
      getFocusedWindow,
      getWindowZIndex,
      focusWindow,
      updateWindowBounds,
      createWindowAt,
      removeWindow,
      draggingWindowId,
      dragScreenPosition,
      dragTargetMonitorIndex,
      startWindowDrag,
    }),
    [
      windows,
      getWindow,
      getFocusedWindow,
      getWindowZIndex,
      focusWindow,
      updateWindowBounds,
      createWindowAt,
      removeWindow,
      draggingWindowId,
      dragScreenPosition,
      dragTargetMonitorIndex,
      startWindowDrag,
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
