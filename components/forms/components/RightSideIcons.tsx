"use client";

import React from "react";
import { LuEye } from "react-icons/lu";
import { FiMinus } from "react-icons/fi";
import { GoPlus } from "react-icons/go";

interface RightSideIconsProps {
  value: string;
  disabled?: boolean;
  onClear?: () => void;
  onClickPlus?: () => void;
  onClickView?: () => void;
}

const RightSideIcons: React.FC<RightSideIconsProps> = ({
  value,
  disabled = false,
  onClear,
  onClickPlus,
  onClickView,
}) => {
  const isEmpty = (value ?? "").trim() === "";

  return (
    <div className="flex items-center gap-2 ml-auto">
      {isEmpty && (
        <button
          type="button"
          onClick={onClickPlus}
          className="w-6.5 h-6.5 flex items-center bg-white justify-center border border-[#7135AD] rounded-md transition-colors"
          disabled={disabled}
        >
          <GoPlus size={16} className="text-[#7135AD]" />
        </button>
      )}

      {!isEmpty && (
        <>
          <button
            type="button"
            onClick={onClickView}
            className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <LuEye size={17} className="text-gray-400" />
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="w-6.5 h-6.5 flex items-center justify-center border border-[#7135AD] bg-white rounded-md cursor-pointer transition-colors"
          >
            <FiMinus size={16} className="text-[#7135AD]" />
          </button>
        </>
      )}
    </div>
  );
};

export default RightSideIcons;