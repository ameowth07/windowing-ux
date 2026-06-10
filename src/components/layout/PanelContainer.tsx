import { useMemo, useRef } from 'react';
import { useDndContext, useDroppable } from '@dnd-kit/core';
import { useFloatDragPreview } from '../../context/FloatDragPreviewContext';
import { useCollapsedTabBar } from '../../context/CollapsedTabBarContext';
import { useFloatingLayoutWindowId } from '../../context/FloatingLayoutContext';
import { useLayout } from '../../context/LayoutContext';
import type { DragPanelData, LayoutNode, PanelHoverData, PanelId } from '../../types/layout';
import { usePanelGroupingBlocked } from '../../hooks/usePanelGroupingBlocked';
import { isTabGroupDrag } from '../dnd/dragTypes';
import { PanelContent } from '../panels/PanelContent';
import { DraggableTab } from './DraggableTab';
import { DraggableTabBar } from './DraggableTabBar';
import { DropZones } from './DropZones';
import { PanelTabBarMenu } from './PanelTabBarMenu';
import { TabBarOverflowMenu } from './TabBarOverflowMenu';
import { TabInsertOverlay } from './TabInsertOverlay';
import { TabPreview } from './TabPreview';
import { useRegisterTabBarDragSnapshot } from './useRegisterTabBarDragSnapshot';
import { useTabBarOverflow } from './useTabBarOverflow';
import './PanelContainer.css';

interface PanelContainerProps {
  node: Extract<LayoutNode, { type: 'panel' } | { type: 'tabs' }>;
}

export function PanelContainer({ node }: PanelContainerProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const floatingWindowId = useFloatingLayoutWindowId();
  const tabSource = floatingWindowId ? 'floating' : 'docked';
  const { active } = useDndContext();
  const floatPreview = useFloatDragPreview();
  const { setActiveTab, selectTabOverflow } = useLayout();
  const { isTabBarCollapsed, expandTabBar } = useCollapsedTabBar();
  const isCollapsed = isTabBarCollapsed(node.id);

  const panelIds = useMemo(
    (): PanelId[] => (node.type === 'tabs' ? node.panels : [node.panelId]),
    [node],
  );
  const activePanelId =
    node.type === 'tabs' ? node.activeTabId : node.panelId;
  const isDropBlocked = usePanelGroupingBlocked(panelIds);

  const bodyHoverData: PanelHoverData = {
    type: 'panel-body-hover',
    nodeId: node.id,
  };
  const { setNodeRef: setBodyRef } = useDroppable({
    id: `panel-body-hover-${node.id}`,
    data: bodyHoverData,
    disabled: isDropBlocked,
  });

  const isAnyDragActive = active != null;
  const { visiblePanelIds, overflowPanelIds } = useTabBarOverflow(
    tabBarRef,
    measureRef,
    panelIds,
    isAnyDragActive || isCollapsed,
  );

  useRegisterTabBarDragSnapshot(node.id, tabBarRef, {
    visiblePanelIds,
    overflowPanelIds,
    activeTabId: activePanelId,
    variant: tabSource,
  });

  const isThisTabGroupDragging =
    isTabGroupDrag(active?.data.current) &&
    active.data.current.nodeId === node.id;
  const isFloatWindowPreviewActive =
    floatPreview?.kind === 'window' && isThisTabGroupDragging;

  const tabBarDragClass = isFloatWindowPreviewActive
    ? 'panel-container__tab-bar--dragging-source-hidden'
    : isThisTabGroupDragging
      ? 'panel-container__tab-bar--dragging-source'
      : '';

  const draggedPanelId = (active?.data.current as DragPanelData | undefined)
    ?.panelId;

  const handleOverflowSelect = (panelId: PanelId) => {
    if (node.type !== 'tabs') return;

    const rightmostVisible = visiblePanelIds[visiblePanelIds.length - 1];
    if (rightmostVisible && rightmostVisible !== panelId) {
      selectTabOverflow(node.id, panelId, rightmostVisible);
      return;
    }
    setActiveTab(node.id, panelId);
  };

  return (
    <div
      className={[
        'panel-container',
        isCollapsed ? 'panel-container--tab-bar-collapsed' : '',
        isDropBlocked ? 'panel-container--drop-blocked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isCollapsed ? (
        <button
          type="button"
          className="panel-container__expand-tab-bar"
          aria-label="Expand tab bar"
          title="Expand tab bar"
          onClick={() => expandTabBar(node.id)}
        />
      ) : (
        <>
      <div
        ref={tabBarRef}
        className={['panel-container__tab-bar', tabBarDragClass].filter(Boolean).join(' ')}
      >
        <div ref={measureRef} className="panel-container__tabs-measure" aria-hidden="true">
          {panelIds.map((panelId) => (
            <div key={panelId} data-measure-panel-id={panelId}>
              <TabPreview
                panelId={panelId}
                active={panelId === activePanelId}
              />
            </div>
          ))}
        </div>
        <div ref={tabsRef} className="panel-container__tabs">
          <DraggableTabBar
            nodeId={node.id}
            panels={panelIds}
            activeTabId={activePanelId}
            source={tabSource}
          />
          {visiblePanelIds.map((panelId) => (
            <DraggableTab
              key={panelId}
              panelId={panelId}
              tabIndex={panelIds.indexOf(panelId)}
              active={panelId === activePanelId}
              source={tabSource}
              floatingWindowId={floatingWindowId ?? undefined}
              onSelect={() => {
                if (node.type === 'tabs') {
                  setActiveTab(node.id, panelId);
                }
              }}
            />
          ))}
          <TabInsertOverlay
            nodeId={node.id}
            panelIds={panelIds}
            draggedPanelId={draggedPanelId}
            tabsContainerRef={tabsRef}
            dropBlocked={isDropBlocked}
          />
        </div>
        <TabBarOverflowMenu
          overflowPanelIds={overflowPanelIds}
          activeTabId={activePanelId}
          onSelect={handleOverflowSelect}
        />
        <div className="panel-container__actions" data-tab-bar-actions>
          <PanelTabBarMenu
            nodeId={node.id}
            panelIds={panelIds}
            activePanelId={activePanelId}
            tabBarRef={tabBarRef}
          />
        </div>
      </div>
      <div className="panel-container__divider" />
        </>
      )}
      <div ref={setBodyRef} className="panel-container__body">
        <PanelContent panelId={activePanelId} />
        <DropZones nodeId={node.id} panelIds={panelIds} scoped />
      </div>
    </div>
  );
}
