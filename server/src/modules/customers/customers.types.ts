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

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export interface ListCustomersParams {
  search?: string;
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

export interface ListCustomersResult {
  rows: Customer[];
  total: number;
  page: number;
  pageSize: number;
}
