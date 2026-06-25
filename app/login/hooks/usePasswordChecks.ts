"use client";

import { useMemo } from "react";
import type { PasswordChecks } from "@/app/login/types";

export function usePasswordChecks(newPassword: string, confirmNewPassword: string) {
  return useMemo<PasswordChecks>(() => {
    const hasMinLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      passwordsMatch,
      canSetNewPassword:
        hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch,
    };
  }, [newPassword, confirmNewPassword]);
}
