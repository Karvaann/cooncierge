"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import BankApi from "@/services/bankApi";
import { FiEye, FiTrash2 } from "react-icons/fi";
import { TbNotes } from "react-icons/tb";
import SideSheet from "@/components/SideSheet";
import SingleCalendar from "@/components/SingleCalendar";
import Fuse from "fuse.js";
import { allowTextAndNumbers } from "@/utils/inputValidators";
import Button from "@/components/Button";
import { getCustomers } from "@/services/customerApi";
import { getVendors } from "@/services/vendorApi";
import { FaRegFolder } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import Table from "@/components/Table";
import DropDown from "@/components/DropDown";
import AddBankSidesheet, {
  type BankPayload,
} from "@/components/Sidesheets/AddBankSidesheet";
import PaymentsApi from "@/services/paymentsApi";
import { FiPlusCircle } from "react-icons/fi";

type PendingDocRow = {
  bookingId: string;
  bookingDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  amountPaying: string;
  quotationId?: string;
};

interface CustomerDataType {
  _id: string;
  id?: string | undefined;
  customId?: string | undefined;
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  tier?: string | number | undefined;
}

interface VendorDataType {
  _id: string;
  customId?: string | undefined;
  name: string;
  alias?: string | undefined;

  companyName?: string | undefined;
  contactPerson?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  tier?: string | number | undefined;
}

