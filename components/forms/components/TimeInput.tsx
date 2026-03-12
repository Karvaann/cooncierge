"use client";

import React from "react";

interface TimeInputProps {
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  hasError?: boolean;
  errorMessage?: string;
  isValidating?: boolean;
  isValid?: boolean;
}

const toTimeInput = (val?: string) => {
  if (!val) return "";
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const m = String(val).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let hh = parseInt(m[1]!, 10);
    const mm2 = m[2] ?? "00";
    const ampm = (m[3] ?? "AM").toUpperCase();
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${mm2}`;
  }
  const m2 = String(val).match(/(\d{1,2}):(\d{2})/);
  if (m2)
    return `${String(parseInt(m2[1]!, 10)).padStart(2, "0")}:${m2[2] ?? "00"}`;
  return "";
};

const capTimeInput = (val?: string) => {
  if (!val) return "";
  const parts = String(val).split(":");
  let hh = parseInt(parts[0] ?? "0", 10);
  let mm = parseInt(parts[1] ?? "0", 10);
  if (isNaN(hh)) hh = 0;
  if (isNaN(mm)) mm = 0;
  if (hh > 23) hh = 23;
  if (mm > 59) mm = 59;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

export default function TimeInput({
  name,
  value,
  onChange,
  onBlur,
  placeholder = "HH:MM",
  disabled = false,
  className = "",
  maxLength = 5,
  hasError = false,
  errorMessage,
  isValidating = false,
  isValid = false,
}: TimeInputProps) {
  const displayValue = toTimeInput(value) || String(value || "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value || "";

    // Only allow digits and colon
    val = val.replace(/[^0-9:]/g, "");

    // Prevent multiple colons
    const colonCount = (val.match(/:/g) || []).length;
    if (colonCount > 1) {
      val = val.replace(/:([^:]*)$/, "$1");
    }

    // Auto-insert colon after 2 digits
    if (val.length === 2 && !val.includes(":")) {
      val = val + ":";
    }

    // Limit to HH:MM format (5 chars)
    if (val.length > 5) val = val.slice(0, 5);

    // Validate hours (0-23) and minutes (0-59)
    if (val.includes(":")) {
      const parts = val.split(":");
      const hours = parts[0] || "";
      const minutes = parts[1] || "";
      let validHours = hours;
      let validMinutes = minutes;

      // Validate hours
      if (hours.length > 0) {
        const hourNum = parseInt(hours, 10);
        if (hours.length === 2 && hourNum > 23) {
          validHours = "23";
        }
      }

      // Validate minutes
      if (validMinutes.length > 0) {
        const minNum = parseInt(validMinutes, 10);
        if (validMinutes.length === 2 && minNum > 59) {
          validMinutes = "59";
        }
      }

      val = validHours + ":" + validMinutes;
    } else {
      // Validate hours before colon is added
      if (val.length === 2) {
        const hourNum = parseInt(val, 10);
        if (hourNum > 23) {
          val = "23";
        }
      }
    }

    // Create synthetic event so parent handlers receive sanitized value
    const synthetic = {
      ...e,
      target: { ...(e.target as any), value: val, name },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange?.(synthetic);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // On blur, cap minutes/hours properly
    const raw = String((e.target as any).value || displayValue || "");
    const capped = capTimeInput(raw);
    const synthetic = {
      ...e,
      target: { ...(e.target as any), value: capped, name },
    } as React.FocusEvent<HTMLInputElement>;
    onBlur?.(synthetic);
  };

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled || isValidating}
        maxLength={maxLength}
        className={`w-[66%] border rounded-[15px] px-3 py-2 pr-10 text-[0.75rem] placeholder:text-[#9CA3AF] transition-colors
          ${
            hasError
              ? "border-red-300 focus:ring-red-200"
              : isValid
                ? "border-green-300 focus:ring-green-200"
                : "border-[#E2E1E1] focus:ring-blue-200"
          }
          ${disabled || isValidating ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      />

      {hasError && errorMessage && (
        <div className="absolute right-2 top-2 text-[0.65rem] text-red-600">
          {errorMessage}
        </div>
      )}
    </div>
  );
}