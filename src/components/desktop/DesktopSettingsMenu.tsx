import { useEffect, useRef, useState } from 'react';
import {
  AUXILIARY_WINDOW_SIZE_PANEL_ORDER,
} from '../../config/auxiliaryWindowSizes';
import {
  EDGE_DROP_ZONE_DELAY_PRESETS,
} from '../../config/edgeDropZones';
import {
  WINDOW_SIZE_PRESET_ORDER,
  WINDOW_SIZE_PRESETS,
} from '../../config/windowSizes';
import { getPanelDefinition } from '../../data/panels';
import {
  MONITOR_COUNT_LABELS,
  MONITOR_COUNT_OPTIONS,
} from '../../config/monitorLayout';
import { useMonitorLayout } from '../../context/MonitorLayoutContext';
import { useAppWindow } from '../../context/AppWindowContext';
import { useAuxiliaryWindowSize } from '../../context/AuxiliaryWindowSizeContext';
import { useEdgeDropZoneDelay } from '../../context/EdgeDropZoneDelayContext';
import { useProjectTabBar } from '../../context/ProjectTabBarContext';
import { useSkeletonContent } from '../../context/SkeletonContentContext';
import { useEnforceDocumentRegion } from '../../context/EnforceDocumentRegionContext';
import { useFloatingPanelDocking } from '../../context/FloatingPanelDockingContext';
import { useStudio2026 } from '../../context/Studio2026Context';
import type { PanelId } from '../../types/layout';
import './DesktopSettingsMenu.css';

