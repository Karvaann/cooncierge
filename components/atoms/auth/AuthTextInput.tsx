import type { InputHTMLAttributes } from "react";
import { AuthFieldError, authFieldLabelClassName, getAuthInputClassName } from "@/components/atoms/auth/AuthFieldError";
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
        <span className={authFieldLabelClassName}>
          {label}
        </span>
      ) : null}
      <div
        key={shouldShake ? `input-shake-${errorShakeKey}` : "input-stable"}
        className={[
          "auth-validation-shake-slot",
          shouldShake ? "animate-auth-validation-error-shake" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          {...props}
          aria-invalid={hasError}
          className={getAuthInputClassName(hasError, [
            className,
            shouldShake ? "animate-auth-validation-error-border" : "",
          ]
            .filter(Boolean)
            .join(" "))}
        />
      </div>
      {error ? <AuthFieldError message={error} shakeKey={errorShakeKey} /> : null}
    </label>
  );
}
