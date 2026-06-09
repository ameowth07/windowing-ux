import type { TabBarDragSnapshot } from '../../context/TabBarDragSnapshotContext';
import { TabBarOverflowIndicator } from './TabBarOverflowMenu';
import { TabPreview } from './TabPreview';
import '../floating/FloatingWindow.css';
import './PanelContainer.css';
import './TabGroupDragOverlay.css';

interface TabGroupDragOverlayProps {
  snapshot: TabBarDragSnapshot;
}

export function TabGroupDragOverlay({ snapshot }: TabGroupDragOverlayProps) {
  const {
    width,
    visiblePanelIds,
    overflowPanelIds,
    activeTabId,
    variant,
  } = snapshot;

  const tabBarClass =
    variant === 'docked'
      ? 'panel-container__tab-bar'
      : 'floating-window__tab-bar';
  const tabsClass =
    variant === 'docked' ? 'panel-container__tabs' : 'floating-window__tabs';
  const actionsClass =
    variant === 'docked'
      ? 'panel-container__actions'
      : 'floating-window__actions';
  const menuBtnClass =
    variant === 'docked'
      ? 'panel-container__menu-btn'
      : 'floating-window__menu-btn';

  return (
    <div
      className={`tab-group-drag-overlay ${tabBarClass}`}
      style={{ width, minWidth: width, maxWidth: width }}
    >
      <div className={tabsClass}>
        {visiblePanelIds.map((panelId) => (
          <TabPreview
            key={panelId}
            panelId={panelId}
            active={panelId === activeTabId}
          />
        ))}
      </div>
      {overflowPanelIds.length > 0 ? <TabBarOverflowIndicator /> : null}
      <div className={actionsClass} data-tab-bar-actions>
        <span className={menuBtnClass} aria-hidden="true">
          <MenuIcon />
        </span>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect y="2" width="14" height="1.5" rx="0.5" />
      <rect y="6.25" width="14" height="1.5" rx="0.5" />
      <rect y="10.5" width="14" height="1.5" rx="0.5" />
    </svg>
  );
}
