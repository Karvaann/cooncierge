export type FinanceCalendarBookingStatus =
  | "completed"
  | "on_trip"
  | "upcoming"
  | "cancelled";

export type FinanceCalendarBooking = {
  id: string;
  customId: string;
  date: string;
  startHour: number;
  startMinute?: number;
  durationHours?: number;
  quotationType: string;
  serviceLabel: string;
  detail?: string;
  detailDisplay?: "pill" | "plain";
  status: FinanceCalendarBookingStatus;
  bookingSource: "os" | "limitless";
  faded?: boolean;
};

export type FinanceCalendarMockData = {
  totalCount: number;
  statusSummary: {
    completed: number;
    on_trip: number;
    upcoming: number;
    cancelled: number;
  };
  bookings: FinanceCalendarBooking[];
};
