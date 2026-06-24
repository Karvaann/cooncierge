export type LoginMode = "signin" | "otp" | "forgot" | "reset-password";
export type OtpPurpose = "login" | "forgot";
export type ResetEmailFlow = "idle" | "checking" | "otp" | "admin_request" | "not_found";

export interface OtpMessage {
  text: string;
  tone: "error" | "info";
}

export interface PasswordChecks {
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  passwordsMatch: boolean;
  canSetNewPassword: boolean;
}

export interface SignInErrorState {
  message: string | null;
  fields: {
    email: boolean;
    password: boolean;
  };
}
