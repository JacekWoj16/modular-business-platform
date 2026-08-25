import { moduleRegistry } from './registry';
import { customersModule } from './customers/customers.module';
import { salesModule } from './sales/sales.module';
import { inventoryModule } from './inventory/inventory.module';

/**
 * Registers every demo module, in dependency order. Called once by
 * index.ts on server start, and by seed.ts (which also needs the registry
 * populated to compute default panel layouts).
 */
export function registerAllModules(): void {
  moduleRegistry.register(customersModule);
  moduleRegistry.register(salesModule);
  moduleRegistry.register(inventoryModule);
}
