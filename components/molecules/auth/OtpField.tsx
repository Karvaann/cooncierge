import OTPInput from "react-otp-input";

interface OtpFieldProps {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
}

export default function OtpField({ value, onChange, hasError }: OtpFieldProps) {
  return (
    <OTPInput
      value={value}
      onChange={onChange}
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
      renderInput={(props) => <input {...props} />}
    />
  );
}
