import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { PanelId } from '../../types/layout';

const TAB_GAP = 8;
const OVERFLOW_BUTTON_WIDTH = 24;
const TAB_BAR_ACTIONS_SELECTOR = '[data-tab-bar-actions]';

function readTabWidths(
  measureContainer: HTMLElement,
  panelIds: PanelId[],
): Map<PanelId, number> {
  const widths = new Map<PanelId, number>();
  for (const panelId of panelIds) {
    const tab = measureContainer.querySelector<HTMLElement>(
      `[data-measure-panel-id="${panelId}"]`,
    );
    if (!tab) continue;
    widths.set(panelId, tab.getBoundingClientRect().width);
  }
  return widths;
}

export function partitionTabsByWidth(
  panelIds: PanelId[],
  tabWidths: Map<PanelId, number>,
  availableWidth: number,
): { visiblePanelIds: PanelId[]; overflowPanelIds: PanelId[] } {
  if (panelIds.length === 0) {
    return { visiblePanelIds: [], overflowPanelIds: [] };
  }

  if (availableWidth <= 0) {
    return { visiblePanelIds: panelIds, overflowPanelIds: [] };
  }

  const fitCount = (widthBudget: number): PanelId[] => {
    let used = 0;
    const visible: PanelId[] = [];

    for (const panelId of panelIds) {
      const tabWidth = tabWidths.get(panelId);
      if (tabWidth == null) continue;

      const gap = visible.length > 0 ? TAB_GAP : 0;
      if (used + gap + tabWidth > widthBudget + 0.5) break;

      visible.push(panelId);
      used += gap + tabWidth;
    }

    return visible;
  };

  const allWidthsKnown = panelIds.every((panelId) => tabWidths.has(panelId));
  if (!allWidthsKnown) {
    return { visiblePanelIds: panelIds, overflowPanelIds: [] };
  }

  let visiblePanelIds = fitCount(availableWidth);
  if (visiblePanelIds.length < panelIds.length) {
    visiblePanelIds = fitCount(availableWidth - OVERFLOW_BUTTON_WIDTH);
  }

  if (visiblePanelIds.length === 0) {
    visiblePanelIds = [panelIds[0]];
  }

  const visibleSet = new Set(visiblePanelIds);
  const overflowPanelIds = panelIds.filter((panelId) => !visibleSet.has(panelId));

  return { visiblePanelIds, overflowPanelIds };
}

function partitionsEqual(left: PanelId[], right: PanelId[]): boolean {
  return (
    left.length === right.length &&
    left.every((panelId, index) => panelId === right[index])
  );
}

function panelIdsEqual(left: PanelId[], right: PanelId[]): boolean {
  return partitionsEqual(left, right);
}

export function useTabBarOverflow(
  tabBarRef: RefObject<HTMLDivElement | null>,
  measureRef: RefObject<HTMLDivElement | null>,
  panelIds: PanelId[],
  pauseMeasurement = false,
) {
  const [visiblePanelIds, setVisiblePanelIds] = useState(panelIds);
  const [overflowPanelIds, setOverflowPanelIds] = useState<PanelId[]>([]);
  const overflowPanelIdsRef = useRef(overflowPanelIds);

  overflowPanelIdsRef.current = overflowPanelIds;

  useLayoutEffect(() => {
    setVisiblePanelIds((current) =>
      panelIdsEqual(current, panelIds) ? current : panelIds,
    );
    setOverflowPanelIds((current) => (current.length === 0 ? current : []));
  }, [panelIds]);

  useLayoutEffect(() => {
    if (pauseMeasurement) {
      setVisiblePanelIds((current) =>
        panelIdsEqual(current, panelIds) ? current : panelIds,
      );
      setOverflowPanelIds((current) => (current.length === 0 ? current : []));
      return;
    }

    const tabBar = tabBarRef.current;
    const measureContainer = measureRef.current;
    if (!tabBar || !measureContainer) {
      setVisiblePanelIds((current) =>
        panelIdsEqual(current, panelIds) ? current : panelIds,
      );
      setOverflowPanelIds((current) => (current.length === 0 ? current : []));
      return;
    }

    let cancelled = false;

    const update = () => {
      if (cancelled || pauseMeasurement) return;

      const actions = tabBar.querySelector<HTMLElement>(TAB_BAR_ACTIONS_SELECTOR);
      const actionsWidth = actions?.getBoundingClientRect().width ?? 0;
      let availableWidth = tabBar.clientWidth - actionsWidth;
      if (overflowPanelIdsRef.current.length > 0) {
        availableWidth -= OVERFLOW_BUTTON_WIDTH;
      }
      const tabWidths = readTabWidths(measureContainer, panelIds);
      const next = partitionTabsByWidth(panelIds, tabWidths, availableWidth);

      setVisiblePanelIds((current) =>
        partitionsEqual(current, next.visiblePanelIds)
          ? current
          : next.visiblePanelIds,
      );
      setOverflowPanelIds((current) =>
        partitionsEqual(current, next.overflowPanelIds)
          ? current
          : next.overflowPanelIds,
      );
    };

    update();
    const raf = requestAnimationFrame(update);

    const observer = new ResizeObserver(update);
    observer.observe(tabBar);
    observer.observe(measureContainer);
    panelIds.forEach((panelId) => {
      const tab = measureContainer.querySelector(
        `[data-measure-panel-id="${panelId}"]`,
      );
      if (tab) observer.observe(tab);
    });

    window.addEventListener('resize', update);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [measureRef, panelIds, pauseMeasurement, tabBarRef]);

  return { visiblePanelIds, overflowPanelIds };
}
