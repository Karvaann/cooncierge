"use client";

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CiFilter } from "react-icons/ci";
import { HiArrowsUpDown } from "react-icons/hi2";
import { IoShareOutline } from "react-icons/io5";
import { LuRefreshCcw } from "react-icons/lu";
import { FiEye, FiEdit, FiPlus } from "react-icons/fi";
import { TbCircleArrowDownLeft, TbCircleArrowUpRight } from "react-icons/tb";
import { MdOutlineFileDownload } from "react-icons/md";
import Modal from "../../Modal";
import Table from "../../Table";
import FilterTrigger from "../../FilterTrigger";
import type { FilterCardOption } from "../../FilterCard";
import ConfirmationModal from "../../popups/ConfirmationModal";
import DeletePaymentModal from "../DeletePaymentModal";
import DropDown from "../../DropDown";
import { exportPDF, exportXLSX } from "@/utils/exportUtils";
import {
  isWithinDateRange,
  formatDate,
  formatMoney,
  toNumberOrZero,
  getStoredCurrencySymbol,
} from "@/utils/helper";
import {
  useLedgerBanks,
  useLedgerData,
  useLedgerQuotationApi,
  usePaymentCustomId,
} from "./components/LedgerModalApiHooks";
import LedgerRow from "./components/LedgerRow";
import DateRangeInputBeta from "@/components/DateRangeInputBeta";

const AddPaymentSidesheet = dynamic(
  () => import("../../Sidesheets/AddPaymentSidesheet"),
  { ssr: false, loading: () => null },
);

const ViewPaymentSidesheet = dynamic(
  () => import("../../Sidesheets/ViewPaymentSidesheet"),
  { ssr: false, loading: () => null },
);

const BookingFormSidesheet = dynamic(
  () => import("../../BookingFormSidesheet"),
  {
    ssr: false,
    loading: () => null,
  },
);

type LedgerStatus = "paid" | "none" | "partial";

export type LedgerRow = {
  id: string; // booking ID or payment ID
  bookingDate: string; // dd-mm-yyyy
  status: LedgerStatus;
  account: string | null;
  amount: number;
  party: "Customer" | "Vendor";
  partyId: string;
  partyName?: string;
  closingBalance: number;
  type: "booking" | "payment"; // to determine row color
};

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string | null;
  customerId?: string | null;
  rawId?: string | null;
  onRefresh?: () => void;
  onViewPdf?: () => void;
  onViewCustomer?: () => void;
  onEditCustomer?: () => void;
  isVendorLedger?: boolean;
}

const isEmptyScalar = (value: unknown): boolean => {
  return value == null || String(value).trim() === "";
};

