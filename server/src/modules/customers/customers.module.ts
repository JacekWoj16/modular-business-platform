import type { ModuleDefinition } from '../registry';
import { customersRouter } from './customers.routes';

export const customersModule: ModuleDefinition = {
  id: 'customers',
  name: 'Customers',
  icon: 'users',
  description: 'Client and customer records — shared dependency for Sales and Appointments.',
  panels: [
    {
      id: 'customers.list',
      name: 'Customer List',
      defaultWidth: 2,
      defaultHeight: 2,
      component: 'CustomerListPanel',
    },
    {
      id: 'customers.detail',
      name: 'Customer Details',
      defaultWidth: 1,
      defaultHeight: 2,
      component: 'CustomerDetailPanel',
    },
    {
      id: 'customers.new',
      name: 'New Customer',
      defaultWidth: 1,
      defaultHeight: 1,
      component: 'NewCustomerPanel',
    },
  ],
  routes: '/api/modules/customers',
  router: customersRouter,
};
