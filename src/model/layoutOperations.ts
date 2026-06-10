import { createDocumentPanelInstanceId } from '../utils/panelId';
import type { DropZone, FloatingWindow, LayoutNode, PanelId } from '../types/layout';

let idCounter = 0;

export function createNodeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function collectAllPanelIds(
  root: LayoutNode | null,
  floating: FloatingWindow[],
): PanelId[] {
  const ids = [...collectDockedPanelIds(root)];
  for (const window of floating) {
    if (window.layout) {
      for (const panelId of collectDockedPanelIds(window.layout)) {
        ids.push(panelId);
      }
    } else {
      for (const panelId of window.panels) {
        ids.push(panelId);
      }
    }
  }
  return ids;
}

export function collectDockedPanelIds(node: LayoutNode | null): Set<PanelId> {
  const ids = new Set<PanelId>();
  if (!node) return ids;

  const walk = (current: LayoutNode) => {
    if (current.type === 'panel') {
      ids.add(current.panelId);
    } else if (current.type === 'tabs') {
      current.panels.forEach((panelId) => ids.add(panelId));
    } else {
      walk(current.first);
      walk(current.second);
    }
  };

  walk(node);
  return ids;
}

export function removePanelFromTree(
  node: LayoutNode | null,
  panelId: PanelId,
): LayoutNode | null {
  if (!node) return null;

  if (node.type === 'panel') {
    return node.panelId === panelId ? null : node;
  }

  if (node.type === 'tabs') {
    const panels = node.panels.filter((id) => id !== panelId);
    if (panels.length === 0) return null;
    if (panels.length === 1) {
      return { type: 'panel', id: node.id, panelId: panels[0] };
    }
    const activeTabId = panels.includes(node.activeTabId)
      ? node.activeTabId
      : panels[0];
    return { ...node, panels, activeTabId };
  }

  const first = removePanelFromTree(node.first, panelId);
  const second = removePanelFromTree(node.second, panelId);

  if (!first && !second) return null;
  if (!first) return second;
  if (!second) return first;

  return { ...node, first, second };
}

/** The panel/tab node that directly hosts a docked panel. */
export function findPanelHostNode(
  node: LayoutNode | null,
  panelId: PanelId,
): Extract<LayoutNode, { type: 'panel' } | { type: 'tabs' }> | null {
  if (!node) return null;

  if (node.type === 'panel' && node.panelId === panelId) {
    return node;
  }

  if (node.type === 'tabs' && node.panels.includes(panelId)) {
    return node;
  }

  if (node.type === 'split') {
    return (
      findPanelHostNode(node.first, panelId) ??
      findPanelHostNode(node.second, panelId)
    );
  }

  return null;
}

function subtreeContainsNode(
  node: LayoutNode,
  predicate: (node: LayoutNode) => boolean,
): boolean {
  if (predicate(node)) return true;
  if (node.type === 'split') {
    return (
      subtreeContainsNode(node.first, predicate) ||
      subtreeContainsNode(node.second, predicate)
    );
  }
  return false;
}

/** True when re-docking onto a layout root shell edge would not change layout. */
function isLayoutShellEdgeDockNoOp(
  layout: LayoutNode,
  targetNodeId: string,
  zone: DropZone,
  containsSource: (node: LayoutNode) => boolean,
): boolean {
  if (layout.id !== targetNodeId) return false;

  if (layout.type === 'panel') {
    return containsSource(layout);
  }

  if (layout.type === 'tabs') {
    return layout.panels.length === 1 && containsSource(layout);
  }

  if (layout.type !== 'split') {
    return false;
  }

  const inFirst = subtreeContainsNode(layout.first, containsSource);
  const inSecond = subtreeContainsNode(layout.second, containsSource);

  if (layout.direction === 'horizontal') {
    if (zone === 'left') return inFirst;
    if (zone === 'right') return inSecond;
    return false;
  }

  if (zone === 'top') return inFirst;
  if (zone === 'bottom') return inSecond;
  return false;
}

export function isPanelShellEdgeDockNoOp(
  layout: LayoutNode,
  panelId: PanelId,
  targetNodeId: string,
  zone: DropZone,
): boolean {
  return isLayoutShellEdgeDockNoOp(
    layout,
    targetNodeId,
    zone,
    (node) => findPanelHostNode(node, panelId) != null,
  );
}

export function isLayoutNodeShellEdgeDockNoOp(
  layout: LayoutNode,
  sourceNodeId: string,
  targetNodeId: string,
  zone: DropZone,
): boolean {
  if (layout.id !== targetNodeId) return false;

  // The tab group is the entire layout — shell-edge docking should split, not no-op.
  if (layout.type === 'tabs' && layout.id === sourceNodeId) {
    return false;
  }

  if (layout.type === 'panel' && layout.id === sourceNodeId) {
    return true;
  }

  return isLayoutShellEdgeDockNoOp(
    layout,
    targetNodeId,
    zone,
    (node) => findNodeById(node, sourceNodeId) != null,
  );
}

function wrapWithSplit(
  existing: LayoutNode,
  panelId: PanelId,
  zone: DropZone,
): LayoutNode {
  return wrapWithSplitNode(
    existing,
    {
      type: 'panel',
      id: createNodeId('panel'),
      panelId,
    },
    zone,
  );
}

function wrapWithSplitNode(
  existing: LayoutNode,
  incoming: LayoutNode,
  zone: DropZone,
): LayoutNode {
  if (zone === 'left') {
    return {
      type: 'split',
      id: createNodeId('split'),
      direction: 'horizontal',
      ratio: 0.5,
      first: incoming,
      second: existing,
    };
  }

  if (zone === 'right') {
    return {
      type: 'split',
      id: createNodeId('split'),
      direction: 'horizontal',
      ratio: 0.5,
      first: existing,
      second: incoming,
    };
  }

  if (zone === 'top') {
    return {
      type: 'split',
      id: createNodeId('split'),
      direction: 'vertical',
      ratio: 0.5,
      first: incoming,
      second: existing,
    };
  }

  return {
    type: 'split',
    id: createNodeId('split'),
    direction: 'vertical',
    ratio: 0.5,
    first: existing,
    second: incoming,
  };
}

function insertLayoutNodeAtTarget(
  node: LayoutNode,
  targetNodeId: string,
  zone: DropZone,
  incoming: LayoutNode,
): LayoutNode {
  if (node.id === targetNodeId) {
    return wrapWithSplitNode(node, incoming, zone);
  }

  if (node.type === 'split') {
    return {
      ...node,
      first: insertLayoutNodeAtTarget(node.first, targetNodeId, zone, incoming),
      second: insertLayoutNodeAtTarget(node.second, targetNodeId, zone, incoming),
    };
  }

  return node;
}

