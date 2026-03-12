"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

interface BookingFieldSyncContextValue {
  bookingStatus: string;
  cancellationDate: string;
  setBookingStatus: (status: string) => void;
  setCancellationDate: (date: string) => void;
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

  const value = useMemo(
    () => ({
      bookingStatus,
      cancellationDate,
      setBookingStatus,
      setCancellationDate,
    }),
    [bookingStatus, cancellationDate],
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
