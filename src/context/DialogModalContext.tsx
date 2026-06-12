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
  isDialogScrimOpen: boolean;
  isDialogInteractionLocked: boolean;
  registerDialogScrim: () => () => void;
  registerDialogInteractionLock: () => () => void;
}

const DialogModalContext = createContext<DialogModalContextValue | null>(null);

export function DialogModalProvider({ children }: { children: ReactNode }) {
  const [scrimOpenCount, setScrimOpenCount] = useState(0);
  const [interactionLockCount, setInteractionLockCount] = useState(0);

  const registerDialogScrim = useCallback(() => {
    setScrimOpenCount((count) => count + 1);
    return () => setScrimOpenCount((count) => Math.max(0, count - 1));
  }, []);

  const registerDialogInteractionLock = useCallback(() => {
    setInteractionLockCount((count) => count + 1);
    return () => setInteractionLockCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({
      isDialogScrimOpen: scrimOpenCount > 0,
      isDialogInteractionLocked: interactionLockCount > 0,
      registerDialogScrim,
      registerDialogInteractionLock,
    }),
    [
      scrimOpenCount,
      interactionLockCount,
      registerDialogScrim,
      registerDialogInteractionLock,
    ],
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

export function useDialogScrimOpen(): boolean {
  return useContext(DialogModalContext)?.isDialogScrimOpen ?? false;
}

export function useDialogInteractionLocked(): boolean {
  return useContext(DialogModalContext)?.isDialogInteractionLocked ?? false;
}

/** @deprecated Use useDialogInteractionLocked instead. */
export function useDialogModalOpen(): boolean {
  return useDialogInteractionLocked();
}

function useRegisterDialog(open: boolean, register: () => () => void) {
  useEffect(() => {
    if (!open) return;
    return register();
  }, [open, register]);
}

export function useRegisterDialogScrim(open: boolean) {
  const { registerDialogScrim } = useDialogModal();
  useRegisterDialog(open, registerDialogScrim);
}

export function useRegisterDialogInteractionLock(open: boolean) {
  const { registerDialogInteractionLock } = useDialogModal();
  useRegisterDialog(open, registerDialogInteractionLock);
}

export function useRegisterBlockingDialog(open: boolean) {
  useRegisterDialogScrim(open);
  useRegisterDialogInteractionLock(open);
}
