import apiClient from './apiClient';

export type PaymentEntryType = 'credit' | 'debit';
export type PaymentStatus = 'pending' | 'approved' | 'denied';

export interface PaymentAllocationDto {
  quotationId: string;
  amount: number;
}

export interface CreatePaymentDto {
  bankId: string;
  amount: number;
  entryType: PaymentEntryType;
  paymentDate?: string | Date;
  status?: PaymentStatus;
  internalNotes?: string;
  allocations?: PaymentAllocationDto[];
  // For quotation-specific payment
  allocationAmount?: number;
  party?: 'customer' | 'vendor';
}

const base = '/payments';

export const PaymentsApi = {
  // Closing balances
  async listCustomerClosingBalances() {
    const { data } = await apiClient.get(`${base}/customers/closing-balance`);
    return data;
  },

  async listVendorClosingBalances() {
    const { data } = await apiClient.get(`${base}/vendors/closing-balance`);
    return data;
  },

  // Ledgers
  async getCustomerLedger(customerId: string) {
    const { data } = await apiClient.get(`${base}/customers/${customerId}/ledger`);
    return data;
  },

  async getVendorLedger(vendorId: string) {
    const { data } = await apiClient.get(`${base}/vendors/${vendorId}/ledger`);
    return data;
  },

  async getQuotationLedger(quotationId: string) {
    const { data } = await apiClient.get(`${base}/quotations/${quotationId}/ledger`);
    return data;
  },

  // Unsettled quotations
  async getCustomerUnsettledQuotations(customerId: string) {
    const { data } = await apiClient.get(`${base}/customers/${customerId}/unsettled-quotations`);
    return data;
  },

  async getVendorUnsettledQuotations(vendorId: string) {
    const { data } = await apiClient.get(`${base}/vendors/${vendorId}/unsettled-quotations`);
    return data;
  },

  async getCustomerUnallocatedPayments(customerId: string) {
    const { data } = await apiClient.get(`${base}/customers/${customerId}/unallocated-payments`);
    return data;
  },

  async getVendorUnallocatedPayments(vendorId: string) {
    const { data } = await apiClient.get(`${base}/vendors/${vendorId}/unallocated-payments`);
    return data;
  },

  // Create payments
  async createCustomerPayment(customerId: string, payload: FormData) {
    const { data } = await apiClient.post(`${base}/customers/${customerId}/payments`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    return data;
  },

  async createVendorPayment(vendorId: string, payload: FormData) {
    const { data } = await apiClient.post(`${base}/vendors/${vendorId}/payments`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    return data;
  },

  async createPaymentForQuotation(quotationId: string, payload: FormData) {
    const { data } = await apiClient.post(`${base}/quotations/${quotationId}/payments`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    return data;
  },

  async allocateCustomerPaymentToQuotation(paymentId: string, payload: { quotationId: string; amount: number }) {
    const { data } = await apiClient.post(`${base}/customers/payments/${paymentId}/allocate`, payload);
    return data;
  },

  async allocateVendorPaymentToQuotation(paymentId: string, payload: { quotationId: string; amount: number }) {
    const { data } = await apiClient.post(`${base}/vendors/payments/${paymentId}/allocate`, payload);
    return data;
  },
  // List payments with optional filters
  async listPayments(params?: {
    party?: 'customer' | 'vendor';
    partyId?: string;
    status?: 'pending' | 'approved' | 'denied';
    isDeleted?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const { data } = await apiClient.get(`${base}`, { params });
    return data;
  },


  // Update payment
async updatePayment(paymentId: string, payload: FormData | Partial<{
  bankId: string;
  amount: number;
  entryType: 'credit' | 'debit';
  paymentDate: string | Date;
  status: 'pending' | 'approved' | 'denied';
  internalNotes: string;
  allocations: Array<{ quotationId: string; amount: number }>;
}>) {
  const { data } = await apiClient.patch(
    `${base}/payments/${paymentId}`,
    payload,
    payload instanceof FormData
      ? {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      : undefined
  );
  return data;
},

// Delete payment (soft delete)
async deletePayment(paymentId: string) {
  const { data } = await apiClient.delete(`${base}/payments/${paymentId}`);
  return data;
},

};

export default PaymentsApi;
