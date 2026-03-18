"use client";

import React, { useId, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import { getStoredCurrencySymbol, formatIndianNumber } from "@/utils/helper";
import CancellationSection from "@/components/CancellationSection";
import RescheduledPriceSection from "@/components/RescheduledPriceSection";
import { toRescheduled, fromRescheduled } from "@/utils/amountMapping";

export interface SellingPriceEntry {
  sellingprice?: string | undefined;
  sellingCurrency?: "INR" | "USD" | undefined;
  sellingRoe?: string | undefined;
  sellingInr?: string | undefined;
  sellingNotes?: string | undefined;
  sellingRefundAmount?: string | undefined;
  sellingRefundCurrency?: "INR" | "USD" | undefined;
  sellingRefundRoe?: string | undefined;
  sellingRefundInr?: string | undefined;
  sellingRefundNotes?: string | undefined;
}

export type AmountSectionValue = {
  costprice?: string;
  costCurrency?: "INR" | "USD";
  costRoe?: string;
  costInr?: string;
  costNotes?: string;

  sellingprice?: string;
  sellingCurrency?: "INR" | "USD";
  sellingRoe?: string;
  sellingInr?: string;
  sellingNotes?: string;

  vendorBasePrice?: string;
  vendorBaseCurrency?: "INR" | "USD";
  vendorBaseRoe?: string;
  vendorBaseInr?: string;
  vendorBaseNotes?: string;

  vendorIncentiveReceived?: string;
  vendorIncentiveCurrency?: "INR" | "USD";
  vendorIncentiveRoe?: string;
  vendorIncentiveInr?: string;
  vendorIncentiveNotes?: string;

  commissionPaid?: string;
  commissionCurrency?: "INR" | "USD";
  commissionRoe?: string;
  commissionInr?: string;
  commissionNotes?: string;

  // Cancellation-specific fields
  cancellationDate?: string;

  costRefundAmount?: string;
  costRefundCurrency?: "INR" | "USD";
  costRefundRoe?: string;
  costRefundInr?: string;
  costRefundNotes?: string;

  sellingRefundAmount?: string;
  sellingRefundCurrency?: "INR" | "USD";
  sellingRefundRoe?: string;
  sellingRefundInr?: string;
  sellingRefundNotes?: string;

  vendorInvoiceRefundAmount?: string;
  vendorInvoiceRefundCurrency?: "INR" | "USD";
  vendorInvoiceRefundRoe?: string;
  vendorInvoiceRefundInr?: string;
  vendorInvoiceRefundNotes?: string;

  chargebackAmount?: string;
  chargebackCurrency?: "INR" | "USD";
  chargebackRoe?: string;
  chargebackInr?: string;
  chargebackNotes?: string;

  commissionRefundAmount?: string;
  commissionRefundCurrency?: "INR" | "USD";
  commissionRefundRoe?: string;
  commissionRefundInr?: string;
  commissionRefundNotes?: string;

  sellingPrices?: SellingPriceEntry[];
};

interface AmountSectionProps {
  value: AmountSectionValue;
  onChange: (next: AmountSectionValue) => void;

  bookingStatus?: string;
  cancellationForm?: any;

  showAdvancedPricing: boolean;
  onToggleAdvancedPricing: (v: boolean) => void;

  isReadOnly?: boolean;
  isSubmitting?: boolean;

  editableCancelled?: boolean;
  customerCount?: number;
  customerLabels?: string[];
}

const FormulaTooltip = ({ text }: { text: string }) => (
  <span
    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#D0C3E0] text-[10px] text-[#7135AD] cursor-help"
    title={text}
    aria-label={text}
  >
    i
  </span>
);

// Allow only digits and a single decimal point for price fields (same as Flight form)
const sanitizeNumeric = (val: string) => {
  const v = String(val || "").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length <= 1) return parts[0];
  return parts[0] + "." + parts.slice(1).join("");
};

