"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ConsoleShell from "@/components/ConsoleShell";
import RoutePrefetcher from "@/components/RoutePrefetcher";
import Header from "@/components/Header";

interface ConsoleLayoutProps {
  children: ReactNode;
}

export default function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const pathname = usePathname() || "";
  const hideShell = pathname.startsWith("/settings");

  if (hideShell) {
    return (
      <div className="min-h-screen w-full bg-slate-100">
        <RoutePrefetcher />
        <Header isOpen={false} />

        {/* 🔥 FULL WIDTH WRAPPER */}
        <main className="w-full min-h-[calc(100vh-64px)] bg-slate-100">
          {children}
        </main>
      </div>
    );
  }

  return <ConsoleShell>{children}</ConsoleShell>;
}
