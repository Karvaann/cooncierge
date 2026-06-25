"use client";

import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/services/authApi";
import { useAuth } from "@/context/AuthContext";
import type { LoginMode, OtpMessage, OtpPurpose, ResetEmailFlow, SignInErrorState } from "@/app/login/types";
import {
  clearPasswordResetSession,
  setPasswordResetSession,
} from "@/services/storage/passwordResetStorage";
import { useForgotEmailLookup } from "@/app/login/hooks/useForgotEmailLookup";
import { usePasswordChecks } from "@/app/login/hooks/usePasswordChecks";
import {
  emptySignInErrorState,
  getSignInApiFieldErrors,
  hasFieldErrors,
  toSignInErrorState,
  validateSignInFields,
  type SignInFieldErrors,
} from "@/app/login/validation";

const OTP_SECONDS = 30;

export function useLoginFlow() {
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuth();

  const [mode, setMode] = useState<LoginMode>("signin");
  const [otpPurpose, setOtpPurpose] = useState<OtpPurpose>("login");
  const [success, setSuccess] = useState(false);
  const [checked, setChecked] = useState(false);

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [isResetPasswordSubmitting, setIsResetPasswordSubmitting] = useState(false);

  const passwordChecks = usePasswordChecks(newPassword, confirmNewPassword);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [signInError, setSignInError] = useState<SignInErrorState>(emptySignInErrorState());
  const [validationErrorTick, setValidationErrorTick] = useState(0);
  const [otpMessage, setOtpMessage] = useState<OtpMessage | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [timer, setTimer] = useState(OTP_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const resetEmailFlow = useForgotEmailLookup(email, mode === "forgot" && !success);
  const canSubmitForgotReset =
    resetEmailFlow === "otp" || resetEmailFlow === "admin_request";

  useEffect(() => {
    if (!showError) {
      return;
    }

    const timeout = setTimeout(() => setShowError(false), 4000);
    return () => clearTimeout(timeout);
  }, [showError]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/bookings");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (mode !== "otp" || timer <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setCanResend(true);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [mode, timer]);

  const clearSignInErrors = useCallback(() => {
    setSignInError(emptySignInErrorState());
  }, []);

  const bumpValidationError = useCallback(() => {
    setValidationErrorTick((tick) => tick + 1);
  }, []);

  const showSignInError = useCallback((fieldErrors: SignInFieldErrors) => {
    setSignInError(toSignInErrorState(fieldErrors));
    bumpValidationError();
  }, [bumpValidationError]);

  const clearResetPasswordState = useCallback(() => {
    setNewPassword("");
    setConfirmNewPassword("");
    setResetToken(null);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResetPasswordError(null);
    clearPasswordResetSession();
  }, []);

  const goToSignIn = useCallback(() => {
    setMode("signin");
    setOtpPurpose("login");
    setOtpMessage(null);
    clearSignInErrors();
    clearResetPasswordState();
  }, [clearSignInErrors, clearResetPasswordState]);

  const goToForgotPassword = useCallback(() => {
    setMode("forgot");
    setOtpPurpose("forgot");
    setOtp("");
    setOtpMessage(null);
  }, []);

  const handleSignIn = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const fieldErrors = validateSignInFields(email, password);

      if (hasFieldErrors(fieldErrors)) {
        showSignInError(fieldErrors);
        return;
      }

      clearSignInErrors();
      setOtpMessage(null);
      setIsSubmitting(true);

      try {
        await AuthApi.login({ email: email.trim(), password });
        setOtpPurpose("login");
        setOtp("");
        setTimer(OTP_SECONDS);
        setCanResend(false);
        setMode("otp");
      } catch (error: unknown) {
        showSignInError(getSignInApiFieldErrors(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [clearSignInErrors, email, password, showSignInError],
  );

  const clearOtpMessage = useCallback(() => {
    setOtpMessage(null);
  }, []);

  const handleOtpSubmit = useCallback(async () => {
    if (otp.length < 6) {
      setOtpMessage({ text: "Invalid OTP entered", tone: "error" });
      bumpValidationError();
      return;
    }

    setShowError(false);
    setOtpMessage(null);
    setIsOtpSubmitting(true);

    try {
      if (otpPurpose === "forgot") {
        const response = await AuthApi.verifyResetOtp({ email: email.trim(), otp });

        if (response.resetToken && response.email) {
          setPasswordResetSession({
            email: response.email,
            resetToken: response.resetToken,
          });
          setResetToken(response.resetToken);
          setOtp("");
          setMode("reset-password");
          return;
        }
      } else {
        const response = await AuthApi.verifyTwoFa({ email, twoFACode: otp });

        if (response.token) {
          await refreshUser();
          router.replace("/bookings");
        }
      }
    } catch (error: unknown) {
      setOtpMessage({
        text: "Invalid OTP entered",
        tone: "error",
      });
      bumpValidationError();
    } finally {
      setIsOtpSubmitting(false);
    }
  }, [email, otp, otpPurpose, refreshUser, router, bumpValidationError]);

  const handlePasswordResetRequest = useCallback(async () => {
    if (!email) {
      setOtpMessage({ text: "Please enter your email address", tone: "error" });
      bumpValidationError();
      return;
    }

    if (!canSubmitForgotReset) {
      return;
    }

    setOtpMessage(null);
    setIsSubmitting(true);

    try {
      const response = await AuthApi.requestPasswordReset({ email: email.trim() });

      if (response.requiresOtp) {
        setOtpPurpose("forgot");
        setOtp("");
        setTimer(OTP_SECONDS);
        setCanResend(false);
        setMode("otp");
        return;
      }

      setSuccess(true);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || err.message || "Request failed");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, bumpValidationError, canSubmitForgotReset]);

  const handleResendOtp = useCallback(async () => {
    setTimer(OTP_SECONDS);
    setCanResend(false);
    setOtpMessage(null);

    try {
      if (otpPurpose === "forgot") {
        await AuthApi.requestPasswordReset({ email: email.trim() });
        setOtp("");
        setOtpMessage({ text: "A new OTP has been sent.", tone: "info" });
        return;
      }

      if (!email || !password) {
        setOtpMessage({ text: "Please go back and sign in again.", tone: "error" });
        bumpValidationError();
        return;
      }

      await AuthApi.login({ email, password });
      setOtp("");
      setOtpMessage({ text: "A new OTP has been sent.", tone: "info" });
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setOtpMessage({
        text: err.response?.data?.message || err.message || "Failed to resend OTP",
        tone: "error",
      });
      bumpValidationError();
      setCanResend(true);
    }
  }, [email, password, otpPurpose, bumpValidationError]);

  const handleResetPasswordSubmit = useCallback(async () => {
    if (!passwordChecks.canSetNewPassword || isResetPasswordSubmitting || !resetToken) {
      return;
    }

    setResetPasswordError(null);
    setIsResetPasswordSubmitting(true);

    try {
      await AuthApi.resetPassword({
        email: email.trim(),
        newPassword,
        resetToken,
      });

      clearResetPasswordState();
      setMode("signin");
      setOtpPurpose("login");
      setOtpMessage({
        text: "Password reset successfully. Please sign in with your new password.",
        tone: "info",
      });
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setResetPasswordError(
        err.response?.data?.message || err.message || "Failed to reset password. Please try again.",
      );
      bumpValidationError();
    } finally {
      setIsResetPasswordSubmitting(false);
    }
  }, [
    bumpValidationError,
    clearResetPasswordState,
    email,
    isResetPasswordSubmitting,
    newPassword,
    passwordChecks.canSetNewPassword,
    resetToken,
  ]);

  return {
    mode,
    otpPurpose,
    success,
    checked,
    otp,
    email,
    password,
    newPassword,
    confirmNewPassword,
    showPassword,
    showNewPassword,
    showConfirmPassword,
    passwordChecks,
    resetPasswordError,
    isResetPasswordSubmitting,
    showError,
    errorMessage,
    signInError,
    validationErrorTick,
    otpMessage,
    isSubmitting,
    isOtpSubmitting,
    timer,
    canResend,
    resetEmailFlow,
    canSubmitForgotReset,

    setChecked,
    setOtp,
    setEmail,
    setPassword,
    setNewPassword,
    setConfirmNewPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    clearSignInErrors,
    clearOtpMessage,
    setShowPassword,
    setShowError,
    setSuccess,

    goToSignIn,
    goToForgotPassword,
    handleSignIn,
    handleOtpSubmit,
    handlePasswordResetRequest,
    handleResendOtp,
    handleResetPasswordSubmit,
  };
}
