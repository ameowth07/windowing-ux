import { useProjectName } from '../context/AppWindowContext';
import { usePrimaryWindowIdOptional } from '../context/PrimaryWindowContext';
import { INITIAL_WINDOW_ID } from '../context/PrimaryWindowsContext';
import { useProjectTabBarEnabled } from '../context/ProjectTabBarContext';
import { useScopeTabs } from '../context/ScopeTabContext';
import type { ReactNode } from 'react';
import { AppBarMenu } from './AppBarMenu';
import { AppBarScopeTabs } from './AppBarScopeTabs';
import './AppBar.css';

const APP_BAR_ICONS = {
  nebula: 'https://www.figma.com/api/mcp/asset/72079fde-319a-4701-a236-31afff4a02c3',
  search: 'https://www.figma.com/api/mcp/asset/9a3edcbf-f234-4bfe-9c4c-bfc4f2b558db',
  bell: 'https://www.figma.com/api/mcp/asset/a54c4f31-7948-4c83-bf13-e0e7798c0bbf',
} as const;

const AVATAR_IMAGE =
  'https://www.figma.com/api/mcp/asset/fdfdc853-4dd0-40ac-99e4-66436d301873';

interface AppBarProps {
  onWindowDragStart?: (event: React.MouseEvent) => void;
  projectTabBar?: boolean;
}

export function AppBar({ onWindowDragStart, projectTabBar: projectTabBarOverride }: AppBarProps) {
  const projectTabBar = useProjectTabBarEnabled(projectTabBarOverride);

  if (projectTabBar) {
    return <AppBarProjectTabBar onWindowDragStart={onWindowDragStart} />;
  }

  return <AppBarDefault onWindowDragStart={onWindowDragStart} />;
}

function AppBarDefault({ onWindowDragStart }: AppBarProps) {
  const projectName = useProjectName();

  return (
    <header
      className={`app-bar ${onWindowDragStart ? 'app-bar--draggable' : ''}`}
      onMouseDown={onWindowDragStart}
    >
      <div className="app-bar__left">
        <div className="app-bar__brand">
          <AppBarMenuButton />
        </div>
        <div className="app-bar__controls-frame">
          <button type="button" className="app-bar__dropdown">
            <span className="app-bar__dropdown-label">Test</span>
            <ChevronDown />
          </button>
          <AppBarTestControls />
        </div>
      </div>

      <div className="app-bar__title">{projectName}</div>

      <div className="app-bar__right">
        <AppBarUtilities includeNebula />
        <AppBarWindowControls />
      </div>
    </header>
  );
}

function AppBarProjectTabBar({ onWindowDragStart }: AppBarProps) {
  return (
    <header
      className={`app-bar app-bar--project-tab-bar ${onWindowDragStart ? 'app-bar--draggable' : ''}`}
      onMouseDown={onWindowDragStart}
    >
      <div className="app-bar__left">
        <div className="app-bar__brand">
          <AppBarMenuButton />
        </div>
        <AppBarScopeTabs />
      </div>

      <div className="app-bar__right">
        <AppBarTestControls />
        <AppBarDivider />
        <AppBarUtilities />
        <AppBarDivider />
        <AppBarWindowControls />
      </div>
    </header>
  );
}

function AppBarMenuButton() {
  return (
    <AppBarMenu>
      {({ open, toggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          className={`app-bar__menu-split-btn ${open ? 'app-bar__menu-split-btn--open' : ''}`}
          aria-label="Menu"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={toggle}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className="app-bar__menu-split-mark" aria-hidden="true">
            <RobloxMark />
          </span>
          <span className="app-bar__menu-split-chevron" aria-hidden="true">
            <ChevronDown />
          </span>
        </button>
      )}
    </AppBarMenu>
  );
}

function AppBarTestControls() {
  return (
    <div className="app-bar__test-controls">
      <AppBarToggleButton label="Play" className="app-bar__toggle-btn--play">
        <PlayIcon />
      </AppBarToggleButton>
      <AppBarToggleButton label="Pause" disabled>
        <PauseIcon />
      </AppBarToggleButton>
      <AppBarToggleButton label="Stop" disabled>
        <StopIcon />
      </AppBarToggleButton>
    </div>
  );
}

function AppBarUtilities({ includeNebula = false }: { includeNebula?: boolean }) {
  return (
    <div className="app-bar__utilities">
      {includeNebula ? (
        <AppBarToggleButton label="Nebula">
          <AppBarIcon src={APP_BAR_ICONS.nebula} />
        </AppBarToggleButton>
      ) : null}
      <AppBarToggleButton label="Search">
        <AppBarIcon src={APP_BAR_ICONS.search} />
      </AppBarToggleButton>
      <AppBarToggleButton label="Notifications">
        <AppBarIcon src={APP_BAR_ICONS.bell} />
      </AppBarToggleButton>
      <div className="app-bar__avatar">
        <img src={AVATAR_IMAGE} alt="" className="app-bar__avatar-image" />
      </div>
    </div>
  );
}

function AppBarDivider() {
  return <div className="app-bar__divider" aria-hidden="true" />;
}

function AppBarWindowControls() {
  const windowId = usePrimaryWindowIdOptional() ?? INITIAL_WINDOW_ID;
  const { closePrimaryWindow } = useScopeTabs();

  return (
    <div className="app-bar__window-controls">
      <button type="button" className="app-bar__window-btn" aria-label="Minimize">
        <MinimizeIcon />
      </button>
      <button type="button" className="app-bar__window-btn" aria-label="Maximize">
        <MaximizeIcon />
      </button>
      <button
        type="button"
        className="app-bar__window-btn app-bar__window-btn--close"
        aria-label="Close"
        onClick={() => closePrimaryWindow(windowId)}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function AppBarToggleButton({
  label,
  disabled,
  className,
  children,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={['app-bar__toggle-btn', className].filter(Boolean).join(' ')}
      disabled={disabled}
      aria-label={label}
    >
      <span className="app-bar__toggle-btn-inner">{children}</span>
    </button>
  );
}

function RobloxMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.19674 4.99691L2.53628 0L12 2.53632L11.0863 5.94415L5.03163 4.32155L4.60581 5.90939L1.19674 4.99691ZM0.913721 6.05461L6.96837 7.67721L7.39419 6.08937L10.8033 7.00309L9.46372 12L0 9.46368L0.913721 6.05461Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" fill="none" strokeWidth="1.2" />
    </svg>
  );
}

function AppBarIcon({ src }: { src: string }) {
  return <img src={src} alt="" className="app-bar__icon" aria-hidden="true" />;
}

function PlayIcon() {
  return (
    <svg
      className="app-bar__icon app-bar__media-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5 3.5v9l8.5-4.5L5 3.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      className="app-bar__icon app-bar__media-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3.5" y="3" width="3" height="10" rx="0.5" />
      <rect x="9.5" y="3" width="3" height="10" rx="0.5" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      className="app-bar__icon app-bar__media-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="9" height="9" rx="0.5" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1 5.5h8" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="7"
        height="7"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
