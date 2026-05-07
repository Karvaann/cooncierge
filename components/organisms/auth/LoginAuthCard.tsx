import { useEffect, useRef, useState } from "react";
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

const OWL_SIZE = { width: 66, height: 92 };
const OPEN_EYE = { left: 47, top: 39, size: 15 };
const CLOSED_EYE = { left: 26, top: 33, width: 40, height: 41 };

function OwlLogo({ passwordVisible }: { passwordVisible: boolean }) {
  const owlRef = useRef<HTMLDivElement>(null);
  const eyeRotationRef = useRef(0);
  const [eyeMotion, setEyeMotion] = useState({ x: 0, y: 0, rotation: 0 });

  useEffect(() => {
    if (passwordVisible) {
      eyeRotationRef.current = 0;
      setEyeMotion({ x: 0, y: 0, rotation: 0 });
      return;
    }

    function clamp(value: number, min: number, max: number) {
      return Math.min(Math.max(value, min), max);
    }

    function getContinuousRotation(rotation: number) {
      const previousRotation = eyeRotationRef.current;
      const rotationDelta = ((((rotation - previousRotation) % 360) + 540) % 360) - 180;

      return previousRotation + rotationDelta;
    }

    function handlePointerMove(event: PointerEvent) {
      const owl = owlRef.current;

      if (!owl) {
        return;
      }

      const bounds = owl.getBoundingClientRect();
      const eyeCenterX = bounds.left + OPEN_EYE.left + OPEN_EYE.size / 2;
      const eyeCenterY = bounds.top + OPEN_EYE.top + OPEN_EYE.size / 2;
      const deltaX = event.clientX - eyeCenterX;
      const deltaY = event.clientY - eyeCenterY;
      const rotation = getContinuousRotation(Math.atan2(deltaY, deltaX) * (180 / Math.PI));

      eyeRotationRef.current = rotation;

      setEyeMotion({
        x: clamp(deltaX / 18, -10, 3),
        y: clamp(deltaY / 22, -5, 5),
        rotation,
      });
    }

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [passwordVisible]);

  return (
    <div className="flex flex-col items-center">
      <div ref={owlRef} className="relative h-[92px] w-[66px]" aria-hidden>
        <Image
          src="/login/owl.svg"
          alt=""
          width={OWL_SIZE.width}
          height={OWL_SIZE.height}
          priority
          className="h-[92px] w-[66px]"
        />
        {passwordVisible ? (
          <Image
            src="/login/eye_closed.svg"
            alt=""
            width={CLOSED_EYE.width}
            height={CLOSED_EYE.height}
            className="absolute h-[41px] w-[40px]"
            style={{ left: CLOSED_EYE.left, top: CLOSED_EYE.top }}
          />
        ) : (
          <Image
            src="/login/eye.svg"
            alt=""
            width={OPEN_EYE.size}
            height={OPEN_EYE.size}
            className="absolute h-[15px] w-[15px] transition-transform duration-75 ease-out"
            style={{
              left: OPEN_EYE.left,
              top: OPEN_EYE.top,
              transform: `translate(${eyeMotion.x}px, ${eyeMotion.y}px) rotate(${eyeMotion.rotation}deg)`,
            }}
          />
        )}
      </div>

      <Image src="/full_logo.svg" alt="Cooncierge Logo" width={120} height={53} priority className="-mt-1 h-auto w-[120px]" />
    </div>
  );
}

export default function LoginAuthCard(props: LoginAuthCardProps) {
  const isAnyPasswordVisible =
    props.showPassword || props.showCurrentPassword || props.showNewPassword || props.showConfirmPassword;

  return (
    <div className="z-10 flex h-full w-full flex-col items-center bg-white">
      <div className="flex w-full justify-center">
        <OwlLogo passwordVisible={isAnyPasswordVisible} />
      </div>

      {props.mode === "signin" ? (
        <div className="mt-8 w-full">
          <div className="mb-8 text-center">
            <h2 className="text-[21px] font-[500] text-[#414141]">Welcome</h2>
            <p className="mt-2 text-[12px] font-[400] text-[#818181]">Please sign in to continue</p>
          </div>
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
              <label className="mb-1 mt-1 flex cursor-pointer items-center gap-2 text-[12px] font-[300] text-[#414141]">
                <input
                  type="checkbox"
                  checked={props.checked}
                  onChange={(e) => props.setChecked(e.target.checked)}
                  className="peer hidden"
                />

                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-[6px] border-[1.5px] ${
                    props.checked ? "border-[#7135AD] bg-[#7135AD]" : "border-[#E2E1E1]"
                  }`}
                >
                  <svg
                    className={`h-3 w-3 text-white ${props.checked ? "opacity-100" : "opacity-0"}`}
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
                className="py-[14px] text-[12px] font-[300] text-[#414141] transition-colors hover:text-[#7135AD] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <AuthPrimaryButton
              type="submit"
              label={props.isSubmitting ? "Signing In..." : "Sign In ->"}
              disabled={props.isSubmitting}
            />
          </form>
        </div>
      ) : null}

      {props.mode === "otp" ? (
        <div className="mt-8 flex w-full max-w-[390px] flex-col items-center px-0">
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
        <div className="mt-8 w-full">
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
                  Enter your email to raise password reset request
                </p>

                <AuthTextInput
                  type="email"
                  label="Email"
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
                  label={props.isSubmitting ? "Raising Request..." : "Raise Request"}
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
        <div className="w-full px-0">
          <div className="mb-6 mt-[23px] flex items-center">
            <h2 className="w-full text-center text-[16px] font-semibold text-[#020202]">Set a new password</h2>
          </div>

          <div className="space-y-4 h-[50vh] overflow-scroll">
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

          </div>
          <AuthPrimaryButton
              label={props.isSubmitting ? "Setting..." : "Set a new password"}
              onClick={props.handleSetNewPassword}
              disabled={!props.passwordChecks.canSetNewPassword || props.isSubmitting}
              className="mt-[23px]"
            />
        </div>
      ) : null}

      <footer className="mt-auto flex justify-center gap-8 pt-8 text-[12px] text-[#8A8A8A]">
        <span>Privacy Policy</span>
        <span>Terms of Use</span>
        <span>FAQs</span>
      </footer>
    </div>
  );
}
