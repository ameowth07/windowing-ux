import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useMonitorLayout } from '../../context/MonitorLayoutContext';
import { useMonitorWindows } from '../../context/MonitorWindowsContext';
import { usePrimaryWindowIdOptional } from '../../context/PrimaryWindowContext';
import { useProjectName } from '../../context/AppWindowContext';
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';
import { useStudio2026Enabled } from '../../context/Studio2026Context';
import { useRegisterBlockingDialog } from '../../context/DialogModalContext';
import { getWindowContainerElement } from '../../utils/monitorSpace';
import { AuxiliaryWindowTitleBar } from './AuxiliaryWindowTitleBar';
import { DependentWindowResizeHandles } from './DependentWindowResizeHandles';
import {
  getCenteredDependentWindowPosition,
  useDependentWindowDrag,
} from './useDependentWindowDrag';
import './DependentWindow.css';

interface DependentWindowProps {
  open: boolean;
  title: string;
  width?: number;
  height?: number;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}

function getPrimaryWindowElement(windowId: string | null): HTMLElement | null {
  if (!windowId) return null;
  return document.querySelector<HTMLElement>(
    `.resizable-app-window[data-primary-window-id="${windowId}"]`,
  );
}

export function DependentWindow({
  open,
  title,
  width = 480,
  height = 560,
  onClose,
  children,
  footer,
}: DependentWindowProps) {
  const windowId = usePrimaryWindowIdOptional();
  const placeName = useProjectName();
  const studio2026 = useStudio2026Enabled();
  const displayTitle = studio2026 ? placeName : title;
  const { getWindow } = usePrimaryWindows();
  const { monitorCount } = useMonitorLayout();
  const { getContainerElement } = useMonitorWindows();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const isOnDesktop = portalRoot !== null && portalRoot !== document.body;

  useLayoutEffect(() => {
    if (!open) {
      setPortalRoot(null);
      return;
    }

    const monitorIndex = windowId ? (getWindow(windowId)?.monitorIndex ?? 0) : 0;
    setPortalRoot(
      getContainerElement(monitorIndex) ??
        getWindowContainerElement(monitorIndex, monitorCount) ??
        document.body,
    );
  }, [open, windowId, getWindow, getContainerElement, monitorCount]);

  const primaryWindowElement = useMemo(
    () => (open && windowId ? getPrimaryWindowElement(windowId) : null),
    [open, windowId],
  );

  const container = portalRoot;
  const initialPosition = useMemo(
    () =>
      open && container
        ? getCenteredDependentWindowPosition(
            container,
            primaryWindowElement,
            width,
            height,
          )
        : null,
    [open, container, primaryWindowElement, width, height],
  );

  const { bounds, onTitleBarPointerDown, startResize, isResizing } =
    useDependentWindowDrag({
      open,
      container,
      width,
      height,
      initialPosition,
      enabled: open,
    });

  useRegisterBlockingDialog(open);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !portalRoot || !bounds) return null;

  return createPortal(
    <div
      className={[
        'dependent-window-layer',
        isOnDesktop ? 'dependent-window-layer--on-desktop' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="presentation"
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className={[
          'dependent-window',
          isResizing ? 'dependent-window--resizing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
        }}
        role="dialog"
        aria-labelledby={`dependent-window-title-${displayTitle.replace(/\s+/g, '-')}`}
      >
        <AuxiliaryWindowTitleBar
          title={displayTitle}
          onClose={onClose}
          onTitleBarPointerDown={onTitleBarPointerDown}
        />
        <div className="dependent-window__body">{children}</div>
        {footer ? <div className="dependent-window__footer">{footer}</div> : null}
        <DependentWindowResizeHandles onResizeStart={startResize} />
      </div>
    </div>,
    portalRoot,
  );
}
