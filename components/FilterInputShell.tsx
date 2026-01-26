"use client";

import React from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { IoClose } from "react-icons/io5";

interface FilterInputShellProps {
  value?: string;
  placeholder: string;
  onClick: (e: React.MouseEvent) => void;
  onClear?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  className?: string;
}

const FilterInputShell: React.FC<FilterInputShellProps> = ({
  value,
  placeholder,
  onClick,
  children,
  onClear,
  className = "",
}) => {
  return (
    <div
      className={`w-[14.75rem] min-h-[2.4rem] -mt-0.5
                 border border-gray-300 hover:border-green-200
                 rounded-sm px-2.5 py-3
                 flex items-center flex-wrap gap-1 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children ? (
        children
      ) : (
        <span
          className={`${
            value ? "text-black" : "text-[#9CA3AF] text-[14px] font-normal"
          }`}
        >
          {value || placeholder}
        </span>
      )}

      {value && typeof onClear === "function" ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear?.(e);
          }}
          aria-label="Clear"
          className="ml-auto py-1"
        >
          <IoClose className="text-[#818181]" />
        </button>
      ) : (
        <MdOutlineKeyboardArrowDown className="ml-auto text-gray-400 pointer-events-none" />
      )}
    </div>
  );
};

export default FilterInputShell;
