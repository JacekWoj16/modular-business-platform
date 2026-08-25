import { create } from 'zustand';
import { apiRequest } from '../core/api-client';
import type { LayoutItem } from '../core/types';

interface LayoutResponse {
  items: LayoutItem[];
}

interface LayoutState {
  items: LayoutItem[];
  isLoading: boolean;
  fetchLayout: () => Promise<void>;
  saveLayout: (items: LayoutItem[]) => Promise<void>;
  toggleVisibility: (panelId: string) => Promise<void>;
  togglePin: (panelId: string) => Promise<void>;
  resetLayout: () => Promise<void>;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchLayout: async () => {
    set({ isLoading: true });
    const result = await apiRequest<LayoutResponse>('/api/layout');
    set({ items: result.items, isLoading: false });
  },

  saveLayout: async (items) => {
    set({ items });
    await apiRequest<void>('/api/layout', { method: 'PUT', body: JSON.stringify({ items }) });
  },

  toggleVisibility: async (panelId) => {
    const items = get().items.map((item) =>
      item.panelId === panelId ? { ...item, isVisible: !item.isVisible } : item,
    );
    await get().saveLayout(items);
  },

  togglePin: async (panelId) => {
    const items = get().items.map((item) =>
      item.panelId === panelId ? { ...item, isPinned: !item.isPinned } : item,
    );
    await get().saveLayout(items);
  },

  resetLayout: async () => {
    const result = await apiRequest<LayoutResponse>('/api/layout/reset', { method: 'POST' });
    set({ items: result.items });
  },
}));
