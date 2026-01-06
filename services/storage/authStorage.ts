import axios from "axios";

const TOKEN_KEY = "token";
const USER_KEY = "user";

const isBrowser = () => typeof window !== "undefined";

export const setAuthToken = (token: string): void => {
  if (isBrowser()) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getAuthToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = (): void => {
  if (isBrowser()) {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const setAuthUser = <T>(user: T): void => {
  if (isBrowser()) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getAuthUser = <T = unknown>(): T | null => {
  if (!isBrowser()) {
    return null;
  }
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
      axios.get("http://localhost:8080/auth/get-current-user", {
        headers: {
          "x-access-token": getAuthToken() || "",
        },
      })
      .then((res) => {
        setAuthUser(res.data.user);
      })
      .catch((err) => {
        console.error("Failed to fetch current user", err);
      });
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    return null;
  }
};

export const clearAuthUser = (): void => {
  if (isBrowser()) {
    localStorage.removeItem(USER_KEY);
  }
};

export const clearAuthStorage = (): void => {
  clearAuthToken();
  clearAuthUser();
};
