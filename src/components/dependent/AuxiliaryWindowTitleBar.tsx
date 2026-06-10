import type { PointerEventHandler, ReactNode } from 'react';
import './AuxiliaryWindowTitleBar.css';

interface AuxiliaryWindowTitleBarProps {
  title: string;
  onClose: () => void;
  onTitleBarPointerDown?: PointerEventHandler<HTMLDivElement>;
  windowControls?: ReactNode;
}

export function AuxiliaryWindowTitleBar({
  title,
  onClose,
  onTitleBarPointerDown,
  windowControls,
}: AuxiliaryWindowTitleBarProps) {
  return (
    <div
      className="aux-window-title-bar"
      onPointerDown={onTitleBarPointerDown}
    >
      <div className="aux-window-title-bar__title">{title}</div>
      <div
        className="aux-window-title-bar__window-controls"
        onPointerDown={(event) => event.stopPropagation()}
      >
        {windowControls ?? (
          <>
            <button
              type="button"
              className="aux-window-title-bar__window-btn"
              aria-label="Minimize"
            >
              <MinimizeIcon />
            </button>
            <button
              type="button"
              className="aux-window-title-bar__window-btn"
              aria-label="Maximize"
            >
              <MaximizeIcon />
            </button>
            <button
              type="button"
              className="aux-window-title-bar__window-btn aux-window-title-bar__window-btn--close"
              aria-label="Close"
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1 5.5h8" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="7"
        height="7"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
