import { useProjectName } from '../../context/AppWindowContext';
import { useProjectTabBarEnabled } from '../../context/ProjectTabBarContext';
import { useScopeTabLabel } from '../../context/ScopeTabContext';
import { getPanelDefinition } from '../../data/panels';
import type { PanelId } from '../../types/layout';
import { TabPreview } from '../layout/TabPreview';
import './FloatingWindowGhostPreview.css';

interface FloatingWindowGhostPreviewProps {
  panelId: PanelId;
  panelIds?: PanelId[];
  activeTabId?: PanelId;
  x?: number;
  y?: number;
  width: number;
  height: number;
  variant?: 'placed' | 'overlay';
}

export function FloatingWindowGhostPreview({
  panelId,
  panelIds,
  activeTabId,
  x,
  y,
  width,
  height,
  variant = 'placed',
}: FloatingWindowGhostPreviewProps) {
  const projectName = useProjectName();
  const projectTabBar = useProjectTabBarEnabled();
  const scopeTabLabel = useScopeTabLabel();
  const windowTitle =
    projectTabBar && scopeTabLabel ? scopeTabLabel : projectName;
  const tabs = panelIds ?? [panelId];
  const active = activeTabId ?? panelId;
  const panelTitle = getPanelDefinition(active)?.title ?? active;

  const style =
    variant === 'placed'
      ? { left: x, top: y, width, height }
      : { width, height };

  return (
    <div
      className={`floating-window-ghost ${variant === 'overlay' ? 'floating-window-ghost--overlay' : ''}`}
      style={style}
      aria-hidden="true"
    >
      <div className="floating-window-ghost__app-bar">
        <div className="floating-window-ghost__title">{windowTitle}</div>
        <div className="floating-window-ghost__window-controls" />
      </div>
      <div className="floating-window-ghost__panel">
        <div className="floating-window-ghost__tab-bar">
          <div className="floating-window-ghost__tabs">
            {tabs.map((id) => (
              <TabPreview key={id} panelId={id} active={id === active} />
            ))}
          </div>
        </div>
        <div className="floating-window-ghost__body">
          <span className="floating-window-ghost__body-label">{panelTitle}</span>
        </div>
      </div>
    </div>
  );
}