export function DesktopSettingsMenu() {
  const { sizePreset, setSizePreset } = useAppWindow();
  const { enabled, setEnabled, delayMs, setDelayMs } = useEdgeDropZoneDelay();
  const { enabled: projectTabBar, setEnabled: setProjectTabBar } = useProjectTabBar();
  const { enabled: skeletonContent, setEnabled: setSkeletonContent } =
    useSkeletonContent();
  const { enabled: enforceDocumentRegion, setEnabled: setEnforceDocumentRegion } =
    useEnforceDocumentRegion();
  const { enabled: floatingPanelDocking, setEnabled: setFloatingPanelDocking } =
    useFloatingPanelDocking();
  const { enabled: studio2026, setEnabled: setStudio2026 } = useStudio2026();
  const { getSize, setSize } = useAuxiliaryWindowSize();
  const { monitorCount, setMonitorCount } = useMonitorLayout();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="desktop-settings">
      <button
        type="button"
        className="desktop-settings__trigger"
        aria-label="Desktop settings"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <SettingsIcon />
      </button>
      {open ? (
        <div className="desktop-settings__menu" role="menu">
          <label className="desktop-settings__toggle">
            <input
              type="checkbox"
              checked={studio2026}
              onChange={(event) => setStudio2026(event.target.checked)}
            />
            <span>Use current Studio 2026</span>
          </label>
          <div className="desktop-settings__divider" />
          <div className="desktop-settings__heading">App window size</div>
          {WINDOW_SIZE_PRESET_ORDER.map((preset) => {
            const { label, width, height } = WINDOW_SIZE_PRESETS[preset];
            const active = preset === sizePreset;

            return (
              <button
                key={preset}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`desktop-settings__option ${active ? 'desktop-settings__option--active' : ''}`}
                onClick={() => {
                  setSizePreset(preset);
                  setOpen(false);
                }}
              >
                <span className="desktop-settings__option-label">{label}</span>
                <span className="desktop-settings__option-size">
                  {width} × {height}
                </span>
              </button>
            );
          })}
          <div className="desktop-settings__divider" />
          <div className="desktop-settings__heading">Auxiliary window size</div>
          <div
            className="desktop-settings__aux-sizes"
            role="group"
            aria-label="Auxiliary window size per panel"
          >
            {AUXILIARY_WINDOW_SIZE_PANEL_ORDER.map((panelId) => (
              <AuxiliaryWindowSizeRow
                key={panelId}
                panelId={panelId}
                size={getSize(panelId)}
                onChange={setSize}
              />
            ))}
          </div>
          <div className="desktop-settings__divider" />
          <div className="desktop-settings__heading">Desktop environments</div>
          {MONITOR_COUNT_OPTIONS.map((count) => {
            const active = count === monitorCount;

            return (
              <button
                key={count}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`desktop-settings__option ${active ? 'desktop-settings__option--active' : ''}`}
                onClick={() => setMonitorCount(count)}
              >
                <span className="desktop-settings__option-label">
                  {MONITOR_COUNT_LABELS[count]}
                </span>
              </button>
            );
          })}
          <div className="desktop-settings__divider" />
          <div className="desktop-settings__heading">App bar</div>
          <label className="desktop-settings__toggle">
            <input
              type="checkbox"
              checked={projectTabBar}
              onChange={(event) => setProjectTabBar(event.target.checked)}
            />
            <span>ProjectTabBar</span>
          </label>
          <div className="desktop-settings__divider" />
          <div className="desktop-settings__heading">Panels</div>
          <label className="desktop-settings__toggle">
            <input
              type="checkbox"
              checked={skeletonContent}
              onChange={(event) => setSkeletonContent(event.target.checked)}
            />
            <span>Skeleton content</span>
          </label>
          <label className="desktop-settings__toggle">
            <input
              type="checkbox"
              checked={enforceDocumentRegion}
              onChange={(event) => setEnforceDocumentRegion(event.target.checked)}
            />
            <span>Enforce document region</span>
          </label>
          <label className="desktop-settings__toggle">
            <input
              type="checkbox"
              checked={floatingPanelDocking}
              onChange={(event) => setFloatingPanelDocking(event.target.checked)}
            />
            <span>Docking in floating panels</span>
          </label>
          <div className="desktop-settings__divider" />
          <div className="desktop-settings__heading">Edge drop zones</div>
          <label className="desktop-settings__toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            <span>Activation delay</span>
          </label>
          {enabled ? (
            <div className="desktop-settings__delay-options" role="group" aria-label="Edge drop zone delay">
              {EDGE_DROP_ZONE_DELAY_PRESETS.map((preset) => {
                const active = preset === delayMs;
                return (
                  <button
                    key={preset}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    className={`desktop-settings__option ${active ? 'desktop-settings__option--active' : ''}`}
                    onClick={() => setDelayMs(preset)}
                  >
                    <span className="desktop-settings__option-label">{preset} ms</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface AuxiliaryWindowSizeRowProps {
  panelId: PanelId;
  size: { width: number; height: number };
  onChange: (panelId: PanelId, size: { width: number; height: number }) => void;
}

function AuxiliaryWindowSizeRow({
  panelId,
  size,
  onChange,
}: AuxiliaryWindowSizeRowProps) {
  const title = getPanelDefinition(panelId)?.title ?? panelId;
  const [widthDraft, setWidthDraft] = useState(String(size.width));
  const [heightDraft, setHeightDraft] = useState(String(size.height));
  const focusedFieldRef = useRef<'width' | 'height' | null>(null);

  useEffect(() => {
    if (focusedFieldRef.current !== 'width') {
      setWidthDraft(String(size.width));
    }
    if (focusedFieldRef.current !== 'height') {
      setHeightDraft(String(size.height));
    }
  }, [size.width, size.height]);

  const commitDimension = (dimension: 'width' | 'height') => {
    const raw = dimension === 'width' ? widthDraft : heightDraft;
    const parsed = Number(raw);

    if (raw.trim() === '' || !Number.isFinite(parsed)) {
      if (dimension === 'width') {
        setWidthDraft(String(size.width));
      } else {
        setHeightDraft(String(size.height));
      }
      return;
    }

    onChange(panelId, { ...size, [dimension]: parsed });
  };

  return (
    <div className="desktop-settings__aux-row">
      <span className="desktop-settings__aux-label">{title}</span>
      <div className="desktop-settings__aux-inputs">
        <label className="desktop-settings__aux-input">
          <span className="desktop-settings__aux-input-caption">W</span>
          <input
            type="text"
            inputMode="numeric"
            value={widthDraft}
            onFocus={() => {
              focusedFieldRef.current = 'width';
            }}
            onBlur={() => {
              focusedFieldRef.current = null;
              commitDimension('width');
            }}
            onChange={(event) => setWidthDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
            aria-label={`${title} auxiliary window width`}
          />
        </label>
        <span className="desktop-settings__aux-separator" aria-hidden="true">
          ×
        </span>
        <label className="desktop-settings__aux-input">
          <span className="desktop-settings__aux-input-caption">H</span>
          <input
            type="text"
            inputMode="numeric"
            value={heightDraft}
            onFocus={() => {
              focusedFieldRef.current = 'height';
            }}
            onBlur={() => {
              focusedFieldRef.current = null;
              commitDimension('height');
            }}
            onChange={(event) => setHeightDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
            aria-label={`${title} auxiliary window height`}
          />
        </label>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="desktop-settings__icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.65-.07-.97l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a7.03 7.03 0 0 0-1.68-.97l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.49.42l-.38 2.65a7.03 7.03 0 0 0-1.68.97l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.97 0 .32.03.65.07.97l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .6.22l2.49-1c.52.4 1.08.73 1.68.97l.38 2.65a.5.5 0 0 0 .49.42h4a.5.5 0 0 0 .49-.42l.38-2.65c.6-.24 1.16-.57 1.68-.97l2.49 1a.5.5 0 0 0 .6-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65z" />
    </svg>
  );
}