export function dockLayoutNodeIntoRoot(
  root: LayoutNode | null,
  incoming: LayoutNode,
  targetNodeId: string,
  zone: DropZone,
): LayoutNode | null {
  if (targetNodeId === '__workspace_root__') {
    if (!root) return incoming;
    return wrapWithSplitNode(root, incoming, zone);
  }

  if (!root) return incoming;

  return insertLayoutNodeAtTarget(root, targetNodeId, zone, incoming);
}

export function floatingWindowToLayoutNode(
  panels: PanelId[],
  activeTabId: PanelId,
): LayoutNode {
  if (panels.length === 1) {
    return {
      type: 'panel',
      id: createNodeId('panel'),
      panelId: panels[0],
    };
  }

  return {
    type: 'tabs',
    id: createNodeId('tabs'),
    activeTabId: panels.includes(activeTabId) ? activeTabId : panels[0],
    panels: [...panels],
  };
}

export function getFloatingWindowLayoutNode(window: FloatingWindow): LayoutNode {
  if (window.layout) return window.layout;
  return floatingWindowToLayoutNode(window.panels, window.activeTabId);
}

export function dockFloatingWindow(
  root: LayoutNode | null,
  panels: PanelId[],
  activeTabId: PanelId,
  targetNodeId: string,
  zone: DropZone,
  layout?: LayoutNode | null,
): LayoutNode | null {
  const incoming =
    layout ?? floatingWindowToLayoutNode(panels, activeTabId);

  let withoutPanels = root;
  for (const panelId of panels) {
    withoutPanels = removePanelFromTree(withoutPanels, panelId);
  }

  return dockLayoutNodeIntoRoot(withoutPanels, incoming, targetNodeId, zone);
}

export function extractTabGroup(
  node: LayoutNode | null,
): { panels: PanelId[]; activeTabId: PanelId } | null {
  if (!node) return null;
  if (node.type === 'panel') {
    return { panels: [node.panelId], activeTabId: node.panelId };
  }
  if (node.type === 'tabs') {
    return {
      panels: [...node.panels],
      activeTabId: node.activeTabId,
    };
  }
  return null;
}

export function removeLayoutNodeFromTree(
  root: LayoutNode | null,
  nodeId: string,
): LayoutNode | null {
  if (!root) return null;
  if (root.id === nodeId) return null;

  if (root.type === 'split') {
    const first = removeLayoutNodeFromTree(root.first, nodeId);
    const second = removeLayoutNodeFromTree(root.second, nodeId);
    if (!first && !second) return null;
    if (!first) return second;
    if (!second) return first;
    return { ...root, first, second };
  }

  return root;
}

function removePanelsFromFloating(
  floating: FloatingWindow[],
  panelIds: PanelId[],
): FloatingWindow[] {
  return panelIds.reduce(
    (current, panelId) => removePanelFromFloating(current, panelId),
    floating,
  );
}

export function dockTabGroupAtTabIndex(
  root: LayoutNode | null,
  nodeId: string,
  targetNodeId: string,
  index: number,
): LayoutNode | null {
  const node = findNodeById(root, nodeId);
  const group = extractTabGroup(node);
  if (!group || nodeId === targetNodeId) return root;

  let result = removeLayoutNodeFromTree(root, nodeId);
  for (let i = 0; i < group.panels.length; i++) {
    result = dockPanelAtTabIndex(
      result,
      group.panels[i],
      targetNodeId,
      index + i,
    );
  }
  return result;
}

export function mergeTabGroupIntoFloating(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  nodeId: string,
  floatingWindowId: string,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  const node = findNodeById(root, nodeId);
  const group = extractTabGroup(node);
  const target = floating.find((window) => window.id === floatingWindowId);
  if (!group || !target) {
    return { root, floating };
  }
  if (group.panels.every((panelId) => target.panels.includes(panelId))) {
    return { root, floating };
  }

  if (target.layout) {
    const migratedTarget = migrateFloatingWindowToLayout(target);
    const targetNodeId =
      findFirstDockTarget(migratedTarget.layout ?? null) ??
      migratedTarget.layout?.id;
    if (!targetNodeId || !migratedTarget.layout) {
      return { root, floating };
    }

    const nextRoot = removeLayoutNodeFromTree(root, nodeId);
    let nextFloating = floating.map((window) =>
      window.id === floatingWindowId ? migratedTarget : window,
    );
    for (const panelId of group.panels) {
      nextFloating = removePanelFromFloating(nextFloating, panelId);
    }

    const incoming = floatingWindowToLayoutNode(group.panels, group.activeTabId);
    const newLayout = insertLayoutNodeAtTarget(
      migratedTarget.layout,
      targetNodeId,
      'right',
      incoming,
    );
    nextFloating = updateFloatingWindowLayout(
      nextFloating,
      floatingWindowId,
      newLayout,
    );

    return { root: nextRoot, floating: nextFloating };
  }

  const nextRoot = removeLayoutNodeFromTree(root, nodeId);
  let nextFloating = removePanelsFromFloating(floating, group.panels);
  const mergedPanels = [...target.panels, ...group.panels];
  const preferredActive = group.panels.includes(group.activeTabId)
    ? group.activeTabId
    : target.activeTabId;

  nextFloating = nextFloating.map((window) =>
    window.id === floatingWindowId
      ? { ...window, panels: mergedPanels, activeTabId: preferredActive }
      : window,
  );

  return { root: nextRoot, floating: nextFloating };
}

function clampIndex(index: number, min: number, max: number): number {
  return Math.min(Math.max(index, min), max);
}

function mergeIntoTabsAtIndex(
  node: LayoutNode,
  panelId: PanelId,
  index: number,
): LayoutNode {
  if (node.type === 'panel') {
    if (node.panelId === panelId) return node;
    const insertAt = clampIndex(index, 0, 1);
    const panels =
      insertAt === 0
        ? [panelId, node.panelId]
        : [node.panelId, panelId];
    return {
      type: 'tabs',
      id: node.id,
      activeTabId: panelId,
      panels,
    };
  }

  if (node.type === 'tabs') {
    const panels = node.panels.filter((id) => id !== panelId);
    const insertAt = clampIndex(index, 0, panels.length);
    const nextPanels = [
      ...panels.slice(0, insertAt),
      panelId,
      ...panels.slice(insertAt),
    ];
    return {
      ...node,
      panels: nextPanels,
      activeTabId: panelId,
    };
  }

  return node;
}

