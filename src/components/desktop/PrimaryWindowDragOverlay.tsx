import { createPortal } from 'react-dom';
import { useMonitorLayout } from '../../context/MonitorLayoutContext';
import { useMonitorWindows } from '../../context/MonitorWindowsContext';
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';
import { PrimaryWindow } from './PrimaryWindowsLayer';
import './PrimaryWindowDragOverlay.css';

export function PrimaryWindowDragOverlay() {
  const { monitorCount } = useMonitorLayout();
  const { getContainerElement } = useMonitorWindows();
  const {
    draggingWindowId,
    dragScreenPosition,
    dragTargetMonitorIndex,
    getWindow,
  } = usePrimaryWindows();

  if (
    monitorCount === 1 ||
    !draggingWindowId ||
    !dragScreenPosition
  ) {
    return null;
  }

  const bounds = getWindow(draggingWindowId);
  if (!bounds) return null;

  const monitorIndex = dragTargetMonitorIndex ?? bounds.monitorIndex;
  const container = getContainerElement(monitorIndex);
  if (!container) return null;

  const containerRect = container.getBoundingClientRect();
  const localX = dragScreenPosition.x - containerRect.left;
  const localY = dragScreenPosition.y - containerRect.top;

  return createPortal(
    <div
      className="primary-window-drag-overlay"
      style={{
        left: localX,
        top: localY,
        width: bounds.width,
        height: bounds.height,
      }}
      aria-hidden="true"
    >
      <PrimaryWindow
        windowId={draggingWindowId}
        bounds={{ ...bounds, x: 0, y: 0 }}
        isDragging
        disableWindowDrag
      />
    </div>,
    container,
  );
}
