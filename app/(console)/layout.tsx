"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import ConsoleShell from "@/components/ConsoleShell";
import RoutePrefetcher from "@/components/RoutePrefetcher";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

interface ConsoleLayoutProps {
  children: ReactNode;
}

export default function ConsoleLayout({ children }: ConsoleLayoutProps) {
  const pathname = usePathname() || "";
  const hideShell = pathname.startsWith("/settings");
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen w-full bg-slate-100" />;
  }

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