function insertPanelAtTabIndex(
  node: LayoutNode,
  targetNodeId: string,
  panelId: PanelId,
  index: number,
): LayoutNode {
  if (node.id === targetNodeId) {
    return mergeIntoTabsAtIndex(node, panelId, index);
  }

  if (node.type === 'split') {
    return {
      ...node,
      first: insertPanelAtTabIndex(node.first, targetNodeId, panelId, index),
      second: insertPanelAtTabIndex(node.second, targetNodeId, panelId, index),
    };
  }

  return node;
}

function insertIncomingAtTarget(
  layoutBeforeRemoval: LayoutNode | null,
  layoutAfterRemoval: LayoutNode,
  targetNodeId: string,
  zone: DropZone,
  incoming: LayoutNode,
): LayoutNode {
  if (findNodeById(layoutAfterRemoval, targetNodeId)) {
    return insertLayoutNodeAtTarget(
      layoutAfterRemoval,
      targetNodeId,
      zone,
      incoming,
    );
  }

  if (layoutBeforeRemoval && findNodeById(layoutBeforeRemoval, targetNodeId)) {
    return wrapWithSplitNode(layoutAfterRemoval, incoming, zone);
  }

  return insertLayoutNodeAtTarget(
    layoutAfterRemoval,
    targetNodeId,
    zone,
    incoming,
  );
}

export function dockPanel(
  root: LayoutNode | null,
  panelId: PanelId,
  targetNodeId: string,
  zone: DropZone,
): LayoutNode | null {
  if (!root) {
    return {
      type: 'panel',
      id: createNodeId('panel'),
      panelId,
    };
  }

  const hostNode = findPanelHostNode(root, panelId);
  if (
    root.id === targetNodeId &&
    isPanelShellEdgeDockNoOp(root, panelId, targetNodeId, zone)
  ) {
    return root;
  }
  if (hostNode?.id === targetNodeId) {
    // Same container: no-op for lone panel self-drop.
    // Split zones on a tab group peel the dragged tab out into a new pane.
    if (hostNode.type === 'panel') {
      return root;
    }
    if (hostNode.type === 'tabs' && hostNode.panels.length === 1) {
      return root;
    }
  }

  const withoutPanel = removePanelFromTree(root, panelId);
  const incoming: LayoutNode = {
    type: 'panel',
    id: createNodeId('panel'),
    panelId,
  };

  if (targetNodeId === '__workspace_root__') {
    if (!withoutPanel) return incoming;
    return wrapWithSplit(withoutPanel, panelId, zone);
  }

  if (!withoutPanel) {
    return incoming;
  }

  return insertIncomingAtTarget(
    root,
    withoutPanel,
    targetNodeId,
    zone,
    incoming,
  );
}

export function dockPanelAtTabIndex(
  root: LayoutNode | null,
  panelId: PanelId,
  targetNodeId: string,
  index: number,
): LayoutNode | null {
  if (!root) {
    return {
      type: 'panel',
      id: createNodeId('panel'),
      panelId,
    };
  }

  const hostNode = findPanelHostNode(root, panelId);
  if (hostNode?.id === targetNodeId) {
    if (hostNode.type === 'tabs') {
      const currentIndex = hostNode.panels.indexOf(panelId);
      if (currentIndex !== -1 && (index === currentIndex || index === currentIndex + 1)) {
        return root;
      }
    } else if (hostNode.type === 'panel') {
      return root;
    }
  }

  const withoutPanel = removePanelFromTree(root, panelId);
  const targetNode = findNodeById(withoutPanel, targetNodeId);
  if (!targetNode || (targetNode.type !== 'panel' && targetNode.type !== 'tabs')) {
    return root;
  }

  if (!withoutPanel) {
    return {
      type: 'panel',
      id: createNodeId('panel'),
      panelId,
    };
  }

  return insertPanelAtTabIndex(withoutPanel, targetNodeId, panelId, index);
}

export function addDocumentToTabGroup(
  root: LayoutNode | null,
  basePanelId: PanelId,
  tabGroupId: string,
  existingPanelIds: Iterable<PanelId>,
): LayoutNode | null {
  const instanceId = createDocumentPanelInstanceId(basePanelId, existingPanelIds);

  if (!root) {
    return {
      type: 'panel',
      id: createNodeId('panel'),
      panelId: instanceId,
    };
  }

  const host = findNodeById(root, tabGroupId);
  if (!host || (host.type !== 'panel' && host.type !== 'tabs')) {
    return root;
  }

  const openPanels = host.type === 'tabs' ? host.panels : [host.panelId];
  return insertPanelAtTabIndex(root, tabGroupId, instanceId, openPanels.length);
}

export function addDocumentToFloatingWindow(
  floating: FloatingWindow[],
  floatingWindowId: string,
  basePanelId: PanelId,
  existingPanelIds: Iterable<PanelId>,
): FloatingWindow[] {
  const target = floating.find((window) => window.id === floatingWindowId);
  if (!target) {
    return floating;
  }

  const instanceId = createDocumentPanelInstanceId(basePanelId, existingPanelIds);
  if (target.panels.includes(instanceId)) {
    return floating;
  }

  const floatingWithoutPanel = removePanelFromFloating(floating, instanceId);
  return mergePanelIntoFloatingWindow(
    floatingWithoutPanel,
    floatingWindowId,
    instanceId,
    target.panels.length,
  );
}

export function setSplitRatio(
  node: LayoutNode,
  splitId: string,
  ratio: number,
): LayoutNode {
  const clamped = clampSplitRatio(ratio);

  if (node.type === 'split' && node.id === splitId) {
    return { ...node, ratio: clamped };
  }

  if (node.type === 'split') {
    return {
      ...node,
      first: setSplitRatio(node.first, splitId, ratio),
      second: setSplitRatio(node.second, splitId, ratio),
    };
  }

  return node;
}

const MIN_SPLIT_RATIO = 0.12;

type SplitLayoutNode = Extract<LayoutNode, { type: 'split' }>;
type LeafLayoutNode = Extract<LayoutNode, { type: 'panel' } | { type: 'tabs' }>;

function clampSplitRatio(ratio: number): number {
  return Math.min(Math.max(ratio, MIN_SPLIT_RATIO), 1 - MIN_SPLIT_RATIO);
}

function isLeafNode(node: LayoutNode): node is LeafLayoutNode {
  return node.type === 'panel' || node.type === 'tabs';
}

