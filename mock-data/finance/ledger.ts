export type LedgerMockEntry = {
  type: "opening" | "quotation" | "payment";
  customId?: string;
  paymentStatus?: "none" | "partial" | "paid";
  amount: number;
  paymentDate?: string;
  date?: string;
  paymentType?: string;
  bankId?: { _id: string; name: string };
  closingBalance: { amount: number; balanceType: "debit" | "credit" };
  data?: Record<string, unknown>;
  invoiceCustomId?: string;
  travelDate?: string;
};

export type LedgerMockData = {
  closingBalance: { amount: number; balanceType: "debit" | "credit" };
  entries: LedgerMockEntry[];
};

export const FINANCE_CUSTOMER_LEDGER_MOCK: LedgerMockData = {
  closingBalance: { amount: 145000, balanceType: "credit" },
  entries: [
    {
      type: "quotation",
      customId: "OS-XYZ223",
      invoiceCustomId: "INV-2699",
      paymentStatus: "none",
      amount: 54000,
      date: "2026-03-15",
      closingBalance: { amount: 145000, balanceType: "debit" },
      bankId: { _id: "bank-axis", name: "Axis Bank" },
      data: {
        quotationType: "flight",
        serviceStatus: "confirmed",
        formFields: {
          bookingdate: "2026-03-15",
          traveldate: "2026-04-02",
        },
      },
    },
    {
      type: "payment",
      customId: "PI-AB129",
      amount: 20000,
      paymentDate: "2026-03-12",
      paymentType: "RTGS",
      closingBalance: { amount: 91000, balanceType: "debit" },
      bankId: { _id: "bank-axis", name: "Axis Bank" },
      data: { paymentDate: "2026-03-12" },
    },
    {
      type: "quotation",
      customId: "OS-MNO441",
      invoiceCustomId: "INV-2701",
      paymentStatus: "partial",
      amount: 32000,
      date: "2026-03-10",
      closingBalance: { amount: 111000, balanceType: "debit" },
      bankId: { _id: "bank-hdfc", name: "HDFC Bank" },
      data: {
        quotationType: "transportation",
        serviceStatus: "confirmed",
        formFields: {
          bookingdate: "2026-03-10",
          traveldate: "2026-03-28",
        },
      },
    },
    {
      type: "payment",
      customId: "PO-CD882",
      amount: 15000,
      paymentDate: "2026-03-08",
      paymentType: "Cash",
      closingBalance: { amount: 79000, balanceType: "debit" },
      bankId: { _id: "bank-cash", name: "Cash" },
      data: { paymentDate: "2026-03-08" },
    },
    {
      type: "quotation",
      customId: "OS-PQR778",
      invoiceCustomId: "INV-2695",
      paymentStatus: "paid",
      amount: 28500,
      date: "2026-03-05",
      closingBalance: { amount: 94000, balanceType: "debit" },
      bankId: { _id: "bank-axis", name: "Axis Bank" },
      data: {
        quotationType: "accommodation",
        serviceStatus: "cancelled",
        formFields: {
          bookingdate: "2026-03-05",
          traveldate: "2026-03-20",
        },
      },
    },
    {
      type: "quotation",
      customId: "OS-STU992",
      invoiceCustomId: "INV-2688",
      paymentStatus: "none",
      amount: 42000,
      date: "2026-02-28",
      closingBalance: { amount: 122500, balanceType: "debit" },
      data: {
        quotationType: "activity",
        serviceStatus: "rescheduled",
        formFields: {
          bookingdate: "2026-02-28",
          traveldate: "2026-03-18",
        },
      },
    },
    {
      type: "payment",
      customId: "PI-EF334",
      amount: 35000,
      paymentDate: "2026-02-25",
      paymentType: "RTGS",
      closingBalance: { amount: 80500, balanceType: "debit" },
      bankId: { _id: "bank-sbi", name: "SBI" },
      data: { paymentDate: "2026-02-25" },
    },
    {
      type: "quotation",
      customId: "OS-VWX115",
      invoiceCustomId: "INV-2680",
      paymentStatus: "partial",
      amount: 45500,
      date: "2026-02-20",
      closingBalance: { amount: 45500, balanceType: "credit" },
      bankId: { _id: "bank-axis", name: "Axis Bank" },
      data: {
        quotationType: "flight",
        serviceStatus: "confirmed",
        formFields: {
          bookingdate: "2026-02-20",
          traveldate: "2026-03-12",
        },
      },
    },
  ],
};

export const FINANCE_VENDOR_LEDGER_MOCK: LedgerMockData = {
  closingBalance: { amount: 82000, balanceType: "credit" },
  entries: FINANCE_CUSTOMER_LEDGER_MOCK.entries.map((entry) => ({
    ...entry,
    closingBalance: {
      amount: Math.abs(entry.closingBalance.amount),
      balanceType:
        entry.type === "payment" ? ("debit" as const) : ("credit" as const),
    },
  })),
};
