import apiClient from "@/services/apiClient";

// CREATE Vendor
export const createVendor = async (vendorData: any) => {
  try {
    const response = await apiClient.post("/vendor/create-vendor", vendorData);
    return response.data.vendor; // <-- backend returns { vendor }
  } catch (error: any) {
    console.error("Failed to create vendor:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET All Vendors
export const getVendors = async () => {
  try {
    const response = await apiClient.get("/vendor/get-all-vendors");
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
