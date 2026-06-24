"use client";

import AlertBanner from "@/components/atoms/auth/AlertBanner";
import SlideStripNotification from "@/components/atoms/auth/SlideStripNotification";
import LoginBackground from "@/components/organisms/auth/LoginBackground";
import LoginAuthCard from "@/components/organisms/auth/LoginAuthCard";
import { useLoginFlow } from "@/app/login/hooks/useLoginFlow";

export default function SignIn() {
  const flow = useLoginFlow();

  return (
    <main className="min-h-screen overflow-hidden bg-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.75fr)]">
      {flow.showError && flow.mode !== "signin" ? (
        <AlertBanner message={flow.errorMessage} onClose={() => flow.setShowError(false)} />
      ) : null}

      <SlideStripNotification
        message={flow.otpMessage?.tone === "info" ? flow.otpMessage.text : null}
        tone="success"
        onClose={flow.clearOtpMessage}
      />

      <section className="relative hidden min-h-screen overflow-hidden bg-[#F5EEE7] lg:block">
        <LoginBackground />
      </section>

      <section className="flex min-h-screen shadow-[0_4px_8px_0_rgba(0,0,0,0.20)] z-[1000] flex-col bg-white px-6 py-8 sm:px-10 lg:px-[88px] lg:py-[88px]">
        <div className="relative -mx-6 -mt-8 mb-8 block overflow-hidden bg-[#F5EEE7] sm:-mx-10 lg:hidden">
          <LoginBackground compact />
        </div>

        <div className="flex w-full flex-1 items-start justify-center overflow-x-hidden">
          <div className="auth-ui-scale w-full max-w-[430px]">
            <LoginAuthCard
            mode={flow.mode}
            otpPurpose={flow.otpPurpose}
            success={flow.success}
            checked={flow.checked}
            otp={flow.otp}
            email={flow.email}
            password={flow.password}
            newPassword={flow.newPassword}
            confirmNewPassword={flow.confirmNewPassword}
            showPassword={flow.showPassword}
            showNewPassword={flow.showNewPassword}
            showConfirmPassword={flow.showConfirmPassword}
            passwordChecks={flow.passwordChecks}
            resetPasswordError={flow.resetPasswordError}
            isResetPasswordSubmitting={flow.isResetPasswordSubmitting}
            signInError={flow.signInError}
            validationErrorTick={flow.validationErrorTick}
            otpMessage={flow.otpMessage}
            isSubmitting={flow.isSubmitting}
            isOtpSubmitting={flow.isOtpSubmitting}
            timer={flow.timer}
            canResend={flow.canResend}
            resetEmailFlow={flow.resetEmailFlow}
            canSubmitForgotReset={flow.canSubmitForgotReset}
            setChecked={flow.setChecked}
            setOtp={flow.setOtp}
            setEmail={flow.setEmail}
            setPassword={flow.setPassword}
            setNewPassword={flow.setNewPassword}
            setConfirmNewPassword={flow.setConfirmNewPassword}
            setShowNewPassword={flow.setShowNewPassword}
            setShowConfirmPassword={flow.setShowConfirmPassword}
            clearSignInErrors={flow.clearSignInErrors}
            clearOtpMessage={flow.clearOtpMessage}
            setShowPassword={flow.setShowPassword}
            setSuccess={flow.setSuccess}
            goToSignIn={flow.goToSignIn}
            goToForgotPassword={flow.goToForgotPassword}
            handleSignIn={flow.handleSignIn}
            handleOtpSubmit={flow.handleOtpSubmit}
            handlePasswordResetRequest={flow.handlePasswordResetRequest}
            handleResendOtp={flow.handleResendOtp}
            handleResetPasswordSubmit={flow.handleResetPasswordSubmit}
          />
          </div>
        </div>

      </section>
    </main>
  );
}
