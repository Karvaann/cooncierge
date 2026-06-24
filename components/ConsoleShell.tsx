"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import HeaderSkeleton from "@/components/skeletons/HeaderSkeleton";
import RoutePrefetcher from "@/components/RoutePrefetcher";
import ConsoleMainSurface from "@/components/templates/ConsoleMainSurface";
import {
  SIDEBAR_WIDTH_OPEN,
} from "@/components/navigation/menuItems";

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
    <div className="min-h-screen bg-[#F9F9F9] text-slate-900">
      <RoutePrefetcher />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div
        className="console-shell-content min-h-screen min-w-0 overflow-x-hidden transition-[padding-left] duration-300 ease-out"
        data-sidebar-collapsed={isSidebarOpen ? undefined : "true"}
        style={{ paddingLeft: isSidebarOpen ? SIDEBAR_WIDTH_OPEN : 0 }}
      >
        <div className="console-ui-scale">
          <Header
            isSidebarOpen={isSidebarOpen}
            onSidebarExpand={() => setIsSidebarOpen(true)}
          />
          <ConsoleMainSurface>
            {children}
          </ConsoleMainSurface>
        </div>
      </div>
    </div>
  );
}
