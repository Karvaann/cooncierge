export type LoginMode = "signin" | "otp" | "forgot" | "reset";

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
