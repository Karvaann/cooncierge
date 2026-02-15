"use client";

import React, { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CiFilter } from "react-icons/ci";
import { HiArrowsUpDown } from "react-icons/hi2";
import { IoChevronDownOutline } from "react-icons/io5";
import { LuRefreshCcw } from "react-icons/lu";
import Modal from "../../Modal";
import DateRangeInput from "../../DateRangeInput";
import Table from "../../Table";
import FilterTrigger from "../../FilterTrigger";
import type { FilterCardOption } from "../../FilterCard";
import ConfirmationModal from "../../popups/ConfirmationModal";
import DeletePaymentModal from "../DeletePaymentModal";
import { PiArrowCircleUpRight } from "react-icons/pi";
import { PiArrowCircleDownLeft } from "react-icons/pi";
import { MdOutlineFileDownload } from "react-icons/md";
import DropDown from "../../DropDown";
import { exportPDF, exportXLSX } from "@/utils/exportUtils";
import {
  isWithinDateRange,
  formatDate,
  formatMoney,
  toNumberOrZero,
} from "@/utils/helper";
import {
  useLedgerBanks,
  useLedgerData,
  useLedgerQuotationApi,
  usePaymentCustomId,
} from "./components/LedgerModalApiHooks";
import LedgerRow from "./components/LedgerRow";

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
  isVendorLedger?: boolean; // If true, inverts the color scheme
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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
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

  // Date column label and filter options (Booking Date <-> Travel Date)
  const [dateColumnLabel, setDateColumnLabel] =
    useState<string>("Booking Date");
  const dateFilterOptions: FilterCardOption[] = useMemo(
    () => [
      { value: "travel", label: "Travel Date" },
      { value: "booking", label: "Booking Date" },
    ],
    [],
  );

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

  // Map column names to header icons/components
  const columnIconMap: Record<string, React.ReactNode | null> = useMemo(() => {
    return {
      [dateColumnLabel]: (
        <>
          <HiArrowsUpDown className="inline w-3 h-3 text-gray-600 font-semibold stroke-[2]" />
          <FilterTrigger
            ariaLabel="Filter Date Type"
            options={dateFilterOptions}
            onApply={(sel) => {
              const val =
                Array.isArray(sel) && sel.length > 0 ? sel[0] : "booking";
              setDateColumnLabel(
                val === "travel" ? "Travel Date" : "Booking Date",
              );
            }}
          >
            <CiFilter className="inline w-3 h-3 text-gray-600 stroke-[1.5] ml-2" />
          </FilterTrigger>
        </>
      ),
      Account: (
        <FilterTrigger
          ariaLabel="Filter Account"
          options={accountOptions}
          onApply={(sel) => {
            setSelectedBankIds(Array.isArray(sel) ? sel : []);
          }}
        >
          <CiFilter className="inline w-3 h-3 text-gray-600 stroke-[1.5]" />
        </FilterTrigger>
      ),
      Status: (
        <FilterTrigger
          ariaLabel="Filter Status"
          options={statusOptions}
          onApply={(sel) => console.log("Status filter applied:", sel)}
        >
          <CiFilter className="inline w-3 h-3 text-gray-600 stroke-[1.5]" />
        </FilterTrigger>
      ),
    };
  }, [accountOptions, statusOptions, dateColumnLabel, dateFilterOptions]);

  const columns = useMemo(() => {
    return [
      "ID",
      dateColumnLabel,
      "Status",
      "Account",
      "Amount",
      "Closing Balance",
      "Actions",
    ];
  }, [dateColumnLabel]);

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
        Amount: `₹ ${formatMoney(displayAmount)}`,
        "Closing Balance": `₹ ${formatMoney(entry.closingBalance.amount)}`,
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

      let entryDate: string = "";
      if (entry.type === "payment") {
        entryDate =
          entry.paymentDate ||
          entry.date ||
          entry.data?.paymentDate ||
          entry.data?.formFields?.paymentDate ||
          "";
      } else if (dateColumnLabel === "Travel Date") {
        entryDate =
          entry.travelDate ||
          entry.data?.travelDate ||
          entry.data?.formFields?.traveldate ||
          entry.date ||
          "";
      } else {
        entryDate = entry.data?.formFields?.bookingdate || entry.date || "";
      }

      if (!isWithinDateRange(entryDate, startDate, endDate)) return false;

      return true;
    });
  }, [
    expandedLedgerEntries,
    pendingOnly,
    startDate,
    endDate,
    dateColumnLabel,
    selectedBankIds,
    resolveBankFromEntry,
  ]);

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
          dateColumnLabel={dateColumnLabel}
          isVendorLedger={isVendorLedger}
          bankNameById={bankNameById}
          onEditPayment={handleEditPaymentRow}
          onDeletePayment={handleDeletePaymentRow}
          onEditQuotation={handleEditQuotationRow}
          onDeleteQuotation={handleDeleteQuotationRow}
        />,
      ];
    });
  }, [
    filteredEntries,
    dateColumnLabel,
    isVendorLedger,
    bankNameById,
    handleEditPaymentRow,
    handleDeletePaymentRow,
    handleEditQuotationRow,
    handleDeleteQuotationRow,
  ]);

  const handleOpenViewPaymentByRowIndex = (rowIndex: number) => {
    const row = filteredEntries?.[rowIndex];
    if (!row) return;
    // Only open view payment sidesheet for payment records
    if (row.type === "payment") {
      const payment = normalizeEntryToPayment(row);
      setSelectedLedgerRow(payment);
      setIsViewPaymentOpen(true);
    }
  };

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

  const headerLeft = (
    <div className="flex items-center gap-3">
      <h2 className="text-[1rem] md:text-[1.15rem] font-semibold text-black">
        Ledger
      </h2>
      <div className="w-px h-6 bg-gray-300" />
      <span className="text-[0.95rem] font-semibold text-gray-900">
        {customerName ?? "—"}
      </span>
      <div className="w-px h-6 bg-gray-300" />
      <span className="text-[0.95rem] font-semibold text-gray-900">
        {customerId ?? "—"}
      </span>
    </div>
  );

  // Compute initial customer/vendor safely for create/edit flows
  const { computedInitialCustomer, computedInitialVendor } =
    React.useMemo(() => {
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
        } else {
          // create mode: prefer ledger owner; if ledger is vendor type, pass vendor
          if (isVendorLedger) {
            if (rawId || customerName) {
              initialVendor = {
                _id: rawId ?? "",
                name: customerName ?? "",
                ...(customerId ? { customId: customerId } : {}),
              };
            }
          } else {
            if (rawId || customerName) {
              initialCustomer = {
                _id: rawId ?? "",
                name: customerName ?? "",
                ...(customerId ? { customId: customerId } : {}),
              };
            }
          }
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

  return (
    <>
      <Modal
        title=""
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        customWidth="w-[1100px]"
        customeHeight="h-fit"
        className="pb-2"
        closeOnOverlayClick={true}
        closeOnEscape={true}
        zIndexClass="z-[200]"
        disableOverlayClick={false}
        headerLeft={headerLeft}
      >
        <div
          className="p-2 -mt-4 relative flex flex-col max-h-[75vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {isRefreshing && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="inline-flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md shadow">
                <svg
                  className="animate-spin h-6 w-6 text-gray-700"
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
                <span className="text-sm text-gray-700 font-medium">
                  Refreshing ledger...
                </span>
              </div>
            </div>
          )}
          <div className="border border-gray-200 rounded-xl p-3 flex flex-col flex-1 min-h-0">
            {/* Top actions row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="rounded-lg px-4 py-3 bg-[#F9F9F9]">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-[14px] font-medium">
                      {ledgerData?.closingBalance?.balanceType === "credit"
                        ? "You Collect"
                        : "You Pay"}
                    </span>
                    <span
                      className={`text-[14px] font-semibold ${
                        ledgerData?.closingBalance?.balanceType === "credit"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      ₹{" "}
                      {formatMoney(
                        Math.abs(ledgerData?.closingBalance?.amount),
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-50 transition"
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

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 border border-gray-200 rounded-l-md px-4 py-2 bg-[#F8FAFC] hover:bg-gray-50 text-gray-700 text-[13px] font-medium"
                >
                  <MdOutlineFileDownload size={16} />
                  {downloadType === "pdf" ? "View PDF" : "Download Excel"}
                </button>
                <div className="border border-l-0 border-gray-200 rounded-r-md bg-[#F8FAFC] hover:bg-gray-50">
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
                    buttonClassName="px-3 py-2.5 bg-[#F8FAFC] hover:bg-gray-50 text-gray-700"
                    customWidth="w-auto"
                    customHeight="h-auto"
                    menuWidth="w-[150px]"
                  />
                </div>
              </div>
            </div>

            {/* Filters row */}
            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <DateRangeInput
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />

              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setPendingOnly((prev) => !prev)}
              >
                <div className="mt-0.5 w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center bg-white">
                  {pendingOnly && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="11"
                      viewBox="0 0 12 11"
                      fill="none"
                    >
                      <path
                        d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                        stroke="#0D4B37"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-gray-700 mt-1">
                  Show bookings with amount pending
                </span>
              </label>
            </div>

            {/* Table (scrolls inside modal) */}
            <div className="mt-4 flex-1 overflow-auto min-h-0">
              {ledgerData?.entries && (
                <Table
                  data={tableData}
                  columns={columns}
                  columnIconMap={columnIconMap}
                  initialRowsPerPage={2}
                  hideRowsPerPage={false}
                  categoryName="entries"
                  hideEntriesText={false}
                  headerClassName="bg-gray-100"
                  headerRowTextClassName="text-[#414141]"
                  headerCellTextClassName="text-[#414141]"
                  sortableHeaderHoverClass="bg-gray-50"
                  onRowClick={(rowIndex) => {
                    const row = filteredEntries[rowIndex];
                    if (row?.type === "payment") {
                      setSelectedLedgerRow(normalizeEntryToPayment(row));
                      setIsViewPaymentOpen(true);
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Bottom summary buttons */}
          <div className="flex-none -mx-4 px-4 pt-4 pb-2 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  setPaymentSidesheetMode("create");
                  setPaymentInitial(null);
                  setPaymentSidesheetTitle("Payment Out");
                  setPaymentCustomId(
                    await generatePaymentCustomId("paymentOut"),
                  );
                  setPaymentSidesheetOpen(true);
                }}
                className="bg-[#EB382B] hover:bg-[#DC2626] text-white px-4 py-2.5 rounded-md text-[14px] font-semibold"
              >
                <span className="flex items-center gap-2">
                  <PiArrowCircleUpRight
                    size={18}
                    height="bold"
                    strokeWidth={4}
                  />
                  You Gave
                </span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPaymentSidesheetMode("create");
                  setPaymentInitial(null);
                  setPaymentSidesheetTitle("Payment In");
                  setPaymentCustomId(
                    await generatePaymentCustomId("paymentIn"),
                  );
                  setPaymentSidesheetOpen(true);
                }}
                className="bg-[#4CA640] hover:bg-[#16A34A] text-white px-4 py-2.5 rounded-md text-[14px] font-semibold"
              >
                <span className="text-sm flex items-center gap-1">
                  {" "}
                  <PiArrowCircleDownLeft
                    size={18}
                    height="bold"
                    strokeWidth={4}
                  />
                  You Got
                </span>
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
