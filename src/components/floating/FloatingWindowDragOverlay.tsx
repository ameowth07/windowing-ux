import { createPortal } from 'react-dom';
import { useFloatingWindowDragOverlay } from '../../context/FloatingWindowDragOverlayContext';
import { useLayout } from '../../context/LayoutContext';
import { useMonitorLayout } from '../../context/MonitorLayoutContext';
import { useMonitorWindows } from '../../context/MonitorWindowsContext';
import { getMonitorIndexAtPoint } from '../../utils/monitorSpace';
import { FloatingWindow } from './FloatingWindow';
import './FloatingWindowDragOverlay.css';

export function FloatingWindowDragOverlay() {
  const { monitorCount } = useMonitorLayout();
  const { getContainerElement } = useMonitorWindows();
  const overlay = useFloatingWindowDragOverlay();
  const { state } = useLayout();

  if (monitorCount === 1 || !overlay) {
    return null;
  }

  const floatingWindow = state.floating.find(
    (window) => window.id === overlay.floatingWindowId,
  );
  if (!floatingWindow) {
    return null;
  }

  const monitorIndex =
    floatingWindow.monitorIndex ??
    getMonitorIndexAtPoint(
      overlay.screenX + floatingWindow.width / 2,
      overlay.screenY + 24,
    );
  const container = getContainerElement(monitorIndex);
  if (!container) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const localX = overlay.screenX - containerRect.left;
  const localY = overlay.screenY - containerRect.top;

  return createPortal(
    <div
      className="floating-window-drag-overlay"
      style={{
        left: localX,
        top: localY,
        width: floatingWindow.width,
        height: floatingWindow.height,
      }}
      aria-hidden="true"
    >
      <FloatingWindow
        id={floatingWindow.id}
        panels={floatingWindow.panels}
        activeTabId={floatingWindow.activeTabId}
        x={0}
        y={0}
        width={floatingWindow.width}
        height={floatingWindow.height}
        scopeTabId={floatingWindow.scopeTabId}
        dragOverlay
      />
    </div>,
    container,
  );
}
