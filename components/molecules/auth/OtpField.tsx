import OTPInput from "react-otp-input";
import { allowOnlyNumbers } from "@/utils/inputValidators";
import { shouldPlayValidationShake } from "@/components/atoms/auth/useValidationShake";

interface OtpFieldProps {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  errorShakeKey?: number;
}

function handleOtpKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];

  if (allowedKeys.includes(event.key)) {
    return;
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

export default function OtpField({ value, onChange, hasError, errorShakeKey = 0 }: OtpFieldProps) {
  const shouldShake = shouldPlayValidationShake(hasError, errorShakeKey);
  const shakeClass = shouldShake ? "animate-auth-validation-error" : "";

  return (
    <OTPInput
      key={shouldShake ? `otp-shake-${errorShakeKey}` : "otp-stable"}
      value={value}
      onChange={(nextValue) => onChange(allowOnlyNumbers(nextValue))}
      numInputs={6}
      renderSeparator={<span />}
      containerStyle={{ gap: "4px" }}
      inputStyle={{
        width: "38px",
        height: "38px",
        fontSize: "15px",
        fontWeight: "400",
        borderRadius: "6px",
        border: hasError ? "1px solid #EB382B" : "1px solid #E2E1E1",
        textAlign: "center",
        background: "#FFF",
        lineHeight: "24px",
      }}
      renderInput={(props) => (
        <input
          {...props}
          className={[props.className, shakeClass].filter(Boolean).join(" ")}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          onKeyDown={(event) => {
            handleOtpKeyDown(event);
            props.onKeyDown?.(event);
          }}
        />
      )}
    />
  );
}
