export type FinancePaymentStatus = "paid" | "partially_paid" | "pending";

export type FinanceBookingOwner = {
  name: string;
  initials: string;
  color?: string;
};

export type FinanceBookingRow = {
  id: string;
  customId: string;
  leadPax: string;
  travelDate: string;
  bookingDate: string;
  quotationType: string;
  serviceLabel: string;
  serviceDisplayVariant?: "default" | "pill";
  paymentStatus: FinancePaymentStatus;
  amount: number;
  owners: FinanceBookingOwner[];
  taskCount: number;
  isDeleted: boolean;
  isIncomplete: boolean;
  isWaitingForApproval?: boolean;
  requiresApprovalAction?: boolean;
};

export type FinanceBookingsMockData = {
  summary: {
    net: number;
    youGive: number;
    youGet: number;
  };
  totalCount: number;
  bookings: FinanceBookingRow[];
};
