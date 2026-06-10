import { createContext, useContext, type ReactNode } from 'react';

const FloatingLayoutContext = createContext<string | null>(null);

export function FloatingLayoutProvider({
  floatingWindowId,
  children,
}: {
  floatingWindowId: string;
  children: ReactNode;
}) {
  return (
    <FloatingLayoutContext.Provider value={floatingWindowId}>
      {children}
    </FloatingLayoutContext.Provider>
  );
}

export function useFloatingLayoutWindowId(): string | null {
  return useContext(FloatingLayoutContext);
}
