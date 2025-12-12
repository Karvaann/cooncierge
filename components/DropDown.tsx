import React, { useState, useRef, useEffect } from "react";

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
  menuWidth?: string;
  disabled?: boolean;
}

const DropDown: React.FC<DropdownProps> = ({
  options,
  placeholder = "Select an option",
  value,
  onChange,
  customWidth,
  className = "",
  menuWidth,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync selected value when parent changes `value` prop
  useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
        className={`${inputWidthClass} flex items-center justify-between px-2 py-1.5 ${
          disabled ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
        } rounded-md border border-gray-300 hover:border-green-300 transition-colors text-left text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-green-400`}
      >
        <span className={`${selectedValue ? "text-black" : "text-gray-400"}`}>
          {displayText}
        </span>
        <svg
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
      {isOpen && !disabled && (
        <div
          className={`${menuWidthClass} absolute top-full left-0 mt-1 bg-white rounded-md border border-gray-300 shadow-lg overflow-hidden z-10`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full block px-2 py-1.5 text-left text-[0.75rem] text-black hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropDown;
