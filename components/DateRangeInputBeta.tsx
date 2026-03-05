"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  lastDayOfMonth,
  setMonth,
  setYear,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { FaRegCalendar } from "react-icons/fa6";
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";

type Props = {
  label?: string;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
};

type RangeValue = {
  startDate: Date | null;
  endDate: Date | null;
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
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
] as const;

type PickerState =
  | {
      slot: 0 | 1;
      mode: "month" | "year" | "year-month";
    }
  | null;

const presetRanges = [
  {
    label: "Today",
    getValue: () => {
      const today = startOfDay(new Date());
      return { startDate: today, endDate: today };
    },
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = startOfDay(addDays(new Date(), -1));
      return { startDate: yesterday, endDate: yesterday };
    },
  },
  {
    label: "This Week",
    getValue: () => {
      const now = startOfDay(new Date());
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = addDays(now, diff);
      return { startDate: start, endDate: addDays(start, 6) };
    },
  },
  {
    label: "Last Week",
    getValue: () => {
      const now = startOfDay(new Date());
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = addDays(now, diff - 7);
      return { startDate: start, endDate: addDays(start, 6) };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const now = new Date();
      const month = subMonths(now, 1);
      return {
        startDate: startOfMonth(month),
        endDate: endOfMonth(month),
      };
    },
  },
  {
    label: "This Year",
    getValue: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
      };
    },
  },
];

const toDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfDay(parsed);
};

const formatDisplayDate = (value: Date | null) =>
  value ? format(value, "dd MMM yyyy") : "";

const toIsoBoundary = (value: Date | null) =>
  value ? startOfDay(value).toISOString() : "";

const getMatchingPresetLabel = (start: Date | null, end: Date | null) => {
  if (!start || !end) return null;

  const match = presetRanges.find((preset) => {
    const presetValue = preset.getValue();
    return (
      isSameDay(start, presetValue.startDate) &&
      isSameDay(end, presetValue.endDate)
    );
  });

  return match?.label ?? null;
};

const buildMonthDays = (month: Date) => {
  const firstOfMonth = startOfMonth(month);
  const lastOfMonth = lastDayOfMonth(month);
  const currentMonthDays = Array.from({ length: lastOfMonth.getDate() }, (_, index) => {
    const date = addDays(firstOfMonth, index);
    return {
      date,
      isCurrentMonth: true,
      isPlaceholder: false,
    };
  });
  const trailingDaysCount = (7 - (currentMonthDays.length % 7)) % 7;
  const trailingDays = Array.from({ length: trailingDaysCount }, (_, index) => {
    const date = addDays(lastOfMonth, index + 1);
    return {
      date,
      isCurrentMonth: false,
      isPlaceholder: false,
    };
  });

  return [...currentMonthDays, ...trailingDays];
};

const getInitialShownDate = (start: Date | null, end: Date | null) =>
  start ?? end ?? startOfDay(new Date());

const getMonthDateForSlot = (baseMonth: Date, slot: 0 | 1) =>
  slot === 0 ? startOfMonth(baseMonth) : startOfMonth(addMonths(baseMonth, 1));

const getDayButtonClasses = ({
  isRangeStart,
  isRangeEnd,
  isInRange,
}: {
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
}) => {
  if (isRangeStart && isRangeEnd) {
    return "h-9 bg-[#7135AD] text-white rounded-md";
  }

  if (isRangeStart) {
    return "h-9 bg-[#7135AD] text-white rounded-md";
  }

  if (isRangeEnd) {
    return "h-9 bg-[#7135AD] text-white rounded-md";
  }

  if (isInRange) {
    return "h-9 bg-[#7135AD12] text-[#333333] rounded-none";
  }

  return "h-9 text-[#111827] hover:bg-gray-50 rounded-md";
};

