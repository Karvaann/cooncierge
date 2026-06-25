"use client";

import { useCallback, useState } from "react";
import type { SlideStripTone } from "@/components/atoms/auth/SlideStripNotification";

export function useSlideStripNotification(autoHideMs = 4000) {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<SlideStripTone>("success");

  const notify = useCallback((text: string, notifyTone: SlideStripTone = "success") => {
    setTone(notifyTone);
    setMessage(text);
  }, []);

  const clear = useCallback(() => {
    setMessage(null);
  }, []);

  return {
    message,
    tone,
    autoHideMs,
    notify,
    clear,
  };
}
