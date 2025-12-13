"use client";

import { useState, useRef, useEffect } from "react";
import { FaRegCalendar } from "react-icons/fa6";
import { MdKeyboardArrowRight, MdKeyboardArrowLeft } from "react-icons/md";

type Props = {
  label?: string;
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disablePastDates?: boolean;
  minDate?: string; // ISO string - disables all dates before this date
  customWidth?: string; // Custom width class for the input container
  labelClassName?: string; // Custom class for the label
  inputClassName?: string; // Custom class for the input text
  showCalendarIcon?: boolean; // Whether to show the calendar icon (default: true)
  readOnly?: boolean; // When true, input is disabled and calendar cannot be opened
  popupMaxHeight?: string; // Tailwind max-height class for calendar popup (e.g. 'max-h-44')
};

export default function SingleCalendar({
  label,
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  disablePastDates = false,
  minDate,
  customWidth,
  labelClassName,
  inputClassName,
  showCalendarIcon = true,
  readOnly = false,
  popupMaxHeight,
}: Props) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputValue, setInputValue] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  // Sync inputValue with value prop
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setInputValue(formatDateForInput(date));
    } else {
      setInputValue("");
    }
  }, [value]);

  // Set current month to selected date's month when value changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      );
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    }
    // Use capture phase (true) for better cross-browser compatibility
    document.addEventListener("click", handleClickOutside, true);
    return () =>
      document.removeEventListener("click", handleClickOutside, true);
  }, [open]);

  const handleDateClick = (date: Date, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    onChange(dateOnly.toISOString());
    setOpen(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const selectedOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    return dateOnly.getTime() === selectedOnly.getTime();
  };

  const getDaysInMonth = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days (shown as disabled)
    const prevMonth = new Date(year, monthIndex, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, monthIndex - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, monthIndex, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill the grid (shown as disabled)
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, monthIndex + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseInputDate = (input: string): Date | null => {
    // Expected format: DD-MM-YYYY
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = input.match(regex);
    if (!match || !match[1] || !match[2] || !match[3]) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(match[3], 10);

    const date = new Date(year, month, day);

    // Validate the date is real (e.g., not 31-02-2024)
    if (
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      return null;
    }

    return date;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // Allow only digits and dashes
    val = val.replace(/[^0-9-]/g, "");

    // Auto-insert dashes as user types
    if (val.length === 2 && inputValue.length < 2) {
      val = val + "-";
    } else if (val.length === 5 && inputValue.length < 5) {
      val = val + "-";
    }

    // Limit length to DD-MM-YYYY format (10 chars)
    if (val.length > 10) {
      val = val.slice(0, 10);
    }

    setInputValue(val);

    let parts = val.split("-");

    // Day correction
    if (parts[0] && parts[0].length === 2) {
      let day = parseInt(parts[0], 10);
      if (day > 31) {
        parts[0] = "31";
        val = parts.join("-");
        setInputValue(val);
      }
    }

    // Month correction
    if (parts[1] && parts[1].length === 2) {
      let month = parseInt(parts[1], 10);
      if (month > 12) {
        parts[1] = "12";
        val = parts.join("-");
        setInputValue(val);
      }
    }

    // Year correction
    if (parts[2] && parts[2].length === 4) {
      let year = parseInt(parts[2], 10);
      if (year > 2100) {
        parts[2] = "2100";
        val = parts.join("-");
        setInputValue(val);
      }
    }

    // Try to parse and update if valid
    if (val.length === 10) {
      const parsedDate = parseInputDate(val);
      if (parsedDate) {
        onChange(parsedDate.toISOString());
        setCurrentMonth(
          new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1)
        );
        // Close dropdown when complete valid date is typed
        setOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    }
  };

  const handleInputBlur = () => {
    // If input is incomplete or invalid, reset to selected date value
    if (inputValue.length !== 10 || !parseInputDate(inputValue)) {
      if (value) {
        setInputValue(formatDateForInput(new Date(value)));
      } else {
        setInputValue("");
      }
    }
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(monthIndex);
    setCurrentMonth(newMonth);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(year);
    setCurrentMonth(newMonth);
    setShowYearPicker(false);
  };

  // Generate years for year picker (65 years back to 1960 and 10 years forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 76 }, (_, i) => currentYear - 65 + i);

  const Calendar = ({ month }: { month: Date }) => {
    const days = getDaysInMonth(month);
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="flex-1">
        <hr className="mb-1 -mt-2 border-t border-gray-200" />
        <div className="grid grid-cols-7 gap-0 mb-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs text-gray-500 font-medium py-1.5 w-9"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {days.map((dayObj, index) => {
            const day = dayObj.date;
            const isCurrentMonth = dayObj.isCurrentMonth;
            const selected = isSelected(day);
            const isToday = day.toDateString() === new Date().toDateString();

            // Check if date is in the past (before today)
            const dayOnly = new Date(day);
            dayOnly.setHours(0, 0, 0, 0);
            const isPastDate = disablePastDates && dayOnly < today;

            // Check if date is before minDate
            let isBeforeMinDate = false;
            if (minDate) {
              const minDateObj = new Date(minDate);
              minDateObj.setHours(0, 0, 0, 0);
              isBeforeMinDate = dayOnly < minDateObj;
            }

            const isDisabled = !isCurrentMonth || isPastDate || isBeforeMinDate;

            return (
              <div key={index} className="relative w-9 h-8">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDisabled) {
                      handleDateClick(day, e);
                    }
                  }}
                  disabled={isDisabled}
                  className={`relative w-full h-full flex items-center justify-center text-[0.75rem] font-medium transition-colors select-none
                    ${!isCurrentMonth ? "text-gray-300 cursor-default" : ""}
                    ${
                      (isPastDate || isBeforeMinDate) && isCurrentMonth
                        ? "text-gray-300 cursor-not-allowed"
                        : ""
                    }
                    ${
                      isCurrentMonth &&
                      selected &&
                      !isPastDate &&
                      !isBeforeMinDate
                        ? "text-white rounded-sm"
                        : ""
                    }
                    ${
                      isCurrentMonth &&
                      !selected &&
                      !isPastDate &&
                      !isBeforeMinDate
                        ? "text-gray-700 hover:bg-gray-100"
                        : ""
                    }
                    ${
                      isCurrentMonth && isToday && !selectedDate
                        ? "ring-1 ring-green-500 rounded-sm font-bold"
                        : ""
                    }
                  `}
                  style={
                    isCurrentMonth &&
                    selected &&
                    !isPastDate &&
                    !isBeforeMinDate
                      ? { backgroundColor: "#0D4B37" }
                      : undefined
                  }
                >
                  {day.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const MonthPicker = () => (
    <div className="grid grid-cols-3 gap-2 p-2">
      {months.map((month, index) => (
        <button
          key={month}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleMonthSelect(index);
          }}
          className={`px-2 py-2 text-[0.75rem] rounded-md transition-colors
            ${
              currentMonth.getMonth() === index
                ? "bg-gray-700 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          {month.slice(0, 3)}
        </button>
      ))}
    </div>
  );

  const YearPicker = () => (
    <div className="grid grid-cols-4 gap-1 p-2 max-h-[12rem] overflow-y-auto">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleYearSelect(year);
          }}
          className={`px-2 py-1.5 text-[0.75rem] rounded-md transition-colors
            ${
              currentMonth.getFullYear() === year
                ? "bg-gray-700 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          {year}
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label
          className={
            labelClassName || "block text-gray-700 mb-1 text-xs font-medium"
          }
        >
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center ${
          customWidth || "w-[12rem]"
        } gap-2 border border-gray-300 rounded-md px-2 py-1.5 ${
          readOnly
            ? "bg-gray-100 cursor-default border-gray-200"
            : "bg-white hover:border-green-400"
        } transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => {
            if (!readOnly) setOpen(true);
          }}
          disabled={readOnly}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={
            inputClassName ||
            (readOnly
              ? "flex-1 text-[0.75rem] text-gray-700 bg-gray-100 cursor-default"
              : "flex-1 text-[0.75rem] text-gray-700 outline-none bg-transparent")
          }
        />

        {showCalendarIcon && !readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaRegCalendar size={14} />
          </button>
        )}
      </div>

      {open && (
        <div
          className={`absolute mt-2 z-[9999] rounded-lg shadow-2xl bg-white border border-gray-200 p-3 w-[16rem] ${
            popupMaxHeight || "max-h-72"
          } overflow-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Calendar navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateMonth(-1);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MdKeyboardArrowLeft size={18} className="text-gray-500" />
            </button>

            {/* Month/Year header  */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
                className="text-[0.75rem] font-medium text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                {months[currentMonth.getMonth()]}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
                className="text-[0.75rem] font-medium text-gray-700 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                {currentMonth.getFullYear()}
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateMonth(1);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MdKeyboardArrowRight size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Month Picker */}
          {showMonthPicker && <MonthPicker />}

          {/* Year Picker */}
          {showYearPicker && <YearPicker />}

          {/* Calendar */}
          {!showMonthPicker && !showYearPicker && (
            <Calendar month={currentMonth} />
          )}
        </div>
      )}
    </div>
  );
}
