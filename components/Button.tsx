"use client";

import React from "react";

interface ButtonProps {
  text: string;
  bgColor?: string;
  textColor?: string;
  width?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export default function Button({
  text,
  bgColor = "bg-[#126ACB]",
  textColor = "text-white",
  width = "w-auto",
  icon,
  iconPosition = "left",
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 
        ${bgColor} 
        ${textColor} 
        ${width}
        text-[14px] 
        font-medium 
        flex items-center justify-center gap-1.5
        transition-colors
        hover:opacity-90
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {iconPosition === "left" && icon && (
        <span className="flex items-center">{icon}</span>
      )}
      {text}
      {iconPosition === "right" && icon && (
        <span className="flex items-center">{icon}</span>
      )}
    </button>
  );
}