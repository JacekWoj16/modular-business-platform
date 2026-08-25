import type { Router } from 'express';

/**
 * A single dashboard panel provided by a module.
 */
export interface PanelDefinition {
  id: string; // e.g. 'sales.orders' — must be unique across all modules
  name: string;
  defaultWidth: number; // grid columns
  defaultHeight: number; // grid rows
  component: string; // React component name, resolved by the client panel registry
}

/**
 * The declaration a module makes to plug itself into the platform: which
 * panels it provides, which API base path it owns, and which other modules
 * it depends on. Registering a module never gives it access to another
 * module's internals — modules only ever talk to each other through the
 * event bus.
 */
export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  panels: PanelDefinition[];
  dependencies?: string[];
  routes: string; // e.g. '/api/modules/sales'
  router?: Router; // mounted at `routes` by index.ts once the module defines it
}

/**
 * In-memory registry of enabled modules. Modules call register() once, at
 * startup, from their own `<name>.module.ts` file. Registration order
 * matters: a module's dependencies must already be registered.
 */
class ModuleRegistry {
  private readonly modules = new Map<string, ModuleDefinition>();

  register(module: ModuleDefinition): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module "${module.id}" is already registered.`);
    }

    for (const dependencyId of module.dependencies ?? []) {
      if (!this.modules.has(dependencyId)) {
        throw new Error(
          `Module "${module.id}" depends on "${dependencyId}", which is not registered yet. ` +
            'Register dependencies before the modules that need them.',
        );
      }
    }

    this.modules.set(module.id, module);
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  list(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }
}

export const moduleRegistry = new ModuleRegistry();
