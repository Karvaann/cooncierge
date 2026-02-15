"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SideSheet from "@/components/SideSheet";
import Table from "@/components/Table";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import AddBankSidesheet, {
  type BankPayload,
} from "@/components/Sidesheets/AddBankSidesheet";
import BankApi from "@/services/bankApi";
import ErrorToast from "@/components/ErrorToast";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaRegFolder } from "react-icons/fa";
import { FiPlusCircle, FiTrash2 } from "react-icons/fi";
import PaymentsApi from "@/services/paymentsApi";
import CustomIdApi from "@/services/customIdApi";
import Button from "@/components/Button";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import { useAuth } from "@/context/AuthContext";

type BookingLike = {
  _id: string;
  customId?: string;
  customerId?: { _id: string; name: string; email?: string };
  vendorId?: {
    _id: string;
    companyName?: string;
    contactPerson?: string;
    name?: string;
  };
  companyName?: string;
  name?: string;
  formFields?: { customer?: string };
};

interface RecordPaymentSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingLike | null;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
}

type DocumentPreview = {
  file: File;
  name: string;
  size: number;
  preview?: string;
};

const formatMoney = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const sanitizeAmountInput = (value: string) => {
  if (!value) return "";
  // keep digits + optional decimal
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
};

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`w-4 h-4 transform transition-transform ${
      open ? "rotate-180" : "rotate-0"
    }`}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 8l5 5 5-5"
      stroke="#6B6B6B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RecordPaymentSidesheet: React.FC<RecordPaymentSidesheetProps> = ({
  isOpen,
  onClose,
  booking,
  onError,
  onSuccess,
}) => {
  const bookingLabel = booking?.customId || booking?._id || "";

  // Ledger state (to show pending/balance similar to screenshot)
  const [outstandingAmount, setOutstandingAmount] = useState<number | null>(
    null,
  );
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Payment Type State
  type PaymentType = "CARD" | "UPI" | "IMPS" | "NEFT" | "RTGS" | "CHEQUE";

  const [paymentType, setPaymentType] = useState<PaymentType | "">("");

  type PartyType = "Customer" | "Vendor";

  const [partyType, setPartyType] = useState<PartyType>("Customer");

  const partyDisplayName = useMemo(() => {
    if (!booking) return "--";
    if (partyType === "Vendor") {
      const vendor = (booking as any).vendorId;
      return vendor?.companyName || booking.companyName || "--";
    }
    // Customer
    return (
      booking.customerId?.name ||
      booking.formFields?.customer ||
      booking.name ||
      "--"
    );
  }, [partyType, booking]);

  // Form State
  const [amountToRecord, setAmountToRecord] = useState<string>("");
  const { user } = useAuth();
  const businessCurrency = useMemo(() => getBusinessCurrency(user), [user]);

  const [currency, setCurrency] = useState<"INR" | "USD">(
    (businessCurrency as "INR" | "USD") || "INR",
  );
  const [roe, setRoe] = useState<string>("");
  const [inr, setInr] = useState<string>("");
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentPreview[]>([]);

  // Payment breakdown (visible for Vendor)
  const [showPaymentBreakdown, setShowPaymentBreakdown] =
    useState<boolean>(false);

  // Bank charges state
  const [bankCharges, setBankCharges] = useState<string>("");
  const [bankChargesCurrency, setBankChargesCurrency] = useState<"INR" | "USD">(
    "INR",
  );
  const [bankChargesRoe, setBankChargesRoe] = useState<string>("");
  const [bankChargesInr, setBankChargesInr] = useState<string>("");
  const [bankChargesNotes, setBankChargesNotes] = useState<string>("");
  const [showBankChargesNotes, setShowBankChargesNotes] =
    useState<boolean>(false);

  // Cashback state
  const [cashbackReceived, setCashbackReceived] = useState<string>("");
  const [cashbackReceivedCurrency, setCashbackReceivedCurrency] = useState<
    "INR" | "USD"
  >("INR");
  const [cashbackReceivedRoe, setCashbackReceivedRoe] = useState<string>("");
  const [cashbackReceivedInr, setCashbackReceivedInr] = useState<string>("");
  const [cashbackNotes, setCashbackNotes] = useState<string>("");
  const [showCashbackNotes, setShowCashbackNotes] = useState<boolean>(false);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBgClass, setToastBgClass] = useState("bg-red-50");
  const [toastMessageColor, setToastMessageColor] = useState("text-red-600");
  const [toastBorderClass, setToastBorderClass] = useState("border-red-200");
  const [toastCloseBtnClass, setToastCloseBtnClass] = useState(
    "text-red-400 hover:text-red-600",
  );
  const [toastShowLabel, setToastShowLabel] = useState(true);

  const showError = (msg: string) => {
    if (typeof onError === "function") {
      onError(msg);
      return;
    }
    setToastMessage(String(msg));
    setToastBgClass("bg-red-50");
    setToastMessageColor("text-red-600");
    setToastBorderClass("border-red-200");
    setToastCloseBtnClass("text-red-400 hover:text-red-600");
    setToastShowLabel(true);
    setToastVisible(true);
  };

  const showSuccess = (msg: string) => {
    if (typeof onSuccess === "function") {
      onSuccess(msg);
      return;
    }
    setToastMessage(String(msg));
    setToastBgClass("bg-green-50");
    setToastMessageColor("text-green-800");
    setToastBorderClass("border-green-200");
    setToastCloseBtnClass("text-green-600 hover:text-green-800");
    setToastShowLabel(false);
    setToastVisible(true);
  };

  // Advance settle UI
  const [settleFromAdvance, setSettleFromAdvance] = useState<boolean>(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState<boolean>(true);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settleAmountDirty, setSettleAmountDirty] = useState<boolean>(false);
  const [unallocatedPayments, setUnallocatedPayments] = useState<any[]>([]);

  const unallocatedPaymentsKey = useMemo(() => {
    try {
      return unallocatedPayments.map((p) => String(p?._id || "")).join("|");
    } catch {
      return "";
    }
  }, [unallocatedPayments]);

  // Party closing balance state
  const [partyClosing, setPartyClosing] = useState<{
    amount: number;
    balanceType: "debit" | "credit";
  } | null>(null);
  const [isPartyClosingLoading, setIsPartyClosingLoading] = useState(false);

  const amountToRecordNumber = useMemo(() => {
    const n = Number(amountToRecord);
    return Number.isFinite(n) ? n : 0;
  }, [amountToRecord]);

  // compute INR display value when currency/roe/amount change
  useEffect(() => {
    if (currency === "INR") {
      setInr(amountToRecord ? formatMoney(Number(amountToRecord)) : "");
      return;
    }
    const a = Number(amountToRecord || 0);
    const r = Number(roe || 0);
    if (a > 0 && r > 0) {
      setInr(formatMoney(a * r));
    } else {
      setInr("");
    }
  }, [amountToRecord, roe, currency]);

  const computeInr = (amount: string, rate: string) => {
    const a = Number(String(amount).replace(/,/g, ""));
    const r = Number(String(rate).replace(/,/g, ""));
    if (!isFinite(a) || !isFinite(r) || a === 0 || r === 0) return "";
    const product = a * r;
    const hasFraction = Math.abs(product - Math.round(product)) > 1e-9;
    return product.toLocaleString("en-US", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  // compute INR for bank charges and cashback when ROE/values change
  useEffect(() => {
    if (
      requiresRoe(bankChargesCurrency, businessCurrency) &&
      bankCharges &&
      bankChargesRoe
    ) {
      setBankChargesInr(computeInr(bankCharges, bankChargesRoe));
    }
    if (
      requiresRoe(cashbackReceivedCurrency, businessCurrency) &&
      cashbackReceived &&
      cashbackReceivedRoe
    ) {
      setCashbackReceivedInr(computeInr(cashbackReceived, cashbackReceivedRoe));
    }
  }, [
    bankChargesCurrency,
    bankCharges,
    bankChargesRoe,
    cashbackReceivedCurrency,
    cashbackReceived,
    cashbackReceivedRoe,
    businessCurrency,
  ]);

  // advance payment amount
  const totalUnallocatedAmount = useMemo(() => {
    return unallocatedPayments.reduce(
      (sum, p) => sum + Number(p.unallocatedAmount || 0),
      0,
    );
  }, [unallocatedPayments]);

  const totalSettleAmount = useMemo(() => {
    return unallocatedPayments.reduce(
      (sum, p) => sum + Number(p.settleAmount || 0),
      0,
    );
  }, [unallocatedPayments]);

  const remainingAfterSettle = useMemo(() => {
    return Math.max(0, totalUnallocatedAmount - totalSettleAmount);
  }, [totalUnallocatedAmount, totalSettleAmount]);

  const [banks, setBanks] = useState<Array<{ _id?: string; name: string }>>([]);
  const [isAddBankOpen, setIsAddBankOpen] = useState<boolean>(false);

  const bankDropdownOptions = useMemo(
    () => [
      ...banks.map((b) => ({ value: b._id || b.name, label: b.name })),
      { value: "cash", label: "Cash" },
    ],
    [banks],
  );

  const handleAddBank = (bank: BankPayload) => {
    const normalizedName = (bank.name || "").trim();
    if (!normalizedName) return;

    setBanks((prev) => {
      const exists = prev.some(
        (x) => x.name.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (exists) return prev;
      const newBank = bank._id
        ? { _id: bank._id, name: normalizedName }
        : { name: normalizedName };
      return [...prev, newBank];
    });

    // Prefer returned _id when available, else use name
    setSelectedBank(bank._id || normalizedName);
    setIsAddBankOpen(false);
  };

  // Fetch banks when the sidesheet opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await BankApi.getBanks({ isDeleted: false });
        const list = (resp?.banks || resp?.data || resp || []) as any[];
        if (cancelled) return;
        const mapped = list.map((b) => ({
          _id: b._id,
          name: b.name || b.alias || b.accountNumber || String(b._id),
        }));
        setBanks(mapped);
      } catch (err) {
        console.error("Failed to load banks", err);
        if (!cancelled) setBanks([]);
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
  }, [documents]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxFiles = 3;
    if (documents.length + files.length > maxFiles) {
      showError("Maximum of 3 files can be uploaded");
      e.target.value = "";
      return;
    }

    const nextDocs: DocumentPreview[] = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));

    setDocuments((prev) => [...prev, ...nextDocs]);
    e.target.value = "";
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  // Submit handler - record payment against quotation
  const handleRecordPayment = async () => {
    if (!booking?._id) {
      showError("No booking selected");
      return;
    }

    // When settling from advance payments → allocate each payment to quotation
    if (settleFromAdvance) {
      const quotationId = booking._id;
      const paymentsToAllocate = unallocatedPayments.filter(
        (p) => Number(p.settleAmount || 0) > 0,
      );

      if (paymentsToAllocate.length === 0) {
        showError("Please enter settle amounts for at least one payment");
        return;
      }

      try {
        if (partyType === "Customer") {
          // Allocate each customer payment to quotation
          for (const payment of paymentsToAllocate) {
            await PaymentsApi.allocateCustomerPaymentToQuotation(payment._id, {
              quotationId,
              amount: Number(payment.settleAmount),
            });
          }
        } else if (partyType === "Vendor") {
          // Allocate each vendor payment to quotation
          for (const payment of paymentsToAllocate) {
            await PaymentsApi.allocateVendorPaymentToQuotation(payment._id, {
              quotationId,
              amount: Number(payment.settleAmount),
              // amountCurrency: "INR",
            });
          }
        }
        onClose();
        showSuccess("Payment(s) allocated successfully");
      } catch (err: any) {
        console.error("Failed to allocate payment(s)", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to allocate payment(s)";
        showError(msg);
      }
      return;
    }

    if (!amountToRecord || Number(amountToRecord) <= 0) {
      showError("Enter a valid amount to record");
      return;
    }

    const bankId = selectedBank;
    if (!bankId || String(bankId).trim() === "") {
      showError("Please select a valid bank");
      return;
    }

    const selectedPaymentType = (paymentType || "cash").toLowerCase();

    // When Customer party + NOT settling from advance → use createCustomerPayment
    if (partyType === "Customer" && !settleFromAdvance) {
      const customerId = booking.customerId?._id;
      if (!customerId) {
        showError("Customer ID not found");
        return;
      }

      // Generate custom ID for payment in
      let generatedCustomId = "";
      try {
        const customIdResp = await CustomIdApi.generate("paymentIn");
        generatedCustomId = customIdResp?.customId || "";
      } catch (err) {
        console.error("Failed to generate custom ID", err);
        showError("Failed to generate payment ID");
        return;
      }

      const form = new FormData();
      form.append("bankId", bankId);
      form.append("amount", String(Number(amountToRecord)));
      form.append("entryType", "credit");
      if (String(bankId).toLowerCase() !== "cash") {
        form.append("paymentType", selectedPaymentType);
      }
      form.append("paymentDate", paymentDate || new Date().toISOString());
      form.append("party", partyType === "Customer" ? "Customer" : "Vendor");
      form.append("status", "approved");
      form.append("amountCurrency", "INR");
      // Send allocations with quotation id and amount when not settling from advance
      const allocationsPayload = JSON.stringify([
        { quotationId: booking._id, amount: Number(amountToRecord) },
      ]);
      form.append("allocations", allocationsPayload);
      if (generatedCustomId) form.append("customId", generatedCustomId);
      if (remarks) form.append("internalNotes", remarks);
      documents.forEach((d) => form.append("documents", d.file, d.name));

      try {
        await PaymentsApi.createCustomerPayment(customerId, form);
        onClose();
        showSuccess("Payment recorded successfully");
      } catch (err: any) {
        console.error("Failed to record payment", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to record payment";
        showError(msg);
      }
      return;
    }

    // When Vendor party + NOT settling from advance → use createVendorPayment
    if (partyType === "Vendor" && !settleFromAdvance) {
      const vendorId = (booking as any).vendorId?._id;
      if (!vendorId) {
        showError("Vendor ID not found");
        return;
      }

      // Generate custom ID for payment out
      let generatedCustomId = "";
      try {
        const customIdResp = await CustomIdApi.generate("paymentOut");
        generatedCustomId = customIdResp?.customId || "";
      } catch (err) {
        console.error("Failed to generate custom ID", err);
        showError("Failed to generate payment ID");
        return;
      }

      const form = new FormData();
      form.append("bankId", bankId);
      form.append("amount", String(Number(amountToRecord)));
      form.append("entryType", "credit");
      if (String(bankId).toLowerCase() !== "cash") {
        form.append("paymentType", selectedPaymentType);
      }
      form.append("paymentDate", paymentDate || new Date().toISOString());
      form.append("status", "approved");
      form.append("amountCurrency", "INR");
      // Send allocations with quotation id and amount when not settling from advance
      const allocationsPayload = JSON.stringify([
        { quotationId: booking._id, amount: Number(amountToRecord) },
      ]);
      form.append("allocations", allocationsPayload);
      if (generatedCustomId) form.append("customId", generatedCustomId);
      if (remarks) form.append("internalNotes", remarks);
      documents.forEach((d) => form.append("documents", d.file, d.name));

      try {
        await PaymentsApi.createVendorPayment(vendorId, form);
        onClose();
        showSuccess("Payment recorded successfully");
      } catch (err: any) {
        console.error("Failed to record payment", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to record payment";
        showError(msg);
      }
      return;
    }

    // Otherwise use createPaymentForQuotation (with allocationAmount if settling)
    // const hasFiles = documents.length > 0;
    // const allocationAmount = settleFromAdvance
    //   ? Number(settleAmount || 0)
    //   : undefined;

    // if (hasFiles) {
    //   const form = new FormData();
    //   form.append("bankId", bankId);
    //   form.append("amount", String(Number(amountToRecord)));
    //   form.append("entryType", "credit");
    //   form.append("paymentType", selectedPaymentType);
    //   form.append("party", partyType === "Customer" ? "Customer" : "Vendor");
    //   form.append("paymentDate", paymentDate || new Date().toISOString());
    //   form.append("status", "approved");
    //   if (remarks) form.append("internalNotes", remarks);
    //   if (allocationAmount !== undefined)
    //     form.append("allocationAmount", String(allocationAmount));
    //   documents.forEach((d) => form.append("documents", d.file, d.name));

    //   try {
    //     await PaymentsApi.createPaymentForQuotation(booking._id, form);
    //     onClose();
    //     alert("Payment recorded successfully");
    //   } catch (err: any) {
    //     console.error("Failed to record payment", err);
    //     const msg =
    //       err?.response?.data?.message ||
    //       err?.message ||
    //       "Failed to record payment";
    //     alert(msg);
    //   }
    //   return;
    // }

    // const payload: any = {
    //   bankId,
    //   amount: Number(amountToRecord),
    //   entryType: "credit",
    //   paymentType: selectedPaymentType,
    //   paymentDate: paymentDate || new Date().toISOString(),
    //   status: "approved",
    //   internalNotes: remarks,
    //   party: partyType === "Customer" ? "customer" : "vendor",
    // };

    // if (allocationAmount !== undefined)
    //   payload.allocationAmount = allocationAmount;

    // try {
    //   await PaymentsApi.createPaymentForQuotation(booking._id, payload);
    //   onClose();
    //   alert("Payment recorded successfully");
    // } catch (err: any) {
    //   console.error("Failed to record payment", err);
    //   const msg =
    //     err?.response?.data?.message ||
    //     err?.message ||
    //     "Failed to record payment";
    //   alert(msg);
    // }
  };

  // Reset when opening
  useEffect(() => {
    if (!isOpen) return;
    setAmountToRecord("");
    setPaymentDate("");
    setSelectedBank("");
    setRemarks("");
    setDocuments([]);
    setSettleFromAdvance(false);
    setPaymentDetailsOpen(true);
    setSettleAmount("");
    setSettleAmountDirty(false);
    setOutstandingAmount(null);
    setPartyType("Customer");
  }, [isOpen]);

  // Fetch unallocated payments when settle checkbox is clicked
  useEffect(() => {
    if (!isOpen || !settleFromAdvance) return;

    const partyId =
      partyType === "Customer"
        ? booking?.customerId?._id
        : (booking as any)?.vendorId?._id;

    if (!partyId) return;

    let cancelled = false;
    (async () => {
      try {
        const resp =
          partyType === "Customer"
            ? await PaymentsApi.getCustomerUnallocatedPayments(partyId)
            : await PaymentsApi.getVendorUnallocatedPayments(partyId);
        const list = (resp?.payments || resp?.data || resp || []) as any[];
        if (cancelled) return;
        // const mapped = list.map((p) => ({
        //   ...p,
        //   settleAmount: "",
        // }));
        setUnallocatedPayments(list);
      } catch (err) {
        console.error("Failed to load unallocated payments", err);
        if (!cancelled) setUnallocatedPayments([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, settleFromAdvance, partyType, booking]);

  // Fetch closing balance for selected party (customer/vendor)
  useEffect(() => {
    if (!isOpen || !booking) return;

    const partyId =
      partyType === "Customer"
        ? booking.customerId?._id
        : (booking as any).vendorId?._id;

    if (!partyId) {
      setPartyClosing(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setIsPartyClosingLoading(true);
        const resp =
          partyType === "Customer"
            ? await PaymentsApi.getCustomerLedger(partyId)
            : await PaymentsApi.getVendorLedger(partyId);

        const closing = resp?.closingBalance;
        if (cancelled) return;
        if (closing && typeof closing.amount === "number") {
          setPartyClosing({
            amount: Number(closing.amount || 0),
            balanceType: closing.balanceType || "debit",
          });
        } else {
          setPartyClosing(null);
        }
      } catch (err) {
        if (!cancelled) setPartyClosing(null);
      } finally {
        if (!cancelled) setIsPartyClosingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, partyType, booking]);

  // When settle UI opens, collapse payment details like screenshot
  useEffect(() => {
    if (!isOpen) return;
    if (settleFromAdvance) {
      setPaymentDetailsOpen(false);
    } else {
      setPaymentDetailsOpen(true);
      setUnallocatedPayments([]);
    }
  }, [settleFromAdvance, isOpen]);

  const balanceText = useMemo(() => {
    if (isPartyClosingLoading) return "Balance : …";
    if (!partyClosing) return "Balance : ₹ --";
    const amt = formatMoney(Math.max(0, partyClosing.amount));
    // show negative sign when balance type is credit
    return partyClosing.balanceType === "credit"
      ? `Balance : ₹ -${amt}`
      : `Balance : ₹ ${amt}`;
  }, [isPartyClosingLoading, partyClosing]);

  const handleSettleAmountChange = (paymentId: string, value: string) => {
    setUnallocatedPayments((prev) =>
      prev.map((p) =>
        p._id === paymentId ? { ...p, settleAmount: value } : p,
      ),
    );
  };

  const autoDistributeSettleAmounts = React.useCallback(
    (totalAmount: number) => {
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        setUnallocatedPayments((prev) => {
          if (!prev || prev.length === 0) return prev;
          const hasAny = prev.some((p) => String(p?.settleAmount || "") !== "");
          if (!hasAny) return prev;
          return prev.map((p) => ({ ...p, settleAmount: "" }));
        });
        return;
      }

      setUnallocatedPayments((prev) => {
        if (!prev || prev.length === 0) return prev;

        let remaining = totalAmount;
        let changed = false;

        const next = prev.map((p) => {
          const unallocated = Number(p?.unallocatedAmount || 0);
          const maxAlloc =
            Number.isFinite(unallocated) && unallocated > 0 ? unallocated : 0;
          const settle = Math.max(0, Math.min(maxAlloc, remaining));
          remaining = Math.max(0, remaining - settle);

          const nextSettle = settle > 0 ? String(settle) : "";
          const prevSettle = String(p?.settleAmount || "");
          if (prevSettle !== nextSettle) changed = true;
          return { ...p, settleAmount: nextSettle };
        });

        return changed ? next : prev;
      });
    },
    [],
  );

  // Auto-distribute payment amount into "Settle Amount" column
  useEffect(() => {
    if (!isOpen || !settleFromAdvance) return;
    if (settleAmountDirty) return;
    if (!unallocatedPayments || unallocatedPayments.length === 0) return;
    autoDistributeSettleAmounts(amountToRecordNumber);
  }, [
    isOpen,
    settleFromAdvance,
    settleAmountDirty,
    amountToRecordNumber,
    unallocatedPaymentsKey,
    unallocatedPayments?.length,
    autoDistributeSettleAmounts,
  ]);

  const settleTableData = useMemo(() => {
    return unallocatedPayments.map((payment, idx) => {
      const unallocated = Number(payment.unallocatedAmount || 0);
      const settle = Number(payment.settleAmount || 0);
      const remaining = Math.max(0, unallocated - settle);

      return [
        <td key={`p-${idx}`} className="px-4 py-3 text-center text-[13px]">
          <span className="font-medium text-gray-900">
            {payment.customId || payment._id}
          </span>
        </td>,
        <td key={`a-${idx}`} className="px-4 py-3 text-center text-[13px]">
          <div className="text-gray-900 font-medium">
            ₹ {formatMoney(unallocated)}
          </div>
          <div className="mt-1 text-[12px] text-orange-500 font-medium">
            Remaining : ₹ {formatMoney(remaining)}
          </div>
        </td>,
        <td key={`s-${idx}`} className="px-4 py-3 text-center">
          <div className="inline-flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
            <span className="px-3 py-1.5 text-[13px] text-gray-500 bg-gray-50 border-r border-gray-200">
              ₹
            </span>
            <input
              type="text"
              value={payment.settleAmount || ""}
              onChange={(e) => {
                setSettleAmountDirty(true);
                handleSettleAmountChange(
                  payment._id,
                  sanitizeAmountInput(e.target.value),
                );
              }}
              onBlur={() => {
                const n = Number(payment.settleAmount || 0);
                const clamped = Math.min(
                  Math.max(Number.isFinite(n) ? n : 0, 0),
                  unallocated,
                );
                handleSettleAmountChange(payment._id, String(clamped));
              }}
              className="w-[5rem] px-3 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
            />
          </div>
        </td>,
      ];
    });
  }, [unallocatedPayments]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      position="right"
      title={
        <span className="flex items-center gap-2">
          <span>Record Payment</span>
          <span className="font-semibold">{bookingLabel}</span>
        </span>
      }
    >
      <div className="px-6 pb-8">
        {/* Party Type Selection */}
        <div className="mb-4 p-3 bg-white">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[13px] font-medium text-gray-700">
              <span className="text-red-500">*</span> Party Type :
            </span>

            <div className="flex items-center gap-6">
              {/* Customer */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="partyType"
                  value="Customer"
                  checked={partyType === "Customer"}
                  onChange={() => setPartyType("Customer")}
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
                <span className="ml-2 text-[13px] text-gray-700">Customer</span>
              </label>

              {/* Vendor */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="partyType"
                  value="Vendor"
                  checked={partyType === "Vendor"}
                  onChange={() => setPartyType("Vendor")}
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
                <span className="ml-2 text-[13px] text-gray-700">Vendor</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-900">
            {partyDisplayName}
          </div>
          <div className="text-[12px] font-medium text-red-500">
            {balanceText}
          </div>
        </div>

        {/* Settle from Advance Payments */}
        <div className="mt-3 mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between gap-4">
            <label
              className="flex items-start gap-3 cursor-pointer select-none"
              onClick={() =>
                setSettleFromAdvance((p) => {
                  const next = !p;
                  if (next) setSettleAmountDirty(false);
                  return next;
                })
              }
            >
              <div className="mt-0.5 w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center bg-white">
                {settleFromAdvance && (
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
                  Settle from Advance Payments
                </p>
                <p className="text-[12px] text-gray-600">
                  You have advance payments for this booking. Click here to
                  settle from Advance Payments.
                </p>
              </div>
            </label>
          </div>

          {settleFromAdvance && (
            <>
              <div className="mt-4 border-t border-gray-200" />

              <div className="mt-4">
                <div className="inline-flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-4 py-3">
                  <span className="text-[13px] font-medium text-gray-700">
                    Amount Pending
                  </span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    ₹ {formatMoney(totalUnallocatedAmount)}
                  </span>
                </div>

                <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-x-auto max-w-full">
                  <Table
                    columns={["Payment", "Amount (₹)", "Settle Amount (₹)"]}
                    headerAlign={{
                      Payment: "center",
                      "Amount (₹)": "center",
                      "Settle Amount (₹)": "center",
                    }}
                    // show rows-per-page control and default to 2 rows
                    maxRowsPerPageOptions={[2, 5, 10, 25]}
                    initialRowsPerPage={2}
                    hideEntriesText
                    data={settleTableData}
                  />
                </div>

                <div className="mt-2 text-right text-[12px] text-gray-500">
                  Remaining after settle: ₹ {formatMoney(remainingAfterSettle)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment Details (collapsible) */}
        <div className="mb-4 border border-gray-200 rounded-lg bg-white overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setPaymentDetailsOpen((p) => {
                const next = !p;
                if (next) {
                  // Opening payment details then disable settle-from-advance and clear allocations UI
                  setSettleFromAdvance(false);
                  setUnallocatedPayments([]);
                }
                return next;
              })
            }
            className="w-full flex items-center justify-between px-4 py-3"
            aria-expanded={paymentDetailsOpen}
          >
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-gray-900">
                Payment Details
              </span>
            </div>
            <div className="flex items-center gap-3">
              {paymentDetailsOpen && partyType === "Vendor" && (
                <label
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPaymentBreakdown((prev) => !prev);
                  }}
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
              <Chevron open={paymentDetailsOpen} />
            </div>
          </button>
          {paymentDetailsOpen && (
            <>
              <hr className="mb-2 -mt-1 border-t border-gray-200" />
              <div className="px-4 pb-4">
                {/* (Checkbox moved to header) */}

                {/* Amount to be recorded */}
                <div className="mb-4">
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span>Amount to be Recorded
                  </label>
                  <div>
                    <MultiCurrencyInput
                      currency={currency}
                      onCurrencyChange={(c) => setCurrency(c)}
                      amount={amountToRecord}
                      onAmountChange={(val) => {
                        const next = sanitizeAmountInput(val);
                        setAmountToRecord(next);
                        if (settleFromAdvance && !settleAmountDirty) {
                          setSettleAmount(next);
                        }
                      }}
                      amountPlaceholder="Enter Amount"
                      roe={roe}
                      onRoeChange={setRoe}
                      inr={inr}
                      notes={remarks}
                      onNotesChange={setRemarks}
                      showNotes={showNotes}
                      onToggleNotes={() => setShowNotes((s) => !s)}
                      businessCurrency={businessCurrency}
                      requiresRoe={requiresRoe}
                      inputClassName="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                    />
                  </div>
                </div>

                {/* Payment Breakdown UI (Vendor) - moved just under Amount input */}
                {partyType === "Vendor" && showPaymentBreakdown && (
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
                            requiresRoe(
                              bankChargesCurrency,
                              businessCurrency,
                            ) &&
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
                          if (bankCharges)
                            setBankChargesInr(
                              computeInr(bankCharges, sanitized),
                            );
                        }}
                        inr={bankChargesInr}
                        notes={bankChargesNotes}
                        onNotesChange={setBankChargesNotes}
                        showNotes={showBankChargesNotes}
                        onToggleNotes={() => setShowBankChargesNotes((s) => !s)}
                        businessCurrency={businessCurrency}
                        requiresRoe={requiresRoe}
                        inputClassName="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
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
                          if (cashbackReceived)
                            setCashbackReceivedInr(
                              computeInr(cashbackReceived, sanitized),
                            );
                        }}
                        inr={cashbackReceivedInr}
                        notes={cashbackNotes}
                        onNotesChange={setCashbackNotes}
                        showNotes={showCashbackNotes}
                        onToggleNotes={() => setShowCashbackNotes((s) => !s)}
                        businessCurrency={businessCurrency}
                        requiresRoe={requiresRoe}
                        inputClassName="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
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
                      customWidth="w-full"
                      value={paymentDate}
                      onChange={setPaymentDate}
                      placeholder="Select Date"
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
                    Note : Select the bank for this payment
                  </p>
                </div>

                {selectedBank && selectedBank !== "cash" && (
                  <div className="mb-4">
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
                              onClick={() =>
                                setPaymentType(type as PaymentType)
                              }
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

                {/* Files */}
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

                {documents.length > 0 && (
                  <div className="space-y-2 mb-4">
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
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove file"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter your remarks..."
                    rows={3}
                    className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center">
        <Button
          text="Update Payment"
          onClick={handleRecordPayment}
          bgColor="bg-[#0D4B37]"
          textColor="text-white"
          className="py-2.5 text-[13px] font-semibold"
        />
      </div>
    </SideSheet>
  );
};

export default RecordPaymentSidesheet;
