import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogInputFocus } from '../hooks/useDialogInputFocus';
import { useRegisterBlockingDialog } from '../context/DialogModalContext';
import { useMonitorLayout } from '../context/MonitorLayoutContext';
import { useMonitorWindows } from '../context/MonitorWindowsContext';
import { usePrimaryWindowIdOptional } from '../context/PrimaryWindowContext';
import { usePrimaryWindows } from '../context/PrimaryWindowsContext';
import {
  getDesktopPortalRoot,
  getPrimaryWindowBoundsInContainer,
  type ContainerBounds,
} from '../utils/desktopPortalRoot';
import { DialogButtonGroup } from './layout/DialogButtonGroup';
import './layout/StudioTextInput.css';
import './SaveLayoutDialog.css';

interface SaveLayoutDialogProps {
  open: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

export function SaveLayoutDialog({ open, onSave, onClose }: SaveLayoutDialogProps) {
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const windowId = usePrimaryWindowIdOptional();
  const { getWindow } = usePrimaryWindows();
  const { monitorCount } = useMonitorLayout();
  const { getContainerElement } = useMonitorWindows();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [layerFrame, setLayerFrame] = useState<ContainerBounds | null>(null);
  const [name, setName] = useState('');
  const isOnDesktop = portalRoot !== null && portalRoot !== document.body;

  useLayoutEffect(() => {
    if (!open) {
      setPortalRoot(null);
      setLayerFrame(null);
      return;
    }

    const monitorIndex = windowId ? (getWindow(windowId)?.monitorIndex ?? 0) : 0;
    setPortalRoot(
      getDesktopPortalRoot(monitorIndex, monitorCount, getContainerElement),
    );
  }, [open, windowId, getWindow, getContainerElement, monitorCount]);

  useLayoutEffect(() => {
    if (!open || !portalRoot) {
      setLayerFrame(null);
      return;
    }

    const updateLayerFrame = () => {
      setLayerFrame(getPrimaryWindowBoundsInContainer(windowId, portalRoot));
    };

    updateLayerFrame();
    const raf = requestAnimationFrame(updateLayerFrame);
    window.addEventListener('resize', updateLayerFrame);
    window.addEventListener('scroll', updateLayerFrame, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateLayerFrame);
      window.removeEventListener('scroll', updateLayerFrame, true);
    };
  }, [open, portalRoot, windowId]);

  useDialogInputFocus(open, portalRoot != null, inputRef);
  useRegisterBlockingDialog(open);

  useEffect(() => {
    if (!open) {
      setName('');
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !portalRoot || !layerFrame) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  const stopPointerPropagation = (event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
  };

  return createPortal(
    <div
      className={[
        'save-layout-dialog-layer',
        isOnDesktop ? 'save-layout-dialog-layer--on-desktop' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: layerFrame.left,
        top: layerFrame.top,
        width: layerFrame.width,
        height: layerFrame.height,
      }}
      role="presentation"
      onMouseDown={stopPointerPropagation}
      onPointerDown={stopPointerPropagation}
    >
      <div
        className="save-layout-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
      >
        <button
          type="button"
          className="save-layout-dialog__close"
          aria-label="Close"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <form className="save-layout-dialog__form" onSubmit={handleSubmit}>
          <div className="save-layout-dialog__body">
            <label className="save-layout-dialog__field" htmlFor={labelId}>
              <span className="save-layout-dialog__label">Layout name</span>
              <input
                ref={inputRef}
                id={labelId}
                type="text"
                className="studio-text-input save-layout-dialog__input"
                placeholder="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="save-layout-dialog__actions">
            <DialogButtonGroup
              primaryLabel="Save"
              primaryType="submit"
              onPrimary={() => {}}
              onCancel={onClose}
              primaryDisabled={!name.trim()}
            />
          </div>
        </form>
      </div>
    </div>,
    portalRoot,
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
