import type { FloatingWindow, LayoutNode, LayoutState } from '../types/layout';

function cloneLayoutNode(node: LayoutNode): LayoutNode {
  return JSON.parse(JSON.stringify(node)) as LayoutNode;
}

function snapshotFloatingWindow(window: FloatingWindow): FloatingWindow {
  return {
    id: window.id,
    panels: [...window.panels],
    activeTabId: window.activeTabId,
    layout: window.layout ? cloneLayoutNode(window.layout) : null,
    x: window.x,
    y: window.y,
    width: window.width,
    height: window.height,
    ...(window.monitorIndex != null ? { monitorIndex: window.monitorIndex } : {}),
  };
}

/** Persist only docked panel placement and open auxiliary windows with coordinates. */
export function createSavedLayoutSnapshot(state: LayoutState): LayoutState {
  return {
    root: state.root ? cloneLayoutNode(state.root) : null,
    floating: state.floating.map(snapshotFloatingWindow),
  };
}
