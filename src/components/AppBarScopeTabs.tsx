import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PrimaryWindowGhostPreview } from './desktop/PrimaryWindowGhostPreview';
import { usePrimaryWindowIdOptional } from '../context/PrimaryWindowContext';
import {
  getPrimaryWindowDropBounds,
  getPrimaryWindowGhostScreenBounds,
} from '../utils/primaryWindowPosition';
import { INITIAL_WINDOW_ID } from '../context/PrimaryWindowsContext';
import {
  normalizeScopeTabIcon,
  useScopeTabsForWindow,
  type ScopeTab,
  type ScopeTabIcon,
} from '../context/ScopeTabContext';
import './AppBarScopeTabs.css';

const DRAG_THRESHOLD = 6;
const SCOPE_TAB_WIDTH = 110;

type ScopeTabDragMode = 'reorder' | 'attach' | 'detach' | null;

function getPrimaryWindowIdAtPoint(
  clientX: number,
  clientY: number,
): string | null {
  const hit = document
    .elementsFromPoint(clientX, clientY)
    .find((element) => element.closest('[data-primary-window-id]'));
  if (!hit) return null;
  return hit.closest('[data-primary-window-id]')?.getAttribute('data-primary-window-id') ?? null;
}

function isPointerOverScopeTabBar(clientX: number, clientY: number) {
  return document
    .elementsFromPoint(clientX, clientY)
    .some((element) => element.closest('.app-bar-scope-tabs'));
}

function isPointerOverOwnScopeTabBar(
  clientX: number,
  clientY: number,
  tabsContainer: HTMLElement | null,
) {
  if (!tabsContainer) return false;
  return document
    .elementsFromPoint(clientX, clientY)
    .some((element) => tabsContainer.contains(element));
}

function resolveScopeTabDragMode(
  clientX: number,
  clientY: number,
  sourceWindowId: string,
  tabsContainer: HTMLElement | null,
): { mode: ScopeTabDragMode; targetWindowId: string | null } {
  if (isPointerOverScopeTabBar(clientX, clientY)) {
    const targetWindowId = getPrimaryWindowIdAtPoint(clientX, clientY);
    if (
      targetWindowId === sourceWindowId &&
      isPointerOverOwnScopeTabBar(clientX, clientY, tabsContainer)
    ) {
      return { mode: 'reorder', targetWindowId };
    }
    if (targetWindowId && targetWindowId !== sourceWindowId) {
      return { mode: 'attach', targetWindowId };
    }
    return { mode: null, targetWindowId: targetWindowId ?? null };
  }

  return { mode: 'detach', targetWindowId: null };
}

function computeScopeTabTargetIndex(
  clientX: number,
  container: HTMLElement,
  fromIndex: number,
): number {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>('.app-bar-scope-tabs__item'),
  );
  if (items.length === 0) return 0;

  let target = fromIndex;
  for (let i = 0; i < items.length; i++) {
    if (i === fromIndex) continue;
    const rect = items[i].getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    if (i < fromIndex && clientX < center) {
      target = i;
    }
    if (i > fromIndex && clientX > center) {
      target = i;
    }
  }

  return target;
}

function getScopeTabShift(
  index: number,
  fromIndex: number,
  targetIndex: number,
): number {
  if (index === fromIndex) return 0;
  if (fromIndex < targetIndex) {
    if (index > fromIndex && index <= targetIndex) return -1;
    return 0;
  }
  if (fromIndex > targetIndex) {
    if (index >= targetIndex && index < fromIndex) return 1;
    return 0;
  }
  return 0;
}

function getScopeTabFloatLeft(clientX: number, container: HTMLElement): number {
  const rect = container.getBoundingClientRect();
  const maxLeft = Math.max(0, rect.width - SCOPE_TAB_WIDTH);
  return Math.min(
    Math.max(clientX - rect.left - SCOPE_TAB_WIDTH / 2, 0),
    maxLeft,
  );
}

function clearScopeTabDropTargets() {
  document
    .querySelectorAll('[data-primary-window-id].scope-tab-drop-target')
    .forEach((element) => {
      element.classList.remove('scope-tab-drop-target');
    });
}

