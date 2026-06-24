import Image from "next/image";

interface LoginBackgroundProps {
  compact?: boolean;
}

export default function LoginBackground({ compact = false }: LoginBackgroundProps) {
  return (
    <div className={compact ? "relative aspect-[1121/720] w-full" : "absolute inset-0"}>
      <Image
        src="/login/left_panel.svg"
        alt="Travel operations dashboard preview"
        fill
        priority={!compact}
        sizes={compact ? "100vw" : "65vw"}
        className="!h-[calc(100%+20px)] object-cover"
        style={{top: '-20px'}}
      />
    </div>
  );
}
