import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getInitialLayoutForScopeTab,
  shouldResetScopeTabLayout,
} from '../data/initialLayout';
import { useProjectTabBarEnabled } from './ProjectTabBarContext';
import { useScopeTabs } from './ScopeTabContext';
import { cloneLayoutState } from '../utils/cloneLayoutState';
import { getDefaultAuxiliaryWindowSize } from '../config/auxiliaryWindowSizes';
import {
  addDocumentToFloatingWindow,
  addDocumentToTabGroup,
  collectAllPanelIds,
  collectDockedPanelIds,
  createNodeId,
  dockPanel,
  dockPanelAtTabIndex,
  dockFloatingWindow,
  dockTabGroupAtTabIndex,
  dockFloatingWindowAtTabIndex,
  extractTabGroup,
  mergeTabGroupIntoFloating,
  mergeFloatingWindowIntoFloating,
  mergePanelIntoFloatingWindow,
  mergeFloatingTabUpdate,
  removeLayoutNodeFromTree,
  removePanelFromFloating,
  removePanelFromTree,
  setActiveTab,
  swapTabGroupPanels,
  applyLocalizedSplitResize,
  setSplitRatio,
  swapFloatingPanels,
  findNodeById,
} from '../model/layoutOperations';
import type {
  DropZone,
  FloatingWindow,
  LayoutState,
  PanelId,
} from '../types/layout';

type LayoutAction =
  | {
      type: 'DOCK_PANEL';
      panelId: PanelId;
      targetNodeId: string;
      zone: DropZone;
    }
  | {
      type: 'DOCK_PANEL_AT_TAB_INDEX';
      panelId: PanelId;
      targetNodeId: string;
      index: number;
    }
  | {
      type: 'FLOAT_PANEL';
      panelId: PanelId;
      x: number;
      y: number;
      width?: number;
      height?: number;
      scopeTabId?: string;
    }
  | {
      type: 'MOVE_FLOATING';
      floatingWindowId: string;
      x: number;
      y: number;
    }
  | {
      type: 'RESIZE_FLOATING';
      floatingWindowId: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: 'CLOSE_FLOATING';
      floatingWindowId: string;
    }
  | {
      type: 'MERGE_FLOATING_TAB';
      floatingWindowId: string;
      panelId: PanelId;
      index: number;
    }
  | {
      type: 'DOCK_FLOATING_WINDOW';
      floatingWindowId: string;
      targetNodeId: string;
      zone: DropZone;
    }
  | {
      type: 'FLOAT_TAB_GROUP';
      nodeId: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      scopeTabId?: string;
    }
  | {
      type: 'DOCK_TAB_GROUP';
      nodeId: string;
      targetNodeId: string;
      zone: DropZone;
    }
  | {
      type: 'DOCK_TAB_GROUP_AT_TAB_INDEX';
      nodeId: string;
      targetNodeId: string;
      index: number;
    }
  | {
      type: 'MERGE_TAB_GROUP_INTO_FLOATING';
      nodeId: string;
      floatingWindowId: string;
    }
  | {
      type: 'DOCK_FLOATING_WINDOW_AT_TAB_INDEX';
      floatingWindowId: string;
      targetNodeId: string;
      index: number;
    }
  | {
      type: 'MERGE_FLOATING_WINDOW_INTO_FLOATING';
      sourceWindowId: string;
      targetWindowId: string;
      index?: number;
    }
  | {
      type: 'SET_FLOATING_ACTIVE_TAB';
      floatingWindowId: string;
      panelId: PanelId;
    }
  | {
      type: 'SELECT_FLOATING_OVERFLOW_TAB';
      floatingWindowId: string;
      panelId: PanelId;
      replacePanelId: PanelId;
    }
  | {
      type: 'SET_ACTIVE_TAB';
      tabGroupId: string;
      panelId: PanelId;
    }
  | {
      type: 'SELECT_TAB_OVERFLOW';
      tabGroupId: string;
      panelId: PanelId;
      replacePanelId: PanelId;
    }
  | {
      type: 'SET_SPLIT_RATIO';
      splitId: string;
      ratio: number;
    }
  | {
      type: 'APPLY_LOCALIZED_SPLIT_RESIZE';
      splitId: string;
      deltaPx: number;
      containerInnerSize: number;
    }
  | {
      type: 'CLOSE_TAB';
      panelId: PanelId;
    }
  | {
      type: 'ADD_PANEL_TO_TAB_GROUP';
      tabGroupId: string;
      panelId: PanelId;
    }
  | {
      type: 'ADD_PANEL_TO_FLOATING_WINDOW';
      floatingWindowId: string;
      panelId: PanelId;
    }
  | {
      type: 'ADD_DOCUMENT_TO_TAB_GROUP';
      tabGroupId: string;
      basePanelId: PanelId;
    }
  | {
      type: 'ADD_DOCUMENT_TO_FLOATING_WINDOW';
      floatingWindowId: string;
      basePanelId: PanelId;
    }
  | {
      type: 'SET_STATE';
      state: LayoutState;
    };

