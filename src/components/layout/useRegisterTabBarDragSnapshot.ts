import { useLayoutEffect, type RefObject } from 'react';
import { useTabBarDragSnapshotRegistry } from '../../context/TabBarDragSnapshotContext';
import type { PanelId } from '../../types/layout';

interface TabBarSnapshotInput {
  visiblePanelIds: PanelId[];
  overflowPanelIds: PanelId[];
  activeTabId: PanelId;
  variant: 'docked' | 'floating';
}

export function useRegisterTabBarDragSnapshot(
  nodeId: string,
  tabBarRef: RefObject<HTMLDivElement | null>,
  snapshot: TabBarSnapshotInput,
) {
  const { registerSnapshot } = useTabBarDragSnapshotRegistry();
  const visibleKey = snapshot.visiblePanelIds.join('\0');
  const overflowKey = snapshot.overflowPanelIds.join('\0');

  useLayoutEffect(() => {
    const tabBar = tabBarRef.current;
    if (!tabBar) return;

    const publish = () => {
      registerSnapshot(nodeId, {
        nodeId,
        width: tabBar.getBoundingClientRect().width,
        visiblePanelIds: snapshot.visiblePanelIds,
        overflowPanelIds: snapshot.overflowPanelIds,
        activeTabId: snapshot.activeTabId,
        variant: snapshot.variant,
      });
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(tabBar);
    return () => observer.disconnect();
  }, [
    nodeId,
    tabBarRef,
    visibleKey,
    overflowKey,
    snapshot.activeTabId,
    snapshot.variant,
    registerSnapshot,
  ]);
}
