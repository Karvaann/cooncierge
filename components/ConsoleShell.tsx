"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import HeaderSkeleton from "@/components/skeletons/HeaderSkeleton";
import RoutePrefetcher from "@/components/RoutePrefetcher";
import ConsoleMainSurface from "@/components/templates/ConsoleMainSurface";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-slate-900">
      <RoutePrefetcher />
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div
        className={`min-h-screen transition-[padding-left] duration-300 ease-out ${
          isSidebarOpen ? "pl-48" : "pl-[74px]"
        }`}
      >
        <Header isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <ConsoleMainSurface>
          {children}
        </ConsoleMainSurface>
      </div>
    </div>
  );
}
