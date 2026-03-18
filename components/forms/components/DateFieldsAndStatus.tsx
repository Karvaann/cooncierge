"use client";

import React, { useEffect, useRef } from "react";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import { isAfterDate } from "@/utils/helper";
import { useBookingFieldSync } from "@/context/BookingFieldSyncContext";

const statusOptions = [
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
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
  onNewBookingDateChange?: (date: string) => void;
  onNewTravelDateChange?: (date: string) => void;
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
  onNewBookingDateChange,
  onNewTravelDateChange,
}) => {
  const sync = useBookingFieldSync();

  // Refs to track the last context value we processed, so we only react to
  // changes made by the other instance.
  const prevSyncStatusRef = useRef(sync?.bookingStatus ?? "");
  const prevSyncCancDateRef = useRef(sync?.cancellationDate ?? "");
  const prevSyncNewBookingRef = useRef(sync?.newBookingDate ?? "");
  const prevSyncNewTravelRef = useRef(sync?.newTravelDate ?? "");
  const prevSyncBookingRef = useRef(sync?.bookingDate ?? "");
  const prevSyncTravelRef = useRef(sync?.travelDate ?? "");

  // When the shared context bookingStatus changes,
  // propagate to this form's parent via the existing callback.
  useEffect(() => {
    if (!sync || sync.bookingStatus === prevSyncStatusRef.current) return;
    prevSyncStatusRef.current = sync.bookingStatus;
    if (sync.bookingStatus !== bookingstatus) {
      onBookingStatusChange(sync.bookingStatus);
    }
  }, [sync?.bookingStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // cancellationDate.
  useEffect(() => {
    if (!sync || sync.cancellationDate === prevSyncCancDateRef.current) return;
    prevSyncCancDateRef.current = sync.cancellationDate;
    if (sync.cancellationDate !== (cancellationDate ?? "")) {
      onCancellationDateChange?.(sync.cancellationDate);
    }
  }, [sync?.cancellationDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // newBookingDate.
  useEffect(() => {
    if (!sync || sync.newBookingDate === prevSyncNewBookingRef.current) return;
    prevSyncNewBookingRef.current = sync.newBookingDate;
    if (sync.newBookingDate) {
      onNewBookingDateChange?.(sync.newBookingDate);
    }
  }, [sync?.newBookingDate]);

  // newTravelDate.
  useEffect(() => {
    if (!sync || sync.newTravelDate === prevSyncNewTravelRef.current) return;
    prevSyncNewTravelRef.current = sync.newTravelDate;
    if (sync.newTravelDate) {
      onNewTravelDateChange?.(sync.newTravelDate);
    }
  }, [sync?.newTravelDate]);

  // bookingDate.
  useEffect(() => {
    if (!sync || sync.bookingDate === prevSyncBookingRef.current) return;
    prevSyncBookingRef.current = sync.bookingDate;
    if (sync.bookingDate !== bookingdate) {
      onBookingDateChange(sync.bookingDate);
    }
  }, [sync?.bookingDate]);

  // travelDate.
  useEffect(() => {
    if (!sync || sync.travelDate === prevSyncTravelRef.current) return;
    prevSyncTravelRef.current = sync.travelDate;
    if (sync.travelDate !== traveldate) {
      onTravelDateChange(sync.travelDate);
    }
  }, [sync?.travelDate]);

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
    // notify parent
    onBookingDateChange(date);

    // update shared state so other forms see it
    sync?.setBookingDate(date);
    prevSyncBookingRef.current = date;

    if (bookingdate !== date) {
      // clear travel date if booking date changed to something else
      onTravelDateChange("");
      sync?.setTravelDate("");
      return;
    }

    if (traveldate && isAfterDate(date, traveldate)) {
      onTravelDateChange("");
      sync?.setTravelDate("");
    }
  };

  const handleTravelDateChange = (date: string) => {
    onTravelDateChange(date);
    sync?.setTravelDate(date);
    prevSyncTravelRef.current = date;
  };

  const handleNewBookingDateChange = (date: string) => {
    onNewBookingDateChange?.(date);
    sync?.setNewBookingDate(date);
    prevSyncNewBookingRef.current = date;
  };

  const handleNewTravelDateChange = (date: string) => {
    onNewTravelDateChange?.(date);
    sync?.setNewTravelDate(date);
    prevSyncNewTravelRef.current = date;
  };

  return (
    <div className="flex flex-wrap items-start justify-between mb-3">
      <div className="">
        {/* Left section: Booking + Travel Date */}
        <div className="flex items-start flex-wrap gap-2">
          {/* Booking Date */}
          <SingleCalendar
            label="Booking Date"
            value={bookingdate}
            onChange={handleBookingDateChange}
            placeholder="Select Date"
            customWidth="w-[12rem]"
            inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
          />

          {/* Travel Date */}
          <SingleCalendar
            label="Travel Date"
            value={traveldate}
            onChange={handleTravelDateChange}
            placeholder="Select Date"
            minDate={bookingdate}
            minTypeable={bookingdate}
            readOnly={false}
            customWidth="w-[12rem]"
            showCalendarIcon={true}
            inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
          />
        </div>
        {/* Cancellation Date row shown when booking is cancelled */}
        {bookingstatus?.toLowerCase() === "cancelled" && (
          <div className="w-full mb-5 mt-[14px]">
            <SingleCalendar
              label="Cancellation Date"
              value={cancellationDate || ""}
              onChange={handleCancellationDateChange}
              placeholder="Select Date"
              customWidth="w-full"
              showCalendarIcon={true}
              inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
            />
          </div>
        )}

        {/* New Booking/Travel Date row shown when booking is rescheduled */}
        {bookingstatus?.toLowerCase() === "rescheduled" && (
          <div className="flex items-start flex-wrap gap-2 mb-5 mt-[14px]">
            <SingleCalendar
              label="New Booking Date"
              value={sync?.newBookingDate || ""}
              onChange={handleNewBookingDateChange}
              placeholder="Select Date"
              customWidth="w-[12rem]"
              inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
            />

            <SingleCalendar
              label="New Travel Date"
              value={sync?.newTravelDate || ""}
              onChange={handleNewTravelDateChange}
              placeholder="Select Date"
              minDate={sync?.newBookingDate || bookingdate}
              customWidth="w-[12rem]"
              inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
            />
          </div>
        )}
      </div>

      {/* Right section: Booking Status */}
      <div className="mt-5">
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
  );
};

export default DateFieldsAndStatus;
