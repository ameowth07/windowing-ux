import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { APP_BAR_MENU_ITEMS } from '../data/studioMenuItems';
import {
  getUndockPosition,
  useFloatingContainer,
} from '../context/FloatingContainerContext';
import { useAuxiliaryWindowSize } from '../context/AuxiliaryWindowSizeContext';
import { usePrimaryWindowId } from '../context/PrimaryWindowContext';
import { usePrimaryWindows } from '../context/PrimaryWindowsContext';
import { useLayout } from '../context/LayoutContext';
import { useSavedLayouts } from '../context/SavedLayoutsContext';
import { getRecentProjectIdForMenuAction } from '../config/recentProjects';
import { useScopeTabs } from '../context/ScopeTabContext';
import { collectAllPanelIds } from '../model/layoutOperations';
import type { PanelId } from '../types/layout';
import { cloneLayoutState } from '../utils/cloneLayoutState';
import { createDocumentPanelInstanceId } from '../utils/panelId';
import { FileSubmenu } from './FileSubmenu';
import { SaveLayoutDialog } from './SaveLayoutDialog';
import { SaveProjectDialog } from './SaveProjectDialog';
import { AddDocumentMenu } from './layout/AddDocumentMenu';
import { AddTabMenu } from './layout/AddTabMenu';
import { OpenLayoutMenu } from './layout/OpenLayoutMenu';
import { TransientMenuPortal, TransientSubmenuPortal } from './layout/TransientMenuPortal';
import './StudioMenu.css';
import './layout/TransientMenuPortal.css';

type AppBarMenuSubmenu = 'file' | 'window' | null;
type WindowMenuSubmenu = 'add-tab' | 'add-document' | 'open-layout' | null;

interface AppBarMenuProps {
  children: (props: {
    open: boolean;
    toggle: () => void;
    triggerRef: RefObject<HTMLButtonElement | null>;
  }) => ReactNode;
}

