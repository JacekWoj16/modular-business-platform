import type { ComponentType } from 'react';
import type { ModuleDefinition } from './types';

type PanelComponent = ComponentType<{ panelId?: string }>;

/**
 * Client-side mirror of the module/panel catalog, used by the Module
 * Navigator and the Dashboard grid. Two independent pieces of state:
 *
 * - `modules`: fetched from GET /api/modules at bootstrap (which modules
 *   exist, what panels they offer).
 * - `panelComponents`: populated by each panel file itself as a side effect
 *   of being imported, e.g. at the bottom of CustomerListPanel.tsx:
 *     moduleRegistry.registerPanelComponent('CustomerListPanel', CustomerListPanel);
 *   The Dashboard looks up a panel's `component` string here to render it.
 */
class ClientModuleRegistry {
  private modules: ModuleDefinition[] = [];
  private readonly panelComponents = new Map<string, PanelComponent>();

  setModules(modules: ModuleDefinition[]): void {
    this.modules = modules;
  }

  getModules(): ModuleDefinition[] {
    return this.modules;
  }

  getModule(id: string): ModuleDefinition | undefined {
    return this.modules.find((module) => module.id === id);
  }

  registerPanelComponent(name: string, component: PanelComponent): void {
    this.panelComponents.set(name, component);
  }

  getPanelComponent(name: string): PanelComponent | undefined {
    return this.panelComponents.get(name);
  }
}

export const moduleRegistry = new ClientModuleRegistry();
