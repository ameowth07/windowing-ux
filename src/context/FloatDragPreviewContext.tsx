import { createContext, useContext, type ReactNode } from 'react';
import type { FloatDragPreview } from '../components/floating/resolveFloatDropPreview';

const FloatDragPreviewContext = createContext<FloatDragPreview | null>(null);

export function FloatDragPreviewProvider({
  preview,
  children,
}: {
  preview: FloatDragPreview | null;
  children: ReactNode;
}) {
  return (
    <FloatDragPreviewContext.Provider value={preview}>
      {children}
    </FloatDragPreviewContext.Provider>
  );
}

export function useFloatDragPreview() {
  return useContext(FloatDragPreviewContext);
}