export function AppBarMenu({ children }: AppBarMenuProps) {
  const { createNewProject, openRecentProject } = useScopeTabs();
  const { floatPanel, state, setLayoutState } = useLayout();
  const { getSize: getAuxiliaryWindowSize } = useAuxiliaryWindowSize();
  const { savedLayouts, saveLayout } = useSavedLayouts();
  const windowId = usePrimaryWindowId();
  const { getWindow } = usePrimaryWindows();
  const monitorIndex = getWindow(windowId)?.monitorIndex ?? 0;
  const floatingContainerRef = useFloatingContainer(monitorIndex);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fileMenuRef = useRef<HTMLButtonElement>(null);
  const windowMenuRef = useRef<HTMLButtonElement>(null);
  const addTabRef = useRef<HTMLButtonElement>(null);
  const addDocumentRef = useRef<HTMLButtonElement>(null);
  const openLayoutRef = useRef<HTMLButtonElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const fileSubmenuRef = useRef<HTMLDivElement>(null);
  const fileRecentRef = useRef<HTMLButtonElement>(null);
  const fileRecentMenuRef = useRef<HTMLDivElement>(null);
  const windowSubmenuRef = useRef<HTMLDivElement>(null);
  const addTabMenuRef = useRef<HTMLDivElement>(null);
  const addTabNestedMenuRef = useRef<HTMLDivElement>(null);
  const addDocumentMenuRef = useRef<HTMLDivElement>(null);
  const openLayoutMenuRef = useRef<HTMLDivElement>(null);
  const submenuCloseTimerRef = useRef<number | null>(null);
  const windowSubmenuCloseTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [saveLayoutDialogOpen, setSaveLayoutDialogOpen] = useState(false);
  const [saveProjectDialogOpen, setSaveProjectDialogOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<AppBarMenuSubmenu>(null);
  const [windowSubmenu, setWindowSubmenu] = useState<WindowMenuSubmenu>(null);

  const toggle = () => setOpen((current) => !current);
  const close = () => setOpen(false);

  const clearSubmenuCloseTimer = () => {
    if (submenuCloseTimerRef.current !== null) {
      window.clearTimeout(submenuCloseTimerRef.current);
      submenuCloseTimerRef.current = null;
    }
  };

  const clearWindowSubmenuCloseTimer = () => {
    if (windowSubmenuCloseTimerRef.current !== null) {
      window.clearTimeout(windowSubmenuCloseTimerRef.current);
      windowSubmenuCloseTimerRef.current = null;
    }
  };

  const isPointerOverSubmenuArea = () => {
    const overFile = fileMenuRef.current?.matches(':hover') ?? false;
    const overFileSubmenu = fileSubmenuRef.current?.matches(':hover') ?? false;
    const overFileRecent = fileRecentRef.current?.matches(':hover') ?? false;
    const overFileRecentMenu = fileRecentMenuRef.current?.matches(':hover') ?? false;
    const overWindow = windowMenuRef.current?.matches(':hover') ?? false;
    const overWindowSubmenu = windowSubmenuRef.current?.matches(':hover') ?? false;
    const overAddTab = addTabRef.current?.matches(':hover') ?? false;
    const overAddDocument = addDocumentRef.current?.matches(':hover') ?? false;
    const overAddTabMenu = addTabMenuRef.current?.matches(':hover') ?? false;
    const overAddTabNestedMenu = addTabNestedMenuRef.current?.matches(':hover') ?? false;
    const overAddDocumentMenu = addDocumentMenuRef.current?.matches(':hover') ?? false;
    const overOpenLayout = openLayoutRef.current?.matches(':hover') ?? false;
    const overOpenLayoutMenu = openLayoutMenuRef.current?.matches(':hover') ?? false;
    return (
      overFile ||
      overFileSubmenu ||
      overFileRecent ||
      overFileRecentMenu ||
      overWindow ||
      overWindowSubmenu ||
      overAddTab ||
      overAddDocument ||
      overAddTabMenu ||
      overAddTabNestedMenu ||
      overAddDocumentMenu ||
      overOpenLayout ||
      overOpenLayoutMenu
    );
  };

  const isPointerOverWindowSubmenuArea = () => {
    const overAddTab = addTabRef.current?.matches(':hover') ?? false;
    const overAddDocument = addDocumentRef.current?.matches(':hover') ?? false;
    const overOpenLayout = openLayoutRef.current?.matches(':hover') ?? false;
    const overWindowSubmenu = windowSubmenuRef.current?.matches(':hover') ?? false;
    const overAddTabMenu = addTabMenuRef.current?.matches(':hover') ?? false;
    const overAddTabNestedMenu = addTabNestedMenuRef.current?.matches(':hover') ?? false;
    const overAddDocumentMenu = addDocumentMenuRef.current?.matches(':hover') ?? false;
    const overOpenLayoutMenu = openLayoutMenuRef.current?.matches(':hover') ?? false;
    return (
      overAddTab ||
      overAddDocument ||
      overOpenLayout ||
      overWindowSubmenu ||
      overAddTabMenu ||
      overAddTabNestedMenu ||
      overAddDocumentMenu ||
      overOpenLayoutMenu
    );
  };

  const openSubmenu = (submenu: AppBarMenuSubmenu) => {
    clearSubmenuCloseTimer();
    setActiveSubmenu(submenu);
    if (submenu !== 'window') {
      setWindowSubmenu(null);
    }
  };

  const scheduleSubmenuClose = () => {
    clearSubmenuCloseTimer();
    submenuCloseTimerRef.current = window.setTimeout(() => {
      if (!isPointerOverSubmenuArea()) {
        setActiveSubmenu(null);
        setWindowSubmenu(null);
      }
      submenuCloseTimerRef.current = null;
    }, 100);
  };

  const openWindowSubmenu = (submenu: WindowMenuSubmenu) => {
    clearWindowSubmenuCloseTimer();
    setWindowSubmenu(submenu);
  };

  const scheduleWindowSubmenuClose = () => {
    clearWindowSubmenuCloseTimer();
    windowSubmenuCloseTimerRef.current = window.setTimeout(() => {
      if (!isPointerOverWindowSubmenuArea()) {
        setWindowSubmenu(null);
      }
      windowSubmenuCloseTimerRef.current = null;
    }, 100);
  };

  const floatPanelAtDefaultPosition = (panelId: PanelId) => {
    const size = getAuxiliaryWindowSize(panelId);
    const { x, y } = getUndockPosition(
      floatingContainerRef?.current ?? null,
      size.width,
      size.height,
    );
    floatPanel(panelId, x, y, size.width, size.height);
  };

  const handleFileAction = (actionId: string) => {
    if (actionId === 'new-project') {
      createNewProject();
      close();
      return;
    }

    if (actionId === 'save-project') {
      close();
      setSaveProjectDialogOpen(true);
      return;
    }

    if (actionId === 'project-settings') {
      floatPanelAtDefaultPosition('project-settings');
      close();
      return;
    }

    const recentProjectId = getRecentProjectIdForMenuAction(actionId);
    if (recentProjectId) {
      openRecentProject(recentProjectId);
    }
    close();
  };

  const handleAddPanel = (panelId: PanelId) => {
    floatPanelAtDefaultPosition(panelId);
    close();
  };

  const handleAddDocument = (basePanelId: PanelId) => {
    const existingPanelIds = collectAllPanelIds(state.root, state.floating);
    const instanceId = createDocumentPanelInstanceId(basePanelId, existingPanelIds);
    floatPanelAtDefaultPosition(instanceId);
    close();
  };

  const handleSaveLayoutClick = () => {
    close();
    setSaveLayoutDialogOpen(true);
  };

  const handleSaveLayoutConfirm = (name: string) => {
    saveLayout(name, state);
    setSaveLayoutDialogOpen(false);
  };

  const handleOpenLayout = (layoutId: string) => {
    const layout = savedLayouts.find((entry) => entry.id === layoutId);
    if (!layout) return;
    setLayoutState(cloneLayoutState(layout.state));
    close();
  };

  useEffect(() => {
    if (!open) {
      setActiveSubmenu(null);
      setWindowSubmenu(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
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
      if (windowSubmenuCloseTimerRef.current !== null) {
        window.clearTimeout(windowSubmenuCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {children({ open, toggle, triggerRef })}
      <TransientMenuPortal
        open={open}
        anchorRef={triggerRef}
        align="start"
        portalRef={menuPortalRef}
        ignoreRefs={[
          fileSubmenuRef,
          fileRecentMenuRef,
          windowSubmenuRef,
          addTabMenuRef,
          addTabNestedMenuRef,
          addDocumentMenuRef,
          openLayoutMenuRef,
        ]}
        onClose={close}
      >
        <div className="studio-menu" role="menu">
          {APP_BAR_MENU_ITEMS.map((item) => {
            if (item.id === 'file') {
              return (
                <button
                  key={item.id}
                  ref={fileMenuRef}
                  type="button"
                  role="menuitem"
                  className={`studio-menu__item studio-menu__item--submenu ${activeSubmenu === 'file' ? 'studio-menu__item--submenu-open' : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={activeSubmenu === 'file'}
                  onMouseEnter={() => openSubmenu('file')}
                  onMouseLeave={scheduleSubmenuClose}
                  onFocus={() => openSubmenu('file')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openSubmenu('file');
                  }}
                >
                  <span className="studio-menu__item-label">{item.label}</span>
                  <span className="studio-menu__item-chevron" aria-hidden="true">
                    <ChevronRightIcon />
                  </span>
                </button>
              );
            }

            if (item.id === 'window') {
              return (
                <button
                  key={item.id}
                  ref={windowMenuRef}
                  type="button"
                  role="menuitem"
                  className={`studio-menu__item studio-menu__item--submenu ${activeSubmenu === 'window' ? 'studio-menu__item--submenu-open' : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={activeSubmenu === 'window'}
                  onMouseEnter={() => openSubmenu('window')}
                  onMouseLeave={scheduleSubmenuClose}
                  onFocus={() => openSubmenu('window')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openSubmenu('window');
                  }}
                >
                  <span className="studio-menu__item-label">{item.label}</span>
                  <span className="studio-menu__item-chevron" aria-hidden="true">
                    <ChevronRightIcon />
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className="studio-menu__item studio-menu__item--submenu"
                aria-haspopup="menu"
                onMouseEnter={() => {
                  setActiveSubmenu(null);
                  setWindowSubmenu(null);
                }}
                onClick={close}
              >
                <span className="studio-menu__item-label">{item.label}</span>
                <span className="studio-menu__item-chevron" aria-hidden="true">
                  <ChevronRightIcon />
                </span>
              </button>
            );
          })}
        </div>
      </TransientMenuPortal>

      <FileSubmenu
        open={open && activeSubmenu === 'file'}
        anchorRef={fileMenuRef}
        portalRef={fileSubmenuRef}
        recentAnchorRef={fileRecentRef}
        recentPortalRef={fileRecentMenuRef}
        onAction={handleFileAction}
        onPointerEnter={clearSubmenuCloseTimer}
        onPointerLeave={scheduleSubmenuClose}
      />

      <TransientSubmenuPortal
        open={open && activeSubmenu === 'window'}
        anchorRef={windowMenuRef}
        offsetX={4}
        portalRef={windowSubmenuRef}
        onPointerEnter={clearSubmenuCloseTimer}
        onPointerLeave={scheduleSubmenuClose}
      >
        <div className="studio-menu studio-menu--auto" role="menu">
          <button
            ref={addTabRef}
            type="button"
            role="menuitem"
            className={`studio-menu__item studio-menu__item--submenu ${windowSubmenu === 'add-tab' ? 'studio-menu__item--submenu-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={windowSubmenu === 'add-tab'}
            onMouseEnter={() => openWindowSubmenu('add-tab')}
            onMouseLeave={scheduleWindowSubmenuClose}
            onFocus={() => openWindowSubmenu('add-tab')}
            onClick={(event) => {
              event.stopPropagation();
              openWindowSubmenu('add-tab');
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
            className={`studio-menu__item studio-menu__item--submenu ${windowSubmenu === 'add-document' ? 'studio-menu__item--submenu-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={windowSubmenu === 'add-document'}
            onMouseEnter={() => openWindowSubmenu('add-document')}
            onMouseLeave={scheduleWindowSubmenuClose}
            onFocus={() => openWindowSubmenu('add-document')}
            onClick={(event) => {
              event.stopPropagation();
              openWindowSubmenu('add-document');
            }}
          >
            <span className="studio-menu__item-label">Add New Document</span>
            <span className="studio-menu__item-chevron" aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </button>
          <div className="studio-menu__divider" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="studio-menu__item"
            onMouseEnter={() => setWindowSubmenu(null)}
            onClick={handleSaveLayoutClick}
          >
            <span className="studio-menu__item-label">Save Layout</span>
          </button>
          <button
            ref={openLayoutRef}
            type="button"
            role="menuitem"
            className={`studio-menu__item studio-menu__item--submenu ${windowSubmenu === 'open-layout' ? 'studio-menu__item--submenu-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={windowSubmenu === 'open-layout'}
            onMouseEnter={() => openWindowSubmenu('open-layout')}
            onMouseLeave={scheduleWindowSubmenuClose}
            onFocus={() => openWindowSubmenu('open-layout')}
            onClick={(event) => {
              event.stopPropagation();
              openWindowSubmenu('open-layout');
            }}
          >
            <span className="studio-menu__item-label">Open Layout</span>
            <span className="studio-menu__item-chevron" aria-hidden="true">
              <ChevronRightIcon />
            </span>
          </button>
        </div>
      </TransientSubmenuPortal>

      <AddTabMenu
        open={open && activeSubmenu === 'window' && windowSubmenu === 'add-tab'}
        anchorRef={addTabRef}
        portalRef={addTabMenuRef}
        nestedPortalRef={addTabNestedMenuRef}
        onAddPanel={handleAddPanel}
        onClose={close}
        floatingMode
      />

      <AddDocumentMenu
        open={open && activeSubmenu === 'window' && windowSubmenu === 'add-document'}
        anchorRef={addDocumentRef}
        portalRef={addDocumentMenuRef}
        onAddPanel={handleAddDocument}
        onClose={close}
      />

      <OpenLayoutMenu
        open={open && activeSubmenu === 'window' && windowSubmenu === 'open-layout'}
        anchorRef={openLayoutRef}
        portalRef={openLayoutMenuRef}
        layouts={savedLayouts}
        onOpenLayout={handleOpenLayout}
        onPointerEnter={clearWindowSubmenuCloseTimer}
        onPointerLeave={scheduleWindowSubmenuClose}
      />

      <SaveLayoutDialog
        open={saveLayoutDialogOpen}
        onSave={handleSaveLayoutConfirm}
        onClose={() => setSaveLayoutDialogOpen(false)}
      />

      <SaveProjectDialog
        open={saveProjectDialogOpen}
        onSave={() => setSaveProjectDialogOpen(false)}
        onClose={() => setSaveProjectDialogOpen(false)}
      />
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
