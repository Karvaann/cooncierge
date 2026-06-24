"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

interface BookingFieldSyncContextValue {
  bookingStatus: string;
  cancellationDate: string;
  newBookingDate: string;
  newTravelDate: string;
  bookingDate: string;
  travelDate: string;

  bookingStatusSource: string;
  bookingDateSource: string;
  travelDateSource: string;

  // Atomic setters
  updateBookingStatus: (status: string, source: string) => void;
  updateBookingDate: (date: string, source: string) => void;
  updateTravelDate: (date: string, source: string) => void;

  // These don't need source tracking
  setCancellationDate: (date: string) => void;
  setNewBookingDate: (date: string) => void;
  setNewTravelDate: (date: string) => void;
}

const BookingFieldSyncContext =
  createContext<BookingFieldSyncContextValue | null>(null);

export function BookingFieldSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bookingStatus, setBookingStatus] = useState("");
  const [cancellationDate, setCancellationDate] = useState("");
  const [newBookingDate, setNewBookingDate] = useState("");
  const [newTravelDate, setNewTravelDate] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [travelDate, setTravelDate] = useState("");

  const [bookingStatusSource, setBookingStatusSource] = useState("");
  const [bookingDateSource, setBookingDateSource] = useState("");
  const [travelDateSource, setTravelDateSource] = useState("");

  // Atomic updates
  const updateBookingStatus = (status: string, source: string) => {
    setBookingStatus(status);
    setBookingStatusSource(source);
  };

  const updateBookingDate = (date: string, source: string) => {
    setBookingDate(date);
    setBookingDateSource(source);
  };

  const updateTravelDate = (date: string, source: string) => {
    setTravelDate(date);
    setTravelDateSource(source);
  };

  const value = useMemo(
    () => ({
      bookingStatus,
      cancellationDate,
      newBookingDate,
      newTravelDate,
      bookingDate,
      travelDate,

      bookingStatusSource,
      bookingDateSource,
      travelDateSource,

      updateBookingStatus,
      updateBookingDate,
      updateTravelDate,

      setCancellationDate,
      setNewBookingDate,
      setNewTravelDate,
    }),
    [
      bookingStatus,
      cancellationDate,
      newBookingDate,
      newTravelDate,
      bookingDate,
      travelDate,
      bookingStatusSource,
      bookingDateSource,
      travelDateSource,
    ],
  );

  return (
    <BookingFieldSyncContext.Provider value={value}>
      {children}
    </BookingFieldSyncContext.Provider>
  );
}

// Safe hook
export function useBookingFieldSync() {
  const context = useContext(BookingFieldSyncContext);

  if (!context) {
    throw new Error(
      "useBookingFieldSync must be used within BookingFieldSyncProvider",
    );
  }

  return context;
}
