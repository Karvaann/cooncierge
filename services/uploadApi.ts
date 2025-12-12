// services/uploadApi.ts
import apiClient from "@/services/apiClient";

export const uploadBulkCustomers = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post("/customer/bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const downloadBulkTemplate = async (format: "csv" | "xlsx") => {
  const res = await apiClient.get(`/customer/bulk-upload-template/${format}`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `customer-bulk-upload-template.${format}`;
  a.click();

  window.URL.revokeObjectURL(url);
};

export const uploadBulkVendors = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post("/vendor/bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const downloadBulkVendorTemplate = async (format: "csv" | "xlsx") => {
  const res = await apiClient.get(`/vendor/bulk-upload-template/${format}`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `vendor-bulk-upload-template.${format}`;
  a.click();

  window.URL.revokeObjectURL(url);
};

export const uploadBulkTeams = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post("/team/bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const downloadBulkTeamTemplate = async (format: "csv" | "xlsx") => {
  const res = await apiClient.get(`/team/bulk-upload-template/${format}`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `team-bulk-upload-template.${format}`;
  a.click();

  window.URL.revokeObjectURL(url);
};
