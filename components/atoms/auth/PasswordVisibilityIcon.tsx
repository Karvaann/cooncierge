import Image from "next/image";

interface PasswordVisibilityIconProps {
  visible: boolean;
  className?: string;
}

export default function PasswordVisibilityIcon({
  visible,
  className = "h-[18px] w-[18px] object-contain",
}: PasswordVisibilityIconProps) {
  return (
    <Image
      src={
        visible
          ? "/icons/service-icons/eye-check.svg"
          : "/icons/service-icons/eye-off.svg"
      }
      alt=""
      width={18}
      height={18}
      className={className}
      unoptimized
      aria-hidden
    />
  );
}
