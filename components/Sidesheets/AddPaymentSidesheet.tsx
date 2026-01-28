"use client";
import ConfirmationModal from "../popups/ConfirmationModal";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import ErrorToast from "@/components/ErrorToast";
import BankApi from "@/services/bankApi";
import { FiEye, FiTrash2 } from "react-icons/fi";
import { TbNotes } from "react-icons/tb";
import SideSheet from "@/components/SideSheet";
import SingleCalendar from "@/components/SingleCalendar";
import Button from "@/components/Button";
import { FaRegFolder } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import Table from "@/components/Table";
import DropDown from "@/components/DropDown";
import CustomerDropDown, {
  type CustomerDataType,
} from "@/components/dropdowns/CustomerDropDown";
import VendorDropDown, {
  type VendorDataType,
} from "@/components/dropdowns/VendorDropDown";
import AddBankSidesheet, {
  type BankPayload,
} from "@/components/Sidesheets/AddBankSidesheet";
import PaymentsApi from "@/services/paymentsApi";
import { FiPlusCircle } from "react-icons/fi";
import DeletePaymentModal from "@/components/Modals/DeletePaymentModal";

type PendingDocRow = {
  bookingId: string;
  bookingDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  amountPaying: string;
  quotationId?: string;
};

interface AddPaymentSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  /** optional error callback to display messages in parent */
  onError?: (message: string) => void;
  title?: string;
  mode?: "create" | "edit";
  /** Optional initial values (useful for edit mode) */
  initialPayment?: {
    _id?: string;
    customId?: string;
    party?: "Customer" | "Vendor" | string;
    partyId?: { _id?: string; name?: string; companyName?: string } | string;

    amount?: string | number;
    /** Backend sometimes returns `amountCurreny` (typo) */
    amountCurrency?: "INR" | "USD" | string;
    amountCurreny?: "INR" | "USD" | string;
    amountRoe?: string | number;
    amountInr?: string | number;

    bankCharges?: string | number;
    bankChargesCurrency?: "INR" | "USD" | string;
    bankChargesRoe?: string | number;
    bankChargesInr?: string | number;
    bankChargesNotes?: string;

    cashbackReceived?: string | number;
    cashbackReceivedCurrency?: "INR" | "USD" | string;
    cashbackReceivedRoe?: string | number;
    cashbackReceivedInr?: string | number;
    cashbackNotes?: string;

    paymentDate?: string;
    /** Bank can be an id string, or populated object from backend */
    bank?: string;
    bankId?: { _id?: string; name?: string } | string;
    paymentType?: string;
    internalNotes?: string;
    paymentBreakdown?: boolean;
    allocations?: Array<{ quotationId?: string; amount?: number }>;
  } | null;
  /** When in edit mode, optionally open the view sidesheet */
  onView?: () => void;
  /** Optional delete handler shown in header when in edit mode */
  onDelete?: () => void;
  /** this will pre-select the customer and hide party type selection */
  initialCustomer?: { _id: string; name: string; customId?: string } | null;
  /** this will pre-select the vendor when provided  */
  initialVendor?: { _id: string; name: string; customId?: string } | null;
  /** If true, party type radios are hidden and customer is fixed to `initialCustomer` */
  disablePartyType?: boolean;
  /** Default entry type sent to backend when creating payment ('credit'|'debit') */
  entryTypeDefault?: "credit" | "debit";
  /** Optional generated custom id to show in the header */
  customId?: string | null;
  /** When provided, hide the view button in header */
  showViewButton?: boolean;
  /** Prefill the party name (customer/vendor) when initial customer/vendor object isn't available */
  prefillPartyName?: string | null;
  /** Prefill party type when full customer/vendor object isn't available */
  prefillPartyType?: "Customer" | "Vendor" | null | undefined;
}

interface DocumentPreview {
  file: File;
  name: string;
  size: number;
  preview?: string;
}

