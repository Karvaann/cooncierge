"use client";

import { useEffect, useRef, useState } from "react";

export type SlideStripTone = "success" | "error" | "info";

export interface SlideStripNotificationProps {
  message: string | null;
  tone?: SlideStripTone;
  onClose?: () => void;
  autoHideMs?: number;
}

const toneClasses: Record<SlideStripTone, string> = {
  success: "border-[#C6EED3] bg-[#EEF9F1] text-[#1F7A3D]",
  info: "border-[#C6EED3] bg-[#EEF9F1] text-[#1F7A3D]",
  error: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
};

function SuccessIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8L7 10L11 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SlideStripNotification({
  message,
  tone = "success",
  onClose,
  autoHideMs = 4000,
}: SlideStripNotificationProps) {
  const [activeMessage, setActiveMessage] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!message) {
      return;
    }

    setActiveMessage(message);
    setIsExiting(false);

    if (autoHideMs <= 0) {
      return;
    }

    const autoHideTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, autoHideMs);

    return () => window.clearTimeout(autoHideTimer);
  }, [message, autoHideMs]);

  useEffect(() => {
    if (!isExiting || !activeMessage) {
      return;
    }

    const exitTimer = window.setTimeout(() => {
      setActiveMessage(null);
      setIsExiting(false);
      onCloseRef.current?.();
    }, 280);

    return () => window.clearTimeout(exitTimer);
  }, [isExiting, activeMessage]);

  useEffect(() => {
    if (message || !activeMessage) {
      return;
    }

    setIsExiting(true);
  }, [message, activeMessage]);

  if (!activeMessage) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[2000] flex justify-center px-4 pt-4">
      <div
        role="status"
        aria-live="polite"
        className={[
          "auth-notification-scale pointer-events-auto inline-flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-[10px] border px-3.5 py-2 text-[12px] font-normal leading-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] lg:text-[14px] lg:leading-[20px]",
          toneClasses[tone],
          isExiting ? "animate-slide-strip-out" : "animate-slide-strip-in",
        ].join(" ")}
      >
        {(tone === "success" || tone === "info") && <SuccessIcon />}
        <span className="whitespace-nowrap font-[Poppins,sans-serif]">{activeMessage}</span>
      </div>
    </div>
  );
}
