import { useEffect, useRef, useState } from 'react';
import { useCollapsedTabBar } from '../../context/CollapsedTabBarContext';
import { useEnforceDocumentRegionEnabled } from '../../context/EnforceDocumentRegionContext';
import { useStudio2026Enabled } from '../../context/Studio2026Context';
import { useLayout } from '../../context/LayoutContext';
import type { PanelId } from '../../types/layout';
import { getPanelGroupType } from '../../utils/panelGrouping';
import { AddDocumentMenu } from './AddDocumentMenu';
import { AddTabMenu } from './AddTabMenu';
import { STUDIO_2026_SCRIPT_DOCUMENT_MENU_ITEMS } from '../../data/documentPanels';
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
  tabBarRef?: React.RefObject<HTMLElement | null>;
}

export function PanelTabBarMenu({
  nodeId,
  panelIds,
  activePanelId,
  variant = 'docked',
  tabBarRef,
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
  } = useLayout();
  const { collapseTabBar } = useCollapsedTabBar();
  const enforceDocumentRegion = useEnforceDocumentRegionEnabled();
  const studio2026 = useStudio2026Enabled();
  const panelGroupType = getPanelGroupType(panelIds);
  const addTabDisabled =
    enforceDocumentRegion && panelGroupType !== 'auxiliary';
  const addDocumentDisabled =
    enforceDocumentRegion && panelGroupType !== 'document';
  const showAddTab = !studio2026 || panelGroupType !== 'document';
  const showAddDocument = !studio2026 || panelGroupType === 'document';
  const [openSource, setOpenSource] = useState<'button' | 'context' | null>(
    null,
  );
  const [contextMenuPoint, setContextMenuPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<PanelMenuSubmenu>(null);
  const open = openSource !== null;

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
    const tabBar = tabBarRef?.current;
    if (!tabBar) return;

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      setActiveSubmenu(null);
      setContextMenuPoint({ x: event.clientX, y: event.clientY });
      setOpenSource('context');
    };

    tabBar.addEventListener('contextmenu', handleContextMenu);
    return () => tabBar.removeEventListener('contextmenu', handleContextMenu);
  }, [tabBarRef]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenSource(null);
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

  const closeMenu = () => {
    setOpenSource(null);
    setContextMenuPoint(null);
  };

  const handleCloseTab = () => {
    closeTab(activePanelId);
    closeMenu();
  };

  const handleCollapseTab = () => {
    collapseTabBar(nodeId);
    closeMenu();
  };

  const handleAddPanel = (panelId: PanelId) => {
    if (panelIds.includes(panelId)) return;
    if (variant === 'floating') {
      addPanelToFloatingWindow(nodeId, panelId);
    } else {
      addPanelToTabGroup(nodeId, panelId);
    }
    closeMenu();
  };

  const handleAddDocument = (panelId: PanelId) => {
    if (variant === 'floating') {
      addDocumentToFloatingWindow(nodeId, panelId);
    } else {
      addDocumentToTabGroup(nodeId, panelId);
    }
    closeMenu();
  };

  const menuBtnClass =
    variant === 'floating'
      ? `floating-window__menu-btn ${openSource === 'button' ? 'floating-window__menu-btn--open' : ''}`
      : `panel-container__menu-btn ${openSource === 'button' ? 'panel-container__menu-btn--open' : ''}`;

  return (
    <div className="panel-tab-bar-menu">
      <button
        ref={triggerRef}
        type="button"
        className={menuBtnClass}
        aria-label="Tab group menu"
        aria-expanded={openSource === 'button'}
        aria-haspopup="menu"
        title="Tab group menu"
        onClick={() =>
          setOpenSource((current) => (current === 'button' ? null : 'button'))
        }
        onPointerDown={(event) => event.stopPropagation()}
      >
        <MenuIcon />
      </button>

      <TransientMenuPortal
        open={open}
        anchorRef={triggerRef}
        align="start"
        pointerPosition={openSource === 'context' ? contextMenuPoint : null}
        portalRef={menuPortalRef}
        ignoreRefs={[addTabMenuRef, addTabNestedMenuRef, addDocumentMenuRef]}
        onClose={closeMenu}
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
          {showAddTab ? (
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
          ) : null}
          {showAddDocument ? (
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
          ) : null}
        </div>
      </TransientMenuPortal>

      {showAddTab ? (
        <AddTabMenu
          open={open && activeSubmenu === 'add-tab' && !addTabDisabled}
          anchorRef={addTabRef}
          portalRef={addTabMenuRef}
          nestedPortalRef={addTabNestedMenuRef}
          onAddPanel={handleAddPanel}
          onClose={closeMenu}
        />
      ) : null}

      {showAddDocument ? (
        <AddDocumentMenu
          open={open && activeSubmenu === 'add-document' && !addDocumentDisabled}
          anchorRef={addDocumentRef}
          portalRef={addDocumentMenuRef}
          items={studio2026 ? STUDIO_2026_SCRIPT_DOCUMENT_MENU_ITEMS : undefined}
          onAddPanel={handleAddDocument}
          onClose={closeMenu}
        />
      ) : null}
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
