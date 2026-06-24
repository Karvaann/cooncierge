"use client";

import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import { FiCheck } from "react-icons/fi";
import { RiRefreshLine } from "react-icons/ri";

export type MultiSelectFilterOption<T extends string = string> = {
  value: T;
  label: string;
  iconSrc?: string;
  icon?: ComponentType<{ className?: string; size?: number }>;
};

export type MultiSelectFilterFooterAction = {
  label: string;
  onClick?: () => void;
  icon?: ComponentType<{ className?: string; size?: number }>;
};

type MultiSelectFilterDropdownProps<T extends string = string> = {
  options: MultiSelectFilterOption<T>[];
  pendingValues: T[];
  onToggle: (value: T) => void;
  onDeselectAll: () => void;
  onReset: () => void;
  onApply: () => void;
  className?: string;
  maxListHeightClassName?: string;
  footerAction?: MultiSelectFilterFooterAction;
};

function MultiSelectFilterDropdown<T extends string = string>({
  options,
  pendingValues,
  onToggle,
  onDeselectAll,
  onReset,
  onApply,
  className = "w-[300px]",
  maxListHeightClassName = "max-h-[320px]",
  footerAction,
}: MultiSelectFilterDropdownProps<T>) {
  const renderLeadingIcon = (opt: MultiSelectFilterOption<T>): ReactNode => {
    if (opt.icon) {
      const Icon = opt.icon;
      return (
        <Icon className="h-4 w-4 shrink-0 text-[#818181]" size={16} />
      );
    }

    if (opt.iconSrc) {
      return (
        <Image
          src={opt.iconSrc}
          alt={opt.label}
          width={18}
          height={18}
          className="h-[18px] w-[18px] shrink-0 object-contain"
          unoptimized
        />
      );
    }

    return (
      <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[#C9CCCE] bg-[#F3F3F3]" />
    );
  };

  return (
    <div
      className={`overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${className}`}
    >
      <div className={`overflow-y-auto ${maxListHeightClassName}`}>
        {options.map((opt, idx) => {
          const checked = pendingValues.includes(opt.value);

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left font-[Poppins,sans-serif] text-[13px] text-[#414141] transition-colors hover:bg-[#FAFAFA] ${
                idx < options.length - 1 ? "border-b border-[#ECECEC]" : ""
              }`}
            >
              <span
                className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border ${
                  checked
                    ? "border-[#7135AD] bg-[#7135AD] text-white"
                    : "border-[#D1D5DB] bg-white text-transparent"
                }`}
              >
                <FiCheck className="h-3 w-3" />
              </span>
              {renderLeadingIcon(opt)}
              <span className="min-w-0 flex-1">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {footerAction ? (
        <button
          type="button"
          onClick={footerAction.onClick}
          className="flex w-full items-center gap-3 border-t border-[#ECECEC] px-4 py-3 text-left font-[Poppins,sans-serif] text-[13px] text-[#414141] transition-colors hover:bg-[#FAFAFA]"
        >
          {footerAction.icon ? (
            <footerAction.icon className="h-[18px] w-[18px] shrink-0 text-[#818181]" />
          ) : null}
          <span>{footerAction.label}</span>
        </button>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-[#ECECEC] px-3 py-3">
        <button
          type="button"
          onClick={onDeselectAll}
          className="shrink-0 whitespace-nowrap rounded-[8px] border border-[#E2E1E1] px-3 py-1.5 font-[Poppins,sans-serif] text-[12px] font-medium text-[#818181] transition-colors hover:bg-[#FAFAFA]"
        >
          Deselect All
        </button>
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset filter"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#E2E1E1] text-[#818181] transition-colors hover:bg-[#FAFAFA]"
        >
          <RiRefreshLine size={15} />
        </button>
        <button
          type="button"
          onClick={onApply}
          className="shrink-0 whitespace-nowrap rounded-[10px] bg-[#7135AD] px-4 py-1.5 font-[Poppins,sans-serif] text-[12px] font-medium text-white transition-colors hover:bg-[#5C2B8E]"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export default MultiSelectFilterDropdown;
