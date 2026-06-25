interface SidebarNavIconProps {
  src: string;
  active?: boolean;
  className?: string;
}

export default function SidebarNavIcon({
  src,
  active = false,
  className = "",
}: SidebarNavIconProps) {
  return (
    <span
      aria-hidden
      className={`sidebar-nav-icon shrink-0 transition-colors duration-200 ${
        active ? "bg-[#7135AD]" : "bg-[#818181]"
      } ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        maskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
    />
  );
}
