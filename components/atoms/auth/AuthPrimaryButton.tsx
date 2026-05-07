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
  const showSignInArrow = label === "Sign In";

  return (
    <button
      {...props}
      className={[
        "group flex h-[38px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#7135AD] px-4 text-[12px] font-[500] text-white shadow-[0_12px_24px_rgba(13,75,55,0.18)]",
        "transition-colors duration-200 ease-in-out hover:bg-[#662B9F]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    >
      <span>{label}</span>
      {showSignInArrow ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden
          className="transition-transform duration-200 ease-in-out group-hover:translate-x-1"
        >
          <path
            d="M0.75 3.75H11.25M8.25 0.75L11.25 3.75L8.25 6.75"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  );
}
