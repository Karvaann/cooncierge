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
  suffixIcon?: React.ReactNode;
}

const FilterInputShell: React.FC<FilterInputShellProps> = ({
  value,
  placeholder,
  onClick,
  children,
  onClear,
  className = "",
  suffixIcon,
}) => {
  return (
    <div
      className={`w-full
                 border border-gray-300 hover:border-green-200
                 rounded-sm px-[12px]  min-h-[40px]
                 flex items-center flex-nowrap gap-1 cursor-pointer overflow-hidden ${className}`}
      onClick={onClick}
    >
      {children ? (
        children
      ) : (
        <span
          className={`truncate ${
            value ? "text-black" : "text-[#9CA3AF] text-[14px] font-normal"
          }`}
        >
          {value || placeholder}
        </span>
      )}

      {suffixIcon ?? (
        <MdOutlineKeyboardArrowDown className="ml-auto text-gray-400 pointer-events-none" />
      )}
    </div>
  );
};

export default FilterInputShell;
