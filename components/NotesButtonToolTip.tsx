"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { TbNotes } from "react-icons/tb";

interface NotesButtonProps {
  onClick: () => void;
}

const NotesButtonToolTip: React.FC<NotesButtonProps> = ({ onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tooltipOffset = 10; // px gap from button

  useEffect(() => {
    if (!showTooltip) return;

    const updatePos = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return setPos(null);
      setPos({
        left: rect.left + rect.width / 2,
        top: rect.top - tooltipOffset,
      });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [showTooltip]);

  const tooltipEl = (
    <div
      role="tooltip"
      aria-hidden={!showTooltip}
      className={`px-2 py-1 text-[0.65rem] text-[#020202] bg-white rounded-md shadow-lg pointer-events-none whitespace-nowrap transition-opacity duration-150 ease-in-out ${
        showTooltip ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      style={{
        position: "fixed",
        left: pos ? `${pos.left}px` : "50%",
        top: pos ? `${pos.top}px` : "0px",
        transform: "translateX(-50%) translateY(-100%)",
        WebkitTransform: "translateX(-50%) translateY(-100%)",
        zIndex: 9999,
      }}
    >
      Add Notes
      {/* <div
        className="absolute left-1/2 -bottom-1 w-2.5 h-2.5 bg-white shadow"
        style={{
          transform: "translateX(-50%) rotate(45deg)",
          WebkitTransform: "translateX(-50%) rotate(45deg)",
        }}
      /> */}
    </div>
  );

  return (
    <div
      className="inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => setShowTooltip(true)}
      onTouchEnd={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        className="w-9 h-9 rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer transition flex items-center justify-center"
        aria-label="Add Notes"
        onClick={onClick}
        tabIndex={0}
      >
        <TbNotes size={20} className="text-[#F59E0B]" />
      </button>

      {typeof document !== "undefined" && showTooltip
        ? createPortal(tooltipEl, document.body)
        : null}
    </div>
  );
};

export default NotesButtonToolTip;
