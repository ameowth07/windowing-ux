import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_MONITOR_COUNT,
  type MonitorCount,
} from '../config/monitorLayout';

const STORAGE_KEY = 'studio-monitor-count';

interface MonitorLayoutContextValue {
  monitorCount: MonitorCount;
  setMonitorCount: (count: MonitorCount) => void;
}

const MonitorLayoutContext = createContext<MonitorLayoutContextValue | null>(
  null,
);

function readStoredMonitorCount(): MonitorCount {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === '1' || stored === '2' || stored === '3') {
      return Number(stored) as MonitorCount;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_MONITOR_COUNT;
}

export function MonitorLayoutProvider({ children }: { children: ReactNode }) {
  const [monitorCount, setMonitorCountState] = useState(readStoredMonitorCount);

  const setMonitorCount = useCallback((count: MonitorCount) => {
    setMonitorCountState(count);
    try {
      sessionStorage.setItem(STORAGE_KEY, String(count));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ monitorCount, setMonitorCount }),
    [monitorCount, setMonitorCount],
  );

  return (
    <MonitorLayoutContext.Provider value={value}>
      {children}
    </MonitorLayoutContext.Provider>
  );
}

export function useMonitorLayout() {
  const context = useContext(MonitorLayoutContext);
  if (!context) {
    throw new Error('useMonitorLayout must be used within MonitorLayoutProvider');
  }
  return context;
}
