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

  // Create payments
  async createCustomerPayment(customerId: string, payload: CreatePaymentDto | FormData) {
    if (payload instanceof FormData) {
      const { data } = await apiClient.post(`${base}/customers/${customerId}/payments`, payload);
      return data;
    }
    const { data } = await apiClient.post(`${base}/customers/${customerId}/payments`, payload);
    return data;
  },

  async createVendorPayment(vendorId: string, payload: CreatePaymentDto | FormData) {
    if (payload instanceof FormData) {
      const { data } = await apiClient.post(`${base}/vendors/${vendorId}/payments`, payload);
      return data;
    }
    const { data } = await apiClient.post(`${base}/vendors/${vendorId}/payments`, payload);
    return data;
  },

  async createPaymentForQuotation(quotationId: string, payload: CreatePaymentDto | FormData) {
    if (payload instanceof FormData) {
      const { data } = await apiClient.post(`${base}/quotations/${quotationId}/payments`, payload);
      return data;
    }
    const { data } = await apiClient.post(`${base}/quotations/${quotationId}/payments`, payload);
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
};

export default PaymentsApi;
