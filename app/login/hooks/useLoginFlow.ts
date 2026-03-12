"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/services/authApi";
import { useAuth } from "@/context/AuthContext";
import type { LoginMode, OtpMessage, PasswordChecks } from "@/app/login/types";

const DEFAULT_ERROR_MESSAGE = "Invalid Email or Password, please retry.";
const OTP_SECONDS = 30;

export function useLoginFlow() {
  const router = useRouter();
  const { isAuthenticated, refreshUser } = useAuth();

  const [mode, setMode] = useState<LoginMode>("signin");
  const [success, setSuccess] = useState(false);
  const [checked, setChecked] = useState(false);

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE);
  const [otpMessage, setOtpMessage] = useState<OtpMessage | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [timer, setTimer] = useState(OTP_SECONDS);
  const [canResend, setCanResend] = useState(false);

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

  const passwordChecks = useMemo<PasswordChecks>(() => {
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

  const goToSignIn = useCallback(() => {
    setMode("signin");
    setOtpMessage(null);
  }, []);

  const goToForgotPassword = useCallback(() => {
    setMode("forgot");
    setOtpMessage(null);
  }, []);

  const goToResetMode = useCallback(() => {
    setMode("reset");
    setOtpMessage(null);
  }, []);

  const handleSignIn = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!email || !password) {
        setErrorMessage(DEFAULT_ERROR_MESSAGE);
        setShowError(true);
        return;
      }

      setShowError(false);
      setOtpMessage(null);
      setIsSubmitting(true);

      try {
        await AuthApi.login({ email, password });
        setOtp("");
        setTimer(OTP_SECONDS);
        setCanResend(false);
        setMode("otp");
      } catch (error: unknown) {
        const err = error as AxiosError<{ message?: string }>;
        setErrorMessage(err.response?.data?.message || err.message || "Login failed");
        setShowError(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password],
  );

  const handleOtpSubmit = useCallback(async () => {
    if (otp.length < 6) {
      setErrorMessage("Invalid OTP, please retry.");
      setShowError(true);
      return;
    }

    setShowError(false);
    setOtpMessage(null);
    setIsOtpSubmitting(true);

    try {
      const response = await AuthApi.verifyTwoFa(
        { email, twoFACode: otp },
        setMode,
      );

      if (response.token && !response.user?.resetPasswordRequired) {
        await refreshUser();
        router.replace("/bookings/other-services");
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setOtpMessage({
        text: err.response?.data?.message || err.message || "Invalid OTP",
        tone: "error",
      });
    } finally {
      setIsOtpSubmitting(false);
    }
  }, [email, otp, refreshUser, router]);

  const handlePasswordResetRequest = useCallback(async () => {
    if (!email) {
      setOtpMessage({ text: "Please enter your email address", tone: "error" });
      return;
    }

    setOtpMessage(null);
    setIsSubmitting(true);

    try {
      await AuthApi.requestPasswordReset({ email });
      setSuccess(true);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || err.message || "Request failed");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  const handleSetNewPassword = useCallback(async () => {
    if (!passwordChecks.canSetNewPassword) {
      return;
    }

    setIsSubmitting(true);
    setOtpMessage(null);

    try {
      await AuthApi.resetPassword({ email, newPassword });
      setMode("signin");
      setOtpMessage({
        text: "Password updated successfully. Please sign in.",
        tone: "info",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setOtpMessage({
        text: err.response?.data?.message || err.message || "Failed to set new password.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, newPassword, passwordChecks.canSetNewPassword]);

  const handleResendOtp = useCallback(() => {
    setTimer(OTP_SECONDS);
    setCanResend(false);
    setOtpMessage({ text: "A new OTP has been requested.", tone: "info" });
  }, []);

  return {
    mode,
    success,
    checked,
    otp,
    email,
    password,
    showPassword,
    showNewPassword,
    showConfirmPassword,
    showCurrentPassword,
    newPassword,
    confirmNewPassword,
    currentPassword,
    showError,
    errorMessage,
    otpMessage,
    isSubmitting,
    isOtpSubmitting,
    timer,
    canResend,
    passwordChecks,

    setChecked,
    setOtp,
    setEmail,
    setPassword,
    setShowPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    setShowCurrentPassword,
    setNewPassword,
    setConfirmNewPassword,
    setCurrentPassword,
    setShowError,
    setSuccess,

    goToSignIn,
    goToForgotPassword,
    goToResetMode,
    handleSignIn,
    handleOtpSubmit,
    handlePasswordResetRequest,
    handleSetNewPassword,
    handleResendOtp,
  };
}
