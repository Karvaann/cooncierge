"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  customWidth?: string;
  customHeight?: string;
  menuWidth?: string;
  itemHeight?: number;
  noBorder?: boolean;
  buttonClassName?: string;
  iconOnly?: boolean;
  disabled?: boolean;
  menuCentered?: boolean;
}

const DropDown: React.FC<DropdownProps> = ({
  options,
  placeholder = "Select an option",
  value,
  onChange,
  customWidth,
  customHeight,
  className = "",
  menuWidth,
  itemHeight,
  noBorder = false,
  buttonClassName = "",
  iconOnly = false,
  disabled = false,
  menuCentered = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const [openUpwards, setOpenUpwards] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    width: number;
    openUpwards: boolean;
    centered?: boolean;
  } | null>(null);

  // Sync selected value when parent changes `value` prop
  useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(target);
      const clickedInsideMenu =
        menuRef.current && menuRef.current.contains(target);
      if (!clickedInsideDropdown && !clickedInsideMenu) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [isOpen]);

  // Decide whether to open menu upwards when there isn't enough space below
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const computePlacement = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const optionHeight = itemHeight || 36; // estimated option height in px (can be overridden by prop)
      const menuHeight = Math.min(options.length * optionHeight, 400);
      const availableBelow = window.innerHeight - rect.bottom;
      const availableAbove = rect.top;
      const shouldOpenUp =
        availableBelow < menuHeight && availableAbove > availableBelow;
      const width = rect.width || 200;

      if (menuCentered) {
        // place center point at trigger horizontal center
        const centerX = rect.left + rect.width / 2;
        if (shouldOpenUp) {
          const bottom = window.innerHeight - rect.top;
          setMenuPos({
            left: centerX,
            bottom,
            width,
            openUpwards: true,
            centered: true,
          });
        } else {
          const top = rect.bottom;
          setMenuPos({
            left: centerX,
            top,
            width,
            openUpwards: false,
            centered: true,
          });
        }
      } else {
        const left = Math.max(8, rect.left);
        if (shouldOpenUp) {
          const bottom = window.innerHeight - rect.top;
          setMenuPos({ left, bottom, width, openUpwards: true });
        } else {
          const top = rect.bottom;
          setMenuPos({ left, top, width, openUpwards: false });
        }
      }
      setOpenUpwards(shouldOpenUp);
    };

    // compute initially and on scroll/resize
    computePlacement();
    window.addEventListener("resize", computePlacement);
    window.addEventListener("scroll", computePlacement, true);
    return () => {
      window.removeEventListener("resize", computePlacement);
      window.removeEventListener("scroll", computePlacement, true);
      setMenuPos(null);
    };
  }, [isOpen, options.length, menuCentered]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    if (onChange) {
      onChange(optionValue);
    }
  };

  const inputWidthClass = customWidth ? customWidth : "w-[12rem]";
  const menuWidthClass = menuWidth ? menuWidth : inputWidthClass;
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-disabled={disabled}
        aria-label={iconOnly ? placeholder : undefined}
        className={`${inputWidthClass} ${
          customHeight ? customHeight : "py-1.5"
        } flex items-center justify-between px-2 ${
          disabled ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
        } rounded-md ${
          noBorder ? "" : "border border-gray-300"
        } hover:border-green-300 transition-colors text-left text-[13px] focus:outline-none focus:ring-1 focus:ring-green-400 ${buttonClassName}`}
      >
        {!iconOnly && (
          <span className={`${selectedValue ? "text-black" : "text-gray-400"}`}>
            {displayText}
          </span>
        )}
        <svg
          aria-hidden={iconOnly ? "false" : "true"}
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen &&
        !disabled &&
        menuPos &&
        (typeof document !== "undefined" && document.body
          ? createPortal(
              <div
                ref={(el: HTMLDivElement | null) => {
                  menuRef.current = el;
                }}
                style={(() => {
                  const base: React.CSSProperties = {
                    left: menuPos.centered
                      ? menuPos.left
                      : Math.max(8, menuPos.left),
                    ...(menuPos.openUpwards
                      ? { bottom: menuPos.bottom }
                      : { top: menuPos.top }),
                    position: "fixed",
                  } as React.CSSProperties;
                  if (menuPos.centered) base.transform = "translateX(-50%)";
                  // Only set an explicit pixel width when menuWidth is NOT provided
                  if (!menuWidth) {
                    return { ...base, width: menuPos.width };
                  }
                  return base;
                })()}
                className={`${menuWidthClass} bg-white rounded-md border border-gray-300 shadow-lg overflow-hidden z-[1100]`}
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full block px-2 py-1.5 text-left text-[13px] text-black hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>,
              document.body
            )
          : null)}
    </div>
  );
};

export default DropDown;
