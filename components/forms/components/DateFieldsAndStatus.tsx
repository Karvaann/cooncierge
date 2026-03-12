"use client";

import React, { useEffect, useRef } from "react";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import { isAfterDate } from "@/utils/helper";
import { useBookingFieldSync } from "@/context/BookingFieldSyncContext";

const statusOptions = [
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "reschedulled", label: "Rescedulled" },
];

interface DateFieldsAndStatusProps {
  bookingdate: string;
  traveldate: string;
  bookingstatus: string;
  cancellationDate?: string;
  onBookingDateChange: (date: string) => void;
  onTravelDateChange: (date: string) => void;
  onBookingStatusChange: (status: string) => void;
  onCancellationDateChange?: (date: string) => void;
}

const DateFieldsAndStatus: React.FC<DateFieldsAndStatusProps> = ({
  bookingdate,
  traveldate,
  bookingstatus,
  cancellationDate,
  onBookingDateChange,
  onTravelDateChange,
  onBookingStatusChange,
  onCancellationDateChange,
}) => {
  const sync = useBookingFieldSync();

  // Refs to track the last context value we processed, so we only react to
  // changes made by the OTHER DateFieldsAndStatus instance.
  const prevSyncStatusRef = useRef(sync?.bookingStatus ?? "");
  const prevSyncCancDateRef = useRef(sync?.cancellationDate ?? "");

  // When the shared context bookingStatus changes (another form updated it),
  // propagate to this form's parent via the existing callback.
  useEffect(() => {
    if (!sync || sync.bookingStatus === prevSyncStatusRef.current) return;
    prevSyncStatusRef.current = sync.bookingStatus;
    if (sync.bookingStatus !== bookingstatus) {
      onBookingStatusChange(sync.bookingStatus);
    }
  }, [sync?.bookingStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Same for cancellationDate.
  useEffect(() => {
    if (!sync || sync.cancellationDate === prevSyncCancDateRef.current) return;
    prevSyncCancDateRef.current = sync.cancellationDate;
    if (sync.cancellationDate !== (cancellationDate ?? "")) {
      onCancellationDateChange?.(sync.cancellationDate);
    }
  }, [sync?.cancellationDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = (value: string) => {
    const v = String(value || "");
    onBookingStatusChange(v);
    sync?.setBookingStatus(v);
    prevSyncStatusRef.current = v;
  };

  const handleCancellationDateChange = (date: string) => {
    onCancellationDateChange?.(date);
    sync?.setCancellationDate(date);
    prevSyncCancDateRef.current = date;
  };

  const handleBookingDateChange = (date: string) => {
    onBookingDateChange(date);
    if (bookingdate !== date) {
      onTravelDateChange("");
      return;
    }

    if (traveldate && isAfterDate(date, traveldate)) {
      onTravelDateChange("");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between mb-3">
        {/* Left section: Booking + Travel Date */}
        <div className="flex items-end flex-wrap gap-2">
          {/* Booking Date */}
          <SingleCalendar
            label="Booking Date"
            value={bookingdate}
            onChange={handleBookingDateChange}
            placeholder="Select Date"
            customWidth="w-[12rem]"
            inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
          />

          {/* Travel Date or Cancellation Date */}
          {bookingstatus?.toLowerCase() === "cancelled" ? (
            <SingleCalendar
              label="Cancellation Date"
              value={cancellationDate || ""}
              onChange={handleCancellationDateChange}
              placeholder="Select Date"
              customWidth="w-[12rem]"
              inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
            />
          ) : (
            <SingleCalendar
              label="Travel Date"
              value={traveldate}
              onChange={onTravelDateChange}
              placeholder="Select Date"
              minDate={bookingdate}
              minTypeable={bookingdate}
              readOnly={!bookingdate}
              customWidth="w-[12rem]"
              inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
            />
          )}
        </div>

        {/* Right section: Booking Status */}
        <div>
          <DropDown
            options={statusOptions}
            placeholder="Booking Status"
            value={bookingstatus}
            onChange={handleStatusChange}
            menuClassName="rounded-[14px] px-1.5"
            buttonClassName="px-3 py-1.5 hover:border-[#C6AEDE] rounded-[15px]"
            noButtonRadius
          />
        </div>
      </div>
    </>
  );
};

export default DateFieldsAndStatus;