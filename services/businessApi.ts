import apiClient from './apiClient';

const BASE = '/business';

export const BusinessApi = {
	async update(businessId: string, payload: any) {
		const { data } = await apiClient.put(`${BASE}/${businessId}`, payload);
		return data;
	},

	async get(businessId: string) {
		const { data } = await apiClient.get(`${BASE}/${businessId}`);
		return data;
	},
};

export default BusinessApi;

