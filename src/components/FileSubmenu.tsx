import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  FILE_MENU_RECENT_ITEMS,
  FILE_MENU_SETTINGS_ACTIONS,
  getFileMenuActions,
} from '../data/studioMenuItems';
import { useStudio2026Enabled } from '../context/Studio2026Context';
import { TransientSubmenuPortal } from './layout/TransientMenuPortal';
import './StudioMenu.css';

type FileSubmenuPanel = 'recent' | null;

interface FileSubmenuProps {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  placement?: 'side' | 'below';
  portalRef?: RefObject<HTMLDivElement | null>;
  recentAnchorRef?: RefObject<HTMLButtonElement | null>;
  recentPortalRef?: RefObject<HTMLDivElement | null>;
  onAction: (actionId: string) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function FileSubmenu({
  open,
  anchorRef,
  placement = 'side',
  portalRef,
  recentAnchorRef,
  recentPortalRef,
  onAction,
  onPointerEnter,
  onPointerLeave,
}: FileSubmenuProps) {
  const studio2026 = useStudio2026Enabled();
  const fileMenuActions = useMemo(
    () => getFileMenuActions(studio2026),
    [studio2026],
  );
  const localRecentAnchorRef = useRef<HTMLButtonElement>(null);
  const localRecentPortalRef = useRef<HTMLDivElement>(null);
  const recentRef = recentAnchorRef ?? localRecentAnchorRef;
  const recentMenuRef = recentPortalRef ?? localRecentPortalRef;
  const submenuCloseTimerRef = useRef<number | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<FileSubmenuPanel>(null);

  const clearSubmenuCloseTimer = () => {
    if (submenuCloseTimerRef.current !== null) {
      window.clearTimeout(submenuCloseTimerRef.current);
      submenuCloseTimerRef.current = null;
    }
  };

  const isPointerOverSubmenuArea = () => {
    const overRecent = recentRef.current?.matches(':hover') ?? false;
    const overRecentMenu = recentMenuRef.current?.matches(':hover') ?? false;
    return overRecent || overRecentMenu;
  };

  const openSubmenu = (submenu: FileSubmenuPanel) => {
    clearSubmenuCloseTimer();
    setActiveSubmenu(submenu);
  };

  const scheduleSubmenuClose = () => {
    clearSubmenuCloseTimer();
    submenuCloseTimerRef.current = window.setTimeout(() => {
      if (!isPointerOverSubmenuArea()) {
        setActiveSubmenu(null);
      }
      submenuCloseTimerRef.current = null;
    }, 100);
  };

  useEffect(() => {
    if (!open) {
      setActiveSubmenu(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (submenuCloseTimerRef.current !== null) {
        window.clearTimeout(submenuCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <TransientSubmenuPortal
        open={open}
        anchorRef={anchorRef}
        placement={placement}
        offsetX={4}
        portalRef={portalRef}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <div className="studio-menu studio-menu--auto" role="menu">
          {fileMenuActions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="studio-menu__item"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => onAction(action.id)}
            >
              <span className="studio-menu__item-label">{action.label}</span>
            </button>
          ))}
          <div className="studio-menu__divider" role="separator" />
          <button
            ref={recentRef}
            type="button"
            role="menuitem"
            className={`studio-menu__item studio-menu__item--submenu ${activeSubmenu === 'recent' ? 'studio-menu__item--submenu-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={activeSubmenu === 'recent'}
            onMouseEnter={() => openSubmenu('recent')}
            onMouseLeave={scheduleSubmenuClose}
            onFocus={() => openSubmenu('recent')}
            onClick={(event) => {
              event.stopPropagation();
              openSubmenu('recent');
            }}
          >
            <span className="studio-menu__item-label">Recent</span>
            <span className="studio-menu__item-chevron" aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </button>
          <div className="studio-menu__divider" role="separator" />
          {FILE_MENU_SETTINGS_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className="studio-menu__item"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={() => onAction(action.id)}
            >
              <span className="studio-menu__item-label">{action.label}</span>
            </button>
          ))}
        </div>
      </TransientSubmenuPortal>

      <TransientSubmenuPortal
        open={open && activeSubmenu === 'recent'}
        anchorRef={recentRef}
        offsetX={4}
        portalRef={recentMenuRef}
        onPointerEnter={clearSubmenuCloseTimer}
        onPointerLeave={scheduleSubmenuClose}
      >
        <div className="studio-menu studio-menu--auto" role="menu">
          {FILE_MENU_RECENT_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="studio-menu__item"
              onClick={() => onAction(item.id)}
            >
              <span className="studio-menu__item-label">{item.label}</span>
            </button>
          ))}
        </div>
      </TransientSubmenuPortal>
    </>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 4.5 10 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
