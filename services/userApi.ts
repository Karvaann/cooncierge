import apiClient from "@/services/apiClient";

/**
 * Create OR Update User
 * If userId is included → update
 * Otherwise → create
 */
export const createOrUpdateUser = async (userData: any) => {
  try {
    const response = await apiClient.post("/auth/create-or-update", userData);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create/update user:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

/**
 * Get All Users
 */
export const getUsers = async () => {
  try {
    const response = await apiClient.get("/auth/get-all-users");
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

/**
 * Get a Single User by ID
 */
export const getUserById = async (userId: string) => {
  try {
    const response = await apiClient.get(`/auth/get-user/${userId}`);
    return response.data.data; // backend returns { data: user }
  } catch (error: any) {
    console.error("Failed to fetch user:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

/**
 * Delete User
 */
export const deleteUser = async (userId: string) => {
  try {
    const response = await apiClient.delete(`/auth/delete-user/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};
