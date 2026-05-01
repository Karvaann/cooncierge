import type { ButtonHTMLAttributes } from "react";

interface AuthPrimaryButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export default function AuthPrimaryButton({
  label,
  className = "",
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button
      {...props}
      className={[
        "h-11 w-full rounded-[10px] bg-[#7135AD] px-4 text-[14px] font-semibold text-white shadow-[0_12px_24px_rgba(13,75,55,0.18)]",
        "transition-colors duration-200 hover:bg-[#7135AD]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}