function findSplitNode(
  node: LayoutNode | null,
  splitId: string,
): SplitLayoutNode | null {
  if (!node) return null;
  if (node.type === 'split' && node.id === splitId) return node;
  if (node.type === 'split') {
    return (
      findSplitNode(node.first, splitId) ?? findSplitNode(node.second, splitId)
    );
  }
  return null;
}

function replaceSplitNode(
  node: LayoutNode,
  splitId: string,
  replacement: SplitLayoutNode,
): LayoutNode {
  if (node.type === 'split' && node.id === splitId) return replacement;
  if (node.type === 'split') {
    return {
      ...node,
      first: replaceSplitNode(node.first, splitId, replacement),
      second: replaceSplitNode(node.second, splitId, replacement),
    };
  }
  return node;
}

function adjacentLeafFromFirstSide(
  node: LayoutNode,
  axis: 'horizontal' | 'vertical',
): LeafLayoutNode {
  if (isLeafNode(node)) return node;
  if (node.type === 'split' && node.direction === axis) {
    return adjacentLeafFromFirstSide(node.second, axis);
  }
  return adjacentLeafFromFirstSide(node.first, axis);
}

function adjacentLeafFromSecondSide(
  node: LayoutNode,
  axis: 'horizontal' | 'vertical',
): LeafLayoutNode {
  if (isLeafNode(node)) return node;
  if (node.type === 'split' && node.direction === axis) {
    return adjacentLeafFromSecondSide(node.first, axis);
  }
  return adjacentLeafFromSecondSide(node.first, axis);
}

function measureLeafSizes(
  node: LayoutNode,
  axis: 'horizontal' | 'vertical',
  available: number,
): Map<string, number> {
  if (isLeafNode(node)) {
    return new Map([[node.id, available]]);
  }

  if (node.type === 'split' && node.direction === axis) {
    const firstAvailable = node.ratio * available;
    const secondAvailable = available - firstAvailable;
    return new Map([
      ...measureLeafSizes(node.first, axis, firstAvailable),
      ...measureLeafSizes(node.second, axis, secondAvailable),
    ]);
  }

  if (node.type === 'split') {
    const firstSizes = measureLeafSizes(node.first, axis, available);
    const secondSizes = measureLeafSizes(node.second, axis, available);
    return new Map([...firstSizes, ...secondSizes]);
  }

  return new Map();
}

function subtreeExtent(
  node: LayoutNode,
  axis: 'horizontal' | 'vertical',
  sizes: Map<string, number>,
): number {
  if (isLeafNode(node)) {
    return sizes.get(node.id) ?? 0;
  }

  if (node.type === 'split' && node.direction === axis) {
    return (
      subtreeExtent(node.first, axis, sizes) +
      subtreeExtent(node.second, axis, sizes)
    );
  }

  if (node.type === 'split') {
    return subtreeExtent(node.first, axis, sizes);
  }

  return 0;
}

function setUniformLeafSize(
  node: LayoutNode,
  size: number,
  sizes: Map<string, number>,
): void {
  if (isLeafNode(node)) {
    sizes.set(node.id, size);
    return;
  }

  if (node.type === 'split') {
    setUniformLeafSize(node.first, size, sizes);
    setUniformLeafSize(node.second, size, sizes);
  }
}

function normalizePerpendicularSizes(
  node: LayoutNode,
  axis: 'horizontal' | 'vertical',
  sizes: Map<string, number>,
): void {
  if (node.type === 'split' && node.direction !== axis) {
    const size = subtreeExtent(node, axis, sizes);
    setUniformLeafSize(node, size, sizes);
    return;
  }

  if (node.type === 'split') {
    normalizePerpendicularSizes(node.first, axis, sizes);
    normalizePerpendicularSizes(node.second, axis, sizes);
  }
}

function rebuildSplitRatios(
  node: LayoutNode,
  sizes: Map<string, number>,
  axis: 'horizontal' | 'vertical',
): LayoutNode {
  if (isLeafNode(node)) return node;

  if (node.type === 'split') {
    const first = rebuildSplitRatios(node.first, sizes, axis);
    const second = rebuildSplitRatios(node.second, sizes, axis);

    if (node.direction === axis) {
      const firstSize = subtreeExtent(first, axis, sizes);
      const secondSize = subtreeExtent(second, axis, sizes);
      const total = firstSize + secondSize;
      const ratio =
        total > 0 ? clampSplitRatio(firstSize / total) : node.ratio;

      return { ...node, first, second, ratio };
    }

    return { ...node, first, second };
  }

  return node;
}

/** Resize only the two panes that share this gutter; other panes keep their size. */
export function applyLocalizedSplitResize(
  root: LayoutNode | null,
  splitId: string,
  deltaPx: number,
  containerInnerSize: number,
): LayoutNode | null {
  if (!root) return null;

  const split = findSplitNode(root, splitId);
  if (!split || containerInnerSize <= 0) return root;

  const axis = split.direction;
  const sizes = measureLeafSizes(split, axis, containerInnerSize);
  const leftLeaf = adjacentLeafFromFirstSide(split.first, axis);
  const rightLeaf = adjacentLeafFromSecondSide(split.second, axis);

  const minLeafSize = containerInnerSize * MIN_SPLIT_RATIO;
  const leftSize = sizes.get(leftLeaf.id) ?? 0;
  const rightSize = sizes.get(rightLeaf.id) ?? 0;
  const pairTotal = leftSize + rightSize;

  let nextLeft = leftSize + deltaPx;
  nextLeft = Math.max(minLeafSize, Math.min(nextLeft, pairTotal - minLeafSize));
  const nextRight = pairTotal - nextLeft;

  sizes.set(leftLeaf.id, nextLeft);
  sizes.set(rightLeaf.id, nextRight);
  normalizePerpendicularSizes(split.first, axis, sizes);
  normalizePerpendicularSizes(split.second, axis, sizes);

  const updatedSplit = rebuildSplitRatios(split, sizes, axis) as SplitLayoutNode;
  return replaceSplitNode(root, splitId, updatedSplit);
}

export function setActiveTab(
  node: LayoutNode,
  tabGroupId: string,
  panelId: PanelId,
): LayoutNode {
  if (node.type === 'tabs' && node.id === tabGroupId) {
    if (!node.panels.includes(panelId)) return node;
    return { ...node, activeTabId: panelId };
  }

  if (node.type === 'split') {
    return {
      ...node,
      first: setActiveTab(node.first, tabGroupId, panelId),
      second: setActiveTab(node.second, tabGroupId, panelId),
    };
  }

  return node;
}

