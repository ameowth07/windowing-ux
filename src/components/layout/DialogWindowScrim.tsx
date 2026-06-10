import { useDialogModalOpen } from '../../context/DialogModalContext';
import './DialogScrim.css';
import './DialogWindowScrim.css';

export function DialogWindowScrim() {
  const isDialogModalOpen = useDialogModalOpen();

  if (!isDialogModalOpen) return null;

  const stopPointerPropagation = (event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className="dialog-scrim dialog-window-scrim"
      aria-hidden="true"
      onMouseDown={stopPointerPropagation}
      onPointerDown={stopPointerPropagation}
    />
  );
}
