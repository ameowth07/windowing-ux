import { useFloatDragPreview } from '../../context/FloatDragPreviewContext';
import { useFloatingContainer } from '../../context/FloatingContainerContext';
import { useLayout } from '../../context/LayoutContext';
import { usePrimaryWindowId } from '../../context/PrimaryWindowContext';
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';
import { FloatingWindow } from './FloatingWindow';
import { FloatingWindowGhostPreview } from './FloatingWindowGhostPreview';
import './FloatingLayer.css';

export function FloatingLayer() {
  const { state } = useLayout();
  const preview = useFloatDragPreview();
  const containerRef = useFloatingContainer();
  const windowId = usePrimaryWindowId();
  const { getWindow } = usePrimaryWindows();
  const bounds = getWindow(windowId);
  const container = containerRef?.current;

  const hasWindows = state.floating.length > 0;
  const hasWindowPreview = preview?.kind === 'window';
  const hasMergePreview = preview?.kind === 'merge';

  if (!hasWindows && !hasWindowPreview && !hasMergePreview) {
    return null;
  }

  const layerStyle =
    bounds && container
      ? {
          left: -bounds.x,
          top: -bounds.y,
          width: container.clientWidth,
          height: container.clientHeight,
        }
      : undefined;

  return (
    <div className="floating-layer" style={layerStyle}>
      {hasWindowPreview ? (
        <FloatingWindowGhostPreview
          panelId={preview.panelId}
          panelIds={preview.panelIds}
          activeTabId={preview.activeTabId}
          x={preview.x}
          y={preview.y}
          width={preview.width}
          height={preview.height}
        />
      ) : null}
      {state.floating.map((window) => (
        <FloatingWindow
          key={window.id}
          id={window.id}
          panels={window.panels}
          activeTabId={window.activeTabId}
          x={window.x}
          y={window.y}
          width={window.width}
          height={window.height}
          scopeTabId={window.scopeTabId}
          isMergeTarget={
            hasMergePreview && preview.floatingWindowId === window.id
          }
        />
      ))}
    </div>
  );
}