function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case 'DOCK_PANEL': {
      const floating = removePanelFromFloating(state.floating, action.panelId);
      return {
        root: dockPanel(
          state.root,
          action.panelId,
          action.targetNodeId,
          action.zone,
        ),
        floating,
      };
    }
    case 'DOCK_PANEL_AT_TAB_INDEX': {
      const floating = removePanelFromFloating(state.floating, action.panelId);
      return {
        root: dockPanelAtTabIndex(
          state.root,
          action.panelId,
          action.targetNodeId,
          action.index,
        ),
        floating,
      };
    }
    case 'FLOAT_PANEL': {
      const root = removePanelFromTree(state.root, action.panelId);
      const existing = state.floating.find((window) =>
        window.panels.includes(action.panelId),
      );
      if (existing) {
        return {
          root,
          floating: state.floating.map((window) =>
            window.id === existing.id
              ? {
                  ...window,
                  x: action.x,
                  y: action.y,
                  width: action.width ?? window.width,
                  height: action.height ?? window.height,
                }
              : window,
          ),
        };
      }
      const floatingWindow: FloatingWindow = {
        id: createNodeId('float'),
        activeTabId: action.panelId,
        panels: [action.panelId],
        x: action.x,
        y: action.y,
        width: action.width ?? getDefaultAuxiliaryWindowSize(action.panelId).width,
        height: action.height ?? getDefaultAuxiliaryWindowSize(action.panelId).height,
        scopeTabId: action.scopeTabId,
      };
      return {
        root,
        floating: [
          ...removePanelFromFloating(state.floating, action.panelId),
          floatingWindow,
        ],
      };
    }
    case 'MOVE_FLOATING':
      return {
        ...state,
        floating: state.floating.map((window) =>
          window.id === action.floatingWindowId
            ? { ...window, x: action.x, y: action.y }
            : window,
        ),
      };
    case 'RESIZE_FLOATING':
      return {
        ...state,
        floating: state.floating.map((window) =>
          window.id === action.floatingWindowId
            ? {
                ...window,
                x: action.x,
                y: action.y,
                width: action.width,
                height: action.height,
              }
            : window,
        ),
      };
    case 'CLOSE_FLOATING': {
      const target = state.floating.find(
        (window) => window.id === action.floatingWindowId,
      );
      if (!target) return state;
      let root = state.root;
      for (const panelId of target.panels) {
        root = dockPanel(root, panelId, '__workspace_root__', 'right');
      }
      return {
        root,
        floating: state.floating.filter(
          (window) => window.id !== action.floatingWindowId,
        ),
      };
    }
    case 'MERGE_FLOATING_TAB': {
      const { root, floating } = mergeFloatingTabUpdate(
        state.root,
        state.floating,
        action.floatingWindowId,
        action.panelId,
        action.index,
      );
      return { root, floating };
    }
    case 'DOCK_FLOATING_WINDOW': {
      const target = state.floating.find(
        (window) => window.id === action.floatingWindowId,
      );
      if (!target) return state;
      return {
        root: dockFloatingWindow(
          state.root,
          target.panels,
          target.activeTabId,
          action.targetNodeId,
          action.zone,
        ),
        floating: state.floating.filter(
          (window) => window.id !== action.floatingWindowId,
        ),
      };
    }
    case 'FLOAT_TAB_GROUP': {
      const node = findNodeById(state.root, action.nodeId);
      const group = extractTabGroup(node);
      if (!group) return state;

      const root = removeLayoutNodeFromTree(state.root, action.nodeId);
      const floatingWithoutPanels = group.panels.reduce(
        (current, panelId) => removePanelFromFloating(current, panelId),
        state.floating,
      );
      const floatingWindow: FloatingWindow = {
        id: createNodeId('float'),
        activeTabId: group.activeTabId,
        panels: [...group.panels],
        x: action.x,
        y: action.y,
        width:
          action.width ?? getDefaultAuxiliaryWindowSize(group.activeTabId).width,
        height:
          action.height ?? getDefaultAuxiliaryWindowSize(group.activeTabId).height,
        scopeTabId: action.scopeTabId,
      };

      return {
        root,
        floating: [...floatingWithoutPanels, floatingWindow],
      };
    }
    case 'DOCK_TAB_GROUP': {
      const node = findNodeById(state.root, action.nodeId);
      const group = extractTabGroup(node);
      if (!group) return state;

      const root = dockFloatingWindow(
        removeLayoutNodeFromTree(state.root, action.nodeId),
        group.panels,
        group.activeTabId,
        action.targetNodeId,
        action.zone,
      );
      const floating = group.panels.reduce(
        (current, panelId) => removePanelFromFloating(current, panelId),
        state.floating,
      );

      return { root, floating };
    }
    case 'DOCK_TAB_GROUP_AT_TAB_INDEX': {
      const node = findNodeById(state.root, action.nodeId);
      const group = extractTabGroup(node);
      if (!group) return state;

      const root = dockTabGroupAtTabIndex(
        state.root,
        action.nodeId,
        action.targetNodeId,
        action.index,
      );
      const floating = group.panels.reduce(
        (current, panelId) => removePanelFromFloating(current, panelId),
        state.floating,
      );

      return { root, floating };
    }
    case 'MERGE_TAB_GROUP_INTO_FLOATING': {
      const { root, floating } = mergeTabGroupIntoFloating(
        state.root,
        state.floating,
        action.nodeId,
        action.floatingWindowId,
      );
      return { root, floating };
    }
    case 'DOCK_FLOATING_WINDOW_AT_TAB_INDEX': {
      const { root, floating } = dockFloatingWindowAtTabIndex(
        state.root,
        state.floating,
        action.floatingWindowId,
        action.targetNodeId,
        action.index,
      );
      return { root, floating };
    }
    case 'MERGE_FLOATING_WINDOW_INTO_FLOATING':
      return {
        ...state,
        floating: mergeFloatingWindowIntoFloating(
          state.floating,
          action.sourceWindowId,
          action.targetWindowId,
          action.index,
        ),
      };
    case 'SET_FLOATING_ACTIVE_TAB':
      return {
        ...state,
        floating: state.floating.map((window) =>
          window.id === action.floatingWindowId
            ? { ...window, activeTabId: action.panelId }
            : window,
        ),
      };
    case 'SELECT_FLOATING_OVERFLOW_TAB':
      return {
        ...state,
        floating: swapFloatingPanels(
          state.floating,
          action.floatingWindowId,
          action.panelId,
          action.replacePanelId,
          action.panelId,
        ),
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        root: state.root
          ? setActiveTab(state.root, action.tabGroupId, action.panelId)
          : null,
      };
    case 'SELECT_TAB_OVERFLOW':
      return {
        ...state,
        root: swapTabGroupPanels(
          state.root,
          action.tabGroupId,
          action.panelId,
          action.replacePanelId,
          action.panelId,
        ),
      };
    case 'SET_SPLIT_RATIO':
      return {
        ...state,
        root: state.root
          ? setSplitRatio(state.root, action.splitId, action.ratio)
          : null,
      };
    case 'APPLY_LOCALIZED_SPLIT_RESIZE':
      return {
        ...state,
        root: applyLocalizedSplitResize(
          state.root,
          action.splitId,
          action.deltaPx,
          action.containerInnerSize,
        ),
      };
    case 'CLOSE_TAB':
      return {
        root: removePanelFromTree(state.root, action.panelId),
        floating: removePanelFromFloating(state.floating, action.panelId),
      };
    case 'ADD_PANEL_TO_TAB_GROUP': {
      const host = findNodeById(state.root, action.tabGroupId);
      if (!host || (host.type !== 'panel' && host.type !== 'tabs')) {
        return state;
      }
      const openPanels =
        host.type === 'tabs' ? host.panels : [host.panelId];
      if (openPanels.includes(action.panelId)) {
        return state;
      }
      const index = openPanels.length;
      return {
        root: dockPanelAtTabIndex(
          state.root,
          action.panelId,
          action.tabGroupId,
          index,
        ),
        floating: removePanelFromFloating(state.floating, action.panelId),
      };
    }
    case 'ADD_PANEL_TO_FLOATING_WINDOW': {
      const target = state.floating.find(
        (window) => window.id === action.floatingWindowId,
      );
      if (!target || target.panels.includes(action.panelId)) {
        return state;
      }
      const root = removePanelFromTree(state.root, action.panelId);
      const floatingWithoutPanel = removePanelFromFloating(
        state.floating,
        action.panelId,
      );
      return {
        root,
        floating: mergePanelIntoFloatingWindow(
          floatingWithoutPanel,
          action.floatingWindowId,
          action.panelId,
          target.panels.length,
        ),
      };
    }
    case 'ADD_DOCUMENT_TO_TAB_GROUP': {
      const existingPanelIds = collectAllPanelIds(state.root, state.floating);
      return {
        root: addDocumentToTabGroup(
          state.root,
          action.basePanelId,
          action.tabGroupId,
          existingPanelIds,
        ),
        floating: state.floating,
      };
    }
    case 'ADD_DOCUMENT_TO_FLOATING_WINDOW': {
      const existingPanelIds = collectAllPanelIds(state.root, state.floating);
      return {
        root: state.root,
        floating: addDocumentToFloatingWindow(
          state.floating,
          action.floatingWindowId,
          action.basePanelId,
          existingPanelIds,
        ),
      };
    }
    case 'SET_STATE':
      return action.state;
    default:
      return state;
  }
}

