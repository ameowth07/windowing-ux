import { createContext, useContext, type ReactNode } from 'react';

const PrimaryWindowContext = createContext<string | null>(null);

export function PrimaryWindowProvider({
  windowId,
  children,
}: {
  windowId: string;
  children: ReactNode;
}) {
  return (
    <PrimaryWindowContext.Provider value={windowId}>
      {children}
    </PrimaryWindowContext.Provider>
  );
}

export function usePrimaryWindowId() {
  const context = useContext(PrimaryWindowContext);
  if (!context) {
    throw new Error('usePrimaryWindowId must be used within PrimaryWindowProvider');
  }
  return context;
}

export function usePrimaryWindowIdOptional() {
  return useContext(PrimaryWindowContext);
}
