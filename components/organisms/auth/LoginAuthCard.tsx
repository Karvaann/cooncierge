import Image from "next/image";
import { IoMdArrowBack } from "react-icons/io";
import AuthPrimaryButton from "@/components/atoms/auth/AuthPrimaryButton";
import AuthTextInput from "@/components/atoms/auth/AuthTextInput";
import AuthPasswordInput from "@/components/atoms/auth/AuthPasswordInput";
import OtpField from "@/components/molecules/auth/OtpField";
import PasswordRules from "@/components/molecules/auth/PasswordRules";
import type { OtpMessage, PasswordChecks } from "@/app/login/types";

interface LoginAuthCardProps {
  mode: "signin" | "otp" | "forgot" | "reset";
  success: boolean;
  checked: boolean;
  otp: string;
  email: string;
  password: string;
  showPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  showCurrentPassword: boolean;
  newPassword: string;
  confirmNewPassword: string;
  currentPassword: string;
  otpMessage: OtpMessage | null;
  isSubmitting: boolean;
  isOtpSubmitting: boolean;
  timer: number;
  canResend: boolean;
  passwordChecks: PasswordChecks;
  setChecked: (checked: boolean) => void;
  setOtp: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
  setShowCurrentPassword: (value: boolean) => void;
  setNewPassword: (value: string) => void;
  setConfirmNewPassword: (value: string) => void;
  setCurrentPassword: (value: string) => void;
  setSuccess: (value: boolean) => void;
  goToSignIn: () => void;
  goToForgotPassword: () => void;
  goToResetMode: () => void;
  handleSignIn: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handleOtpSubmit: () => Promise<void>;
  handlePasswordResetRequest: () => Promise<void>;
  handleSetNewPassword: () => Promise<void>;
  handleResendOtp: () => void;
}

function InlineStatus({ message }: { message: OtpMessage }) {
  return (
    <p className={`text-center text-sm ${message.tone === "error" ? "text-red-600" : "text-green-600"}`}>
      {message.text}
    </p>
  );
}

