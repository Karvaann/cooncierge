import apiClient from "@/services/apiClient";

// CREATE Log (Task)
export const createLog = async (logData: any) => {
  try {
    const response = await apiClient.post("/logs/create-log", logData);
    return response.data.log; // backend: { success: true, log }
  } catch (error: any) {
    console.error("Failed to create log:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// UPDATE Log (General update)
export const updateLog = async (id: string, updates: any) => {
  try {
    const response = await apiClient.put(`/logs/update-log/${id}`, updates);
    return response.data.log;
  } catch (error: any) {
    console.error("Failed to update log:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// UPDATE Only Status (Pending → Completed etc.)
export const updateLogStatus = async (id: string, status: string) => {
  try {
    const response = await apiClient.put(`/logs/update-status/${id}`, { status });
    return response.data.log;
  } catch (error: any) {
    console.error("Failed to update log status:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// DELETE Log
export const deleteLog = async (id: string) => {
  try {
    const response = await apiClient.delete(`/logs/delete-log/${id}`);
    return response.data; // { success: true, message: 'Log deleted successfully' }
  } catch (error: any) {
    console.error("Failed to delete log:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET All Logs
export const getAllLogs = async () => {
  try {
    const response = await apiClient.get("/logs/get-all-logs");
    return response.data.logs; // backend sends: { success: true, logs }
  } catch (error: any) {
    console.error("Failed to fetch logs:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET Logs for Dashboard (last 2 + next 2 days)
export const getUserLogsDashboard = async (userId: string) => {
  try {
    const response = await apiClient.get(`/logs/user-dashboard/${userId}`);
    return response.data; // multiple fields returned
  } catch (error: any) {
    console.error("Failed to fetch user dashboard logs:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET Logs By Month (Calendar View)
export const getUserLogsByMonth = async (
  userId: string,
  month: number,
  year: number
) => {
  try {
    const response = await apiClient.get(
      `/logs/monthly-summary/${userId}?month=${month}&year=${year}`
    );

    return response.data; // { logsByDay: {...}, userId, month, year }
  } catch (error: any) {
    console.error("Failed to fetch monthly logs:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};
