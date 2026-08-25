import { useEffect, useState } from 'react';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { eventBus } from '../../../core/event-bus';
import { moduleRegistry } from '../../../core/module-registry';
import type { Product } from '../../../stores/modules/inventory.store';

interface ListProductsResponse {
  rows: Product[];
}

const POLL_INTERVAL_MS = 60_000;

/**
 * 1x1 panel: products below min_stock_level, with a count badge. The spec's
 * `inventory.low-stock` event is server-driven "via polling" — this panel
 * owns that poll and re-emits the event so any other panel can react to it
 * too, without needing its own fetch.
 */
export function StockAlertsPanel() {
  const productsApi = useModuleApi('inventory/products');
  const [lowStock, setLowStock] = useState<Product[]>([]);

  async function poll(): Promise<void> {
    const result = await productsApi.list<ListProductsResponse>({ lowStock: true, pageSize: 100 });
    setLowStock(result.rows);
    eventBus.emit('inventory.low-stock', { products: result.rows });
  }

  useEffect(() => {
    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A movement elsewhere may have pushed a product below/above the threshold.
  useEventBus('inventory.stock-moved', () => void poll());

  return (
    <div className="flex h-full flex-col gap-1 p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-600">Low stock</span>
        <span
          className={`rounded px-1.5 py-0.5 font-semibold tabular-nums ${
            lowStock.length > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {lowStock.length}
        </span>
      </div>
      <ul className="flex-1 overflow-auto">
        {lowStock.map((product) => (
          <li key={product.id} className="flex justify-between border-t border-slate-100 py-0.5">
            <span>{product.name}</span>
            <span className="tabular-nums text-red-600">
              {product.currentStock}/{product.minStockLevel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

moduleRegistry.registerPanelComponent('StockAlertsPanel', StockAlertsPanel);