export function swapTabGroupPanels(
  node: LayoutNode | null,
  tabGroupId: string,
  panelIdA: PanelId,
  panelIdB: PanelId,
  activeTabId?: PanelId,
): LayoutNode | null {
  if (!node) return null;

  if (node.type === 'tabs' && node.id === tabGroupId) {
    const panels = [...node.panels];
    const indexA = panels.indexOf(panelIdA);
    const indexB = panels.indexOf(panelIdB);
    if (indexA === -1 || indexB === -1) return node;

    [panels[indexA], panels[indexB]] = [panels[indexB], panels[indexA]];
    return {
      ...node,
      panels,
      activeTabId: activeTabId ?? node.activeTabId,
    };
  }

  if (node.type === 'split') {
    return {
      ...node,
      first:
        swapTabGroupPanels(node.first, tabGroupId, panelIdA, panelIdB, activeTabId) ??
        node.first,
      second:
        swapTabGroupPanels(node.second, tabGroupId, panelIdA, panelIdB, activeTabId) ??
        node.second,
    };
  }

  return node;
}

export function findNodeById(
  node: LayoutNode | null,
  nodeId: string,
): LayoutNode | null {
  if (!node) return null;
  if (node.id === nodeId) return node;
  if (node.type === 'split') {
    return (
      findNodeById(node.first, nodeId) ?? findNodeById(node.second, nodeId)
    );
  }
  return null;
}

export function findFirstDockTarget(node: LayoutNode | null): string | null {
  if (!node) return null;
  if (node.type === 'panel' || node.type === 'tabs') return node.id;
  return findFirstDockTarget(node.first) ?? findFirstDockTarget(node.second);
}

export function removePanelFromFloating(
  floating: FloatingWindow[],
  panelId: PanelId,
): FloatingWindow[] {
  return floating
    .map((window) => {
      if (window.layout) {
        const layout = removePanelFromTree(window.layout, panelId);
        if (!layout) return null;
        return syncFloatingWindowPanels({ ...window, layout });
      }

      if (!window.panels.includes(panelId)) return window;
      const panels = window.panels.filter((id) => id !== panelId);
      if (panels.length === 0) return null;
      return {
        ...window,
        panels,
        activeTabId: panels.includes(window.activeTabId)
          ? window.activeTabId
          : panels[0],
      };
    })
    .filter((window): window is FloatingWindow => window !== null);
}

export function swapFloatingPanels<T extends {
  id: string;
  panels: PanelId[];
  activeTabId: PanelId;
}>(
  floating: T[],
  floatingWindowId: string,
  panelIdA: PanelId,
  panelIdB: PanelId,
  activeTabId?: PanelId,
): T[] {
  return floating.map((window) => {
    if (window.id !== floatingWindowId) return window;

    const panels = [...window.panels];
    const indexA = panels.indexOf(panelIdA);
    const indexB = panels.indexOf(panelIdB);
    if (indexA === -1 || indexB === -1) return window;

    [panels[indexA], panels[indexB]] = [panels[indexB], panels[indexA]];
    return {
      ...window,
      panels,
      activeTabId: activeTabId ?? window.activeTabId,
    };
  });
}

export function mergePanelIntoFloatingWindow(
  floating: FloatingWindow[],
  floatingWindowId: string,
  panelId: PanelId,
  index: number,
): FloatingWindow[] {
  return floating.map((window) => {
    if (window.id !== floatingWindowId) return window;

    if (window.layout) {
      const migrated = migrateFloatingWindowToLayout(window);
      const layout = migrated.layout;
      if (!layout) return window;

      const targetNodeId = findFirstDockTarget(layout) ?? layout.id;
      const newLayout = dockPanelAtTabIndex(
        layout,
        panelId,
        targetNodeId,
        index,
      );
      return syncFloatingWindowPanels({ ...window, layout: newLayout });
    }

    const panels = window.panels.filter((id) => id !== panelId);
    const insertAt = clampIndex(index, 0, panels.length);
    const nextPanels = [
      ...panels.slice(0, insertAt),
      panelId,
      ...panels.slice(insertAt),
    ];
    return {
      ...window,
      panels: nextPanels,
      activeTabId: panelId,
    };
  });
}

export function mergeFloatingWindowIntoFloating(
  floating: FloatingWindow[],
  sourceWindowId: string,
  targetWindowId: string,
  index?: number,
): FloatingWindow[] {
  const source = floating.find((window) => window.id === sourceWindowId);
  if (!source || sourceWindowId === targetWindowId) return floating;

  let next = floating.filter((window) => window.id !== sourceWindowId);
  let insertIndex =
    index ??
    next.find((window) => window.id === targetWindowId)?.panels.length ??
    0;

  for (const panelId of source.panels) {
    next = mergePanelIntoFloatingWindow(
      next,
      targetWindowId,
      panelId,
      insertIndex,
    );
    insertIndex++;
  }

  const preferredActive = source.panels.includes(source.activeTabId)
    ? source.activeTabId
    : undefined;

  return next.map((window) =>
    window.id === targetWindowId && preferredActive
      ? { ...window, activeTabId: preferredActive }
      : window,
  );
}

export function dockFloatingWindowAtTabIndex(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  floatingWindowId: string,
  targetNodeId: string,
  index: number,
  tabGroupNodeId?: string,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  if (tabGroupNodeId) {
    return dockFloatingTabGroupAtTabIndex(
      root,
      floating,
      floatingWindowId,
      tabGroupNodeId,
      targetNodeId,
      index,
    );
  }

  const source = floating.find((window) => window.id === floatingWindowId);
  if (!source) return { root, floating };

  if (source.layout) {
    const panelIds = [...collectDockedPanelIds(source.layout)];
    let nextRoot = root;
    for (let i = 0; i < panelIds.length; i++) {
      nextRoot = dockPanelAtTabIndex(
        nextRoot,
        panelIds[i],
        targetNodeId,
        index + i,
      );
    }
    return {
      root: nextRoot,
      floating: floating.filter((window) => window.id !== floatingWindowId),
    };
  }

  let nextRoot = root;
  for (let i = 0; i < source.panels.length; i++) {
    nextRoot = dockPanelAtTabIndex(
      nextRoot,
      source.panels[i],
      targetNodeId,
      index + i,
    );
  }

  return {
    root: nextRoot,
    floating: floating.filter((window) => window.id !== floatingWindowId),
  };
}

