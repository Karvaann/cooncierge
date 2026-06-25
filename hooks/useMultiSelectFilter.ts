"use client";

import { useCallback, useState } from "react";

/**
 * Manages pending vs applied state for multi-select column filters.
 * Pending values are edited in the dropdown; applied values drive table filtering.
 */
export function useMultiSelectFilter<T extends string>(
  defaultValues: readonly T[],
) {
  const allValues = [...defaultValues] as T[];

  const [applied, setApplied] = useState<T[]>(allValues);
  const [pending, setPending] = useState<T[]>(allValues);

  const togglePending = useCallback((value: T) => {
    setPending((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  }, []);

  const deselectAllPending = useCallback(() => setPending([]), []);

  const resetPending = useCallback(() => {
    setPending(applied);
  }, [applied]);

  const applyPending = useCallback(() => {
    setApplied(pending);
  }, [pending]);

  const syncPendingFromApplied = useCallback(() => {
    setPending(applied);
  }, [applied]);

  return {
    allValues,
    applied,
    pending,
    setApplied,
    setPending,
    togglePending,
    deselectAllPending,
    resetPending,
    applyPending,
    syncPendingFromApplied,
  };
}

/** Returns whether a row value passes an applied multi-select filter. */
export function passesMultiSelectFilter<T extends string>(
  applied: T[],
  allValues: readonly T[],
  itemValue: T,
): boolean {
  if (applied.length === 0) return false;
  if (applied.length >= allValues.length) return true;
  return applied.includes(itemValue);
}
