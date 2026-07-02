import raw from "./bookings.json";
import calendarRaw from "./calendar-bookings.json";
import type { FinanceBookingsMockData } from "./types";
import type { FinanceCalendarMockData } from "./calendar-types";

export type {
  FinanceApprovalStatus,
  FinanceBookingRow,
  FinanceBookingsMockData,
  FinancePaymentStatus,
} from "./types";

export type {
  FinanceCalendarBooking,
  FinanceCalendarBookingStatus,
  FinanceCalendarMockData,
} from "./calendar-types";

export const FINANCE_BOOKINGS_MOCK = raw as FinanceBookingsMockData;
export const FINANCE_CALENDAR_MOCK = calendarRaw as FinanceCalendarMockData;
