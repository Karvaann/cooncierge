"use client";

import React, { useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import BookingPeopleAndRemarks from "@/components/BookingPeopleAndRemarks";

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
      className="rounded-[10px] border border-gray-200 bg-white overflow-hidden"
      style={
        resolvedWidth ? { width: resolvedWidth, maxWidth: "100%" } : undefined
      }
    >
      {/* Header (matches screenshot style) */}
      <div className="bg-gradient-to-r from-[#0D4B37] to-[#2A7C5A] px-5 py-3 flex items-center justify-between">
        <div className="text-white text-[16px] font-semibold tracking-wide">
          {itineraryData.title}
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 bg-white/10 text-white text-[12px] font-semibold">
          <span className="w-2 h-2 rounded-full bg-white" />
          {itineraryData.status}
        </span>
      </div>

      {/* Summary row */}
      {/* <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EAF3FF] flex items-center justify-center">
              <IoLocationSharp className="text-[#0B5ED7]" size={16} />
            </div>
            <div className="text-[18px] font-semibold text-[#020202]">
              {itineraryData.destination}
            </div>
          </div>

          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          <div className="flex items-center gap-2 text-[16px] text-[#020202] font-semibold">
            <IoCalendarClearOutline className="text-[#0B5ED7]" size={18} />
            <span>{itineraryData.startDate}</span>
            <span className="text-gray-400 font-medium">→</span>
            <span>{itineraryData.endDate}</span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-gray-200" />

          <div className="text-[16px] text-[#020202] font-semibold">
            {itineraryData.nightsLabel}
          </div>

          <div className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[14px] font-semibold">
            {itineraryData.travellersCount} Travellers
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[13px] text-gray-700 tracking-wide">
            OWNERS :
          </div>
          <div className="flex items-center">
            {owners.map((o) => (
              <AvatarTooltip
                key={o.full}
                short={o.short}
                full={o.full}
                color={o.color}
              />
            ))}
          </div>
        </div>
      </div> */}

      <div className="border-t border-gray-200" />

      {/* Detailed Info toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full px-5 py-3 flex items-center justify-center text-left hover:bg-gray-50"
      >
        <FiChevronDown
          className={`text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          {/* SERVICE SUMMARY CARD (moved from view booking page) */}
          {/* <div className="rounded-[10px] border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0D4B37] to-[#2A7C5A] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-white text-[18px] font-semibold">
                  {booking.service}
                </h2>
                <span className="text-white/85">|</span>
                <span className="text-white text-[16px] font-semibold">
                  {booking.route}
                </span>
              </div>

              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 bg-white/10 text-white text-[12px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-white" />
                {booking.status}
              </span>
            </div>

            <div className="bg-white px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
                  BOOKING DATE
                </div>
                <div className="text-[18px] text-[#2B2B2B] font-semibold">
                  {booking.bookingDate}
                </div>
              </div>
              <div className="md:text-center">
                <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
                  TRAVEL DATE
                </div>
                <div className="text-[18px] text-[#2B2B2B] font-semibold">
                  {booking.travelDate}
                </div>
              </div>
              <div className="md:text-right">
                <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
                  CONFIRMATION NO. (PNR)
                </div>
                <div className="text-[18px] text-[#2B2B2B] font-semibold">
                  {booking.pnr}
                </div>
              </div>
            </div>
          </div> */}

          <BookingPeopleAndRemarks />
        </div>
      )}
    </div>
  );
};

export default ViewItineraryDetailsAccordian;
