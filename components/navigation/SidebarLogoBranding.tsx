"use client";

import Image from "next/image";
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
} from "react-icons/tb";

interface SidebarLogoBrandingProps {
  isSidebarOpen: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

const toggleButtonClassName =
  "sidebar-logo-toggle flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#818181] transition-colors hover:bg-[#F5F5F5] hover:text-[#414141]";

export default function SidebarLogoBranding({
  isSidebarOpen,
  onExpand,
  onCollapse,
}: SidebarLogoBrandingProps) {
  return (
    <div
      className={`sidebar-logo-slot pointer-events-auto flex items-center ${
        isSidebarOpen ? "is-sidebar-open" : "is-sidebar-collapsed"
      }`}
    >
      <Image
        src="/full_logo.svg"
        alt="ciergo"
        width={90}
        height={28}
        unoptimized
        className="sidebar-logo-image h-7 w-auto shrink-0 object-contain"
      />

      <span
        className={`sidebar-logo-spacer ${isSidebarOpen ? "is-open" : "is-collapsed"}`}
        aria-hidden
      />

      <button
        type="button"
        onClick={isSidebarOpen ? onCollapse : onExpand}
        className={toggleButtonClassName}
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isSidebarOpen ? (
          <TbLayoutSidebarLeftCollapse size={18} />
        ) : (
          <TbLayoutSidebarLeftExpand size={18} />
        )}
      </button>
    </div>
  );
}
