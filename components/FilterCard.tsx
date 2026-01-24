"use client";

import React, { useId, useMemo, useState } from "react";
import { RiRefreshLine } from "react-icons/ri";
import { CiFilter } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import Button from "@/components/Button";

export type FilterCardOption = {
  value: string;
  label: string;
  disabled?: boolean;
  count?: number;
};

export type FilterCardMode = "multi" | "single";

export interface FilterCardProps {
  options: FilterCardOption[];

  /** Controlled selection. If provided, component becomes controlled. */
  selectedValues?: string[];
  /** Uncontrolled initial selection (used only when selectedValues is not provided). */
  defaultSelectedValues?: string[];
  /** Called whenever selection changes (controlled/uncontrolled). */
  onSelectionChange?: (nextSelected: string[]) => void;

  /** Called when user presses Apply. */
  onApply?: (selected: string[]) => void;
  /** Called when user presses Reset (after internal reset). */
  onReset?: () => void;
  /** Optional close button in header. */
  onClose?: () => void;

  mode?: FilterCardMode;

  showSearch?: boolean; // kept for API compatibility but currently ignored
  searchPlaceholder?: string;
  emptyText?: string;

  /** UI */
  className?: string;
  listMaxHeightClassName?: string;
  showSelectedCount?: boolean;
  applyText?: string;
}

const normalizeSelection = (values: string[] | undefined) =>
  Array.from(new Set((values ?? []).filter(Boolean)));

const FilterCard: React.FC<FilterCardProps> = ({
  options,
  selectedValues,
  defaultSelectedValues,
  onSelectionChange,
  onApply,
  onReset,
  onClose,
  mode = "multi",
  showSearch = false,
  searchPlaceholder = "Search...",
  emptyText = "No options",
  className = "",
  listMaxHeightClassName = "max-h-64",
  showSelectedCount = true,
  applyText = "Apply",
}) => {
  const componentId = useId();
  const isControlled = Array.isArray(selectedValues);

  const [internalSelected, setInternalSelected] = useState<string[]>(() =>
    normalizeSelection(defaultSelectedValues)
  );

  const effectiveSelected = normalizeSelection(
    isControlled ? selectedValues : internalSelected
  );

  const setSelected = (next: string[]) => {
    const normalized = normalizeSelection(next);
    if (!isControlled) setInternalSelected(normalized);
    onSelectionChange?.(normalized);
  };

  // Search was intentionally removed/commented out — keep simple list for now
  const filteredOptions = options;

  const toggle = (value: string) => {
    if (mode === "single") {
      setSelected([value]);
      return;
    }

    const exists = effectiveSelected.includes(value);
    setSelected(
      exists
        ? effectiveSelected.filter((v) => v !== value)
        : [...effectiveSelected, value]
    );
  };

  const handleReset = () => {
    setSelected([]);
    onReset?.();
  };

  const handleApply = () => {
    onApply?.(effectiveSelected);
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-xl w-[16.5rem] ${className}`}
      role="dialog"
      aria-label="filter-card"
    >
      {/* Options */}
      <div className={`overflow-auto ${listMaxHeightClassName}`}>
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-6 text-center text-[13px] text-gray-500">
            {emptyText}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredOptions.map((opt, idx) => {
              const checked = effectiveSelected.includes(opt.value);
              const inputId = `${componentId}-${idx}-${opt.value}`;

              return (
                <label
                  key={opt.value}
                  htmlFor={inputId}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 ${
                    opt.disabled ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <input
                    id={inputId}
                    type={mode === "single" ? "radio" : "checkbox"}
                    name={mode === "single" ? componentId : undefined}
                    checked={checked}
                    disabled={opt.disabled}
                    onChange={() => {
                      if (opt.disabled) return;
                      toggle(opt.value);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-[#0D4B37] focus:ring-[#0D4B37]"
                  />

                  <span className="text-[13px] text-gray-800 flex-1">
                    {opt.label}
                  </span>

                  {typeof opt.count === "number" && (
                    <span className="text-[12px] text-gray-500">
                      {opt.count}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleReset}
            className="w-9 h-9 border border-gray-200 rounded-md flex items-center justify-center hover:bg-gray-50"
            aria-label="Reset"
          >
            <RiRefreshLine className="text-gray-700" />
          </button>
        </div>

        <div>
          <Button
            text={applyText}
            onClick={handleApply}
            bgColor="bg-[#126ACB]"
            textColor="text-white"
            className="px-5 py-2 text-[13px]"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterCard;
