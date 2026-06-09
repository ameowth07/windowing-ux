import { useCallback, type ReactNode } from 'react';
import { useMonitorLayout } from '../../context/MonitorLayoutContext';
import {
  MonitorWindowsProvider,
  useMonitorWindows,
} from '../../context/MonitorWindowsContext';
import { FloatingContainerProvider } from '../../context/FloatingContainerContext';
import { GalleryDesktop } from './GalleryDesktop';
import { PrimaryWindowsLayer } from './PrimaryWindowsLayer';
import { PrimaryWindowDragOverlay } from './PrimaryWindowDragOverlay';
import { DesktopSettingsMenu } from './DesktopSettingsMenu';
import { usePrimaryWindows } from '../../context/PrimaryWindowsContext';
import './DesktopEnvironment.css';

interface DesktopEnvironmentProps {
  children?: ReactNode;
}

export function DesktopEnvironment({ children }: DesktopEnvironmentProps) {
  return (
    <MonitorWindowsProvider>
      <DesktopEnvironmentInner>{children}</DesktopEnvironmentInner>
    </MonitorWindowsProvider>
  );
}

function DesktopEnvironmentInner({ children }: DesktopEnvironmentProps) {
  const { monitorCount } = useMonitorLayout();
  const { registerContainer } = useMonitorWindows();
  const { dragTargetMonitorIndex } = usePrimaryWindows();

  const setMonitorRef = useCallback(
    (monitorIndex: number) => (element: HTMLDivElement | null) => {
      registerContainer(monitorIndex, element);
    },
    [registerContainer],
  );

  if (monitorCount === 1) {
    return (
      <FloatingContainerProvider>
        <div className="desktop">
          <div className="desktop__wallpaper" aria-hidden="true" />
          <DesktopSettingsMenu />
          <div className="desktop__icons">
            <DesktopIcons />
          </div>
          <div
            className="desktop__workspace desktop__workspace--single"
            data-monitor-count={monitorCount}
          >
            <div
              ref={setMonitorRef(0)}
              className="desktop__windows desktop__monitor-windows"
              data-monitor-index={0}
            >
              {children ?? <PrimaryWindowsLayer monitorIndex={0} />}
            </div>
          </div>
          <WindowsTaskbar />
        </div>
      </FloatingContainerProvider>
    );
  }

  return (
    <FloatingContainerProvider>
      <div className="desktop desktop--gallery">
        <DesktopSettingsMenu />
        <div
          className="desktop__gallery"
          data-monitor-count={monitorCount}
          style={{ '--monitor-count': monitorCount } as React.CSSProperties}
        >
          {Array.from({ length: monitorCount }, (_, index) => (
            <div
              key={index}
              className={[
                'desktop__gallery-item',
                monitorCount === 3 && index === 2
                  ? 'desktop__gallery-item--bottom-center'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <GalleryDesktop
                index={index}
                windowsRef={setMonitorRef(index)}
                isDropTarget={dragTargetMonitorIndex === index}
                footer={
                  index === monitorCount - 1 ? (
                    <WindowsTaskbar embedded />
                  ) : undefined
                }
              >
                {children ?? <PrimaryWindowsLayer monitorIndex={index} />}
              </GalleryDesktop>
            </div>
          ))}
        </div>
        <PrimaryWindowDragOverlay />
      </div>
    </FloatingContainerProvider>
  );
}

function DesktopIcons() {
  return (
    <>
      <button type="button" className="desktop-icon">
        <span className="desktop-icon__glyph desktop-icon__glyph--recycle" />
        <span className="desktop-icon__label">Recycle Bin</span>
      </button>
      <button type="button" className="desktop-icon desktop-icon--selected">
        <span className="desktop-icon__glyph desktop-icon__glyph--studio" />
        <span className="desktop-icon__label">Studio</span>
      </button>
    </>
  );
}

function WindowsTaskbar({ embedded = false }: { embedded?: boolean }) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const date = now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });

  return (
    <footer
      className={[
        'win-taskbar',
        embedded ? 'win-taskbar--embedded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button type="button" className="win-taskbar__start" aria-label="Start">
        <WindowsLogo />
      </button>
      <button type="button" className="win-taskbar__search" aria-label="Search">
        <SearchIcon />
        <span>Search</span>
      </button>
      <div className="win-taskbar__pinned">
        <button type="button" className="win-taskbar__app win-taskbar__app--active" aria-label="Studio">
          <StudioIcon />
        </button>
        <button type="button" className="win-taskbar__app" aria-label="File Explorer">
          <FolderIcon />
        </button>
        <button type="button" className="win-taskbar__app" aria-label="Edge">
          <EdgeIcon />
        </button>
      </div>
      <div className="win-taskbar__tray">
        <span className="win-taskbar__tray-icon" aria-hidden="true">^</span>
        <span className="win-taskbar__tray-icon" aria-hidden="true">Wi‑Fi</span>
        <span className="win-taskbar__tray-icon" aria-hidden="true">🔊</span>
        <div className="win-taskbar__clock">
          <span>{time}</span>
          <span>{date}</span>
        </div>
      </div>
    </footer>
  );
}

function WindowsLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2.5 7 1.5V7.5H1V2.5zm0 6H7V14.5L1 13.5V8.5zm8.5-6.2L15 1v6H9.5V2.3zm0 6.2H15v6l-6.5-1V8.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  );
}

function StudioIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <rect x="2" y="3" width="14" height="12" rx="2" opacity="0.35" />
      <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="#fcd34d">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H7l1.5 1.5H14.5A1.5 1.5 0 0 1 16 7v6.5A1.5 1.5 0 0 1 14.5 15h-11A1.5 1.5 0 0 1 2 13.5V5.5z" />
    </svg>
  );
}

function EdgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" fill="#0078d4" />
      <path d="M4 9c0-2.8 2.2-5 5-5 1.8 0 3.4 1 4.2 2.5H9.5C7.6 6.5 6 8.1 6 10s1.6 3.5 3.5 3.5c1.5 0 2.8-.9 3.3-2.2H9c-.6 0-1-.4-1-1s.4-1 1-1h5.5c.3 0 .5.2.5.5V10c0 3.3-2.7 6-6 6-3.3 0-6-2.7-6-6z" fill="white" />
    </svg>
  );
}
