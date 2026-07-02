import raw from "./bookings.json";
import type { FinanceBookingsMockData } from "./types";

export type {
  FinanceBookingRow,
  FinanceBookingsMockData,
  FinancePaymentStatus,
} from "./types";

export const FINANCE_BOOKINGS_MOCK = raw as FinanceBookingsMockData;