function finalizeFloatingTabGroupDock(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  source: FloatingWindow,
  group: { panels: PanelId[]; activeTabId: PanelId },
  nextLayout: LayoutNode | null,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  let nextFloating = floating.filter((window) => window.id !== source.id);
  for (const panelId of group.panels) {
    nextFloating = removePanelFromFloating(nextFloating, panelId);
  }
  if (nextLayout) {
    nextFloating = [
      ...nextFloating,
      syncFloatingWindowPanels({ ...source, layout: nextLayout }),
    ];
  }
  return { root, floating: nextFloating };
}

export function dockFloatingTabGroupToRoot(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  floatingWindowId: string,
  tabGroupNodeId: string,
  targetNodeId: string,
  zone: DropZone,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  const source = floating.find((window) => window.id === floatingWindowId);
  if (!source?.layout) {
    return {
      root: dockFloatingWindow(
        root,
        source?.panels ?? [],
        source?.activeTabId ?? tabGroupNodeId,
        targetNodeId,
        zone,
        source?.layout,
      ),
      floating: floating.filter((window) => window.id !== floatingWindowId),
    };
  }

  const migrated = migrateFloatingWindowToLayout(source);
  const layout = migrated.layout;
  if (!layout) {
    return { root, floating };
  }

  const groupNode = findNodeById(layout, tabGroupNodeId);
  const group = extractTabGroup(groupNode);
  if (!group) {
    return { root, floating };
  }

  const incoming = floatingWindowToLayoutNode(group.panels, group.activeTabId);
  const nextLayout = removeLayoutNodeFromTree(layout, tabGroupNodeId);

  let nextRoot = root;
  for (const panelId of group.panels) {
    nextRoot = removePanelFromTree(nextRoot, panelId);
  }
  nextRoot = dockLayoutNodeIntoRoot(nextRoot, incoming, targetNodeId, zone);

  return finalizeFloatingTabGroupDock(
    nextRoot,
    floating,
    source,
    group,
    nextLayout,
  );
}

export function dockFloatingTabGroupAtTabIndex(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  floatingWindowId: string,
  tabGroupNodeId: string,
  targetNodeId: string,
  index: number,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  const source = floating.find((window) => window.id === floatingWindowId);
  if (!source?.layout) {
    return dockFloatingWindowAtTabIndex(
      root,
      floating,
      floatingWindowId,
      targetNodeId,
      index,
    );
  }

  const migrated = migrateFloatingWindowToLayout(source);
  const layout = migrated.layout;
  if (!layout) {
    return { root, floating };
  }

  const groupNode = findNodeById(layout, tabGroupNodeId);
  const group = extractTabGroup(groupNode);
  if (!group) {
    return { root, floating };
  }

  let nextRoot = root;
  for (let i = 0; i < group.panels.length; i++) {
    nextRoot = dockPanelAtTabIndex(
      nextRoot,
      group.panels[i],
      targetNodeId,
      index + i,
    );
  }

  const nextLayout = removeLayoutNodeFromTree(layout, tabGroupNodeId);
  return finalizeFloatingTabGroupDock(
    nextRoot,
    floating,
    source,
    group,
    nextLayout,
  );
}

export function isFloatingLayoutTabGroupNode(
  floating: FloatingWindow[],
  floatingWindowId: string,
  nodeId: string,
): boolean {
  if (nodeId === floatingWindowId) return false;
  const source = floating.find((window) => window.id === floatingWindowId);
  if (!source?.layout) return false;
  return extractTabGroup(findNodeById(source.layout, nodeId)) != null;
}

export function isFloatingTabInsertNoOp(
  floating: Array<{ id: string; panels: PanelId[] }>,
  floatingWindowId: string,
  panelId: PanelId,
  index: number,
): boolean {
  const source = floating.find((window) => window.panels.includes(panelId));
  if (!source || source.id !== floatingWindowId) return false;
  const currentIndex = source.panels.indexOf(panelId);
  return index === currentIndex || index === currentIndex + 1;
}

export function mergeFloatingTabUpdate(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  floatingWindowId: string,
  panelId: PanelId,
  index: number,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  const targetWindow = floating.find((window) => window.id === floatingWindowId);
  if (!targetWindow) {
    return { root, floating };
  }

  const sourceWindow = floating.find((window) => window.panels.includes(panelId));

  if (sourceWindow?.id === floatingWindowId) {
    if (isFloatingTabInsertNoOp(floating, floatingWindowId, panelId, index)) {
      return { root, floating };
    }

    if (sourceWindow.layout) {
      const migrated = migrateFloatingWindowToLayout(sourceWindow);
      const layout = migrated.layout;
      if (!layout) return { root, floating };

      const hostNode = findPanelHostNode(layout, panelId);
      if (!hostNode) return { root, floating };

      const newLayout = dockPanelAtTabIndex(
        layout,
        panelId,
        hostNode.id,
        index,
      );
      return {
        root,
        floating: floating.map((window) =>
          window.id === floatingWindowId
            ? syncFloatingWindowPanels({ ...window, layout: newLayout, activeTabId: panelId })
            : window,
        ),
      };
    }

    const currentIndex = sourceWindow.panels.indexOf(panelId);
    const panelsWithout = sourceWindow.panels.filter((id) => id !== panelId);
    const insertAt = clampIndex(index, 0, panelsWithout.length);
    if (insertAt === currentIndex) {
      return { root, floating };
    }

    const nextPanels = [
      ...panelsWithout.slice(0, insertAt),
      panelId,
      ...panelsWithout.slice(insertAt),
    ];
    return {
      root,
      floating: floating.map((window) =>
        window.id === floatingWindowId
          ? { ...window, panels: nextPanels, activeTabId: panelId }
          : window,
      ),
    };
  }

  const nextRoot = removePanelFromTree(root, panelId);
  const nextFloating = mergePanelIntoFloatingWindow(
    removePanelFromFloating(floating, panelId),
    floatingWindowId,
    panelId,
    index,
  );

  return { root: nextRoot, floating: nextFloating };
}

export function isFloatingWindowId(
  floating: Array<{ id: string }>,
  nodeId: string,
): boolean {
  return floating.some((window) => window.id === nodeId);
}

export function isDockTargetInRoot(
  root: LayoutNode | null,
  targetNodeId: string,
): boolean {
  if (targetNodeId === '__workspace_root__') return true;
  return findNodeById(root, targetNodeId) != null;
}

export function resolveFloatingWindowForTabGroupDrag(
  floating: FloatingWindow[],
  nodeId: string,
): FloatingWindow | null {
  const byWindowId = floating.find((window) => window.id === nodeId);
  if (byWindowId) return byWindowId;
  return findFloatingWindowByLayoutNodeId(floating, nodeId);
}

