import './DialogButtonGroup.css';

interface DialogButtonGroupProps {
  primaryLabel: string;
  onPrimary: () => void;
  onCancel: () => void;
  primaryDisabled?: boolean;
  primaryType?: 'button' | 'submit';
}

export function DialogButtonGroup({
  primaryLabel,
  onPrimary,
  onCancel,
  primaryDisabled = false,
  primaryType = 'button',
}: DialogButtonGroupProps) {
  return (
    <div className="dialog-button-group">
      <button
        type={primaryType}
        className="dialog-button-group__btn dialog-button-group__btn--emphasis"
        disabled={primaryDisabled}
        onClick={primaryType === 'button' ? onPrimary : undefined}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        className="dialog-button-group__btn dialog-button-group__btn--standard"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
