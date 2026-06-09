import type { RefObject } from 'react';
import { FILE_MENU_ACTIONS } from '../data/studioMenuItems';
import { TransientSubmenuPortal } from './layout/TransientMenuPortal';
import './StudioMenu.css';

interface FileSubmenuProps {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  portalRef?: RefObject<HTMLDivElement | null>;
  onAction: (actionId: string) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

export function FileSubmenu({
  open,
  anchorRef,
  portalRef,
  onAction,
  onPointerEnter,
  onPointerLeave,
}: FileSubmenuProps) {
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
        {FILE_MENU_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            className="studio-menu__item"
            onClick={() => onAction(action.id)}
          >
            <span className="studio-menu__item-label">{action.label}</span>
          </button>
        ))}
      </div>
    </TransientSubmenuPortal>
  );
}
