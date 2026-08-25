import { useState } from 'react';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { useEventBus } from '../../../hooks/useEventBus';
import { moduleRegistry } from '../../../core/module-registry';
import { eventBus } from '../../../core/event-bus';
import type { Customer } from '../../../stores/modules/customers.store';

/** 1x2 panel: selected customer's full info, with inline edit mode. */
export function CustomerDetailPanel() {
  const api = useModuleApi('customers');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Customer>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEventBus<{ customerId: number }>('customers.selected', ({ customerId }) => {
    void api.get<Customer>(customerId).then((found) => {
      setCustomer(found);
      setDraft(found);
      setIsEditing(false);
    });
  });

  async function handleSave(): Promise<void> {
    if (!customer) return;
    setIsSaving(true);
    try {
      const updated = await api.update<Customer>(customer.id, draft);
      setCustomer(updated);
      setIsEditing(false);
      eventBus.emit('customers.updated', { customer: updated });
    } finally {
      setIsSaving(false);
    }
  }

  if (!customer) {
    return <p className="p-4 text-sm text-slate-500">Select a customer to see details.</p>;
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{customer.name}</h3>
        <button onClick={() => setIsEditing((v) => !v)} className="text-xs text-blue-600 hover:underline">
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <input
            value={draft.name ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Name"
            className="rounded border border-slate-200 px-2 py-1"
          />
          <input
            value={draft.email ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            placeholder="Email"
            className="rounded border border-slate-200 px-2 py-1"
          />
          <input
            value={draft.phone ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            placeholder="Phone"
            className="rounded border border-slate-200 px-2 py-1"
          />
          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="mt-1 rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-slate-700">
          <dt className="text-slate-500">Email</dt>
          <dd>{customer.email ?? '—'}</dd>
          <dt className="text-slate-500">Phone</dt>
          <dd>{customer.phone ?? '—'}</dd>
          <dt className="text-slate-500">City</dt>
          <dd>{customer.city ?? '—'}</dd>
          <dt className="text-slate-500">Tax ID</dt>
          <dd>{customer.taxId ?? '—'}</dd>
          <dt className="text-slate-500">Type</dt>
          <dd>{customer.customerType === 'business' ? 'Business' : 'Individual'}</dd>
        </dl>
      )}
    </div>
  );
}

moduleRegistry.registerPanelComponent('CustomerDetailPanel', CustomerDetailPanel);
