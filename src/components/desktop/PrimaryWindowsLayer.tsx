import { useRef } from 'react';
import { AppBar } from '../AppBar';
import { ResizableAppWindow } from './ResizableAppWindow';
import { DragDropRoot } from '../DragDropRoot';
import { FloatingLayer } from '../floating/FloatingLayer';
import { Footer } from '../Footer';
import { PaneGutter } from '../layout/PaneGutter';
import { ShellEdgeDropZones } from '../layout/ShellEdgeDropZones';
import { Workspace } from '../Workspace';
import { CollapsedTabBarProvider } from '../../context/CollapsedTabBarContext';
import { LayoutProvider } from '../../context/LayoutContext';
import { PrimaryWindowProvider } from '../../context/PrimaryWindowContext';
import {
  usePrimaryWindows,
  type PrimaryWindowBounds,
} from '../../context/PrimaryWindowsContext';
import './PrimaryWindowStack.css';

function AppShell({
  workspaceRef,
  onWindowDragStart,
}: {
  workspaceRef: React.RefObject<HTMLDivElement | null>;
  onWindowDragStart?: (event: React.MouseEvent) => void;
}) {
  return (
    <div className="app-shell">
      <AppBar onWindowDragStart={onWindowDragStart} />
      <div className="app-shell__dock-region">
        <PaneGutter orientation="horizontal" shellEdgeDrop="top" />
        <div className="app-workspace-area">
          <Workspace workspaceRef={workspaceRef} />
        </div>
        <PaneGutter orientation="horizontal" shellEdgeDrop="bottom" />
        <ShellEdgeDropZones />
      </div>
      <Footer />
    </div>
  );
}

export function PrimaryWindow({
  windowId,
  bounds,
  isDragging,
  disableWindowDrag = false,
}: {
  windowId: string;
  bounds: PrimaryWindowBounds;
  isDragging?: boolean;
  disableWindowDrag?: boolean;
}) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { getWindowZIndex, focusWindow } = usePrimaryWindows();

  return (
    <div
      className={[
        'primary-window-stack',
        isDragging ? 'primary-window-stack--dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: getWindowZIndex(windowId),
      }}
      onMouseDown={() => focusWindow(windowId)}
    >
      <PrimaryWindowProvider windowId={windowId}>
        <LayoutProvider windowId={windowId}>
          <CollapsedTabBarProvider windowId={windowId}>
            <DragDropRoot workspaceRef={workspaceRef}>
              <ResizableAppWindow windowId={windowId} disabled={disableWindowDrag}>
                {(startWindowDrag) => (
                  <AppShell
                    workspaceRef={workspaceRef}
                    onWindowDragStart={disableWindowDrag ? undefined : startWindowDrag}
                  />
                )}
              </ResizableAppWindow>
              <FloatingLayer />
            </DragDropRoot>
          </CollapsedTabBarProvider>
        </LayoutProvider>
      </PrimaryWindowProvider>
    </div>
  );
}

export function PrimaryWindowsLayer({ monitorIndex }: { monitorIndex: number }) {
  const { windows, draggingWindowId, dragScreenPosition } = usePrimaryWindows();
  const isGalleryDrag = draggingWindowId != null && dragScreenPosition != null;

  return (
    <>
      {windows
        .filter(
          (entry) =>
            entry.monitorIndex === monitorIndex &&
            !(isGalleryDrag && entry.id === draggingWindowId),
        )
        .map((entry) => (
          <PrimaryWindow
            key={entry.id}
            windowId={entry.id}
            bounds={entry}
            isDragging={draggingWindowId === entry.id}
          />
        ))}
    </>
  );
}
