import { useEffect, useRef, useState } from 'react';
import { useCollapsedTabBar } from '../../context/CollapsedTabBarContext';
import { useEnforceDocumentRegionEnabled } from '../../context/EnforceDocumentRegionContext';
import { useLayout } from '../../context/LayoutContext';
import type { PanelId } from '../../types/layout';
import { getPanelGroupType } from '../../utils/panelGrouping';
import { AddDocumentMenu } from './AddDocumentMenu';
import { AddTabMenu } from './AddTabMenu';
import { TransientMenuPortal } from './TransientMenuPortal';
import '../StudioMenu.css';
import './PanelTabBarMenu.css';
import './TransientMenuPortal.css';

type PanelMenuSubmenu = 'add-tab' | 'add-document' | null;

interface PanelTabBarMenuProps {
  nodeId: string;
  panelIds: PanelId[];
  activePanelId: PanelId;
  variant?: 'docked' | 'floating';
}

export function PanelTabBarMenu({
  nodeId,
  panelIds,
  activePanelId,
  variant = 'docked',
}: PanelTabBarMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const addDocumentRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const addTabMenuRef = useRef<HTMLDivElement>(null);
  const addTabNestedMenuRef = useRef<HTMLDivElement>(null);
  const addDocumentMenuRef = useRef<HTMLDivElement>(null);
  const submenuCloseTimerRef = useRef<number | null>(null);
  const {
    closeTab,
    addPanelToTabGroup,
    addPanelToFloatingWindow,
    addDocumentToTabGroup,
    addDocumentToFloatingWindow,
    closeFloating,
  } = useLayout();
  const { collapseTabBar } = useCollapsedTabBar();
  const enforceDocumentRegion = useEnforceDocumentRegionEnabled();
  const panelGroupType = getPanelGroupType(panelIds);
  const addTabDisabled =
    enforceDocumentRegion && panelGroupType !== 'auxiliary';
  const addDocumentDisabled =
    enforceDocumentRegion && panelGroupType !== 'document';
  const [open, setOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<PanelMenuSubmenu>(null);

  const clearSubmenuCloseTimer = () => {
    if (submenuCloseTimerRef.current !== null) {
      window.clearTimeout(submenuCloseTimerRef.current);
      submenuCloseTimerRef.current = null;
    }
  };

  const isPointerOverSubmenuArea = () => {
    const overAddTab = addTabRef.current?.matches(':hover') ?? false;
    const overAddDocument = addDocumentRef.current?.matches(':hover') ?? false;
    const overAddTabMenu = addTabMenuRef.current?.matches(':hover') ?? false;
    const overAddTabNestedMenu = addTabNestedMenuRef.current?.matches(':hover') ?? false;
    const overAddDocumentMenu = addDocumentMenuRef.current?.matches(':hover') ?? false;
    return (
      overAddTab ||
      overAddDocument ||
      overAddTabMenu ||
      overAddTabNestedMenu ||
      overAddDocumentMenu
    );
  };

  const openSubmenu = (submenu: PanelMenuSubmenu) => {
    if (submenu === 'add-tab' && addTabDisabled) return;
    if (submenu === 'add-document' && addDocumentDisabled) return;
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
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    return () => {
      if (submenuCloseTimerRef.current !== null) {
        window.clearTimeout(submenuCloseTimerRef.current);
      }
    };
  }, []);

  const handleCloseTab = () => {
    closeTab(activePanelId);
    setOpen(false);
  };

  const handleDock = () => {
    closeFloating(nodeId);
    setOpen(false);
  };

  const handleCollapseTab = () => {
    collapseTabBar(nodeId);
    setOpen(false);
  };

  const handleAddPanel = (panelId: PanelId) => {
    if (panelIds.includes(panelId)) return;
    if (variant === 'floating') {
      addPanelToFloatingWindow(nodeId, panelId);
    } else {
      addPanelToTabGroup(nodeId, panelId);
    }
    setOpen(false);
  };

  const handleAddDocument = (panelId: PanelId) => {
    if (variant === 'floating') {
      addDocumentToFloatingWindow(nodeId, panelId);
    } else {
      addDocumentToTabGroup(nodeId, panelId);
    }
    setOpen(false);
  };

  const menuBtnClass =
    variant === 'floating'
      ? `floating-window__menu-btn ${open ? 'floating-window__menu-btn--open' : ''}`
      : `panel-container__menu-btn ${open ? 'panel-container__menu-btn--open' : ''}`;

  return (
    <div className="panel-tab-bar-menu">
      <button
        ref={triggerRef}
        type="button"
        className={menuBtnClass}
        aria-label="Tab group menu"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Tab group menu"
        onClick={() => setOpen((value) => !value)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <MenuIcon />
      </button>

      <TransientMenuPortal
        open={open}
        anchorRef={triggerRef}
        align="start"
        portalRef={menuPortalRef}
        ignoreRefs={[addTabMenuRef, addTabNestedMenuRef, addDocumentMenuRef]}
        onClose={() => setOpen(false)}
      >
        <div className="studio-menu studio-menu--auto" role="menu">
          <button
            type="button"
            role="menuitem"
            className="studio-menu__item"
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={handleCloseTab}
          >
            <span className="studio-menu__item-label">Close Tab</span>
          </button>
          {variant === 'floating' ? (
            <button
              type="button"
              role="menuitem"
              className="studio-menu__item"
              onMouseEnter={() => setActiveSubmenu(null)}
              onClick={handleDock}
            >
              <span className="studio-menu__item-label">Dock</span>
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="studio-menu__item"
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={handleCollapseTab}
          >
            <span className="studio-menu__item-label">Collapse Tab</span>
          </button>
          <div className="studio-menu__divider" role="separator" />
          <button
            ref={addTabRef}
            type="button"
            role="menuitem"
            className={`studio-menu__item studio-menu__item--submenu ${activeSubmenu === 'add-tab' ? 'studio-menu__item--submenu-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={activeSubmenu === 'add-tab'}
            aria-disabled={addTabDisabled}
            disabled={addTabDisabled}
            onMouseEnter={() => openSubmenu('add-tab')}
            onMouseLeave={scheduleSubmenuClose}
            onFocus={() => openSubmenu('add-tab')}
            onClick={(event) => {
              event.stopPropagation();
              openSubmenu('add-tab');
            }}
          >
            <span className="studio-menu__item-label">Add Tab</span>
            <span className="studio-menu__item-chevron" aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </button>
          <button
            ref={addDocumentRef}
            type="button"
            role="menuitem"
            className={`studio-menu__item studio-menu__item--submenu ${activeSubmenu === 'add-document' ? 'studio-menu__item--submenu-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={activeSubmenu === 'add-document'}
            aria-disabled={addDocumentDisabled}
            disabled={addDocumentDisabled}
            onMouseEnter={() => openSubmenu('add-document')}
            onMouseLeave={scheduleSubmenuClose}
            onFocus={() => openSubmenu('add-document')}
            onClick={(event) => {
              event.stopPropagation();
              openSubmenu('add-document');
            }}
          >
            <span className="studio-menu__item-label">Add New Document</span>
            <span className="studio-menu__item-chevron" aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </button>
        </div>
      </TransientMenuPortal>

      <AddTabMenu
        open={open && activeSubmenu === 'add-tab' && !addTabDisabled}
        anchorRef={addTabRef}
        portalRef={addTabMenuRef}
        nestedPortalRef={addTabNestedMenuRef}
        onAddPanel={handleAddPanel}
        onClose={() => setOpen(false)}
      />

      <AddDocumentMenu
        open={open && activeSubmenu === 'add-document' && !addDocumentDisabled}
        anchorRef={addDocumentRef}
        portalRef={addDocumentMenuRef}
        onAddPanel={handleAddDocument}
        onClose={() => setOpen(false)}
      />
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
