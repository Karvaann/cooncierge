"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import SingleCalendar from "@/components/SingleCalendar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialStartDate: string;
  initialEndDate: string;
  onApply: (next: { startDate: string; endDate: string }) => void;
};

const computeNightsDaysDisplay = (start?: string, end?: string) => {
  const parseToUTC = (s?: string) => {
    if (!s || typeof s !== "string") return null;

    // If it's an ISO string (from SingleCalendar onChange) or YYYY-MM-DD-like, parse via Date
    if (s.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return null;
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // Otherwise expect DD-MM-YYYY or DD/MM/YYYY
    const parts = s.includes("-") ? s.split("-") : s.split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    const day = Number(dd);
    const monthIndex = Number(mm) - 1;
    const year = Number(yyyy);
    if (Number.isNaN(day) || Number.isNaN(monthIndex) || Number.isNaN(year)) {
      return null;
    }
    return Date.UTC(year, monthIndex, day);
  };

  const startUtc = parseToUTC(start);
  const endUtc = parseToUTC(end);
  if (startUtc === null || endUtc === null) return "";

  const msPerDay = 24 * 60 * 60 * 1000;
  // Round to nearest integer number of days to be resilient to DST/local offsets
  const diffDays = Math.round((endUtc - startUtc) / msPerDay);
  const nights = Math.max(0, diffDays);
  const days = nights + 1;

  return `${nights}N/${days}D`;
};

export default function ModifySearchModal({
  isOpen,
  onClose,
  initialStartDate,
  initialEndDate,
  onApply,
}: Props) {
  const [startDate, setStartDate] = useState<string>(initialStartDate || "");
  const [endDate, setEndDate] = useState<string>(initialEndDate || "");

  useEffect(() => {
    if (!isOpen) return;
    setStartDate(initialStartDate || "");
    setEndDate(initialEndDate || "");
  }, [isOpen, initialStartDate, initialEndDate]);

  // Keep end >= start (date-only compare)
  useEffect(() => {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

    const startUtc = Date.UTC(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    );
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    if (endUtc < startUtc) setEndDate(startDate);
  }, [startDate, endDate]);

  const nightsDaysDisplay = useMemo(
    () => computeNightsDaysDisplay(startDate, endDate),
    [startDate, endDate],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerLeft={
        <div className="text-[16px] font-semibold text-[#020202]">
          Modify Search
        </div>
      }
      customWidth="w-[570px]"
      className="rounded-[14px]"
    >
      <div className="px-1">
        <div className="space-y-4">
          <SingleCalendar
            label="Travel Start Date"
            value={startDate}
            onChange={setStartDate}
            customWidth="w-full"
            labelClassName="block text-[13px] font-medium text-gray-700 mb-2"
            inputClassName="w-full pr-8 text-[13px] text-gray-700 outline-none bg-transparent"
            disablePastDates={false}
            {...(endDate ? { maxDate: endDate } : {})}
          />

          <div className="space-y-2">
            <SingleCalendar
              label="Travel End Date"
              value={endDate}
              onChange={setEndDate}
              customWidth="w-full"
              labelClassName="block text-[13px] font-medium text-gray-700 mb-2"
              inputClassName="w-full pr-8 text-[13px] text-gray-700 outline-none bg-transparent"
              disablePastDates={false}
              {...(startDate ? { minDate: startDate } : {})}
            />

            {nightsDaysDisplay ? (
              <div className="inline-flex mt-2 items-center rounded-[8px] bg-gray-100 px-3 py-2 text-[14px] font-medium text-[#020202]">
                {nightsDaysDisplay}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button
            type="button"
            className="flex items-center text-[13px] cursor-pointer gap-[8px] px-[16px] py-[7px] rounded-[6px] bg-[#0D4B37] text-white font-[500] hover:bg-[#0B3E2E] disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={() => {
              onApply({ startDate, endDate });
              onClose();
            }}
            disabled={!startDate || !endDate}
          >
            Modify Search
          </button>
        </div>
      </div>
    </Modal>
  );
}
