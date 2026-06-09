import type { StudioMenuItem } from '../data/studioMenuItems';
import './StudioMenu.css';

interface StudioMenuProps {
  items: StudioMenuItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function StudioMenu({ items, selectedId, onSelect }: StudioMenuProps) {
  return (
    <div className="studio-menu" role="menu">
      {items.map((item) => {
        const selected = item.id === selectedId;

        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className={`studio-menu__item studio-menu__item--submenu ${selected ? 'studio-menu__item--submenu-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={selected ? true : undefined}
            onClick={() => onSelect?.(item.id)}
          >
            <span className="studio-menu__item-label">{item.label}</span>
            <span className="studio-menu__item-chevron" aria-hidden="true">
              <ChevronRight />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6.5 4.5 10 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
