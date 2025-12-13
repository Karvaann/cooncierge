import axios from "axios";
import { clearAuthStorage, getAuthToken } from "@/services/storage/authStorage";
import {
  finishGlobalLoading,
  startGlobalLoading,
} from "@/utils/loadingManager";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers["x-access-token"] = token;
  }

  const loadingToken = startGlobalLoading("api");
  (config as Record<string, unknown>).__loadingToken = loadingToken;

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const loadingToken = (response.config as Record<string, unknown>)
      ?.__loadingToken as string | undefined;
    finishGlobalLoading(loadingToken);
    return response;
  },
  (error) => {
    const loadingToken = (error.config as Record<string, unknown> | undefined)
      ?.__loadingToken as string | undefined;
    finishGlobalLoading(loadingToken);

    if (error.response?.status === 401) {
      // clearAuthStorage();
      // if (typeof window !== "undefined") {
      //   window.location.href = "/login";
      // }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
