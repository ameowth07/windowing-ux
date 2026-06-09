import { useRef, type RefObject } from 'react';
import './App.css';
import { AppBar } from './components/AppBar';
import { DesktopEnvironment } from './components/desktop/DesktopEnvironment';
import './components/desktop/PrimaryWindowStack.css';
import { ResizableAppWindow } from './components/desktop/ResizableAppWindow';
import { DragDropRoot } from './components/DragDropRoot';
import { FloatingLayer } from './components/floating/FloatingLayer';
import { Footer } from './components/Footer';
import { PaneGutter } from './components/layout/PaneGutter';
import { ShellEdgeDropZones } from './components/layout/ShellEdgeDropZones';
import { Workspace } from './components/Workspace';
import { AppWindowProvider } from './context/AppWindowContext';
import { AuxiliaryWindowSizeProvider } from './context/AuxiliaryWindowSizeContext';
import { CollapsedTabBarProvider } from './context/CollapsedTabBarContext';
import { LayoutProvider } from './context/LayoutContext';
import { DropZoneVariantProvider } from './context/DropZoneVariantContext';
import { EdgeDropZoneDelayProvider } from './context/EdgeDropZoneDelayContext';
import { PrimaryWindowProvider } from './context/PrimaryWindowContext';
import { PrimaryWindowsProvider, usePrimaryWindows } from './context/PrimaryWindowsContext';
import { ProjectTabBarProvider } from './context/ProjectTabBarContext';
import { EnforceDocumentRegionProvider } from './context/EnforceDocumentRegionContext';
import { SkeletonContentProvider } from './context/SkeletonContentContext';
import { SavedLayoutsProvider } from './context/SavedLayoutsContext';
import { ScopeTabProvider } from './context/ScopeTabContext';
import { ShowDropzonesProvider } from './context/ShowDropzonesContext';

function AppShell({
  workspaceRef,
  onWindowDragStart,
}: {
  workspaceRef: RefObject<HTMLDivElement | null>;
  onWindowDragStart?: (event: React.MouseEvent) => void;
}) {
  return (
    <div className="app-shell">
      <AppBar onWindowDragStart={onWindowDragStart} />
      <PaneGutter orientation="horizontal" />
      <div className="app-workspace-area">
        <Workspace workspaceRef={workspaceRef} />
        <ShellEdgeDropZones />
      </div>
      <PaneGutter orientation="horizontal" />
      <Footer />
    </div>
  );
}

function PrimaryWindow({ windowId }: { windowId: string }) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { getWindow, getWindowZIndex, focusWindow } = usePrimaryWindows();
  const bounds = getWindow(windowId);

  if (!bounds) return null;

  return (
    <div
      className="primary-window-stack"
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
            <ResizableAppWindow windowId={windowId}>
              {(startWindowDrag) => (
                <AppShell
                  workspaceRef={workspaceRef}
                  onWindowDragStart={startWindowDrag}
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

function PrimaryWindowsLayer() {
  const { windows } = usePrimaryWindows();

  return (
    <>
      {windows.map((entry) => (
        <PrimaryWindow key={entry.id} windowId={entry.id} />
      ))}
    </>
  );
}

function App() {
  return (
    <AppWindowProvider>
      <SavedLayoutsProvider>
      <SkeletonContentProvider>
        <EnforceDocumentRegionProvider>
        <ProjectTabBarProvider>
          <DropZoneVariantProvider>
            <EdgeDropZoneDelayProvider>
              <AuxiliaryWindowSizeProvider>
                <ShowDropzonesProvider>
                  <PrimaryWindowsProvider>
                    <ScopeTabProvider>
                      <DesktopEnvironment>
                        <PrimaryWindowsLayer />
                      </DesktopEnvironment>
                    </ScopeTabProvider>
                  </PrimaryWindowsProvider>
                </ShowDropzonesProvider>
              </AuxiliaryWindowSizeProvider>
            </EdgeDropZoneDelayProvider>
          </DropZoneVariantProvider>
        </ProjectTabBarProvider>
        </EnforceDocumentRegionProvider>
      </SkeletonContentProvider>
      </SavedLayoutsProvider>
    </AppWindowProvider>
  );
}

export default App;
