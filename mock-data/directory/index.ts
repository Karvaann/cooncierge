import customersJson from "./customers.json";
import draftCustomersJson from "./draft-customers.json";
import travellersJson from "./travellers.json";
import vendorsJson from "./vendors.json";
import bookingHistoryJson from "./booking-history.json";
import type {
  MockBookingHistoryRow,
  MockCustomerRow,
  MockTravellerRow,
  MockVendorRow,
} from "./types";

export type {
  MockBookingHistoryRow,
  MockCustomerRow,
  MockCustomerSource,
  MockCustomerSourceType,
  MockTravellerRow,
  MockVendorRow,
} from "./types";

export const MOCK_CUSTOMERS = customersJson as MockCustomerRow[];
export const MOCK_DRAFT_CUSTOMERS = draftCustomersJson as MockCustomerRow[];
export const MOCK_TRAVELLERS = travellersJson as MockTravellerRow[];
export const MOCK_VENDORS = vendorsJson as MockVendorRow[];
export const MOCK_BOOKING_HISTORY =
  bookingHistoryJson as MockBookingHistoryRow[];
