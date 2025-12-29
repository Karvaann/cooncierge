import apiClient from "@/services/apiClient";
import {
  clearAuthStorage,
  setAuthToken,
  setAuthUser,
} from "@/services/storage/authStorage";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  refreshToken?: string;
  user?: unknown;
  requiresOtp?: boolean;
  sessionId?: string;
  message?: string;
}

export interface VerifyTwoFaRequest {
  email: string;
  twoFACode: string;
}

export interface VerifyTwoFaResponse {
  token?: string;
  user?: unknown;
  message?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface CreateOrUpdateUserRequest {
  mobile: string;
  email: string;
  roleId: string;
  gender: string;
  phoneCode: number;
  userId?: string;
  businessId?: string;
}

export interface CreateOrUpdateUserResponse {
  success?: boolean;
  message?: string;
  user?: unknown;
  data?: unknown;
}

const AUTH_ROUTES = {
  login: "/auth/login",
  verifyTwoFa: "/auth/verify-2fa",
  requestPasswordReset: "/auth/forgot-password",
  logout: "/auth/logout",
  createOrUpdateUser: "/auth/create-or-update",
} as const;

export const AuthApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(AUTH_ROUTES.login, payload);

    if (data.token) {
      setAuthToken(data.token);
      if (data.user) {
        setAuthUser(data.user);
      }
    }

    return data;
  },

  async verifyTwoFa(payload: VerifyTwoFaRequest): Promise<VerifyTwoFaResponse> {
    const { data } = await apiClient.post<VerifyTwoFaResponse>(
      AUTH_ROUTES.verifyTwoFa,
      payload
    );

    if (data.token) {
      setAuthToken(data.token);
      if (data.user) {
        setAuthUser(data.user);
      }
    }

    return data;
  },

  async requestPasswordReset(payload: PasswordResetRequest): Promise<void> {
    await apiClient.post(AUTH_ROUTES.requestPasswordReset, payload);
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(AUTH_ROUTES.logout);
    } finally {
      clearAuthStorage();
    }
  },

  async createOrUpdateUser(payload: CreateOrUpdateUserRequest): Promise<CreateOrUpdateUserResponse> {
    const { data } = await apiClient.post<CreateOrUpdateUserResponse>(AUTH_ROUTES.createOrUpdateUser, payload);
    return data;
  },
};

export type AuthApiType = typeof AuthApi;
