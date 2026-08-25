import { createContext, useContext } from 'react';

interface PanelContextValue {
  panelId: string;
  moduleId: string;
}

const PanelContext = createContext<PanelContextValue | null>(null);

export const PanelContextProvider = PanelContext.Provider;

/** Exposes the current panel's id and owning module to anything rendered inside a PanelWrapper. */
export function usePanelContext(): PanelContextValue {
  const ctx = useContext(PanelContext);
  if (!ctx) {
    throw new Error('usePanelContext must be used within a PanelWrapper');
  }
  return ctx;
}
