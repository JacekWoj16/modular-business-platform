import { useState } from 'react';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { moduleRegistry } from '../../../core/module-registry';
import { eventBus } from '../../../core/event-bus';
import type { OrderWithItems, CreateOrderItemInput } from '../../../stores/modules/sales.store';

interface LineItemDraft extends CreateOrderItemInput {
  key: number;
}

let nextKey = 1;
function emptyItem(): LineItemDraft {
  return { key: nextKey++, productName: '', quantity: 1, unitPrice: 0 };
}

/**
 * 2x2 panel: new order form. Pre-fills the customer from `customers.selected`
 * (select a customer in the Customer List panel first), lets you add/remove
 * line items with an auto-calculated total, and emits `sales.order-created`.
 */
export function NewOrderPanel() {
  const ordersApi = useModuleApi('sales/orders');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [items, setItems] = useState<LineItemDraft[]>([emptyItem()]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEventBus<{ customerId: number }>('customers.selected', ({ customerId: id }) => {
    setCustomerId(id);
  });

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  function updateItem(key: number, patch: Partial<CreateOrderItemInput>): void {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addItem(): void {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(key: number): void {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev));
  }

  async function handleSubmit(): Promise<void> {
    if (!customerId) {
      setError('Select a customer first, in the Customer List panel.');
      return;
    }
    if (items.some((item) => !item.productName.trim())) {
      setError('Every line item needs a product name.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const order = await ordersApi.create<OrderWithItems>({
        customerId,
        items: items.map(({ productName, quantity, unitPrice }) => ({ productName, quantity, unitPrice })),
      });
      eventBus.emit('sales.order-created', { order });
      setItems([emptyItem()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-sm">
      <p className="text-xs text-slate-500">
        {customerId ? `Customer #${customerId}` : 'Select a customer in the Customer List panel.'}
      </p>

      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-1">
            <input
              value={item.productName}
              onChange={(e) => updateItem(item.key, { productName: e.target.value })}
              placeholder="Product"
              className="flex-1 rounded border border-slate-200 px-2 py-1"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={item.quantity}
              onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
              className="w-16 rounded border border-slate-200 px-2 py-1"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
              className="w-20 rounded border border-slate-200 px-2 py-1"
            />
            <button
              type="button"
              onClick={() => removeItem(item.key)}
              className="px-1 text-slate-400 hover:text-red-600"
              aria-label="Remove line item"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="self-start text-xs text-blue-600 hover:underline">
          + Add line
        </button>
      </div>

      <p className="mt-auto text-right text-sm font-semibold tabular-nums">Total: {total.toFixed(2)}</p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        onClick={() => void handleSubmit()}
        disabled={isSaving}
        className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
      >
        {isSaving ? 'Creating...' : 'Create Order'}
      </button>
    </div>
  );
}

moduleRegistry.registerPanelComponent('NewOrderPanel', NewOrderPanel);
