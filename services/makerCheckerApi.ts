import apiClient from "@/services/apiClient";

export interface MakerCheckerGroupCreateRequest {
  name: string;
  type: "booking" | "finance";
  makers: string[]; // user ids
  checkers: string[]; // user ids
  status?: boolean;
  businessId?: string; // super admin only
}

export const createMakerCheckerGroup = async (payload: MakerCheckerGroupCreateRequest) => {
  try {
    const response = await apiClient.post("/maker-checker-group/create-group", payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create maker-checker group:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const getMakerCheckerGroups = async (type: string) => {
  try {
    const response = await apiClient.get(`/maker-checker-group/get-all-groups?type=${type}`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch maker-checker groups:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const getMakerCheckerGroupById = async (id: string) => {
  try {
    const response = await apiClient.get(`/maker-checker-group/get-group/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch maker-checker group:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const updateMakerCheckerGroup = async (id: string, payload: any, callback?: () => void) => {
  try {
    const response = await apiClient.put(`/maker-checker-group/update-group/${id}`, payload);
    callback?.();
    return response.data;
  } catch (error: any) {
    console.error("Failed to update maker-checker group:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const MakerCheckerApi = {
  create: createMakerCheckerGroup,
  list: getMakerCheckerGroups,
  getById: getMakerCheckerGroupById,
  update: updateMakerCheckerGroup,
  delete: deleteMakerCheckerGroup,
};

export default MakerCheckerApi;
