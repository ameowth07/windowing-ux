import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface DialogModalContextValue {
  isDialogModalOpen: boolean;
  registerDialogModal: () => () => void;
}

const DialogModalContext = createContext<DialogModalContextValue | null>(null);

export function DialogModalProvider({ children }: { children: ReactNode }) {
  const [openCount, setOpenCount] = useState(0);

  const registerDialogModal = useCallback(() => {
    setOpenCount((count) => count + 1);
    return () => setOpenCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({
      isDialogModalOpen: openCount > 0,
      registerDialogModal,
    }),
    [openCount, registerDialogModal],
  );

  return (
    <DialogModalContext.Provider value={value}>
      {children}
    </DialogModalContext.Provider>
  );
}

export function useDialogModal() {
  const context = useContext(DialogModalContext);
  if (!context) {
    throw new Error('useDialogModal must be used within DialogModalProvider');
  }
  return context;
}

export function useDialogModalOpen(): boolean {
  return useContext(DialogModalContext)?.isDialogModalOpen ?? false;
}

export function useRegisterDialogModal(open: boolean) {
  const { registerDialogModal } = useDialogModal();

  useEffect(() => {
    if (!open) return;
    return registerDialogModal();
  }, [open, registerDialogModal]);
}
