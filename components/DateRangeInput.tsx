'use client'

import { useState, useRef, useEffect } from "react";
import { FaRegCalendar } from "react-icons/fa6";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { MdKeyboardDoubleArrowLeft } from "react-icons/md";

type Props = {
  label: string;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
};

export default function DateRangeInput({
  label,
  startDate,
  endDate,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const ref = useRef<HTMLDivElement>(null);

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const predefinedRanges = [
    {
      label: "Today",
      getValue: () => ({ start: new Date(), end: new Date() }),
    },
    {
      label: "Yesterday",
      getValue: () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return { start: d, end: d };
      },
    },
    {
      label: "This Week",
      getValue: () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
      },
    },
    {
      label: "Last Week",
      getValue: () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() - 7);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start, end };
      },
    },
    {
      label: "This Month",
      getValue: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      },
    },
    {
      label: "Last Month",
      getValue: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0),
        };
      },
    },
    {
      label: "Last 30 Days",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        return { start, end };
      },
    },
    {
      label: "This Year",
      getValue: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
        };
      },
    },
  ];

  // Fixed date comparison to handle dates without time component
  const handleDateClick = (date: Date, e?: React.MouseEvent) => {

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (!start || (start && end)) {
      onChange(dateOnly.toISOString(), "");
      setHoveredDate(null);
    } else {
      const startOnly = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      if (dateOnly < startOnly) {
        onChange(dateOnly.toISOString(), startOnly.toISOString());
      } else {
        onChange(startOnly.toISOString(), dateOnly.toISOString());
      }
      setHoveredDate(null);
      setOpen(false);
    }
  };

  // Added calendar navigation when clicking predefined ranges
  const handleRangeClick = (range: { start: Date; end: Date }) => {
    onChange(range.start.toISOString(), range.end.toISOString());
    // Set the calendar to show the range months
    setCurrentMonth(
      new Date(range.start.getFullYear(), range.start.getMonth(), 1)
    );
  };

  // Improved range detection with proper date comparison
  const isInRange = (date: Date) => {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (!start) return false;

    const startOnly = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );

    if (end) {
      const endOnly = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );
      return dateOnly >= startOnly && dateOnly <= endOnly;
    }

    // Handle hover preview
    if (hoveredDate) {
      const hoverOnly = new Date(
        hoveredDate.getFullYear(),
        hoveredDate.getMonth(),
        hoveredDate.getDate()
      );
      if (hoverOnly >= startOnly) {
        return dateOnly >= startOnly && dateOnly <= hoverOnly;
      } else {
        return dateOnly >= hoverOnly && dateOnly <= startOnly;
      }
    }

    return false;
  };

  // Improved start/end detection with proper date comparison
  const isStartOrEnd = (date: Date) => {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (start) {
      const startOnly = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      if (dateOnly.getTime() === startOnly.getTime()) return "start";
    }

    if (end) {
      const endOnly = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );
      if (dateOnly.getTime() === endOnly.getTime()) return "end";
    }

    // Handle hover preview end point
    if (!end && hoveredDate && start) {
      const hoverOnly = new Date(
        hoveredDate.getFullYear(),
        hoveredDate.getMonth(),
        hoveredDate.getDate()
      );
      const startOnly = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );

      if (
        hoverOnly >= startOnly &&
        dateOnly.getTime() === hoverOnly.getTime()
      ) {
        return "end";
      } else if (
        hoverOnly < startOnly &&
        dateOnly.getTime() === hoverOnly.getTime()
      ) {
        return "start";
      }
    }

    return null;
  };

  // ✅ CHANGE: Modified to return both current month dates AND adjacent month dates (for disabled display)
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

  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(currentMonth.getMonth() + 1);

  const formatDate = (date: Date | null) => {
    if (!date) return "Start Date";
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const Calendar = ({ month }: { month: Date }) => {
    const days = getDaysInMonth(month);
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

            const inRange = isInRange(day);
            const position = isStartOrEnd(day);
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className="relative w-9 h-8" // ✅ CHANGE: Reduced height from h-9 to h-8 for compact layout
                onMouseEnter={() =>
                  isCurrentMonth && start && !end && setHoveredDate(day)
                } // ✅ CHANGE: Only hover on current month dates
                onMouseLeave={() => setHoveredDate(null)}
              >
                {/* ✅ CHANGE: Only show range background for current month dates */}
                {inRange && !position && isCurrentMonth && (
                  <div className="absolute inset-0 bg-gray-100" />
                )}
                {position === "start" && isCurrentMonth && (
                  <div
                    className="absolute inset-0 bg-gray-100"
                    style={{ marginLeft: "50%" }}
                  />
                )}
                {position === "end" && isCurrentMonth && (
                  <div
                    className="absolute inset-0 bg-gray-100"
                    style={{ marginRight: "50%" }}
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    if (isCurrentMonth) {
                      handleDateClick(day, e);
                    }
                  }}
                  disabled={!isCurrentMonth} // ✅ CHANGE: Disable dates from adjacent months
                  className={`relative w-full h-full flex items-center justify-center text-[0.75rem] font-medium transition-colors select-none
                    ${!isCurrentMonth ? "text-gray-300 cursor-default" : ""} 
                    ${
                      isCurrentMonth && position
                        ? "bg-gray-200 text-gray-700 rounded-sm"
                        : ""
                    }
                    ${
                      isCurrentMonth && !position && inRange
                        ? "text-gray-700 "
                        : ""
                    }
                    ${
                      isCurrentMonth && !position && !inRange
                        ? "text-gray-700 hover:bg-gray-50"
                        : ""
                    }
                    ${isCurrentMonth && isToday && !position ? "font-bold" : ""}
                  `}
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

  return (
    <div className="relative" ref={ref}>
      <label className="block text-gray-700 mb-1 text-xs font-medium">
        {label}
      </label>

      <div
        className="relative flex items-center w-[14.75rem] gap-2 border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer bg-white hover:border-gray-400 transition-colors select-none"
        onClick={() => setOpen(!open)}
      >
        <span className="text-[0.65rem] text-gray-500">
          {formatDate(start)}
        </span>

        <span className="text-gray-400 mx-2">→</span>

        <span className="text-[0.65rem] text-gray-500 flex-1">
          {end ? formatDate(end) : "End Date"}
        </span>

        <div className="text-gray-400 -mt-1">
          <FaRegCalendar />
        </div>
      </div>

      {open && (
        <div className="absolute mt-2 z-50 rounded-lg shadow-2xl bg-white border border-gray-200 p-1 pr-2 w-[33rem] h-[16.25rem]">
          {" "}
          <div className="flex gap-4">
            <div className="w-34 border-r border-gray-200">
              {/* Today & Yesterday */}
              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[0];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[0]?.label ?? ""}
              </button>

              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[1];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[1]?.label ?? ""}
              </button>

              {/* This Week & Last Week */}
              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[2];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[2]?.label ?? ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[3];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[3]?.label ?? ""}
              </button>

              {/* This Month & Last Month */}
              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[4];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[4]?.label ?? ""}
              </button>

              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[5];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[5]?.label ?? ""}
              </button>

              {/* Last 30 Days & This Year */}
              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[6];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[6]?.label ?? ""}
              </button>

              <button
                type="button"
                onClick={() => {
                  const range = predefinedRanges[7];
                  if (range) {
                    const { start, end } = range.getValue();
                    handleRangeClick({ start, end });
                  }
                }}
                className="block w-full text-left text-xs text-gray-700 hover:bg-gray-50 py-1.5 px-2 rounded transition-colors"
              >
                {predefinedRanges[7]?.label ?? ""}
              </button>
            </div>

            {/* Calendar navigation and months */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigateMonth(-2)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MdKeyboardDoubleArrowLeft
                      size={14}
                      className="text-gray-500"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth(-1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MdKeyboardArrowLeft size={14} className="text-gray-500" />
                  </button>
                </div>

                {/* ✅ CHANGE: Month/Year headers now centered between arrows */}
                <div className="flex items-center gap-10">
                  <div className="text-center -ml-4 font-normal text-[0.75rem] min-w-[7rem]">
                    {formatMonthYear(currentMonth)}
                  </div>
                  <div className="text-center ml-4 font-normal text-[0.75rem] min-w-[7rem]">
                    {formatMonthYear(nextMonth)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigateMonth(1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MdKeyboardArrowRight size={14} className="text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMonth(2)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MdKeyboardDoubleArrowRight
                      size={14}
                      className="text-gray-500"
                    />
                  </button>
                </div>
              </div>

              {/* Two months side by side */}
              <div className="flex gap-8">
                <Calendar month={currentMonth} />
                <Calendar month={nextMonth} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