function CalendarMonth({
  month,
  range,
  onSelectDate,
  onHoverDate,
  onLeaveMonth,
}: {
  month: Date;
  range: RangeValue;
  onSelectDate: (date: Date) => void;
  onHoverDate: (date: Date) => void;
  onLeaveMonth: () => void;
}) {
  const days = useMemo(() => buildMonthDays(month), [month]);

  return (
    <div className="rdrMonth" onMouseLeave={onLeaveMonth}>
      <div className="rdrWeekDays mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={`${month.toISOString()}-${label}`}
            className="text-center text-[0.70rem] font-semibold text-gray-500"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="rdrDays mt-3 gap-y-1">
        {days.map(({ date, isCurrentMonth }) => {
          const normalizedDate = startOfDay(date);
          const start = range.startDate;
          const end = range.endDate ?? range.startDate;
          const isRangeStart = !!start && isSameDay(normalizedDate, start);
          const isRangeEnd = !!end && isSameDay(normalizedDate, end);
          const isInRange =
            !!start &&
            !!end &&
            !isRangeStart &&
            !isRangeEnd &&
            isAfter(normalizedDate, start) &&
            isBefore(normalizedDate, end);

          return (
            <button
              key={normalizedDate.toISOString()}
              type="button"
              onClick={() => onSelectDate(normalizedDate)}
              onMouseEnter={() => onHoverDate(normalizedDate)}
              className={`relative h-9 w-full px-0 text-[14px] transition-colors ${
                isCurrentMonth ? "" : "text-gray-300"
              }`}
            >
              <span
                className={`flex w-full items-center justify-center ${
                  getDayButtonClasses({
                    isRangeStart,
                    isRangeEnd,
                    isInRange,
                  })
                } ${
                  !isCurrentMonth && !isRangeStart && !isRangeEnd && !isInRange
                    ? "text-[#C4C4C4]"
                    : ""
                }`}
              >
                {format(normalizedDate, "dd")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangeInputBeta({
  label,
  startDate,
  endDate,
  onChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const parsedStart = useMemo(() => toDate(startDate), [startDate]);
  const parsedEnd = useMemo(() => toDate(endDate), [endDate]);

  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<RangeValue>({
    startDate: parsedStart,
    endDate: parsedEnd ?? parsedStart,
  });
  const [shownDate, setShownDate] = useState<Date>(
    getInitialShownDate(parsedStart, parsedEnd),
  );
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [picker, setPicker] = useState<PickerState>(null);
  const [pickerYear, setPickerYear] = useState<number>(
    getInitialShownDate(parsedStart, parsedEnd).getFullYear(),
  );

  useEffect(() => {
    setRange({
      startDate: parsedStart,
      endDate: parsedEnd ?? parsedStart,
    });
    setShownDate(getInitialShownDate(parsedStart, parsedEnd));
    setIsSelectingEnd((prev) => {
      if (!parsedStart && !parsedEnd) {
        return false;
      }

      if (parsedStart && parsedEnd && !isSameDay(parsedStart, parsedEnd)) {
        return false;
      }

      return prev;
    });
    setHoverDate(null);
    setPicker(null);
    setPickerYear(getInitialShownDate(parsedStart, parsedEnd).getFullYear());
  }, [parsedEnd, parsedStart]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayValue = useMemo(() => {
    const presetLabel = getMatchingPresetLabel(parsedStart, parsedEnd);

    if (presetLabel) {
      return {
        variant: "single" as const,
        primaryText: presetLabel,
      };
    }

    if (parsedStart && parsedEnd && isSameDay(parsedStart, parsedEnd)) {
      return {
        variant: "single" as const,
        primaryText: formatDisplayDate(parsedStart),
      };
    }

    if (parsedStart && parsedEnd) {
      return {
        variant: "range" as const,
        startText: formatDisplayDate(parsedStart),
        endText: formatDisplayDate(parsedEnd),
      };
    }

    if (parsedStart) {
      return {
        variant: "single" as const,
        primaryText: formatDisplayDate(parsedStart),
      };
    }

    return {
      variant: "placeholder" as const,
      startText: "Start Date",
      endText: "End Date",
    };
  }, [parsedEnd, parsedStart]);

  const firstMonthDate = shownDate;
  const secondMonthDate = addMonths(firstMonthDate, 1);
  const yearGridStart = Math.floor(pickerYear / 12) * 12;
  const yearGrid = Array.from({ length: 12 }, (_, index) => yearGridStart + index);

  const displayRange = useMemo(() => {
    if (
      isSelectingEnd &&
      range.startDate &&
      hoverDate &&
      !isSameDay(range.startDate, hoverDate)
    ) {
      return isBefore(hoverDate, range.startDate)
        ? { startDate: hoverDate, endDate: range.startDate }
        : { startDate: range.startDate, endDate: hoverDate };
    }

    return range;
  }, [hoverDate, isSelectingEnd, range]);

  const activePresetLabel = useMemo(
    () => getMatchingPresetLabel(range.startDate, range.endDate),
    [range.endDate, range.startDate],
  );

  const commitRange = (next: RangeValue) => {
    setRange(next);
    onChange(toIsoBoundary(next.startDate), toIsoBoundary(next.endDate));
  };

  const handleSelectDate = (date: Date) => {
    const normalizedDate = startOfDay(date);

    if (!range.startDate || !isSelectingEnd) {
      commitRange({ startDate: normalizedDate, endDate: normalizedDate });
      setIsSelectingEnd(true);
      setHoverDate(null);
      setShownDate(startOfMonth(normalizedDate));
      return;
    }

    if (isBefore(normalizedDate, range.startDate)) {
      commitRange({ startDate: normalizedDate, endDate: range.startDate });
    } else {
      commitRange({ startDate: range.startDate, endDate: normalizedDate });
    }

    setIsSelectingEnd(false);
    setHoverDate(null);
  };

  const applyPreset = (getter: () => { startDate: Date; endDate: Date }) => {
    const next = getter();
    commitRange(next);
    setShownDate(startOfMonth(next.startDate));
    setIsSelectingEnd(false);
    setHoverDate(null);
    setPicker(null);
    setOpen(false);
  };

  const clearDates = () => {
    setRange({ startDate: null, endDate: null });
    setShownDate(startOfDay(new Date()));
    setIsSelectingEnd(false);
    setHoverDate(null);
    setPicker(null);
    onChange("", "");
  };

  const goPrevMonth = () => {
    setShownDate((prev) => startOfMonth(subMonths(prev, 1)));
  };

  const goNextMonth = () => {
    setShownDate((prev) => startOfMonth(addMonths(prev, 1)));
  };

  const goPrevYear = () => {
    setShownDate((prev) => startOfMonth(subMonths(prev, 12)));
  };

  const goNextYear = () => {
    setShownDate((prev) => startOfMonth(addMonths(prev, 12)));
  };

  const openMonthPicker = (slot: 0 | 1) => {
    setPickerYear(getMonthDateForSlot(shownDate, slot).getFullYear());
    setPicker({ slot, mode: "month" });
  };

  const openYearPicker = (slot: 0 | 1) => {
    setPickerYear(getMonthDateForSlot(shownDate, slot).getFullYear());
    setPicker({ slot, mode: "year" });
  };

  const applyMonthSelection = (slot: 0 | 1, year: number, monthIndex: number) => {
    const target = startOfMonth(setMonth(setYear(new Date(), year), monthIndex));
    setShownDate(slot === 0 ? target : startOfMonth(subMonths(target, 1)));
    setPicker(null);
  };

  const handleYearSelection = (year: number) => {
    if (!picker) return;
    setPickerYear(year);
    setPicker({ slot: picker.slot, mode: "year-month" });
  };

  return (
    <div className="relative date-range-custom" ref={ref}>
      <label className="block text-gray-700 mb-1 text-[14px] font-[400]">
        {label}
      </label>

      <button
        type="button"
        className="relative flex h-[44px] items-center gap-1 font-[300] justify-between w-full border border-[#E2E1E1] rounded-[14px] px-[9px] bg-white hover:border-green-200 transition-colors select-none text-[14px]"
        onClick={() => setOpen((prev) => !prev)}
      >
        {displayValue.variant === "placeholder" ? (
          <>
            <span className="min-w-0 truncate text-[#9CA3AF]">
              {displayValue.startText}
            </span>
            <span className="shrink-0 text-[#818181]">→</span>
            <span className="min-w-0 truncate text-[#9CA3AF]">
              {displayValue.endText}
            </span>
          </>
        ) : displayValue.variant === "range" ? (
          <>
            <span className="min-w-0 truncate text-[#020202]">
              {displayValue.startText}
            </span>
            <span className="shrink-0 text-[#818181]">→</span>
            <span className="min-w-0 truncate text-[#020202]">
              {displayValue.endText}
            </span>
          </>
        ) : (
          <span className="min-w-0 truncate text-[#020202]">
            {displayValue.primaryText}
          </span>
        )}
        {startDate && endDate ? (
          <span
            role="button"
            aria-label="Clear dates"
            onClick={(event) => {
              event.stopPropagation();
              clearDates();
            }}
            className="text-[#818181] hover:text-gray-600 rounded-sm cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </span>
        ) : (
          <span className="text-gray-400">
            <FaRegCalendar />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute mt-2 z-50 rounded-md bg-white border border-gray-200 p-2 w-[700px] min-h-[240px] date-range-popover">
          <div className="flex gap-0">
            <div className="presets-column h-fit flex flex-col items-center gap-1 w-26 border-r border-gray-200 p-2 space-y-1">
              {presetRanges.map((preset) => {
                const isActive = activePresetLabel === preset.label;

                return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.getValue)}
                  style={{textAlign: 'center', width: 'fit-content'}}
                  className={`block rounded-xl py-2 px-2 text-left text-[0.70rem] transition-colors ${
                    isActive
                      ? "bg-[#7135AD] text-[#FFF]"
                      : "text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {preset.label}
                </button>
                );
              })}
            </div>

            <div className="flex-1 p-2 overflow-x-hidden">
              <div className="flex flex-row justify-between items-center">
                <div style={{padding: '0 12px'}} className="calendar-shared-header w-full !flex !flex-row !justify-between !items-center gap-2 px-1">
                  <div className="flex items-center gap-0.5">
                    <button type="button" onClick={goPrevYear} className="rounded p-0.5 hover:bg-gray-100">
                      <MdKeyboardDoubleArrowLeft size={16} />
                    </button>
                    <button type="button" onClick={goPrevMonth} className="rounded p-0.5 hover:bg-gray-100">
                      <MdKeyboardArrowLeft size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openMonthPicker(0)}
                        className="text-[11px] transition-colors hover:text-green-500"
                      >
                        {format(firstMonthDate, "MMMM")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openYearPicker(0)}
                        className="text-[11px] transition-colors hover:bg-gray-100"
                      >
                        {format(firstMonthDate, "yyyy")}
                      </button>
                    </div>
                </div>
                <div style={{padding: '0 14px'}} className="calendar-shared-header w-full !flex !flex-row !justify-between !items-center gap-2 px-1">

                  <div className="flex items-center justify-center gap-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => openMonthPicker(1)}
                        className="text-[11px] transition-colors hover:bg-gray-100 whitespace-nowrap"
                      >
                        {format(secondMonthDate, "MMMM")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openYearPicker(1)}
                        className="text-[11px] transition-colors hover:bg-gray-100 whitespace-nowrap"
                      >
                        {format(secondMonthDate, "yyyy")}
                      </button>
                    </div>

                  <div className="flex items-center gap-0.5 justify-end">
                    <button type="button" onClick={goNextMonth} className="rounded p-0.5 hover:bg-gray-100">
                      <MdKeyboardArrowRight size={16} />
                    </button>
                    <button type="button" onClick={goNextYear} className="rounded p-0.5 hover:bg-gray-100">
                      <MdKeyboardDoubleArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {picker ? (
                <div className="px-3 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-[12px] font-medium text-gray-700">
                      {picker.mode === "year"
                        ? "Select Year"
                        : `Select Month${picker.mode === "year-month" ? ` for ${pickerYear}` : `, ${pickerYear}`}`}
                    </div>
                    {picker.mode !== "year" && (
                      <button
                        type="button"
                        onClick={() =>
                          setPicker({ slot: picker.slot, mode: "year" })
                        }
                        className="rounded px-2 py-1 text-[11px] text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        Change year
                      </button>
                    )}
                  </div>

                  {picker.mode === "year" ? (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPickerYear((prev) => prev - 12)}
                          className="rounded px-2 py-1 text-[14px] text-gray-600 transition-colors hover:bg-gray-100"
                        >
                          ‹
                        </button>
                        <div className="text-[12px] font-medium text-gray-700">
                          {yearGrid[0]} - {yearGrid[yearGrid.length - 1]}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPickerYear((prev) => prev + 12)}
                          className="rounded px-2 py-1 text-[14px] text-gray-600 transition-colors hover:bg-gray-100"
                        >
                          ›
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {yearGrid.map((year) => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => handleYearSelection(year)}
                            className={`rounded border px-2 py-2 text-[12px] transition-colors hover:bg-gray-100 ${
                              year === pickerYear
                                ? "border-gray-400 bg-gray-50 text-gray-900"
                                : "border-gray-200 text-gray-700"
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {MONTH_LABELS.map((monthLabel, monthIndex) => {
                        const activeMonth = getMonthDateForSlot(shownDate, picker.slot);
                        const isActive =
                          monthIndex === activeMonth.getMonth() &&
                          pickerYear === activeMonth.getFullYear();

                        return (
                          <button
                            key={monthLabel}
                            type="button"
                            onClick={() =>
                              applyMonthSelection(
                                picker.slot,
                                pickerYear,
                                monthIndex,
                              )
                            }
                            className={`rounded border px-2 py-2 text-[12px] transition-colors hover:bg-gray-100 ${
                              isActive
                                ? "border-gray-400 bg-gray-50 text-gray-900"
                                : "border-gray-200 text-gray-700"
                            }`}
                          >
                            {monthLabel.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex w-full">
                  <CalendarMonth
                    month={firstMonthDate}
                    range={displayRange}
                    onSelectDate={handleSelectDate}
                    onHoverDate={(date) => {
                      if (isSelectingEnd && range.startDate) {
                        setHoverDate(date);
                      }
                    }}
                    onLeaveMonth={() => setHoverDate(null)}
                  />
                  <CalendarMonth
                    month={secondMonthDate}
                    range={displayRange}
                    onSelectDate={handleSelectDate}
                    onHoverDate={(date) => {
                      if (isSelectingEnd && range.startDate) {
                        setHoverDate(date);
                      }
                    }}
                    onLeaveMonth={() => setHoverDate(null)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
