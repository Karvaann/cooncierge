import apiClient from '@/services/apiClient';

export const CustomIdApi = {
  async generate(type: string) {
    const { data } = await apiClient.post('/helper/custom-id', { type });
    return data;
  },
};

export default CustomIdApi;
