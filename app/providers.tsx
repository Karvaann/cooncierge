"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { ToastProvider } from "@/context/ToastContext";
import { LimitlessDraftProvider } from "@/context/LimitlessDraftContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <LoadingProvider>
          <LimitlessDraftProvider>{children}</LimitlessDraftProvider>
        </LoadingProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
