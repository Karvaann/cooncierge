import apiClient from "@/services/apiClient"; 

export const createCustomer = async (formData: FormData) => {
  try {
    const response = await apiClient.post(
      "/customer/create-customer",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to create customer:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const getCustomers = async (params: any = {}) => {
  try {
    const response = await apiClient.get("/customer/get-all-customers", { params });
    return response.data.customers;
  } catch (error: any) {
    console.error("Failed to fetch customers:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    const response = await apiClient.delete(`/customer/delete-customer/${id}`);
    return response.data; // backend sends { message: 'Customer deleted' }
  } catch (error: any) {
    console.error("Failed to delete customer:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const updateCustomer = async (id: string, customerData: any) => {
  try {
    const response = await apiClient.put(`/customer/update-customer/${id}`, customerData);    
    return response.data.customer;
  } catch (error: any) {
    console.error("Failed to update customer:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET Customer by ID
export const getCustomerById = async (id: string) => {
  try {
    const response = await apiClient.get(`/customer/get-customer/${id}`);
    return response.data.customer;
  } catch (error: any) {
    console.error("Failed to fetch customer:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// GET Booking History of a Customer
export const getBookingHistoryByCustomer = async (
  customerId: string,
  params: any = {}
) => {
  try {
    const response = await apiClient.get(
      `/quotation/booking-history/customer/${customerId}`,
      { params }
    );

    return response.data.data; // contains: quotations, pagination, customer
  } catch (error: any) {
    console.error("Failed to fetch booking history:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};


