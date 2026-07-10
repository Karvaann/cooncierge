import type { InputHTMLAttributes } from "react";
import { AuthFieldError, authFieldLabelClassName, getAuthInputClassName } from "@/components/atoms/auth/AuthFieldError";
import { shouldPlayValidationShake } from "@/components/atoms/auth/useValidationShake";
import PasswordVisibilityIcon from "@/components/atoms/auth/PasswordVisibilityIcon";

interface AuthPasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  visible: boolean;
  onToggleVisible: () => void;
  invalid?: boolean;
  error?: string;
  errorShakeKey?: number;
  disablePaste?: boolean;
}

export default function AuthPasswordInput({
  label,
  visible,
  onToggleVisible,
  invalid = false,
  error,
  errorShakeKey = 0,
  disablePaste = false,
  className = "",
  onPaste,
  ...props
}: AuthPasswordInputProps) {
  const hasError = invalid || Boolean(error);
  const shouldShake = shouldPlayValidationShake(hasError, errorShakeKey);

  return (
    <label className="block w-full">
      <span className={authFieldLabelClassName}>
        {label}
      </span>
      <div
        key={shouldShake ? `password-shake-${errorShakeKey}` : "password-stable"}
        className={[
          "auth-validation-shake-slot relative",
          shouldShake ? "animate-auth-validation-error-shake" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          {...props}
          type={visible ? "text" : "password"}
          aria-invalid={hasError}
          onPaste={(event) => {
            if (disablePaste) {
              event.preventDefault();
              return;
            }
            onPaste?.(event);
          }}
          className={getAuthInputClassName(hasError, [
            className,
            "auth-password-input",
            "auth-input-with-trailing-icon",
            shouldShake ? "animate-auth-validation-error-border" : "",
          ]
            .filter(Boolean)
            .join(" "))}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full cursor-pointer text-gray-500 hover:text-gray-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <PasswordVisibilityIcon visible={visible} />
        </button>
      </div>
      {error ? <AuthFieldError message={error} shakeKey={errorShakeKey} /> : null}
    </label>
  );
}