interface AddPaymentSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  title?: string;
  mode?: "create" | "edit";
  /** Optional initial values (useful for edit mode) */
  initialPayment?: {
    amount?: string;
    bankCharges?: string;
    bankChargesNotes?: string;
    cashbackReceived?: string;
    cashbackNotes?: string;
    paymentDate?: string;
    bank?: string;
    paymentType?: string;
    internalNotes?: string;
  } | null;
  /** When in edit mode, optionally open the view sidesheet */
  onView?: () => void;
  /** Optional delete handler shown in header when in edit mode */
  onDelete?: () => void;
  /** this will pre-select the customer and hide party type selection */
  initialCustomer?: { _id: string; name: string; customId?: string } | null;
  /** If true, party type radios are hidden and customer is fixed to `initialCustomer` */
  disablePartyType?: boolean;
  /** Default entry type sent to backend when creating payment ('credit'|'debit') */
  entryTypeDefault?: "credit" | "debit";
  /** Optional generated custom id to show in the header (e.g. PO-..., PI-...) */
  customId?: string | null;
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
  title = "Payment Out",
  mode = "create",
  initialPayment = null,
  onView,
  onDelete,
  initialCustomer = null,
  disablePartyType = false,
  entryTypeDefault = "debit",
  customId = null,
}) => {
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
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [vendorSearchTerm, setVendorSearchTerm] = useState<string>("");
  const [customerList, setCustomerList] = useState<CustomerDataType[]>([]);
  const [vendorList, setVendorList] = useState<VendorDataType[]>([]);
  const [customerResults, setCustomerResults] = useState<CustomerDataType[]>(
    [],
  );
  const [vendorResults, setVendorResults] = useState<VendorDataType[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(false);
  const [showCustomerDropdown, setShowCustomerDropdown] =
    useState<boolean>(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState<boolean>(false);

  // Form State
  const [amount, setAmount] = useState<string>("");
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

  const resetCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setCustomerResults(customerList); // show full list initially
    setShowCustomerDropdown(true);
  };

  const resetVendorSelection = () => {
    setSelectedVendor(null);
    setVendorSearchTerm("");
    setVendorResults(vendorList);
    setShowVendorDropdown(true);
  };

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
    () => banks.map((b) => ({ value: b._id || b.name, label: b.name })),
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

  // Fetch Customers
  const fetchCustomers = useCallback(async (searchTerm: string = "") => {
    setIsLoadingCustomers(true);
    try {
      const params: any = { isDeleted: false };
      if (searchTerm.trim()) {
        params.search = searchTerm;
      }
      const customers = await getCustomers(params);
      setCustomerList(customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomerList([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  // Fetch Vendors
  const fetchVendors = useCallback(async (searchTerm: string = "") => {
    setIsLoadingVendors(true);
    try {
      const params: any = { isDeleted: false };
      if (searchTerm.trim()) {
        params.search = searchTerm;
      }
      const vendors = await getVendors(params);
      setVendorList(vendors || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendorList([]);
    } finally {
      setIsLoadingVendors(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchVendors();
    }
  }, [isOpen, fetchCustomers, fetchVendors]);

  // If opened with an initialCustomer (from Ledger), preselect customer
  useEffect(() => {
    if (isOpen && initialCustomer) {
      setSelectedCustomer({
        _id: initialCustomer._id,
        name: initialCustomer.name,
        customId: initialCustomer.customId,
      });
      setCustomerSearchTerm(
        initialCustomer.name || initialCustomer.customId || "",
      );
      // force party type to customer when initialCustomer provided
      setPartyType("Customer");
    }
  }, [isOpen, initialCustomer]);

  // Prefill fields for edit mode (or when initialPayment is provided)
  useEffect(() => {
    if (!isOpen) return;
    if (!initialPayment) return;

    if (typeof initialPayment.amount === "string")
      setAmount(initialPayment.amount);
    if (typeof initialPayment.bankCharges === "string")
      setBankCharges(initialPayment.bankCharges);
    if (typeof initialPayment.bankChargesNotes === "string")
      setBankChargesNotes(initialPayment.bankChargesNotes);
    if (typeof initialPayment.cashbackReceived === "string")
      setCashbackReceived(initialPayment.cashbackReceived);
    if (typeof initialPayment.cashbackNotes === "string")
      setCashbackNotes(initialPayment.cashbackNotes);
    if (typeof initialPayment.paymentDate === "string")
      setPaymentDate(initialPayment.paymentDate);
    if (typeof initialPayment.bank === "string")
      setSelectedBank(initialPayment.bank);
    if (typeof initialPayment.paymentType === "string")
      setPaymentType(initialPayment.paymentType as PaymentType);
    if (typeof initialPayment.internalNotes === "string")
      setInternalNotes(initialPayment.internalNotes);
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
      alert("Select a customer first");
      return;
    }
    if (partyType === "Vendor" && !selectedVendor) {
      alert("Select a vendor first");
      return;
    }
    if (!amount || String(amount).trim() === "") {
      alert("Enter an amount first");
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
    const key =
      pendingDocRows[index].quotationId || pendingDocRows[index].bookingId;
    const newSet = new Set(selectedManualRows);

    if (checked) {
      // add to selection and allocate up to pending or remaining
      newSet.add(key);
      const alreadyAllocated = getManualAllocatedTotal(index);
      const totalAllowed = Math.max(Number(amount || 0) - alreadyAllocated, 0);
      const pending = Number(pendingDocRows[index]?.pendingAmount || 0);
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

  // Debounced customer search
  useEffect(() => {
    if (!showCustomerDropdown) return;

    const timer = setTimeout(() => {
      fetchCustomers(customerSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchTerm, showCustomerDropdown, fetchCustomers]);

  // Debounced vendor search
  useEffect(() => {
    if (!showVendorDropdown) return;

    const timer = setTimeout(() => {
      fetchVendors(vendorSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [vendorSearchTerm, showVendorDropdown, fetchVendors]);

  // Handle Customer Selection
  const handleCustomerSelect = (customer: CustomerDataType) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name || customer.customId || "");
    setCustomerResults([]);
    setShowCustomerDropdown(false);
  };

  // Handle Vendor Selection
  const handleVendorSelect = (vendor: VendorDataType) => {
    setSelectedVendor(vendor);
    setVendorSearchTerm(
      vendor.companyName || vendor.contactPerson || vendor.customId || "",
    );
    setVendorResults([]);
    setShowVendorDropdown(false);
  };

  // Calculate Balance (placeholder logic)
  const balance = useMemo(() => {
    // TODO: Fetch actual balance from API based on selected customer/vendor
    return "0.00";
  }, [selectedCustomer, selectedVendor]);

  // Fuzzy search helper (copied from GeneralInfoForm)
  function runFuzzySearch<T>(list: T[], term: string, keys: (keyof T)[]): T[] {
    if (!term.trim()) return [];

    const fuse = new Fuse(list, {
      threshold: 0.3,
      keys: keys as string[],
    });

    const results = fuse.search(term).map((r) => r.item);
    return results;
  }

  const getTierRating = (tier: unknown): number | null => {
    try {
      if (!tier) return null;
      if (typeof tier === "number")
        return Math.min(Math.max(Math.round(tier), 1), 5);
      if (typeof tier === "string") {
        const m = (tier as string).match(/\d+/);
        if (!m) return null;
        return Math.min(Math.max(Number(m[0]), 1), 5);
      }
      return null;
    } catch {
      return null;
    }
  };

  const getAlias = (obj: unknown): string => {
    const anyObj = obj as any;
    return (anyObj?.alias || anyObj?.nickname || "") as string;
  };

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 3;

    if (documents.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files can be uploaded`);
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
      alert("Please select a customer");
      return;
    }
    if (partyType === "Vendor" && !selectedVendor) {
      alert("Please select a vendor");
      return;
    }

    // bankId must be a valid Mongo ObjectId (24 hex chars)
    const bankId = selectedBank;
    const isValidObjectId =
      typeof bankId === "string" && /^[a-fA-F0-9]{24}$/.test(bankId);
    if (!isValidObjectId) {
      alert("Please select a valid bank");
      return;
    }

    // if there are files, send as FormData multipart
    const hasFiles = documents.length > 0;
    // determine status based on user finance maker flag
    const isFinanceMaker = !!(
      (user && (user as any).isFinanceMaker === true) ||
      (user as any).isFinanceMaker === "true"
    );
    const defaultStatus = isFinanceMaker ? "pending" : "approved";

    if (hasFiles) {
      const form = new FormData();
      form.append("bankId", bankId);
      form.append("amount", String(Number(amount)));
      form.append("entryType", "debit");
      form.append("paymentDate", paymentDate || new Date().toISOString());
      form.append("paymentType", paymentType || "");
      form.append("status", defaultStatus);
      if (internalNotes) form.append("internalNotes", internalNotes);
      // include bank charges and cashback fields
      form.append("bankCharges", String(Number(bankCharges || 0)));

      form.append("bankChargesNotes", bankChargesNotes || "");
      form.append("cashbackReceived", String(Number(cashbackReceived || 0)));
      form.append("cashbackNotes", cashbackNotes || "");
      // include allocations if any
      if (settlePendingDocsEnabled) {
        let allocations = [];
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
          alert("Allocation total exceeds payment amount");
          return;
        }
        if (allocations.length > 0) {
          form.append("allocations", allocations as any);
        }
      }
      // append files
      documents.forEach((d, i) => {
        form.append("documents", d.file, d.name);
      });

      try {
        let resp: any = null;
        if (partyType === "Customer") {
          resp = await PaymentsApi.createCustomerPayment(
            selectedCustomer!._id,
            form,
          );
        } else {
          resp = await PaymentsApi.createVendorPayment(
            selectedVendor!._id,
            form,
          );
        }
        onSubmit?.(resp);
        onClose();
      } catch (err: any) {
        console.error("Failed to create payment", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create payment";
        alert(msg);
      }
      return;
    }

    const payload: any = {
      bankId,
      amount: Number(amount),
      entryType: "debit",
      paymentDate: paymentDate || new Date().toISOString(),
      paymentType: paymentType || "",

      status: defaultStatus,
      internalNotes,
      bankCharges: Number(bankCharges || 0),
      bankChargesNotes: bankChargesNotes,
      cashbackReceived: Number(cashbackReceived || 0),
      cashbackNotes: cashbackNotes,
    };
    // include allocations when settling pending docs
    if (settlePendingDocsEnabled) {
      let allocations = [];
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
      if (allocations.length > 0) payload.allocations = allocations;
      const allocationTotal = allocations.reduce((s, a) => s + a.amount, 0);
      if (allocationTotal > Number(amount)) {
        alert("Allocation total exceeds payment amount");
        return;
      }
    }

    try {
      let resp: any = null;
      if (partyType === "Customer") {
        resp = await PaymentsApi.createCustomerPayment(
          selectedCustomer!._id,
          payload,
        );
      } else {
        resp = await PaymentsApi.createVendorPayment(
          selectedVendor!._id,
          payload,
        );
      }

      onSubmit?.(resp);
      onClose();
    } catch (err: any) {
      console.error("Failed to create payment", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create payment";
      alert(msg);
    }
  };

  // Reset form when closed
  const resetAllFields = React.useCallback(() => {
    setPartyType("Customer");
    setSelectedCustomer(null);
    setSelectedVendor(null);
    setCustomerSearchTerm("");
    setVendorSearchTerm("");
    setAmount("");
    setBankCharges("");
    setBankChargesNotes("");
    setCashbackReceived("");
    setCashbackNotes("");
    setPaymentDate("");
    setSelectedBank("");
    setInternalNotes("");
    setShowPaymentBreakdown(false);
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

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={customId ? `${title}  |  ${customId}` : title}
      width="xl"
      position="right"
      headerRight={
        mode === "edit" ? (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={onView}
              className="flex items-center gap-2 rounded-md border border-[#126ACB] bg-white px-3 py-1.5 text-[13px] font-medium text-[#126ACB] hover:bg-blue-50 disabled:opacity-50"
            >
              <FiEye size={14} />
              View
            </button>
            <button
              type="button"
              onClick={onDelete}
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
              {disablePartyType ? (
                <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
                  {selectedCustomer?.name ||
                    initialCustomer?.name ||
                    "Customer"}
                </div>
              ) : (
                <>
                  <span className="text-[13px] font-medium text-gray-700">
                    <span className="text-red-500">*</span>Party Type :
                  </span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="partyType"
                        value="customer"
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
                        value="vendor"
                        checked={partyType === "Vendor"}
                        onChange={(e) =>
                          setPartyType(e.target.value as "Vendor")
                        }
                        className="sr-only"
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
                </>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              {!initialCustomer ? (
                disablePartyType || partyType === "Customer" ? (
                  <div className="relative">
                    <label className="block text-[13px] font-medium text-gray-700 mb-2">
                      Search by Customer Name/ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearchTerm}
                        onClick={() => {
                          if (selectedCustomer) {
                            resetCustomerSelection();
                          }
                        }}
                        onChange={(e) => {
                          const value = allowTextAndNumbers(e.target.value);
                          // typing resets previously selected customer
                          if (selectedCustomer) setSelectedCustomer(null);
                          setCustomerSearchTerm(value);

                          if (value.trim() === "") {
                            setCustomerResults([]);
                            setShowCustomerDropdown(false);
                            return;
                          }

                          const results = runFuzzySearch(customerList, value, [
                            "name",
                            "customId",
                            "tier",
                            "phone",
                          ]);

                          setCustomerResults(results);
                          setShowCustomerDropdown(results.length > 0);
                        }}
                        onFocus={() => {
                          if (
                            customerSearchTerm.trim() !== "" &&
                            customerResults.length > 0
                          )
                            setShowCustomerDropdown(true);
                        }}
                        placeholder="Search by Customer Name/ID"
                        readOnly={false}
                        className={`w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 ${
                          selectedCustomer
                            ? "text-transparent caret-transparent"
                            : ""
                        }`}
                      />
                      {selectedCustomer && (
                        <div className="absolute inset-y-0 left-0 right-10 flex items-center px-4 pointer-events-none">
                          {(() => {
                            const rating =
                              getTierRating((selectedCustomer as any).tier) ??
                              4;
                            const alias = getAlias(selectedCustomer) || "-";
                            return (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="font-medium text-[13px] text-gray-900 truncate">
                                    {selectedCustomer.name}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {alias}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {selectedCustomer.customId || "-"}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <img
                                    src={`/icons/tier-${rating}.png`}
                                    alt={`Tier ${rating}`}
                                    className="w-4 h-4 object-contain"
                                  />
                                  <span className="text-[13px] font-semibold text-gray-700">
                                    {rating}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Customer Dropdown */}
                    {showCustomerDropdown && customerResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {customerResults.map((customer) => {
                          let rating =
                            getTierRating((customer as any).tier) ?? 4;
                          rating = Math.min(Math.max(rating || 4, 1), 5);
                          const alias = getAlias(customer) || "-";
                          return (
                            <div
                              key={customer._id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="font-medium text-[13px] text-gray-900 truncate">
                                    {customer.name}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {alias || "-"}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {customer.customId || "-"}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <img
                                    src={`/icons/tier-${rating}.png`}
                                    alt={`Tier ${rating}`}
                                    className="w-4 h-4 object-contain"
                                  />
                                  <span className="text-[13px] font-semibold text-gray-700">
                                    {rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Click outside to close dropdown */}
                    {showCustomerDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCustomerDropdown(false)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <label className="block text-[13px] font-medium text-gray-700 mb-2">
                      Search by Vendor Name/ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={vendorSearchTerm}
                        onClick={() => {
                          if (selectedVendor) {
                            resetVendorSelection();
                          }
                        }}
                        onChange={(e) => {
                          const value = allowTextAndNumbers(e.target.value);
                          if (selectedVendor) setSelectedVendor(null);
                          setVendorSearchTerm(value);

                          if (value.trim() === "") {
                            setVendorResults([]);
                            setShowVendorDropdown(false);
                            return;
                          }

                          const results = runFuzzySearch(vendorList, value, [
                            "companyName",
                            "alias",
                            "tier",
                            "customId",
                          ]);

                          setVendorResults(results);
                          setShowVendorDropdown(results.length > 0);
                        }}
                        onFocus={() => {
                          if (
                            vendorSearchTerm.trim() !== "" &&
                            vendorResults.length > 0
                          )
                            setShowVendorDropdown(true);
                        }}
                        placeholder="Search by Vendor Name/ID"
                        readOnly={false}
                        className={`w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 ${
                          selectedVendor
                            ? "text-transparent caret-transparent"
                            : ""
                        }`}
                      />
                      {selectedVendor && (
                        <div className="absolute inset-y-0 left-0 right-10 flex items-center px-4 pointer-events-none">
                          {(() => {
                            const rating = getTierRating(
                              (selectedVendor as any).tier,
                            );
                            const alias = getAlias(selectedVendor) || "-";
                            const primary =
                              selectedVendor.companyName ||
                              selectedVendor.contactPerson ||
                              "";
                            return (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="font-normal text-[13px] text-gray-900 truncate">
                                    {primary}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {alias}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {selectedVendor.customId || "-"}
                                  </p>
                                </div>

                                {rating !== null ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <img
                                      src={`/icons/tier-${rating}.png`}
                                      alt={`Tier ${rating}`}
                                      className="w-4 h-4 object-contain"
                                    />
                                    <span className="text-[13px] font-semibold text-gray-700">
                                      {rating}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Vendor Dropdown */}
                    {showVendorDropdown && vendorResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {vendorResults.map((vendor) => {
                          let rating: number | null = getTierRating(
                            (vendor as any).tier,
                          );
                          if (rating !== null)
                            rating = Math.min(Math.max(rating, 1), 5);
                          const alias = getAlias(vendor) || "-";
                          const primary =
                            vendor.companyName || vendor.contactPerson || "";
                          return (
                            <div
                              key={vendor._id}
                              onClick={() => handleVendorSelect(vendor)}
                              className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 min-w-0">
                                  <p className="font-normal text-[13px] text-gray-900 truncate">
                                    {primary}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {alias || "-"}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[13px] text-gray-600 truncate">
                                    {vendor.customId || "-"}
                                  </p>
                                </div>

                                {rating !== null ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <img
                                      src={`/icons/tier-${rating}.png`}
                                      alt={`Tier ${rating}`}
                                      className="w-4 h-4 object-contain"
                                    />
                                    <span className="text-[0.75rem] font-semibold text-gray-700">
                                      {rating}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Click outside to close dropdown */}
                    {showVendorDropdown && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowVendorDropdown(false)}
                      />
                    )}
                  </div>
                )
              ) : null}

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
            </div>

            {/* Enter Amount */}
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Enter Amount
              </label>

              <div
                className={`grid ${
                  amountCurrency === "USD"
                    ? "grid-cols-[220px_160px_170px_44px]"
                    : "grid-cols-[380px_44px]"
                } gap-3 items-center`}
              >
                {/* Amount Input */}
                <div className={groupBase}>
                  <DropDown
                    options={[
                      { value: "INR", label: "INR" },
                      { value: "USD", label: "USD" },
                    ]}
                    value={amountCurrency}
                    onChange={(val) => {
                      setAmountCurrency(val as Currency);
                      if (val === "USD") {
                        setAmountInr(
                          computeInr(
                            String(amount || ""),
                            String(amountRoe || ""),
                          ),
                        );
                      } else {
                        setAmountRoe("");
                        setAmountInr("");
                      }
                    }}
                    customWidth="w-[64px]"
                    noBorder={true}
                    noButtonRadius={true}
                    focusRingClass=""
                    buttonClassName="bg-white text-[0.78rem] text-gray-700 px-2 h-[34px]"
                    className={groupSelectWhite}
                  />
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setAmount(val);
                      if (amountCurrency === "USD" && amountRoe) {
                        setAmountInr(computeInr(val, amountRoe));
                      }
                    }}
                    placeholder="Enter Amount"
                    className={groupInput}
                  />
                </div>

                {/* ROE Field (only for USD) */}
                {amountCurrency === "USD" && (
                  <>
                    <div className={groupBase}>
                      <span className={addonLabel}>ROE</span>
                      <input
                        type="text"
                        value={amountRoe}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          setAmountRoe(val);
                          if (amount) {
                            setAmountInr(computeInr(amount, val));
                          }
                        }}
                        placeholder="Rate"
                        className={groupInput}
                      />
                    </div>

                    <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                      <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                        INR
                      </span>
                      <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                        {amountInr || ""}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes Button */}
                <button
                  type="button"
                  onClick={() => setShowAmountNotes(!showAmountNotes)}
                  className={noteBtn}
                >
                  <TbNotes size={16} />
                </button>
              </div>

              {showAmountNotes && (
                <div className="mt-3">
                  <textarea
                    value={bankChargesNotes}
                    onChange={(e) => setBankChargesNotes(e.target.value)}
                    placeholder="Enter Notes"
                    rows={3}
                    className={inputBase}
                  />
                </div>
              )}
            </div>

            {showPaymentBreakdown && (
              <div className="mb-4 space-y-4">
                {/* Bank Charges */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Bank Charges
                  </label>
                  <div
                    className={`grid ${
                      bankChargesCurrency === "USD"
                        ? "grid-cols-[220px_160px_170px_44px]"
                        : "grid-cols-[380px_44px]"
                    } gap-3 items-center`}
                  >
                    {/* Amount Input */}
                    <div className={groupBase}>
                      <DropDown
                        options={[
                          { value: "INR", label: "INR" },
                          { value: "USD", label: "USD" },
                        ]}
                        value={bankChargesCurrency}
                        onChange={(val) => {
                          setBankChargesCurrency(val as Currency);
                          if (val === "USD") {
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
                        customWidth="w-[64px]"
                        noBorder={true}
                        noButtonRadius={true}
                        focusRingClass=""
                        buttonClassName="bg-white text-[0.78rem] text-gray-700 px-2 h-[34px]"
                        className={groupSelectWhite}
                      />
                      <input
                        type="text"
                        value={bankCharges}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setBankCharges(val);
                          if (bankChargesCurrency === "USD" && bankChargesRoe) {
                            setBankChargesInr(computeInr(val, bankChargesRoe));
                          }
                        }}
                        placeholder="Enter Amount"
                        className={groupInput}
                      />
                    </div>

                    {bankChargesCurrency === "USD" && (
                      <>
                        <div className={groupBase}>
                          <span className={addonLabel}>ROE</span>
                          <input
                            type="text"
                            value={bankChargesRoe}
                            onChange={(e) => {
                              const val = e.target.value.replace(
                                /[^0-9.]/g,
                                "",
                              );
                              setBankChargesRoe(val);
                              if (bankCharges) {
                                setBankChargesInr(computeInr(bankCharges, val));
                              }
                            }}
                            placeholder="Rate"
                            className={groupInput}
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {bankChargesInr || ""}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Notes Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowBankChargesNotes(!showBankChargesNotes)
                      }
                      className={noteBtn}
                    >
                      <TbNotes size={16} />
                    </button>
                  </div>

                  {showBankChargesNotes && (
                    <div className="mt-3">
                      <textarea
                        value={bankChargesNotes}
                        onChange={(e) => setBankChargesNotes(e.target.value)}
                        placeholder="Enter Notes"
                        rows={3}
                        className={inputBase}
                      />
                    </div>
                  )}
                </div>

                {/* Cashback Received */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Cashback Received
                  </label>
                  <div
                    className={`grid ${
                      cashbackReceivedCurrency === "USD"
                        ? "grid-cols-[220px_160px_170px_44px]"
                        : "grid-cols-[380px_44px]"
                    } gap-3 items-center`}
                  >
                    {/* Amount Input */}
                    <div className={groupBase}>
                      <DropDown
                        options={[
                          { value: "INR", label: "INR" },
                          { value: "USD", label: "USD" },
                        ]}
                        value={cashbackReceivedCurrency}
                        onChange={(val) => {
                          setCashbackReceivedCurrency(val as Currency);
                          if (val === "USD") {
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
                        customWidth="w-[64px]"
                        noBorder={true}
                        noButtonRadius={true}
                        focusRingClass=""
                        buttonClassName="bg-white text-[0.78rem] text-gray-700 px-2 h-[34px]"
                        className={groupSelectWhite}
                      />
                      <input
                        type="text"
                        value={cashbackReceived}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setCashbackReceived(val);
                          if (
                            cashbackReceivedCurrency === "USD" &&
                            cashbackReceivedRoe
                          ) {
                            setCashbackReceivedInr(
                              computeInr(val, cashbackReceivedRoe),
                            );
                          }
                        }}
                        placeholder="Enter Amount"
                        className={groupInput}
                      />
                    </div>

                    {cashbackReceivedCurrency === "USD" && (
                      <>
                        <div className={groupBase}>
                          <span className={addonLabel}>ROE</span>
                          <input
                            type="text"
                            value={cashbackReceivedRoe}
                            onChange={(e) => {
                              const val = e.target.value.replace(
                                /[^0-9.]/g,
                                "",
                              );
                              setCashbackReceivedRoe(val);
                              if (cashbackReceived) {
                                setCashbackReceivedInr(
                                  computeInr(cashbackReceived, val),
                                );
                              }
                            }}
                            placeholder="Rate"
                            className={groupInput}
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cashbackReceivedInr || ""}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Notes Button */}
                    <button
                      type="button"
                      onClick={() => setShowCashbackNotes(!showCashbackNotes)}
                      className={noteBtn}
                    >
                      <TbNotes size={16} />
                    </button>
                  </div>

                  {showCashbackNotes && (
                    <div className="mt-3">
                      <textarea
                        value={cashbackNotes}
                        onChange={(e) => setCashbackNotes(e.target.value)}
                        placeholder="Enter Notes"
                        rows={3}
                        className={inputBase}
                      />
                    </div>
                  )}
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
            text="Add Payment"
            onClick={handleSubmit}
            bgColor="bg-[#0D4B37]"
            textColor="text-white"
            className="py-2.5 text-[13px] font-semibold"
          />
        </div>
      </div>
    </SideSheet>
  );
};

export default AddPaymentSidesheet;
