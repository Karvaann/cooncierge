// services/uploadApi.ts
import apiClient from "@/services/apiClient"; // <-- your axios instance

export const uploadBulkCustomers = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post("/bulk-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const downloadBulkTemplate = async (format: "csv" | "xlsx") => {
  const res = await apiClient.get(`/bulk-upload-template/${format}`, {
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
