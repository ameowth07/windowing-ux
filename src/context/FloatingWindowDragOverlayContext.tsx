import { createContext, useContext, type ReactNode } from 'react';

export interface FloatingWindowDragOverlayState {
  floatingWindowId: string;
  screenX: number;
  screenY: number;
}

const FloatingWindowDragOverlayContext =
  createContext<FloatingWindowDragOverlayState | null>(null);

export function FloatingWindowDragOverlayProvider({
  overlay,
  children,
}: {
  overlay: FloatingWindowDragOverlayState | null;
  children: ReactNode;
}) {
  return (
    <FloatingWindowDragOverlayContext.Provider value={overlay}>
      {children}
    </FloatingWindowDragOverlayContext.Provider>
  );
}

export function useFloatingWindowDragOverlay() {
  return useContext(FloatingWindowDragOverlayContext);
}
