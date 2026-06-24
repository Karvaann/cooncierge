"use client";

import { useEffect, useState } from "react";

function useValidationShake(active: boolean, shakeKey: number, durationMs: number) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!active || shakeKey === 0) {
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    const timeout = window.setTimeout(() => setIsAnimating(false), durationMs);
    return () => window.clearTimeout(timeout);
  }, [active, shakeKey, durationMs]);

  return isAnimating;
}

export function useInputValidationShake(active: boolean, shakeKey = 0) {
  const isAnimating = useValidationShake(active, shakeKey, 500);
  return isAnimating;
}

export function useInputValidationShakeClass(active: boolean, shakeKey = 0) {
  const isAnimating = useValidationShake(active, shakeKey, 500);
  return isAnimating ? "animate-auth-validation-error" : "";
}

export function useTextValidationShake(active: boolean, shakeKey = 0) {
  const isAnimating = useValidationShake(active, shakeKey, 500);
  return isAnimating ? "animate-auth-validation-error-text" : "";
}

export function shouldPlayValidationShake(active: boolean, shakeKey = 0) {
  return active && shakeKey > 0;
}