function updateScopeTabDropTarget(
  clientX: number,
  clientY: number,
  sourceWindowId: string,
) {
  clearScopeTabDropTargets();

  const targetWindowId = getPrimaryWindowIdAtPoint(clientX, clientY);
  if (
    !targetWindowId ||
    targetWindowId === sourceWindowId ||
    !isPointerOverScopeTabBar(clientX, clientY)
  ) {
    return;
  }

  document
    .querySelector(`[data-primary-window-id="${targetWindowId}"]`)
    ?.classList.add('scope-tab-drop-target');
}

function getDesktopWindowsContainer() {
  return document.querySelector<HTMLElement>('.desktop__windows');
}

export function AppBarScopeTabs() {
  const windowId = usePrimaryWindowIdOptional() ?? INITIAL_WINDOW_ID;
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    detachTabToNewWindow,
    attachTabToWindow,
    reorderTabInWindow,
  } = useScopeTabsForWindow(windowId);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    tabId: string;
    x: number;
    y: number;
    mode: ScopeTabDragMode;
    fromIndex: number;
    targetIndex: number;
    floatLeft: number;
  } | null>(null);
  const dragRef = useRef<{
    tabId: string;
    startX: number;
    startY: number;
    fromIndex: number;
    dragging: boolean;
    mode: ScopeTabDragMode;
    targetIndex: number;
  } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

      drag.dragging = true;

      const { mode, targetWindowId } = resolveScopeTabDragMode(
        event.clientX,
        event.clientY,
        windowId,
        tabsRef.current,
      );
      drag.mode = mode;

      let targetIndex = drag.fromIndex;
      let floatLeft = 0;
      if (mode === 'reorder' && tabsRef.current) {
        targetIndex = computeScopeTabTargetIndex(
          event.clientX,
          tabsRef.current,
          drag.fromIndex,
        );
        floatLeft = getScopeTabFloatLeft(event.clientX, tabsRef.current);
      }
      drag.targetIndex = targetIndex;

      if (mode === 'attach' && targetWindowId) {
        updateScopeTabDropTarget(event.clientX, event.clientY, windowId);
      } else {
        clearScopeTabDropTargets();
      }

      setDragState({
        tabId: drag.tabId,
        x: event.clientX,
        y: event.clientY,
        mode,
        fromIndex: drag.fromIndex,
        targetIndex,
        floatLeft,
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.dragging) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);

        const { mode, targetWindowId } = resolveScopeTabDragMode(
          event.clientX,
          event.clientY,
          windowId,
          tabsRef.current,
        );

        if (mode === 'reorder') {
          const targetIndex =
            tabsRef.current != null
              ? computeScopeTabTargetIndex(
                  event.clientX,
                  tabsRef.current,
                  drag.fromIndex,
                )
              : drag.targetIndex;
          reorderTabInWindow(drag.tabId, targetIndex);
        } else if (
          mode === 'attach' &&
          targetWindowId &&
          targetWindowId !== windowId
        ) {
          attachTabToWindow(drag.tabId, targetWindowId);
        } else if (mode === 'detach') {
          detachTabToNewWindow(
            drag.tabId,
            getPrimaryWindowDropBounds(
              event.clientX,
              event.clientY,
              getDesktopWindowsContainer(),
            ),
          );
        }
      }

      clearScopeTabDropTargets();
      dragRef.current = null;
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      clearScopeTabDropTargets();
    };
  }, [windowId, tabs, detachTabToNewWindow, attachTabToWindow, reorderTabInWindow]);

  const previewTab = dragState
    ? tabs.find((tab) => tab.id === dragState.tabId)
    : null;
  const isReordering = dragState?.mode === 'reorder';
  const isDetaching = dragState?.mode === 'detach';
  const desktopWindowsContainer = getDesktopWindowsContainer();
  const detachPreviewBounds =
    isDetaching && dragState
      ? getPrimaryWindowGhostScreenBounds(
          dragState.x,
          dragState.y,
          desktopWindowsContainer,
        )
      : null;

  return (
    <>
      <div
        ref={tabsRef}
        className={[
          'app-bar-scope-tabs',
          isReordering ? 'app-bar-scope-tabs--reordering' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="tablist"
        aria-label="Scope tabs"
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeTabId;
          const isDragSource =
            isReordering && dragState?.tabId === tab.id;
          const shift =
            isReordering && dragState
              ? getScopeTabShift(
                  index,
                  dragState.fromIndex,
                  dragState.targetIndex,
                )
              : 0;

          return (
            <div
              key={tab.id}
              data-scope-tab-index={index}
              className={[
                'app-bar-scope-tabs__item',
                active
                  ? 'app-bar-scope-tabs__item--active'
                  : 'app-bar-scope-tabs__item--inactive',
                isReordering ? 'app-bar-scope-tabs__item--shifting' : '',
                isDragSource ? 'app-bar-scope-tabs__item--drag-source' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                shift !== 0
                  ? { transform: `translateX(${shift * SCOPE_TAB_WIDTH}px)` }
                  : undefined
              }
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="app-bar-scope-tabs__tab"
                onClick={() => {
                  if (suppressClickRef.current) return;
                  setActiveTabId(tab.id);
                }}
                onPointerDown={(event) => {
                  if (
                    (event.target as HTMLElement).closest(
                      '.app-bar-scope-tabs__close-btn',
                    )
                  ) {
                    return;
                  }
                  event.stopPropagation();
                  dragRef.current = {
                    tabId: tab.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    fromIndex: index,
                    dragging: false,
                    mode: null,
                    targetIndex: index,
                  };
                }}
              >
                <span className="app-bar-scope-tabs__icon" aria-hidden="true">
                  <ScopeTabIcon
                    icon={normalizeScopeTabIcon(tab.icon)}
                    active={active}
                  />
                </span>
                <span className="app-bar-scope-tabs__label">{tab.label}</span>
              </button>
              <button
                type="button"
                className="app-bar-scope-tabs__close-btn"
                aria-label={`Close ${tab.label} tab`}
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <CloseIcon />
              </button>
            </div>
          );
        })}
        {isReordering && previewTab && dragState ? (
          <ScopeTabFloat
            tab={previewTab}
            active={previewTab.id === activeTabId}
            left={dragState.floatLeft}
          />
        ) : null}
      </div>
      {isDetaching && previewTab && detachPreviewBounds
        ? createPortal(
            <PrimaryWindowGhostPreview
              tab={previewTab}
              x={detachPreviewBounds.screenX}
              y={detachPreviewBounds.screenY}
              width={detachPreviewBounds.width}
              height={detachPreviewBounds.height}
              fixed
            />,
            document.body,
          )
        : null}
      {dragState?.mode === 'attach' && previewTab
        ? createPortal(
            <div
              className="app-bar-scope-tabs__drag-preview"
              style={{
                left: dragState.x,
                top: dragState.y,
              }}
            >
              <ScopeTabTabContent tab={previewTab} active={false} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ScopeTabFloat({
  tab,
  active,
  left,
}: {
  tab: ScopeTab;
  active: boolean;
  left: number;
}) {
  return (
    <div
      className={[
        'app-bar-scope-tabs__float',
        active ? 'app-bar-scope-tabs__float--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left }}
      aria-hidden="true"
    >
      <ScopeTabTabContent tab={tab} active={active} />
    </div>
  );
}

function ScopeTabTabContent({
  tab,
  active,
}: {
  tab: ScopeTab;
  active: boolean;
}) {
  return (
    <>
      <span className="app-bar-scope-tabs__icon" aria-hidden="true">
        <ScopeTabIcon
          icon={normalizeScopeTabIcon(tab.icon)}
          active={active}
        />
      </span>
      <span className="app-bar-scope-tabs__label">{tab.label}</span>
    </>
  );
}

function ScopeTabIcon({ icon, active }: { icon: ScopeTabIcon; active: boolean }) {
  switch (icon) {
    case 'project':
      return <ProjectIcon active={active} />;
    case 'asset-ui':
      return <AssetUiIcon active={active} />;
    case 'asset-avatar':
      return <AssetAvatarIcon active={active} />;
    default:
      return <ProjectIcon active={active} />;
  }
}

function ProjectIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 2.5h7.5L13 5v8.5H3V2.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <path d="M10.5 2.5V5H13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function AssetUiIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="3.5"
        width="10"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
      <path d="M3 6h10" stroke="currentColor" strokeWidth="1.2" />
      <rect
        x="5"
        y="8.25"
        width="2.5"
        height="2.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.35 : 0}
      />
      <rect
        x="8.5"
        y="8.25"
        width="2.5"
        height="2.5"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.35 : 0}
      />
    </svg>
  );
}

function AssetAvatarIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path
        d="M3.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"
        stroke="currentColor"
        strokeWidth="1.2"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.15 : 0}
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
