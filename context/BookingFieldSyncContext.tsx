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
  internalNotes: string;
  setBookingStatus: (status: string) => void;
  setCancellationDate: (date: string) => void;
  setNewBookingDate: (date: string) => void;
  setNewTravelDate: (date: string) => void;
  setBookingDate: (date: string) => void;
  setTravelDate: (date: string) => void;
  setBookingStatusSource: (source: string) => void;
  setBookingDateSource: (source: string) => void;
  setTravelDateSource: (source: string) => void;
  setInternalNotes: (notes: string) => void;
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
  const [internalNotes, setInternalNotes] = useState("");

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
      internalNotes,
      setBookingStatus,
      setCancellationDate,
      setNewBookingDate,
      setNewTravelDate,
      setBookingDate,
      setTravelDate,
      setBookingStatusSource,
      setBookingDateSource,
      setTravelDateSource,
      setInternalNotes,
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
      internalNotes,
    ],
  );

  return (
    <BookingFieldSyncContext.Provider value={value}>
      {children}
    </BookingFieldSyncContext.Provider>
  );
}

export function useBookingFieldSync() {
  return useContext(BookingFieldSyncContext);
}
