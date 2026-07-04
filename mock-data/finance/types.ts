export type FinancePaymentStatus = "paid" | "partially_paid" | "pending";

export type FinanceApprovalStatus = "approved" | "pending" | "rejected";

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
  hasVoucher?: boolean;
  isDeleted: boolean;
  isIncomplete: boolean;
  isWaitingForApproval?: boolean;
  requiresApprovalAction?: boolean;
  approvalStatus?: FinanceApprovalStatus;
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
