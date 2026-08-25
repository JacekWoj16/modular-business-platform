import type { ModuleDefinition } from '../registry';
import { salesRouter } from './sales.routes';

export const salesModule: ModuleDefinition = {
  id: 'sales',
  name: 'Sales',
  icon: 'shopping-cart',
  description: 'Order management, invoicing, and sales tracking.',
  panels: [
    {
      id: 'sales.orders',
      name: 'Active Orders',
      defaultWidth: 2,
      defaultHeight: 2,
      component: 'OrdersPanel',
    },
    {
      id: 'sales.new-order',
      name: 'New Order',
      defaultWidth: 2,
      defaultHeight: 2,
      component: 'NewOrderPanel',
    },
    {
      id: 'sales.alerts',
      name: 'Sales Alerts',
      defaultWidth: 1,
      defaultHeight: 1,
      component: 'SalesAlertsPanel',
    },
    {
      id: 'sales.order-detail',
      name: 'Order Detail',
      defaultWidth: 2,
      defaultHeight: 2,
      component: 'OrderDetailPanel',
    },
  ],
  // Orders reference customers directly (customer_id FK) — the module needs
  // Customers registered first so its table/routes already exist.
  dependencies: ['customers'],
  routes: '/api/modules/sales',
  router: salesRouter,
};
