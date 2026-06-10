import { useEffect, type RefObject } from 'react';

export function useDialogInputFocus(
  open: boolean,
  ready: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
) {
  useEffect(() => {
    if (!open || !ready) return;

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, ready, inputRef]);
}
