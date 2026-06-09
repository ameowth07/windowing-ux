import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

interface MonitorWindowsContextValue {
  getContainerElement: (monitorIndex: number) => HTMLElement | null;
  registerContainer: (monitorIndex: number, element: HTMLElement | null) => void;
}

const MonitorWindowsContext = createContext<MonitorWindowsContextValue | null>(
  null,
);

export function MonitorWindowsProvider({ children }: { children: ReactNode }) {
  const containersRef = useRef<Map<number, HTMLElement>>(new Map());

  const registerContainer = useCallback(
    (monitorIndex: number, element: HTMLElement | null) => {
      if (element) {
        containersRef.current.set(monitorIndex, element);
      } else {
        containersRef.current.delete(monitorIndex);
      }
    },
    [],
  );

  const getContainerElement = useCallback((monitorIndex: number) => {
    return containersRef.current.get(monitorIndex) ?? null;
  }, []);

  const value = useMemo(
    () => ({ getContainerElement, registerContainer }),
    [getContainerElement, registerContainer],
  );

  return (
    <MonitorWindowsContext.Provider value={value}>
      {children}
    </MonitorWindowsContext.Provider>
  );
}

export function useMonitorWindows() {
  const context = useContext(MonitorWindowsContext);
  if (!context) {
    throw new Error('useMonitorWindows must be used within MonitorWindowsProvider');
  }
  return context;
}
