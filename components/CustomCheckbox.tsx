"use client";

import React from "react";

export default function CustomCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  stopPropagation,
  labelClassName,
  wrapperClassName,
}: {
  id?: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  stopPropagation?: boolean;
  labelClassName?: string;
  wrapperClassName?: string;
}) {
  // If no onCheckedChange provided, render a static checkbox view used in list rows
  if (!onCheckedChange) {
    return (
      <div
        className={
          wrapperClassName ||
          "w-5 h-5 rounded-sm border border-gray-300 flex items-center justify-center bg-white"
        }
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="10"
            viewBox="0 0 11 10"
            fill="none"
          >
            <path
              d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
              stroke="#0D4B37"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <div
      className={wrapperClassName || "flex items-center gap-2"}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
    >
      <input
        type="checkbox"
        id={id}
        className="hidden"
        checked={checked}
        onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      />
      <label
        htmlFor={id}
        className="w-4 h-4 border border-[#0D4B37] rounded-sm flex items-center justify-center cursor-pointer"
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="10"
            viewBox="0 0 11 10"
            fill="none"
          >
            <path
              d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
              stroke="#0D4B37"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </label>
      {label && (
        <span
          className={
            labelClassName ||
            "text-[0.75rem] text-gray-600 cursor-pointer select-none"
          }
        >
          {label}
        </span>
      )}
    </div>
  );
}
