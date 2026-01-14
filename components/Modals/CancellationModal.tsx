"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import SingleCalendar from "../SingleCalendar";
import { FiFileText, FiSave } from "react-icons/fi";

type Currency = "USD" | "INR";

type PricingRow = {
  currency: Currency;
  amount: string;
  roe: string;
  inr: string;
  notes: string;
};

type RefundRow = {
  currency: Currency;
  amount: string;
  notes: string;
};

export type CancellationModalFormState = {
  cancellationDate: string;
  showAdvancedPricing: boolean;

  advancedPricing?: {
    vendorInvoice: PricingRow;
    vendorInvoiceRefund: RefundRow;
    supplierIncentive: PricingRow;
    chargeback: RefundRow;
    commissionPayout: PricingRow;
    commissionRefund: RefundRow;
  };

  cost: {
    currency: Currency;
    amount: string;
    roe: string;
    inr: string;
    notes: string;
    refundCurrency: Currency;
    refundAmount: string;
    refundNotes: string;
  };

  selling: {
    currency: Currency;
    amount: string;
    roe: string;
    inr: string;
    notes: string;
    refundCurrency: Currency;
    refundAmount: string;
    refundNotes: string;
  };

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

  advancedPricing: {
    vendorInvoice: {
      currency: "USD",
      amount: "",
      roe: "",
      inr: "",
      notes: "",
    },
    vendorInvoiceRefund: {
      currency: "INR",
      amount: "",
      notes: "",
    },
    supplierIncentive: {
      currency: "USD",
      amount: "",
      roe: "",
      inr: "",
      notes: "",
    },
    chargeback: {
      currency: "INR",
      amount: "",
      notes: "",
    },
    commissionPayout: {
      currency: "USD",
      amount: "",
      roe: "",
      inr: "",
      notes: "",
    },
    commissionRefund: {
      currency: "INR",
      amount: "",
      notes: "",
    },
  },

  cost: {
    currency: "USD",
    amount: "72",
    roe: "88.05",
    inr: "6,339",
    notes: "Lorem Ipsum",
    refundCurrency: "INR",
    refundAmount: "",
    refundNotes: "",
  },

  selling: {
    currency: "USD",
    amount: "72",
    roe: "88.05",
    inr: "6,339",
    notes: "Lorem Ipsum",
    refundCurrency: "INR",
    refundAmount: "",
    refundNotes: "",
  },

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
  "h-[34px] px-2 text-[0.78rem] text-gray-700 bg-gray-50 border-r border-gray-200 outline-none";

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
  const defaultAdvancedPricing: NonNullable<
    CancellationModalFormState["advancedPricing"]
  > = defaultState.advancedPricing ?? {
    vendorInvoice: {
      currency: "USD",
      amount: "",
      roe: "",
      inr: "",
      notes: "",
    },
    vendorInvoiceRefund: { currency: "INR", amount: "", notes: "" },
    supplierIncentive: {
      currency: "USD",
      amount: "",
      roe: "",
      inr: "",
      notes: "",
    },
    chargeback: { currency: "INR", amount: "", notes: "" },
    commissionPayout: {
      currency: "USD",
      amount: "",
      roe: "",
      inr: "",
      notes: "",
    },
    commissionRefund: { currency: "INR", amount: "", notes: "" },
  };

  const mergedInitial = useMemo(() => {
    if (!initialValues) return defaultState;

    const incomingAp = (initialValues as any)?.advancedPricing;
    const normalizedAdvancedPricing = (() => {
      if (!incomingAp) return defaultAdvancedPricing;

      // New shape
      if (incomingAp.vendorInvoice) {
        return {
          ...defaultAdvancedPricing,
          ...incomingAp,
          vendorInvoice: {
            ...defaultAdvancedPricing.vendorInvoice,
            ...(incomingAp.vendorInvoice ?? {}),
          },
          vendorInvoiceRefund: {
            ...defaultAdvancedPricing.vendorInvoiceRefund,
            ...(incomingAp.vendorInvoiceRefund ?? {}),
          },
          supplierIncentive: {
            ...defaultAdvancedPricing.supplierIncentive,
            ...(incomingAp.supplierIncentive ?? {}),
          },
          chargeback: {
            ...defaultAdvancedPricing.chargeback,
            ...(incomingAp.chargeback ?? {}),
          },
          commissionPayout: {
            ...defaultAdvancedPricing.commissionPayout,
            ...(incomingAp.commissionPayout ?? {}),
          },
          commissionRefund: {
            ...defaultAdvancedPricing.commissionRefund,
            ...(incomingAp.commissionRefund ?? {}),
          },
        };
      }

      // Back-compat: old shape (strings)
      if (
        typeof incomingAp === "object" &&
        ("vendorBasePrice" in incomingAp ||
          "vendorIncentiveReceived" in incomingAp ||
          "commissionPaid" in incomingAp)
      ) {
        return {
          ...defaultAdvancedPricing,
          vendorInvoice: {
            ...defaultAdvancedPricing.vendorInvoice,
            amount: String(incomingAp.vendorBasePrice ?? ""),
            notes: String(incomingAp.vendorBasePriceNotes ?? ""),
          },
          supplierIncentive: {
            ...defaultAdvancedPricing.supplierIncentive,
            amount: String(incomingAp.vendorIncentiveReceived ?? ""),
            notes: String(incomingAp.vendorIncentiveReceivedNotes ?? ""),
          },
          commissionPayout: {
            ...defaultAdvancedPricing.commissionPayout,
            amount: String(incomingAp.commissionPaid ?? ""),
            notes: String(incomingAp.commissionPaidNotes ?? ""),
          },
        };
      }

      return defaultAdvancedPricing;
    })();

    return {
      ...defaultState,
      ...initialValues,
      advancedPricing: {
        ...normalizedAdvancedPricing,
      },
      cost: { ...defaultState.cost, ...(initialValues.cost ?? {}) },
      selling: { ...defaultState.selling, ...(initialValues.selling ?? {}) },
      summary: { ...defaultState.summary, ...(initialValues.summary ?? {}) },
    };
  }, [defaultAdvancedPricing, initialValues]);

  const [form, setForm] = useState<CancellationModalFormState>(mergedInitial);
  const [showCenterRefundNotes, setShowCenterRefundNotes] = useState(false);
  const [advNotesVisible, setAdvNotesVisible] = useState({
    vendorInvoice: false,
    vendorInvoiceRefund: false,
    supplierIncentive: false,
    chargeback: false,
    commissionPayout: false,
    commissionRefund: false,
  });
  const [showCostNotes, setShowCostNotes] = useState(true);
  const [showSellingNotes, setShowSellingNotes] = useState(true);
  const [showSellingRefundNotes, setShowSellingRefundNotes] = useState(false);

  const effectiveShowAdvancedPricing =
    typeof linkedShowAdvancedPricing === "boolean"
      ? linkedShowAdvancedPricing
      : Boolean(form.showAdvancedPricing);

  useEffect(() => {
    if (!isOpen) {
      setForm(mergedInitial);
      setShowCenterRefundNotes(false);
      setShowCostNotes(true);
      setShowSellingNotes(true);
      setShowSellingRefundNotes(false);
      setAdvNotesVisible({
        vendorInvoice: false,
        vendorInvoiceRefund: false,
        supplierIncentive: false,
        chargeback: false,
        commissionPayout: false,
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
    onSave?.(form);
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
      customWidth="max-w-6xl w-[1050px]"
      zIndexClass="z-[1000]"
      headerLeft={
        <div className="flex items-center gap-2 text-[0.95rem]">
          <div className="font-semibold text-gray-800">Amount</div>
          <div className="text-gray-300">|</div>
          <div className="font-semibold text-gray-800">{recordLabel}</div>
          <div className="text-gray-300">|</div>
          <div className="text-gray-800">{statusLabel}</div>
        </div>
      }
    >
      <div className="space-y-2 ">
        <div className="flex items-end justify-between">
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

        <div className="border border-gray-200 rounded-md overflow-hidden">
          {!effectiveShowAdvancedPricing ? (
            <div>
              {/* COST PRICE */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Cost Price
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[220px_160px_170px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={form.cost.currency}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: {
                              ...prev.cost,
                              currency: e.target.value as Currency,
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                      </select>
                      <input
                        value={form.cost.amount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: { ...prev.cost, amount: e.target.value },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className={groupBase}>
                      <span className={addonLabel}>ROE</span>
                      <input
                        value={form.cost.roe}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: { ...prev.cost, roe: e.target.value },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                      <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                        INR
                      </span>
                      <input
                        value={form.cost.inr}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: { ...prev.cost, inr: e.target.value },
                          }))
                        }
                        className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7] outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add notes"
                      onClick={() => setShowCostNotes((s) => !s)}
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {showCostNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={form.cost.notes}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: { ...prev.cost, notes: e.target.value },
                          }))
                        }
                        className={inputBase}
                        placeholder=""
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* COST REFUND RECEIVED */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[380px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={form.cost.refundCurrency}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: {
                              ...prev.cost,
                              refundCurrency: e.target.value as Currency,
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        value={form.cost.refundAmount}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: {
                              ...prev.cost,
                              refundAmount: e.target.value,
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder="Enter Amount"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add refund notes"
                      onClick={() => setShowCenterRefundNotes((s) => !s)}
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {showCenterRefundNotes && (
                    <div className="mt-4">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={form.cost.refundNotes}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            cost: {
                              ...prev.cost,
                              refundNotes: e.target.value,
                            },
                          }))
                        }
                        className={smallInputBase}
                        placeholder="Enter your notes here..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ADVANCED PRICING UI (separate boxes), placed above Selling Price */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Vendor Invoice (Base)
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[220px_160px_170px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={
                          form.advancedPricing?.vendorInvoice.currency ?? "USD"
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoice: {
                                ...(prev.advancedPricing?.vendorInvoice ??
                                  defaultAdvancedPricing.vendorInvoice),
                                currency: e.target.value as Currency,
                              },
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                      </select>
                      <input
                        value={form.advancedPricing?.vendorInvoice.amount ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoice: {
                                ...(prev.advancedPricing?.vendorInvoice ??
                                  defaultAdvancedPricing.vendorInvoice),
                                amount: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className={groupBase}>
                      <span className={addonLabel}>ROE</span>
                      <input
                        value={form.advancedPricing?.vendorInvoice.roe ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoice: {
                                ...(prev.advancedPricing?.vendorInvoice ??
                                  defaultAdvancedPricing.vendorInvoice),
                                roe: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                      <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                        INR
                      </span>
                      <input
                        value={form.advancedPricing?.vendorInvoice.inr ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoice: {
                                ...(prev.advancedPricing?.vendorInvoice ??
                                  defaultAdvancedPricing.vendorInvoice),
                                inr: e.target.value,
                              },
                            },
                          }))
                        }
                        className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7] outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add notes"
                      onClick={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          vendorInvoice: !p.vendorInvoice,
                        }))
                      }
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {advNotesVisible.vendorInvoice && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={form.advancedPricing?.vendorInvoice.notes ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoice: {
                                ...(prev.advancedPricing?.vendorInvoice ??
                                  defaultAdvancedPricing.vendorInvoice),
                                notes: e.target.value,
                              },
                            },
                          }))
                        }
                        className={inputBase}
                        placeholder="Enter your notes here..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[380px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={
                          form.advancedPricing?.vendorInvoiceRefund.currency ??
                          "INR"
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoiceRefund: {
                                ...(prev.advancedPricing?.vendorInvoiceRefund ??
                                  defaultAdvancedPricing.vendorInvoiceRefund),
                                currency: e.target.value as Currency,
                              },
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        value={
                          form.advancedPricing?.vendorInvoiceRefund.amount ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoiceRefund: {
                                ...(prev.advancedPricing?.vendorInvoiceRefund ??
                                  defaultAdvancedPricing.vendorInvoiceRefund),
                                amount: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder="Enter Amount"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add notes"
                      onClick={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          vendorInvoiceRefund: !p.vendorInvoiceRefund,
                        }))
                      }
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {advNotesVisible.vendorInvoiceRefund && (
                    <div className="mt-4">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={
                          form.advancedPricing?.vendorInvoiceRefund.notes ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              vendorInvoiceRefund: {
                                ...(prev.advancedPricing?.vendorInvoiceRefund ??
                                  defaultAdvancedPricing.vendorInvoiceRefund),
                                notes: e.target.value,
                              },
                            },
                          }))
                        }
                        className={smallInputBase}
                        placeholder="Enter your notes here..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Supplier Incentive Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[220px_160px_170px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={
                          form.advancedPricing?.supplierIncentive.currency ??
                          "USD"
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              supplierIncentive: {
                                ...(prev.advancedPricing?.supplierIncentive ??
                                  defaultAdvancedPricing.supplierIncentive),
                                currency: e.target.value as Currency,
                              },
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                      </select>
                      <input
                        value={
                          form.advancedPricing?.supplierIncentive.amount ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              supplierIncentive: {
                                ...(prev.advancedPricing?.supplierIncentive ??
                                  defaultAdvancedPricing.supplierIncentive),
                                amount: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className={groupBase}>
                      <span className={addonLabel}>ROE</span>
                      <input
                        value={
                          form.advancedPricing?.supplierIncentive.roe ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              supplierIncentive: {
                                ...(prev.advancedPricing?.supplierIncentive ??
                                  defaultAdvancedPricing.supplierIncentive),
                                roe: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                      <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                        INR
                      </span>
                      <input
                        value={
                          form.advancedPricing?.supplierIncentive.inr ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              supplierIncentive: {
                                ...(prev.advancedPricing?.supplierIncentive ??
                                  defaultAdvancedPricing.supplierIncentive),
                                inr: e.target.value,
                              },
                            },
                          }))
                        }
                        className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7] outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add notes"
                      onClick={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          supplierIncentive: !p.supplierIncentive,
                        }))
                      }
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {advNotesVisible.supplierIncentive && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={
                          form.advancedPricing?.supplierIncentive.notes ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              supplierIncentive: {
                                ...(prev.advancedPricing?.supplierIncentive ??
                                  defaultAdvancedPricing.supplierIncentive),
                                notes: e.target.value,
                              },
                            },
                          }))
                        }
                        className={inputBase}
                        placeholder="Enter your notes here..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Chargeback
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[380px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={
                          form.advancedPricing?.chargeback.currency ?? "INR"
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              chargeback: {
                                ...(prev.advancedPricing?.chargeback ??
                                  defaultAdvancedPricing.chargeback),
                                currency: e.target.value as Currency,
                              },
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        value={form.advancedPricing?.chargeback.amount ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              chargeback: {
                                ...(prev.advancedPricing?.chargeback ??
                                  defaultAdvancedPricing.chargeback),
                                amount: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder="Enter Amount"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add notes"
                      onClick={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          chargeback: !p.chargeback,
                        }))
                      }
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {advNotesVisible.chargeback && (
                    <div className="mt-4">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={form.advancedPricing?.chargeback.notes ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              chargeback: {
                                ...(prev.advancedPricing?.chargeback ??
                                  defaultAdvancedPricing.chargeback),
                                notes: e.target.value,
                              },
                            },
                          }))
                        }
                        className={smallInputBase}
                        placeholder="Enter your notes here..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Commission Payout
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[220px_160px_170px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={
                          form.advancedPricing?.commissionPayout.currency ??
                          "USD"
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionPayout: {
                                ...(prev.advancedPricing?.commissionPayout ??
                                  defaultAdvancedPricing.commissionPayout),
                                currency: e.target.value as Currency,
                              },
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                      </select>
                      <input
                        value={
                          form.advancedPricing?.commissionPayout.amount ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionPayout: {
                                ...(prev.advancedPricing?.commissionPayout ??
                                  defaultAdvancedPricing.commissionPayout),
                                amount: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className={groupBase}>
                      <span className={addonLabel}>ROE</span>
                      <input
                        value={form.advancedPricing?.commissionPayout.roe ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionPayout: {
                                ...(prev.advancedPricing?.commissionPayout ??
                                  defaultAdvancedPricing.commissionPayout),
                                roe: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder=""
                      />
                    </div>

                    <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                      <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                        INR
                      </span>
                      <input
                        value={form.advancedPricing?.commissionPayout.inr ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionPayout: {
                                ...(prev.advancedPricing?.commissionPayout ??
                                  defaultAdvancedPricing.commissionPayout),
                                inr: e.target.value,
                              },
                            },
                          }))
                        }
                        className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7] outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add notes"
                      onClick={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          commissionPayout: !p.commissionPayout,
                        }))
                      }
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {advNotesVisible.commissionPayout && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={
                          form.advancedPricing?.commissionPayout.notes ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionPayout: {
                                ...(prev.advancedPricing?.commissionPayout ??
                                  defaultAdvancedPricing.commissionPayout),
                                notes: e.target.value,
                              },
                            },
                          }))
                        }
                        className={inputBase}
                        placeholder="Enter your notes here..."
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div className="grid grid-cols-[380px_44px] gap-3 items-center">
                    <div className={groupBase}>
                      <select
                        value={
                          form.advancedPricing?.commissionRefund.currency ??
                          "INR"
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionRefund: {
                                ...(prev.advancedPricing?.commissionRefund ??
                                  defaultAdvancedPricing.commissionRefund),
                                currency: e.target.value as Currency,
                              },
                            },
                          }))
                        }
                        className={groupSelect}
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        value={
                          form.advancedPricing?.commissionRefund.amount ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionRefund: {
                                ...(prev.advancedPricing?.commissionRefund ??
                                  defaultAdvancedPricing.commissionRefund),
                                amount: e.target.value,
                              },
                            },
                          }))
                        }
                        className={groupInput}
                        placeholder="Enter Amount"
                      />
                    </div>

                    <button
                      type="button"
                      className={noteBtn}
                      aria-label="Add notes"
                      onClick={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          commissionRefund: !p.commissionRefund,
                        }))
                      }
                    >
                      <FiFileText size={16} className="text-[#F59E0B]" />
                    </button>
                  </div>

                  {advNotesVisible.commissionRefund && (
                    <div className="mt-4">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        value={
                          form.advancedPricing?.commissionRefund.notes ?? ""
                        }
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            advancedPricing: {
                              ...(prev.advancedPricing ??
                                defaultAdvancedPricing),
                              commissionRefund: {
                                ...(prev.advancedPricing?.commissionRefund ??
                                  defaultAdvancedPricing.commissionRefund),
                                notes: e.target.value,
                              },
                            },
                          }))
                        }
                        className={smallInputBase}
                        placeholder="Enter your notes here..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* SELLING PRICE */}
          <div className="grid grid-cols-[280px_1fr]">
            <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
              Selling Price
            </div>
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-[220px_160px_170px_44px] gap-3 items-center">
                <div className={groupBase}>
                  <select
                    value={form.selling.currency}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: {
                          ...prev.selling,
                          currency: e.target.value as Currency,
                        },
                      }))
                    }
                    className={groupSelect}
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                  </select>
                  <input
                    value={form.selling.amount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: { ...prev.selling, amount: e.target.value },
                      }))
                    }
                    className={groupInput}
                    placeholder=""
                  />
                </div>

                <div className={groupBase}>
                  <span className={addonLabel}>ROE</span>
                  <input
                    value={form.selling.roe}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: { ...prev.selling, roe: e.target.value },
                      }))
                    }
                    className={groupInput}
                    placeholder=""
                  />
                </div>

                <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                  <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                    INR
                  </span>
                  <input
                    value={form.selling.inr}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: { ...prev.selling, inr: e.target.value },
                      }))
                    }
                    className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7] outline-none"
                  />
                </div>

                <button
                  type="button"
                  className={noteBtn}
                  aria-label="Add notes"
                  onClick={() => setShowSellingNotes((s) => !s)}
                >
                  <FiFileText size={16} className="text-[#F59E0B]" />
                </button>
              </div>

              {showSellingNotes && (
                <div className="mt-3">
                  <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    value={form.selling.notes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: { ...prev.selling, notes: e.target.value },
                      }))
                    }
                    className={inputBase}
                    placeholder=""
                  />
                </div>
              )}
            </div>
          </div>

          {/* SELLING REFUND RECEIVED */}
          <div className="grid grid-cols-[280px_1fr]">
            <div className="bg-gray-50 border-r border-gray-200 flex items-center justify-center text-[0.82rem] font-semibold text-gray-700">
              Refund Received
            </div>
            <div className="p-4">
              <div className="grid grid-cols-[380px_44px] gap-3 items-center">
                <div className={groupBase}>
                  <select
                    value={form.selling.refundCurrency}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: {
                          ...prev.selling,
                          refundCurrency: e.target.value as Currency,
                        },
                      }))
                    }
                    className={groupSelect}
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    value={form.selling.refundAmount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: {
                          ...prev.selling,
                          refundAmount: e.target.value,
                        },
                      }))
                    }
                    className={groupInput}
                    placeholder="Enter Amount"
                  />
                </div>

                <button
                  type="button"
                  className={noteBtn}
                  aria-label="Add notes"
                  onClick={() => setShowSellingRefundNotes((s) => !s)}
                >
                  <FiFileText size={16} className="text-[#F59E0B]" />
                </button>
              </div>

              {showSellingRefundNotes && (
                <div className="mt-4">
                  <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    value={form.selling.refundNotes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        selling: {
                          ...prev.selling,
                          refundNotes: e.target.value,
                        },
                      }))
                    }
                    className={smallInputBase}
                    placeholder="Enter your notes here..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-4 gap-6 px-1">
        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            Old Cost Price
          </div>
          <div className="border border-gray-200 rounded-md px-3 py-2 text-[0.8rem] text-gray-600 bg-gray-50">
            ₹ {form.summary.oldCost}
          </div>
        </div>
        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            Old Selling Price
          </div>
          <div className="border border-gray-200 rounded-md px-3 py-2 text-[0.8rem] text-gray-600 bg-gray-50">
            ₹ {form.summary.oldSelling}
          </div>
        </div>
        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            Net
          </div>
          <div className="border border-gray-200 rounded-md px-3 py-2 text-[0.8rem] text-gray-600 bg-gray-50">
            ₹ {form.summary.oldNet}
          </div>
        </div>
        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            &nbsp;
          </div>
          <div className="px-1 py-2 text-[0.8rem] text-gray-500">
            {form.summary.oldMargin}
          </div>
        </div>

        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            New Cost Price
          </div>
          <div className="border border-blue-100 rounded-md px-3 py-2 text-[0.8rem] text-blue-600 bg-blue-50">
            ₹ {form.summary.newCost}
          </div>
        </div>
        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            New Selling Price
          </div>
          <div className="border border-blue-100 rounded-md px-3 py-2 text-[0.8rem] text-blue-600 bg-blue-50">
            ₹ {form.summary.newSelling}
          </div>
        </div>
        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            Net
          </div>
          <div className="border border-blue-100 rounded-md px-3 py-2 text-[0.8rem] text-blue-600 bg-blue-50">
            ₹ {form.summary.newNet}
          </div>
        </div>
        <div>
          <div className="text-[0.72rem] font-semibold text-gray-600 mb-1">
            &nbsp;
          </div>
          <div className="px-1 py-2 text-[0.8rem] text-gray-500">
            {form.summary.newMargin}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="mt-5 flex justify-end gap-3 px-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md border border-[#0D4B37] text-[#0D4B37] bg-white hover:bg-green-50 text-[0.82rem] font-semibold"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-[#0D4B37] hover:bg-[#093C2C] text-white text-[0.82rem] font-semibold flex items-center gap-2"
        >
          <FiSave size={16} />
          Save
        </button>
      </div>
    </Modal>
  );
}
