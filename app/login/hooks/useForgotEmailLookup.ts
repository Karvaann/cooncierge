"use client";

import { useEffect, useState } from "react";
import { AuthApi } from "@/services/authApi";
import type { ResetEmailFlow } from "@/app/login/types";

const DEBOUNCE_MS = 900;

function isEmailLookupReady(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed.includes("@")) {
    return false;
  }

  const [localPart, domainPart] = trimmed.split("@");
  return Boolean(localPart && domainPart && domainPart.length >= 2);
}

export function useForgotEmailLookup(email: string, enabled: boolean): ResetEmailFlow {
  const [flow, setFlow] = useState<ResetEmailFlow>("idle");

  useEffect(() => {
    if (!enabled) {
      setFlow("idle");
      return;
    }

    if (!isEmailLookupReady(email)) {
      setFlow("idle");
      return;
    }

    setFlow("idle");

    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      setFlow("checking");

      void (async () => {
        try {
          const result = await AuthApi.checkResetEmail(
            { email: email.trim() },
            { signal: controller.signal },
          );

          if (controller.signal.aborted) {
            return;
          }

          if (result.found && result.flow === "otp") {
            setFlow("otp");
            return;
          }

          if (result.found && result.flow === "admin_request") {
            setFlow("admin_request");
            return;
          }

          setFlow("not_found");
        } catch {
          if (controller.signal.aborted) {
            return;
          }

          setFlow("not_found");
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [email, enabled]);

  return flow;
}
