import { useState, type FormEvent } from 'react';
import { FormField } from '../../shared/FormField';
import { useModuleApi } from '../../../hooks/useModuleApi';
import { moduleRegistry } from '../../../core/module-registry';
import { eventBus } from '../../../core/event-bus';
import type { Customer, CreateCustomerInput } from '../../../stores/modules/customers.store';

const initialForm: CreateCustomerInput = { name: '', email: '', phone: '' };

/** 1x1 panel: compact create-customer form. Emits customers.created on success. */
export function NewCustomerPanel() {
  const api = useModuleApi('customers');
  const [form, setForm] = useState<CreateCustomerInput>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField<K extends keyof CreateCustomerInput>(key: K, value: CreateCustomerInput[K]): void {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const customer = await api.create<Customer>(form);
      eventBus.emit('customers.created', { customer });
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex h-full flex-col gap-2 p-3 text-sm">
      <FormField label="Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
      <FormField
        label="Email"
        type="email"
        value={form.email ?? ''}
        onChange={(e) => updateField('email', e.target.value)}
      />
      <FormField label="Phone" value={form.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={isSaving}
        className="mt-auto rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
      >
        {isSaving ? 'Adding...' : 'Add Customer'}
      </button>
    </form>
  );
}

moduleRegistry.registerPanelComponent('NewCustomerPanel', NewCustomerPanel);
