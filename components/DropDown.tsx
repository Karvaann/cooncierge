"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

interface DropdownOption {
  value: string;
  label: React.ReactNode;
  buttonLabel?: React.ReactNode;
  searchLabel?: string;
}

interface DropdownFooterAction {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
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
  focusRingClass?: string;
  noButtonRadius?: boolean;
  iconOnly?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  menuCentered?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  getOptionSearchValue?: (option: DropdownOption) => string;
  footerAction?: DropdownFooterAction;
  /** When true, the trigger becomes a typeable input with fuzzy search filtering */
  typeable?: boolean;
  /** When true, skip the default bg-gray-200 background applied on disabled / readOnly state */
  noDisabledBg?: boolean;
  /** Custom className applied to each option item in the dropdown menu */
  optionClassName?: string;
}

/* ── Fuzzy-match: every query char must appear in order in the target ── */
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
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
  focusRingClass = "focus:ring-1 focus:ring-green-400",
  noButtonRadius = false,
  iconOnly = false,
  disabled = false,
  readOnly = false,
  menuCentered = false,
  searchable = false,
  searchPlaceholder = "Type to filter...",
  getOptionSearchValue,
  footerAction,
  typeable = false,
  noDisabledBg = false,
  optionClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const [openUpwards, setOpenUpwards] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeableQuery, setTypeableQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const typeableInputRef = useRef<HTMLInputElement>(null);
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
  const displayText: React.ReactNode = selectedOption
    ? (selectedOption.buttonLabel ?? selectedOption.label)
    : placeholder;

  const filteredOptions = useMemo(() => {
    // typeable mode: use fuzzy match against typeableQuery
    if (typeable) {
      const q = typeableQuery.trim();
      if (!q) return options;
      return options.filter((opt) => {
        const searchText =
          opt.searchLabel ||
          (typeof getOptionSearchValue === "function"
            ? getOptionSearchValue(opt)
            : "") ||
          (typeof opt.label === "string" ? opt.label : "") ||
          opt.value;
        return fuzzyMatch(q, String(searchText));
      });
    }
    if (!searchable) return options;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((opt) => {
      const custom =
        typeof getOptionSearchValue === "function"
          ? getOptionSearchValue(opt)
          : "";
      const labelText =
        opt.searchLabel ||
        custom ||
        (typeof opt.label === "string" ? opt.label : "") ||
        opt.value;
      return String(labelText).toLowerCase().includes(query);
    });
  }, [
    getOptionSearchValue,
    options,
    searchQuery,
    searchable,
    typeable,
    typeableQuery,
  ]);

  // Reset highlight when filtered list changes (typeable mode)
  useEffect(() => {
    setHighlightIdx(0);
  }, [filteredOptions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!typeable || !isOpen || !menuRef.current) return;
    const item = menuRef.current.querySelector(
      `[data-idx="${highlightIdx}"]`,
    ) as HTMLElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx, isOpen, typeable]);

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
      const menuHeight = Math.min(filteredOptions.length * optionHeight, 400);
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
  }, [isOpen, filteredOptions.length, menuCentered]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || readOnly) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    if (onChange) {
      onChange(optionValue);
    }
  };

  const handleFooterClick = () => {
    setIsOpen(false);
    footerAction?.onClick();
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setTypeableQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (readOnly && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, readOnly]);

  const inputWidthClass = customWidth ? customWidth : "w-[12rem]";
  const menuWidthClass = menuWidth ? menuWidth : inputWidthClass;
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Trigger */}
      {typeable ? (
        <div
          className={`${inputWidthClass} ${
            customHeight ? customHeight : "py-1.5"
          } flex items-center px-2 ${
            readOnly || disabled
              ? `cursor-not-allowed${noDisabledBg ? "" : " bg-gray-200"}`
              : "bg-white"
          } ${noButtonRadius ? "" : "rounded-md"} ${
            noBorder ? "" : "border border-gray-300"
          } hover:border-green-300 transition-colors text-[13px] ${focusRingClass} ${buttonClassName}`}
        >
          <input
            ref={typeableInputRef}
            type="text"
            value={
              isOpen
                ? typeableQuery
                : typeof displayText === "string"
                  ? displayText
                  : selectedValue
            }
            onChange={(e) => {
              setTypeableQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setTypeableQuery("");
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIdx((i) =>
                  Math.min(i + 1, filteredOptions.length - 1),
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIdx((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredOptions[highlightIdx])
                  handleSelect(filteredOptions[highlightIdx].value);
              } else if (e.key === "Escape") {
                setIsOpen(false);
                typeableInputRef.current?.blur();
              }
            }}
            disabled={disabled}
            readOnly={readOnly}
            className={`flex-1 min-w-0 bg-transparent outline-none text-[13px]${readOnly ? " cursor-not-allowed" : ""}`}
          />
          <svg
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled && !readOnly) {
                setIsOpen((prev) => !prev);
                typeableInputRef.current?.focus();
              }
            }}
            className={`w-4 h-4 flex-shrink-0 text-gray-400 cursor-pointer transition-transform duration-200 ${
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
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled || readOnly}
          aria-disabled={disabled || readOnly}
          aria-label={iconOnly ? placeholder : undefined}
          className={`${inputWidthClass} ${
            customHeight ? customHeight : "py-1.5"
          } flex items-center justify-between px-2 ${
            readOnly || disabled
              ? `cursor-not-allowed${noDisabledBg ? "" : " bg-gray-200"}`
              : "bg-white"
          } ${noButtonRadius ? "" : "rounded-md"} ${
            noBorder ? "" : "border border-gray-300"
          } hover:border-green-300 transition-colors text-left text-[13px] focus:outline-none ${focusRingClass} ${buttonClassName}`}
        >
          {!iconOnly && (
            <span
              className={`${selectedValue ? "text-black" : "text-gray-400"}`}
            >
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
      )}

      {/* Dropdown Menu */}
      {isOpen &&
        !disabled &&
        !readOnly &&
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
                className={`${menuWidthClass} bg-white rounded-md border border-gray-300 shadow-lg overflow-auto max-h-[240px] z-[1100]`}
              >
                {searchable && (
                  <div className="sticky top-0 bg-white z-10 border-b border-gray-200 p-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400"
                      autoFocus
                    />
                  </div>
                )}
                {filteredOptions.map((option, idx) => (
                  <button
                    key={option.value}
                    type="button"
                    data-idx={idx}
                    onMouseEnter={() => typeable && setHighlightIdx(idx)}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full block px-2 py-1.5 text-left text-[13px] transition-colors border-b border-gray-100 last:border-b-0 ${
                      typeable && idx === highlightIdx
                        ? "bg-green-50 text-black"
                        : "text-black hover:bg-gray-50"
                    } ${optionClassName}`}
                  >
                    {option.label}
                  </button>
                ))}

                {footerAction && (
                  <button
                    type="button"
                    onClick={handleFooterClick}
                    className={`w-full px-3 py-2 text-[13px] text-[#126ACB] font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 border-t border-gray-200 ${
                      footerAction.className || ""
                    }`}
                  >
                    {footerAction.icon && (
                      <span className="flex items-center">
                        {footerAction.icon}
                      </span>
                    )}
                    {footerAction.label}
                  </button>
                )}

                {(searchable || typeable) && filteredOptions.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-gray-500">
                    No results
                  </div>
                )}
              </div>,
              document.body,
            )
          : null)}
    </div>
  );
};

export default DropDown;
