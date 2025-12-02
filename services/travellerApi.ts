import apiClient from "@/services/apiClient";

// Create Traveller
export const createTraveller = async (travellerData: any) => {
  try {
    const response = await apiClient.post("/traveller/create-traveller", travellerData);
    return response.data.traveller;
  } catch (error: any) {
    console.error("Failed to create traveller:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Get Travellers (with optional filters)
export const getTravellers = async (params: any = {}) => {
  try {
    const response = await apiClient.get("/traveller/get-all-travellers", { params });
    return response.data.travellers; // backend returns { travellers: [...] }
  } catch (error: any) {
    console.error("Failed to fetch travellers:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Get Single Traveller by ID
export const getTravellerById = async (id: string) => {
  try {
    const response = await apiClient.get(`/traveller/get-traveller/${id}`);
    return response.data.traveller;
  } catch (error: any) {
    console.error("Failed to fetch traveller:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Update Traveller
export const updateTraveller = async (id: string, travellerData: any) => {
  try {
    const response = await apiClient.put(`/traveller/update-traveller/${id}`, travellerData);
    return response.data.traveller;
  } catch (error: any) {
    console.error("Failed to update traveller:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Soft Delete Traveller
export const deleteTraveller = async (id: string) => {
  try {
    const response = await apiClient.put(`/traveller/delete-traveller/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete traveller:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Restore Traveller
export const restoreTraveller = async (id: string) => {
  try {
    const response = await apiClient.put(`/traveller/restore-traveller/${id}`);
    return response.data.traveller;
  } catch (error: any) {
    console.error("Failed to restore traveller:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Get Traveller Booking History
// Returns { quotations, pagination, traveller } in response.data.data
export const getTravellerBookingHistory = async (
  travellerId: string,
  params: any = {}
) => {
  try {
    const response = await apiClient.get(
      `/quotation/booking-history/traveller/${travellerId}`,
      { params }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to fetch traveller booking history:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};



