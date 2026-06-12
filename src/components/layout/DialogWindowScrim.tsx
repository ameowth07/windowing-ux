import { useDialogScrimOpen } from '../../context/DialogModalContext';
import './DialogScrim.css';
import './DialogWindowScrim.css';

type DialogWindowScrimVariant = 'primary' | 'auxiliary';

interface DialogWindowScrimProps {
  variant?: DialogWindowScrimVariant;
}

export function DialogWindowScrim({ variant = 'primary' }: DialogWindowScrimProps) {
  const isDialogScrimOpen = useDialogScrimOpen();

  if (!isDialogScrimOpen) return null;

  const stopPointerPropagation = (event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
  };

  const insetTop =
    variant === 'auxiliary' ? 'var(--aux-title-bar-height)' : 'var(--app-bar-height)';

  return (
    <div
      className="dialog-scrim dialog-window-scrim dialog-window-scrim--below-chrome"
      style={{ ['--dialog-window-scrim-inset-top' as string]: insetTop }}
      aria-hidden="true"
      onMouseDown={stopPointerPropagation}
      onPointerDown={stopPointerPropagation}
    />
  );
}