const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  customerName = "Anand Mishra",
  rawId = null,
  customerId = "CU-AB001",
  onRefresh,
  onViewPdf,
  onViewCustomer,
  onEditCustomer,
  isVendorLedger = false,
}) => {
  const [paymentSidesheetOpen, setPaymentSidesheetOpen] = useState(false);
  const [paymentSidesheetTitle, setPaymentSidesheetTitle] =
    useState<string>("Payment Out");
  const [paymentSidesheetMode, setPaymentSidesheetMode] = useState<
    "create" | "edit"
  >("create");
  const [paymentInitial, setPaymentInitial] = useState<{
    _id?: string;
    customId?: string;
    amount?: string;
    amountCurrency?: string;
    amountRoe?: any;
    amountInr?: any;
    bankCharges?: string;
    bankChargesCurrency?: string;
    bankChargesRoe?: any;
    bankChargesInr?: any;
    bankChargesNotes?: string;
    cashbackReceived?: string;
    cashbackReceivedCurrency?: string;
    cashbackReceivedRoe?: any;
    cashbackReceivedInr?: any;
    cashbackNotes?: string;
    paymentDate?: string;
    bank?: string;
    paymentType?: string;
    internalNotes?: string;
  } | null>(null);

  const { ledgerData, fetchLedger } = useLedgerData({
    enabled: isOpen,
    rawId,
    isVendorLedger,
  });
  const [paymentCustomId, setPaymentCustomId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [bookingSidesheetOpen, setBookingSidesheetOpen] = useState(false);
  const [bookingInitialData, setBookingInitialData] = useState<any>(null);
  const [bookingCode, setBookingCode] = useState<string>("");

  // bank states
  const { banks } = useLedgerBanks({ enabled: isOpen });
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

  const {
    withHydratedPartyObjects,
    getHydratedQuotationById,
    deleteQuotation,
  } = useLedgerQuotationApi();
  const { generatePaymentCustomId } = usePaymentCustomId();

  const derivedBookingService = useMemo(() => {
    const quotationTypeRaw =
      bookingInitialData?.quotationType ||
      bookingInitialData?.data?.quotationType;
    const quotationType = quotationTypeRaw ? String(quotationTypeRaw) : "";
    if (!quotationType) return null;

    type BookingServiceCategory =
      | "travel"
      | "accommodation"
      | "transport-land"
      | "activity"
      | "transport-maritime"
      | "tickets"
      | "travel insurance"
      | "visas"
      | "others";

    const normalizeCategory = (val: string): BookingServiceCategory => {
      const v = String(val).toLowerCase().trim();
      const map: Record<string, BookingServiceCategory> = {
        flight: "travel",
        flights: "travel",
        travel: "travel",
        hotel: "accommodation",
        hotels: "accommodation",
        accommodation: "accommodation",
        "transport-land": "transport-land",
        "land-transport": "transport-land",
        car: "transport-land",
        land: "transport-land",
        transportation: "transport-land",
        "transport-maritime": "transport-maritime",
        maritime: "transport-maritime",
        tickets: "tickets",
        ticket: "tickets",
        activity: "activity",
        activities: "activity",
        insurance: "travel insurance",
        "travel insurance": "travel insurance",
        visa: "visas",
        visas: "visas",
        others: "others",
        package: "others",
      };
      return map[v] || "others";
    };

    const prettyTitle =
      quotationType.toLowerCase() === "hotel"
        ? "Accommodation"
        : quotationType
            .split("-")
            .join(" ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase());

    return {
      id: quotationType,
      title: prettyTitle,
      image: "",
      category: normalizeCategory(quotationType),
    };
  }, [bookingInitialData]);

  const [isViewPaymentOpen, setIsViewPaymentOpen] = useState(false);
  const [selectedLedgerRow, setSelectedLedgerRow] = useState<LedgerRow | null>(
    null,
  );
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetEntry, setDeleteTargetEntry] = useState<any | null>(null);
  const [paymentDeleteOpen, setPaymentDeleteOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null);
  const [bookingStartDate, setBookingStartDate] = useState<string>("");
  const [bookingEndDate, setBookingEndDate] = useState<string>("");
  const [travelStartDate, setTravelStartDate] = useState<string>("");
  const [travelEndDate, setTravelEndDate] = useState<string>("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [downloadType, setDownloadType] = useState<"pdf" | "excel">("pdf");

  const accountOptions: FilterCardOption[] = useMemo(() => {
    return banks.map((b) => ({
      value: b._id as string,
      label: `${b.name} • ${b.accountType}`,
    }));
  }, [banks]);

  const resolveBankFromEntry = (entry: any) => {
    return (
      entry?.bankId ||
      entry?.bank ||
      entry?.data?.bankId ||
      entry?.data?.payment?.bankId ||
      null
    );
  };

  const resolveQuotationIdFromEntry = useCallback((entry: any): string => {
    try {
      const candidate =
        entry?.referenceId ||
        entry?.data?._id ||
        entry?.data?.id ||
        entry?._id ||
        entry?.id;
      return candidate ? String(candidate) : "";
    } catch {
      return "";
    }
  }, []);

  // Map various quotationType values to the service category used by sidesheet
  const mapQuotationTypeToCategory = (qt?: string) => {
    const v = (qt || "").toLowerCase().trim();
    const map: Record<string, string> = {
      flight: "travel",
      flights: "travel",
      travel: "travel",
      hotel: "accommodation",
      accommodation: "accommodation",
      car: "transport-land",
      "transport-land": "transport-land",
      "land-transport": "transport-land",
      land: "transport-land",
      transportation: "transport-land",
      maritime: "transport-maritime",
      "transport-maritime": "transport-maritime",
      ticket: "tickets",
      tickets: "tickets",
      activity: "activity",
      activities: "activity",
      insurance: "travel insurance",
      "travel insurance": "travel insurance",
      visa: "visas",
      visas: "visas",
      others: "others",
      package: "others",
    };

    return (map[v] as any) || "others";
  };

  const getQuotationDisplayLabel = (rawType?: string) => {
    const cat = mapQuotationTypeToCategory(rawType);
    const labelMap: Record<string, string> = {
      travel: "Flight",
      accommodation: "Accommodation",
      "transport-land": "Land Transport",
      activity: "Activity",
      "transport-maritime": "Maritime",
      tickets: "Tickets",
      "travel insurance": "Travel Insurance",
      visas: "Visas",
      others: "Others",
    };
    return (
      labelMap[cat] ||
      String(rawType || "-").replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  const extractQuotationTypeFromEntry = (entry: any) => {
    return (
      entry?.data?.quotationType ||
      entry?.quotationType ||
      entry?.data?.formFields?.quotationType ||
      entry?.data?.formFields?.serviceType ||
      ""
    );
  };

  const openEditBookingFromLedgerEntry = useCallback(
    async (entry: any) => {
      try {
        const quotationId = resolveQuotationIdFromEntry(entry);
        if (!quotationId) return;

        setBookingCode(entry?.customId || "");
        // Open immediately using entry.data as fallback, then hydrate via API.
        setBookingInitialData(
          await withHydratedPartyObjects(entry?.data ?? null),
        );
        setBookingSidesheetOpen(true);

        const hydrated = await getHydratedQuotationById(quotationId);
        if (hydrated) setBookingInitialData(hydrated);
      } catch (err) {
        console.error("Failed to open booking for edit:", err);
        // Still allow the sidesheet to open with whatever we have
        setBookingSidesheetOpen(true);
      }
    },
    [
      getHydratedQuotationById,
      resolveQuotationIdFromEntry,
      withHydratedPartyObjects,
    ],
  );

  // Normalize an entry into a payment-like object
  // Expect the API to send the payment object with the known shape.
  const normalizeEntryToPayment = useCallback((entry: any) => {
    if (!entry) return null;
    const data = entry.data || {};

    const paymentData =
      data &&
      typeof data === "object" &&
      data.payment &&
      typeof data.payment === "object"
        ? data.payment
        : data;

    const resolvedPartyTypeRaw =
      paymentData.party ||
      data.party ||
      entry.party ||
      entry.data?.payment?.party ||
      "";
    const resolvedPartyType = String(resolvedPartyTypeRaw || "");
    const resolvedPartyTypeLower = resolvedPartyType.toLowerCase();

    // Resolve partyId to prefer nested Mongo _id when available
    const rawPartyId = paymentData.partyId ?? data.partyId ?? entry.partyId;
    const resolvedPartyId =
      rawPartyId && typeof rawPartyId === "object"
        ? rawPartyId._id || rawPartyId.id || rawPartyId
        : rawPartyId;

    const partyObj: any =
      (rawPartyId && typeof rawPartyId === "object" && rawPartyId) || null;

    const resolvedPartyName = (() => {
      const fallback = entry.partyName || "";
      if (!partyObj) return fallback;

      if (resolvedPartyTypeLower === "vendor") {
        return (
          partyObj.companyName ||
          partyObj.name ||
          partyObj.contactPerson ||
          fallback
        );
      }

      return (
        partyObj.name ||
        partyObj.companyName ||
        partyObj.contactPerson ||
        fallback
      );
    })();

    const resolvedCustomId =
      entry.customId || paymentData.customId || data.customId || "";
    const resolvedId =
      paymentData._id || data._id || entry._id || entry.referenceId;
    const resolvedBank =
      paymentData.bankId || data.bankId || entry.bank || entry.bankId || null;
    const resolvedAllocations =
      paymentData.allocations || data.allocations || entry.allocations || [];

    const payment = {
      customId: resolvedCustomId,
      _id: resolvedId,
      amount: Number(paymentData.amount ?? data.amount ?? entry.amount ?? 0),
      entryType: paymentData.entryType || data.entryType || entry.entryType,
      paymentDate:
        paymentData.paymentDate ||
        data.paymentDate ||
        entry.paymentDate ||
        entry.date,
      paymentType:
        paymentData.paymentType || data.paymentType || entry.paymentType,
      bank: resolvedBank,
      account: entry.account,
      documents:
        paymentData.documents || data.documents || entry.documents || [],
      internalNotes:
        paymentData.internalNotes ||
        paymentData.notes ||
        data.internalNotes ||
        data.notes ||
        entry.internalNotes ||
        entry.notes ||
        "",
      allocations: resolvedAllocations,
      outstandingAmount:
        paymentData.unallocatedAmount ||
        data.unallocatedAmount ||
        entry.unallocatedAmount,
      party: resolvedPartyType,
      partyId: resolvedPartyId,
      partyName: resolvedPartyName,
      bankCharges:
        paymentData.bankCharges || data.bankCharges || entry.bankCharges,
      bankChargesNotes:
        paymentData.bankChargesNotes ||
        data.bankChargesNotes ||
        entry.bankChargesNotes,
      cashbackReceived:
        paymentData.cashbackReceived ||
        data.cashbackReceived ||
        entry.cashbackReceived,
      cashbackNotes:
        paymentData.cashbackNotes || data.cashbackNotes || entry.cashbackNotes,
      amountCurrency:
        paymentData.amountCurrency ||
        paymentData.amountCurreny ||
        data.amountCurrency ||
        data.amountCurreny,
      amountRoe: paymentData.amountRoe || data.amountRoe,
      amountInr: paymentData.amountInr || data.amountInr,
      bankChargesCurrency:
        paymentData.bankChargesCurrency || data.bankChargesCurrency,
      bankChargesRoe: paymentData.bankChargesRoe || data.bankChargesRoe,
      bankChargesInr: paymentData.bankChargesInr || data.bankChargesInr,
      cashbackReceivedCurrency:
        paymentData.cashbackReceivedCurrency || data.cashbackReceivedCurrency,
      cashbackReceivedRoe:
        paymentData.cashbackReceivedRoe || data.cashbackReceivedRoe,
      cashbackReceivedInr:
        paymentData.cashbackReceivedInr || data.cashbackReceivedInr,
      data: paymentData,
      _rawData: data,
      // keep original entry for reference
      // _entry: entry,
    } as any;

    return payment;
  }, []);

  const bankNameById = useMemo(() => {
    return new Map(
      (banks || [])
        .filter((b: any) => b && b._id)
        .map((b: any) => [String(b._id), String(b.name || "")]),
    );
  }, [banks]);

  const handleEditPaymentRow = useCallback(
    (entry: any) => {
      const payment = normalizeEntryToPayment(entry);
      if (!payment) return;
      setSelectedLedgerRow(payment);
      setPaymentSidesheetMode("edit");
      const customId = payment.customId || "";
      setPaymentSidesheetTitle(
        customId.startsWith("PI-") ? "Payment In" : "Payment Out",
      );
      setPaymentCustomId(customId || null);
      setPaymentInitial({
        _id: payment._id,
        customId: customId,
        amount: String(payment.amount || ""),
        amountCurrency: payment.amountCurrency,
        amountRoe: payment.amountRoe,
        amountInr: payment.amountInr,
        paymentDate: payment.paymentDate || "",
        bank:
          payment.data?.bankId?._id ||
          payment.bank?._id ||
          (typeof payment.bank === "string" ? payment.bank : "") ||
          "",
        paymentType: payment.paymentType || "",
        internalNotes: payment.internalNotes || "",
        bankCharges: String(payment.bankCharges || ""),
        bankChargesCurrency: payment.bankChargesCurrency,
        bankChargesRoe: payment.bankChargesRoe,
        bankChargesInr: payment.bankChargesInr,
        bankChargesNotes: payment.bankChargesNotes || "",
        cashbackReceived: String(payment.cashbackReceived || ""),
        cashbackReceivedCurrency: payment.cashbackReceivedCurrency,
        cashbackReceivedRoe: payment.cashbackReceivedRoe,
        cashbackReceivedInr: payment.cashbackReceivedInr,
        cashbackNotes: payment.cashbackNotes || "",
      });
      setPaymentSidesheetOpen(true);
    },
    [normalizeEntryToPayment],
  );

  const handleDeletePaymentRow = useCallback((entry: any) => {
    setPaymentToDelete(entry);
    setPaymentDeleteOpen(true);
  }, []);

  const handleEditQuotationRow = useCallback(
    (entry: any) => {
      openEditBookingFromLedgerEntry(entry);
    },
    [openEditBookingFromLedgerEntry],
  );

  const handleDeleteQuotationRow = useCallback((entry: any) => {
    setDeleteTargetEntry(entry);
    setConfirmDeleteOpen(true);
  }, []);

  const statusOptions: FilterCardOption[] = useMemo(
    () =>
      ["Paid", "Pending", "Partially Paid"].map((v) => ({
        value: v,
        label: v,
      })),
    [],
  );

  const columnIconMap: Record<string, React.ReactNode | null> = useMemo(() => {
    return {
      Service: (
        <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      "Booking / Payment Date": (
        <HiArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      "Status / Mode": (
        <FilterTrigger
          ariaLabel="Filter Status"
          options={statusOptions}
          onApply={(sel) => console.log("Status filter applied:", sel)}
        >
          <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
        </FilterTrigger>
      ),
      Account: (
        <FilterTrigger
          ariaLabel="Filter Account"
          options={accountOptions}
          onApply={(sel) => {
            setSelectedBankIds(Array.isArray(sel) ? sel : []);
          }}
        >
          <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
        </FilterTrigger>
      ),
      Amount: (
        <HiArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      "Closing Balance": (
        <HiArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
    };
  }, [accountOptions, statusOptions]);

  const columns = [
    "ID",
    "Service",
    "Booking / Payment Date",
    "Status / Mode",
    "Account",
    "Amount",
    "Closing Balance",
    "Actions",
  ];

  const expandedLedgerEntries = useMemo(() => {
    const entries = ledgerData?.entries;
    if (!Array.isArray(entries)) return [];
    if (!isVendorLedger) return entries;

    const resolveCostPriceRaw = (entry: any) =>
      entry?.data?.formFields?.costprice ??
      entry?.data?.formFields?.costPrice ??
      entry?.data?.costprice ??
      entry?.data?.costPrice ??
      "";

    const resolveVendorBasePriceRaw = (entry: any) =>
      entry?.data?.formFields?.vendorBasePrice ?? entry?.data?.vendorBasePrice;

    const resolveVendorIncentiveRaw = (entry: any) =>
      entry?.data?.formFields?.vendorIncentiveReceived ??
      entry?.data?.vendorIncentiveReceived ??
      entry?.data?.formFields?.commissionPaid ??
      entry?.data?.commissionPaid;

    return entries.flatMap((entry: any) => {
      if (!entry || entry.type !== "quotation") return [entry];

      const costPriceRaw = resolveCostPriceRaw(entry);
      if (!isEmptyScalar(costPriceRaw)) {
        return [{ ...entry, _displayAmount: toNumberOrZero(costPriceRaw) }];
      }

      const basePriceRaw = resolveVendorBasePriceRaw(entry);
      const incentiveRaw = resolveVendorIncentiveRaw(entry);

      const hasAnyVendorAmounts =
        !isEmptyScalar(basePriceRaw) || !isEmptyScalar(incentiveRaw);
      if (!hasAnyVendorAmounts) return [entry];

      const baseRow = {
        ...entry,
        _vendorSplit: "base",
        _displayAmount: toNumberOrZero(basePriceRaw),
      };
      const incentiveRow = {
        ...entry,
        _vendorSplit: "incentive",
        _displayIdSubLabel: "Supplier Incentive",
        _displayAmount: toNumberOrZero(incentiveRaw),
      };

      return [baseRow, incentiveRow];
    });
  }, [ledgerData, isVendorLedger]);

  const formatLedgerDataForExport = () => {
    if (!expandedLedgerEntries?.length) return [];

    return expandedLedgerEntries.map((entry: any) => {
      const displayAmount =
        typeof entry?._displayAmount === "number"
          ? entry._displayAmount
          : entry.amount;

      const idLabel =
        entry.type === "opening"
          ? "Opening Balance"
          : entry._displayIdSubLabel
            ? `${entry.customId || "NA"} - ${entry._displayIdSubLabel}`
            : entry.customId || "NA";

      const typeLabel =
        entry.type === "payment"
          ? "Payment"
          : entry.type === "opening"
            ? "Opening"
            : entry._vendorSplit === "incentive"
              ? "Supplier Incentive"
              : "Booking";

      return {
        ID: idLabel,
        Date: formatDate(entry?.data?.formFields?.bookingdate || entry.date),
        Type: typeLabel,
        Status:
          entry.type === "opening" || entry.type === "payment"
            ? "-"
            : entry.paymentStatus === "none"
              ? "Pending"
              : entry.paymentStatus === "partial"
                ? "Partially Paid"
                : "Paid",
        Account: entry.account || "-",
        Amount: `${getStoredCurrencySymbol()} ${formatMoney(displayAmount)}`,
        "Closing Balance": `${getStoredCurrencySymbol()} ${formatMoney(entry.closingBalance.amount)}`,
      };
    });
  };

  const handleDownload = () => {
    const formattedData = formatLedgerDataForExport();
    const fileName = `${customerName || "Ledger"}_${customerId || ""}_${
      new Date().toISOString().split("T")[0]
    }`;

    if (downloadType === "pdf") {
      exportPDF(formattedData, fileName);
    } else if (downloadType === "excel") {
      exportXLSX(formattedData, fileName);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!expandedLedgerEntries?.length) return [];

    return expandedLedgerEntries.filter((entry: any) => {
      if (pendingOnly && entry.paymentStatus !== "none") return false;

      if (selectedBankIds.length > 0) {
        const bank = resolveBankFromEntry(entry);
        const bankId =
          bank && typeof bank === "object"
            ? (bank._id ?? "")
            : String(bank || "");

        if (!bankId || !selectedBankIds.includes(bankId)) {
          return false;
        }
      }

      const bookingDate =
        entry.type === "payment"
          ? entry.paymentDate ||
            entry.date ||
            entry.data?.paymentDate ||
            entry.data?.formFields?.paymentDate ||
            ""
          : entry.data?.formFields?.bookingdate || entry.date || "";

      const travelDate =
        entry.travelDate ||
        entry.data?.travelDate ||
        entry.data?.formFields?.traveldate ||
        "";

      if (
        bookingStartDate &&
        bookingEndDate &&
        !isWithinDateRange(bookingDate, bookingStartDate, bookingEndDate)
      ) {
        return false;
      }

      if (
        travelStartDate &&
        travelEndDate &&
        entry.type !== "payment" &&
        !isWithinDateRange(travelDate, travelStartDate, travelEndDate)
      ) {
        return false;
      }

      return true;
    });
  }, [
    expandedLedgerEntries,
    pendingOnly,
    bookingStartDate,
    bookingEndDate,
    travelStartDate,
    travelEndDate,
    selectedBankIds,
  ]);

  const handleViewEntry = useCallback(
    (entry: any) => {
      if (entry?.type === "payment") {
        setSelectedLedgerRow(normalizeEntryToPayment(entry));
        setIsViewPaymentOpen(true);
        return;
      }
      if (entry?.type === "quotation") {
        void openEditBookingFromLedgerEntry(entry);
      }
    },
    [normalizeEntryToPayment, openEditBookingFromLedgerEntry],
  );

  const tableData = useMemo<React.ReactNode[][]>(() => {
    return filteredEntries.map((entry: any, idx: number) => {
      const stableKey =
        `${entry?.type || "row"}-` +
        `${entry?._id || entry?.referenceId || entry?.customId || idx}-` +
        `${entry?._vendorSplit || ""}`;

      return [
        <LedgerRow
          key={stableKey}
          entry={entry}
          isVendorLedger={isVendorLedger}
          bankNameById={bankNameById}
          onViewEntry={handleViewEntry}
          onEditPayment={handleEditPaymentRow}
          onDeletePayment={handleDeletePaymentRow}
          onEditQuotation={handleEditQuotationRow}
          onDeleteQuotation={handleDeleteQuotationRow}
        />,
      ];
    });
  }, [
    filteredEntries,
    isVendorLedger,
    bankNameById,
    handleViewEntry,
    handleEditPaymentRow,
    handleDeletePaymentRow,
    handleEditQuotationRow,
    handleDeleteQuotationRow,
  ]);

  const handleEditFromViewPayment = (paymentData: any) => {
    if (!paymentData) return;

    // Accept either a raw entry or a normalized payment object
    const payment =
      paymentData && paymentData._entry
        ? paymentData
        : normalizeEntryToPayment(paymentData);

    setSelectedLedgerRow(payment);
    setPaymentSidesheetMode("edit");
    // Title based on customId prefix: PI- = Payment In, PO- = Payment Out
    const customId = payment.customId || "";
    setPaymentSidesheetTitle(
      customId.startsWith("PI-") ? "Payment In" : "Payment Out",
    );
    setPaymentCustomId(customId || null);
    setPaymentInitial({
      _id: payment._id,
      customId: customId,
      amount: String(payment.amount || ""),
      amountCurrency: payment.amountCurrency,
      amountRoe: payment.amountRoe,
      amountInr: payment.amountInr,
      paymentDate: payment.paymentDate || "",
      bank:
        payment.data?.bankId?._id ||
        payment.bank?._id ||
        (typeof payment.bank === "string" ? payment.bank : "") ||
        "",
      paymentType: payment.paymentType || "",
      internalNotes: payment.internalNotes || "",
      bankCharges: String(payment.bankCharges || ""),
      bankChargesCurrency: payment.bankChargesCurrency,
      bankChargesRoe: payment.bankChargesRoe,
      bankChargesInr: payment.bankChargesInr,
      bankChargesNotes: payment.bankChargesNotes || "",
      cashbackReceived: String(payment.cashbackReceived || ""),
      cashbackReceivedCurrency: payment.cashbackReceivedCurrency,
      cashbackReceivedRoe: payment.cashbackReceivedRoe,
      cashbackReceivedInr: payment.cashbackReceivedInr,
      cashbackNotes: payment.cashbackNotes || "",
    });
    setIsViewPaymentOpen(false);
    setPaymentSidesheetOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!deleteTargetEntry) return;
      // Confirmation modal used for deleting quotations only
      const quotationId = resolveQuotationIdFromEntry(deleteTargetEntry);
      if (!quotationId) {
        console.error("No quotation id found for deletion");
        setConfirmDeleteOpen(false);
        setDeleteTargetEntry(null);
        return;
      }

      const resp = await deleteQuotation(quotationId);
      if (resp?.success) {
        setConfirmDeleteOpen(false);
        setDeleteTargetEntry(null);
        await fetchLedger();
        onRefresh?.();
      } else {
        console.error("Failed to delete quotation:", resp?.message || resp);
        setConfirmDeleteOpen(false);
        setDeleteTargetEntry(null);
      }
    } catch (err) {
      console.error("Error deleting quotation:", err);
      setConfirmDeleteOpen(false);
      setDeleteTargetEntry(null);
    }
  };

  const { computedInitialCustomer, computedInitialVendor } = React.useMemo(() => {
    try {
      let initialCustomer: any = null;
      let initialVendor: any = null;

      if (paymentSidesheetMode === "edit" && selectedLedgerRow) {
        if (selectedLedgerRow.party === "Customer") {
          initialCustomer = {
            _id: selectedLedgerRow.partyId || "",
            name: selectedLedgerRow.partyName || "",
          };
        } else if (selectedLedgerRow.party === "Vendor") {
          initialVendor = {
            _id: selectedLedgerRow.partyId || "",
            name: selectedLedgerRow.partyName || "",
          };
        }
      } else if (isVendorLedger) {
        if (rawId || customerName) {
          initialVendor = {
            _id: rawId ?? "",
            name: customerName ?? "",
            ...(customerId ? { customId: customerId } : {}),
          };
        }
      } else if (rawId || customerName) {
        initialCustomer = {
          _id: rawId ?? "",
          name: customerName ?? "",
          ...(customerId ? { customId: customerId } : {}),
        };
      }

      return {
        computedInitialCustomer: initialCustomer,
        computedInitialVendor: initialVendor,
      };
    } catch (err) {
      console.error("Failed to compute initial party:", err);
      return { computedInitialCustomer: null, computedInitialVendor: null };
    }
  }, [
    paymentSidesheetMode,
    selectedLedgerRow,
    rawId,
    customerName,
    customerId,
    isVendorLedger,
  ]);

  const collectLabel =
    ledgerData?.closingBalance?.balanceType === "credit"
      ? "You Collect"
      : "You Pay";
  const collectAmount = Math.abs(ledgerData?.closingBalance?.amount ?? 0);
  const isCollectCredit = ledgerData?.closingBalance?.balanceType === "credit";

  const handleShare = async () => {
    const shareText = `${collectLabel}: ${getStoredCurrencySymbol()} ${formatMoney(collectAmount)} for ${customerName ?? "customer"}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Ledger ${customerName ?? ""}`,
          text: shareText,
        });
        return;
      }
      await navigator.clipboard.writeText(shareText);
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <>
      <Modal
        title=""
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        customWidth="w-[min(1600px,calc(100vw-2rem))]"
        customeHeight="h-[94dvh]"
        className="!max-h-[94dvh]"
        bodyClassName="flex h-full min-h-0 flex-col overflow-hidden pt-6 pr-7 pb-6 pl-6"
        scrollableBody={false}
        closeOnOverlayClick={true}
        closeOnEscape={true}
        zIndexClass="z-[9999]"
        disableOverlayClick={false}
        showCloseButton={true}
      >
        <div
          className="relative flex h-full min-h-0 w-full flex-col items-start overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-full shrink-0 items-center justify-between border-b border-[#ECECEC] pb-4">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h2 className="font-[Poppins,sans-serif] text-[18px] font-[600] text-[#020202]">
                Ledger
              </h2>
              <span className="text-[#D1D5DB]">|</span>
              <span className="font-[Poppins,sans-serif] text-[14px] font-[500] text-[#020202]">
                {customerName ?? "—"}
              </span>
              <span className="text-[#D1D5DB]">|</span>
              <span className="font-[Poppins,sans-serif] text-[14px] text-[#818181]">
                {customerId ?? "—"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onViewCustomer}
                  className="rounded-[8px] bg-[#FFF1C2] p-2 transition-colors hover:bg-[#FFE9A8]"
                  aria-label="View customer"
                >
                  <FiEye className="text-[#414141]" size={14} />
                </button>
                <button
                  type="button"
                  onClick={onEditCustomer}
                  className="rounded-[8px] bg-[#E8F2FF] p-2 transition-colors hover:bg-[#D6E8FF]"
                  aria-label="Edit customer"
                >
                  <FiEdit className="text-[#126ACB]" size={14} />
                </button>
              </div>
            </div>
          </div>

          {isRefreshing && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="inline-flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3 shadow">
                <svg
                  className="h-6 w-6 animate-spin text-gray-700"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Refreshing ledger...
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 flex min-h-0 w-full flex-1 flex-col items-start overflow-hidden rounded-[16px] border border-[#ECECEC] p-4">
            <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`inline-flex items-center gap-3 rounded-[12px] border px-4 py-2.5 ${
                    isCollectCredit
                      ? "border-[#F5D0CD] bg-[#FFF0EE]"
                      : "border-[#ECECEC] bg-[#F9F9F9]"
                  }`}
                >
                  {isCollectCredit ? (
                    <TbCircleArrowDownLeft className="text-[20px] text-[#C85542]" />
                  ) : (
                    <TbCircleArrowUpRight className="text-[20px] text-[#C85542]" />
                  )}
                  <span className="text-[14px] font-[500] text-[#414141]">
                    {collectLabel}
                  </span>
                  <span className="text-[14px] font-[600] text-[#C85542]">
                    {getStoredCurrencySymbol()} {formatMoney(collectAmount)}
                  </span>
                </div>

                <button
                  type="button"
                  className="rounded-[8px] p-2 text-[#126ACB] transition hover:bg-[#F3F7FF]"
                  aria-label="Refresh"
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      await fetchLedger();
                    } catch (err) {
                      console.error("Failed to refresh ledger:", err);
                    } finally {
                      setIsRefreshing(false);
                    }
                    onRefresh?.();
                  }}
                >
                  <LuRefreshCcw size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-stretch overflow-hidden rounded-[10px] border border-[#D6E8FF] bg-[#F3F8FF]">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-[500] text-[#126ACB] transition hover:bg-[#E8F2FF]"
                  >
                    <MdOutlineFileDownload size={16} />
                    View PDF
                  </button>
                  <div className="border-l border-[#D6E8FF]">
                    <DropDown
                      options={[
                        {
                          value: "pdf",
                          label: (
                            <span className="flex items-center gap-2">
                              <MdOutlineFileDownload size={16} />
                              View PDF
                            </span>
                          ),
                        },
                        {
                          value: "excel",
                          label: (
                            <span className="flex items-center gap-2">
                              <MdOutlineFileDownload size={16} />
                              Download Excel
                            </span>
                          ),
                        },
                      ]}
                      value={downloadType}
                      onChange={(val) => setDownloadType(val as "pdf" | "excel")}
                      iconOnly
                      noBorder
                      noButtonRadius
                      buttonClassName="px-3 py-2 text-[#126ACB] hover:bg-[#E8F2FF]"
                      customWidth="w-auto"
                      customHeight="h-auto"
                      menuWidth="w-[150px]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-[#126ACB] bg-white px-4 py-2 text-[13px] font-[500] text-[#126ACB] transition hover:bg-[#F3F8FF]"
                >
                  <IoShareOutline size={16} />
                  Share
                </button>
              </div>
            </div>

            <div className="mt-4 flex w-full shrink-0 flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <DateRangeInputBeta
                  label="Booking Date"
                  startDate={bookingStartDate}
                  endDate={bookingEndDate}
                  onChange={(s, e) => {
                    setBookingStartDate(s);
                    setBookingEndDate(e);
                  }}
                />
                <DateRangeInputBeta
                  label="Travel Date"
                  startDate={travelStartDate}
                  endDate={travelEndDate}
                  onChange={(s, e) => {
                    setTravelStartDate(s);
                    setTravelEndDate(e);
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPendingOnly((prev) => !prev)}
                  className={`relative inline-flex h-5 w-8 cursor-pointer items-center rounded-full transition-colors ${
                    pendingOnly ? "bg-[#7135AD]" : "bg-[#C9CCCE]"
                  }`}
                  aria-pressed={pendingOnly}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pendingOnly ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-[12px] font-[400] text-[#414141]">
                  Show bookings with pending invoices
                </span>
              </div>
            </div>

            <div className="mt-4 min-h-0 w-full flex-1 overflow-hidden">
              {ledgerData?.entries ? (
                <div className="flex h-full min-h-0 flex-col overflow-hidden">
                  <Table
                  data={tableData}
                  columns={columns}
                  columnIconMap={columnIconMap}
                  initialRowsPerPage={10}
                  hideRowsPerPage={false}
                  categoryName="Entries"
                  hideEntriesText={false}
                  headerClassName="bg-[#F3F3F3]"
                  headerRowTextClassName="text-[#818181]"
                  headerCellTextClassName="text-[#818181]"
                  sortableHeaderHoverClass="bg-[#FAFAFA]"
                  onRowClick={(rowIndex) => handleViewEntry(filteredEntries[rowIndex])}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="w-full shrink-0 border-t border-[#ECECEC] pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  setPaymentSidesheetMode("create");
                  setPaymentInitial(null);
                  setPaymentSidesheetTitle("Payment Out");
                  setPaymentCustomId(await generatePaymentCustomId("paymentOut"));
                  setPaymentSidesheetOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#EB382B] px-4 py-2.5 text-[14px] font-[600] text-white transition hover:bg-[#DC2626]"
              >
                <FiPlus size={16} />
                You Gave
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPaymentSidesheetMode("create");
                  setPaymentInitial(null);
                  setPaymentSidesheetTitle("Payment In");
                  setPaymentCustomId(await generatePaymentCustomId("paymentIn"));
                  setPaymentSidesheetOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#4CA640] px-4 py-2.5 text-[14px] font-[600] text-white transition hover:bg-[#16A34A]"
              >
                <FiPlus size={16} />
                You Got
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ViewPaymentSidesheet
        isOpen={isViewPaymentOpen}
        onClose={() => setIsViewPaymentOpen(false)}
        onEdit={handleEditFromViewPayment}
        onDeleted={async () => {
          setIsViewPaymentOpen(false);
          setSelectedLedgerRow(null);
          await fetchLedger(); // refresh ledger after delete
        }}
        payment={selectedLedgerRow}
      />
      {/* Payment Sidesheet triggered from Ledger actions */}
      <AddPaymentSidesheet
        isOpen={paymentSidesheetOpen}
        onClose={() => {
          setPaymentSidesheetOpen(false);
          setPaymentSidesheetMode("create");
          setPaymentInitial(null);
          setPaymentCustomId(null);
        }}
        title={paymentSidesheetTitle}
        mode={paymentSidesheetMode}
        initialPayment={paymentInitial}
        initialCustomer={computedInitialCustomer}
        initialVendor={computedInitialVendor}
        disablePartyType={true}
        customId={paymentCustomId}
        ledgerClosingBalance={ledgerData?.closingBalance}
        onView={() => {
          setPaymentSidesheetOpen(false);
          // keep selectedLedgerRow so view can reference it if needed
          setIsViewPaymentOpen(true);
        }}
        onDelete={() =>
          console.log("Delete payment from edit header", paymentInitial)
        }
      />

      <ConfirmationModal
        isOpen={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setDeleteTargetEntry(null);
        }}
        title={
          deleteTargetEntry?.customId
            ? `Delete ${deleteTargetEntry.customId}?`
            : "Delete booking?"
        }
        confirmText="Yes, Delete"
        cancelText="No"
        confirmButtonColor="bg-red-600"
        onConfirm={handleConfirmDelete}
      />

      <DeletePaymentModal
        isOpen={paymentDeleteOpen}
        onClose={() => {
          setPaymentDeleteOpen(false);
          setPaymentToDelete(null);
        }}
        payment={normalizeEntryToPayment(paymentToDelete) || paymentToDelete}
        onDeleted={async () => {
          setPaymentDeleteOpen(false);
          setPaymentToDelete(null);
          await fetchLedger();
          onRefresh?.();
        }}
      />

      <BookingFormSidesheet
        isOpen={bookingSidesheetOpen}
        onClose={async () => {
          setBookingSidesheetOpen(false);
          setBookingInitialData(null);
          setBookingCode("");
          await fetchLedger();
        }}
        selectedService={derivedBookingService}
        initialData={bookingInitialData}
        mode="edit"
        bookingCode={bookingCode}
      />
    </>
  );
};

export default LedgerModal;
