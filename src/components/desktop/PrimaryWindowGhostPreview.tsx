import {
  normalizeScopeTabIcon,
  type ScopeTab,
} from '../../context/ScopeTabContext';
import './PrimaryWindowGhostPreview.css';

interface PrimaryWindowGhostPreviewProps {
  tab: ScopeTab;
  x: number;
  y: number;
  width: number;
  height: number;
  fixed?: boolean;
}

export function PrimaryWindowGhostPreview({
  tab,
  x,
  y,
  width,
  height,
  fixed = false,
}: PrimaryWindowGhostPreviewProps) {
  const icon = normalizeScopeTabIcon(tab.icon);

  return (
    <div
      className={[
        'primary-window-ghost',
        fixed ? 'primary-window-ghost--fixed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: x, top: y, width, height }}
      aria-hidden="true"
    >
      <div className="primary-window-ghost__app-bar">
        <div className="primary-window-ghost__left">
          <div className="primary-window-ghost__menu" />
          <div className="primary-window-ghost__tab">
            <span className="primary-window-ghost__tab-icon" aria-hidden="true">
              <ScopeTabIcon icon={icon} />
            </span>
            <span className="primary-window-ghost__tab-label">{tab.label}</span>
          </div>
        </div>
        <div className="primary-window-ghost__window-controls" />
      </div>
      <div className="primary-window-ghost__gutter" />
      <div className="primary-window-ghost__workspace" />
      <div className="primary-window-ghost__gutter" />
      <div className="primary-window-ghost__footer" />
    </div>
  );
}

function ScopeTabIcon({ icon }: { icon: ReturnType<typeof normalizeScopeTabIcon> }) {
  if (icon === 'asset-ui' || icon === 'asset-avatar') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 3.5h8v9H4v-9Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6 6h4M6 8.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
