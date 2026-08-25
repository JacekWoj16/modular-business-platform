import { useEffect, useState } from 'react';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { moduleRegistry } from '../../../core/module-registry';
import { eventBus } from '../../../core/event-bus';
import type { Product, MovementType, StockMovement } from '../../../stores/modules/inventory.store';

interface ListProductsResponse {
  rows: Product[];
}

const MOVEMENT_TYPES: MovementType[] = ['in', 'out', 'adjustment'];

/** 1x2 panel: record a stock in/out/adjustment. Emits inventory.stock-moved on success. */
export function StockMovementPanel() {
  const productsApi = useModuleApi('inventory/products');
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number | ''>('');
  const [movementType, setMovementType] = useState<MovementType>('in');
  const [quantity, setQuantity] = useState(1);
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void productsApi.list<ListProductsResponse>({ pageSize: 100 }).then((result) => setProducts(result.rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(): Promise<void> {
    if (!productId) {
      setError('Select a product.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await productsApi.action<{ movement: StockMovement; product: Product }>(productId, 'movements', 'POST', {
        movementType,
        quantity,
        reference: reference || undefined,
      });
      eventBus.emit('inventory.stock-moved', { productId, type: movementType, qty: quantity });
      setQuantity(1);
      setReference('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record movement');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-sm">
      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
        className="rounded border border-slate-200 px-2 py-1"
      >
        <option value="">Select product...</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.sku} — {product.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <select
          value={movementType}
          onChange={(e) => setMovementType(e.target.value as MovementType)}
          className="rounded border border-slate-200 px-2 py-1 capitalize"
        >
          {MOVEMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-24 rounded border border-slate-200 px-2 py-1"
        />
      </div>
      {movementType === 'adjustment' ? (
        <p className="text-xs text-slate-500">Adjustment quantity is a signed delta — use a negative number to reduce stock.</p>
      ) : null}

      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="Reference (e.g. order #)"
        className="rounded border border-slate-200 px-2 py-1"
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        onClick={() => void handleSubmit()}
        disabled={isSaving}
        className="mt-auto rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
      >
        {isSaving ? 'Recording...' : 'Record Movement'}
      </button>
    </div>
  );
}

moduleRegistry.registerPanelComponent('StockMovementPanel', StockMovementPanel);