interface LayoutContextValue {
  state: LayoutState;
  dockedPanelIds: Set<PanelId>;
  dockPanel: (
    panelId: PanelId,
    targetNodeId: string,
    zone: DropZone,
  ) => void;
  dockPanelAtTabIndex: (
    panelId: PanelId,
    targetNodeId: string,
    index: number,
  ) => void;
  floatPanel: (
    panelId: PanelId,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ) => void;
  floatTabGroup: (
    nodeId: string,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ) => void;
  dockTabGroup: (
    nodeId: string,
    targetNodeId: string,
    zone: DropZone,
  ) => void;
  dockTabGroupAtTabIndex: (
    nodeId: string,
    targetNodeId: string,
    index: number,
  ) => void;
  mergeTabGroupIntoFloating: (
    nodeId: string,
    floatingWindowId: string,
  ) => void;
  moveFloating: (floatingWindowId: string, x: number, y: number) => void;
  resizeFloating: (
    floatingWindowId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  closeFloating: (floatingWindowId: string) => void;
  mergeFloatingTab: (
    panelId: PanelId,
    floatingWindowId: string,
    index: number,
  ) => void;
  dockFloatingWindow: (
    floatingWindowId: string,
    targetNodeId: string,
    zone: DropZone,
  ) => void;
  dockFloatingWindowAtTabIndex: (
    floatingWindowId: string,
    targetNodeId: string,
    index: number,
  ) => void;
  mergeFloatingWindowIntoFloating: (
    sourceWindowId: string,
    targetWindowId: string,
    index?: number,
  ) => void;
  setFloatingActiveTab: (floatingWindowId: string, panelId: PanelId) => void;
  selectFloatingOverflowTab: (
    floatingWindowId: string,
    panelId: PanelId,
    replacePanelId: PanelId,
  ) => void;
  setActiveTab: (tabGroupId: string, panelId: PanelId) => void;
  selectTabOverflow: (
    tabGroupId: string,
    panelId: PanelId,
    replacePanelId: PanelId,
  ) => void;
  setSplitRatio: (splitId: string, ratio: number) => void;
  resizeSplitLocalized: (
    splitId: string,
    deltaPx: number,
    containerInnerSize: number,
  ) => void;
  closeTab: (panelId: PanelId) => void;
  addPanelToTabGroup: (tabGroupId: string, panelId: PanelId) => void;
  addPanelToFloatingWindow: (floatingWindowId: string, panelId: PanelId) => void;
  addDocumentToTabGroup: (tabGroupId: string, basePanelId: PanelId) => void;
  addDocumentToFloatingWindow: (
    floatingWindowId: string,
    basePanelId: PanelId,
  ) => void;
  setLayoutState: (state: LayoutState) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

interface LayoutProviderProps {
  windowId: string;
  children: ReactNode;
}

export function LayoutProvider({ windowId, children }: LayoutProviderProps) {
  const projectTabBar = useProjectTabBarEnabled();
  const { tabs, getActiveTabForWindow } = useScopeTabs();
  const activeTabId = getActiveTabForWindow(windowId);
  const windowTabs = useMemo(
    () => tabs.filter((tab) => tab.windowId === windowId),
    [tabs, windowId],
  );
  const layoutScopeId = projectTabBar ? activeTabId : windowId;
  const [scopedLayouts, setScopedLayouts] = useState<
    Record<string, LayoutState>
  >({});
  const layoutScopeIdRef = useRef(layoutScopeId);
  layoutScopeIdRef.current = layoutScopeId;
  const prevProjectTabBarRef = useRef(projectTabBar);

  const state = useMemo(() => {
    return (
      scopedLayouts[layoutScopeId] ??
      getInitialLayoutForScopeTab(activeTabId)
    );
  }, [scopedLayouts, layoutScopeId, activeTabId]);

  const dispatchLayout = useCallback(
    (action: LayoutAction) => {
      setScopedLayouts((current) => {
        const scopeId = layoutScopeIdRef.current;
        const tabLayout =
          current[scopeId] ??
          cloneLayoutState(getInitialLayoutForScopeTab(activeTabId));
        return {
          ...current,
          [scopeId]: layoutReducer(tabLayout, action),
        };
      });
    },
    [activeTabId],
  );

  useEffect(() => {
    setScopedLayouts((current) => {
      let changed = false;
      const next = { ...current };

      if (projectTabBar) {
        for (const tab of windowTabs) {
          const existing = next[tab.id];
          if (existing && !shouldResetScopeTabLayout(existing, tab.id)) {
            continue;
          }
          next[tab.id] = cloneLayoutState(getInitialLayoutForScopeTab(tab.id));
          changed = true;
        }
      } else if (!next[windowId]) {
        next[windowId] = cloneLayoutState(
          getInitialLayoutForScopeTab(activeTabId),
        );
        changed = true;
      }

      return changed ? next : current;
    });
  }, [projectTabBar, windowId, windowTabs, activeTabId]);

  useEffect(() => {
    const openScopeIds = projectTabBar
      ? new Set(windowTabs.map((tab) => tab.id))
      : new Set([windowId]);

    setScopedLayouts((current) => {
      let changed = false;
      const next = { ...current };
      for (const scopeId of Object.keys(next)) {
        if (!openScopeIds.has(scopeId)) {
          delete next[scopeId];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [projectTabBar, windowId, windowTabs]);

  useEffect(() => {
    const wasEnabled = prevProjectTabBarRef.current;
    prevProjectTabBarRef.current = projectTabBar;

    if (wasEnabled && !projectTabBar) {
      setScopedLayouts((current) => {
        const activeLayout = current[activeTabId];
        if (!activeLayout) return current;
        return { [windowId]: cloneLayoutState(activeLayout) };
      });
      return;
    }

    if (!wasEnabled && projectTabBar) {
      setScopedLayouts((current) => {
        const windowLayout = current[windowId];
        if (!windowLayout) return current;

        const next: Record<string, LayoutState> = {};
        for (const tab of windowTabs) {
          next[tab.id] =
            tab.id === activeTabId
              ? cloneLayoutState(windowLayout)
              : cloneLayoutState(getInitialLayoutForScopeTab(tab.id));
        }
        return next;
      });
    }
  }, [projectTabBar, windowId, activeTabId, windowTabs]);

  const dockedPanelIds = useMemo(
    () => collectDockedPanelIds(state.root),
    [state.root],
  );

  const dockPanelAction = useCallback(
    (panelId: PanelId, targetNodeId: string, zone: DropZone) => {
      dispatchLayout({ type: 'DOCK_PANEL', panelId, targetNodeId, zone });
    },
    [dispatchLayout],
  );

  const dockPanelAtTabIndexAction = useCallback(
    (panelId: PanelId, targetNodeId: string, index: number) => {
      dispatchLayout({
        type: 'DOCK_PANEL_AT_TAB_INDEX',
        panelId,
        targetNodeId,
        index,
      });
    },
    [dispatchLayout],
  );

  const floatPanelAction = useCallback(
    (
      panelId: PanelId,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ) => {
      dispatchLayout({
        type: 'FLOAT_PANEL',
        panelId,
        x,
        y,
        width,
        height,
        scopeTabId: projectTabBar ? activeTabId : undefined,
      });
    },
    [dispatchLayout, projectTabBar, activeTabId],
  );

  const floatTabGroupAction = useCallback(
    (
      nodeId: string,
      x: number,
      y: number,
      width?: number,
      height?: number,
    ) => {
      dispatchLayout({
        type: 'FLOAT_TAB_GROUP',
        nodeId,
        x,
        y,
        width,
        height,
        scopeTabId: projectTabBar ? activeTabId : undefined,
      });
    },
    [dispatchLayout, projectTabBar, activeTabId],
  );

  const dockTabGroupAction = useCallback(
    (nodeId: string, targetNodeId: string, zone: DropZone) => {
      dispatchLayout({ type: 'DOCK_TAB_GROUP', nodeId, targetNodeId, zone });
    },
    [dispatchLayout],
  );

  const dockTabGroupAtTabIndexAction = useCallback(
    (nodeId: string, targetNodeId: string, index: number) => {
      dispatchLayout({
        type: 'DOCK_TAB_GROUP_AT_TAB_INDEX',
        nodeId,
        targetNodeId,
        index,
      });
    },
    [dispatchLayout],
  );

  const mergeTabGroupIntoFloatingAction = useCallback(
    (nodeId: string, floatingWindowId: string) => {
      dispatchLayout({
        type: 'MERGE_TAB_GROUP_INTO_FLOATING',
        nodeId,
        floatingWindowId,
      });
    },
    [dispatchLayout],
  );

  const moveFloatingAction = useCallback(
    (floatingWindowId: string, x: number, y: number) => {
      dispatchLayout({ type: 'MOVE_FLOATING', floatingWindowId, x, y });
    },
    [dispatchLayout],
  );

  const resizeFloatingAction = useCallback(
    (
      floatingWindowId: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      dispatchLayout({
        type: 'RESIZE_FLOATING',
        floatingWindowId,
        x,
        y,
        width,
        height,
      });
    },
    [dispatchLayout],
  );

  const closeFloatingAction = useCallback(
    (floatingWindowId: string) => {
      dispatchLayout({ type: 'CLOSE_FLOATING', floatingWindowId });
    },
    [dispatchLayout],
  );

  const mergeFloatingTabAction = useCallback(
    (panelId: PanelId, floatingWindowId: string, index: number) => {
      dispatchLayout({
        type: 'MERGE_FLOATING_TAB',
        panelId,
        floatingWindowId,
        index,
      });
    },
    [dispatchLayout],
  );

  const dockFloatingWindowAction = useCallback(
    (floatingWindowId: string, targetNodeId: string, zone: DropZone) => {
      dispatchLayout({
        type: 'DOCK_FLOATING_WINDOW',
        floatingWindowId,
        targetNodeId,
        zone,
      });
    },
    [dispatchLayout],
  );

  const dockFloatingWindowAtTabIndexAction = useCallback(
    (floatingWindowId: string, targetNodeId: string, index: number) => {
      dispatchLayout({
        type: 'DOCK_FLOATING_WINDOW_AT_TAB_INDEX',
        floatingWindowId,
        targetNodeId,
        index,
      });
    },
    [dispatchLayout],
  );

  const mergeFloatingWindowIntoFloatingAction = useCallback(
    (sourceWindowId: string, targetWindowId: string, index?: number) => {
      dispatchLayout({
        type: 'MERGE_FLOATING_WINDOW_INTO_FLOATING',
        sourceWindowId,
        targetWindowId,
        index,
      });
    },
    [dispatchLayout],
  );

  const setFloatingActiveTabAction = useCallback(
    (floatingWindowId: string, panelId: PanelId) => {
      dispatchLayout({
        type: 'SET_FLOATING_ACTIVE_TAB',
        floatingWindowId,
        panelId,
      });
    },
    [dispatchLayout],
  );

  const selectFloatingOverflowTabAction = useCallback(
    (
      floatingWindowId: string,
      panelId: PanelId,
      replacePanelId: PanelId,
    ) => {
      dispatchLayout({
        type: 'SELECT_FLOATING_OVERFLOW_TAB',
        floatingWindowId,
        panelId,
        replacePanelId,
      });
    },
    [dispatchLayout],
  );

  const setActiveTabAction = useCallback(
    (tabGroupId: string, panelId: PanelId) => {
      dispatchLayout({ type: 'SET_ACTIVE_TAB', tabGroupId, panelId });
    },
    [dispatchLayout],
  );

  const selectTabOverflowAction = useCallback(
    (tabGroupId: string, panelId: PanelId, replacePanelId: PanelId) => {
      dispatchLayout({
        type: 'SELECT_TAB_OVERFLOW',
        tabGroupId,
        panelId,
        replacePanelId,
      });
    },
    [dispatchLayout],
  );

  const setSplitRatioAction = useCallback(
    (splitId: string, ratio: number) => {
      dispatchLayout({ type: 'SET_SPLIT_RATIO', splitId, ratio });
    },
    [dispatchLayout],
  );

  const resizeSplitLocalizedAction = useCallback(
    (splitId: string, deltaPx: number, containerInnerSize: number) => {
      dispatchLayout({
        type: 'APPLY_LOCALIZED_SPLIT_RESIZE',
        splitId,
        deltaPx,
        containerInnerSize,
      });
    },
    [dispatchLayout],
  );

  const closeTabAction = useCallback(
    (panelId: PanelId) => {
      dispatchLayout({ type: 'CLOSE_TAB', panelId });
    },
    [dispatchLayout],
  );

  const addPanelToTabGroupAction = useCallback(
    (tabGroupId: string, panelId: PanelId) => {
      dispatchLayout({
        type: 'ADD_PANEL_TO_TAB_GROUP',
        tabGroupId,
        panelId,
      });
    },
    [dispatchLayout],
  );

  const addPanelToFloatingWindowAction = useCallback(
    (floatingWindowId: string, panelId: PanelId) => {
      dispatchLayout({
        type: 'ADD_PANEL_TO_FLOATING_WINDOW',
        floatingWindowId,
        panelId,
      });
    },
    [dispatchLayout],
  );

  const addDocumentToTabGroupAction = useCallback(
    (tabGroupId: string, basePanelId: PanelId) => {
      dispatchLayout({
        type: 'ADD_DOCUMENT_TO_TAB_GROUP',
        tabGroupId,
        basePanelId,
      });
    },
    [dispatchLayout],
  );

  const addDocumentToFloatingWindowAction = useCallback(
    (floatingWindowId: string, basePanelId: PanelId) => {
      dispatchLayout({
        type: 'ADD_DOCUMENT_TO_FLOATING_WINDOW',
        floatingWindowId,
        basePanelId,
      });
    },
    [dispatchLayout],
  );

  const setLayoutStateAction = useCallback(
    (nextState: LayoutState) => {
      dispatchLayout({ type: 'SET_STATE', state: cloneLayoutState(nextState) });
    },
    [dispatchLayout],
  );

  const value = useMemo(
    () => ({
      state,
      dockedPanelIds,
      dockPanel: dockPanelAction,
      dockPanelAtTabIndex: dockPanelAtTabIndexAction,
      floatPanel: floatPanelAction,
      floatTabGroup: floatTabGroupAction,
      dockTabGroup: dockTabGroupAction,
      dockTabGroupAtTabIndex: dockTabGroupAtTabIndexAction,
      mergeTabGroupIntoFloating: mergeTabGroupIntoFloatingAction,
      moveFloating: moveFloatingAction,
      resizeFloating: resizeFloatingAction,
      closeFloating: closeFloatingAction,
      mergeFloatingTab: mergeFloatingTabAction,
      dockFloatingWindow: dockFloatingWindowAction,
      dockFloatingWindowAtTabIndex: dockFloatingWindowAtTabIndexAction,
      mergeFloatingWindowIntoFloating: mergeFloatingWindowIntoFloatingAction,
      setFloatingActiveTab: setFloatingActiveTabAction,
      selectFloatingOverflowTab: selectFloatingOverflowTabAction,
      setActiveTab: setActiveTabAction,
      selectTabOverflow: selectTabOverflowAction,
      setSplitRatio: setSplitRatioAction,
      resizeSplitLocalized: resizeSplitLocalizedAction,
      closeTab: closeTabAction,
      addPanelToTabGroup: addPanelToTabGroupAction,
      addPanelToFloatingWindow: addPanelToFloatingWindowAction,
      addDocumentToTabGroup: addDocumentToTabGroupAction,
      addDocumentToFloatingWindow: addDocumentToFloatingWindowAction,
      setLayoutState: setLayoutStateAction,
    }),
    [
      state,
      dockedPanelIds,
      dockPanelAction,
      dockPanelAtTabIndexAction,
      floatPanelAction,
      floatTabGroupAction,
      dockTabGroupAction,
      dockTabGroupAtTabIndexAction,
      mergeTabGroupIntoFloatingAction,
      moveFloatingAction,
      resizeFloatingAction,
      closeFloatingAction,
      mergeFloatingTabAction,
      dockFloatingWindowAction,
      dockFloatingWindowAtTabIndexAction,
      mergeFloatingWindowIntoFloatingAction,
      setFloatingActiveTabAction,
      selectFloatingOverflowTabAction,
      setActiveTabAction,
      selectTabOverflowAction,
      setSplitRatioAction,
      resizeSplitLocalizedAction,
      closeTabAction,
      addPanelToTabGroupAction,
      addPanelToFloatingWindowAction,
      addDocumentToTabGroupAction,
      addDocumentToFloatingWindowAction,
      setLayoutStateAction,
    ],
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
}
