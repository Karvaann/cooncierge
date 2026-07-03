"use client";

import { useEffect, useState } from "react";

export const OVERLAY_ANIMATION_MS = 450;

export function useOverlayAnimation(isOpen: boolean, durationMs = OVERLAY_ANIMATION_MS) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);

      let frame1 = 0;
      let frame2 = 0;

      frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => setIsVisible(true));
      });

      return () => {
        window.cancelAnimationFrame(frame1);
        window.cancelAnimationFrame(frame2);
      };
    }

    setIsVisible(false);
    const timer = window.setTimeout(() => setShouldRender(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, isOpen]);

  return { shouldRender, isVisible, durationMs };
}

export const overlayTransitionClass =
  "transition-[opacity,transform] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

export const overlayBackdropTransitionClass =
  "transition-opacity duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

export const overlaySlideTransitionClass =
  "transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform";
