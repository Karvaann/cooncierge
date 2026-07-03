import Image from "next/image";
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
      <Image
        src="/icons/service-icons/circle-x.svg"
        alt=""
        width={18}
        height={18}
        className="h-[18px] w-[18px] shrink-0 object-contain"
        unoptimized
        aria-hidden
      />
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
    <div className="h-[24px] pt-[6px]" aria-live="polite">
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
    "auth-input box-border h-[40px] w-full rounded-[13px] border px-[12px] text-[12px] font-normal",
    hasError ? "auth-input-error border-[#EB382B]" : "border border-[#E2E1E1]",
    "placeholder:text-[#9CA3AF]",
    className,
  ].join(" ");
}
