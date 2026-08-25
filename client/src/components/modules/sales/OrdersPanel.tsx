import { useEffect, useState } from 'react';
import { DataTable } from '../../shared/DataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { moduleRegistry } from '../../../core/module-registry';
import { useSalesStore, type Order } from '../../../stores/modules/sales.store';

interface ListOrdersResponse {
  rows: Order[];
  total: number;
}

// "Active" per the spec: not completed and not cancelled.
const ACTIVE_STATUSES = new Set(['draft', 'confirmed', 'shipped']);

/** 2x2 panel: active orders table. Refreshes on order creation and status changes. */
export function OrdersPanel() {
  const ordersApi = useModuleApi('sales/orders');
  const { orders, setOrders, selectOrder, selectedOrderId } = useSalesStore();
  const [isLoading, setIsLoading] = useState(false);

  async function load(): Promise<void> {
    setIsLoading(true);
    try {
      const result = await ordersApi.list<ListOrdersResponse>({ pageSize: 100 });
      setOrders(result.rows.filter((order) => ACTIVE_STATUSES.has(order.status)));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEventBus('sales.order-created', () => void load());
  useEventBus('sales.status-changed', () => void load());

  return (
    <div className="flex h-full flex-col overflow-auto">
      {isLoading ? (
        <p className="p-4 text-sm text-slate-500">Loading...</p>
      ) : (
        <DataTable<Order>
          rows={orders}
          selectedId={selectedOrderId}
          onRowClick={(order) => selectOrder(order.id)}
          emptyMessage="No active orders."
          columns={[
            { key: 'orderNumber', header: 'Order #' },
            { key: 'customerName', header: 'Customer' },
            { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
            { key: 'totalAmount', header: 'Total', render: (o) => o.totalAmount.toFixed(2) },
          ]}
        />
      )}
    </div>
  );
}

moduleRegistry.registerPanelComponent('OrdersPanel', OrdersPanel);
