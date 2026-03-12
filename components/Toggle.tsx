"use client";

import React from "react";

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  checkedBg?: string;
  uncheckedBg?: string;
}> = ({
  checked,
  onChange,
  checkedBg = "#126ACB",
  uncheckedBg = "#E5E7EB",
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onChange(!checked);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      role="switch"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-checked={checked}
      className={`inline-flex items-center justify-between w-7 h-4 rounded-full p-1 transition-colors focus:outline-none`}
      style={{ backgroundColor: checked ? checkedBg : uncheckedBg }}
    >
      <span
        className={`block bg-white rounded-full w-3 h-3 transform transition-transform`}
        style={{ transform: checked ? "translateX(11px)" : "translateX(-2px)" }}
      />
    </div>
  );
};

export default Toggle;
