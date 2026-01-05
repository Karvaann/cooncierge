"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DateRange, type RangeKeyDict } from "react-date-range";
import { FaRegCalendar } from "react-icons/fa6";

import { enUS } from "date-fns/locale";
import { format } from "date-fns";

const customLocale = {
  ...enUS,
  localize: {
    ...enUS.localize,
    day: (n: number) => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][n],
  },
};

type Props = {
  label: string;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
};

const presetRanges = [
  {
    label: "Today",
    getValue: () => {
      const today = new Date();
      return {
        startDate: today,
        endDate: today,
      };
    },
  },

  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: yesterday,
      };
    },
  },

  {
    label: "This Week",
    getValue: () => {
      const now = new Date();
      const day = now.getDay(); // 0 (Sun) - 6 (Sat)
      const diff = day === 0 ? -6 : 1 - day; // Monday as first day

      const start = new Date(now);
      start.setDate(now.getDate() + diff);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return { startDate: start, endDate: end };
    },
  },

  {
    label: "Last Week",
    getValue: () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;

      const start = new Date(now);
      start.setDate(now.getDate() + diff - 7);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return { startDate: start, endDate: end };
    },
  },

  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    },
  },

  {
    label: "Last Month",
    getValue: () => {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
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

const toDate = (val?: string) => (val ? new Date(val) : null);

export default function DateRangeInput({
  label,
  startDate,
  endDate,
  onChange,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [ranges, setRanges] = useState([
    {
      startDate: toDate(startDate) ?? new Date(),
      endDate: toDate(endDate) ?? toDate(startDate) ?? new Date(),
      key: "selection",
    },
  ]);

  const [shownDate, setShownDate] = useState<Date>(
    ranges[0]?.startDate ?? new Date()
  );

  useEffect(() => {
    setRanges([
      {
        startDate: toDate(startDate) ?? new Date(),
        endDate: toDate(endDate) ?? toDate(startDate) ?? new Date(),
        key: "selection",
      },
    ]);
  }, [startDate, endDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayValue = useMemo(() => {
    const start = toDate(startDate);
    const end = toDate(endDate);
    const formatter = (d: Date) =>
      d
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "-");
    return {
      start: start ? formatter(start) : "Start Date",
      end: end ? formatter(end) : "End Date",
    };
  }, [startDate, endDate]);

  const firstMonthDate = shownDate;

  const firstMonthLabel = firstMonthDate.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const secondMonthDate = new Date(
    firstMonthDate.getFullYear(),
    firstMonthDate.getMonth() + 1,
    1
  );
  const secondMonthLabel = secondMonthDate.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const handleRangeChange = (items: RangeKeyDict) => {
    const sel = items.selection;
    if (!sel) return;

    const nextStart = sel.startDate ?? new Date();
    const nextEnd = sel.endDate ?? nextStart;

    setRanges([{ startDate: nextStart, endDate: nextEnd, key: "selection" }]);
    setShownDate(nextStart); // 👈 keep calendar header in sync
    onChange(nextStart.toISOString(), nextEnd.toISOString());
  };

  const applyPreset = (getter: () => { startDate: Date; endDate: Date }) => {
    const next = getter();
    setRanges([{ ...next, key: "selection" }]);
    onChange(next.startDate.toISOString(), next.endDate.toISOString());
    setOpen(false);
  };

  // Clear both dates and reset internal ranges
  const clearDates = () => {
    setRanges([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: "selection",
      },
    ]);
    setShownDate(new Date());
    onChange("", "");
  };

  const goPrevMonth = () => {
    setShownDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );

    const elem = document.getElementsByClassName("rdrPprevButton")[0];
    console.log(elem);
    if (elem && elem instanceof HTMLButtonElement) {
      elem.click();
    }
  };

  const goNextMonth = () => {
    setShownDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );

    const elem = document.getElementsByClassName("rdrNextButton")[0];
    console.log(elem);
    if (elem && elem instanceof HTMLButtonElement) {
      elem.click();
    }
  };

  return (
    <div className="relative date-range-custom" ref={ref}>
      <label className="block text-gray-700 mb-1 text-[14px] font-medium">
        {label}
      </label>

      <button
        type="button"
        className="relative flex items-center min-w-[12rem] w-[17rem] max-h-[2.8rem]  gap-3 border border-gray-300 rounded-sm px-3 py-3 bg-white hover:border-green-200 transition-colors select-none text-[14px]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-[#9CA3AF] font-medium">{displayValue.start}</span>
        <span className="text-gray-400 mx-1">→</span>
        <span className="text-[#9CA3AF] font-medium flex-1 text-left">
          {displayValue.end}
        </span>
        {startDate && endDate ? (
          <span
            role="button"
            aria-label="Clear dates"
            onClick={(e) => {
              e.stopPropagation();
              clearDates();
            }}
            className="text-[#9CA3AF] -mt-1 hover:text-gray-600 rounded-sm cursor-pointer"
          >
            {/* simple X SVG */}
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
          <span className="text-gray-400 -mt-1">
            <FaRegCalendar />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute mt-2 z-50 rounded-md bg-white border border-gray-200 p-2 w-[500px] h-[240px] date-range-popover">
          <div className="flex gap-0">
            <div className="presets-column h-fit w-26 border-r border-gray-200 p-2 space-y-1">
              {presetRanges.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.getValue)}
                  className="block w-full text-left text-[0.70rem] text-gray-800 hover:bg-gray-50 py-2 px-2 rounded transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex-1 p-2 overflow-x-hidden">
              <div className="calendar-shared-header">
                <button type="button" onClick={goPrevMonth}>
                  ‹
                </button>

                <div className="calendar-title">{firstMonthLabel}</div>

                <div className="calendar-title">{secondMonthLabel}</div>

                <button type="button" onClick={goNextMonth}>
                  ›
                </button>
              </div>
              <DateRange
                className="date-range-picker"
                locale={customLocale}
                dayContentRenderer={(date) => (
                  <span className="rdrDayNumber">
                    {format(date, "dd")}
                  </span>
                )}
                ranges={ranges}
                onChange={handleRangeChange}
                showDateDisplay={false}
                moveRangeOnFirstSelection={false}
                rangeColors={["#0D4B37"]}
                months={2}
                direction="horizontal"
                editableDateInputs={false}
                shownDate={shownDate}
                showMonthAndYearPickers={false}
                onShownDateChange={(date) => {
                  setShownDate(date);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
