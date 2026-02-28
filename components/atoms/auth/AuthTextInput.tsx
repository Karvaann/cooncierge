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
        <span className="mb-1 block text-left text-[14px] font-medium text-gray-700">
          {label}
        </span>
      ) : null}
      <input
        {...props}
        className={[
          "w-full rounded-[6px] border border-[#E2E1E1] px-[11px] py-[10px] text-[14px] font-normal",
          "hover:border-[#AFD7D2] focus:outline-none focus:ring-1 focus:ring-[#AFD7D2]",
          className,
        ].join(" ")}
      />
    </label>
  );
}
