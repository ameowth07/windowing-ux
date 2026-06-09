import './App.css';
import { DesktopEnvironment } from './components/desktop/DesktopEnvironment';
import { AppWindowProvider } from './context/AppWindowContext';
import { AuxiliaryWindowSizeProvider } from './context/AuxiliaryWindowSizeContext';
import { DropZoneVariantProvider } from './context/DropZoneVariantContext';
import { EdgeDropZoneDelayProvider } from './context/EdgeDropZoneDelayContext';
import { MonitorLayoutProvider } from './context/MonitorLayoutContext';
import { ProjectTabBarProvider } from './context/ProjectTabBarContext';
import { EnforceDocumentRegionProvider } from './context/EnforceDocumentRegionContext';
import { SkeletonContentProvider } from './context/SkeletonContentContext';
import { RecentProjectsProvider } from './context/RecentProjectsContext';
import { SavedLayoutsProvider } from './context/SavedLayoutsContext';
import { ScopeTabProvider } from './context/ScopeTabContext';
import { ShowDropzonesProvider } from './context/ShowDropzonesContext';
import { PrimaryWindowsProvider } from './context/PrimaryWindowsContext';

function App() {
  return (
    <AppWindowProvider>
      <SavedLayoutsProvider>
      <SkeletonContentProvider>
        <EnforceDocumentRegionProvider>
        <ProjectTabBarProvider>
          <MonitorLayoutProvider>
          <DropZoneVariantProvider>
            <EdgeDropZoneDelayProvider>
              <AuxiliaryWindowSizeProvider>
                <ShowDropzonesProvider>
                  <PrimaryWindowsProvider>
                    <RecentProjectsProvider>
                    <ScopeTabProvider>
                      <DesktopEnvironment />
                    </ScopeTabProvider>
                    </RecentProjectsProvider>
                  </PrimaryWindowsProvider>
                </ShowDropzonesProvider>
              </AuxiliaryWindowSizeProvider>
            </EdgeDropZoneDelayProvider>
          </DropZoneVariantProvider>
          </MonitorLayoutProvider>
        </ProjectTabBarProvider>
        </EnforceDocumentRegionProvider>
      </SkeletonContentProvider>
      </SavedLayoutsProvider>
    </AppWindowProvider>
  );
}

export default App;
