import { useEffect, useState } from 'react';
import { DataTable } from '../../shared/DataTable';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { moduleRegistry } from '../../../core/module-registry';
import { useInventoryStore, type Product } from '../../../stores/modules/inventory.store';

interface ListProductsResponse {
  rows: Product[];
  total: number;
}

/** 2x2 panel: all products with stock levels. Low-stock rows highlighted. Search by name/SKU. */
export function ProductListPanel() {
  const productsApi = useModuleApi('inventory/products');
  const { products, setProducts } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function load(): Promise<void> {
    setIsLoading(true);
    try {
      const result = await productsApi.list<ListProductsResponse>({
        search: search || undefined,
        pageSize: 100,
      });
      setProducts(result.rows);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // A recorded movement changed someone's stock level — refresh.
  useEventBus('inventory.stock-moved', () => void load());

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or SKU..."
          className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Loading...</p>
        ) : (
          <DataTable<Product>
            rows={products}
            emptyMessage="No products yet."
            columns={[
              { key: 'sku', header: 'SKU' },
              { key: 'name', header: 'Name' },
              { key: 'category', header: 'Category', render: (p) => p.category ?? '—' },
              {
                key: 'currentStock',
                header: 'Stock',
                render: (p) => (
                  <span className={p.currentStock < p.minStockLevel ? 'font-semibold text-red-600' : ''}>
                    {p.currentStock} {p.unit}
                    {p.currentStock < p.minStockLevel ? ' ⚠' : ''}
                  </span>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}

moduleRegistry.registerPanelComponent('ProductListPanel', ProductListPanel);