export default function LoginAuthCard(props: LoginAuthCardProps) {
  return (
    <div className="fixed left-1/2 top-1/2 z-10 flex w-fit -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl bg-white px-6 py-6 shadow-lg">
      <div className="flex w-full justify-center">
        <Image src="/full_logo.svg" alt="Cooncierge Logo" width={240} height={80} priority className="h-auto w-62" />
      </div>

      {props.mode === "signin" ? (
        <div className="w-[360px]">
          <h2 className="mb-[18px] ml-[135px] mt-[20px] text-[17px] font-semibold text-[#020202]">Welcome!</h2>
          <form className="w-full space-y-3" onSubmit={props.handleSignIn}>
            <AuthTextInput
              label="Email"
              type="email"
              value={props.email}
              onChange={(event) => props.setEmail(event.target.value)}
              placeholder="Enter Email"
              autoComplete="off"
              data-lpignore="true"
            />

            <AuthPasswordInput
              label="Password"
              value={props.password}
              onChange={(event) => props.setPassword(event.target.value)}
              placeholder="Enter Password"
              autoComplete="new-password"
              visible={props.showPassword}
              onToggleVisible={() => props.setShowPassword(!props.showPassword)}
            />

            <div className="mb-4 mt-2.5 flex items-center justify-between">
              <label className="mb-1 mt-1 flex cursor-pointer items-center gap-2 text-[14px] font-normal text-[#414141]">
                <input
                  type="checkbox"
                  checked={props.checked}
                  onChange={(event) => props.setChecked(event.target.checked)}
                  className="h-4 w-4 accent-[#0D4B37]"
                />
                Remember Me
              </label>

              <button
                type="button"
                onClick={props.goToForgotPassword}
                className="py-[14px] text-[14px] font-normal text-[#0D4B37] transition-colors hover:text-green-900 hover:underline"
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
        <div className="flex w-[360px] flex-col items-center px-[28px]">
          <div className="mt-[23px] flex w-full items-center">
            <button
              type="button"
              onClick={props.goToSignIn}
              className="rounded-full p-1 transition-colors hover:bg-gray-200"
              aria-label="Back"
            >
              <IoMdArrowBack size={15} />
            </button>
            <h2 className="w-[85%] text-center text-[15px] font-semibold text-[#020202]">Please enter OTP</h2>
          </div>

          <div className="m-[24px]">
            <OtpField value={props.otp} onChange={props.setOtp} hasError={props.otpMessage?.tone === "error"} />
          </div>

          <p className="-mt-3 mb-4 text-center text-[12px] font-normal text-[#126ACB]">OTP has been sent to {props.email}.</p>

          {props.otpMessage ? <InlineStatus message={props.otpMessage} /> : null}

          <AuthPrimaryButton
            onClick={props.handleOtpSubmit}
            label={props.isOtpSubmitting ? "Verifying..." : "Verify OTP"}
            disabled={props.isOtpSubmitting || props.otp.length < 6}
          />

          <div className="mt-4 flex w-full justify-between">
            <div className="text-[14px] font-normal text-[#414141]">(00:{props.timer > 9 ? props.timer : `0${props.timer}`})</div>
            {!props.canResend ? (
              <button type="button" disabled className="text-[15px] font-normal text-[#0D4B37] opacity-60">
                Resend OTP
              </button>
            ) : (
              <button
                type="button"
                onClick={props.handleResendOtp}
                className="text-[15px] font-normal text-[#0D4B37] underline hover:text-[#125E45]"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      ) : null}

      {props.mode === "forgot" ? (
        <div className="w-[360px]">
          {!props.success ? (
            <div className="space-y-4">
              <div className="mt-[20px] flex items-center">
                <button
                  type="button"
                  onClick={props.goToSignIn}
                  className="rounded-full p-1 transition-colors hover:bg-gray-200"
                  aria-label="Back"
                >
                  <IoMdArrowBack size={20} />
                </button>
                <h2 className="w-[85%] text-center text-[17px] font-semibold text-[#020202]">Forgot Password</h2>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void props.handlePasswordResetRequest();
                }}
              >
                <p className="mb-[18px] mt-[18px] text-justify text-[14px] font-normal text-[#414141]">
                  Don&apos;t worry! Just enter your email and we&apos;ll notify your admin to reset your password.
                </p>

                <AuthTextInput
                  type="email"
                  value={props.email}
                  onChange={(event) => props.setEmail(event.target.value)}
                  placeholder="Enter Email"
                  autoComplete="off"
                  data-lpignore="true"
                  className="mb-[18px]"
                />

                {props.otpMessage ? <InlineStatus message={props.otpMessage} /> : null}

                <AuthPrimaryButton
                  type="submit"
                  label={props.isSubmitting ? "Sending..." : "Send"}
                  disabled={props.isSubmitting}
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

              <p className="mb-3 text-center text-black">
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

      {props.mode === "reset" ? (
        <div className="w-[550px] px-0">
          <div className="mb-6 mt-[23px] flex items-center">
            <h2 className="w-full text-center text-[16px] font-semibold text-[#020202]">Set a new password</h2>
          </div>

          <div className="space-y-4">
            <AuthPasswordInput
              label="Current Password"
              value={props.currentPassword}
              onChange={(event) => props.setCurrentPassword(event.target.value)}
              placeholder="Enter Password"
              autoComplete="current-password"
              visible={props.showCurrentPassword}
              onToggleVisible={() => props.setShowCurrentPassword(!props.showCurrentPassword)}
            />

            <AuthTextInput
              label="Email"
              type="email"
              value={props.email}
              readOnly
              className="cursor-not-allowed bg-gray-100 text-gray-600"
            />

            <div>
              <AuthPasswordInput
                label="New Password"
                value={props.newPassword}
                onChange={(event) => props.setNewPassword(event.target.value)}
                placeholder="Enter Password"
                visible={props.showNewPassword}
                onToggleVisible={() => props.setShowNewPassword(!props.showNewPassword)}
              />
              <PasswordRules checks={props.passwordChecks} />
            </div>

            <AuthPasswordInput
              label="Confirm New Password"
              value={props.confirmNewPassword}
              onChange={(event) => props.setConfirmNewPassword(event.target.value)}
              placeholder="Re-enter Password"
              visible={props.showConfirmPassword}
              onToggleVisible={() => props.setShowConfirmPassword(!props.showConfirmPassword)}
            />

            {props.otpMessage ? <InlineStatus message={props.otpMessage} /> : null}

            <AuthPrimaryButton
              label={props.isSubmitting ? "Setting..." : "Set a new password"}
              onClick={props.handleSetNewPassword}
              disabled={!props.passwordChecks.canSetNewPassword || props.isSubmitting}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
