import type { RefObject } from 'react';
import { DOCUMENT_MENU_ITEMS } from '../../data/documentPanels';
import type { PanelId } from '../../types/layout';
import { TransientSubmenuPortal } from './TransientMenuPortal';
import '../StudioMenu.css';

interface AddDocumentMenuProps {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  portalRef?: RefObject<HTMLDivElement | null>;
  onAddPanel: (panelId: PanelId) => void;
  onClose: () => void;
}

export function AddDocumentMenu({
  open,
  anchorRef,
  portalRef,
  onAddPanel,
  onClose,
}: AddDocumentMenuProps) {
  return (
    <TransientSubmenuPortal open={open} anchorRef={anchorRef} offsetX={4} portalRef={portalRef}>
      <div className="studio-menu studio-menu--auto" role="menu">
        {DOCUMENT_MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="studio-menu__item"
            onClick={() => {
              onAddPanel(item.id);
              onClose();
            }}
          >
            <span className="studio-menu__item-label">{item.label}</span>
          </button>
        ))}
      </div>
    </TransientSubmenuPortal>
  );
}
