export type PanelId = string;

export type DropZone = 'left' | 'right' | 'top' | 'bottom';

export type PanelType = 'document' | 'auxiliary';

export type PanelIcon = 'globe' | 'script' | 'avatar' | 'document';

export interface PanelDefinition {
  id: PanelId;
  title: string;
  panelType?: PanelType;
  icon?: PanelIcon;
  skeleton?: boolean;
}

export type LayoutNode =
  | {
      type: 'split';
      id: string;
      direction: 'horizontal' | 'vertical';
      ratio: number;
      first: LayoutNode;
      second: LayoutNode;
    }
  | {
      type: 'tabs';
      id: string;
      activeTabId: PanelId;
      panels: PanelId[];
    }
  | {
      type: 'panel';
      id: string;
      panelId: PanelId;
    };

export interface FloatingWindow {
  id: string;
  activeTabId: PanelId;
  panels: PanelId[];
  /** Internal split/tab layout when floating panel docking is enabled. */
  layout?: LayoutNode | null;
  x: number;
  y: number;
  width: number;
  height: number;
  scopeTabId?: string;
  /** Desktop/monitor index in gallery mode; defaults to the owning primary window's monitor. */
  monitorIndex?: number;
}

export interface LayoutState {
  root: LayoutNode | null;
  floating: FloatingWindow[];
}

export interface DragPanelData {
  type: 'panel';
  panelId: PanelId;
  source: 'docked' | 'floating';
  floatingWindowId?: string;
}

export interface DragFloatingWindowData {
  type: 'floating-window';
  floatingWindowId: string;
}

export interface DragTabGroupData {
  type: 'tab-group';
  nodeId: string;
  panels: PanelId[];
  activeTabId: PanelId;
  source: 'docked' | 'floating';
}

export type DragData = DragPanelData | DragFloatingWindowData | DragTabGroupData;

export interface DropTargetData {
  type: 'drop-target';
  nodeId: string;
  zone: DropZone;
}

export interface TabInsertTargetData {
  type: 'tab-insert';
  nodeId: string;
  index: number;
}

export interface PanelHoverData {
  type: 'panel-body-hover';
  nodeId: string;
}

export interface FloatingBodyHoverData {
  type: 'floating-body-hover';
  floatingWindowId: string;
}
