import { IoMdArrowBack } from "react-icons/io";
import AuthPrimaryButton from "@/components/atoms/auth/AuthPrimaryButton";
import AuthTextInput from "@/components/atoms/auth/AuthTextInput";
import AuthPasswordInput from "@/components/atoms/auth/AuthPasswordInput";
import OtpField, { OTP_ROW_WIDTH_PX } from "@/components/molecules/auth/OtpField";
import OwlLogo from "@/components/organisms/auth/OwlLogo";
import type { OtpMessage, OtpPurpose, PasswordChecks, ResetEmailFlow, SignInErrorState } from "@/app/login/types";
import { AuthFieldErrorSlot } from "@/components/atoms/auth/AuthFieldError";
import ResetPasswordCard from "@/components/organisms/auth/ResetPasswordCard";
import AuthFooterLinks from "@/components/atoms/auth/AuthFooterLinks";

interface LoginAuthCardProps {
  mode: "signin" | "otp" | "forgot" | "reset-password";
  otpPurpose: OtpPurpose;
  success: boolean;
  checked: boolean;
  otp: string;
  email: string;
  password: string;
  newPassword: string;
  confirmNewPassword: string;
  showPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  passwordChecks: PasswordChecks;
  resetPasswordError: string | null;
  isResetPasswordSubmitting: boolean;
  signInError: SignInErrorState;
  validationErrorTick: number;
  otpMessage: OtpMessage | null;
  isSubmitting: boolean;
  isOtpSubmitting: boolean;
  timer: number;
  canResend: boolean;
  resetEmailFlow: ResetEmailFlow;
  canSubmitForgotReset: boolean;
  setChecked: (checked: boolean) => void;
  setOtp: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setConfirmNewPassword: (value: string) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
  clearSignInErrors: () => void;
  clearOtpMessage: () => void;
  setShowPassword: (value: boolean) => void;
  setSuccess: (value: boolean) => void;
  goToSignIn: () => void;
  goToForgotPassword: () => void;
  handleSignIn: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleOtpSubmit: () => Promise<void>;
  handlePasswordResetRequest: () => Promise<void>;
  handleResendOtp: () => void;
  handleResetPasswordSubmit: () => Promise<void>;
}

function getForgotPasswordHelperText(flow: ResetEmailFlow): string {
  switch (flow) {
    case "otp":
      return "Enter your email to receive a password reset OTP";
    case "admin_request":
      return "Enter your email to raise a password reset request with your administrator";
    default:
      return "Enter your email to continue";
  }
}

function getForgotPasswordCtaLabel(
  flow: ResetEmailFlow,
  isSubmitting: boolean,
): string {
  if (isSubmitting) {
    return flow === "admin_request" ? "Raising Request..." : "Sending OTP...";
  }

  if (flow === "otp") {
    return "Send OTP";
  }

  if (flow === "admin_request") {
    return "Raise Request";
  }

  return "Send OTP / Raise Request";
}

