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
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';
import './ResizableAppWindow.css';

const MIN_WIDTH = 800;
const MIN_HEIGHT = 500;

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizableAppWindowProps {
  windowId: string;
  children:
    | ReactNode
    | ((startWindowDrag: (event: React.MouseEvent) => void) => ReactNode);
}

function getDesktopContainerSize(
  element: HTMLElement | null,
): { width: number; height: number } {
  const desktop = element?.closest('.desktop__windows');
  if (desktop instanceof HTMLElement) {
    return { width: desktop.clientWidth, height: desktop.clientHeight };
  }

  return { width: window.innerWidth, height: window.innerHeight };
}

function clampBounds(
  bounds: WindowBounds,
  container: { width: number; height: number },
): WindowBounds {
  const maxWidth = container.width;
  const maxHeight = container.height;
  const width = Math.min(Math.max(bounds.width, MIN_WIDTH), maxWidth);
  const height = Math.min(Math.max(bounds.height, MIN_HEIGHT), maxHeight);
  const x = Math.min(Math.max(bounds.x, 0), Math.max(0, container.width - width));
  const y = Math.min(Math.max(bounds.y, 0), Math.max(0, container.height - height));

  return { x, y, width, height };
}

function getBoundsForPreset(
  preset: WindowSizePreset,
  container: { width: number; height: number },
): WindowBounds {
  const target = WINDOW_SIZE_PRESETS[preset];
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

export function ResizableAppWindow({ windowId, children }: ResizableAppWindowProps) {
  const { sizePreset } = useAppWindow();
  const { getWindow, updateWindowBounds } = usePrimaryWindows();
  const windowRef = useRef<HTMLDivElement>(null);
  const stored = getWindow(windowId);
  const bounds: WindowBounds = stored ?? {
    x: 0,
    y: 0,
    width: MIN_WIDTH,
    height: MIN_HEIGHT,
  };
  const dragRef = useRef<{
    startX: number;
    startY: number;
    orig: WindowBounds;
  } | null>(null);
  const resizeRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    orig: WindowBounds;
  } | null>(null);

  const clampToDesktop = useCallback((next: WindowBounds) => {
    const container = getDesktopContainerSize(windowRef.current);
    return clampBounds(next, container);
  }, []);

  const setBounds = useCallback(
    (next: WindowBounds) => {
      updateWindowBounds(windowId, clampToDesktop(next));
    },
    [windowId, updateWindowBounds, clampToDesktop],
  );

  const hasAppliedPresetRef = useRef(false);

  useEffect(() => {
    const element = windowRef.current;
    if (!element) return;

    if (hasAppliedPresetRef.current) {
      setBounds(getBoundsForPreset(sizePreset, getDesktopContainerSize(element)));
    } else {
      hasAppliedPresetRef.current = true;
    }
  }, [sizePreset, setBounds]);

  useEffect(() => {
    const element = windowRef.current;
    if (!element) return;

    const handleResize = () => {
      const current = getWindow(windowId);
      if (!current) return;
      updateWindowBounds(
        windowId,
        clampBounds(
          {
            x: current.x,
            y: current.y,
            width: current.width,
            height: current.height,
          },
          getDesktopContainerSize(element),
        ),
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowId, getWindow, updateWindowBounds]);

  const startWindowDrag = useCallback(
    (event: React.MouseEvent) => {
      if ((event.target as HTMLElement).closest('button, input, a')) return;
      event.preventDefault();
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        orig: bounds,
      };
    },
    [bounds],
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
      if (dragRef.current) {
        const dx = event.clientX - dragRef.current.startX;
        const dy = event.clientY - dragRef.current.startY;
        setBounds({
          ...dragRef.current.orig,
          x: dragRef.current.orig.x + dx,
          y: dragRef.current.orig.y + dy,
        });
        return;
      }

      if (resizeRef.current) {
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

        setBounds({ x, y, width, height });
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
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
    typeof children === 'function' ? children(startWindowDrag) : children;

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
