"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import SingleCalendar from "../SingleCalendar";
import DropDown from "../DropDown";
import { FiFileText, FiSave } from "react-icons/fi";
import { TbNotes } from "react-icons/tb";
import { allowOnlyNumbers } from "@/utils/inputValidators";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import MultiCurrencyInput from "../multiCurrencyUI";

type Currency = "USD" | "INR";

export type CancellationModalFormState = {
  cancellationDate: string;
  showAdvancedPricing: boolean;

  // Match FlightServiceInfoForm advanced pricing state
  vendorBasePrice: string;
  vendorBaseCurrency: Currency;
  vendorBaseRoe: string;
  vendorBaseInr: string;
  vendorBaseNotes: string;

  vendorIncentiveReceived: string;
  vendorIncentiveCurrency: Currency;
  vendorIncentiveRoe: string;
  vendorIncentiveInr: string;
  vendorIncentiveNotes: string;

  commissionPaid: string;
  commissionCurrency: Currency;
  commissionRoe: string;
  commissionInr: string;
  commissionNotes: string;

  costprice: string;
  costCurrency: Currency;
  costRoe: string;
  costInr: string;
  costNotes: string;

  costRefundRoe: string;
  costRefundInr: string;

  sellingprice: string;
  sellingCurrency: Currency;
  sellingRoe: string;
  sellingInr: string;
  sellingNotes: string;

  // Modal-specific fields (refunds/chargeback)
  costRefundCurrency: Currency;
  costRefundAmount: string;
  costRefundNotes: string;

  sellingRefundCurrency: Currency;
  sellingRefundAmount: string;
  sellingRefundNotes: string;
  sellingRefundRoe: string;
  sellingRefundInr: string;

  vendorInvoiceRefundCurrency: Currency;
  vendorInvoiceRefundAmount: string;
  vendorInvoiceRefundNotes: string;
  vendorInvoiceRefundRoe: string;
  vendorInvoiceRefundInr: string;

  chargebackCurrency: Currency;
  chargebackAmount: string;
  chargebackNotes: string;
  chargebackRoe: string;
  chargebackInr: string;

  commissionRefundCurrency: Currency;
  commissionRefundAmount: string;
  commissionRefundNotes: string;
  commissionRefundRoe: string;
  commissionRefundInr: string;

  summary: {
    oldCost: string;
    oldSelling: string;
    oldNet: string;
    oldMargin: string;
    newCost: string;
    newSelling: string;
    newNet: string;
    newMargin: string;
  };
};

const defaultState: CancellationModalFormState = {
  cancellationDate: "",
  showAdvancedPricing: false,

  vendorBasePrice: "",
  vendorBaseCurrency: "INR",
  vendorBaseRoe: "",
  vendorBaseInr: "",
  vendorBaseNotes: "",

  vendorIncentiveReceived: "",
  vendorIncentiveCurrency: "INR",
  vendorIncentiveRoe: "",
  vendorIncentiveInr: "",
  vendorIncentiveNotes: "",

  commissionPaid: "",
  commissionCurrency: "INR",
  commissionRoe: "",
  commissionInr: "",
  commissionNotes: "",

  costprice: "",
  costCurrency: "INR",
  costRoe: "",
  costInr: "",
  costNotes: "",

  sellingprice: "",
  sellingCurrency: "INR",
  sellingRoe: "",
  sellingInr: "",
  sellingNotes: "",

  costRefundCurrency: "INR",
  costRefundAmount: "",
  costRefundNotes: "",
  costRefundRoe: "",
  costRefundInr: "",

  sellingRefundCurrency: "INR",
  sellingRefundAmount: "",
  sellingRefundNotes: "",
  sellingRefundRoe: "",
  sellingRefundInr: "",

  vendorInvoiceRefundCurrency: "INR",
  vendorInvoiceRefundAmount: "",
  vendorInvoiceRefundNotes: "",
  vendorInvoiceRefundRoe: "",
  vendorInvoiceRefundInr: "",

  chargebackCurrency: "INR",
  chargebackAmount: "",
  chargebackNotes: "",
  chargebackRoe: "",
  chargebackInr: "",

  commissionRefundCurrency: "INR",
  commissionRefundAmount: "",
  commissionRefundNotes: "",
  commissionRefundRoe: "",
  commissionRefundInr: "",

  summary: {
    oldCost: "4,800.00",
    oldSelling: "6,400.00",
    oldNet: "1,600.00",
    oldMargin: "23%",
    newCost: "5,200.00",
    newSelling: "5,400.00",
    newNet: "200.00",
    newMargin: "23%",
  },
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: CancellationModalFormState) => void;
  recordLabel?: string; // e.g. OS-ABC12
  statusLabel?: string; // e.g. Cancelled
  initialValues?: Partial<CancellationModalFormState>;

  // Optional linkage to an external "Show Advanced Pricing" checkbox (e.g. flight form)
  linkedShowAdvancedPricing?: boolean;
  onLinkedShowAdvancedPricingChange?: (checked: boolean) => void;
};

const inputBase =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600";

const smallInputBase =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600";

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

