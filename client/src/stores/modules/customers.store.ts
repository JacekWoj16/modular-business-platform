import { create } from 'zustand';
import { eventBus } from '../../core/event-bus';

export type CustomerType = 'individual' | 'business';

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  taxId: string | null;
  customerType: CustomerType;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  taxId?: string;
  customerType?: CustomerType;
  notes?: string;
}

interface CustomersState {
  customers: Customer[];
  selectedCustomerId: number | null;
  setCustomers: (customers: Customer[]) => void;
  /** Sets the selection and emits `customers.selected` for other panels. */
  selectCustomer: (id: number) => void;
}

export const useCustomersStore = create<CustomersState>((set) => ({
  customers: [],
  selectedCustomerId: null,
  setCustomers: (customers) => set({ customers }),
  selectCustomer: (id) => {
    set({ selectedCustomerId: id });
    eventBus.emit('customers.selected', { customerId: id });
  },
}));
