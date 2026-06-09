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
    for (const panelId of window.panels) {
      ids.push(panelId);
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

function collectPanelsFromNode(node: LayoutNode): PanelId[] {
  if (node.type === 'panel') return [node.panelId];
  if (node.type === 'tabs') return [...node.panels];
  return [];
}

function getActivePanelId(node: LayoutNode): PanelId {
  if (node.type === 'panel') return node.panelId;
  if (node.type === 'tabs') return node.activeTabId;
  throw new Error('Cannot resolve active panel from split node');
}

function mergeIncomingIntoHost(host: LayoutNode, incoming: LayoutNode): LayoutNode {
  let result = host;
  for (const panelId of collectPanelsFromNode(incoming)) {
    result = mergeIntoTabsAtIndex(result, panelId, Number.MAX_SAFE_INTEGER);
  }
  const preferredActive = getActivePanelId(incoming);
  if (result.type === 'tabs' && result.panels.includes(preferredActive)) {
    return { ...result, activeTabId: preferredActive };
  }
  return result;
}

function insertNodeAtTarget(
  node: LayoutNode,
  targetNodeId: string,
  zone: DropZone,
  incoming: LayoutNode,
): LayoutNode {
  if (node.id === targetNodeId) {
    if (zone === 'center') {
      return mergeIncomingIntoHost(node, incoming);
    }
    return wrapWithSplitNode(node, incoming, zone);
  }

  if (node.type === 'split') {
    return {
      ...node,
      first: insertNodeAtTarget(node.first, targetNodeId, zone, incoming),
      second: insertNodeAtTarget(node.second, targetNodeId, zone, incoming),
    };
  }

  return node;
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

export function dockFloatingWindow(
  root: LayoutNode | null,
  panels: PanelId[],
  activeTabId: PanelId,
  targetNodeId: string,
  zone: DropZone,
): LayoutNode | null {
  const incoming = floatingWindowToLayoutNode(panels, activeTabId);

  let withoutPanels = root;
  for (const panelId of panels) {
    withoutPanels = removePanelFromTree(withoutPanels, panelId);
  }

  if (targetNodeId === '__workspace_root__') {
    if (!withoutPanels) return incoming;
    if (zone === 'center') return incoming;
    return wrapWithSplitNode(withoutPanels, incoming, zone);
  }

  if (!withoutPanels) return incoming;

  return insertNodeAtTarget(withoutPanels, targetNodeId, zone, incoming);
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

function removePanelsFromFloating<T extends { panels: PanelId[]; activeTabId: PanelId }>(
  floating: T[],
  panelIds: PanelId[],
): T[] {
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

export function mergeTabGroupIntoFloating<
  T extends { id: string; panels: PanelId[]; activeTabId: PanelId },
>(
  root: LayoutNode | null,
  floating: T[],
  nodeId: string,
  floatingWindowId: string,
): { root: LayoutNode | null; floating: T[] } {
  const node = findNodeById(root, nodeId);
  const group = extractTabGroup(node);
  const target = floating.find((window) => window.id === floatingWindowId);
  if (!group || !target) {
    return { root, floating };
  }
  if (group.panels.every((panelId) => target.panels.includes(panelId))) {
    return { root, floating };
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

function mergeIntoTabs(node: LayoutNode, panelId: PanelId): LayoutNode {
  return mergeIntoTabsAtIndex(node, panelId, Number.MAX_SAFE_INTEGER);
}

function insertPanelAtTarget(
  node: LayoutNode,
  targetNodeId: string,
  zone: DropZone,
  panelId: PanelId,
): LayoutNode {
  if (node.id === targetNodeId) {
    if (zone === 'center') {
      return mergeIntoTabs(node, panelId);
    }
    return wrapWithSplit(node, panelId, zone);
  }

  if (node.type === 'split') {
    return {
      ...node,
      first: insertPanelAtTarget(node.first, targetNodeId, zone, panelId),
      second: insertPanelAtTarget(node.second, targetNodeId, zone, panelId),
    };
  }

  return node;
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
  if (hostNode?.id === targetNodeId) {
    // Same container: no-op for tab-group merge or lone panel self-drop.
    // Split zones on a tab group peel the dragged tab out into a new pane.
    if (zone === 'center' || hostNode.type === 'panel') {
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
    if (zone === 'center') return incoming;
    return wrapWithSplit(withoutPanel, panelId, zone);
  }

  if (!withoutPanel) {
    return incoming;
  }

  return insertPanelAtTarget(withoutPanel, targetNodeId, zone, panelId);
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
    return withoutPanel ?? root;
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
  return mergePanelIntoFloatingWindow(
    floating,
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

export function removePanelFromFloating<T extends { panels: PanelId[]; activeTabId: PanelId }>(
  floating: T[],
  panelId: PanelId,
): T[] {
  return floating
    .map((window) => {
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
    .filter((window): window is T => window !== null);
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

export function mergePanelIntoFloatingWindow<T extends {
  id: string;
  panels: PanelId[];
  activeTabId: PanelId;
}>(
  floating: T[],
  floatingWindowId: string,
  panelId: PanelId,
  index: number,
): T[] {
  return floating.map((window) => {
    if (window.id !== floatingWindowId) return window;
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

export function mergeFloatingWindowIntoFloating<
  T extends { id: string; panels: PanelId[]; activeTabId: PanelId },
>(
  floating: T[],
  sourceWindowId: string,
  targetWindowId: string,
  index?: number,
): T[] {
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
): { root: LayoutNode | null; floating: FloatingWindow[] } {
  const source = floating.find((window) => window.id === floatingWindowId);
  if (!source) return { root, floating };

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

export function mergeFloatingTabUpdate<
  T extends { id: string; panels: PanelId[]; activeTabId: PanelId },
>(
  root: LayoutNode | null,
  floating: T[],
  floatingWindowId: string,
  panelId: PanelId,
  index: number,
): { root: LayoutNode | null; floating: T[] } {
  const targetWindow = floating.find((window) => window.id === floatingWindowId);
  if (!targetWindow) {
    return { root, floating };
  }

  const sourceWindow = floating.find((window) => window.panels.includes(panelId));

  if (sourceWindow?.id === floatingWindowId) {
    if (isFloatingTabInsertNoOp(floating, floatingWindowId, panelId, index)) {
      return { root, floating };
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
