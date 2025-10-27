"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import HeaderSkeleton from "@/components/skeletons/HeaderSkeleton";

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

  const mainStyle = useMemo(
    () => ({
      marginLeft: "64px",
      transition: "margin-left 0.5s ease-in-out",
      minHeight: "100vh",
    }),
    [isSidebarOpen]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Header isOpen={isSidebarOpen} />
      <main
        style={mainStyle}
        className="pt-6 pb-10 pr-6 pl-6 bg-slate-100 min-h-screen"
      >
        {children}
      </main>
    </div>
  );
}
