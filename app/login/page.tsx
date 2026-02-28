"use client";

import AlertBanner from "@/components/atoms/auth/AlertBanner";
import LoginBackground from "@/components/organisms/auth/LoginBackground";
import LoginAuthCard from "@/components/organisms/auth/LoginAuthCard";
import { useLoginFlow } from "@/app/login/hooks/useLoginFlow";

export default function SignIn() {
  const flow = useLoginFlow();

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#E8F5F1]">
      {flow.showError ? (
        <AlertBanner message={flow.errorMessage} onClose={() => flow.setShowError(false)} />
      ) : null}

      <LoginBackground />

      <LoginAuthCard
        mode={flow.mode}
        success={flow.success}
        checked={flow.checked}
        otp={flow.otp}
        email={flow.email}
        password={flow.password}
        showPassword={flow.showPassword}
        showNewPassword={flow.showNewPassword}
        showConfirmPassword={flow.showConfirmPassword}
        showCurrentPassword={flow.showCurrentPassword}
        newPassword={flow.newPassword}
        confirmNewPassword={flow.confirmNewPassword}
        currentPassword={flow.currentPassword}
        otpMessage={flow.otpMessage}
        isSubmitting={flow.isSubmitting}
        isOtpSubmitting={flow.isOtpSubmitting}
        timer={flow.timer}
        canResend={flow.canResend}
        passwordChecks={flow.passwordChecks}
        setChecked={flow.setChecked}
        setOtp={flow.setOtp}
        setEmail={flow.setEmail}
        setPassword={flow.setPassword}
        setShowPassword={flow.setShowPassword}
        setShowNewPassword={flow.setShowNewPassword}
        setShowConfirmPassword={flow.setShowConfirmPassword}
        setShowCurrentPassword={flow.setShowCurrentPassword}
        setNewPassword={flow.setNewPassword}
        setConfirmNewPassword={flow.setConfirmNewPassword}
        setCurrentPassword={flow.setCurrentPassword}
        setSuccess={flow.setSuccess}
        goToSignIn={flow.goToSignIn}
        goToForgotPassword={flow.goToForgotPassword}
        goToResetMode={flow.goToResetMode}
        handleSignIn={flow.handleSignIn}
        handleOtpSubmit={flow.handleOtpSubmit}
        handlePasswordResetRequest={flow.handlePasswordResetRequest}
        handleSetNewPassword={flow.handleSetNewPassword}
        handleResendOtp={flow.handleResendOtp}
      />
    </div>
  );
}
