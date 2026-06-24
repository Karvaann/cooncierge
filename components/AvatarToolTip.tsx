"use client";

import React, { useState } from "react";

interface AvatarTooltipProps {
  short: string;
  full: string;
  color: string;
}

const AvatarTooltip: React.FC<AvatarTooltipProps> = ({
  short,
  full,
  color,
}) => {
  const [showTooltip, setShowTooltip] = useState(false); // state control

  return (
    <div
      className="relative -ml-2 first:ml-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)} // mobile support
      onTouchEnd={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <div
        className={`w-7 h-7 rounded-full shadow-md bg-white flex items-center justify-center text-[11px] font-semibold border ${color} cursor-pointer select-none`}
        tabIndex={0}
        role="button"
        aria-label={full}
      >
        {short}
      </div>

      {/* Tooltip */}
      <div
        className={`
          absolute -top-8 left-1/2 z-50
          px-2 py-1 text-[0.65rem] text-white bg-gray-800 rounded-md shadow-lg
          pointer-events-none whitespace-nowrap
          transition-opacity duration-150 ease-in-out
          ${showTooltip ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        style={{
          transform: "translateX(-50%)",
          WebkitTransform: "translateX(-50%)",
        }}
        role="tooltip" // for accessibility, screen readers
      >
        {full}

        {/* Tail */}
        <div
          className="absolute left-1/2 -bottom-1 w-2.5 h-2.5 bg-gray-800 shadow"
          style={{
            transform: "translateX(-50%) rotate(45deg)",
            WebkitTransform: "translateX(-50%) rotate(45deg)", // for Safari
          }}
        />
      </div>
    </div>
  );
};

export default AvatarTooltip;
