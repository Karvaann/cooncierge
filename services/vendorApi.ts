import apiClient from "@/services/apiClient";

// CREATE Vendor
export const createVendor = async (formData: FormData) => {
  try {
     const response = await apiClient.post(
      "/vendor/create-vendor",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.vendor; // <-- backend returns { vendor }
  } catch (error: any) {
    console.error("Failed to create vendor:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET All Vendors
export const getVendors = async (params: any = {}) => {
  try {
    const response = await apiClient.get("/vendor/get-all-vendors", { params });
    return response.data.vendors; // <-- backend returns { vendors }
  } catch (error: any) {
    console.error("Failed to fetch vendors:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET Vendor by ID
export const getVendorById = async (id: string) => {
  try {
    const response = await apiClient.get(`/vendor/get-vendor/${id}`);
    return response.data.vendor;
  } catch (error: any) {
    console.error("Failed to fetch vendor:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// UPDATE Vendor
export const updateVendor = async (id: string, vendorData: any) => {
  try {
    const response = await apiClient.put(
      `/vendor/update-vendor/${id}`,
      vendorData
    );
    return response.data.vendor;
  } catch (error: any) {
    console.error("Failed to update vendor:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// DELETE Vendor
export const deleteVendor = async (id: string) => {
  try {
    const response = await apiClient.delete(`/vendor/delete-vendor/${id}`);
    return response.data; // backend returns { message: 'Vendor deleted' }
  } catch (error: any) {
    console.error("Failed to delete vendor:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET Vendor Booking History
// Returns { quotations, pagination, vendor } under response.data.data
export const getVendorBookingHistory = async (
  vendorId: string,
  params: any = {}
) => {
  try {
    const response = await apiClient.get(
      `/quotation/booking-history/vendor/${vendorId}`,
      { params }
    );
    return response.data.data;
  } catch (error: any) {
    console.error("Failed to fetch vendor booking history:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};
