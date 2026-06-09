import type { ReactNode } from 'react';
import { usePrimaryWindowIdOptional } from '../../context/PrimaryWindowContext';
import {
  isScopeTabEmptyPlace,
  useScopeTabsOptional,
} from '../../context/ScopeTabContext';
import { useSkeletonContentEnabled } from '../../context/SkeletonContentContext';
import { INITIAL_WINDOW_ID } from '../../context/PrimaryWindowsContext';
import { RECENT_PROJECTS } from '../../config/recentProjects';
import { getPlaceSkeletonVariant } from '../../data/initialLayout';
import { getBasePanelId } from '../../utils/panelId';
import type { PanelId } from '../../types/layout';
import './PanelContent.css';

interface PanelContentProps {
  panelId: PanelId;
  skeletonContent?: boolean;
}

function GenericSkeleton() {
  return (
    <div className="panel-skeleton panel-skeleton--generic" aria-hidden="true">
      <span className="panel-content__skeleton-line panel-content__skeleton-line--wide" />
      <span className="panel-content__skeleton-line" />
      <span className="panel-content__skeleton-line panel-content__skeleton-line--medium" />
      <span className="panel-content__skeleton-line" />
      <span className="panel-content__skeleton-line panel-content__skeleton-line--short" />
    </div>
  );
}

function ToolboxSkeleton() {
  return (
    <div className="panel-skeleton panel-skeleton--toolbox" aria-hidden="true">
      <div className="panel-skeleton__toolbox-search" />
      <div className="panel-skeleton__toolbox-grid">
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="panel-skeleton__thumb" />
        ))}
      </div>
    </div>
  );
}

function AssetManagerSkeleton() {
  return (
    <div className="panel-skeleton panel-skeleton--asset-manager" aria-hidden="true">
      <div className="panel-skeleton__asset-manager-toolbar">
        <div className="panel-skeleton__asset-manager-search" />
        <div className="panel-skeleton__asset-manager-filter" />
      </div>
      <div className="panel-skeleton__asset-manager-grid">
        {Array.from({ length: 20 }, (_, index) => (
          <div key={index} className="panel-skeleton__thumb" />
        ))}
      </div>
    </div>
  );
}

function PlaceRacetrackSkeleton() {
  return (
    <div
      className="panel-skeleton panel-skeleton--place panel-skeleton--place-racetrack"
      aria-hidden="true"
    >
      <svg
        className="panel-skeleton__place-track"
        viewBox="0 0 240 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="panel-skeleton__place-outer"
          d="M 72 28 H 168 A 42 42 0 0 1 168 112 H 72 A 42 42 0 0 1 72 28 Z"
        />
        <path
          className="panel-skeleton__place-inner"
          d="M 72 48 H 168 A 22 22 0 0 1 168 92 H 72 A 22 22 0 0 1 72 48 Z"
        />
        <rect
          className="panel-skeleton__place-start"
          x="68"
          y="66"
          width="8"
          height="8"
        />
        <rect
          className="panel-skeleton__place-start panel-skeleton__place-start--alt"
          x="68"
          y="74"
          width="8"
          height="8"
        />
      </svg>
    </div>
  );
}

