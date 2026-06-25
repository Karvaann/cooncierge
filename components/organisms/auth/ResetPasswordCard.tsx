"use client";

import { IoMdArrowBack } from "react-icons/io";
import AuthPrimaryButton from "@/components/atoms/auth/AuthPrimaryButton";
import AuthTextInput from "@/components/atoms/auth/AuthTextInput";
import AuthPasswordInput from "@/components/atoms/auth/AuthPasswordInput";
import PasswordRules, { allPasswordRulesMet } from "@/components/molecules/auth/PasswordRules";
import OwlLogo from "@/components/organisms/auth/OwlLogo";
import { AuthFieldErrorSlot } from "@/components/atoms/auth/AuthFieldError";
import type { PasswordChecks } from "@/app/login/types";

interface ResetPasswordCardProps {
  email: string;
  newPassword: string;
  confirmNewPassword: string;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  passwordChecks: PasswordChecks;
  isSubmitting?: boolean;
  submitError?: string | null;
  embedded?: boolean;
  validationErrorTick?: number;
  setNewPassword: (value: string) => void;
  setConfirmNewPassword: (value: string) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ResetPasswordCard(props: ResetPasswordCardProps) {
  const isAnyPasswordVisible = props.showNewPassword || props.showConfirmPassword;
  const showNewPasswordInvalid =
    props.newPassword.length > 0 && !allPasswordRulesMet(props.passwordChecks);

  const form = (
    <>
      <div className={`flex items-center ${props.embedded ? "mb-[24px]" : "mb-[24px]"}`}>
        <button
          type="button"
          onClick={props.onBack}
          className="rounded-full p-1 transition-colors hover:bg-gray-200"
          aria-label="Back"
        >
          <IoMdArrowBack size={18} />
        </button>
        <div className="flex w-full flex-col items-center pr-6">
          <h2 className="text-[16px] font-[600] text-[#020202]">Set your own Password</h2>
          <p className="mt-[4px] text-center text-[12px] font-[400] text-[#818181]">
            Set your own password to enhance account protection
          </p>
        </div>
      </div>

      <form
        className="w-full space-y-[16px]"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <AuthTextInput
          label="Email"
          type="email"
          value={props.email}
          readOnly
          className="cursor-not-allowed bg-[#F5F5F5] text-[#818181]"
        />

        <div>
          <AuthPasswordInput
            label="New Password"
            value={props.newPassword}
            onChange={(event) => props.setNewPassword(event.target.value)}
            placeholder="Enter Password"
            autoComplete="new-password"
            visible={props.showNewPassword}
            onToggleVisible={() => props.setShowNewPassword(!props.showNewPassword)}
            invalid={showNewPasswordInvalid}
            errorShakeKey={showNewPasswordInvalid ? (props.validationErrorTick ?? 0) : 0}
          />
          <PasswordRules checks={props.passwordChecks} />
        </div>

        <div>
          <AuthPasswordInput
            label="Confirm New Password"
            value={props.confirmNewPassword}
            onChange={(event) => props.setConfirmNewPassword(event.target.value)}
            placeholder="Re-enter Password"
            autoComplete="new-password"
            visible={props.showConfirmPassword}
            onToggleVisible={() => props.setShowConfirmPassword(!props.showConfirmPassword)}
            disablePaste
            invalid={Boolean(props.submitError)}
            errorShakeKey={props.submitError ? (props.validationErrorTick ?? 0) : 0}
          />
        </div>

        <AuthFieldErrorSlot
          message={props.submitError ?? null}
          jiggleKey={props.submitError ? (props.validationErrorTick ?? 0) : 0}
        />

        <AuthPrimaryButton
          type="submit"
          label={props.isSubmitting ? "Resetting..." : "Reset Password"}
          disabled={!props.passwordChecks.canSetNewPassword || props.isSubmitting}
          className="mt-[8px]"
        />
      </form>
    </>
  );

  if (props.embedded) {
    return <div className="mt-[40px] w-full">{form}</div>;
  }

  return (
    <div className="z-10 flex h-full w-full flex-col items-center bg-white">
      <div className="flex w-full justify-center">
        <OwlLogo passwordVisible={isAnyPasswordVisible} />
      </div>

      <div className="mt-[40px] w-full">{form}</div>

      <footer className="mt-auto flex justify-center gap-8 pt-8 text-[12px] text-[#818181]">
        <span>Privacy Policy</span>
        <span>Terms of Use</span>
        <span>FAQs</span>
      </footer>
    </div>
  );
}
