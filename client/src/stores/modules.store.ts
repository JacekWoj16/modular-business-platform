import { create } from 'zustand';
import { apiRequest } from '../core/api-client';
import { moduleRegistry } from '../core/module-registry';
import type { ModuleDefinition } from '../core/types';

interface ModulesState {
  /** Every module the server knows about — used by the Settings page's enable/disable list. */
  allModules: ModuleDefinition[];
  /**
   * The enabled subset, mirrored here (not just in moduleRegistry) so
   * components can subscribe with the store hook and re-render when it
   * changes. moduleRegistry itself is a plain singleton — reading it
   * directly in a render body doesn't register a React subscription, so
   * anything that needs to react to modules loading must read this instead.
   */
  enabledModules: ModuleDefinition[];
  /** null = show panels from every enabled module; otherwise filter to one. */
  activeModuleId: string | null;
  isLoading: boolean;
  /** Fetches the full catalog, then registers just the enabled subset into moduleRegistry. */
  fetchModules: (enabledModuleIds: string[]) => Promise<void>;
  setActiveModule: (id: string) => void;
}

export const useModulesStore = create<ModulesState>((set) => ({
  allModules: [],
  enabledModules: [],
  activeModuleId: null,
  isLoading: false,

  fetchModules: async (enabledModuleIds) => {
    set({ isLoading: true });
    const all = await apiRequest<ModuleDefinition[]>('/api/modules');
    const enabled = all.filter((module) => enabledModuleIds.includes(module.id));
    moduleRegistry.setModules(enabled);
    set({ allModules: all, enabledModules: enabled, isLoading: false });
  },

  // Clicking the already-active module clears the filter (shows every module again).
  setActiveModule: (id) => set((state) => ({ activeModuleId: state.activeModuleId === id ? null : id })),
}));
