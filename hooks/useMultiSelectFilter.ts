"use client";

import { useCallback, useMemo, useRef, useState } from "react";

function isNarrowedSelection<T extends string>(
  values: readonly T[],
  allValues: readonly T[],
) {
  if (values.length !== allValues.length) return true;
  return !allValues.every((value) => values.includes(value));
}

/**
 * Manages pending vs applied state for multi-select column filters.
 * Pending values are edited in the dropdown; applied values drive table filtering.
 */
export function useMultiSelectFilter<T extends string>(
  defaultValues: readonly T[],
) {
  const allValues = useMemo(() => [...defaultValues] as T[], [defaultValues]);

  const [applied, setApplied] = useState<T[]>(() => [...defaultValues] as T[]);
  const [pending, setPending] = useState<T[]>(() => [...defaultValues] as T[]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const togglePending = useCallback((value: T) => {
    setPending((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  }, []);

  const selectAllPending = useCallback(
    () => setPending([...allValues]),
    [allValues],
  );

  const deselectAllPending = useCallback(() => setPending([]), []);

  const resetPending = useCallback(() => {
    setPending(applied);
  }, [applied]);

  const applyPending = useCallback(() => {
    setApplied([...pendingRef.current]);
  }, []);

  const syncPendingFromApplied = useCallback(() => {
    setPending(applied);
  }, [applied]);

  /** True when applied selection differs from “all selected”. */
  const isActive = useMemo(
    () => isNarrowedSelection(applied, allValues),
    [applied, allValues],
  );

  /** True when pending (in-dropdown) selection differs from “all selected”. */
  const isPendingActive = useMemo(
    () => isNarrowedSelection(pending, allValues),
    [pending, allValues],
  );

  return {
    allValues,
    applied,
    pending,
    isActive,
    isPendingActive,
    setApplied,
    setPending,
    togglePending,
    selectAllPending,
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

/** @deprecated Prefer TableFilterIcon — kept for call sites that only need a class string. */
export function getTableFilterIconClassName(isActive: boolean) {
  return isActive
    ? "inline h-3 w-3 shrink-0 !text-[#7135AD]"
    : "inline h-3 w-3 shrink-0 !text-[#818181] hover:!text-[#7135AD]";
}
