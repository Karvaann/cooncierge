"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoMdArrowBack } from "react-icons/io";
import { FiEye } from "react-icons/fi";
import { FiEyeOff } from "react-icons/fi";
import type { AxiosError } from "axios";
import { AuthApi } from "@/services/authApi";
import OTPInput from "react-otp-input";

export default function SignIn() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "otp" | "forgot">("signin");
  const [success, setSuccess] = useState(false);
  const [checked, setChecked] = useState(false);

  const [otp, setOtp] = useState<string>('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    "Invalid Email or Password, please retry."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const [otpMessage, setOtpMessage] = useState<{
    text: string;
    tone: "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showError]);

  useEffect(() => {
    if (mode === "otp" && timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return undefined;
  }, [mode, timer]);


  const handleForgotPassword = useCallback(() => {
    setMode("forgot");
  }, []);

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
        setShowError(true);
        setErrorMessage("Invalid Email or Password, please retry.");
        return;
      }
      setShowError(false);
      setIsSubmitting(true);
      setOtpMessage(null);

      try {
        console.log("inside try");
        const response = await AuthApi.login({ email, password });

        setOtp('');
        setMode("otp");
      } catch (error: unknown) {
        const err = error as AxiosError<{ message?: string }>;
        setErrorMessage(
          err.response?.data?.message || err.message || "Login failed"
        );
        setShowError(true);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, router]
  );

  const handleOtpSubmit = useCallback(async () => {
    if (otp.length < 6) {
      setErrorMessage("Invalid OTP, please retry.");
      setShowError(true);
      return;
    }

    setIsOtpSubmitting(true);
    setShowError(false);

    try {
      await AuthApi.verifyTwoFa({
        email,
        twoFACode: otp,
      });
      await router.push("/bookings/other-services");
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setOtpMessage({
        text: err.response?.data?.message || err.message || "Invalid OTP",
        tone: "error",
      });
    } finally {
      setIsOtpSubmitting(false);
    }
  }, [otp, router]);

  const handlePasswordReset = useCallback(async (): Promise<void> => {
    if (!email) {
      setOtpMessage({
        text: "Please enter your email address",
        tone: "error",
      });
      return;
    }

    try {
      await AuthApi.requestPasswordReset({ email });
      setSuccess(true);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(
        err.response?.data?.message ||
          err.message ||
          "Invalid OTP, please retry."
      );
      setShowError(true);
    }
  }, [email]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#E8F5F1] flex items-center justify-center">
      {/* Error Alert Popup */}
      {showError && (
        <div className="fixed top-8 mt-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center justify-between bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-full shadow-lg max-w-[90vw] w-auto whitespace-nowrap">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01"
              />
            </svg>
            <span className="font-semibold">Error :</span>
            <span className="">{errorMessage}</span>
          </div>
          <button
            type="button"
            className="ml-2 text-red-400 hover:text-red-600 text-2xl font-bold"
            aria-label="Close alert"
            onClick={() => setShowError(false)}
          >
            ×
          </button>
        </div>
      )}
      {/* Top Vectors */}
      <div className="left-0 absolute w-full overflow-hidden">
        <Image
          src="/login/vectors/Vector 1.svg"
          alt="Decorative gradient"
          width={1920}
          height={500}
          className="w-full h-auto fixed top-[0px]  z-30"
          priority
        />
        <Image
          src="/login/vectors/Vector 2.svg"
          alt="Decorative gradient"
          width={1920}
          height={500}
          className="w-full h-auto fixed top-[0px] z-20"
        />
        <Image
          src="/login/vectors/Vector 3.svg"
          alt="Decorative gradient"
          width={1920}
          height={500}
          className="w-full h-auto fixed top-[0px] z-10"
        />
      </div>

      {/* Bottom Vectors */}
      <div className="absolute right-0 bottom-[-30px] w-[520px] h-[360px] overflow-hidden">
        <Image
          src="/login/vectors/Vector 4.svg"
          alt="Decorative shape"
          width={520}
          height={360}
          className="absolute bottom-0 right-[-25px] w-[520px] h-auto z-30 mr-[-120px]"
          loading="lazy"
          quality={70}
        />
        <Image
          src="/login/vectors/Vector 5.svg"
          alt="Decorative shape"
          width={520}
          height={360}
          className="absolute bottom-0 right-[-25px] w-[520px] h-auto mr-[-100px] opacity-50 z-20"
          loading="lazy"
          quality={70}
        />
        <Image
          src="/login/vectors/Vector 6.svg"
          alt="Decorative shape"
          width={520}
          height={360}
          className="absolute bottom-0 right-[-25px] w-[520px] h-auto mr-[-80px] opacity-40 z-10"
          loading="lazy"
          quality={70}
        />
      </div>

      {/* Background illustrations - Optimized for performance */}
      <Image
        src="/login/wallet.svg"
        alt="Wallet illustration"
        width={650}
        height={650}
        priority
        className="absolute top-25 left-[1.5vw] w-[465px]"
      />
      <Image
        src="/login/mobile.svg"
        alt="Booking illustration"
        width={515}
        height={515}
        loading="lazy"
        sizes="(max-width: 768px) 246px, 515px"
        className="absolute bottom-[-50px] left-[2vw] w-[515px]"
      />
      <Image
        src="/login/world.svg"
        alt="World illustration"
        width={332}
        height={332}
        loading="lazy"
        sizes="(max-width: 768px) 166px, 332px"
        className="absolute -top-5 right-[40%] w-[332px] rotate-[5deg]"
      />
      <Image
        src="/login/airport.svg"
        alt="Traveler illustration"
        width={320}
        height={320}
        loading="lazy"
        sizes="(max-width: 768px) 160px, 320px"
        className="absolute -bottom-1 right-[30%] w-[320px]"
      />
      <Image
        src="/login/travel.svg"
        alt="Group illustration"
        width={480}
        height={500}
        loading="lazy"
        sizes="(max-width: 768px) 240px, 480px"
        className="absolute w-[515px] top-[10vh] right-[2vw]"
      />

      {/* Sign-in box */}
      <div className="fixed flex flex-col items-center top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-white rounded-2xl shadow-lg px-[24px] py-[24px] w-[348px]">
        {/* Logo */}
        <div className="w-full flex justify-center">
          <Image
            src="/full_logo.svg"
            alt="Cooncierge Logo"
            width={240}
            height={80}
            priority
            className="w-60 h-auto"
          />
        </div>
        {mode === "signin" && (
          <>
            <h2 className="text-[15px] mt-[18px] mb-[18px] font-[600] text-[#020202]">
              Welcome!
            </h2>
            <form className="space-y-3 w-full" onSubmit={handleSignIn}>
              {/* Email */}
              <div className="w-full">
                <label className="block text-[12px] text-left font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  autoComplete="off"
                  data-lpignore="true"
                  className="w-full border font-[400] text-[12px] border-[#E2E1E1] rounded-[6px] px-[11px] py-[10px] hover:border-[#AFD7D2] focus:ring-1 focus:ring-[#AFD7D2] focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <label className="block text-[12px] text-left font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    autoComplete="new-password"
                    className="w-full border font-[400] text-[12px] hover:border-[#AFD7D2] border-[#E2E1E1] rounded-[6px] px-[11px] py-[10px] focus:ring-2 focus:ring-green-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                  >
                    {!showPassword ? (
                      <FiEyeOff size={13} />
                    ) : (
                      <FiEye size={13} />
                    )}
                  </button>
                </div>

                <div className="mt-4 mb-4">
                  <div className="flex items-center gap-2 mt-1 mb-1">
                    <input
                      type="checkbox"
                      id="remember"
                      className="hidden"
                      checked={checked}
                      onChange={() => setChecked(!checked)}
                    />
                    <label
                      htmlFor="remember"
                      className="w-4 h-4 border border-[#0D4B37] rounded-sm flex items-center justify-center cursor-pointer peer-checked:bg-[0D4B37]"
                    >
                      {checked && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="11"
                          height="10"
                          viewBox="0 0 11 10"
                          fill="none"
                        >
                          <path
                            d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                            stroke="#0D4B37"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </label>
                    <span style={{fontFamily: 'Roboto'}} className="text-[#414141] font-[400] text-[12px] ">Remember Me</span>
                  </div>
                  <div className="flex justify-end mt-[-30px]">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      style={{fontFamily: 'Roboto'}}
                      className="text-right text-[#0D4B37] px-2 py-1 mt-1 underline font-[400] text-[12px] hover:text-green-900"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-10 text-[12px] bg-[#0D4B37] text-white py-[10px] rounded-md shadow-xl font-medium hover:text-[14px] hover:bg-[#125E45] transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </>
        )}
        {mode === "otp" && (
          <div className="w-full px-[18px]">
            <div className="flex items-center mt-[18px]">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setOtpMessage(null);
                }}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <IoMdArrowBack size={15} />
              </button>
              <h2 className="w-[80%] text-[14px] text-center font-[600] text-[#020202]">
                Please enter OTP
              </h2>
            </div>
            <div className="flex justify-center gap-3 mb-6 mt-[18px]">
              <OTPInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                renderSeparator={<span></span>}
                containerStyle={{ gap: "4px" }}
                inputStyle={{
                  width: "35px",
                  height: "35px",
                  fontSize: "16px",
                  fontWeight: '400',
                  borderRadius: "6px",
                  border: otpMessage?.tone === "error" ? "1px solid #EB382B" : "1px solid #E2E1E1",
                  textAlign: "center",
                  background: '#FFF',
                  lineHeight: '24px'
                }}
                renderInput={(props) => <input {...props} />}
              />
            </div>
            <p style={{fontFamily: 'Roboto'}} className="text-[10px] font-[400] text-center text-[#126ACB] mb-4 -mt-3">
              OTP has been sent to {email}.
            </p>
             <button
                onClick={handleOtpSubmit}
                className="w-full h-10 text-[12px] bg-[#0D4B37] text-white py-[10px] rounded-md shadow-xl font-medium hover:text-[14px] hover:bg-[#125E45] transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isOtpSubmitting || otp.length < 6}
              >
                {isOtpSubmitting ? "Verifying..." : "Verify OTP"}
              </button>
            <div className="flex justify-between mt-4">
              <div style={{fontFamily: 'Roboto'}} className="text-[#414141] text-[12px] font-[400]">(00:{timer > 9 ? timer : `0${timer}`})</div>
              {!canResend ? (
                // Disabled resend with timer display
                <button
                  type="button"
                  disabled
                  style={{fontFamily: 'Roboto'}}
                  className="text-[#0D4B37] text-[12px] font-[400] opacity-60 underline hover:text-[#125E45]"
                >
                  Resend OTP
                </button>
              ) : (
                // Enabled resend after timer reaches 0
                <button
                  type="button"
                  onClick={() => {
                    setTimer(30);
                    setCanResend(false);
                    // resend OTP logic here
                  }}
                  style={{fontFamily: 'Roboto'}}
                  className="text-[#0D4B37] text-[12px] font-[400] underline hover:text-[#125E45]"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

        {mode === "forgot" && (
          <>
            {!success ? (
              <div className="space-y-4">
                <div className="flex items-center mt-[18px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setOtpMessage(null);
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <IoMdArrowBack size={20} />
                  </button>
                  <h2 className="w-[85%] text-[14px] text-center font-[600] text-[#020202]">
                    Forgot Password
                  </h2>
                </div>
                <form
                  className="space-y-0"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePasswordReset();
                  }}
                >
                  <div>
                    <p className="text-[12px] text-justify font-[400] text-[#414141] mb-[18px] mt-[18px]">
                      Don&apos;t worry! Just enter your email and we&apos;ll
                      notify your admin to reset your password.
                    </p>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter Email"
                        autoComplete="off"
                        data-lpignore="true"
                        className="w-full mb-[18px] hover:border-[#AFD7D2] border font-[400] text-[12px] border-[#E2E1E1] rounded-[6px] px-[11px] py-[10px] focus:ring-2 focus:ring-green-400 focus:outline-none"
                      />
                  </div>

                  {otpMessage && (
                    <p
                      className={`text-sm text-center mb-2 ${
                        otpMessage.tone === "error"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {otpMessage.text}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full h-10 text-[12px] bg-[#0D4B37] text-white py-[10px] rounded-md shadow-xl font-medium hover:text-[14px] hover:bg-[#125E45] transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div>
                  <video
                    src="/animations/tickmark-anim.mp4"
                    width="100"
                    height="100"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedMetadata={(e) => {
                      (e.currentTarget as HTMLVideoElement).playbackRate = 0.75;
                    }}
                  />
                </div>
                <p className="text-black font-small mb-3">
                  Hurrah! Password reset link has been sent to your admin email.
                </p>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setMode("signin");
                  }}
                  className="w-full h-13 bg-green-900 text-white py-2 rounded-md font-medium hover:bg-green-800  transition"
                >
                  <span className="transition text-medium duration-700 hover:text-lg">
                    Back to Sign In
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
