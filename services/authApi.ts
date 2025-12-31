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

export interface CreateRoleRequest {
  roleName: string;
  permission: any; // keep flexible shape for permissions
}

export interface CreateRoleResponse {
  success?: boolean;
  message?: string;
  data?: any;
}

const AUTH_ROUTES = {
  login: "/auth/login",
  verifyTwoFa: "/auth/verify-2fa",
  requestPasswordReset: "/auth/forgot-password",
  logout: "/auth/logout",
  createOrUpdateUser: "/auth/create-or-update-user",
  resetPassword: "/auth/reset-password",
  getBusinessRoles: "/auth/business/roles",
  createRole: "/auth/create-new-role",
  getCompanyDetails: "/auth/get-company-details",
  updateCompanyDetails: "/auth/update-company-details",
  uploadCompanyLogo: "/auth/upload-company-logo",
  deleteCompanyLogo: "/auth/delete-company-logo",
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

  async verifyTwoFa(payload: VerifyTwoFaRequest, setMode: React.Dispatch<React.SetStateAction<string>>): Promise<VerifyTwoFaResponse> {
    const { data } = await apiClient.post<VerifyTwoFaResponse>(
      AUTH_ROUTES.verifyTwoFa,
      payload
    );

    if (data.token) {
      setAuthToken(data.token);
      if (data.user?.resetPasswordRequired) {
        setMode("reset");
      } else {
        if (data.user) {
          setAuthUser(data.user);
        }
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

  async resetPassword(payload: { email: string; newPassword: string }): Promise<void> {
    await apiClient.post(AUTH_ROUTES.resetPassword, payload)
      .then(() => {
        console.log("Password reset successful");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Password reset failed:", error);
      });
  },

  async getBusinessRoles(): Promise<{ success?: boolean; output?: any[] }>
  {
    const { data } = await apiClient.get(AUTH_ROUTES.getBusinessRoles);
    return data;
  },

  async getCompanyDetails(): Promise<{ success?: boolean; business?: any }> {
    const { data } = await apiClient.get(AUTH_ROUTES.getCompanyDetails);
    return data;
  },
  async uploadCompanyLogo(file: File): Promise<{ success?: boolean; profileImage?: any }> {
    const formData = new FormData();
    // backend expects field name `profileImage`
    formData.append("profileImage", file);

    const { data } = await apiClient.post(AUTH_ROUTES.uploadCompanyLogo, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
  },

  async deleteCompanyLogo(): Promise<{ success?: boolean; message?: string }> {
    const { data } = await apiClient.delete(AUTH_ROUTES.deleteCompanyLogo);
    return data;
  },
  async updateCompanyDetails(payload: any): Promise<{ success?: boolean; business?: any }> {
    const { data } = await apiClient.patch(AUTH_ROUTES.updateCompanyDetails, payload);
    return data;
  },

  async createRole(payload: CreateRoleRequest): Promise<CreateRoleResponse> {
    const { data } = await apiClient.post<CreateRoleResponse>(AUTH_ROUTES.createRole, payload);
    return data;
    
  },
};

export type AuthApiType = typeof AuthApi;
