import { useTextValidationShake } from "@/components/atoms/auth/useValidationShake";

interface AuthFieldErrorProps {
  message: string;
  className?: string;
  shakeKey?: number;
}

export function AuthFieldError({ message, className = "", shakeKey = 0 }: AuthFieldErrorProps) {
  const shakeClass = useTextValidationShake(true, shakeKey);

  return (
    <p
      className={[
        "mt-[6px] flex items-center gap-[6px] text-[12px] font-[400] leading-[14px] text-[#EB382B]",
        shakeClass,
        className,
      ].join(" ")}
    >
      <span
        className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full bg-[#EB382B]"
        aria-hidden
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M2 2L6 6M6 2L2 6"
            stroke="white"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>{message}</span>
    </p>
  );
}

export function AuthFieldErrorSlot({
  message,
  jiggleKey = 0,
}: {
  message: string | null;
  jiggleKey?: number;
}) {
  return (
    <div className="h-[20px] pt-[6px]" aria-live="polite">
      {message ? (
        <AuthFieldError
          message={message}
          className="!mt-0"
          shakeKey={jiggleKey}
        />
      ) : null}
    </div>
  );
}

export function getAuthInputClassName(hasError: boolean, className = "") {
  return [
    "h-[40px] w-full rounded-[13px] border px-[12px] text-[12px] font-normal",
    "placeholder:text-[#9CA3AF] transition-[border-color,box-shadow]",
    hasError
      ? "border-[#EB382B] focus:border-[#EB382B] focus:outline-none focus:ring-1 focus:ring-[#EB382B]"
      : "border-[#E2E1E1] hover:border-[#C6AEDE] hover:shadow-[0_2px_8px_0_rgba(198,174,222,0.25)] focus:border-[#7135AD] focus:outline-none focus:ring-1 focus:ring-[#7135AD]",
    className,
  ].join(" ");
}
