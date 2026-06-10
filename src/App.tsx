import './App.css';
import { DesktopEnvironment } from './components/desktop/DesktopEnvironment';
import { AppWindowProvider } from './context/AppWindowContext';
import { AuxiliaryWindowSizeProvider } from './context/AuxiliaryWindowSizeContext';
import { EdgeDropZoneDelayProvider } from './context/EdgeDropZoneDelayContext';
import { MonitorLayoutProvider } from './context/MonitorLayoutContext';
import { ProjectTabBarProvider } from './context/ProjectTabBarContext';
import { EnforceDocumentRegionProvider } from './context/EnforceDocumentRegionContext';
import { Studio2026Provider } from './context/Studio2026Context';
import { FloatingPanelDockingProvider } from './context/FloatingPanelDockingContext';
import { SkeletonContentProvider } from './context/SkeletonContentContext';
import { RecentProjectsProvider } from './context/RecentProjectsContext';
import { SavedLayoutsProvider } from './context/SavedLayoutsContext';
import { ScopeTabProvider } from './context/ScopeTabContext';
import { ShowDropzonesProvider } from './context/ShowDropzonesContext';
import { DialogModalProvider } from './context/DialogModalContext';
import { PrimaryWindowsProvider } from './context/PrimaryWindowsContext';

function App() {
  return (
    <AppWindowProvider>
      <SavedLayoutsProvider>
      <SkeletonContentProvider>
        <EnforceDocumentRegionProvider>
        <Studio2026Provider>
        <FloatingPanelDockingProvider>
        <ProjectTabBarProvider>
          <MonitorLayoutProvider>
            <EdgeDropZoneDelayProvider>
              <AuxiliaryWindowSizeProvider>
                <ShowDropzonesProvider>
                  <DialogModalProvider>
                    <PrimaryWindowsProvider>
                      <RecentProjectsProvider>
                      <ScopeTabProvider>
                        <DesktopEnvironment />
                      </ScopeTabProvider>
                      </RecentProjectsProvider>
                    </PrimaryWindowsProvider>
                  </DialogModalProvider>
                </ShowDropzonesProvider>
              </AuxiliaryWindowSizeProvider>
            </EdgeDropZoneDelayProvider>
          </MonitorLayoutProvider>
        </ProjectTabBarProvider>
        </FloatingPanelDockingProvider>
        </Studio2026Provider>
        </EnforceDocumentRegionProvider>
      </SkeletonContentProvider>
      </SavedLayoutsProvider>
    </AppWindowProvider>
  );
}

export default App;
