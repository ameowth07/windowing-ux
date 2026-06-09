import { useEffect, useRef, useState } from 'react';
import { getPanelDefinition } from '../../data/panels';
import type { PanelId } from '../../types/layout';
import { TransientMenuPortal } from './TransientMenuPortal';
import '../StudioMenu.css';
import './TabBarOverflowMenu.css';
import './TransientMenuPortal.css';

interface TabBarOverflowMenuProps {
  overflowPanelIds: PanelId[];
  activeTabId: PanelId;
  onSelect: (panelId: PanelId) => void;
}

export function TabBarOverflowMenu({
  overflowPanelIds,
  activeTabId,
  onSelect,
}: TabBarOverflowMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (overflowPanelIds.length === 0) return null;

  return (
    <div className="tab-bar-overflow">
      <button
        ref={triggerRef}
        type="button"
        className={`tab-bar-overflow__btn ${open ? 'tab-bar-overflow__btn--open' : ''}`}
        aria-label={`${overflowPanelIds.length} more tabs`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="More tabs"
        onClick={() => setOpen((value) => !value)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <TabBarOverflowIcon />
      </button>
      <TransientMenuPortal
        open={open}
        anchorRef={triggerRef}
        align="end"
        onClose={() => setOpen(false)}
      >
        <div className="studio-menu studio-menu--auto" role="menu">
          {overflowPanelIds.map((panelId) => {
            const title = getPanelDefinition(panelId)?.title ?? panelId;
            const active = panelId === activeTabId;
            return (
              <button
                key={panelId}
                type="button"
                role="menuitem"
                className={`studio-menu__item ${active ? 'studio-menu__item--selected' : ''}`}
                onClick={() => {
                  onSelect(panelId);
                  setOpen(false);
                }}
              >
                <span className="studio-menu__item-label">{title}</span>
              </button>
            );
          })}
        </div>
      </TransientMenuPortal>
    </div>
  );
}

export function TabBarOverflowIndicator() {
  return (
    <div className="tab-bar-overflow">
      <span className="tab-bar-overflow__btn" aria-hidden="true">
        <TabBarOverflowIcon />
      </span>
    </div>
  );
}

function TabBarOverflowIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <circle cx="5" cy="2" r="1" fill="currentColor" />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
      <circle cx="5" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
