import OTPInput from "react-otp-input";
import { allowOnlyNumbers } from "@/utils/inputValidators";
import { shouldPlayValidationShake } from "@/components/atoms/auth/useValidationShake";

const OTP_INPUT_SIZE = 40;
const OTP_INPUT_GAP = 5;
const OTP_INPUT_COUNT = 6;

export const OTP_ROW_WIDTH_PX =
  OTP_INPUT_COUNT * OTP_INPUT_SIZE + (OTP_INPUT_COUNT - 1) * OTP_INPUT_GAP;

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

  return (
    <div
      key={shouldShake ? `otp-shake-${errorShakeKey}` : "otp-stable"}
      className={[
        "w-full overflow-visible",
        shouldShake ? "animate-auth-validation-error-shake" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <OTPInput
        value={value}
        onChange={(nextValue) => onChange(allowOnlyNumbers(nextValue))}
        numInputs={OTP_INPUT_COUNT}
        skipDefaultStyles
        containerStyle={{
          display: "flex",
          gap: `${OTP_INPUT_GAP}px`,
          width: `${OTP_ROW_WIDTH_PX}px`,
        }}
        inputStyle={{
          width: `${OTP_INPUT_SIZE}px`,
          height: `${OTP_INPUT_SIZE}px`,
          boxSizing: "border-box",
          flexShrink: 0,
          fontSize: "15px",
          fontWeight: "400",
          borderRadius: "6px",
          textAlign: "center",
          background: "#FFF",
          lineHeight: "24px",
          padding: 0,
        }}
        renderInput={(props) => (
          <input
            {...props}
            className={[
              "auth-otp-input",
              hasError ? "auth-otp-input-error" : "",
              props.className,
              shouldShake ? "animate-auth-validation-error-border" : "",
            ]
              .filter(Boolean)
              .join(" ")}
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
    </div>
  );
}
