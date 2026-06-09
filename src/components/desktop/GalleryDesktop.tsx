import type { RefCallback, ReactNode } from 'react';
import './GalleryDesktop.css';

interface GalleryDesktopProps {
  index: number;
  windowsRef: RefCallback<HTMLDivElement>;
  isDropTarget?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
}

export function GalleryDesktop({
  index,
  windowsRef,
  isDropTarget = false,
  footer,
  children,
}: GalleryDesktopProps) {
  return (
    <div
      className={[
        'gallery-desktop',
        isDropTarget ? 'gallery-desktop--drop-target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="gallery-desktop__surface" data-desktop-index={index}>
        <div className="gallery-desktop__wallpaper" aria-hidden="true" />
        <div className="gallery-desktop__icons">
          <button type="button" className="desktop-icon">
            <span className="desktop-icon__glyph desktop-icon__glyph--recycle" />
            <span className="desktop-icon__label">Recycle Bin</span>
          </button>
          <button type="button" className="desktop-icon desktop-icon--selected">
            <span className="desktop-icon__glyph desktop-icon__glyph--studio" />
            <span className="desktop-icon__label">Studio</span>
          </button>
        </div>
        <div
          ref={windowsRef}
          className="gallery-desktop__windows desktop__monitor-windows"
          data-monitor-index={index}
        >
          {children}
        </div>
        <span className="gallery-desktop__label">Desktop {index + 1}</span>
        {footer}
      </div>
    </div>
  );
}
