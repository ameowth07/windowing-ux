import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { STUDIO_MENU_CATEGORIES } from '../../data/studioMenuItems';
import { useLayout } from '../../context/LayoutContext';
import type { PanelId } from '../../types/layout';
import { TransientSubmenuPortal } from './TransientMenuPortal';
import '../StudioMenu.css';

interface AddTabMenuProps {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  portalRef?: RefObject<HTMLDivElement | null>;
  nestedPortalRef?: RefObject<HTMLDivElement | null>;
  onAddPanel: (panelId: PanelId) => void;
  onClose: () => void;
  floatingMode?: boolean;
}

export function AddTabMenu({
  open,
  anchorRef,
  portalRef,
  nestedPortalRef,
  onAddPanel,
  onClose,
  floatingMode = false,
}: AddTabMenuProps) {
  const { dockedPanelIds, state } = useLayout();
  const openPanelIds = useMemo(() => {
    const ids = new Set(dockedPanelIds);
    for (const window of state.floating) {
      for (const panelId of window.panels) {
        ids.add(panelId);
      }
    }
    return ids;
  }, [dockedPanelIds, state.floating]);
  const localPortalRef = useRef<HTMLDivElement>(null);
  const localNestedPortalRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = portalRef ?? localPortalRef;
  const categorySubmenuRef = nestedPortalRef ?? localNestedPortalRef;
  const categoryCloseTimerRef = useRef<number | null>(null);
  const categoryItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const activeCategoryAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const clearCategoryCloseTimer = () => {
    if (categoryCloseTimerRef.current !== null) {
      window.clearTimeout(categoryCloseTimerRef.current);
      categoryCloseTimerRef.current = null;
    }
  };

  const isPointerOverCategorySubmenuArea = () => {
    const overAnyCategoryItem = [...categoryItemRefs.current.values()].some(
      (node) => node.matches(':hover'),
    );
    const overCategoryMenu = categoryMenuRef.current?.matches(':hover') ?? false;
    const overCategorySubmenu = categorySubmenuRef.current?.matches(':hover') ?? false;
    return overAnyCategoryItem || overCategoryMenu || overCategorySubmenu;
  };

  const openCategory = (categoryId: string) => {
    clearCategoryCloseTimer();
    activeCategoryAnchorRef.current = categoryItemRefs.current.get(categoryId) ?? null;
    setActiveCategoryId(categoryId);
  };

  const scheduleCategoryClose = () => {
    clearCategoryCloseTimer();
    categoryCloseTimerRef.current = window.setTimeout(() => {
      if (!isPointerOverCategorySubmenuArea()) {
        setActiveCategoryId(null);
      }
      categoryCloseTimerRef.current = null;
    }, 100);
  };

  useEffect(() => {
    if (!open) {
      setActiveCategoryId(null);
      activeCategoryAnchorRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (categoryCloseTimerRef.current !== null) {
        window.clearTimeout(categoryCloseTimerRef.current);
      }
    };
  }, []);

  const activeCategory = STUDIO_MENU_CATEGORIES.find(
    (category) => category.id === activeCategoryId,
  );

  return (
    <>
      <TransientSubmenuPortal
        open={open}
        anchorRef={anchorRef}
        offsetX={4}
        portalRef={categoryMenuRef}
        onPointerEnter={clearCategoryCloseTimer}
        onPointerLeave={scheduleCategoryClose}
      >
        <div className="studio-menu" role="menu">
          {STUDIO_MENU_CATEGORIES.map((category) => (
            <button
              key={category.id}
              ref={(node) => {
                if (node) {
                  categoryItemRefs.current.set(category.id, node);
                } else {
                  categoryItemRefs.current.delete(category.id);
                }
              }}
              type="button"
              role="menuitem"
              className={`studio-menu__item studio-menu__item--submenu ${activeCategoryId === category.id ? 'studio-menu__item--submenu-open' : ''}`}
              aria-haspopup="menu"
              aria-expanded={activeCategoryId === category.id}
              onMouseEnter={() => openCategory(category.id)}
              onFocus={() => openCategory(category.id)}
              onClick={(event) => {
                event.stopPropagation();
                openCategory(category.id);
              }}
            >
              <span className="studio-menu__item-label">{category.label}</span>
              <span className="studio-menu__item-chevron" aria-hidden="true">
                <ChevronRightIcon />
              </span>
            </button>
          ))}
        </div>
      </TransientSubmenuPortal>

      <TransientSubmenuPortal
        open={open && activeCategoryId !== null}
        anchorRef={activeCategoryAnchorRef}
        offsetX={4}
        repositionKey={activeCategoryId}
        portalRef={categorySubmenuRef}
        onPointerEnter={() => {
          clearCategoryCloseTimer();
          if (activeCategoryId) {
            openCategory(activeCategoryId);
          }
        }}
        onPointerLeave={scheduleCategoryClose}
      >
        {activeCategory ? (
          <div className="studio-menu studio-menu--auto" role="menu">
            {activeCategory.items.map((item) => {
              const isChecked = !floatingMode && openPanelIds.has(item.panelId);

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitemcheckbox"
                  className={`studio-menu__item ${isChecked ? 'studio-menu__item--checked' : ''}`}
                  aria-checked={isChecked}
                  aria-disabled={isChecked}
                  onClick={() => {
                    if (isChecked) return;
                    onAddPanel(item.panelId);
                    onClose();
                  }}
                >
                  <span
                    className={`studio-menu__item-leading ${isChecked ? 'studio-menu__item-leading--checked' : ''}`}
                    aria-hidden="true"
                  >
                    {isChecked ? <CheckIcon /> : null}
                  </span>
                  <span className="studio-menu__item-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </TransientSubmenuPortal>
    </>
  );
}

function ChevronRightIcon() {
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

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path
        d="M1.5 5 3.8 7.3 8.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
