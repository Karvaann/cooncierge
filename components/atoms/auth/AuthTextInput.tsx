import type { InputHTMLAttributes } from "react";
import { AuthFieldError, getAuthInputClassName } from "@/components/atoms/auth/AuthFieldError";
import { shouldPlayValidationShake } from "@/components/atoms/auth/useValidationShake";

interface AuthTextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  invalid?: boolean;
  error?: string;
  errorShakeKey?: number;
}

export default function AuthTextInput({
  label,
  invalid = false,
  error,
  errorShakeKey = 0,
  className = "",
  ...props
}: AuthTextInputProps) {
  const hasError = invalid || Boolean(error);
  const shouldShake = shouldPlayValidationShake(hasError, errorShakeKey);

  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-1 block text-left text-[12px] font-[500] text-[#414141]">
          {label}
        </span>
      ) : null}
      <input
        {...props}
        key={shouldShake ? `input-shake-${errorShakeKey}` : "input-stable"}
        aria-invalid={hasError}
        className={getAuthInputClassName(hasError, [
          className,
          shouldShake ? "animate-auth-validation-error" : "",
        ]
          .filter(Boolean)
          .join(" "))}
      />
      {error ? <AuthFieldError message={error} shakeKey={errorShakeKey} /> : null}
    </label>
  );
}
