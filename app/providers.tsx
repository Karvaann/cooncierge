"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ToastProvider } from "@/context/ToastContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <LoadingProvider>{children}</LoadingProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
