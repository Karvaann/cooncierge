import type { InputHTMLAttributes } from "react";

interface AuthTextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function AuthTextInput({
  label,
  className = "",
  ...props
}: AuthTextInputProps) {
  return (
    <label className="block w-full">
      {label ? (
        <span className="mb-1 block text-left text-[12px] font-[500] text-[#414141]">
          {label}
        </span>
      ) : null}
      <input
        {...props}
        className={[
          "h-9 w-full rounded-[13px] border border-[#E2E1E1] px-[12px] text-[12px] font-normal",
          "placeholder:text-[#A5ADB8] transition-[border-color,box-shadow] hover:border-[#C6AEDE] hover:shadow-[0_2px_8px_0_rgba(198,174,222,0.25)] focus:border-[#7135AD] focus:outline-none focus:ring-1 focus:ring-[#7135AD]",
          className,
        ].join(" ")}
      />
    </label>
  );
}