export function findFloatingWindowByLayoutNodeId(
  floating: FloatingWindow[],
  nodeId: string,
): FloatingWindow | null {
  for (const window of floating) {
    if (window.layout && findNodeById(window.layout, nodeId)) {
      return window;
    }
  }
  return null;
}

export function findFloatingWindowBySplitId(
  floating: FloatingWindow[],
  splitId: string,
): FloatingWindow | null {
  for (const window of floating) {
    if (window.layout && findSplitNode(window.layout, splitId)) {
      return window;
    }
  }
  return null;
}

export function syncFloatingWindowPanels(
  window: FloatingWindow,
): FloatingWindow {
  if (!window.layout) return window;

  const panelIds = [...collectDockedPanelIds(window.layout)];
  if (panelIds.length === 0) return window;

  return {
    ...window,
    panels: panelIds,
    activeTabId: panelIds.includes(window.activeTabId)
      ? window.activeTabId
      : panelIds[0],
  };
}

export function migrateFloatingWindowToLayout(
  window: FloatingWindow,
): FloatingWindow {
  if (window.layout) return syncFloatingWindowPanels(window);
  return syncFloatingWindowPanels({
    ...window,
    layout: floatingWindowToLayoutNode(window.panels, window.activeTabId),
  });
}

function updateFloatingWindowLayout(
  floating: FloatingWindow[],
  floatingWindowId: string,
  layout: LayoutNode | null,
): FloatingWindow[] {
  return floating
    .map((window) => {
      if (window.id !== floatingWindowId) return window;
      if (!layout) return null;
      return syncFloatingWindowPanels({ ...window, layout });
    })
    .filter((window): window is FloatingWindow => window !== null);
}

function removePanelFromAllFloats(
  floating: FloatingWindow[],
  panelId: PanelId,
): FloatingWindow[] {
  return removePanelFromFloating(floating, panelId);
}

function removePanelFromOtherFloats(
  floating: FloatingWindow[],
  panelId: PanelId,
  exceptWindowId: string,
): FloatingWindow[] {
  return floating
    .map((window) => {
      if (window.id === exceptWindowId) return window;
      if (!window.panels.includes(panelId)) return window;
      const updated = removePanelFromFloating([window], panelId);
      return updated[0] ?? null;
    })
    .filter((window): window is FloatingWindow => window !== null);
}

export function dockPanelInFloating(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  panelId: PanelId,
  targetNodeId: string,
  zone: DropZone,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  if (isDockTargetInRoot(root, targetNodeId)) {
    return {
      root: dockPanel(root, panelId, targetNodeId, zone),
      floating: removePanelFromAllFloats(floating, panelId),
    };
  }

  const floatWindow = findFloatingWindowByLayoutNodeId(floating, targetNodeId);
  if (!floatWindow) {
    return {
      root: dockPanel(root, panelId, targetNodeId, zone),
      floating: removePanelFromAllFloats(floating, panelId),
    };
  }

  const migrated = migrateFloatingWindowToLayout(floatWindow);
  if (migrated.layout) {
    const noOpLayout = dockPanel(
      migrated.layout,
      panelId,
      targetNodeId,
      zone,
    );
    if (noOpLayout === migrated.layout) {
      return { root, floating };
    }
  }

  let nextRoot = removePanelFromTree(root, panelId);
  let nextFloating = floating.map((window) =>
    window.id === floatWindow.id ? migrated : window,
  );
  nextFloating = removePanelFromOtherFloats(
    nextFloating,
    panelId,
    floatWindow.id,
  );

  const target = nextFloating.find((window) => window.id === floatWindow.id);
  if (!target?.layout) {
    return { root: nextRoot, floating: nextFloating };
  }

  const newLayout = dockPanel(target.layout, panelId, targetNodeId, zone);
  nextFloating = updateFloatingWindowLayout(
    nextFloating,
    floatWindow.id,
    newLayout,
  );
  return { root: nextRoot, floating: nextFloating };
}

export function dockPanelInFloatingAtTabIndex(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  panelId: PanelId,
  targetNodeId: string,
  index: number,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  if (isDockTargetInRoot(root, targetNodeId)) {
    return {
      root: dockPanelAtTabIndex(root, panelId, targetNodeId, index),
      floating: removePanelFromAllFloats(floating, panelId),
    };
  }

  const floatWindow = findFloatingWindowByLayoutNodeId(floating, targetNodeId);
  if (!floatWindow) {
    return {
      root: dockPanelAtTabIndex(root, panelId, targetNodeId, index),
      floating: removePanelFromAllFloats(floating, panelId),
    };
  }

  const migrated = migrateFloatingWindowToLayout(floatWindow);
  if (migrated.layout) {
    const noOpLayout = dockPanelAtTabIndex(
      migrated.layout,
      panelId,
      targetNodeId,
      index,
    );
    if (noOpLayout === migrated.layout) {
      return { root, floating };
    }
  }

  let nextRoot = removePanelFromTree(root, panelId);
  let nextFloating = floating.map((window) =>
    window.id === floatWindow.id ? migrated : window,
  );
  nextFloating = removePanelFromOtherFloats(
    nextFloating,
    panelId,
    floatWindow.id,
  );

  const target = nextFloating.find((window) => window.id === floatWindow.id);
  if (!target?.layout) {
    return { root: nextRoot, floating: nextFloating };
  }

  const newLayout = dockPanelAtTabIndex(
    target.layout,
    panelId,
    targetNodeId,
    index,
  );
  nextFloating = updateFloatingWindowLayout(
    nextFloating,
    floatWindow.id,
    newLayout,
  );
  return { root: nextRoot, floating: nextFloating };
}

export function dockTabGroupInFloating(
  root: LayoutNode | null,
  floating: FloatingWindow[],
  sourceNodeId: string,
  targetNodeId: string,
  zone: DropZone,
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  const floatWindow = findFloatingWindowByLayoutNodeId(floating, targetNodeId);
  const sourceNode = findNodeById(root, sourceNodeId);
  const group = extractTabGroup(sourceNode);
  if (!floatWindow || !group) {
    return { root, floating };
  }

  let nextRoot = removeLayoutNodeFromTree(root, sourceNodeId);
  let nextFloating = floating.map((window) =>
    window.id === floatWindow.id ? migrateFloatingWindowToLayout(window) : window,
  );
  for (const panelId of group.panels) {
    nextRoot = removePanelFromTree(nextRoot, panelId);
    nextFloating = removePanelFromAllFloats(nextFloating, panelId);
  }

  const target = nextFloating.find((window) => window.id === floatWindow.id);
  if (!target?.layout) {
    return { root: nextRoot, floating: nextFloating };
  }

  const incoming = floatingWindowToLayoutNode(group.panels, group.activeTabId);
  const layoutBeforeRemoval = target.layout;
  const newLayout = insertIncomingAtTarget(
    layoutBeforeRemoval,
    target.layout,
    targetNodeId,
    zone,
    incoming,
  );
  nextFloating = updateFloatingWindowLayout(
    nextFloating,
    floatWindow.id,
    newLayout,
  );
  return { root: nextRoot, floating: nextFloating };
}

