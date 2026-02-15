import apiClient from "./apiClient";

export type LimitlessServiceStatus = "pending" | "denied" | "draft" | "approved";

export type GetAllLimitlessParams = {
	bookingStartDate?: string;
	bookingEndDate?: string;
	travelStartDate?: string;
	travelEndDate?: string;
	primaryOwner?: string;
	secondaryOwner?: string;
	isDeleted?: boolean;
	serviceStatus?: LimitlessServiceStatus;
};

const base = "/limitless";

const LimitlessApi = {
	async getAll(params?: GetAllLimitlessParams) {
		const { data } = await apiClient.get(`${base}/get-all-limitless`, { params });
		return data;
	},

	async getById(id: string) {
		const { data } = await apiClient.get(`${base}/get-limitless/${id}`);
		return data;
	},

	async getByParty(businessId: string) {
		const { data } = await apiClient.get(
			`${base}/get-limitless-by-party/${businessId}`,
		);
		return data;
	},

	async createLimitless(formData: FormData) {
		const { data } = await apiClient.post(`${base}/create-limitless`, formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return data;
	},

	async updateLimitless(id: string, payload: Record<string, unknown>) {
		const { data } = await apiClient.put(`${base}/update-limitless/${id}`, payload);
		return data;
	},

	async approve(id: string) {
		const { data } = await apiClient.post(`${base}/approve/${id}`);
		return data;
	},

	async deny(id: string) {
		const { data } = await apiClient.post(`${base}/deny/${id}`);
		return data;
	},

	async deleteLimitless(id: string) {
		const { data } = await apiClient.delete(`${base}/delete-limitless/${id}`);
		return data;
	},

	async getHistoryByCustomer(customerId: string, params?: Record<string, unknown>) {
		const { data } = await apiClient.get(`${base}/booking-history/customer/${customerId}`, {
			params,
		});
		return data;
	},

	async getHistoryByTraveller(travellerId: string, params?: Record<string, unknown>) {
		const { data } = await apiClient.get(`${base}/booking-history/traveller/${travellerId}`, {
			params,
		});
		return data;
	},

	async getHistoryByTeamMember(teamMemberId: string, params?: Record<string, unknown>) {
		const { data } = await apiClient.get(
			`${base}/booking-history/team-member/${teamMemberId}`,
			{ params },
		);
		return data;
	},
};

export default LimitlessApi;