function PlaceFpsSkeleton() {
  return (
    <div
      className="panel-skeleton panel-skeleton--place panel-skeleton--place-fps"
      aria-hidden="true"
    >
      <div className="fps-scene">
        <div className="fps-scene__sky" />
        <div className="fps-scene__horizon" />
        <div className="fps-scene__wall fps-scene__wall--left" />
        <div className="fps-scene__wall fps-scene__wall--right" />
        <div className="fps-scene__floor">
          <div className="fps-scene__grid" />
        </div>
        <div className="fps-scene__pillar fps-scene__pillar--left" />
        <div className="fps-scene__pillar fps-scene__pillar--right" />
        <div className="fps-scene__enemy fps-scene__enemy--far" />
        <div className="fps-scene__enemy fps-scene__enemy--mid" />
        <div className="fps-scene__crate fps-scene__crate--left" />
        <div className="fps-scene__crate fps-scene__crate--right" />
        <div className="fps-scene__vignette" />
        <div className="fps-scene__weapon">
          <span className="fps-scene__weapon-barrel" />
          <span className="fps-scene__weapon-body" />
          <span className="fps-scene__weapon-grip" />
        </div>
        <div className="fps-crosshair">
          <span className="fps-crosshair__line fps-crosshair__line--top" />
          <span className="fps-crosshair__line fps-crosshair__line--right" />
          <span className="fps-crosshair__line fps-crosshair__line--bottom" />
          <span className="fps-crosshair__line fps-crosshair__line--left" />
          <span className="fps-crosshair__dot" />
        </div>
        <div className="fps-hud">
          <div className="fps-hud__score">
            <span className="fps-hud__score-team">12</span>
            <span className="fps-hud__score-divider">—</span>
            <span className="fps-hud__score-enemy">8</span>
          </div>
          <div className="fps-hud__minimap">
            <span className="fps-hud__minimap-player" />
            <span className="fps-hud__minimap-blip fps-hud__minimap-blip--a" />
            <span className="fps-hud__minimap-blip fps-hud__minimap-blip--b" />
          </div>
          <div className="fps-hud__health">
            <span className="fps-hud__health-label">HP</span>
            <span className="fps-hud__health-bar">
              <span className="fps-hud__health-fill" />
            </span>
            <span className="fps-hud__health-value">100</span>
          </div>
          <div className="fps-hud__ammo">
            <span className="fps-hud__ammo-mag">30</span>
            <span className="fps-hud__ammo-sep">/</span>
            <span className="fps-hud__ammo-reserve">120</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function resolveScopeTabId(
  windowId: string | undefined,
  scopeTabs: ReturnType<typeof useScopeTabsOptional>,
  fallbackScopeTabId: string,
) {
  if (!scopeTabs || !windowId) return fallbackScopeTabId;
  return scopeTabs.getActiveTabForWindow(windowId);
}

function PlaceSkeleton() {
  const windowId = usePrimaryWindowIdOptional() ?? INITIAL_WINDOW_ID;
  const scopeTabs = useScopeTabsOptional();
  const scopeTabId = resolveScopeTabId(windowId, scopeTabs, 'project-1');
  const activeTab = scopeTabs?.tabs.find((tab) => tab.id === scopeTabId);
  const variant = activeTab?.recentProjectId
    ? (RECENT_PROJECTS[activeTab.recentProjectId].placeSkeletonVariant ??
      getPlaceSkeletonVariant(scopeTabId))
    : getPlaceSkeletonVariant(scopeTabId);

  if (variant === 'fps') {
    return <PlaceFpsSkeleton />;
  }
  return <PlaceRacetrackSkeleton />;
}

const SCRIPT_LINES = [
  { width: '48%', indent: 0 },
  { width: '72%', indent: 1 },
  { width: '56%', indent: 2 },
  { width: '64%', indent: 2 },
  { width: '40%', indent: 1 },
  { width: '52%', indent: 0 },
  { width: '68%', indent: 1 },
  { width: '44%', indent: 2 },
];

function ScriptSkeleton() {
  return (
    <div className="panel-skeleton panel-skeleton--script" aria-hidden="true">
      <div className="panel-skeleton__script-gutter">
        {SCRIPT_LINES.map((_, index) => (
          <span key={index} className="panel-skeleton__script-line-number">
            {index + 1}
          </span>
        ))}
      </div>
      <div className="panel-skeleton__script-editor">
        {SCRIPT_LINES.map((line, index) => (
          <span
            key={index}
            className="panel-content__skeleton-line panel-skeleton__code-line"
            style={{
              width: line.width,
              marginLeft: `${line.indent * 16}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function UISkeleton() {
  return (
    <div className="panel-skeleton panel-skeleton--ui" aria-hidden="true">
      <div className="panel-skeleton__ui-canvas">
        <div className="panel-skeleton__ui-button" />
      </div>
    </div>
  );
}

function AvatarSkeleton() {
  return (
    <div className="panel-skeleton panel-skeleton--avatar" aria-hidden="true">
      <div className="avatar-viewport">
        <div className="avatar-viewport__glow" />
        <svg
          className="avatar-figure"
          viewBox="0 0 200 280"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Avatar preview"
        >
          <ellipse
            className="avatar-figure__shadow"
            cx="100"
            cy="268"
            rx="52"
            ry="8"
            fill="rgba(0, 0, 0, 0.28)"
          />
          <rect
            className="avatar-figure__limb"
            x="68"
            y="188"
            width="28"
            height="72"
            rx="2"
            fill="#3a3a40"
          />
          <rect
            className="avatar-figure__limb"
            x="104"
            y="188"
            width="28"
            height="72"
            rx="2"
            fill="#3a3a40"
          />
          <rect
            className="avatar-figure__limb"
            x="32"
            y="108"
            width="28"
            height="72"
            rx="2"
            fill="#3a3a40"
          />
          <rect
            className="avatar-figure__limb"
            x="140"
            y="108"
            width="28"
            height="72"
            rx="2"
            fill="#3a3a40"
          />
          <rect
            className="avatar-figure__torso"
            x="68"
            y="108"
            width="64"
            height="72"
            rx="2"
            fill="#4a4a50"
          />
          <rect
            className="avatar-figure__head"
            x="72"
            y="32"
            width="56"
            height="56"
            rx="4"
            fill="#5a5a60"
          />
        </svg>
      </div>
    </div>
  );
}

const TIMELINE_TRACKS = [
  { keyframes: [12, 38, 72] },
  { keyframes: [24, 56] },
  { keyframes: [8, 44, 68, 88] },
];

const TIMELINE_TICKS = [0, 25, 50, 75, 100];

function AnimationSkeleton() {
  return (
    <div className="panel-skeleton panel-skeleton--animation" aria-hidden="true">
      <div className="panel-skeleton__timeline-ruler">
        {TIMELINE_TICKS.map((tick) => (
          <span key={tick} className="panel-skeleton__timeline-tick">
            <span className="panel-skeleton__timeline-tick-mark" />
          </span>
        ))}
      </div>
      <div className="panel-skeleton__timeline-body">
        <div className="panel-skeleton__timeline-playhead" style={{ left: '38%' }} />
        {TIMELINE_TRACKS.map((track, trackIndex) => (
          <div key={trackIndex} className="panel-skeleton__timeline-track">
            {track.keyframes.map((position) => (
              <span
                key={position}
                className="panel-skeleton__timeline-keyframe"
                style={{ left: `${position}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const PANEL_SKELETONS: Record<string, () => ReactNode> = {
  toolbox: ToolboxSkeleton,
  'asset-manager': AssetManagerSkeleton,
  place: PlaceSkeleton,
  script: ScriptSkeleton,
  ui: UISkeleton,
  avatar: AvatarSkeleton,
  animation: AnimationSkeleton,
};

export function PanelContent({
  panelId,
  skeletonContent,
}: PanelContentProps) {
  const skeletonEnabled = useSkeletonContentEnabled(skeletonContent);
  const baseId = getBasePanelId(panelId);
  const windowId = usePrimaryWindowIdOptional() ?? INITIAL_WINDOW_ID;
  const scopeTabs = useScopeTabsOptional();
  const scopeTabId = resolveScopeTabId(windowId, scopeTabs, 'project-1');
  const isEmptyPlace =
    baseId === 'place' &&
    scopeTabs &&
    isScopeTabEmptyPlace(scopeTabId, scopeTabs.tabs);
  const placeVariant =
    baseId === 'place' ? getPlaceSkeletonVariant(scopeTabId) : null;
  const Skeleton = PANEL_SKELETONS[baseId] ?? GenericSkeleton;

  if (isEmptyPlace || !skeletonEnabled) {
    return (
      <div className="panel-content">
        <div className="panel-content__body" />
      </div>
    );
  }

  return (
    <div className="panel-content panel-content--skeleton">
      <div className="panel-content__backplate" />
      <div
        className={[
          'panel-content__body',
          'panel-content__body--skeleton',
          `panel-content__body--${baseId}`,
          placeVariant ? `panel-content__body--place-${placeVariant}` : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Skeleton />
      </div>
    </div>
  );
}