export default function CancellationModal({
  isOpen,
  onClose,
  onSave,
  recordLabel = "OS-ABC12",
  statusLabel = "Cancelled",
  initialValues,
  linkedShowAdvancedPricing,
  onLinkedShowAdvancedPricingChange,
}: Props) {
  const mergedInitial = useMemo(() => {
    if (!initialValues) return defaultState;

    const incoming: any = initialValues;
    const next: any = {
      ...defaultState,
      ...incoming,
      summary: { ...defaultState.summary, ...(incoming.summary ?? {}) },
    };

    // Back-compat: previous nested cost/selling shape
    if (incoming.cost && typeof incoming.cost === "object") {
      next.costCurrency =
        (incoming.cost.currency as Currency) ?? next.costCurrency;
      next.costprice = String(incoming.cost.amount ?? next.costprice ?? "");
      next.costRoe = String(incoming.cost.roe ?? next.costRoe ?? "");
      next.costInr = String(incoming.cost.inr ?? next.costInr ?? "");
      next.costNotes = String(incoming.cost.notes ?? next.costNotes ?? "");
      next.costRefundCurrency =
        (incoming.cost.refundCurrency as Currency) ?? next.costRefundCurrency;
      next.costRefundAmount = String(
        incoming.cost.refundAmount ?? next.costRefundAmount ?? "",
      );
      next.costRefundNotes = String(
        incoming.cost.refundNotes ?? next.costRefundNotes ?? "",
      );
      next.costRefundRoe = String(
        incoming.cost.refundRoe ?? next.costRefundRoe ?? "",
      );
      next.costRefundInr = String(
        incoming.cost.refundInr ?? next.costRefundInr ?? "",
      );
    }

    if (incoming.selling && typeof incoming.selling === "object") {
      next.sellingCurrency =
        (incoming.selling.currency as Currency) ?? next.sellingCurrency;
      next.sellingprice = String(
        incoming.selling.amount ?? next.sellingprice ?? "",
      );
      next.sellingRoe = String(incoming.selling.roe ?? next.sellingRoe ?? "");
      next.sellingInr = String(incoming.selling.inr ?? next.sellingInr ?? "");
      next.sellingNotes = String(
        incoming.selling.notes ?? next.sellingNotes ?? "",
      );
      next.sellingRefundCurrency =
        (incoming.selling.refundCurrency as Currency) ??
        next.sellingRefundCurrency;
      next.sellingRefundAmount = String(
        incoming.selling.refundAmount ?? next.sellingRefundAmount ?? "",
      );
      next.sellingRefundNotes = String(
        incoming.selling.refundNotes ?? next.sellingRefundNotes ?? "",
      );
      next.sellingRefundRoe = String(
        incoming.selling.refundRoe ?? next.sellingRefundRoe ?? "",
      );
      next.sellingRefundInr = String(
        incoming.selling.refundInr ?? next.sellingRefundInr ?? "",
      );
    }

    // Back-compat: previous nested advancedPricing shape
    const incomingAp: any = incoming.advancedPricing;
    if (incomingAp && typeof incomingAp === "object") {
      if (incomingAp.vendorInvoice) {
        next.vendorBaseCurrency =
          (incomingAp.vendorInvoice.currency as Currency) ??
          next.vendorBaseCurrency;
        next.vendorBasePrice = String(
          incomingAp.vendorInvoice.amount ?? next.vendorBasePrice ?? "",
        );
        next.vendorBaseRoe = String(
          incomingAp.vendorInvoice.roe ?? next.vendorBaseRoe ?? "",
        );
        next.vendorBaseInr = String(
          incomingAp.vendorInvoice.inr ?? next.vendorBaseInr ?? "",
        );
        next.vendorBaseNotes = String(
          incomingAp.vendorInvoice.notes ?? next.vendorBaseNotes ?? "",
        );
      }
      if (incomingAp.vendorInvoiceRefund) {
        next.vendorInvoiceRefundCurrency =
          (incomingAp.vendorInvoiceRefund.currency as Currency) ??
          next.vendorInvoiceRefundCurrency;
        next.vendorInvoiceRefundAmount = String(
          incomingAp.vendorInvoiceRefund.amount ??
            next.vendorInvoiceRefundAmount ??
            "",
        );
        next.vendorInvoiceRefundNotes = String(
          incomingAp.vendorInvoiceRefund.notes ??
            next.vendorInvoiceRefundNotes ??
            "",
        );
        next.vendorInvoiceRefundRoe = String(
          incomingAp.vendorInvoiceRefund.roe ??
            next.vendorInvoiceRefundRoe ??
            "",
        );
        next.vendorInvoiceRefundInr = String(
          incomingAp.vendorInvoiceRefund.inr ??
            next.vendorInvoiceRefundInr ??
            "",
        );
      }
      if (incomingAp.supplierIncentive) {
        next.vendorIncentiveCurrency =
          (incomingAp.supplierIncentive.currency as Currency) ??
          next.vendorIncentiveCurrency;
        next.vendorIncentiveReceived = String(
          incomingAp.supplierIncentive.amount ??
            next.vendorIncentiveReceived ??
            "",
        );
        next.vendorIncentiveRoe = String(
          incomingAp.supplierIncentive.roe ?? next.vendorIncentiveRoe ?? "",
        );
        next.vendorIncentiveInr = String(
          incomingAp.supplierIncentive.inr ?? next.vendorIncentiveInr ?? "",
        );
        next.vendorIncentiveNotes = String(
          incomingAp.supplierIncentive.notes ?? next.vendorIncentiveNotes ?? "",
        );
      }
      if (incomingAp.chargeback) {
        next.chargebackCurrency =
          (incomingAp.chargeback.currency as Currency) ??
          next.chargebackCurrency;
        next.chargebackAmount = String(
          incomingAp.chargeback.amount ?? next.chargebackAmount ?? "",
        );
        next.chargebackNotes = String(
          incomingAp.chargeback.notes ?? next.chargebackNotes ?? "",
        );
        next.chargebackRoe = String(
          incomingAp.chargeback.roe ?? next.chargebackRoe ?? "",
        );
        next.chargebackInr = String(
          incomingAp.chargeback.inr ?? next.chargebackInr ?? "",
        );
      }
      if (incomingAp.commissionPayout) {
        next.commissionCurrency =
          (incomingAp.commissionPayout.currency as Currency) ??
          next.commissionCurrency;
        next.commissionPaid = String(
          incomingAp.commissionPayout.amount ?? next.commissionPaid ?? "",
        );
        next.commissionRoe = String(
          incomingAp.commissionPayout.roe ?? next.commissionRoe ?? "",
        );
        next.commissionInr = String(
          incomingAp.commissionPayout.inr ?? next.commissionInr ?? "",
        );
        next.commissionNotes = String(
          incomingAp.commissionPayout.notes ?? next.commissionNotes ?? "",
        );
      }
      if (incomingAp.commissionRefund) {
        next.commissionRefundCurrency =
          (incomingAp.commissionRefund.currency as Currency) ??
          next.commissionRefundCurrency;
        next.commissionRefundAmount = String(
          incomingAp.commissionRefund.amount ??
            next.commissionRefundAmount ??
            "",
        );
        next.commissionRefundNotes = String(
          incomingAp.commissionRefund.notes ?? next.commissionRefundNotes ?? "",
        );
        next.commissionRefundRoe = String(
          incomingAp.commissionRefund.roe ?? next.commissionRefundRoe ?? "",
        );
        next.commissionRefundInr = String(
          incomingAp.commissionRefund.inr ?? next.commissionRefundInr ?? "",
        );
      }

      // Back-compat: older flat-string advancedPricing shape
      if (
        "vendorBasePrice" in incomingAp ||
        "vendorIncentiveReceived" in incomingAp ||
        "commissionPaid" in incomingAp
      ) {
        next.vendorBasePrice = String(
          incomingAp.vendorBasePrice ?? next.vendorBasePrice ?? "",
        );
        next.vendorBaseNotes = String(
          incomingAp.vendorBasePriceNotes ?? next.vendorBaseNotes ?? "",
        );
        next.vendorIncentiveReceived = String(
          incomingAp.vendorIncentiveReceived ??
            next.vendorIncentiveReceived ??
            "",
        );
        next.vendorIncentiveNotes = String(
          incomingAp.vendorIncentiveReceivedNotes ??
            next.vendorIncentiveNotes ??
            "",
        );
        next.commissionPaid = String(
          incomingAp.commissionPaid ?? next.commissionPaid ?? "",
        );
        next.commissionNotes = String(
          incomingAp.commissionPaidNotes ?? next.commissionNotes ?? "",
        );
      }
    }

    return next as CancellationModalFormState;
  }, [initialValues]);

  const computeInr = (amountStr: string, roeStr: string) => {
    const a = Number(String(amountStr).replace(/,/g, ""));
    const r = Number(String(roeStr).replace(/,/g, ""));
    if (!isFinite(a) || !isFinite(r) || a === 0 || r === 0) return "";
    const product = a * r;
    const hasFraction = Math.abs(product - Math.round(product)) > 1e-9;
    return product.toLocaleString("en-US", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  const [form, setForm] = useState<CancellationModalFormState>(mergedInitial);
  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user as any);
  const [showCenterRefundNotes, setShowCenterRefundNotes] = useState(false);
  const [advNotesVisible, setAdvNotesVisible] = useState({
    vendorBase: false,
    vendorInvoiceRefund: false,
    vendorIncentive: false,
    chargeback: false,
    commissionPaid: false,
    commissionRefund: false,
  });
  const [showCostNotes, setShowCostNotes] = useState(true);
  const [showSellingNotes, setShowSellingNotes] = useState(true);
  const [showSellingRefundNotes, setShowSellingRefundNotes] = useState(false);

  const effectiveShowAdvancedPricing =
    typeof linkedShowAdvancedPricing === "boolean"
      ? linkedShowAdvancedPricing
      : Boolean(form.showAdvancedPricing);

  // Helper to parse currency value to INR
  const parseToInr = (
    amount: string,
    currency: Currency,
    roe: string,
    inr: string,
  ): number => {
    if (requiresRoe(currency, businessCurrency) && inr) {
      return parseFloat(String(inr).replace(/,/g, "")) || 0;
    }
    return parseFloat(String(amount).replace(/,/g, "")) || 0;
  };

  // Calculate old cost price
  const oldCostPrice = useMemo(() => {
    if (effectiveShowAdvancedPricing) {
      // Advanced: Vendor Base Price - Supplier Incentive + Commission Paid
      const vendorBase = parseToInr(
        form.vendorBasePrice,
        form.vendorBaseCurrency,
        form.vendorBaseRoe,
        form.vendorBaseInr,
      );
      const supplierIncentive = parseToInr(
        form.vendorIncentiveReceived,
        form.vendorIncentiveCurrency,
        form.vendorIncentiveRoe,
        form.vendorIncentiveInr,
      );
      const commissionPaid = parseToInr(
        form.commissionPaid,
        form.commissionCurrency,
        form.commissionRoe,
        form.commissionInr,
      );
      return vendorBase - supplierIncentive + commissionPaid;
    } else {
      // Normal: Cost Price input
      return parseToInr(
        form.costprice,
        form.costCurrency,
        form.costRoe,
        form.costInr,
      );
    }
  }, [
    effectiveShowAdvancedPricing,
    form.vendorBasePrice,
    form.vendorBaseCurrency,
    form.vendorBaseRoe,
    form.vendorBaseInr,
    form.vendorIncentiveReceived,
    form.vendorIncentiveCurrency,
    form.vendorIncentiveRoe,
    form.vendorIncentiveInr,
    form.commissionPaid,
    form.commissionCurrency,
    form.commissionRoe,
    form.commissionInr,
    form.costprice,
    form.costCurrency,
    form.costRoe,
    form.costInr,
  ]);

  // Calculate old selling price (same for both modes - selling price input)
  const oldSellingPrice = useMemo(() => {
    return parseToInr(
      form.sellingprice,
      form.sellingCurrency,
      form.sellingRoe,
      form.sellingInr,
    );
  }, [
    form.sellingprice,
    form.sellingCurrency,
    form.sellingRoe,
    form.sellingInr,
  ]);

  // Calculate new cost price
  const newCostPrice = useMemo(() => {
    if (effectiveShowAdvancedPricing) {
      // Advanced: Vendor Invoice Refund - Chargeback + Commission Refund
      const vendorRefund = parseToInr(
        form.vendorInvoiceRefundAmount,
        form.vendorInvoiceRefundCurrency,
        form.vendorInvoiceRefundRoe,
        form.vendorInvoiceRefundInr,
      );
      const chargeback = parseToInr(
        form.chargebackAmount,
        form.chargebackCurrency,
        form.chargebackRoe,
        form.chargebackInr,
      );
      const commissionRefund = parseToInr(
        form.commissionRefundAmount,
        form.commissionRefundCurrency,
        form.commissionRefundRoe,
        form.commissionRefundInr,
      );
      return vendorRefund - chargeback + commissionRefund;
    } else {
      // Normal: Cost Refund Received
      return parseToInr(
        form.costRefundAmount,
        form.costRefundCurrency,
        form.costRefundRoe,
        form.costRefundInr,
      );
    }
  }, [
    effectiveShowAdvancedPricing,
    form.vendorInvoiceRefundAmount,
    form.vendorInvoiceRefundCurrency,
    form.vendorInvoiceRefundRoe,
    form.vendorInvoiceRefundInr,
    form.chargebackAmount,
    form.chargebackCurrency,
    form.chargebackRoe,
    form.chargebackInr,
    form.commissionRefundAmount,
    form.commissionRefundCurrency,
    form.commissionRefundRoe,
    form.commissionRefundInr,
    form.costRefundAmount,
    form.costRefundCurrency,
    form.costRefundRoe,
    form.costRefundInr,
  ]);

  // Calculate new selling price (same for both modes - selling refund received)
  const newSellingPrice = useMemo(() => {
    return parseToInr(
      form.sellingRefundAmount,
      form.sellingRefundCurrency,
      form.sellingRefundRoe,
      form.sellingRefundInr,
    );
  }, [
    form.sellingRefundAmount,
    form.sellingRefundCurrency,
    form.sellingRefundRoe,
    form.sellingRefundInr,
  ]);

  // Calculate nets
  const oldNet = useMemo(
    () => oldSellingPrice - oldCostPrice,
    [oldSellingPrice, oldCostPrice],
  );
  const newNet = useMemo(
    () => newSellingPrice - newCostPrice,
    [newSellingPrice, newCostPrice],
  );

  // Calculate margins as percentages
  const oldMargin = useMemo(() => {
    if (oldSellingPrice === 0) return "0.00%";
    return ((oldNet / oldSellingPrice) * 100).toFixed(2) + "%";
  }, [oldNet, oldSellingPrice]);

  const newMargin = useMemo(() => {
    if (newSellingPrice === 0) return "0.00%";
    return ((newNet / newSellingPrice) * 100).toFixed(2) + "%";
  }, [newNet, newSellingPrice]);

  // Format numbers with commas
  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      setForm(mergedInitial);
      setShowCenterRefundNotes(false);
      setShowCostNotes(true);
      setShowSellingNotes(true);
      setShowSellingRefundNotes(false);
      setAdvNotesVisible({
        vendorBase: false,
        vendorInvoiceRefund: false,
        vendorIncentive: false,
        chargeback: false,
        commissionPaid: false,
        commissionRefund: false,
      });
    }
  }, [isOpen, mergedInitial]);

  // Keep modal checkbox in sync when driven by external state.
  useEffect(() => {
    if (!isOpen) return;
    if (typeof linkedShowAdvancedPricing !== "boolean") return;
    setForm((prev) => ({
      ...prev,
      showAdvancedPricing: linkedShowAdvancedPricing,
    }));
  }, [isOpen, linkedShowAdvancedPricing]);

  const handleSave = () => {
    const summary = {
      oldCost: formatCurrency(oldCostPrice),
      oldSelling: formatCurrency(oldSellingPrice),
      oldNet: formatCurrency(oldNet),
      oldMargin: oldMargin,
      newCost: formatCurrency(newCostPrice),
      newSelling: formatCurrency(newSellingPrice),
      newNet: formatCurrency(newNet),
      newMargin: newMargin,
    };

    const updated = { ...form, summary } as CancellationModalFormState;
    setForm(updated);
    onSave?.(updated);
  };

  const handleShowAdvancedPricingChange = (checked: boolean) => {
    if (typeof onLinkedShowAdvancedPricingChange === "function") {
      onLinkedShowAdvancedPricingChange(checked);
    } else {
      setForm((prev) => ({ ...prev, showAdvancedPricing: checked }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      customWidth="max-w-6xl w-[1000px]"
      zIndexClass="z-[1000]"
      headerLeft={
        <div className="flex items-center gap-2 text-[0.95rem]">
          <div className="font-medium text-[#020202]">Amount</div>
          <div className="text-gray-300">|</div>
          <div className="font-medium text-[#020202]">{recordLabel}</div>
          <div className="text-gray-300">|</div>
          <div className="text-[#020202]">{statusLabel}</div>
          <div className="absolute top-11 left-6 right-6 z-10 border-b border-gray-200"></div>
        </div>
      }
    >
      <div className="space-y-2 ">
        <div className="flex items-end justify-between mb-4">
          <SingleCalendar
            label="Cancellation Date"
            value={form.cancellationDate}
            onChange={(date) =>
              setForm((prev) => ({
                ...prev,
                cancellationDate: date,
              }))
            }
            placeholder="Select Date"
            customWidth="w-[16rem]"
          />

          {/* Match checkbox */}
          <div className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id="show-advanced-pricing-cancellation-modal"
              className="hidden"
              checked={effectiveShowAdvancedPricing}
              onChange={(e) =>
                handleShowAdvancedPricingChange(e.target.checked)
              }
            />
            <label
              htmlFor="show-advanced-pricing-cancellation-modal"
              className="w-4 h-4 -mt-1 border border-gray-300 rounded-sm flex items-center justify-center cursor-pointer peer-checked:bg-green-600"
            >
              {effectiveShowAdvancedPricing && (
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
            </label>
            <span className="text-[13px] text-gray-700">
              Show Advanced Pricing
            </span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {!effectiveShowAdvancedPricing ? (
            <div>
              {/* COST PRICE */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Cost Price
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.costCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => {
                        const next: CancellationModalFormState = {
                          ...prev,
                          costCurrency: val,
                        };
                        if (requiresRoe(val, businessCurrency)) {
                          next.costInr = computeInr(
                            String(prev.costprice ?? ""),
                            String(prev.costRoe ?? ""),
                          );
                        } else {
                          next.costRoe = "";
                          next.costInr = "";
                        }
                        return next;
                      })
                    }
                    amount={form.costprice}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        costprice: amount,
                        costInr: requiresRoe(
                          prev.costCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, prev.costRoe)
                          : "",
                      }));
                    }}
                    roe={form.costRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        costRoe: roe,
                        costInr: computeInr(prev.costprice, roe),
                      }));
                    }}
                    inr={form.costInr}
                    notes={form.costNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        costNotes: val,
                      }))
                    }
                    showNotes={showCostNotes}
                    onToggleNotes={() => setShowCostNotes((s) => !s)}
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                  />
                </div>
              </div>

              {/* COST REFUND RECEIVED */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.costRefundCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        costRefundCurrency: val,
                        costRefundRoe: requiresRoe(val, businessCurrency)
                          ? prev.costRefundRoe
                          : "",
                        costRefundInr: requiresRoe(val, businessCurrency)
                          ? prev.costRefundInr
                          : "",
                      }))
                    }
                    amount={form.costRefundAmount}
                    onAmountChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        costRefundAmount: allowOnlyNumbers(val),
                        costRefundInr: requiresRoe(
                          prev.costRefundCurrency,
                          businessCurrency,
                        )
                          ? computeInr(
                              allowOnlyNumbers(val),
                              prev.costRefundRoe,
                            )
                          : prev.costRefundInr,
                      }))
                    }
                    roe={form.costRefundRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        costRefundRoe: roe,
                        costRefundInr: computeInr(prev.costRefundAmount, roe),
                      }));
                    }}
                    inr={form.costRefundInr}
                    notes={form.costRefundNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        costRefundNotes: val,
                      }))
                    }
                    showNotes={
                      requiresRoe(form.costRefundCurrency, businessCurrency) &&
                      showCenterRefundNotes
                    }
                    onToggleNotes={() => setShowCenterRefundNotes((s) => !s)}
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                    useWhiteDropdown={false}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ADVANCED PRICING UI (separate boxes), placed above Selling Price */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Vendor Base Price
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.vendorBaseCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => {
                        const next: CancellationModalFormState = {
                          ...prev,
                          vendorBaseCurrency: val,
                        };
                        if (requiresRoe(val, businessCurrency)) {
                          next.vendorBaseInr = computeInr(
                            String(prev.vendorBasePrice ?? ""),
                            String(prev.vendorBaseRoe ?? ""),
                          );
                        } else {
                          next.vendorBaseRoe = "";
                          next.vendorBaseInr = "";
                        }
                        return next;
                      })
                    }
                    amount={form.vendorBasePrice}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        vendorBasePrice: amount,
                        vendorBaseInr: requiresRoe(
                          prev.vendorBaseCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, prev.vendorBaseRoe)
                          : "",
                      }));
                    }}
                    roe={form.vendorBaseRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        vendorBaseRoe: roe,
                        vendorBaseInr: computeInr(prev.vendorBasePrice, roe),
                      }));
                    }}
                    inr={form.vendorBaseInr}
                    notes={form.vendorBaseNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        vendorBaseNotes: val,
                      }))
                    }
                    showNotes={advNotesVisible.vendorBase}
                    onToggleNotes={() =>
                      setAdvNotesVisible((p) => ({
                        ...p,
                        vendorBase: !p.vendorBase,
                      }))
                    }
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.vendorInvoiceRefundCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        vendorInvoiceRefundCurrency: val,
                        vendorInvoiceRefundRoe: requiresRoe(
                          val,
                          businessCurrency,
                        )
                          ? prev.vendorInvoiceRefundRoe
                          : "",
                        vendorInvoiceRefundInr: requiresRoe(
                          val,
                          businessCurrency,
                        )
                          ? prev.vendorInvoiceRefundInr
                          : "",
                      }))
                    }
                    amount={form.vendorInvoiceRefundAmount}
                    onAmountChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        vendorInvoiceRefundAmount: allowOnlyNumbers(val),
                        vendorInvoiceRefundInr: requiresRoe(
                          prev.vendorInvoiceRefundCurrency,
                          businessCurrency,
                        )
                          ? computeInr(
                              allowOnlyNumbers(val),
                              prev.vendorInvoiceRefundRoe,
                            )
                          : prev.vendorInvoiceRefundInr,
                      }))
                    }
                    roe={form.vendorInvoiceRefundRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        vendorInvoiceRefundRoe: roe,
                        vendorInvoiceRefundInr: computeInr(
                          prev.vendorInvoiceRefundAmount,
                          roe,
                        ),
                      }));
                    }}
                    inr={form.vendorInvoiceRefundInr}
                    notes={form.vendorInvoiceRefundNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        vendorInvoiceRefundNotes: val,
                      }))
                    }
                    showNotes={advNotesVisible.vendorInvoiceRefund}
                    onToggleNotes={() =>
                      setAdvNotesVisible((p) => ({
                        ...p,
                        vendorInvoiceRefund: !p.vendorInvoiceRefund,
                      }))
                    }
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={smallInputBase}
                    useWhiteDropdown={false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Supplier Incentive Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.vendorIncentiveCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => {
                        const next: CancellationModalFormState = {
                          ...prev,
                          vendorIncentiveCurrency: val,
                        };
                        if (requiresRoe(val, businessCurrency)) {
                          next.vendorIncentiveInr = computeInr(
                            String(prev.vendorIncentiveReceived ?? ""),
                            String(prev.vendorIncentiveRoe ?? ""),
                          );
                        } else {
                          next.vendorIncentiveRoe = "";
                          next.vendorIncentiveInr = "";
                        }
                        return next;
                      })
                    }
                    amount={form.vendorIncentiveReceived}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        vendorIncentiveReceived: amount,
                        vendorIncentiveInr: requiresRoe(
                          prev.vendorIncentiveCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, prev.vendorIncentiveRoe)
                          : "",
                      }));
                    }}
                    roe={form.vendorIncentiveRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        vendorIncentiveRoe: roe,
                        vendorIncentiveInr: computeInr(
                          prev.vendorIncentiveReceived,
                          roe,
                        ),
                      }));
                    }}
                    inr={form.vendorIncentiveInr}
                    notes={form.vendorIncentiveNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        vendorIncentiveNotes: val,
                      }))
                    }
                    showNotes={advNotesVisible.vendorIncentive}
                    onToggleNotes={() =>
                      setAdvNotesVisible((p) => ({
                        ...p,
                        vendorIncentive: !p.vendorIncentive,
                      }))
                    }
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Chargeback
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.chargebackCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        chargebackCurrency: val,
                        chargebackRoe: requiresRoe(val, businessCurrency)
                          ? prev.chargebackRoe
                          : "",
                        chargebackInr: requiresRoe(val, businessCurrency)
                          ? prev.chargebackInr
                          : "",
                      }))
                    }
                    amount={form.chargebackAmount}
                    onAmountChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        chargebackAmount: allowOnlyNumbers(val),
                        chargebackInr: requiresRoe(
                          prev.chargebackCurrency,
                          businessCurrency,
                        )
                          ? computeInr(
                              allowOnlyNumbers(val),
                              prev.chargebackRoe,
                            )
                          : prev.chargebackInr,
                      }))
                    }
                    roe={form.chargebackRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        chargebackRoe: roe,
                        chargebackInr: computeInr(prev.chargebackAmount, roe),
                      }));
                    }}
                    inr={form.chargebackInr}
                    notes={form.chargebackNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        chargebackNotes: val,
                      }))
                    }
                    showNotes={advNotesVisible.chargeback}
                    onToggleNotes={() =>
                      setAdvNotesVisible((p) => ({
                        ...p,
                        chargeback: !p.chargeback,
                      }))
                    }
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={smallInputBase}
                    useWhiteDropdown={false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Commission Payout
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.commissionCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => {
                        const next: CancellationModalFormState = {
                          ...prev,
                          commissionCurrency: val,
                        };
                        if (requiresRoe(val as Currency, businessCurrency)) {
                          next.commissionInr = computeInr(
                            String(prev.commissionPaid ?? ""),
                            String(prev.commissionRoe ?? ""),
                          );
                        } else {
                          next.commissionRoe = "";
                          next.commissionInr = "";
                        }
                        return next;
                      })
                    }
                    amount={form.commissionPaid}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        commissionPaid: amount,
                        commissionInr: requiresRoe(
                          prev.commissionCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, prev.commissionRoe)
                          : "",
                      }));
                    }}
                    roe={form.commissionRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        commissionRoe: roe,
                        commissionInr: computeInr(prev.commissionPaid, roe),
                      }));
                    }}
                    inr={form.commissionInr}
                    businessCurrency={businessCurrency}
                    notes={form.commissionNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        commissionNotes: val,
                      }))
                    }
                    showNotes={advNotesVisible.commissionPaid}
                    onToggleNotes={() =>
                      setAdvNotesVisible((p) => ({
                        ...p,
                        commissionPaid: !p.commissionPaid,
                      }))
                    }
                    useWhiteDropdown={true}
                    inputClassName={inputBase}
                    requiresRoe={requiresRoe}
                  />
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <MultiCurrencyInput
                    currency={form.commissionRefundCurrency}
                    onCurrencyChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        commissionRefundCurrency: val,
                        commissionRefundRoe: requiresRoe(
                          val as Currency,
                          businessCurrency,
                        )
                          ? prev.commissionRefundRoe
                          : "",
                        commissionRefundInr: requiresRoe(
                          val as Currency,
                          businessCurrency,
                        )
                          ? prev.commissionRefundInr
                          : "",
                      }))
                    }
                    amount={form.commissionRefundAmount}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        commissionRefundAmount: amount,
                        commissionRefundInr: requiresRoe(
                          prev.commissionRefundCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, prev.commissionRefundRoe)
                          : prev.commissionRefundInr,
                      }));
                    }}
                    roe={form.commissionRefundRoe}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      setForm((prev) => ({
                        ...prev,
                        commissionRefundRoe: roe,
                        commissionRefundInr: computeInr(
                          prev.commissionRefundAmount,
                          roe,
                        ),
                      }));
                    }}
                    inr={form.commissionRefundInr}
                    businessCurrency={businessCurrency}
                    notes={form.commissionRefundNotes}
                    onNotesChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        commissionRefundNotes: val,
                      }))
                    }
                    showNotes={advNotesVisible.commissionRefund}
                    onToggleNotes={() =>
                      setAdvNotesVisible((p) => ({
                        ...p,
                        commissionRefund: !p.commissionRefund,
                      }))
                    }
                    useWhiteDropdown={false}
                    inputClassName={smallInputBase}
                    requiresRoe={requiresRoe}
                  />
                </div>
              </div>
            </>
          )}

          {/* SELLING PRICE */}
          <div className="grid grid-cols-[280px_1fr]">
            <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
              Selling Price
            </div>
            <div className="p-4 border-b border-gray-200">
              <MultiCurrencyInput
                currency={form.sellingCurrency}
                onCurrencyChange={(val) =>
                  setForm((prev) => {
                    const next: CancellationModalFormState = {
                      ...prev,
                      sellingCurrency: val,
                    };
                    if (requiresRoe(val as Currency, businessCurrency)) {
                      next.sellingInr = computeInr(
                        String(prev.sellingprice ?? ""),
                        String(prev.sellingRoe ?? ""),
                      );
                    } else {
                      next.sellingRoe = "";
                      next.sellingInr = "";
                    }
                    return next;
                  })
                }
                amount={form.sellingprice}
                onAmountChange={(val) => {
                  const amount = allowOnlyNumbers(val);
                  setForm((prev) => ({
                    ...prev,
                    sellingprice: amount,
                    sellingInr: requiresRoe(
                      prev.sellingCurrency,
                      businessCurrency,
                    )
                      ? computeInr(amount, prev.sellingRoe)
                      : "",
                  }));
                }}
                roe={form.sellingRoe}
                onRoeChange={(val) => {
                  const roe = allowOnlyNumbers(val);
                  setForm((prev) => ({
                    ...prev,
                    sellingRoe: roe,
                    sellingInr: computeInr(prev.sellingprice, roe),
                  }));
                }}
                inr={form.sellingInr}
                businessCurrency={businessCurrency}
                notes={form.sellingNotes}
                onNotesChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    sellingNotes: val,
                  }))
                }
                showNotes={showSellingNotes}
                onToggleNotes={() => setShowSellingNotes((s) => !s)}
                useWhiteDropdown={true}
                inputClassName={inputBase}
                requiresRoe={requiresRoe}
              />
            </div>
          </div>

          {/* SELLING REFUND RECEIVED */}
          <div className="grid grid-cols-[280px_1fr]">
            <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141]">
              Refund Received
            </div>
            <div className="p-4">
              <MultiCurrencyInput
                currency={form.sellingRefundCurrency}
                onCurrencyChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    sellingRefundCurrency: val,
                    sellingRefundRoe: requiresRoe(
                      val as Currency,
                      businessCurrency,
                    )
                      ? prev.sellingRefundRoe
                      : "",
                    sellingRefundInr: requiresRoe(
                      val as Currency,
                      businessCurrency,
                    )
                      ? prev.sellingRefundInr
                      : "",
                  }))
                }
                amount={form.sellingRefundAmount}
                onAmountChange={(val) => {
                  const amount = allowOnlyNumbers(val);
                  setForm((prev) => ({
                    ...prev,
                    sellingRefundAmount: amount,
                    sellingRefundInr: requiresRoe(
                      prev.sellingRefundCurrency,
                      businessCurrency,
                    )
                      ? computeInr(amount, prev.sellingRefundRoe)
                      : prev.sellingRefundInr,
                  }));
                }}
                roe={form.sellingRefundRoe}
                onRoeChange={(val) => {
                  const roe = allowOnlyNumbers(val);
                  setForm((prev) => ({
                    ...prev,
                    sellingRefundRoe: roe,
                    sellingRefundInr: computeInr(prev.sellingRefundAmount, roe),
                  }));
                }}
                inr={form.sellingRefundInr}
                businessCurrency={businessCurrency}
                notes={form.sellingRefundNotes}
                onNotesChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    sellingRefundNotes: val,
                  }))
                }
                showNotes={showSellingRefundNotes}
                onToggleNotes={() => setShowSellingRefundNotes((s) => !s)}
                useWhiteDropdown={true}
                inputClassName={smallInputBase}
                requiresRoe={requiresRoe}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 space-y-2 px-1">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[13px] font-semibold text-gray-600 mb-1">
              Old Cost Price
            </div>
            <div className="border border-gray-200 w-[116px] font-medium rounded-md px-3 py-2 text-[14px] text-[#818181] bg-[#F9F9F9]">
              ₹ {formatCurrency(oldCostPrice)}
            </div>
          </div>

          <div className="w-px h-10 mt-6 bg-gray-300"></div>

          <div>
            <div className="text-[13px] font-semibold text-gray-600 mb-1">
              Old Selling Price
            </div>
            <div className="border border-gray-200 w-[116px] rounded-md px-3 py-2 text-[14px] text-[#818181] bg-gray-50">
              ₹ {formatCurrency(oldSellingPrice)}
            </div>
          </div>

          <div className="w-px h-10 mt-6 bg-gray-300"></div>

          <div>
            <div className="text-[13px] font-semibold text-[#818181] mb-1">
              Net
            </div>
            <div className="border border-gray-200 w-[116px] rounded-md px-3 py-2 text-[14px] text-[#818181] bg-gray-50">
              ₹ {formatCurrency(oldNet)}
            </div>
          </div>

          <div className="w-2" />

          <div>
            <div className="text-[13px] font-semibold text-[#818181] mb-1">
              &nbsp;
            </div>
            <div className="px-1 py-2 text-[14px] text-gray-500">
              {oldMargin}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <div className="text-[13px] font-semibold text-[#818181] mb-1">
              New Cost Price
            </div>
            <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
              ₹ {formatCurrency(newCostPrice)}
            </div>
          </div>

          <div className="w-px h-10 mt-6 bg-gray-300"></div>

          <div>
            <div className="text-[13px] font-semibold text-[#818181] mb-1">
              New Selling Price
            </div>
            <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
              ₹ {formatCurrency(newSellingPrice)}
            </div>
          </div>

          <div className="w-px h-10 mt-6 bg-gray-300"></div>

          <div>
            <div className="text-[13px] font-semibold text-[#818181] mb-1">
              Net
            </div>
            <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
              ₹ {formatCurrency(newNet)}
            </div>
          </div>

          <div className="w-2" />

          <div>
            <div className="text-[13px] font-semibold text-[#818181] mb-1">
              &nbsp;
            </div>
            <div className="px-1 py-2 text-[0.8rem] text-gray-500">
              {newMargin}
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-5 flex justify-end gap-3 px-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-md border border-[#0D4B37] text-[#0D4B37] bg-white hover:bg-green-50 text-[0.82rem] font-semibold"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 rounded-md bg-[#0D4B37] hover:bg-[#093C2C] text-white text-[0.82rem] font-semibold flex items-center gap-2"
        >
          <FiSave size={16} />
          Save
        </button>
      </div>
    </Modal>
  );
}
