import { useLayoutEffect, useState, type RefObject } from 'react';
import { useDndContext } from '@dnd-kit/core';
import { isTabGroupDrag } from '../dnd/dragTypes';
import type { PanelId } from '../../types/layout';
import {
  shouldHideTabInsertSlot,
  TabInsertSlotOverlay,
} from './TabInsertSlot';
import './TabInsertOverlay.css';

interface TabInsertOverlayProps {
  nodeId: string;
  panelIds: PanelId[];
  draggedPanelId?: PanelId;
  tabsContainerRef: RefObject<HTMLDivElement | null>;
  dropBlocked?: boolean;
}

interface InsertPosition {
  index: number;
  left: number;
}

function insertPositionsEqual(
  left: InsertPosition[],
  right: InsertPosition[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (position, index) =>
        position.index === right[index].index &&
        position.left === right[index].left,
    )
  );
}

function measureInsertPositions(
  container: HTMLElement,
  panelIds: PanelId[],
  draggedPanelId: PanelId | undefined,
): InsertPosition[] {
  const containerRect = container.getBoundingClientRect();
  const positions: InsertPosition[] = [];

  const findRenderedTab = (index: number): HTMLElement | null => {
    if (index < 0 || index >= panelIds.length) return null;
    return container.querySelector<HTMLElement>(`[data-tab-index="${index}"]`);
  };

  const findPreviousRenderedTab = (beforeIndex: number): HTMLElement | null => {
    for (let index = beforeIndex - 1; index >= 0; index--) {
      const tab = findRenderedTab(index);
      if (tab) return tab;
    }
    return null;
  };

  const findNextRenderedTab = (fromIndex: number): HTMLElement | null => {
    for (let index = fromIndex; index < panelIds.length; index++) {
      const tab = findRenderedTab(index);
      if (tab) return tab;
    }
    return null;
  };

  for (let index = 0; index <= panelIds.length; index++) {
    if (shouldHideTabInsertSlot(panelIds, draggedPanelId, index)) continue;

    const nextTab = findNextRenderedTab(index);
    const prevTab = findPreviousRenderedTab(index);

    let anchorX: number | null = null;

    if (index === 0 && nextTab) {
      anchorX = nextTab.getBoundingClientRect().left;
    } else if (index === panelIds.length && prevTab) {
      anchorX = prevTab.getBoundingClientRect().right;
    } else if (nextTab && prevTab) {
      const prevRight = prevTab.getBoundingClientRect().right;
      const nextLeft = nextTab.getBoundingClientRect().left;
      anchorX = (prevRight + nextLeft) / 2;
    }

    if (anchorX === null) continue;
    positions.push({ index, left: anchorX - containerRect.left });
  }

  return positions;
}

export function TabInsertOverlay({
  nodeId,
  panelIds,
  draggedPanelId,
  tabsContainerRef,
  dropBlocked = false,
}: TabInsertOverlayProps) {
  const { active } = useDndContext();
  const isDraggingPanel = active?.data.current?.type === 'panel';
  const tabGroupDrag = isTabGroupDrag(active?.data.current);
  const isDraggingTabGroup =
    tabGroupDrag && active?.data.current?.nodeId !== nodeId;
  const isDragging = isDraggingPanel || isDraggingTabGroup;
  const [positions, setPositions] = useState<InsertPosition[]>([]);

  useLayoutEffect(() => {
    const container = tabsContainerRef.current;
    if (!isDragging || !container || dropBlocked) {
      setPositions((current) => (current.length === 0 ? current : []));
      return;
    }

    const update = () => {
      setPositions((current) => {
        const next = measureInsertPositions(container, panelIds, draggedPanelId);
        return insertPositionsEqual(current, next) ? current : next;
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    container.querySelectorAll('[data-tab-index]').forEach((tab) => {
      observer.observe(tab);
    });

    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [dropBlocked, isDragging, panelIds, draggedPanelId, tabsContainerRef]);

  if (!isDragging || dropBlocked || positions.length === 0) return null;

  return (
    <div className="tab-insert-overlay" aria-hidden="true">
      {positions.map(({ index, left }) => (
        <TabInsertSlotOverlay
          key={index}
          nodeId={nodeId}
          index={index}
          left={left}
          hidden={shouldHideTabInsertSlot(panelIds, draggedPanelId, index)}
          dropBlocked={dropBlocked}
        />
      ))}
    </div>
  );
}