const AddPaymentSidesheet: React.FC<AddPaymentSidesheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onError,
  title = "Payment Out",
  mode = "create",
  initialPayment = null,
  onView,
  onDelete,
  initialCustomer = null,
  disablePartyType = false,
  entryTypeDefault = "debit",
  customId = null,
  showViewButton = true,
  prefillPartyName = null,
  prefillPartyType = null,
  initialVendor = null,
}) => {
  const prefillKeyRef = React.useRef<string | null>(null);

  // Party Type State
  const [partyType, setPartyType] = useState<"Customer" | "Vendor">("Customer");
  // Payment Type State
  type PaymentType = "CARD" | "UPI" | "IMPS" | "NEFT" | "RTGS" | "CHEQUE";

  const [paymentType, setPaymentType] = useState<PaymentType | "">("");

  // Customer/Vendor Selection State
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDataType | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorDataType | null>(
    null,
  );

  // Form State
  const [amount, setAmount] = useState<string>("");
  const [amountNotes, setAmountNotes] = useState<string>("");
  const [bankCharges, setBankCharges] = useState<string>("");
  const [bankChargesNotes, setBankChargesNotes] = useState<string>("");
  const [cashbackReceived, setCashbackReceived] = useState<string>("");
  const [cashbackNotes, setCashbackNotes] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [showPaymentBreakdown, setShowPaymentBreakdown] =
    useState<boolean>(false);

  const [isAddBankOpen, setIsAddBankOpen] = useState<boolean>(false);

  // Notes visibility toggles
  const [showAmountNotes, setShowAmountNotes] = useState<boolean>(false);
  const [showBankChargesNotes, setShowBankChargesNotes] =
    useState<boolean>(false);
  const [showCashbackNotes, setShowCashbackNotes] = useState<boolean>(false);

  const { user } = useAuth();
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const [errorToastMessage, setErrorToastMessage] = useState("");
  const showErrorToast = (msg: string) => {
    setErrorToastMessage(msg);
    setErrorToastVisible(true);
  };

  // business currency (shared util)
  const businessCurrency = getBusinessCurrency(user as any);

  // Settle Pending Docs (Auto UI)
  const [settlePendingDocsEnabled, setSettlePendingDocsEnabled] =
    useState<boolean>(false);
  const [settlePendingMode, setSettlePendingMode] = useState<"auto" | "manual">(
    "auto",
  );
  const [pendingDocRows, setPendingDocRows] = useState<PendingDocRow[]>([]);
  const [selectedManualRows, setSelectedManualRows] = useState<Set<string>>(
    new Set(),
  );

  // Document State
  const [documents, setDocuments] = useState<DocumentPreview[]>([]);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Confirm-close modal state (shown when attempting to close in edit mode)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  // Currency and ROE State
  const [amountCurrency, setAmountCurrency] = useState<Currency>("INR");
  const [amountRoe, setAmountRoe] = useState<string>("");
  const [amountInr, setAmountInr] = useState<string>("");

  const [bankChargesCurrency, setBankChargesCurrency] =
    useState<Currency>("INR");
  const [bankChargesRoe, setBankChargesRoe] = useState<string>("");
  const [bankChargesInr, setBankChargesInr] = useState<string>("");

  const [cashbackReceivedCurrency, setCashbackReceivedCurrency] =
    useState<Currency>("INR");
  const [cashbackReceivedRoe, setCashbackReceivedRoe] = useState<string>("");
  const [cashbackReceivedInr, setCashbackReceivedInr] = useState<string>("");

  type Currency = "INR" | "USD";

  // Determine effective entry type: Payment In => credit, Payment Out => debit
  const effectiveEntryType: "credit" | "debit" = (() => {
    try {
      if (typeof title === "string" && title.toLowerCase().includes("in"))
        return "credit";
    } catch {
      /* ignore */
    }
    return "debit";
  })();

  const groupBase =
    "flex items-center border border-gray-200 rounded-md overflow-hidden bg-white";

  const groupSelect =
    "h-[34px] px-2 text-[0.78rem] bg-gray-50 text-gray-700 border-r border-gray-200 flex items-center justify-center";

  const groupSelectWhite =
    "h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center";

  const groupInput =
    "h-[34px] px-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 outline-none flex-1";

  const addonLabel =
    "h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center";

  const noteBtn =
    "w-9 h-9 rounded-md bg-[#FFF2D6] hover:bg-[#FFE8B7] transition flex items-center justify-center";

  const inputBase =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600";

  const computeInr = (amount: string, roe: string) => {
    const a = Number(String(amount).replace(/,/g, ""));
    const r = Number(String(roe).replace(/,/g, ""));
    if (!isFinite(a) || !isFinite(r) || a === 0 || r === 0) return "";
    const product = a * r;
    const hasFraction = Math.abs(product - Math.round(product)) > 1e-9;
    return product.toLocaleString("en-US", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  // When opened from ledger (initialCustomer/initialVendor) or when parent requests,
  // lock the party selection UI so user cannot change the party.
  const lockedToParty = Boolean(
    initialCustomer || initialVendor || disablePartyType || mode === "edit",
  );

  // Bank options (you can customize this list)
  const bankOptions = [
    "Bank 1",
    "Bank 2",
    "HDFC Bank",
    "ICICI Bank",
    "State Bank of India",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "Other",
  ];

  const [banks, setBanks] = useState<
    Array<{ _id?: string; name: string; alias?: string }>
  >(bankOptions.map((b) => ({ name: b })));

  const bankDropdownOptions = useMemo(
    () => [
      ...banks.map((b) => ({ value: b._id || b.name, label: b.name })),
      { value: "cash", label: "Cash" },
    ],
    [banks],
  );

  // Fetch banks from API when sidesheet opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const resp: any = await BankApi.getBanks({ isDeleted: false });
        if (cancelled) return;
        const list = Array.isArray(resp?.banks)
          ? resp.banks
          : resp?.banks || resp || [];

        if (list.length > 0) setBanks(list);
      } catch (err) {
        console.error("Failed to load banks", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // revoke object URLs on unmount
  useEffect(() => {
    return () => {
      documents.forEach((d) => d.preview && URL.revokeObjectURL(d.preview));
    };
  }, []);

  const handleAddBank = (bank: any) => {
    // bank is expected to be the created bank object from the API
    const name = String(bank?.name || "").trim();
    const id = bank?._id ? String(bank._id) : undefined;
    if (!name) return;

    setBanks((prev) => {
      const exists = prev.some(
        (x) =>
          String(x._id || x.name).toLowerCase() === (id || name).toLowerCase(),
      );
      if (exists) return prev;
      const newBank = id ? { _id: id, name } : { name };
      return [...prev, newBank];
    });

    if (id) setSelectedBank(id);
    else setSelectedBank(name);
    setIsAddBankOpen(false);
  };

  // If opened with an initialCustomer and vendor (from Ledger), preselect customer
  useEffect(() => {
    if (!isOpen) return;
    if (initialCustomer) {
      setSelectedCustomer({
        _id: initialCustomer._id,
        name: initialCustomer.name,
        customId: initialCustomer.customId,
      });
      setPartyType("Customer");
    } else if (initialVendor) {
      setSelectedVendor({
        _id: initialVendor._id,
        name: initialVendor.name,
        alias: initialVendor.customId,
      });
      setPartyType("Vendor");
    } else if (prefillPartyName) {
      // When only a party name (and optional type) is provided, prefill display
      if (prefillPartyType === "Vendor") {
        setSelectedVendor({ _id: "", name: prefillPartyName });
        setPartyType("Vendor");
      } else {
        setSelectedCustomer({ _id: "", name: prefillPartyName });
        setPartyType("Customer");
      }
    }
  }, [
    isOpen,
    initialCustomer,
    initialVendor,
    prefillPartyName,
    prefillPartyType,
  ]);

  // Prefill fields for edit mode (or when initialPayment is provided)
  useEffect(() => {
    if (!isOpen) return;
    if (!initialPayment) return;

    // Parent recreates `initialPayment` object every render; avoid overwriting user edits.
    const paymentId = (initialPayment as any)._id
      ? String((initialPayment as any)._id)
      : "";
    const prefillKey = `${mode}:${paymentId}`;
    if (prefillKeyRef.current === prefillKey) return;
    prefillKeyRef.current = prefillKey;

    // Set party type from initialPayment (Customer or Vendor)
    if (
      initialPayment.party === "Customer" ||
      initialPayment.party === "Vendor"
    ) {
      setPartyType(initialPayment.party);
    }

    // Set party selection (customer or vendor) from initialPayment.partyId
    if (initialPayment.partyId && typeof initialPayment.partyId === "object") {
      if (initialPayment.party === "Customer") {
        setSelectedCustomer({
          _id: (initialPayment.partyId as any)._id || "",
          name: (initialPayment.partyId as any).name || "",
          customId: (initialPayment.partyId as any).customId,
        });
      } else if (initialPayment.party === "Vendor") {
        setSelectedVendor({
          _id: (initialPayment.partyId as any)._id || "",
          name:
            (initialPayment.partyId as any).companyName ||
            (initialPayment.partyId as any).name ||
            "",
          companyName: (initialPayment.partyId as any).companyName || "",
          alias: (initialPayment.partyId as any).customId,
        });
      }
    }

    if (typeof initialPayment.amount === "string")
      setAmount(initialPayment.amount);
    else if (typeof initialPayment.amount === "number")
      setAmount(String(initialPayment.amount));

    // Amount currency and ROE
    const amountCurrencyValue =
      initialPayment.amountCurrency || initialPayment.amountCurreny;
    if (amountCurrencyValue === "USD" || amountCurrencyValue === "INR") {
      setAmountCurrency(amountCurrencyValue as Currency);
    }
    if (initialPayment.amountRoe) {
      setAmountRoe(String(initialPayment.amountRoe));
    }
    if (initialPayment.amountInr) {
      setAmountInr(String(initialPayment.amountInr));
    }

    // Bank charges
    if (typeof initialPayment.bankCharges === "string")
      setBankCharges(initialPayment.bankCharges);
    else if (typeof initialPayment.bankCharges === "number")
      setBankCharges(String(initialPayment.bankCharges));

    if (typeof initialPayment.bankChargesNotes === "string")
      setBankChargesNotes(initialPayment.bankChargesNotes);

    // Bank charges currency and ROE
    if (
      initialPayment.bankChargesCurrency === "USD" ||
      initialPayment.bankChargesCurrency === "INR"
    ) {
      setBankChargesCurrency(initialPayment.bankChargesCurrency as Currency);
    }
    if (initialPayment.bankChargesRoe) {
      setBankChargesRoe(String(initialPayment.bankChargesRoe));
    }
    if (initialPayment.bankChargesInr) {
      setBankChargesInr(String(initialPayment.bankChargesInr));
    }

    // Cashback
    if (typeof initialPayment.cashbackReceived === "string")
      setCashbackReceived(initialPayment.cashbackReceived);
    else if (typeof initialPayment.cashbackReceived === "number")
      setCashbackReceived(String(initialPayment.cashbackReceived));

    if (typeof initialPayment.cashbackNotes === "string")
      setCashbackNotes(initialPayment.cashbackNotes);

    // Cashback currency and ROE
    if (
      initialPayment.cashbackReceivedCurrency === "USD" ||
      initialPayment.cashbackReceivedCurrency === "INR"
    ) {
      setCashbackReceivedCurrency(
        initialPayment.cashbackReceivedCurrency as Currency,
      );
    }
    if (initialPayment.cashbackReceivedRoe) {
      setCashbackReceivedRoe(String(initialPayment.cashbackReceivedRoe));
    }
    if (initialPayment.cashbackReceivedInr) {
      setCashbackReceivedInr(String(initialPayment.cashbackReceivedInr));
    }

    if (typeof initialPayment.paymentDate === "string")
      setPaymentDate(initialPayment.paymentDate);
    if (typeof initialPayment.bank === "string")
      setSelectedBank(initialPayment.bank);
    if (typeof initialPayment.paymentType === "string") {
      const raw = String(initialPayment.paymentType || "")
        .trim()
        .toLowerCase();
      const map: Record<string, PaymentType> = {
        card: "CARD",
        upi: "UPI",
        imps: "IMPS",
        neft: "NEFT",
        rtgs: "RTGS",
        cheque: "CHEQUE",
      };
      if (raw && map[raw]) setPaymentType(map[raw]);
      else setPaymentType("");
    }
    if (typeof initialPayment.internalNotes === "string")
      setInternalNotes(initialPayment.internalNotes);

    // Set payment breakdown checkbox state
    if (typeof initialPayment.paymentBreakdown === "boolean")
      setShowPaymentBreakdown(initialPayment.paymentBreakdown);
  }, [isOpen, initialPayment, mode]);

  // Clear pending doc rows only when amount is empty or party changes
  useEffect(() => {
    // Only clear if amount becomes empty
    if (!amount || String(amount).trim() === "") {
      setPendingDocRows([]);
      setSettlePendingDocsEnabled(false);
      setSelectedManualRows(new Set());
    }
  }, [selectedCustomer, selectedVendor, amount]);

  const fetchUnsettledQuotations = async () => {
    try {
      if (partyType === "Customer" && selectedCustomer) {
        const resp = await PaymentsApi.getCustomerUnsettledQuotations(
          selectedCustomer._id,
        );
        const list = resp?.quotations || resp || [];
        const rows: PendingDocRow[] = list.map((item: any) => ({
          bookingId:
            item.quotation?.customId || String(item.quotation?._id || ""),
          quotationId: String(item.quotation?._id || ""),
          bookingDate: item.quotation?.createdAt
            ? new Date(item.quotation.createdAt).toLocaleDateString()
            : "",
          totalAmount: Number(item.totalAmount || 0),
          paidAmount: Number(item.allocatedAmount || 0),
          pendingAmount: Number(item.outstandingAmount || 0),
          amountPaying: "0",
        }));

        // Auto-distribute amounts if in auto mode
        if (settlePendingMode === "auto" && amount) {
          const paymentAmount = Number(amount);
          let remaining = paymentAmount;
          const distributedRows = rows.map((row) => {
            if (remaining <= 0) {
              return { ...row, amountPaying: "0" };
            }
            const pendingAmt = Number(row.pendingAmount || 0);
            const allocate = Math.min(remaining, pendingAmt);
            remaining -= allocate;
            return { ...row, amountPaying: String(allocate) };
          });
          setPendingDocRows(distributedRows);
        } else {
          setPendingDocRows(rows);
        }
      } else if (partyType === "Vendor" && selectedVendor) {
        const resp = await PaymentsApi.getVendorUnsettledQuotations(
          selectedVendor._id,
        );
        const list = resp?.quotations || resp || [];
        const rows: PendingDocRow[] = list.map((item: any) => ({
          bookingId:
            item.quotation?.customId || String(item.quotation?._id || ""),
          quotationId: String(item.quotation?._id || ""),
          bookingDate: item.quotation?.createdAt
            ? new Date(item.quotation.createdAt).toLocaleDateString()
            : "",
          totalAmount: Number(item.totalAmount || 0),
          paidAmount: Number(item.allocatedAmount || 0),
          pendingAmount: Number(item.outstandingAmount || 0),
          amountPaying: "0",
        }));

        // Auto-distribute amounts if in auto mode
        if (settlePendingMode === "auto" && amount) {
          const paymentAmount = Number(amount);
          let remaining = paymentAmount;
          const distributedRows = rows.map((row) => {
            if (remaining <= 0) {
              return { ...row, amountPaying: "0" };
            }
            const pendingAmt = Number(row.pendingAmount || 0);
            const allocate = Math.min(remaining, pendingAmt);
            remaining -= allocate;
            return { ...row, amountPaying: String(allocate) };
          });
          setPendingDocRows(distributedRows);
        } else {
          setPendingDocRows(rows);
        }
      }
    } catch (err) {
      console.error("Failed to fetch unsettled quotations", err);
      setPendingDocRows([]);
    }
  };

  const toggleSettlePendingDocsEnabled = async () => {
    const willEnable = !settlePendingDocsEnabled;
    if (!willEnable) {
      setSettlePendingDocsEnabled(false);
      setPendingDocRows([]);
      setSelectedManualRows(new Set());
      return;
    }

    // ensure party and amount are present
    if (partyType === "Customer" && !selectedCustomer) {
      if (onError) onError("Select a customer first");
      else alert("Select a customer first");
      return;
    }
    if (partyType === "Vendor" && !selectedVendor) {
      if (onError) onError("Select a vendor first");
      else alert("Select a vendor first");
      return;
    }
    if (!amount || String(amount).trim() === "") {
      if (onError) onError("Enter an amount first");
      else alert("Enter an amount first");
      return;
    }

    setSettlePendingDocsEnabled(true);
    await fetchUnsettledQuotations();
  };

  const sanitizeAmountInput = (value: string) => value.replace(/[^0-9]/g, "");

  // Helpers for manual allocation to ensure manual allocations never exceed total amount
  const getManualAllocatedTotal = (excludeIndex?: number) => {
    return pendingDocRows.reduce((s, r, i) => {
      if (typeof excludeIndex === "number" && i === excludeIndex) return s;
      return s + (Number(r.amountPaying || 0) || 0);
    }, 0);
  };

  const updateManualRowAmount = (index: number, rawVal: string) => {
    const valNum = Number(rawVal || 0);
    const pending = Number(pendingDocRows[index]?.pendingAmount || 0);
    const alreadyAllocated = getManualAllocatedTotal(index);
    const totalAllowed = Math.max(Number(amount || 0) - alreadyAllocated, 0);

    const clamped = Math.max(0, Math.min(valNum, pending, totalAllowed));

    setPendingDocRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, amountPaying: String(clamped) } : r,
      ),
    );

    // toggle selection for this row based on whether there's a non-zero allocation
    const key =
      pendingDocRows[index]?.quotationId || pendingDocRows[index]?.bookingId;
    if (!key) return;
    const newSet = new Set(selectedManualRows);
    if (clamped > 0) newSet.add(key);
    else newSet.delete(key);
    setSelectedManualRows(newSet);
  };

  const toggleManualSelect = (index: number, checked: boolean) => {
    const row = pendingDocRows[index];
    if (!row) return;
    const key = row.quotationId || row.bookingId;
    if (!key) return;
    const newSet = new Set(selectedManualRows);

    if (checked) {
      // add to selection and allocate up to pending or remaining
      newSet.add(key);
      const alreadyAllocated = getManualAllocatedTotal(index);
      const totalAllowed = Math.max(Number(amount || 0) - alreadyAllocated, 0);
      const pending = Number(row?.pendingAmount || 0);
      const allocate = Math.max(0, Math.min(pending, totalAllowed));
      setPendingDocRows((prev) =>
        prev.map((r, i) =>
          i === index ? { ...r, amountPaying: String(allocate) } : r,
        ),
      );
    } else {
      // remove selection and clear allocation for that row
      newSet.delete(key);
      setPendingDocRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, amountPaying: "0" } : r)),
      );
    }

    setSelectedManualRows(newSet);
  };

  // calc INR equivalents when amount/ROE/currency is present in edit mode
  useEffect(() => {
    if (requiresRoe(amountCurrency, businessCurrency) && amount && amountRoe) {
      const inr = computeInr(amount, amountRoe);
      setAmountInr(inr);
    }

    if (
      requiresRoe(bankChargesCurrency, businessCurrency) &&
      bankCharges &&
      bankChargesRoe
    ) {
      const inr = computeInr(bankCharges, bankChargesRoe);
      setBankChargesInr(inr);
    }

    if (
      requiresRoe(cashbackReceivedCurrency, businessCurrency) &&
      cashbackReceived &&
      cashbackReceivedRoe
    ) {
      const inr = computeInr(cashbackReceived, cashbackReceivedRoe);
      setCashbackReceivedInr(inr);
    }
  }, [
    amountCurrency,
    amount,
    amountRoe,
    bankChargesCurrency,
    bankCharges,
    bankChargesRoe,
    cashbackReceivedCurrency,
    cashbackReceived,
    cashbackReceivedRoe,
  ]);

  // Auto-distribute payment amount in auto mode, clear in manual mode
  useEffect(() => {
    if (pendingDocRows.length === 0) return;

    if (settlePendingMode === "auto" && amount) {
      const paymentAmount = Number(amount);
      let remaining = paymentAmount;

      const updatedRows = pendingDocRows.map((row) => {
        if (remaining <= 0) {
          return { ...row, amountPaying: "0" };
        }

        const pendingAmt = Number(row.pendingAmount || 0);
        const allocate = Math.min(remaining, pendingAmt);
        remaining -= allocate;

        return { ...row, amountPaying: String(allocate) };
      });

      setPendingDocRows(updatedRows);
    } else if (settlePendingMode === "manual") {
      // Clear all amounts when switching to manual mode
      const clearedRows = pendingDocRows.map((row) => ({
        ...row,
        amountPaying: "0",
      }));
      setPendingDocRows(clearedRows);
      setSelectedManualRows(new Set());
    }
  }, [amount, settlePendingMode]);

  const totalPendingAmount = useMemo(() => {
    return pendingDocRows.reduce(
      (sum, r) => sum + (Number(r.pendingAmount) || 0),
      0,
    );
  }, [pendingDocRows]);

  const settlementAmount = useMemo(() => {
    return pendingDocRows.reduce((sum, r) => {
      const paying = Number(r.amountPaying || 0);
      const safePaying = Math.min(Math.max(paying, 0), r.pendingAmount);
      return sum + safePaying;
    }, 0);
  }, [pendingDocRows]);

  const remainingAmount = useMemo(() => {
    return Math.max(totalPendingAmount - settlementAmount, 0);
  }, [totalPendingAmount, settlementAmount]);

  const formatMoney = (value: number) => {
    try {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return String(value);
    }
  };

  // Handle Customer Selection
  const handleCustomerSelect = (customer: CustomerDataType) => {
    setSelectedCustomer(customer);
  };

  // Handle Vendor Selection
  const handleVendorSelect = (vendor: VendorDataType) => {
    setSelectedVendor(vendor);
  };

  // Calculate Balance (placeholder logic)
  const balance = useMemo(() => {
    // TODO: Fetch actual balance from API based on selected customer/vendor
    return "0.00";
  }, [selectedCustomer, selectedVendor]);

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 3;

    if (documents.length + files.length > maxFiles) {
      if (onError) onError(`Maximum ${maxFiles} files can be uploaded`);
      else alert(`Maximum ${maxFiles} files can be uploaded`);
      return;
    }

    const newDocuments: DocumentPreview[] = files.map((file) => {
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;

      return preview
        ? { file, name: file.name, size: file.size, preview }
        : { file, name: file.name, size: file.size };
    });

    setDocuments((prev) => [...prev, ...newDocuments]);
  };

  // Handle Document Remove
  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => {
      const newDocs = [...prev];
      const doc = newDocs[index];
      if (!doc) return prev;

      if (doc.preview) URL.revokeObjectURL(doc.preview);
      newDocs.splice(index, 1);
      return newDocs;
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Handle Submit - calls backend Payments API for customer/vendor
  const handleSubmit = async () => {
    if (partyType === "Customer" && !selectedCustomer) {
      if (onError) onError("Please select a customer");
      return;
    }
    if (partyType === "Vendor" && !selectedVendor) {
      if (onError) onError("Please select a vendor");
      return;
    }

    // bankId must be a valid Mongo ObjectId (24 hex chars) OR the literal 'cash'
    const bankId = selectedBank;
    const isValidObjectId =
      typeof bankId === "string" &&
      (/^[a-fA-F0-9]{24}$/.test(bankId) ||
        String(bankId).toLowerCase() === "cash");
    if (!isValidObjectId) {
      if (onError) onError("Please select a valid bank");
      return;
    }

    // determine status based on user finance maker flag
    const isFinanceMaker = !!(
      (user && (user as any).isFinanceMaker === true) ||
      (user as any).isFinanceMaker === "true"
    );
    const defaultStatus = isFinanceMaker ? "pending" : "approved";
    // Build allocations array if any
    let allocations: Array<{
      quotationId: string | undefined;
      amount: number;
    }> = [];
    if (settlePendingDocsEnabled) {
      if (settlePendingMode === "manual") {
        allocations = pendingDocRows
          .filter((r) => selectedManualRows.has(r.quotationId || r.bookingId))
          .map((r) => ({
            quotationId: r.quotationId,
            amount: Number(r.amountPaying || 0),
          }))
          .filter((a) => a.quotationId && a.amount > 0);
      } else {
        allocations = pendingDocRows
          .map((r) => ({
            quotationId: r.quotationId,
            amount: Number(r.amountPaying || 0),
          }))
          .filter((a) => a.quotationId && a.amount > 0);
      }
      const allocationTotal = allocations.reduce((s, a) => s + a.amount, 0);
      if (allocationTotal > Number(amount)) {
        if (onError) onError("Allocation total exceeds payment amount");
        return;
      }
    }

    // If editing, send FormData as multipart so update supports files too
    if (mode === "edit" && initialPayment && (initialPayment as any)._id) {
      // Validation: when selected currency differs from business currency, require ROE/INR and amount where applicable
      if (requiresRoe(amountCurrency, businessCurrency)) {
        if (!amount || String(amount).trim() === "") {
          showErrorToast("Please input the ROE before submitting.");
          return;
        }
        if (!amountRoe || String(amountRoe).trim() === "") {
          showErrorToast("Please input the ROE before submitting.");
          return;
        }
      }

      if (
        requiresRoe(bankChargesCurrency, businessCurrency) &&
        String(bankCharges || "").trim() !== ""
      ) {
        if (!bankChargesRoe || String(bankChargesRoe).trim() === "") {
          showErrorToast("Please input the ROE before submitting.");
          return;
        }
        if (!bankChargesInr || String(bankChargesInr).trim() === "") {
          showErrorToast("Please input the ROE before submitting.");
          return;
        }
      }

      if (
        requiresRoe(cashbackReceivedCurrency, businessCurrency) &&
        String(cashbackReceived || "").trim() !== ""
      ) {
        if (!cashbackReceivedRoe || String(cashbackReceivedRoe).trim() === "") {
          showErrorToast("Please input the ROE before submitting.");
          return;
        }
        if (!cashbackReceivedInr || String(cashbackReceivedInr).trim() === "") {
          showErrorToast("Please input the ROE before submitting.");
          return;
        }
      }

      const paymentId = (initialPayment as any)._id;
      const form = new FormData();
      form.append("bankId", bankId);
      form.append("amount", String(Number(amount)));
      form.append("amountCurrency", String(amountCurrency || "INR"));
      // backend expects `amountCurreny` (note spelling) — include for compatibility
      form.append("amountCurreny", String(amountCurrency || "INR"));
      if (typeof amountRoe === "string" && amountRoe !== "")
        form.append("amountRoe", String(amountRoe));
      if (typeof amountInr === "string" && amountInr !== "")
        form.append("amountInr", String(amountInr));
      form.append("entryType", effectiveEntryType);
      form.append("paymentDate", paymentDate || new Date().toISOString());
      const paymentTypeToSend = paymentType
        ? String(paymentType).toLowerCase()
        : "cash";
      if (String(bankId).toLowerCase() !== "cash") {
        form.append("paymentType", paymentTypeToSend);
      }
      form.append("status", defaultStatus);
      form.append("paymentBreakdown", String(showPaymentBreakdown));
      if (internalNotes) form.append("internalNotes", internalNotes);
      form.append("bankCharges", String(Number(bankCharges || 0)));
      form.append("bankChargesCurrency", String(bankChargesCurrency || "INR"));
      if (typeof bankChargesRoe === "string" && bankChargesRoe !== "")
        form.append("bankChargesRoe", String(bankChargesRoe));
      if (typeof bankChargesInr === "string" && bankChargesInr !== "")
        form.append("bankChargesInr", String(bankChargesInr));
      form.append("bankChargesNotes", bankChargesNotes || "");
      form.append("cashbackReceived", String(Number(cashbackReceived || 0)));
      form.append(
        "cashbackReceivedCurrency",
        String(cashbackReceivedCurrency || "INR"),
      );
      if (typeof cashbackReceivedRoe === "string" && cashbackReceivedRoe !== "")
        form.append("cashbackReceivedRoe", String(cashbackReceivedRoe));
      if (typeof cashbackReceivedInr === "string" && cashbackReceivedInr !== "")
        form.append("cashbackReceivedInr", String(cashbackReceivedInr));
      form.append("cashbackNotes", cashbackNotes || "");
      if (allocations.length > 0)
        form.append("allocations", JSON.stringify(allocations));
      documents.forEach((d) => form.append("documents", d.file));

      try {
        console.log("Updating payment (multipart) with form keys:");
        for (const k of Array.from(form.keys())) console.log(k);
        const resp = await PaymentsApi.updatePayment(paymentId, form);
        onSubmit?.(resp);
        onClose();
      } catch (err: any) {
        console.error("Failed to update payment", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update payment";
        if (onError) onError(msg);
        else alert(msg);
      }

      return;
    }

    // if not editing, proceed with FormData multipart for create (files supported)
    // Validation: when selected currency differs from business currency, require ROE/INR and amount where applicable
    if (requiresRoe(amountCurrency, businessCurrency)) {
      if (!amount || String(amount).trim() === "") {
        showErrorToast("Please input the ROE before submitting.");
        return;
      }
      if (!amountRoe || String(amountRoe).trim() === "") {
        showErrorToast("Please input the ROE before submitting.");
        return;
      }
    }

    if (
      requiresRoe(bankChargesCurrency, businessCurrency) &&
      String(bankCharges || "").trim() !== ""
    ) {
      if (!bankChargesRoe || String(bankChargesRoe).trim() === "") {
        showErrorToast("Please input the ROE before submitting.");
        return;
      }
      if (!bankChargesInr || String(bankChargesInr).trim() === "") {
        showErrorToast("Please input the ROE before submitting.");
        return;
      }
    }

    if (
      requiresRoe(cashbackReceivedCurrency, businessCurrency) &&
      String(cashbackReceived || "").trim() !== ""
    ) {
      if (!cashbackReceivedRoe || String(cashbackReceivedRoe).trim() === "") {
        showErrorToast("Please input the ROE before submitting.");
        return;
      }
      if (!cashbackReceivedInr || String(cashbackReceivedInr).trim() === "") {
        showErrorToast("Please input the ROE before submitting.");
        return;
      }
    }

    const form = new FormData();
    form.append("bankId", bankId);
    form.append("amount", String(Number(amount)));
    form.append("amountCurrency", String(amountCurrency || "INR"));
    // Also send backend's expected key (typo preserved)
    form.append("amountCurreny", String(amountCurrency || "INR"));
    if (typeof amountRoe === "string" && amountRoe !== "")
      form.append("amountRoe", String(amountRoe));
    if (typeof amountInr === "string" && amountInr !== "")
      form.append("amountInr", String(amountInr));
    form.append("entryType", effectiveEntryType);
    form.append("paymentDate", paymentDate || new Date().toISOString());
    const paymentTypeToSend = paymentType
      ? String(paymentType).toLowerCase()
      : "cash";
    if (String(bankId).toLowerCase() !== "cash") {
      form.append("paymentType", paymentTypeToSend);
    }
    form.append("status", defaultStatus);
    form.append("paymentBreakdown", String(showPaymentBreakdown));
    if (internalNotes) form.append("internalNotes", internalNotes);
    form.append("bankCharges", String(Number(bankCharges || 0)));
    form.append("bankChargesCurrency", String(bankChargesCurrency || "INR"));
    if (typeof bankChargesRoe === "string" && bankChargesRoe !== "")
      form.append("bankChargesRoe", String(bankChargesRoe));
    if (typeof bankChargesInr === "string" && bankChargesInr !== "")
      form.append("bankChargesInr", String(bankChargesInr));
    form.append("bankChargesNotes", bankChargesNotes || "");
    form.append("cashbackReceived", String(Number(cashbackReceived || 0)));
    form.append(
      "cashbackReceivedCurrency",
      String(cashbackReceivedCurrency || "INR"),
    );
    if (typeof cashbackReceivedRoe === "string" && cashbackReceivedRoe !== "")
      form.append("cashbackReceivedRoe", String(cashbackReceivedRoe));
    if (typeof cashbackReceivedInr === "string" && cashbackReceivedInr !== "")
      form.append("cashbackReceivedInr", String(cashbackReceivedInr));
    form.append("cashbackNotes", cashbackNotes || "");
    if (customId) form.append("customId", String(customId));
    if (allocations.length > 0)
      form.append("allocations", JSON.stringify(allocations));
    documents.forEach((d) => form.append("documents", d.file));

    for (const [k, v] of form.entries()) console.log(k, v);

    try {
      let resp: any = null;
      if (partyType === "Customer") {
        resp = await PaymentsApi.createCustomerPayment(
          selectedCustomer!._id,
          form,
        );
      } else {
        resp = await PaymentsApi.createVendorPayment(selectedVendor!._id, form);
      }
      onSubmit?.(resp);
      onClose();
    } catch (err: any) {
      console.error("Failed to create payment", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create payment";
      if (onError) onError(msg);
      else alert(msg);
    }
  };

  // Reset form when closed
  const resetAllFields = React.useCallback(() => {
    prefillKeyRef.current = null;
    setPartyType("Customer");
    setSelectedCustomer(null);
    setSelectedVendor(null);
    setAmount("");
    setAmountCurrency("INR");
    setAmountRoe("");
    setAmountInr("");
    setAmountNotes("");
    setBankCharges("");
    setBankChargesCurrency("INR");
    setBankChargesRoe("");
    setBankChargesInr("");
    setBankChargesNotes("");
    setCashbackReceived("");
    setCashbackReceivedCurrency("INR");
    setCashbackReceivedRoe("");
    setCashbackReceivedInr("");
    setCashbackNotes("");
    setPaymentDate("");
    setSelectedBank("");
    setInternalNotes("");
    setShowPaymentBreakdown(false);
    setSettlePendingDocsEnabled(false);
    setSettlePendingMode("auto");
    setPendingDocRows([]);
    setSelectedManualRows(new Set());
    setDocuments([]);
    setIsAddBankOpen(false);
    setShowAmountNotes(false);
    setShowBankChargesNotes(false);
    setShowCashbackNotes(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetAllFields();
    }
  }, [isOpen, resetAllFields]);

  // Ensure full reset on component unmount
  useEffect(() => {
    return () => {
      resetAllFields();
    };
  }, [resetAllFields]);

  // Intercept close requests so we can confirm when in edit mode
  const handleRequestClose = () => {
    if (mode === "edit") {
      setConfirmCloseOpen(true);
    } else {
      onClose();
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={handleRequestClose}
      title={(() => {
        const partyDisplay =
          (selectedCustomer && selectedCustomer.name) ||
          (selectedVendor &&
            (selectedVendor.companyName || selectedVendor.name)) ||
          prefillPartyName ||
          null;

        const paymentCustomId = customId || (initialPayment as any)?.customId;
        if (mode === "edit") {
          if (paymentCustomId) return `${title}  |  ${paymentCustomId}`;
          return title;
        }

        if (paymentCustomId) return `${title}  |  ${paymentCustomId}`;
        if (partyDisplay) return `${title}  |  ${partyDisplay}`;
        return title;
      })()}
      width="xl"
      position="right"
      headerRight={
        mode === "edit" ? (
          <div className="flex items-center gap-2 mt-1">
            {showViewButton && (
              <button
                type="button"
                onClick={onView}
                className="flex items-center gap-2 rounded-md border border-[#126ACB] bg-white px-3 py-1.5 text-[13px] font-medium text-[#126ACB] hover:bg-blue-50 disabled:opacity-50"
              >
                <FiEye size={14} />
                View
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <FiTrash2 size={14} />
              Delete
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          {/* Party Type + Customer/Vendor Search */}
          <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[13px] font-medium text-gray-700">
                <span className="text-red-500">*</span>Party Type :
              </span>

              {lockedToParty ? (
                <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
                  {partyType}
                </div>
              ) : (
                <div className="flex items-center gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="partyType"
                      value="Customer"
                      checked={partyType === "Customer"}
                      onChange={(e) =>
                        setPartyType(e.target.value as "Customer")
                      }
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                        partyType === "Customer"
                          ? "border-blue-600"
                          : "border-gray-300"
                      } bg-white`}
                    >
                      {partyType === "Customer" && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </span>
                    <span className="ml-2 text-[13px] text-gray-700">
                      Customer
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="partyType"
                      value="Vendor"
                      checked={partyType === "Vendor"}
                      onChange={(e) => setPartyType(e.target.value as "Vendor")}
                      className="sr-only"
                      disabled={mode === "edit"}
                    />
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                        partyType === "Vendor"
                          ? "border-blue-600"
                          : "border-gray-300"
                      } bg-white`}
                    >
                      {partyType === "Vendor" && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </span>
                    <span className="ml-2 text-[13px] text-gray-700">
                      Vendor
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              {/* Determine which party input to show, explicit initialCustomer/initialVendor when provided */}
              {(() => {
                const effectivePartyType = initialCustomer
                  ? "Customer"
                  : initialVendor
                    ? "Vendor"
                    : partyType;

                return effectivePartyType === "Customer" ? (
                  <CustomerDropDown
                    isOpen={isOpen}
                    locked={lockedToParty}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={(c) => {
                      if (lockedToParty) return;
                      if (c) handleCustomerSelect(c);
                      else setSelectedCustomer(null);
                    }}
                  />
                ) : (
                  <VendorDropDown
                    isOpen={isOpen}
                    locked={lockedToParty}
                    selectedVendor={selectedVendor}
                    onSelectVendor={(v) => {
                      if (lockedToParty) return;
                      if (v) handleVendorSelect(v);
                      else setSelectedVendor(null);
                    }}
                  />
                );
              })()}

              {/* Balance Display */}
              <div className="mt-3 text-right">
                <span className="text-[13px] text-gray-600">
                  Balance : ₹ {balance}
                </span>
              </div>
            </div>
          </div>

          {/* Settle Pending Documents (shows after party selection) */}
          {(!!selectedCustomer || !!selectedVendor) &&
            amount?.toString().trim() !== "" && (
              <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <label
                    className="flex items-start gap-3 cursor-pointer select-none"
                    onClick={() => toggleSettlePendingDocsEnabled()}
                  >
                    <div className="mt-0.5 w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center bg-white">
                      {settlePendingDocsEnabled && (
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

                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        Settle Pending Documents
                      </p>
                      <p className="text-[12px] text-gray-600">
                        You have pending documents for this party
                      </p>
                    </div>
                  </label>
                </div>

                {settlePendingDocsEnabled && (
                  <div className="mt-4">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="settlePendingMode"
                          value="auto"
                          checked={settlePendingMode === "auto"}
                          onChange={() => setSettlePendingMode("auto")}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                        />
                        <span className="text-[13px] text-gray-800">Auto</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="settlePendingMode"
                          value="manual"
                          checked={settlePendingMode === "manual"}
                          onChange={() => setSettlePendingMode("manual")}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                        />
                        <span className="text-[13px] text-gray-800">
                          Manual
                        </span>
                      </label>
                    </div>

                    {settlePendingMode === "auto" && (
                      <>
                        <div className="mt-4 border-t border-gray-200" />

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                            <span className="text-[13px] font-medium text-gray-700">
                              Settlement Amount
                            </span>
                            <span className="text-[13px] font-semibold text-green-600">
                              ₹ {formatMoney(settlementAmount)}
                            </span>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                            <span className="text-[13px] font-medium text-gray-700">
                              Remaining Amount
                            </span>
                            <span className="text-[13px] font-semibold text-red-600">
                              ₹ {formatMoney(remainingAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-visible">
                          <Table
                            columns={[
                              "Booking ID",
                              "Booking Date",
                              "Total Amount (Paid)",
                              "Pending Amount",
                              "Amount Paying (₹)",
                            ]}
                            headerAlign={{
                              "Booking ID": "center",
                              "Booking Date": "center",
                              "Total Amount (Paid)": "center",
                              "Pending Amount": "center",
                              "Amount Paying (₹)": "center",
                            }}
                            hideRowsPerPage
                            hideEntriesText
                            initialRowsPerPage={3}
                            categoryName="Bookings"
                            data={pendingDocRows.map((row, idx) => {
                              const payingAmount = Number(
                                row.amountPaying || 0,
                              );

                              return [
                                <td
                                  key={`bid-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  {row.bookingId}
                                </td>,
                                <td
                                  key={`bdate-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  {row.bookingDate}
                                </td>,
                                <td
                                  key={`total-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  <span className="text-gray-900">
                                    ₹ {row.totalAmount.toLocaleString()}
                                  </span>{" "}
                                  <span className="text-green-600">
                                    (₹ {row.paidAmount.toLocaleString()})
                                  </span>
                                </td>,
                                <td
                                  key={`pending-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  ₹ {row.pendingAmount.toLocaleString()}
                                </td>,
                                <td
                                  key={`paying-${idx}`}
                                  className="px-4 py-3 text-center"
                                >
                                  <div className="w-32 mx-auto px-2 py-1 text-[13px] text-center border border-gray-300 rounded bg-gray-50 text-gray-700">
                                    {payingAmount > 0
                                      ? `₹ ${payingAmount.toLocaleString()}`
                                      : "-"}
                                  </div>
                                </td>,
                              ];
                            })}
                          />
                        </div>
                      </>
                    )}

                    {settlePendingMode === "manual" && (
                      <>
                        <div className="mt-4 border-t border-gray-200" />

                        <div className="mt-4 text-[12px] text-red-600 font-medium bg-red-50 px-3 py-2 rounded">
                          Note: Only selected invoices will be settled with this
                          payment. You can select multiple invoices
                        </div>

                        <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-visible">
                          <Table
                            columns={[
                              "Select",
                              "Booking ID",
                              "Booking Date",
                              "Total Amount (Paid)",
                              "Pending Amount",
                              "Amount Paying (₹)",
                            ]}
                            headerAlign={{
                              Select: "center",
                              "Booking ID": "center",
                              "Booking Date": "center",
                              "Total Amount (Paid)": "center",
                              "Pending Amount": "center",
                              "Amount Paying (₹)": "center",
                            }}
                            hideRowsPerPage
                            hideEntriesText
                            initialRowsPerPage={3}
                            categoryName="Bookings"
                            data={pendingDocRows.map((row, idx) => {
                              const isSelected = selectedManualRows.has(
                                row.quotationId || row.bookingId,
                              );

                              return [
                                <td
                                  key={`select-${idx}`}
                                  className="px-4 py-3 text-center"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) =>
                                      toggleManualSelect(idx, e.target.checked)
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                </td>,
                                <td
                                  key={`bid-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  {row.bookingId}
                                </td>,
                                <td
                                  key={`bdate-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  {row.bookingDate}
                                </td>,
                                <td
                                  key={`total-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  <span className="text-gray-900">
                                    ₹ {row.totalAmount.toLocaleString()}
                                  </span>{" "}
                                  <span className="text-green-600">
                                    (₹ {row.paidAmount.toLocaleString()})
                                  </span>
                                </td>,
                                <td
                                  key={`pending-${idx}`}
                                  className="px-4 py-3 text-center text-[13px]"
                                >
                                  ₹ {row.pendingAmount.toLocaleString()}
                                </td>,
                                <td
                                  key={`paying-${idx}`}
                                  className="px-4 py-3 text-center"
                                >
                                  <input
                                    type="text"
                                    value={row.amountPaying}
                                    onChange={(e) => {
                                      const val = sanitizeAmountInput(
                                        e.target.value,
                                      );
                                      updateManualRowAmount(idx, val);
                                    }}
                                    className="w-32 mx-auto px-2 py-1 text-[13px] text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-600"
                                  />
                                </td>,
                              ];
                            })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Payment Details Section */}
          <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold text-gray-900">
                Payment Details
              </h3>
              {effectiveEntryType === "debit" && (
                <label
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowPaymentBreakdown((prev) => !prev)}
                >
                  <div className="w-4 h-4 border border-gray-300 rounded-md flex items-center justify-center">
                    {showPaymentBreakdown && (
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
                  <span className="text-[13px] text-gray-700 font-medium">
                    Show Payment Breakdown
                  </span>
                </label>
              )}
            </div>

            {/* Enter Amount */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Enter Amount
              </label>

              <MultiCurrencyInput
                currency={amountCurrency}
                onCurrencyChange={(c) => {
                  setAmountCurrency(c);
                  if (requiresRoe(c, businessCurrency)) {
                    setAmountInr(
                      computeInr(String(amount || ""), String(amountRoe || "")),
                    );
                  } else {
                    setAmountRoe("");
                    setAmountInr("");
                  }
                }}
                amount={amount}
                onAmountChange={(val) => {
                  const sanitized = val.replace(/[^0-9]/g, "");
                  setAmount(sanitized);
                  if (
                    requiresRoe(amountCurrency, businessCurrency) &&
                    amountRoe
                  ) {
                    setAmountInr(computeInr(sanitized, amountRoe));
                  }
                }}
                amountPlaceholder="Enter Amount"
                roe={amountRoe}
                onRoeChange={(val) => {
                  const sanitized = val.replace(/[^0-9.]/g, "");
                  setAmountRoe(sanitized);
                  if (amount) {
                    setAmountInr(computeInr(amount, sanitized));
                  }
                }}
                inr={amountInr}
                notes={amountNotes}
                onNotesChange={setAmountNotes}
                showNotes={showAmountNotes}
                onToggleNotes={() => setShowAmountNotes(!showAmountNotes)}
                notesPlaceholder="Enter Notes"
                businessCurrency={businessCurrency}
                requiresRoe={requiresRoe}
                inputClassName={inputBase}
                useWhiteDropdown={true}
              />
            </div>

            {showPaymentBreakdown && (
              <div className="mb-4 space-y-4">
                {/* Bank Charges */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Bank Charges
                  </label>
                  <MultiCurrencyInput
                    currency={bankChargesCurrency}
                    onCurrencyChange={(c) => {
                      setBankChargesCurrency(c);
                      if (requiresRoe(c, businessCurrency)) {
                        setBankChargesInr(
                          computeInr(
                            String(bankCharges || ""),
                            String(bankChargesRoe || ""),
                          ),
                        );
                      } else {
                        setBankChargesRoe("");
                        setBankChargesInr("");
                      }
                    }}
                    amount={bankCharges}
                    onAmountChange={(val) => {
                      const sanitized = val.replace(/[^0-9]/g, "");
                      setBankCharges(sanitized);
                      if (
                        requiresRoe(bankChargesCurrency, businessCurrency) &&
                        bankChargesRoe
                      ) {
                        setBankChargesInr(
                          computeInr(sanitized, bankChargesRoe),
                        );
                      }
                    }}
                    amountPlaceholder="Enter Amount"
                    roe={bankChargesRoe}
                    onRoeChange={(val) => {
                      const sanitized = val.replace(/[^0-9.]/g, "");
                      setBankChargesRoe(sanitized);
                      if (bankCharges) {
                        setBankChargesInr(computeInr(bankCharges, sanitized));
                      }
                    }}
                    inr={bankChargesInr}
                    notes={bankChargesNotes}
                    onNotesChange={setBankChargesNotes}
                    showNotes={showBankChargesNotes}
                    onToggleNotes={() =>
                      setShowBankChargesNotes(!showBankChargesNotes)
                    }
                    notesPlaceholder="Enter Notes"
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                    useWhiteDropdown={true}
                  />
                </div>

                {/* Cashback Received */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Cashback Received
                  </label>
                  <MultiCurrencyInput
                    currency={cashbackReceivedCurrency}
                    onCurrencyChange={(c) => {
                      setCashbackReceivedCurrency(c);
                      if (requiresRoe(c, businessCurrency)) {
                        setCashbackReceivedInr(
                          computeInr(
                            String(cashbackReceived || ""),
                            String(cashbackReceivedRoe || ""),
                          ),
                        );
                      } else {
                        setCashbackReceivedRoe("");
                        setCashbackReceivedInr("");
                      }
                    }}
                    amount={cashbackReceived}
                    onAmountChange={(val) => {
                      const sanitized = val.replace(/[^0-9]/g, "");
                      setCashbackReceived(sanitized);
                      if (
                        requiresRoe(
                          cashbackReceivedCurrency,
                          businessCurrency,
                        ) &&
                        cashbackReceivedRoe
                      ) {
                        setCashbackReceivedInr(
                          computeInr(sanitized, cashbackReceivedRoe),
                        );
                      }
                    }}
                    amountPlaceholder="Enter Amount"
                    roe={cashbackReceivedRoe}
                    onRoeChange={(val) => {
                      const sanitized = val.replace(/[^0-9.]/g, "");
                      setCashbackReceivedRoe(sanitized);
                      if (cashbackReceived) {
                        setCashbackReceivedInr(
                          computeInr(cashbackReceived, sanitized),
                        );
                      }
                    }}
                    inr={cashbackReceivedInr}
                    notes={cashbackNotes}
                    onNotesChange={setCashbackNotes}
                    showNotes={showCashbackNotes}
                    onToggleNotes={() =>
                      setShowCashbackNotes(!showCashbackNotes)
                    }
                    notesPlaceholder="Enter Notes"
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                    useWhiteDropdown={true}
                  />
                </div>
              </div>
            )}

            {/* Payment Date */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-2">
                Payment Date
              </label>
              <div className="w-full">
                <SingleCalendar
                  value={paymentDate}
                  onChange={setPaymentDate}
                  placeholder="Select Date"
                  customWidth="w-full"
                  maxDate={today}
                />
              </div>
            </div>

            {/* Bank Selection */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span>Bank
              </label>
              <DropDown
                options={bankDropdownOptions}
                placeholder="Select Bank"
                value={selectedBank}
                onChange={(val) => setSelectedBank(val)}
                customWidth="w-full"
                buttonClassName="text-[13px]"
                footerAction={{
                  label: "Add New Bank",
                  icon: <FiPlusCircle size={16} />,
                  onClick: () => setIsAddBankOpen(true),
                }}
              />
              <p className="mt-2 text-[12px] text-red-500">
                Note : By default the payment method is cash
              </p>
            </div>

            {selectedBank && (
              <div className="mt-4">
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Payment Type
                </label>

                <div className="flex flex-wrap gap-2">
                  {["CARD", "UPI", "IMPS", "NEFT", "RTGS", "CHEQUE"].map(
                    (type) => {
                      const selected = paymentType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPaymentType(type as PaymentType)}
                          className={`px-4 py-2 text-[13px] rounded-full border transition inline-flex items-center gap-3 ${
                            selected
                              ? "bg-[#F9F3FF] border-gray-300 text-gray-800 font-semibold"
                              : "bg-[#F9F9F9] border-gray-200 text-gray-700"
                          }`}
                        >
                          <div className="w-4 h-4 border border-gray-300 rounded-sm flex items-center justify-center bg-white">
                            {selected && (
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
                          <span className="leading-none">{type}</span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            <AddBankSidesheet
              isOpen={isAddBankOpen}
              onClose={() => setIsAddBankOpen(false)}
              onSubmit={handleAddBank}
            />

            <label className="block text-[13px] font-medium text-gray-700 mb-2">
              Files
            </label>
            <div className="mb-2">
              <label className="inline-flex items-center px-3 py-1.5 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                <span className="text-[13px] text-blue-500 font-medium flex items-center gap-2">
                  <MdOutlineFileUpload size={16} />
                  Attach Files
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[12px] text-red-500 mb-3">
              Note : Maximum of 3 files can be uploaded
            </p>

            {/* Document Previews */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between w-full bg-white rounded-md px-3 py-2 hover:bg-gray-50 transition"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        doc.preview && window.open(doc.preview, "_blank")
                      }
                      className="text-blue-700 border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2"
                    >
                      <FaRegFolder className="text-blue-500 w-3 h-3" />
                      {doc.name}
                    </button>

                    {/* Delete Icon */}
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-white">
            <label className="block text-[13px] font-medium text-gray-700 mb-2">
              Remarks
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Enter your notes..."
              rows={3}
              className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 resize-none"
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center">
          <Button
            text={mode === "edit" ? "Update Payment" : "Add Payment"}
            onClick={handleSubmit}
            bgColor="bg-[#0D4B37]"
            textColor="text-white"
            className="py-2.5 text-[13px] font-semibold"
          />
        </div>
      </div>

      <DeletePaymentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete?.();
        }}
        payment={{
          customId: customId || initialPayment?.customId || "—",
          data: {
            partyId: {
              name:
                selectedCustomer?.name ||
                selectedVendor?.name ||
                selectedVendor?.companyName ||
                initialCustomer?.name ||
                initialVendor?.name ||
                "—",
            },
            paymentDate: paymentDate,
            paymentType: paymentType,
            amount: Number(amount || 0),
          },
        }}
      />
      <ConfirmationModal
        isOpen={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        title={"Do you want to confirm the made changes?"}
        confirmText={"Yes, Close"}
        cancelText={"Cancel"}
        onConfirm={() => {
          setConfirmCloseOpen(false);
          onClose();
        }}
      />
      <ErrorToast
        message={errorToastMessage}
        visible={errorToastVisible}
        onClose={() => setErrorToastVisible(false)}
        autoHideMs={4000}
      />
    </SideSheet>
  );
};

export default AddPaymentSidesheet;
