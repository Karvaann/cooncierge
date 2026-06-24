"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FilterCard, { type FilterCardOption } from "./FilterCard";

interface FilterTriggerProps {
  options: FilterCardOption[];
  children?: React.ReactNode; // custom trigger content (icon/label)
  ariaLabel?: string;
  className?: string;
  /** initial selected values */
  defaultSelected?: string[];
  /** Called when user presses Apply */
  onApply?: (values: string[]) => void;
  /** Called on selection change */
  onSelectionChange?: (values: string[]) => void;
  /** single or multi select */
  mode?: "single" | "multi";
  /** align dropdown left or right to trigger */
  align?: "left" | "right";
}

const FilterTrigger: React.FC<FilterTriggerProps> = ({
  options,
  children,
  ariaLabel,
  className = "",
  defaultSelected = [],
  onApply,
  onSelectionChange,
  mode = "multi",
  align = "left",
}) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [selected, setSelected] = useState<string[]>(defaultSelected);

  useEffect(() => {
    if (!open) return;

    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const left =
        align === "left"
          ? rect.left + window.scrollX
          : rect.right + window.scrollX;
      const top = rect.bottom + window.scrollY;
      setPos({ left, top });
    }

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;

      // ✅ allow clicks inside trigger
      if (btnRef.current?.contains(target)) return;

      // ✅ allow clicks inside filter card
      if (cardRef.current?.contains(target)) return;

      setOpen(false);
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onEsc);
    window.addEventListener("resize", () => setOpen(false));
    return () => {
      window.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", () => setOpen(false));
    };
  }, [open, align]);

  useEffect(() => onSelectionChange?.(selected), [selected, onSelectionChange]);

  const handleApply = (vals: string[]) => {
    onApply?.(vals);
    setOpen(false);
  };

  const portal = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel ?? "Open filter"}
        onClick={() => setOpen((v) => !v)}
        className={className}
      >
        {children ?? <span className="inline w-3 h-3 text-white">🔽</span>}
      </button>

      {open && portal && pos
        ? createPortal(
            <div
              ref={cardRef}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                zIndex: 9999,
              }}
            >
              <FilterCard
                options={options}
                defaultSelectedValues={selected}
                selectedValues={selected}
                onSelectionChange={(next) => setSelected(next)}
                onApply={handleApply}
                mode={mode}
              />
            </div>,
            portal,
          )
        : null}
    </>
  );
};

export default FilterTrigger;
