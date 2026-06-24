"use client";

import React, { useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import BookingPeopleAndRemarks from "@/components/BookingPeopleAndRemarks";
import { FaCheck } from "react-icons/fa6";

type BookingOwner = {
  full: string;
  short: string;
  color: string;
};

type ItinerarySummary = {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  nightsLabel?: string;
  travellersCount?: number;
  status?: string;
};

type Props = {
  owners: BookingOwner[];
  width?: number | string;
  itinerary?: ItinerarySummary;
};

const ViewItineraryDetailsAccordian = ({ owners, width, itinerary }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const itineraryData = useMemo(
    () => ({
      title: "ITINERARY ABC",
      destination: "Dubai",
      startDate: "05-05-2025",
      endDate: "12-05-2025",
      nightsLabel: "7N",
      travellersCount: 3,
      status: "Booking Confirmed",
      ...itinerary,
    }),
    [itinerary],
  );

  const resolvedWidth =
    typeof width === "number" ? `${width}px` : (width as string | undefined);

  return (
    <div
      className="relative rounded-[14px] border border-gray-200 bg-white overflow-hidden"
      style={
        resolvedWidth ? { width: resolvedWidth, maxWidth: "100%" } : undefined
      }
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D4B37] to-[#2A7C5A] px-5 py-2.5 flex items-center justify-between">
        <div className="text-white text-[16px] font-semibold tracking-wide">
          {itineraryData.title}
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/40 bg-[#256651] text-white text-[11px] font-semibold">
          <FaCheck size={12} />
          {itineraryData.status}
        </span>
      </div>

      {/* Toggle button - centered and overlapping header */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="-mt-5 w-6 h-6 rounded-full bg-[#0D4B37] flex items-center justify-center shadow-md border border-white/40 z-20"
        >
          <FiChevronDown
            className={`text-white transition-transform ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          <BookingPeopleAndRemarks />
        </div>
      )}
    </div>
  );
};

export default ViewItineraryDetailsAccordian;
