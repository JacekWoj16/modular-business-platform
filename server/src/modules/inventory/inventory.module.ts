import type { ModuleDefinition } from '../registry';
import { inventoryRouter } from './inventory.routes';

export const inventoryModule: ModuleDefinition = {
  id: 'inventory',
  name: 'Inventory',
  icon: 'package',
  description: 'Stock tracking with low-stock alerts.',
  panels: [
    {
      id: 'inventory.products',
      name: 'Product List',
      defaultWidth: 2,
      defaultHeight: 2,
      component: 'ProductListPanel',
    },
    {
      id: 'inventory.alerts',
      name: 'Stock Alerts',
      defaultWidth: 1,
      defaultHeight: 1,
      component: 'StockAlertsPanel',
    },
    {
      id: 'inventory.movement',
      name: 'Stock Movement',
      defaultWidth: 1,
      defaultHeight: 2,
      component: 'StockMovementPanel',
    },
  ],
  // No dependencies — Inventory is fully independent of Customers/Sales.
  routes: '/api/modules/inventory',
  router: inventoryRouter,
};
