import type { PasswordChecks } from "@/app/login/types";

interface PasswordRulesProps {
  checks: PasswordChecks;
}

export default function PasswordRules({ checks }: PasswordRulesProps) {
  return (
    <div className="mt-3 space-y-0.5 text-[13px] font-light">
      <p className={checks.hasMinLength ? "text-green-600" : "text-[#818181]"}>
        Note: Password should consist of minimum 8 characters
      </p>
      <p className={checks.hasUpper ? "text-green-600" : "text-[#818181]"}>
        • Minimum 1 uppercase letter
      </p>
      <p className={checks.hasLower ? "text-green-600" : "text-[#818181]"}>
        • Minimum 1 lowercase letter
      </p>
      <p className={checks.hasNumber ? "text-green-600" : "text-[#818181]"}>
        • Minimum 1 number
      </p>
      <p className={checks.hasSpecial ? "text-green-600" : "text-[#818181]"}>
        • Minimum 1 special character
      </p>
    </div>
  );
}
