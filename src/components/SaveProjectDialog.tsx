import { DependentWindow } from './dependent/DependentWindow';
import { DialogButtonGroup } from './layout/DialogButtonGroup';
import './SaveProjectDialog.css';

interface SaveProjectDialogProps {
  open: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function SaveProjectDialog({ open, onSave, onClose }: SaveProjectDialogProps) {
  const handleSave = () => {
    onSave();
  };

  return (
    <DependentWindow
      open={open}
      title="Save Project"
      width={480}
      height={560}
      modal
      onClose={onClose}
      footer={
        <DialogButtonGroup
          primaryLabel="Save"
          onPrimary={handleSave}
          onCancel={onClose}
        />
      }
    >
      <div className="save-project-dialog__content" aria-hidden="true" />
    </DependentWindow>
  );
}
