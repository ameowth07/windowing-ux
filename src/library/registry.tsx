import { AppBar } from '../components/AppBar';
import { Footer } from '../components/Footer';
import { FloatingWindow } from '../components/floating/FloatingWindow';
import { EmptyWorkspaceDrop } from '../components/layout/EmptyWorkspaceDrop';
import { DropZones } from '../components/layout/DropZones';
import { DraggableTab } from '../components/layout/DraggableTab';
import { PanelContainer } from '../components/layout/PanelContainer';
import { TabPreview } from '../components/layout/TabPreview';
import { PanelContent } from '../components/panels/PanelContent';
import { ALL_PANEL_IDS } from '../data/panels';
import type { ComponentStory } from './types';

const panelOptions = ALL_PANEL_IDS.map((id) => ({
  value: id,
  label: id.charAt(0).toUpperCase() + id.slice(1),
}));

function singlePanelNode(panelId: string) {
  return {
    type: 'panel' as const,
    id: 'library-panel-node',
    panelId,
  };
}

function tabsNode(activeTabId: string, panels: string[]) {
  return {
    type: 'tabs' as const,
    id: 'library-tabs-node',
    activeTabId,
    panels,
  };
}

export const COMPONENT_STORIES: ComponentStory[] = [
  {
    id: 'app-bar',
    name: 'AppBar',
    category: 'Shell',
    description: 'Top application bar with menu, test controls, utilities, and window controls.',
    filePath: 'src/components/AppBar.tsx',
    providers: ['appWindow', 'scopeTab', 'projectTabBar'],
    controls: [
      {
        type: 'boolean',
        key: 'projectTabBar',
        label: 'ProjectTabBar',
        defaultValue: false,
      },
    ],
    defaultProps: { projectTabBar: false },
    variants: [
      { name: 'Default', props: { projectTabBar: false } },
      { name: 'ProjectTabBar', props: { projectTabBar: true } },
    ],
    render: (props) => (
      <AppBar projectTabBar={props.projectTabBar as boolean | undefined} />
    ),
  },
  {
    id: 'footer',
    name: 'Footer',
    category: 'Shell',
    description: 'Bottom command bar with locale selector and history actions.',
    filePath: 'src/components/Footer.tsx',
    controls: [],
    defaultProps: {},
    render: () => <Footer />,
  },
  {
    id: 'panel-content',
    name: 'PanelContent',
    category: 'Panels',
    description: 'Inner content area for docked and floating panels.',
    filePath: 'src/components/panels/PanelContent.tsx',
    providers: ['scopeTab', 'skeletonContent'],
    controls: [
      {
        type: 'select',
        key: 'panelId',
        label: 'Panel',
        defaultValue: 'place',
        options: panelOptions,
      },
      {
        type: 'boolean',
        key: 'skeletonContent',
        label: 'Skeleton content',
        defaultValue: true,
      },
    ],
    defaultProps: { panelId: 'place', skeletonContent: true },
    variants: [
      { name: 'Place', props: { panelId: 'place' } },
      { name: 'Avatar', props: { panelId: 'avatar' } },
      { name: 'UI', props: { panelId: 'ui' } },
      { name: 'Explorer', props: { panelId: 'explorer' } },
      { name: 'Properties', props: { panelId: 'properties' } },
      { name: 'Viewport', props: { panelId: 'viewport' } },
    ],
    previewMinHeight: 240,
    render: (props) => (
      <PanelContent
        panelId={String(props.panelId)}
        skeletonContent={props.skeletonContent as boolean | undefined}
      />
    ),
  },
  {
    id: 'tab-preview',
    name: 'TabPreview',
    category: 'Panels',
    description: 'Static tab chrome used in drag overlays (no DnD hooks).',
    filePath: 'src/components/layout/TabPreview.tsx',
    controls: [
      {
        type: 'select',
        key: 'panelId',
        label: 'Panel',
        defaultValue: 'place',
        options: panelOptions,
      },
      {
        type: 'boolean',
        key: 'active',
        label: 'Active',
        defaultValue: true,
      },
    ],
    defaultProps: { panelId: 'place', active: true },
    variants: [
      { name: 'Active', props: { panelId: 'place', active: true } },
      { name: 'Inactive', props: { panelId: 'explorer', active: false } },
    ],
    render: (props) => (
      <TabPreview
        panelId={String(props.panelId)}
        active={Boolean(props.active)}
      />
    ),
  },
  {
    id: 'draggable-tab',
    name: 'DraggableTab',
    category: 'Panels',
    description: 'Interactive panel tab with drag-and-drop. Drag to test drop targets.',
    filePath: 'src/components/layout/DraggableTab.tsx',
    providers: ['dnd'],
    showDragHint: true,
    controls: [
      {
        type: 'select',
        key: 'panelId',
        label: 'Panel',
        defaultValue: 'place',
        options: panelOptions,
      },
      {
        type: 'boolean',
        key: 'active',
        label: 'Active',
        defaultValue: true,
      },
      {
        type: 'select',
        key: 'source',
        label: 'Source',
        defaultValue: 'docked',
        options: [
          { value: 'docked', label: 'Docked' },
          { value: 'floating', label: 'Floating' },
        ],
      },
    ],
    defaultProps: { panelId: 'place', active: true, source: 'docked' },
    variants: [
      { name: 'Active docked', props: { panelId: 'place', active: true, source: 'docked' } },
      { name: 'Inactive', props: { panelId: 'explorer', active: false, source: 'docked' } },
    ],
    render: (props) => (
      <DraggableTab
        panelId={String(props.panelId)}
        active={Boolean(props.active)}
        source={props.source as 'docked' | 'floating'}
        onSelect={() => {}}
      />
    ),
  },
  {
    id: 'panel-container',
    name: 'PanelContainer',
    category: 'Layout',
    description: 'Tab bar, panel body, undock action, and drop zones for a layout node.',
    filePath: 'src/components/layout/PanelContainer.tsx',
    providers: ['scopeTab', 'layout', 'dnd'],
    showDragHint: true,
    controls: [
      {
        type: 'select',
        key: 'layoutMode',
        label: 'Layout mode',
        defaultValue: 'single',
        options: [
          { value: 'single', label: 'Single panel' },
          { value: 'tabs', label: 'Tab group' },
        ],
      },
      {
        type: 'select',
        key: 'panelId',
        label: 'Panel (single)',
        defaultValue: 'place',
        options: panelOptions,
      },
      {
        type: 'select',
        key: 'activeTabId',
        label: 'Active tab',
        defaultValue: 'place',
        options: panelOptions,
      },
    ],
    defaultProps: {
      layoutMode: 'single',
      panelId: 'place',
      activeTabId: 'place',
    },
    variants: [
      { name: 'Single panel', props: { layoutMode: 'single', panelId: 'place', activeTabId: 'place' } },
      {
        name: 'Tab group',
        props: { layoutMode: 'tabs', panelId: 'place', activeTabId: 'explorer' },
      },
    ],
    previewMinHeight: 320,
    render: (props) => {
      const node =
        props.layoutMode === 'tabs'
          ? tabsNode(String(props.activeTabId), ['place', 'explorer', 'properties'])
          : singlePanelNode(String(props.panelId));

      return <PanelContainer node={node} />;
    },
  },
  {
    id: 'drop-zones',
    name: 'DropZones',
    category: 'Layout',
    description: 'Docking targets shown while dragging a panel. Drag the tab below to reveal zones.',
    filePath: 'src/components/layout/DropZones.tsx',
    providers: ['dnd'],
    showDragHint: true,
    controls: [
      {
        type: 'string',
        key: 'nodeId',
        label: 'Node ID',
        defaultValue: 'preview-node',
      },
    ],
    defaultProps: { nodeId: 'preview-node' },
    previewMinHeight: 280,
    render: (props) => (
      <div className="library-drop-zones-frame">
        <div className="library-drop-zones-frame__tab">
          <DraggableTab
            panelId="place"
            active
            onSelect={() => {}}
          />
        </div>
        <DropZones nodeId={String(props.nodeId)} />
      </div>
    ),
  },
  {
    id: 'empty-workspace-drop',
    name: 'EmptyWorkspaceDrop',
    category: 'Layout',
    description: 'Full-workspace drop target when the layout tree is empty.',
    filePath: 'src/components/layout/EmptyWorkspaceDrop.tsx',
    providers: ['dnd'],
    showDragHint: true,
    controls: [],
    defaultProps: {},
    previewMinHeight: 240,
    render: () => (
      <div className="library-empty-drop-frame">
        <div className="library-empty-drop-frame__tab">
          <DraggableTab
            panelId="place"
            active
            onSelect={() => {}}
          />
        </div>
        <EmptyWorkspaceDrop />
      </div>
    ),
  },
  {
    id: 'floating-window',
    name: 'FloatingWindow',
    category: 'Floating',
    description: 'Undocked panel window with draggable title bar.',
    filePath: 'src/components/floating/FloatingWindow.tsx',
    providers: ['scopeTab', 'layout', 'dnd'],
    controls: [
      {
        type: 'select',
        key: 'panelId',
        label: 'Panel',
        defaultValue: 'properties',
        options: panelOptions,
      },
      {
        type: 'number',
        key: 'width',
        label: 'Width',
        defaultValue: 364,
        min: 288,
        max: 800,
        step: 10,
      },
      {
        type: 'number',
        key: 'height',
        label: 'Height',
        defaultValue: 522,
        min: 200,
        max: 800,
        step: 10,
      },
    ],
    defaultProps: {
      panelId: 'properties',
      width: 364,
      height: 522,
    },
    variants: [
      { name: 'Properties', props: { panelId: 'properties', width: 364, height: 522 } },
      { name: 'Wide explorer', props: { panelId: 'explorer', width: 420, height: 522 } },
    ],
    previewMinHeight: 320,
    render: (props) => (
      <FloatingWindow
        id="library-float-preview"
        panels={[String(props.panelId)]}
        activeTabId={String(props.panelId)}
        x={24}
        y={24}
        width={Number(props.width)}
        height={Number(props.height)}
      />
    ),
  },
];

export const COMPONENT_CATEGORIES = [
  ...new Set(COMPONENT_STORIES.map((story) => story.category)),
];

export function getStoryById(id: string): ComponentStory | undefined {
  return COMPONENT_STORIES.find((story) => story.id === id);
}

export function getDefaultProps(story: ComponentStory): Record<string, unknown> {
  const props: Record<string, unknown> = { ...story.defaultProps };

  for (const control of story.controls) {
    props[control.key] = control.defaultValue;
  }

  return props;
}
