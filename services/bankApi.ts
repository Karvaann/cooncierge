import apiClient from './apiClient';

export type BankAccountType = 'savings' | 'current';

export interface BankDto {
	_id?: string;
	name: string;
	accountNumber: string;
	ifscCode: string;
	accountType: BankAccountType;
	businessId?: string;
	isDeleted?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

const base = '/bank';

const BankApi = {
	async getBanks(params?: { isDeleted?: boolean }) {
		const { data } = await apiClient.get(`${base}/get-all-banks`, { params });
		return data;
	},

	async getBankById(id: string) {
		const { data } = await apiClient.get(`${base}/get-bank/${id}`);
		return data;
	},

	async createBank(payload: BankDto) {
		const { data } = await apiClient.post(`${base}/create-bank`, payload);
		return data;
	},

	async updateBank(id: string, payload: Partial<BankDto>) {
		const { data } = await apiClient.put(`${base}/update-bank/${id}`, payload);
		return data;
	},

	async deleteBank(id: string) {
		const { data } = await apiClient.delete(`${base}/delete-bank/${id}`);
		return data;
	},
};

export default BankApi;