export default function LoginAuthCard(props: LoginAuthCardProps) {
  const isAnyPasswordVisible =
    props.showPassword || props.showNewPassword || props.showConfirmPassword;

  return (
    <div className="z-10 flex min-h-full w-full flex-1 flex-col bg-white">
      <div className="flex w-full justify-center">
        <OwlLogo passwordVisible={isAnyPasswordVisible} />
      </div>

      {props.mode === "signin" ? (
        <div className="mt-[40px] w-full">
          <div className="mb-[32px] text-center">
            <h2 className="auth-welcome-title text-[20px] font-[500] text-[#414141] lg:text-[20px]">Welcome</h2>
            <p className="mt-[4px] text-[12px] font-[400] text-[#818181] lg:text-[14px]">Please sign in to continue</p>
          </div>
          <form className="w-full space-y-[16px]" onSubmit={props.handleSignIn}>
            <AuthTextInput
              label="Email"
              type="email"
              value={props.email}
              onChange={(event) => {
                props.setEmail(event.target.value);
                props.clearSignInErrors();
              }}
              placeholder="Enter Email"
              autoComplete="off"
              data-lpignore="true"
              invalid={props.signInError.fields.email}
              errorShakeKey={props.signInError.fields.email ? props.validationErrorTick : 0}
            />

            <div>
              <AuthPasswordInput
                label="Password"
                value={props.password}
                onChange={(event) => {
                  props.setPassword(event.target.value);
                  props.clearSignInErrors();
                }}
                placeholder="Enter Password"
                autoComplete="new-password"
                visible={props.showPassword}
                onToggleVisible={() => props.setShowPassword(!props.showPassword)}
                invalid={props.signInError.fields.password}
                errorShakeKey={props.signInError.fields.password ? props.validationErrorTick : 0}
              />
              <AuthFieldErrorSlot
                message={props.signInError.message}
                jiggleKey={props.validationErrorTick}
              />
            </div>

            <div className="flex mt-[8px] mb-[16px] items-center justify-between">
              <label className="group mb-1 mt-1 flex cursor-pointer items-center gap-2 font-[Poppins,sans-serif] text-[14px] font-[400] leading-[20px] text-[#414141]">
                <input
                  type="checkbox"
                  checked={props.checked}
                  onChange={(e) => props.setChecked(e.target.checked)}
                  className="peer hidden"
                />

                <div
                  className={`flex h-[20px] w-[20px] items-center justify-center rounded-[6px] border-[1.5px] transition-[border-color,box-shadow,background-color] group-hover:border-[#C6AEDE] group-hover:shadow-[0_2px_8px_0_rgba(198,174,222,0.25)] ${
                    props.checked ? "border-[#7135AD] bg-[#7135AD]" : "border-[#E2E1E1]"
                  }`}
                >
                  <svg
                    className={`h-[18px] w-[18px] text-white ${props.checked ? "opacity-100" : "opacity-0"}`}
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M4 8L7 11L12 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                Remember Me
              </label>

              <button
                type="button"
                onClick={props.goToForgotPassword}
                className="cursor-pointer text-right font-[Poppins,sans-serif] text-[14px] font-[400] leading-[20px] text-[#414141] no-underline transition-colors hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <AuthPrimaryButton
              type="submit"
              label={props.isSubmitting ? "Signing In..." : "Sign In"}
              disabled={props.isSubmitting}
            />

          </form>
        </div>
      ) : null}

      {props.mode === "otp" ? (
        <div className="mt-[40px] flex w-full flex-col items-center px-0">
          <div className="mt-[23px] w-full">
            <div className="relative flex w-full items-center justify-center">
              <button
                type="button"
                onClick={props.otpPurpose === "forgot" ? props.goToForgotPassword : props.goToSignIn}
                className="auth-back-button absolute -left-2 hover:!bg-[#F2F2F2]"
                aria-label="Back"
              >
                <IoMdArrowBack size={20} />
              </button>
              <h2 className="w-full text-center text-[18px] font-[500] text-[#414141]">
                {props.otpPurpose === "forgot" ? "Enter password reset OTP" : "Enter OTP"}
              </h2>
            </div>
            <p className="mt-2 text-center text-[14px] font-[400] text-[#818181]">
              OTP has been sent to{" "}
              <span className="underline">{props.email}</span>.
            </p>
          </div>

          <div className="my-[24px] flex w-full justify-center">
            <div
              className="flex flex-col items-stretch"
              style={{ width: `${OTP_ROW_WIDTH_PX}px`, minWidth: `${OTP_ROW_WIDTH_PX}px` }}
            >
              <OtpField
                value={props.otp}
                onChange={(value) => {
                  props.setOtp(value);
                  props.clearOtpMessage();
                }}
                hasError={props.otpMessage?.tone === "error"}
                errorShakeKey={props.otpMessage?.tone === "error" ? props.validationErrorTick : 0}
              />
              <AuthFieldErrorSlot
                message={props.otpMessage?.tone === "error" ? props.otpMessage.text : null}
                jiggleKey={props.otpMessage?.tone === "error" ? props.validationErrorTick : 0}
              />

              <AuthPrimaryButton
                onClick={props.handleOtpSubmit}
                label={props.isOtpSubmitting ? "Verifying..." : "Verify OTP"}
                disabled={props.isOtpSubmitting || props.otp.length < 6}
                className="mt-[24px] !w-full min-w-full self-stretch"
              />

              <div className="mt-4 flex w-full items-center justify-between gap-4">
                <div className="font-[Roboto,sans-serif] text-[14px] font-[400] leading-[20px] text-[#414141]">
                  (00:{props.timer > 9 ? props.timer : `0${props.timer}`})
                </div>
                <p className="text-right font-[Roboto,sans-serif] text-[14px] font-[400] leading-[20px]">
                  <span className="text-[#414141]">Didn&apos;t get the code? </span>
                  {!props.canResend ? (
                    <span className="text-[#006FE7] opacity-60">Resend OTP</span>
                  ) : (
                    <button
                      type="button"
                      onClick={props.handleResendOtp}
                      className="cursor-pointer text-[#006FE7] no-underline transition-colors hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {props.mode === "forgot" ? (
        <div className="mt-[40px] w-full">
          {!props.success ? (
            <div className="space-y-4">
              <div className="relative mt-[20px] flex w-full items-center justify-center">
                <button
                  type="button"
                  onClick={props.goToSignIn}
                  className="auth-back-button absolute left-0 hover:!bg-[#F2F2F2]"
                  aria-label="Back"
                >
                  <IoMdArrowBack size={20} />
                </button>
                <h2 className="w-full text-center text-[17px] font-semibold text-[#020202] lg:text-[14px] lg:font-[500]">Forgot Password</h2>
              </div>

              <form
                className="w-full"
                onSubmit={(event) => {
                  event.preventDefault();
                  void props.handlePasswordResetRequest();
                }}
              >
                <p
                  key={props.resetEmailFlow === "otp" || props.resetEmailFlow === "admin_request" ? props.resetEmailFlow : "default"}
                  className="mx-auto mb-[18px] mt-[18px] w-full text-center text-[14px] font-normal text-[#414141] transition-colors duration-300 ease-out animate-auth-cta-label"
                >
                  {getForgotPasswordHelperText(props.resetEmailFlow)}
                </p>

                <AuthTextInput
                  type="email"
                  label="Email"
                  value={props.email}
                  onChange={(event) => {
                    props.setEmail(event.target.value);
                    props.clearOtpMessage();
                  }}
                  placeholder="Enter Email"
                  autoComplete="off"
                  data-lpignore="true"
                  invalid={props.otpMessage?.tone === "error"}
                  errorShakeKey={props.otpMessage?.tone === "error" ? props.validationErrorTick : 0}
                />

                <div className="mb-[18px]">
                  <AuthFieldErrorSlot
                    message={props.otpMessage?.tone === "error" ? props.otpMessage.text : null}
                    jiggleKey={props.otpMessage?.tone === "error" ? props.validationErrorTick : 0}
                  />
                </div>

                <AuthPrimaryButton
                  type="submit"
                  label={getForgotPasswordCtaLabel(props.resetEmailFlow, props.isSubmitting)}
                  animateLabel
                  disabled={
                    props.isSubmitting ||
                    props.resetEmailFlow === "checking" ||
                    !props.canSubmitForgotReset
                  }
                />
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <video
                src="/animations/tickmark-anim.mp4"
                width="100"
                height="100"
                autoPlay
                loop
                muted
                playsInline
                onLoadedMetadata={(event) => {
                  event.currentTarget.playbackRate = 0.75;
                }}
              />

              <p className="mb-3 text-center text-[12px] text-black lg:text-[14px]">
                Hurrah! Password reset link has been sent to your admin email.
              </p>

              <AuthPrimaryButton
                label="Back to Sign In"
                onClick={() => {
                  props.setSuccess(false);
                  props.goToSignIn();
                }}
              />
            </div>
          )}
        </div>
      ) : null}

      {props.mode === "reset-password" ? (
        <ResetPasswordCard
          embedded
          email={props.email}
          newPassword={props.newPassword}
          confirmNewPassword={props.confirmNewPassword}
          showNewPassword={props.showNewPassword}
          showConfirmPassword={props.showConfirmPassword}
          passwordChecks={props.passwordChecks}
          isSubmitting={props.isResetPasswordSubmitting}
          submitError={props.resetPasswordError}
          validationErrorTick={props.validationErrorTick}
          setNewPassword={props.setNewPassword}
          setConfirmNewPassword={props.setConfirmNewPassword}
          setShowNewPassword={props.setShowNewPassword}
          setShowConfirmPassword={props.setShowConfirmPassword}
          onBack={props.goToSignIn}
          onSubmit={() => void props.handleResetPasswordSubmit()}
        />
      ) : null}

      <AuthFooterLinks />
    </div>
  );
}