export function dockFloatingWindowInFloating(
  floating: FloatingWindow[],
  sourceWindowId: string,
  targetNodeId: string,
  zone: DropZone,
): FloatingWindow[] {
  const source = floating.find((window) => window.id === sourceWindowId);
  const targetFloat = findFloatingWindowByLayoutNodeId(floating, targetNodeId);
  if (!source || !targetFloat || source.id === targetFloat.id) {
    return floating;
  }

  const incoming = getFloatingWindowLayoutNode(source);
  let next = floating.filter((window) => window.id !== sourceWindowId);
  next = next.map((window) =>
    window.id === targetFloat.id ? migrateFloatingWindowToLayout(window) : window,
  );

  const target = next.find((window) => window.id === targetFloat.id);
  if (!target?.layout) return next;

  const newLayout = insertLayoutNodeAtTarget(
    target.layout,
    targetNodeId,
    zone,
    incoming,
  );
  return updateFloatingWindowLayout(next, targetFloat.id, newLayout);
}

export function dockFloatingTabGroupInFloating(
  floating: FloatingWindow[],
  sourceWindowId: string,
  tabGroupNodeId: string,
  targetNodeId: string,
  zone: DropZone,
): FloatingWindow[] {
  const source = floating.find((window) => window.id === sourceWindowId);
  if (!source?.layout) return floating;

  const targetFloat = findFloatingWindowByLayoutNodeId(floating, targetNodeId);
  if (!targetFloat) return floating;

  const migratedSource = migrateFloatingWindowToLayout(source);
  const sourceLayout = migratedSource.layout;
  if (!sourceLayout) return floating;

  const group = extractTabGroup(findNodeById(sourceLayout, tabGroupNodeId));
  if (!group) return floating;

  if (
    sourceWindowId === targetFloat.id &&
    isLayoutNodeShellEdgeDockNoOp(
      sourceLayout,
      tabGroupNodeId,
      targetNodeId,
      zone,
    )
  ) {
    return floating;
  }

  const incoming = floatingWindowToLayoutNode(group.panels, group.activeTabId);
  const nextSourceLayout = removeLayoutNodeFromTree(sourceLayout, tabGroupNodeId);
  const targetWasLayoutRoot = sourceLayout.id === targetNodeId;

  let next = floating.map((window) =>
    window.id === sourceWindowId ? migratedSource : window,
  );

  next = next
    .map((window) => {
      if (window.id !== sourceWindowId) return window;
      if (!nextSourceLayout) return null;
      return syncFloatingWindowPanels({ ...window, layout: nextSourceLayout });
    })
    .filter((window): window is FloatingWindow => window !== null);

  next = next.map((window) =>
    window.id === targetFloat.id ? migrateFloatingWindowToLayout(window) : window,
  );

  const target = next.find((window) => window.id === targetFloat.id);
  if (!target?.layout) return next;

  const resolvedTargetNodeId =
    sourceWindowId === targetFloat.id && targetWasLayoutRoot && nextSourceLayout
      ? nextSourceLayout.id
      : targetNodeId;

  const layoutBeforeRemoval = sourceLayout;
  const newTargetLayout = insertIncomingAtTarget(
    layoutBeforeRemoval,
    target.layout,
    resolvedTargetNodeId,
    zone,
    incoming,
  );
  return updateFloatingWindowLayout(next, targetFloat.id, newTargetLayout);
}

export function applyLocalizedSplitResizeInFloating(
  floating: FloatingWindow[],
  splitId: string,
  deltaPx: number,
  containerInnerSize: number,
): FloatingWindow[] {
  const floatWindow = findFloatingWindowBySplitId(floating, splitId);
  if (!floatWindow?.layout) return floating;

  const newLayout = applyLocalizedSplitResize(
    floatWindow.layout,
    splitId,
    deltaPx,
    containerInnerSize,
  );
  if (!newLayout) return floating;

  return floating.map((window) =>
    window.id === floatWindow.id
      ? syncFloatingWindowPanels({ ...window, layout: newLayout })
      : window,
  );
}

export function setSplitRatioInFloating(
  floating: FloatingWindow[],
  splitId: string,
  ratio: number,
): FloatingWindow[] {
  const floatWindow = findFloatingWindowBySplitId(floating, splitId);
  if (!floatWindow?.layout) return floating;
  const { layout } = floatWindow;

  return floating.map((window) =>
    window.id === floatWindow.id
      ? syncFloatingWindowPanels({
          ...window,
          layout: setSplitRatio(layout, splitId, ratio),
        })
      : window,
  );
}

export function setActiveTabInFloating(
  floating: FloatingWindow[],
  tabGroupId: string,
  panelId: PanelId,
): FloatingWindow[] {
  const floatWindow = findFloatingWindowByLayoutNodeId(floating, tabGroupId);
  if (!floatWindow?.layout) return floating;
  const { layout } = floatWindow;

  return floating.map((window) =>
    window.id === floatWindow.id
      ? syncFloatingWindowPanels({
          ...window,
          layout: setActiveTab(layout, tabGroupId, panelId),
        })
      : window,
  );
}

export function swapTabGroupPanelsInFloating(
  floating: FloatingWindow[],
  tabGroupId: string,
  panelIdA: PanelId,
  panelIdB: PanelId,
  activeTabId?: PanelId,
): FloatingWindow[] {
  const floatWindow = findFloatingWindowByLayoutNodeId(floating, tabGroupId);
  if (!floatWindow?.layout) return floating;

  const layout = swapTabGroupPanels(
    floatWindow.layout,
    tabGroupId,
    panelIdA,
    panelIdB,
    activeTabId,
  );
  if (!layout) return floating;

  return floating.map((window) =>
    window.id === floatWindow.id
      ? syncFloatingWindowPanels({ ...window, layout })
      : window,
  );
}
