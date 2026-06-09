import type { RefObject } from 'react';
import type { SavedLayout } from '../../types/savedLayout';
import { TransientSubmenuPortal } from './TransientMenuPortal';
import '../StudioMenu.css';

interface OpenLayoutMenuProps {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  portalRef?: RefObject<HTMLDivElement | null>;
  layouts: SavedLayout[];
  onOpenLayout: (layoutId: string) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function OpenLayoutMenu({
  open,
  anchorRef,
  portalRef,
  layouts,
  onOpenLayout,
  onPointerEnter,
  onPointerLeave,
}: OpenLayoutMenuProps) {
  return (
    <TransientSubmenuPortal
      open={open}
      anchorRef={anchorRef}
      offsetX={4}
      portalRef={portalRef}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="studio-menu studio-menu--auto" role="menu">
        {layouts.length === 0 ? (
          <button
            type="button"
            role="menuitem"
            className="studio-menu__item"
            disabled
            aria-disabled="true"
          >
            <span className="studio-menu__item-label">No saved layouts</span>
          </button>
        ) : (
          layouts.map((layout) => (
            <button
              key={layout.id}
              type="button"
              role="menuitem"
              className="studio-menu__item"
              onClick={() => onOpenLayout(layout.id)}
            >
              <span className="studio-menu__item-label">{layout.name}</span>
            </button>
          ))
        )}
      </div>
    </TransientSubmenuPortal>
  );
}
