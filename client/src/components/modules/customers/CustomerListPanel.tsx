import { useEffect, useState } from 'react';
import { DataTable } from '../../shared/DataTable';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { moduleRegistry } from '../../../core/module-registry';
import { useCustomersStore, type Customer } from '../../../stores/modules/customers.store';

interface ListCustomersResponse {
  rows: Customer[];
  total: number;
}

/** 2x2 panel: searchable customer table. Click a row to select a customer. */
export function CustomerListPanel() {
  const api = useModuleApi('customers');
  const { customers, setCustomers, selectCustomer, selectedCustomerId } = useCustomersStore();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function load(): Promise<void> {
    setIsLoading(true);
    try {
      const result = await api.list<ListCustomersResponse>({ search: search || undefined });
      setCustomers(result.rows);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // Re-runs whenever the search box changes; `api` is stable per moduleId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Another panel created or edited a customer — refresh the list.
  useEventBus('customers.created', () => void load());
  useEventBus('customers.updated', () => void load());

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Loading...</p>
        ) : (
          <DataTable<Customer>
            rows={customers}
            selectedId={selectedCustomerId}
            onRowClick={(customer) => selectCustomer(customer.id)}
            emptyMessage="No customers yet — add one in the New Customer panel."
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'city', header: 'City' },
              {
                key: 'customerType',
                header: 'Type',
                render: (c) => (c.customerType === 'business' ? 'Business' : 'Individual'),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}

moduleRegistry.registerPanelComponent('CustomerListPanel', CustomerListPanel);
