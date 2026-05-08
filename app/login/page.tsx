"use client";

import AlertBanner from "@/components/atoms/auth/AlertBanner";
import LoginBackground from "@/components/organisms/auth/LoginBackground";
import LoginAuthCard from "@/components/organisms/auth/LoginAuthCard";
import { useLoginFlow } from "@/app/login/hooks/useLoginFlow";

export default function SignIn() {
  const flow = useLoginFlow();

  return (
    <main className="min-h-screen overflow-hidden bg-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.75fr)]">
      {flow.showError ? (
        <AlertBanner message={flow.errorMessage} onClose={() => flow.setShowError(false)} />
      ) : null}

      <section className="relative hidden min-h-screen overflow-hidden bg-[#F5EEE7] lg:block">
        <LoginBackground />
      </section>

      <section className="flex min-h-screen shadow-[0_4px_8px_0_rgba(0,0,0,0.20)] z-[1000] flex-col bg-white px-6 py-8 sm:px-10 lg:px-[88px] lg:py-[88px]">
        <div className="relative -mx-6 -mt-8 mb-8 block overflow-hidden bg-[#F5EEE7] sm:-mx-10 lg:hidden">
          <LoginBackground compact />
        </div>

        <div className="flex flex-1 items-start justify-start">
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

      </section>
    </main>
  );
}
