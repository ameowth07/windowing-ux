import type { ReactNode } from 'react';
import { LibraryProviders } from './LibraryProviders';
import type { CanvasBackground, LibraryProvider } from './types';
import './PreviewCanvas.css';

interface PreviewCanvasProps {
  children: ReactNode;
  providers?: LibraryProvider[];
  background: CanvasBackground;
  minHeight?: number;
  showDragHint?: boolean;
  componentName: string;
}

export function PreviewCanvas({
  children,
  providers = [],
  background,
  minHeight = 160,
  showDragHint,
  componentName,
}: PreviewCanvasProps) {
  return (
    <div className="preview-canvas">
      <div className="preview-canvas__toolbar">
        <span className="preview-canvas__label">Preview</span>
        {showDragHint ? (
          <span className="preview-canvas__hint">
            Drag the tab to test drop behavior
          </span>
        ) : null}
      </div>
      <div
        className={`preview-canvas__stage preview-canvas__stage--${background}`}
        style={{ minHeight }}
        data-component={componentName}
      >
        <LibraryProviders providers={providers}>{children}</LibraryProviders>
      </div>
    </div>
  );
}
