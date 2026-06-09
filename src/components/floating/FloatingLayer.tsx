import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import { useFloatDragPreview } from '../../context/FloatDragPreviewContext';
import { useFloatingWindowDragOverlay } from '../../context/FloatingWindowDragOverlayContext';
import { useFloatingContainer } from '../../context/FloatingContainerContext';
import { useLayout } from '../../context/LayoutContext';
import { useMonitorLayout } from '../../context/MonitorLayoutContext';
import { useMonitorWindows } from '../../context/MonitorWindowsContext';
import { usePrimaryWindowId } from '../../context/PrimaryWindowContext';
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';
import type { FloatingWindow as FloatingWindowState } from '../../types/layout';
import { FloatingWindow } from './FloatingWindow';
import { FloatingWindowGhostPreview } from './FloatingWindowGhostPreview';
import './FloatingLayer.css';

function getFloatingMonitorIndex(
  window: FloatingWindowState,
  primaryMonitorIndex: number,
): number {
  return window.monitorIndex ?? primaryMonitorIndex;
}

function getLayerStyle(
  monitorIndex: number,
  primaryMonitorIndex: number,
  bounds: { x: number; y: number } | undefined,
  container: HTMLElement | null,
): CSSProperties | undefined {
  if (!container) return undefined;

  if (monitorIndex === primaryMonitorIndex && bounds) {
    return {
      left: -bounds.x,
      top: -bounds.y,
      width: container.clientWidth,
      height: container.clientHeight,
    };
  }

  return {
    left: 0,
    top: 0,
    width: container.clientWidth,
    height: container.clientHeight,
  };
}

export function FloatingLayer() {
  const { state } = useLayout();
  const preview = useFloatDragPreview();
  const floatingDragOverlay = useFloatingWindowDragOverlay();
  const windowId = usePrimaryWindowId();
  const { getWindow } = usePrimaryWindows();
  const { getContainerElement } = useMonitorWindows();
  const { monitorCount } = useMonitorLayout();
  const bounds = getWindow(windowId);
  const primaryMonitorIndex = bounds?.monitorIndex ?? 0;
  const containerRef = useFloatingContainer(primaryMonitorIndex);
  const primaryContainer = containerRef?.current;

  const hasWindows = state.floating.length > 0;
  const hasWindowPreview = preview?.kind === 'window';
  const hasMergePreview = preview?.kind === 'merge';

  if (!hasWindows && !hasWindowPreview && !hasMergePreview) {
    return null;
  }

  const previewMonitorIndex =
    hasWindowPreview && preview.kind === 'window'
      ? preview.monitorIndex
      : primaryMonitorIndex;

  const sameMonitorFloats = state.floating.filter(
    (window) =>
      getFloatingMonitorIndex(window, primaryMonitorIndex) === primaryMonitorIndex &&
      window.id !== floatingDragOverlay?.floatingWindowId,
  );
  const otherMonitorFloats = state.floating.filter(
    (window) =>
      getFloatingMonitorIndex(window, primaryMonitorIndex) !== primaryMonitorIndex &&
      window.id !== floatingDragOverlay?.floatingWindowId,
  );

  const renderPreview = (monitorIndex: number) => {
    if (!hasWindowPreview || preview.kind !== 'window') return null;
    if (preview.monitorIndex !== monitorIndex) return null;
    return (
      <FloatingWindowGhostPreview
        panelId={preview.panelId}
        panelIds={preview.panelIds}
        activeTabId={preview.activeTabId}
        x={preview.x}
        y={preview.y}
        width={preview.width}
        height={preview.height}
      />
    );
  };

  const renderLayerContents = (
    monitorIndex: number,
    windows: FloatingWindowState[],
  ) => (
    <>
      {renderPreview(monitorIndex)}
      {windows.map((window) => (
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
            hasMergePreview &&
            preview?.kind === 'merge' &&
            preview.floatingWindowId === window.id
          }
        />
      ))}
    </>
  );

  const primaryLayerStyle = getLayerStyle(
    primaryMonitorIndex,
    primaryMonitorIndex,
    bounds,
    primaryContainer,
  );

  return (
    <>
      <div className="floating-layer" style={primaryLayerStyle}>
        {renderLayerContents(primaryMonitorIndex, sameMonitorFloats)}
      </div>
      {monitorCount > 1
        ? otherMonitorFloats.map((window) => {
            const floatMonitorIndex = getFloatingMonitorIndex(
              window,
              primaryMonitorIndex,
            );
            const targetContainer = getContainerElement(floatMonitorIndex);
            if (!targetContainer) return null;

            const layerStyle = getLayerStyle(
              floatMonitorIndex,
              primaryMonitorIndex,
              bounds,
              targetContainer,
            );

            return createPortal(
              <div
                className="floating-layer floating-layer--portal"
                style={layerStyle}
              >
                {renderLayerContents(floatMonitorIndex, [window])}
              </div>,
              targetContainer,
              `${windowId}-${window.id}`,
            );
          })
        : null}
      {monitorCount > 1 &&
      hasWindowPreview &&
      preview.kind === 'window' &&
      previewMonitorIndex !== primaryMonitorIndex
        ? (() => {
            const targetContainer = getContainerElement(previewMonitorIndex);
            if (!targetContainer) return null;
            const layerStyle = getLayerStyle(
              previewMonitorIndex,
              primaryMonitorIndex,
              bounds,
              targetContainer,
            );
            return createPortal(
              <div
                className="floating-layer floating-layer--portal"
                style={layerStyle}
              >
                {renderPreview(previewMonitorIndex)}
              </div>,
              targetContainer,
              `${windowId}-float-preview`,
            );
          })()
        : null}
    </>
  );
}
