"use client";

import React, { useMemo, useState } from "react";
import { FiChevronDown, FiDownload } from "react-icons/fi";
import { IoCalendarClearOutline, IoLocationSharp } from "react-icons/io5";

type BreakdownRow = {
  label: string;
  amount: number;
  isTotal?: boolean;
};

type Props = {
  itineraryName?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  nightsLabel?: string;
  totalNetPrice?: number;
  breakdown?: BreakdownRow[];
  currencySymbol?: string;
  onDownloadPdf?: () => void;
};

const formatMoney = (currencySymbol: string, value: number) => {
  const safe = Number.isFinite(value) ? value : 0;
  return `${currencySymbol} ${safe.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const SelectedPackageCard = ({
  itineraryName = "ITINERARY ABC",
  destination = "Dubai",
  startDate = "05-05-2025",
  endDate = "12-05-2025",
  nightsLabel = "7N",
  totalNetPrice = 12500,
  breakdown,
  currencySymbol = "₹",
  onDownloadPdf,
}: Props) => {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const breakdownRows = useMemo<BreakdownRow[]>(
    () =>
      breakdown ?? [
        { label: "Total Flight Fare", amount: 10000 },
        { label: "Sightseeing + Transfers Prices", amount: 2500 },
        { label: "Taxes & Fees", amount: 0 },
        { label: "Total", amount: totalNetPrice, isTotal: true },
      ],
    [breakdown, totalNetPrice],
  );

  return (
    <div className="rounded-[12px] border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-3">
        <div className="text-[16px] font-medium text-[#020202]">
          Selected Package
        </div>
      </div>
      <div className="border-t border-gray-200" />

      <div className="p-5 space-y-4">
        {/* Itinerary headline */}
        <div className="text-[14px] -mt-1 font-semibold text-[#020202] tracking-wide">
          {itineraryName}
        </div>

        {/* Destination + Dates */}
        <div className="flex items-center justify-between gap-10 flex-wrap">
          <div className="flex items-center gap-24 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700">
              <IoLocationSharp className="text-gray-400" size={18} />
              <span className="text-[14px] text-[#818181]">{destination}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[15px] text-[#020202] font-medium">
                <IoCalendarClearOutline className="text-[#020202]" size={18} />
                <span>{startDate}</span>
                <span className="text-gray-400 font-medium">→</span>
                <span>{endDate}</span>
              </div>

              <div className="w-px h-6 bg-gray-200 hidden sm:block" />

              <div className="text-[15px] text-[#020202] font-medium">
                {nightsLabel}
              </div>
            </div>
          </div>

          {/* <button
            type="button"
            className="w-10 h-10 rounded-[10px] bg-[#EAF3FF] border border-blue-200 flex items-center justify-center hover:bg-blue-50"
            aria-label="Edit package"
          >
            <span className="text-blue-600 text-[18px] leading-none">✎</span>
          </button> */}
        </div>

        {/* Price + Breakdown */}
        <div className="rounded-[12px] bg-[#F8F8F8] p-4">
          <div className="flex items-center justify-between">
            <div className="text-[14px] font-medium text-[#818181]">
              Total Net Price
            </div>
            <div className="text-[18px] font-semibold text-[#020202]">
              {formatMoney(currencySymbol, totalNetPrice)}
            </div>
          </div>

          <div className="border-t border-gray-200 my-3" />

          <button
            type="button"
            onClick={() => setIsBreakdownOpen((v) => !v)}
            className="w-full flex items-center justify-center gap-2 text-[14px] text-gray-600 hover:text-gray-800"
            aria-expanded={isBreakdownOpen}
          >
            <span>View Payment Breakdown</span>
            <FiChevronDown
              className={`transition-transform ${
                isBreakdownOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {isBreakdownOpen && (
            <div className="mt-4 rounded-[12px] bg-white border border-gray-200 p-4">
              <div className="space-y-2">
                {breakdownRows.map((row, idx) => (
                  <div key={`${row.label}-${idx}`}>
                    <div
                      className={`flex items-center justify-between text-[13px] ${
                        row.isTotal
                          ? "font-semibold text-[#020202]"
                          : "text-gray-600"
                      }`}
                    >
                      <span>{row.label}</span>
                      <span
                        className={
                          row.isTotal ? "text-[#020202]" : "text-[#020202]"
                        }
                      >
                        {formatMoney(currencySymbol, row.amount)}
                      </span>
                    </div>

                    {!row.isTotal && idx !== breakdownRows.length - 2 && (
                      <div className="border-t border-gray-100 my-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#EAF3FF] text-blue-700 font-semibold text-[14px] hover:bg-blue-100"
          >
            <FiDownload />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectedPackageCard;
