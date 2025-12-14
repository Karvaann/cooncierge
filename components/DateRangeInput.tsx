'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { DateRange, type RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { FaRegCalendar } from "react-icons/fa6";

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
      return { startDate: today, endDate: today };
    },
  },
  {
    label: "Last 7 Days",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
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

  const handleRangeChange = (items: RangeKeyDict) => {
    const sel = items.selection;
    if (!sel) return;
    const nextStart = sel.startDate ?? new Date();
    const nextEnd = sel.endDate ?? nextStart;
    setRanges([{ ...sel, startDate: nextStart, endDate: nextEnd }]);
    onChange(nextStart.toISOString(), nextEnd.toISOString());
  };

  const applyPreset = (getter: () => { startDate: Date; endDate: Date }) => {
    const next = getter();
    setRanges([{ ...next, key: "selection" }]);
    onChange(next.startDate.toISOString(), next.endDate.toISOString());
    setOpen(false);
  };

  return (
    <div className="relative date-range-custom" ref={ref}>
      <label className="block text-gray-700 mb-1 text-xs font-medium">
        {label}
      </label>

      <button
        type="button"
        className="relative flex items-center min-w-[20rem] w-[23rem] gap-3 border border-gray-300 rounded-xl px-4 py-2 bg-white hover:border-gray-400 shadow-sm transition-colors select-none text-[0.85rem]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-gray-700 font-medium">{displayValue.start}</span>
        <span className="text-gray-400 mx-1">→</span>
        <span className="text-gray-700 font-medium flex-1 text-left">
          {displayValue.end}
        </span>
        <span className="text-gray-400 -mt-1">
          <FaRegCalendar />
        </span>
      </button>

      {open && (
        <div className="absolute mt-2 z-50 rounded-xl shadow-2xl bg-white border border-gray-200 p-0 w-[38rem] date-range-popover">
          <div className="flex gap-0">
            <div className="w-36 border-r border-gray-200 p-2 space-y-1">
              {presetRanges.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p.getValue)}
                  className="block w-full text-left text-sm text-gray-800 hover:bg-gray-50 py-2 px-3 rounded transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex-1 p-2">
              <DateRange
                className="date-range-picker"
                ranges={ranges}
                onChange={handleRangeChange}
                showDateDisplay={false}
                moveRangeOnFirstSelection={false}
                rangeColors={["#0D4B37"]}
                months={2}
                direction="horizontal"
                editableDateInputs
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
