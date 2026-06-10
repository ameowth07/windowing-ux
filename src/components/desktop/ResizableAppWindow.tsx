import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import {
  WINDOW_SIZE_PRESETS,
  type WindowSizePreset,
} from '../../config/windowSizes';
import { useAppWindow } from '../../context/AppWindowContext';
import { useMonitorLayout } from '../../context/MonitorLayoutContext';
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';
import { clampPrimaryWindowBounds } from '../../utils/primaryWindowPosition';
import { getWindowContainerSize } from '../../utils/monitorSpace';
import './ResizableAppWindow.css';

const MIN_WIDTH = 800;
const MIN_HEIGHT = 500;

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface WindowBounds {
  monitorIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizableAppWindowProps {
  windowId: string;
  disabled?: boolean;
  children:
    | ReactNode
    | ((startWindowDrag: (event: React.MouseEvent) => void) => ReactNode);
}

function getBoundsForPreset(
  preset: WindowSizePreset,
  monitorIndex: number,
  monitorCount: number,
): WindowBounds {
  const container = getWindowContainerSize(monitorIndex, monitorCount);
  const target = WINDOW_SIZE_PRESETS[preset];
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

export function ResizableAppWindow({
  windowId,
  disabled = false,
  children,
}: ResizableAppWindowProps) {
  const { sizePreset } = useAppWindow();
  const { monitorCount } = useMonitorLayout();
  const { getWindow, updateWindowBounds, startWindowDrag } = usePrimaryWindows();
  const windowRef = useRef<HTMLDivElement>(null);
  const stored = getWindow(windowId);
  const bounds: WindowBounds = stored ?? {
    monitorIndex: 0,
    x: 0,
    y: 0,
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  };
  const resizeRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    orig: WindowBounds;
  } | null>(null);

  const clampToMonitor = useCallback(
    (next: WindowBounds) => clampPrimaryWindowBounds(next, monitorCount),
    [monitorCount],
  );

  const setBounds = useCallback(
    (next: WindowBounds) => {
      updateWindowBounds(windowId, clampToMonitor(next));
    },
    [windowId, updateWindowBounds, clampToMonitor],
  );

  const prevPresetRef = useRef(sizePreset);

  useEffect(() => {
    if (prevPresetRef.current === sizePreset) return;

    prevPresetRef.current = sizePreset;
    setBounds(getBoundsForPreset(sizePreset, bounds.monitorIndex, monitorCount));
  }, [sizePreset, setBounds, bounds.monitorIndex, monitorCount]);

  useEffect(() => {
    const handleResize = () => {
      const current = getWindow(windowId);
      if (!current) return;
      updateWindowBounds(windowId, clampPrimaryWindowBounds(current, monitorCount));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowId, getWindow, updateWindowBounds, monitorCount]);

  const handleWindowDragStart = useCallback(
    (event: React.MouseEvent) => {
      if (disabled) return;
      const target = event.target as HTMLElement;
      if (
        target.closest(
          'button, input, a, .save-layout-dialog, .dependent-window-layer',
        )
      ) {
        return;
      }
      event.preventDefault();
      startWindowDrag(windowId, event.clientX, event.clientY);
    },
    [disabled, startWindowDrag, windowId],
  );

  const startResize = useCallback(
    (edge: ResizeEdge, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      resizeRef.current = {
        edge,
        startX: event.clientX,
        startY: event.clientY,
        orig: bounds,
      };
    },
    [bounds],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;

      const { edge, startX, startY, orig } = resizeRef.current;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      let { x, y, width, height } = orig;

      if (edge.includes('e')) width = orig.width + dx;
      if (edge.includes('w')) {
        width = orig.width - dx;
        x = orig.x + dx;
      }
      if (edge.includes('s')) height = orig.height + dy;
      if (edge.includes('n')) {
        height = orig.height - dy;
        y = orig.y + dy;
      }

      setBounds({ ...orig, x, y, width, height });
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setBounds]);

  const edges: ResizeEdge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  const content =
    typeof children === 'function' ? children(handleWindowDragStart) : children;

  return (
    <div
      ref={windowRef}
      className="resizable-app-window"
      data-primary-window-id={windowId}
    >
      {content}
      {edges.map((edge) => (
        <div
          key={edge}
          className={`resizable-app-window__resize resizable-app-window__resize--${edge}`}
          onMouseDown={(event) => startResize(edge, event)}
        />
      ))}
    </div>
  );
}
