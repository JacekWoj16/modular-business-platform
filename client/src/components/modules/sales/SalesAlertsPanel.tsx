import { useEffect, useState } from 'react';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { AlertCard } from '../../shared/AlertCard';
import { moduleRegistry } from '../../../core/module-registry';
import type { Order } from '../../../stores/modules/sales.store';

const HIGH_VALUE_THRESHOLD = 5000;
const STALE_HOURS = 24;
const POLL_INTERVAL_MS = 60_000;

interface ListOrdersResponse {
  rows: Order[];
  total: number;
}

function hoursSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

/** 1x1 panel: stale drafts, high-value orders, and recent cancellations. Auto-refreshes. */
export function SalesAlertsPanel() {
  const ordersApi = useModuleApi('sales/orders');
  const [orders, setOrders] = useState<Order[]>([]);

  async function load(): Promise<void> {
    const result = await ordersApi.list<ListOrdersResponse>({ pageSize: 100 });
    setOrders(result.rows);
  }

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEventBus('sales.order-created', () => void load());
  useEventBus('sales.status-changed', () => void load());

  const staleDrafts = orders.filter((o) => o.status === 'draft' && hoursSince(o.createdAt) > STALE_HOURS);
  const highValue = orders.filter(
    (o) => o.status !== 'cancelled' && o.status !== 'completed' && o.totalAmount > HIGH_VALUE_THRESHOLD,
  );
  const recentCancellations = orders.filter(
    (o) => o.status === 'cancelled' && hoursSince(o.updatedAt) <= STALE_HOURS,
  );

  const hasAlerts = staleDrafts.length + highValue.length + recentCancellations.length > 0;

  return (
    <div className="flex h-full flex-col gap-1.5 p-2">
      {hasAlerts ? (
        <>
          <AlertCard label={`Pending > ${STALE_HOURS}h`} count={staleDrafts.length} tone="warning" />
          <AlertCard label={`High value (> ${HIGH_VALUE_THRESHOLD})`} count={highValue.length} tone="info" />
          <AlertCard label="Recent cancellations" count={recentCancellations.length} tone="danger" />
        </>
      ) : (
        <p className="p-2 text-xs text-slate-500">No alerts.</p>
      )}
    </div>
  );
}

moduleRegistry.registerPanelComponent('SalesAlertsPanel', SalesAlertsPanel);
