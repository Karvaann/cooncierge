"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import HeaderSkeleton from "@/components/skeletons/HeaderSkeleton";
import RoutePrefetcher from "@/components/RoutePrefetcher";
import ConsoleMainSurface from "@/components/templates/ConsoleMainSurface";
import SidebarLogoBranding from "@/components/navigation/SidebarLogoBranding";
import { SIDEBAR_WIDTH_OPEN } from "@/components/navigation/menuItems";

const Sidebar = dynamic(() => import("@/components/Sidebar"), {
  loading: () => <SidebarSkeleton />,
  ssr: false,
});

const Header = dynamic(() => import("@/components/Header"), {
  loading: () => <HeaderSkeleton />,
  ssr: false,
});

interface ConsoleShellProps {
  children: React.ReactNode;
}

export default function ConsoleShell({ children }: ConsoleShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div
      className="min-h-screen bg-[#F9F9F9] text-slate-900"
      style={{ ["--sidebar-width-open" as string]: `${SIDEBAR_WIDTH_OPEN}px` }}
    >
      <RoutePrefetcher />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div
        className={`sidebar-logo-float fixed z-[60] origin-top-left ${
          isSidebarOpen ? "is-sidebar-open" : "is-sidebar-collapsed"
        }`}
      >
        <SidebarLogoBranding
          isSidebarOpen={isSidebarOpen}
          onExpand={() => setIsSidebarOpen(true)}
          onCollapse={() => setIsSidebarOpen(false)}
        />
      </div>
      <div
        className="console-shell-content min-h-screen min-w-0 overflow-x-hidden transition-[padding-left] duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        data-sidebar-collapsed={isSidebarOpen ? undefined : "true"}
        style={{
          paddingLeft: isSidebarOpen ? SIDEBAR_WIDTH_OPEN : 0,
          ["--sidebar-width-open" as string]: `${SIDEBAR_WIDTH_OPEN}px`,
        }}
      >
        <div className="console-ui-scale">
          <Header isSidebarOpen={isSidebarOpen} />
          <ConsoleMainSurface>
            {children}
          </ConsoleMainSurface>
        </div>
      </div>
    </div>
  );
}
