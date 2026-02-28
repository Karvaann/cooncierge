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
        "h-10 w-full rounded-md bg-[#0D4B37] px-4 text-[14px] font-medium text-white shadow-xl",
        "transition-colors duration-200 hover:bg-[#125E45]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}
