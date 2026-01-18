"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FiEye, FiTrash2 } from "react-icons/fi";
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
import { FiPlusCircle } from "react-icons/fi";

type PendingDocRow = {
  bookingId: string;
  bookingDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  amountPaying: string;
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
    internalNotes?: string;
  } | null;
  /** When in edit mode, optionally open the view sidesheet */
  onView?: () => void;
  /** Optional delete handler shown in header when in edit mode */
  onDelete?: () => void;
  /** When provided, this will pre-select the customer and hide party type selection */
  initialCustomer?: { _id: string; name: string; customId?: string } | null;
  /** If true, party type radios are hidden and customer is fixed to `initialCustomer` */
  disablePartyType?: boolean;
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
}) => {
  // Party Type State
  const [partyType, setPartyType] = useState<"customer" | "vendor">("customer");

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
  const [selectedBank, setSelectedBank] = useState<string>("Cash");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [showPaymentBreakdown, setShowPaymentBreakdown] =
    useState<boolean>(false);

  const [isAddBankOpen, setIsAddBankOpen] = useState<boolean>(false);

  // Settle Pending Docs (Auto UI)
  const [settlePendingDocsEnabled, setSettlePendingDocsEnabled] =
    useState<boolean>(false);
  const [settlePendingMode, setSettlePendingMode] = useState<"auto" | "manual">(
    "auto",
  );
  const [pendingDocRows, setPendingDocRows] = useState<PendingDocRow[]>([]);

  // Document State
  const [documents, setDocuments] = useState<DocumentPreview[]>([]);

  // Bank options (you can customize this list)
  const bankOptions = [
    "Cash",
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

  const [banks, setBanks] = useState<Array<{ name: string; alias?: string }>>(
    bankOptions.map((b) => ({ name: b })),
  );

  const bankDropdownOptions = useMemo(
    () => banks.map((b) => ({ value: b.name, label: b.name })),
    [banks],
  );

  const handleAddBank = (bank: BankPayload) => {
    const normalizedName = bank.name.trim();
    const normalizedAlias = bank.alias.trim();
    if (!normalizedName || !normalizedAlias) return;

    setBanks((prev) => {
      const exists = prev.some(
        (x) => x.name.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (exists) return prev;
      return [...prev, { name: normalizedName, alias: normalizedAlias }];
    });

    setSelectedBank(normalizedName);
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
      setPartyType("customer");
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
    if (typeof initialPayment.internalNotes === "string")
      setInternalNotes(initialPayment.internalNotes);
  }, [isOpen, initialPayment, mode]);

  // Mock pending docs when a party is selected AND user has entered an amount
  useEffect(() => {
    const hasPartySelected = !!selectedCustomer || !!selectedVendor;
    const hasAmount = amount?.toString().trim() !== "";

    if (!hasPartySelected || !hasAmount) {
      setSettlePendingDocsEnabled(false);
      setSettlePendingMode("auto");
      setPendingDocRows([]);
      return;
    }

    setPendingDocRows([
      {
        bookingId: "OS-ABC12",
        bookingDate: "25-09-2025",
        totalAmount: 10000,
        paidAmount: 3000,
        pendingAmount: 10000,
        amountPaying: "5000",
      },
      {
        bookingId: "OS-ABC13",
        bookingDate: "24-09-2025",
        totalAmount: 5000,
        paidAmount: 0,
        pendingAmount: 5000,
        amountPaying: "0",
      },
      {
        bookingId: "OS-ABC14",
        bookingDate: "23-09-2025",
        totalAmount: 2000,
        paidAmount: 0,
        pendingAmount: 2000,
        amountPaying: "0",
      },
    ]);
  }, [selectedCustomer, selectedVendor, amount]);

  const sanitizeAmountInput = (value: string) => value.replace(/[^0-9]/g, "");

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

  // Handle Submit
  const handleSubmit = () => {
    // TODO: Implement payment submission logic
    const paymentData = {
      partyType,
      partyId:
        partyType === "customer" ? selectedCustomer?._id : selectedVendor?._id,
      amount,
      bankCharges,
      bankChargesNotes,
      cashbackReceived,
      cashbackNotes,
      paymentDate,
      bank: selectedBank || "Cash",
      internalNotes,
      documents: documents.map((doc) => doc.file),
    };

    console.log("Payment Data:", paymentData);
    onSubmit?.(paymentData);
  };

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setPartyType("customer");
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
      setSelectedBank("Cash");
      setInternalNotes("");
      setShowPaymentBreakdown(false);
      setDocuments([]);
      setIsAddBankOpen(false);
    }
  }, [isOpen]);

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
                        checked={partyType === "customer"}
                        onChange={(e) =>
                          setPartyType(e.target.value as "customer")
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                      />
                      <span className="ml-2 text-[13px] text-gray-700">
                        Customer
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="partyType"
                        value="vendor"
                        checked={partyType === "vendor"}
                        onChange={(e) =>
                          setPartyType(e.target.value as "vendor")
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                      />
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
                disablePartyType || partyType === "customer" ? (
                  <div className="relative">
                    <label className="block text-[13px] font-medium text-gray-700 mb-2">
                      Search by Customer Name/ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearchTerm}
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
                        readOnly={!!selectedCustomer}
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
                        readOnly={!!selectedVendor}
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
                    onClick={() => setSettlePendingDocsEnabled((prev) => !prev)}
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
                              const payingRaw = Number(row.amountPaying || 0);
                              const payingClamped = Math.min(
                                Math.max(payingRaw, 0),
                                row.pendingAmount,
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
                                  <div className="inline-flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
                                    <span className="px-3 py-1.5 text-[13px] text-gray-500 bg-gray-50 border-r border-gray-200">
                                      ₹
                                    </span>
                                    <input
                                      type="text"
                                      value={row.amountPaying}
                                      onChange={(e) => {
                                        const next = sanitizeAmountInput(
                                          e.target.value,
                                        );
                                        setPendingDocRows((prev) =>
                                          prev.map((r, i) =>
                                            i === idx
                                              ? { ...r, amountPaying: next }
                                              : r,
                                          ),
                                        );
                                      }}
                                      onBlur={() => {
                                        setPendingDocRows((prev) =>
                                          prev.map((r, i) => {
                                            if (i !== idx) return r;
                                            const n = Number(
                                              r.amountPaying || 0,
                                            );
                                            const clamped = Math.min(
                                              Math.max(n, 0),
                                              r.pendingAmount,
                                            );
                                            return {
                                              ...r,
                                              amountPaying: String(clamped),
                                            };
                                          }),
                                        );
                                      }}
                                      className="w-[5rem] px-3 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                                    />
                                  </div>
                                  {payingClamped !== payingRaw ? null : null}
                                </td>,
                              ];
                            })}
                          />
                        </div>
                      </>
                    )}

                    {settlePendingMode === "manual" && (
                      <div className="mt-4 text-[12px] text-gray-500">
                        Manual mode UI will be added later.
                      </div>
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
                <span className="text-red-500">*</span>Enter Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[13px] text-gray-500">
                  ₹
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter Amount"
                  className="w-full pl-8 pr-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                />
              </div>
            </div>

            {showPaymentBreakdown && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Bank Charges
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[13px] text-gray-500">
                      ₹
                    </span>
                    <input
                      type="text"
                      value={bankCharges}
                      onChange={(e) => setBankCharges(e.target.value)}
                      placeholder="Enter Amount"
                      className="w-full pl-8 pr-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={bankChargesNotes}
                    onChange={(e) => setBankChargesNotes(e.target.value)}
                    placeholder="Enter Notes here..."
                    className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Cashback Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[13px] text-gray-500">
                      ₹
                    </span>
                    <input
                      type="text"
                      value={cashbackReceived}
                      onChange={(e) => setCashbackReceived(e.target.value)}
                      placeholder="Enter Amount"
                      className="w-full pl-8 pr-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={cashbackNotes}
                    onChange={(e) => setCashbackNotes(e.target.value)}
                    placeholder="Enter Notes here..."
                    className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
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
              Internal Notes
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Enter your notes..."
              rows={3}
              className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 resize-none"
            />
            <p className="mt-2 text-[12px] text-red-500">
              Note : For internal reference only
            </p>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center">
          <Button
            text="Add Payment"
            onClick={handleSubmit}
            bgColor="bg-[#0D4B37]"
            textColor="text-white"
            className="py-3 text-[13px] font-semibold"
          />
        </div>
      </div>
    </SideSheet>
  );
};

export default AddPaymentSidesheet;