const computeInr = (amountStr?: string | number, roeStr?: string | number) => {
  const a = Number(String(amountStr ?? "").replace(/,/g, ""));
  const r = Number(String(roeStr ?? "").replace(/,/g, ""));
  if (!isFinite(a) || !isFinite(r) || a === 0 || r === 0) return "";
  const product = a * r;
  const hasFraction = Math.abs(product - Math.round(product)) > 1e-9;
  return product.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

// moved formatIndianNumber to utils/helper.ts

const AmountSection: React.FC<AmountSectionProps> = ({
  value,
  onChange,
  bookingStatus,
  cancellationForm,
  showAdvancedPricing,
  onToggleAdvancedPricing,
  isReadOnly,
  isSubmitting,
  editableCancelled = false,
  customerCount = 1,
  customerLabels = [],
}) => {
  const checkboxId = useId();

  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user);

  const v = value ?? {};
  const update = (patch: Partial<AmountSectionValue>) =>
    onChange({ ...v, ...patch });

  const sellingPrices: SellingPriceEntry[] = (() => {
    const base: SellingPriceEntry[] = v.sellingPrices?.length
      ? [...v.sellingPrices]
      : [
          {
            sellingprice: v.sellingprice,
            sellingCurrency: v.sellingCurrency,
            sellingRoe: v.sellingRoe,
            sellingInr: v.sellingInr,
            sellingNotes: v.sellingNotes,
          } as SellingPriceEntry,
        ];
    while (base.length < customerCount) base.push({});
    return base.slice(0, customerCount);
  })();

  const updateSellingPrice = (
    index: number,
    patch: Partial<SellingPriceEntry>,
  ) => {
    const prices = sellingPrices.map((sp, i) =>
      i === index ? { ...sp, ...patch } : { ...sp },
    );
    const first = prices[0] || {};
    const flat: Record<string, any> = { ...v, sellingPrices: prices };
    if (first.sellingprice !== undefined)
      flat.sellingprice = first.sellingprice;
    if (first.sellingCurrency !== undefined)
      flat.sellingCurrency = first.sellingCurrency;
    if (first.sellingRoe !== undefined) flat.sellingRoe = first.sellingRoe;
    if (first.sellingInr !== undefined) flat.sellingInr = first.sellingInr;
    if (first.sellingNotes !== undefined)
      flat.sellingNotes = first.sellingNotes;
    onChange(flat as AmountSectionValue);
  };

  const totalSellingPrice = sellingPrices.reduce(
    (sum, sp) => sum + (Number(sp.sellingprice) || 0),
    0,
  );

  const [showCostNotesFlag, setShowCostNotesFlag] = useState<boolean>(false);
  const [sellingNotesFlags, setSellingNotesFlags] = useState<
    Record<number, boolean>
  >({});
  const [showVendorBaseNotesFlag, setShowVendorBaseNotesFlag] =
    useState<boolean>(false);
  const [showVendorIncentiveNotesFlag, setShowVendorIncentiveNotesFlag] =
    useState<boolean>(false);
  const [showCommissionNotesFlag, setShowCommissionNotesFlag] =
    useState<boolean>(false);

  const isCancelled = bookingStatus?.toLowerCase() === "cancelled";
  const isRescheduled = bookingStatus?.toLowerCase() === "rescheduled";

  const derivedCostPrice = useMemo(() => {
    // Always compute components in INR. If an amount is provided in USD,
    // prefer the explicit INR field
    const parseNum = (s?: string) =>
      Number(String(s ?? "").replace(/,/g, "")) || 0;

    const base =
      String(v.vendorBaseCurrency) === "USD"
        ? parseNum(v.vendorBaseInr) ||
          parseNum(v.vendorBasePrice) * parseNum(v.vendorBaseRoe)
        : parseNum(v.vendorBasePrice);

    const inc =
      String(v.vendorIncentiveCurrency) === "USD"
        ? parseNum(v.vendorIncentiveInr) ||
          parseNum(v.vendorIncentiveReceived) * parseNum(v.vendorIncentiveRoe)
        : parseNum(v.vendorIncentiveReceived);

    const com =
      String(v.commissionCurrency) === "USD"
        ? parseNum(v.commissionInr) ||
          parseNum(v.commissionPaid) * parseNum(v.commissionRoe)
        : parseNum(v.commissionPaid);

    return base - inc + com;
  }, [
    v.vendorBaseCurrency,
    v.vendorBasePrice,
    v.vendorBaseInr,
    v.vendorIncentiveCurrency,
    v.vendorIncentiveReceived,
    v.vendorIncentiveInr,
    v.commissionCurrency,
    v.commissionPaid,
    v.commissionInr,
  ]);

  const displayCustomerLabel = (index: number) =>
    customerLabels[index] || `Customer ${index + 1}`;

  return (
    <div className="mb-4 border border-[#E2E1E1] rounded-[15px] w-full p-3.5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-medium text-gray-700">Amount</h3>

        {!((isCancelled || isRescheduled) && isReadOnly) && (
          <label
            className={`flex items-center gap-2 ${
              isReadOnly || isSubmitting
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              id={checkboxId}
              className="peer sr-only"
              checked={showAdvancedPricing}
              disabled={isReadOnly || isSubmitting}
              onChange={() => {
                if (isReadOnly || isSubmitting) return;
                onToggleAdvancedPricing(!showAdvancedPricing);
              }}
            />
            <label
              htmlFor={checkboxId}
              className={`w-4 h-4 -mt-1 border border-gray-300 rounded-[4px] flex items-center justify-center transition-transform duration-150 ease-out transform ${
                isReadOnly || isSubmitting
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer"
              } peer-checked:scale-110 peer-checked:shadow-[0_8px_20px_rgba(113,53,173,0.12)] peer-checked:bg-[#7135AD] peer-checked:border-[#7135AD]`}
            >
              {showAdvancedPricing && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="11"
                  viewBox="0 0 12 11"
                  fill="none"
                >
                  <path
                    d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </label>
            <span
              className={`text-[13px] font-[500] ${
                isReadOnly || isSubmitting ? "text-gray-400" : "text-[#414141]"
              }`}
            >
              Show Advanced Pricing
            </span>
          </label>
        )}
      </div>

      <hr className="mb-3 -mt-1 border-t border-[#E2E1E1]" />

      {isCancelled ? (
        <CancellationSection
          value={v}
          onChange={onChange}
          showAdvancedPricing={showAdvancedPricing}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          customerCount={customerCount}
          customerLabels={customerLabels}
        />
      ) : isRescheduled ? (
        <RescheduledPriceSection
          value={toRescheduled(v)}
          onChange={(next) => onChange(fromRescheduled(next, v))}
          showAdvancedPricing={showAdvancedPricing}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          customerCount={customerCount}
          customerLabels={customerLabels}
        />
      ) : (
        <>
          {/* NORMAL EDITABLE VIEW WHEN NOT CANCELLED */}
          {!showAdvancedPricing ? (
            <>
              {/* Cost Price */}
              <div className="mb-3">
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Cost Price
                </label>
                <MultiCurrencyInput
                  currency={(v.costCurrency as "INR" | "USD") || "INR"}
                  onCurrencyChange={(val) => {
                    const next: any = {
                      ...v,
                      costCurrency: val,
                    };
                    if (requiresRoe(val as string, businessCurrency)) {
                      next.costInr = computeInr(
                        String(v.costprice ?? ""),
                        String(v.costRoe ?? ""),
                      );
                    } else {
                      next.costRoe = "";
                      next.costInr = "";
                    }
                    onChange(next);
                  }}
                  amount={v.costprice || ""}
                  onAmountChange={(val) => {
                    const sanitized = sanitizeNumeric(val);
                    const next: any = { ...v, costprice: sanitized };
                    if (requiresRoe(v.costCurrency, businessCurrency)) {
                      next.costInr = computeInr(sanitized, v.costRoe ?? "");
                    } else {
                      next.costInr = "";
                    }
                    onChange(next);
                  }}
                  roe={v.costRoe || ""}
                  onRoeChange={(val) =>
                    update({
                      costRoe: val,
                      costInr: computeInr(String(v.costprice ?? ""), val),
                    })
                  }
                  inr={v.costInr || ""}
                  notes={v.costNotes || ""}
                  onNotesChange={(val) => update({ costNotes: val })}
                  showNotes={showCostNotesFlag}
                  onToggleNotes={() => setShowCostNotesFlag((s) => !s)}
                  businessCurrency={businessCurrency}
                  requiresRoe={requiresRoe}
                  notesInputWidth="60%"
                  amountInputWidth="30%"
                  readOnly={!!isReadOnly || !!isSubmitting}
                />
              </div>

              {/* Selling Price(s) */}
              {sellingPrices.map((sp, i) => (
                <div key={i} className={i > 0 ? "mt-3" : ""}>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  {customerCount > 1
                    ? `Selling Price (${displayCustomerLabel(i)})`
                    : "Selling Price"}
                </label>
                  <MultiCurrencyInput
                    currency={(sp.sellingCurrency as "INR" | "USD") || "INR"}
                    onCurrencyChange={(val) => {
                      const patch: Partial<SellingPriceEntry> = {
                        sellingCurrency: val as "INR" | "USD",
                      };
                      if (requiresRoe(val as string, businessCurrency)) {
                        patch.sellingInr = computeInr(
                          String(sp.sellingprice ?? ""),
                          String(sp.sellingRoe ?? ""),
                        );
                      } else {
                        patch.sellingRoe = "";
                        patch.sellingInr = "";
                      }
                      updateSellingPrice(i, patch);
                    }}
                    amount={sp.sellingprice || ""}
                    onAmountChange={(val) => {
                      const sanitized = sanitizeNumeric(val);
                      const patch: Partial<SellingPriceEntry> = {
                        sellingprice: sanitized,
                      };
                      if (requiresRoe(sp.sellingCurrency, businessCurrency)) {
                        patch.sellingInr = computeInr(
                          sanitized,
                          sp.sellingRoe ?? "",
                        );
                      } else {
                        patch.sellingInr = "";
                      }
                      updateSellingPrice(i, patch);
                    }}
                    roe={sp.sellingRoe || ""}
                    onRoeChange={(val) =>
                      updateSellingPrice(i, {
                        sellingRoe: val,
                        sellingInr: computeInr(
                          String(sp.sellingprice ?? ""),
                          val,
                        ),
                      })
                    }
                    inr={sp.sellingInr || ""}
                    notes={sp.sellingNotes || ""}
                    onNotesChange={(val) =>
                      updateSellingPrice(i, { sellingNotes: val })
                    }
                    showNotes={!!sellingNotesFlags[i]}
                    onToggleNotes={() =>
                      setSellingNotesFlags((prev) => ({
                        ...prev,
                        [i]: !prev[i],
                      }))
                    }
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    notesInputWidth="60%"
                    amountInputWidth="30%"
                    readOnly={!!isReadOnly || !!isSubmitting}
                  />
                </div>
              ))}

              <hr className="mb-2 mt-3 border-t border-[#E2E1E1]" />

              {/* NET */}
              <div className="w-fit rounded-lg p-1 mt-1 bg-white">
                <span className="text-[13px] font-medium text-[#414141] block mb-2">
                  Net
                </span>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-[#7135AD0D] text-[#7135AD] text-[14px] font-[500] rounded-[10px]">
                    {`${getStoredCurrencySymbol()} ${formatIndianNumber(
                      totalSellingPrice - derivedCostPrice,
                    )}`}
                  </span>

                  <span className="text-[13px] text-[#414141] font-[600]">
                    {derivedCostPrice > 0 && totalSellingPrice
                      ? `${(
                          ((totalSellingPrice - derivedCostPrice) /
                            (derivedCostPrice || 1)) *
                          100
                        ).toFixed(2)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Advanced Pricing Component */
            <div className="space-y-3">
              <h4 className="text-[13px] font-[500] text-[#414141] mb-3">
                Vendor Payment Summary
              </h4>

              <div className="border border-[#E2E1E1] mb-4 overflow-hidden bg-white">
                {[
                  { label: "Vendor Base Price", key: "price" },
                  { label: "Vendor Incentive Received", key: "received" },
                  { label: "Commission Paid", key: "payout" },
                  { label: "Cost Price", key: "cost" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 border-b last:border-b-0 border-[#E2E1E1]"
                  >
                  <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] border-r border-[#E2E1E1] text-[0.8rem] text-gray-700 font-medium py-5">
                      <span className="flex items-center">
                        {item.key === "price"
                          ? "Vendor Invoice (Base)"
                          : item.key === "received"
                            ? "Vendor Incentive Received"
                            : item.key === "payout"
                              ? "Commission Payout"
                              : "Cost Price"}
                        {item.key === "cost" && (
                          <FormulaTooltip text="Cost Price = Vendor Invoice (Base) - Vendor Incentive Received + Commission Payout" />
                        )}
                      </span>
                    </div>
                    <div className="col-span-8 flex items-center gap-3 py-3 px-4 bg-white">
                      {item.key !== "cost" ? (
                        <div className="flex flex-col w-full">
                          <MultiCurrencyInput
                            currency={
                              (item.key === "price"
                                ? v.vendorBaseCurrency || "INR"
                                : item.key === "received"
                                  ? v.vendorIncentiveCurrency || "INR"
                                  : v.commissionCurrency || "INR") as
                                | "INR"
                                | "USD"
                            }
                            onCurrencyChange={(curr) => {
                              if (item.key === "price") {
                                update({
                                  vendorBaseCurrency: curr,
                                  vendorBaseInr: requiresRoe(
                                    curr,
                                    businessCurrency,
                                  )
                                    ? (v.vendorBaseInr ?? "")
                                    : "",
                                });
                              } else if (item.key === "received") {
                                update({
                                  vendorIncentiveCurrency: curr,
                                  vendorIncentiveInr: requiresRoe(
                                    curr,
                                    businessCurrency,
                                  )
                                    ? (v.vendorIncentiveInr ?? "")
                                    : "",
                                });
                              } else {
                                update({
                                  commissionCurrency: curr,
                                  commissionInr: requiresRoe(
                                    curr,
                                    businessCurrency,
                                  )
                                    ? (v.commissionInr ?? "")
                                    : "",
                                });
                              }
                            }}
                            amount={
                              item.key === "price"
                                ? v.vendorBasePrice || ""
                                : item.key === "received"
                                  ? v.vendorIncentiveReceived || ""
                                  : v.commissionPaid || ""
                            }
                            onAmountChange={(val) => {
                              const sanitized = sanitizeNumeric(val);
                              if (item.key === "price") {
                                const next: any = {
                                  vendorBasePrice: String(sanitized),
                                };
                                if (
                                  requiresRoe(
                                    v.vendorBaseCurrency,
                                    businessCurrency,
                                  )
                                ) {
                                  next.vendorBaseInr = computeInr(
                                    sanitized,
                                    v.vendorBaseRoe,
                                  );
                                }
                                update(next);
                              } else if (item.key === "received") {
                                const next: any = {
                                  vendorIncentiveReceived: String(sanitized),
                                };
                                if (
                                  requiresRoe(
                                    v.vendorIncentiveCurrency,
                                    businessCurrency,
                                  )
                                ) {
                                  next.vendorIncentiveInr = computeInr(
                                    sanitized,
                                    v.vendorIncentiveRoe,
                                  );
                                }
                                update(next);
                              } else {
                                const next: any = {
                                  commissionPaid: String(sanitized),
                                };
                                if (
                                  requiresRoe(
                                    v.commissionCurrency,
                                    businessCurrency,
                                  )
                                ) {
                                  next.commissionInr = computeInr(
                                    sanitized,
                                    v.commissionRoe,
                                  );
                                }
                                update(next);
                              }
                            }}
                            roe={
                              item.key === "price"
                                ? v.vendorBaseRoe || ""
                                : item.key === "received"
                                  ? v.vendorIncentiveRoe || ""
                                  : v.commissionRoe || ""
                            }
                            onRoeChange={(roe) => {
                              if (item.key === "price") {
                                update({
                                  vendorBaseRoe: roe,
                                  vendorBaseInr: computeInr(
                                    v.vendorBasePrice,
                                    roe,
                                  ),
                                });
                              } else if (item.key === "received") {
                                update({
                                  vendorIncentiveRoe: roe,
                                  vendorIncentiveInr: computeInr(
                                    v.vendorIncentiveReceived,
                                    roe,
                                  ),
                                });
                              } else {
                                update({
                                  commissionRoe: roe,
                                  commissionInr: computeInr(
                                    v.commissionPaid,
                                    roe,
                                  ),
                                });
                              }
                            }}
                            inr={
                              item.key === "price"
                                ? v.vendorBaseInr || ""
                                : item.key === "received"
                                  ? v.vendorIncentiveInr || ""
                                  : v.commissionInr || ""
                            }
                            notes={
                              item.key === "price"
                                ? v.vendorBaseNotes || ""
                                : item.key === "received"
                                  ? v.vendorIncentiveNotes || ""
                                  : v.commissionNotes || ""
                            }
                            onNotesChange={(val) => {
                              if (item.key === "price") {
                                update({ vendorBaseNotes: val });
                              } else if (item.key === "received") {
                                update({ vendorIncentiveNotes: val });
                              } else {
                                update({ commissionNotes: val });
                              }
                            }}
                            showNotes={
                              item.key === "price"
                                ? showVendorBaseNotesFlag
                                : item.key === "received"
                                  ? showVendorIncentiveNotesFlag
                                  : showCommissionNotesFlag
                            }
                            onToggleNotes={() => {
                              if (item.key === "price")
                                setShowVendorBaseNotesFlag((s) => !s);
                              else if (item.key === "received")
                                setShowVendorIncentiveNotesFlag((s) => !s);
                              else setShowCommissionNotesFlag((s) => !s);
                            }}
                            businessCurrency={businessCurrency}
                            requiresRoe={requiresRoe}
                            amountInputWidth="44%"
                            readOnly={!!isReadOnly || !!isSubmitting}
                          />
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 text-[#7135AD] bg-[#7135AD0D] rounded-[10px] font-[500] text-[13px]">
                          {`${getStoredCurrencySymbol()} ${formatIndianNumber(
                            derivedCostPrice,
                          )}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-[0.8rem] font-[500] text-[#414141] ">
                Customer Revenue Summary
              </h4>

              <div className="border border-[#E2E1E1] -mt-1 overflow-hidden bg-white">
                {sellingPrices.map((sp, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 border-b last:border-b-0 border-[#E2E1E1]"
                  >
                    <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] border-r border-[#E2E1E1] text-[0.8rem] text-gray-700 font-medium py-5">
                      {customerCount > 1
                        ? `Selling Price (${displayCustomerLabel(i)})`
                        : "Selling Price"}
                    </div>

                    <div className="col-span-8 flex flex-col gap-2 py-3 px-4 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <MultiCurrencyInput
                            currency={
                              (sp.sellingCurrency as "INR" | "USD") || "INR"
                            }
                            onCurrencyChange={(val) => {
                              const patch: Partial<SellingPriceEntry> = {
                                sellingCurrency: val as "INR" | "USD",
                              };
                              if (
                                requiresRoe(val as string, businessCurrency)
                              ) {
                                patch.sellingInr = computeInr(
                                  String(sp.sellingprice ?? ""),
                                  String(sp.sellingRoe ?? ""),
                                );
                              } else {
                                patch.sellingRoe = "";
                                patch.sellingInr = "";
                              }
                              updateSellingPrice(i, patch);
                            }}
                            amount={sp.sellingprice || ""}
                            onAmountChange={(val) => {
                              const sanitized = sanitizeNumeric(val);
                              const patch: Partial<SellingPriceEntry> = {
                                sellingprice: sanitized,
                              };
                              if (
                                requiresRoe(
                                  sp.sellingCurrency,
                                  businessCurrency,
                                )
                              ) {
                                patch.sellingInr = computeInr(
                                  sanitized,
                                  sp.sellingRoe ?? "",
                                );
                              } else {
                                patch.sellingInr = "";
                              }
                              updateSellingPrice(i, patch);
                            }}
                            roe={sp.sellingRoe || ""}
                            onRoeChange={(val) =>
                              updateSellingPrice(i, {
                                sellingRoe: val,
                                sellingInr: computeInr(
                                  String(sp.sellingprice ?? ""),
                                  val,
                                ),
                              })
                            }
                            inr={sp.sellingInr || ""}
                            notes={sp.sellingNotes || ""}
                            onNotesChange={(val) =>
                              updateSellingPrice(i, { sellingNotes: val })
                            }
                            showNotes={!!sellingNotesFlags[i]}
                            onToggleNotes={() =>
                              setSellingNotesFlags((prev) => ({
                                ...prev,
                                [i]: !prev[i],
                              }))
                            }
                            businessCurrency={businessCurrency}
                            requiresRoe={requiresRoe}
                            amountInputWidth="40%"
                            readOnly={!!isReadOnly || !!isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-fit rounded-lg p-1 mt-1 bg-white">
                <span className="text-[13px] font-[500] text-[#414141] block mb-2">
                  Net
                </span>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-[#7135AD0D] text-[#7135AD] text-[14px] font-[500] rounded-[10px]">
                    {`${getStoredCurrencySymbol()} ${formatIndianNumber(
                      totalSellingPrice - derivedCostPrice,
                    )}`}
                  </span>

                  <span className="text-[13px] text-[#414141] font-[500]">
                    {derivedCostPrice > 0 && totalSellingPrice
                      ? `${(
                          ((totalSellingPrice - derivedCostPrice) /
                            (derivedCostPrice || 1)) *
                          100
                        ).toFixed(2)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AmountSection;
