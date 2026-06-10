import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogInputFocus } from '../hooks/useDialogInputFocus';
import { usePrimaryWindowIdOptional } from '../context/PrimaryWindowContext';
import { DialogButtonGroup } from './layout/DialogButtonGroup';
import './layout/StudioTextInput.css';
import './SaveLayoutDialog.css';

interface SaveLayoutDialogProps {
  open: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

function getPrimaryWindowModalRoot(windowId: string | null): HTMLElement | null {
  if (!windowId) return null;
  const windowEl = document.querySelector<HTMLElement>(
    `.resizable-app-window[data-primary-window-id="${windowId}"]`,
  );
  return windowEl?.parentElement ?? null;
}

export function SaveLayoutDialog({ open, onSave, onClose }: SaveLayoutDialogProps) {
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const windowId = usePrimaryWindowIdOptional();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [name, setName] = useState('');
  const isInPrimaryWindow = portalRoot !== null && portalRoot !== document.body;

  useLayoutEffect(() => {
    if (!open) {
      setPortalRoot(null);
      return;
    }

    setPortalRoot(getPrimaryWindowModalRoot(windowId) ?? document.body);
  }, [open, windowId]);

  useDialogInputFocus(open, portalRoot != null, inputRef);

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

  if (!open || !portalRoot) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  };

  return createPortal(
    <div
      className={`save-layout-dialog ${isInPrimaryWindow ? 'save-layout-dialog--in-window' : ''}`}
      role="presentation"
    >
      <div
        className="save-layout-dialog__backdrop"
        aria-hidden="true"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      />
      <div
        className="save-layout-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
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
