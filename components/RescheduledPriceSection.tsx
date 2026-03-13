"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import SummaryPriceDisplay from "@/components/SummaryPriceDisplay";
import { allowOnlyNumbers } from "@/utils/inputValidators";
import {
  getStoredCurrencySymbol,
  formatIndianNumber,
  formatDate,
} from "@/utils/helper";
import { useBookingFieldSync } from "@/context/BookingFieldSyncContext";

type Currency = "INR" | "USD";

export interface RescheduledSellingPriceEntry {
  oldSellingPrice?: string | undefined;
  oldSellingCurrency?: Currency | undefined;
  oldSellingRoe?: string | undefined;
  oldSellingInr?: string | undefined;
  oldSellingNotes?: string | undefined;
  additionalSellingPrice?: string | undefined;
  additionalSellingCurrency?: Currency | undefined;
  additionalSellingRoe?: string | undefined;
  additionalSellingInr?: string | undefined;
  additionalSellingNotes?: string | undefined;
}

export type RescheduledAmountValue = {
  // Non-advanced: old cost
  oldCostPrice?: string;
  oldCostCurrency?: Currency;
  oldCostRoe?: string;
  oldCostInr?: string;
  oldCostNotes?: string;

  // Non-advanced: additional cost
  additionalCostPrice?: string;
  additionalCostCurrency?: Currency;
  additionalCostRoe?: string;
  additionalCostInr?: string;
  additionalCostNotes?: string;

  // Old selling
  oldSellingPrice?: string;
  oldSellingCurrency?: Currency;
  oldSellingRoe?: string;
  oldSellingInr?: string;
  oldSellingNotes?: string;

  // Additional selling
  additionalSellingPrice?: string;
  additionalSellingCurrency?: Currency;
  additionalSellingRoe?: string;
  additionalSellingInr?: string;
  additionalSellingNotes?: string;

  // Advanced: old vendor base
  oldVendorBasePrice?: string;
  oldVendorBaseCurrency?: Currency;
  oldVendorBaseRoe?: string;
  oldVendorBaseInr?: string;
  oldVendorBaseNotes?: string;

  // Advanced: additional vendor base
  additionalVendorBasePrice?: string;
  additionalVendorBaseCurrency?: Currency;
  additionalVendorBaseRoe?: string;
  additionalVendorBaseInr?: string;
  additionalVendorBaseNotes?: string;

  // Advanced: old vendor incentive
  oldVendorIncentiveReceived?: string;
  oldVendorIncentiveCurrency?: Currency;
  oldVendorIncentiveRoe?: string;
  oldVendorIncentiveInr?: string;
  oldVendorIncentiveNotes?: string;

  // Advanced: additional vendor incentive
  additionalVendorIncentive?: string;
  additionalVendorIncentiveCurrency?: Currency;
  additionalVendorIncentiveRoe?: string;
  additionalVendorIncentiveInr?: string;
  additionalVendorIncentiveNotes?: string;

  // Advanced: old commission
  oldCommissionPaid?: string;
  oldCommissionCurrency?: Currency;
  oldCommissionRoe?: string;
  oldCommissionInr?: string;
  oldCommissionNotes?: string;

  // Advanced: additional commission
  additionalCommissionPaid?: string;
  additionalCommissionCurrency?: Currency;
  additionalCommissionRoe?: string;
  additionalCommissionInr?: string;
  additionalCommissionNotes?: string;

  rescheduledSellingPrices?: RescheduledSellingPriceEntry[];
};

interface RescheduledPriceSectionProps {
  value: RescheduledAmountValue;
  onChange: (next: RescheduledAmountValue) => void;
  showAdvancedPricing: boolean;
  isReadOnly?: boolean | undefined;
  isSubmitting?: boolean | undefined;
  customerCount?: number;
}

const inputBase =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600";

const smallInputBase =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600";

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

const RescheduledPriceSection: React.FC<RescheduledPriceSectionProps> = ({
  value,
  onChange,
  showAdvancedPricing,
  isReadOnly = false,
  isSubmitting = false,
  customerCount = 1,
}) => {
  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user as any);

  const sync = useBookingFieldSync();
  const displayBookingDate = formatDate(sync?.bookingDate);
  const displayNewBookingDate = formatDate(sync?.newBookingDate);

  const v = value ?? {};
  const update = (patch: Partial<RescheduledAmountValue>) =>
    onChange({ ...v, ...patch });

  const readOnly = !!isReadOnly || !!isSubmitting;

  // Notes toggle state
  const [showCostNotes, setShowCostNotes] = useState(false);
  const [showAdditionalCostNotes, setShowAdditionalCostNotes] = useState(false);
  const [sellingNotesFlags, setSellingNotesFlags] = useState<
    Record<number, boolean>
  >({});
  const [additionalSellingNotesFlags, setAdditionalSellingNotesFlags] =
    useState<Record<number, boolean>>({});
  const [advNotesVisible, setAdvNotesVisible] = useState({
    oldVendorBase: false,
    additionalVendorInvoiceBase: false,
    oldVendorIncentiveReceived: false,
    additionalVendorIncentiveReceived: false,
    oldCommissionPayout: false,
    additionalCommissionPayout: false,
  });

  // compute derived net cost price (old + additional parts)
  const derivedNetCost = useMemo(() => {
    const parseNum = (s?: string) =>
      Number(String(s ?? "").replace(/,/g, "")) || 0;

    const baseOld =
      String(v.oldVendorBaseCurrency) === "USD"
        ? parseNum(v.oldVendorBaseInr) ||
          parseNum(v.oldVendorBasePrice) * parseNum(v.oldVendorBaseRoe)
        : parseNum(v.oldVendorBasePrice);

    const baseAdditional =
      String(v.additionalVendorBaseCurrency) === "USD"
        ? parseNum(v.additionalVendorBaseInr) ||
          parseNum(v.additionalVendorBasePrice) *
            parseNum(v.additionalVendorBaseRoe)
        : parseNum(v.additionalVendorBasePrice);

    const base = baseOld + baseAdditional;

    const incOld =
      String(v.oldVendorIncentiveCurrency) === "USD"
        ? parseNum(v.oldVendorIncentiveInr) ||
          parseNum(v.oldVendorIncentiveReceived) *
            parseNum(v.oldVendorIncentiveRoe)
        : parseNum(v.oldVendorIncentiveReceived);

    const incAdditional =
      String(v.additionalVendorIncentiveCurrency) === "USD"
        ? parseNum(v.additionalVendorIncentiveInr) ||
          parseNum(v.additionalVendorIncentive) *
            parseNum(v.additionalVendorIncentiveRoe)
        : parseNum(v.additionalVendorIncentive);

    const inc = incOld + incAdditional;

    const comOld =
      String(v.oldCommissionCurrency) === "USD"
        ? parseNum(v.oldCommissionInr) ||
          parseNum(v.oldCommissionPaid) * parseNum(v.oldCommissionRoe)
        : parseNum(v.oldCommissionPaid);

    const comAdditional =
      String(v.additionalCommissionCurrency) === "USD"
        ? parseNum(v.additionalCommissionInr) ||
          parseNum(v.additionalCommissionPaid) *
            parseNum(v.additionalCommissionRoe)
        : parseNum(v.additionalCommissionPaid);

    const com = comOld + comAdditional;

    return base - inc + com;
  }, [
    v.oldVendorBaseCurrency,
    v.oldVendorBaseInr,
    v.oldVendorBasePrice,
    v.oldVendorBaseRoe,
    v.additionalVendorBaseCurrency,
    v.additionalVendorBaseInr,
    v.additionalVendorBasePrice,
    v.additionalVendorBaseRoe,
    v.oldVendorIncentiveCurrency,
    v.oldVendorIncentiveInr,
    v.oldVendorIncentiveReceived,
    v.oldVendorIncentiveRoe,
    v.additionalVendorIncentiveCurrency,
    v.additionalVendorIncentiveInr,
    v.additionalVendorIncentive,
    v.additionalVendorIncentiveRoe,
    v.oldCommissionCurrency,
    v.oldCommissionInr,
    v.oldCommissionPaid,
    v.oldCommissionRoe,
    v.additionalCommissionCurrency,
    v.additionalCommissionInr,
    v.additionalCommissionPaid,
    v.additionalCommissionRoe,
  ]);

  const rescheduledSellingPrices: RescheduledSellingPriceEntry[] = (() => {
    const base: RescheduledSellingPriceEntry[] = v.rescheduledSellingPrices
      ?.length
      ? [...v.rescheduledSellingPrices]
      : [
          {
            oldSellingPrice: v.oldSellingPrice,
            oldSellingCurrency: v.oldSellingCurrency,
            oldSellingRoe: v.oldSellingRoe,
            oldSellingInr: v.oldSellingInr,
            oldSellingNotes: v.oldSellingNotes,
            additionalSellingPrice: v.additionalSellingPrice,
            additionalSellingCurrency: v.additionalSellingCurrency,
            additionalSellingRoe: v.additionalSellingRoe,
            additionalSellingInr: v.additionalSellingInr,
            additionalSellingNotes: v.additionalSellingNotes,
          } as RescheduledSellingPriceEntry,
        ];
    while (base.length < customerCount) base.push({});
    return base.slice(0, customerCount);
  })();

  const updateRescheduledSellingPrice = (
    index: number,
    patch: Partial<RescheduledSellingPriceEntry>,
  ) => {
    const prices = rescheduledSellingPrices.map((sp, i) =>
      i === index ? { ...sp, ...patch } : { ...sp },
    );
    const first = prices[0] || {};
    const flat: Record<string, any> = {
      ...v,
      rescheduledSellingPrices: prices,
    };
    if (first.oldSellingPrice !== undefined)
      flat.oldSellingPrice = first.oldSellingPrice;
    if (first.oldSellingCurrency !== undefined)
      flat.oldSellingCurrency = first.oldSellingCurrency;
    if (first.oldSellingRoe !== undefined)
      flat.oldSellingRoe = first.oldSellingRoe;
    if (first.oldSellingInr !== undefined)
      flat.oldSellingInr = first.oldSellingInr;
    if (first.oldSellingNotes !== undefined)
      flat.oldSellingNotes = first.oldSellingNotes;
    if (first.additionalSellingPrice !== undefined)
      flat.additionalSellingPrice = first.additionalSellingPrice;
    if (first.additionalSellingCurrency !== undefined)
      flat.additionalSellingCurrency = first.additionalSellingCurrency;
    if (first.additionalSellingRoe !== undefined)
      flat.additionalSellingRoe = first.additionalSellingRoe;
    if (first.additionalSellingInr !== undefined)
      flat.additionalSellingInr = first.additionalSellingInr;
    if (first.additionalSellingNotes !== undefined)
      flat.additionalSellingNotes = first.additionalSellingNotes;
    onChange(flat as RescheduledAmountValue);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-3">
        {!showAdvancedPricing ? (
          <>
            <h4 className="text-[13px] font-[500] text-[#414141] mb-3">
              Vendor Payment Summary
            </h4>
            <div className="border border-[#E2E1E1] overflow-hidden">
              {/* (Cost) */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                  Old Cost Price
                  {displayBookingDate ? (
                    <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                      {displayBookingDate}
                    </div>
                  ) : null}
                </div>

                <div className="p-4 border-b border-[#E2E1E1]">
                  <MultiCurrencyInput
                    currency={(v.oldCostCurrency as Currency) || "INR"}
                    onCurrencyChange={(val) => {
                      const next: any = { ...v, oldCostCurrency: val };
                      if (requiresRoe(val, businessCurrency)) {
                        next.oldCostInr = computeInr(
                          String(v.oldCostPrice ?? ""),
                          String(v.oldCostRoe ?? ""),
                        );
                      } else {
                        next.oldCostRoe = "";
                        next.oldCostInr = "";
                      }
                      onChange(next);
                    }}
                    amount={v.oldCostPrice || ""}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      update({
                        oldCostPrice: amount,
                        oldCostInr: requiresRoe(
                          v.oldCostCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, v.oldCostRoe ?? "")
                          : "",
                      });
                    }}
                    roe={v.oldCostRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      update({
                        oldCostRoe: roe,
                        oldCostInr: computeInr(v.oldCostPrice ?? "", roe),
                      });
                    }}
                    inr={v.oldCostInr || ""}
                    notes={v.oldCostNotes || ""}
                    onNotesChange={(val) => update({ oldCostNotes: val })}
                    showNotes={showCostNotes}
                    onToggleNotes={() => setShowCostNotes((s) => !s)}
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                    readOnly={readOnly}
                    amountInputWidth="44%"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                  Additional Cost Price
                  {displayNewBookingDate ? (
                    <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                      {displayNewBookingDate}
                    </div>
                  ) : null}
                </div>
                <div className="p-4">
                  <MultiCurrencyInput
                    currency={(v.additionalCostCurrency as Currency) || "INR"}
                    onCurrencyChange={(val) =>
                      update({
                        additionalCostCurrency: val,
                        additionalCostRoe: requiresRoe(val, businessCurrency)
                          ? (v.additionalCostRoe ?? "")
                          : "",
                        additionalCostInr: requiresRoe(val, businessCurrency)
                          ? (v.additionalCostInr ?? "")
                          : "",
                      })
                    }
                    amount={v.additionalCostPrice || ""}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      update({
                        additionalCostPrice: amount,
                        additionalCostInr: requiresRoe(
                          v.additionalCostCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, v.additionalCostRoe ?? "")
                          : (v.additionalCostInr ?? ""),
                      });
                    }}
                    roe={v.additionalCostRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      update({
                        additionalCostRoe: roe,
                        additionalCostInr: computeInr(
                          v.additionalCostPrice ?? "",
                          roe,
                        ),
                      });
                    }}
                    inr={v.additionalCostInr || ""}
                    notes={v.additionalCostNotes || ""}
                    onNotesChange={(val) =>
                      update({ additionalCostNotes: val })
                    }
                    showNotes={showAdditionalCostNotes}
                    onToggleNotes={() => setShowAdditionalCostNotes((s) => !s)}
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    inputClassName={inputBase}
                    useWhiteDropdown={false}
                    readOnly={readOnly}
                    amountInputWidth="44%"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h4 className="text-[13px] font-[500] text-[#414141] mb-3">
              Vendor Payment Summary
            </h4>
            <div className="border border-[#E2E1E1] overflow-hidden">
              <>
                {/* ADVANCED PRICING: Vendor Base Price */}

                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                    Old Vendor Invoice (Base)
                    {displayBookingDate ? (
                      <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                        {displayBookingDate}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={(v.oldVendorBaseCurrency as Currency) || "INR"}
                      onCurrencyChange={(val) => {
                        const next: any = { ...v, oldVendorBaseCurrency: val };
                        if (requiresRoe(val, businessCurrency)) {
                          next.oldVendorBaseInr = computeInr(
                            String(v.oldVendorBasePrice ?? ""),
                            String(v.oldVendorBaseRoe ?? ""),
                          );
                        } else {
                          next.oldVendorBaseRoe = "";
                          next.oldVendorBaseInr = "";
                        }
                        onChange(next);
                      }}
                      amount={v.oldVendorBasePrice || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          oldVendorBasePrice: amount,
                          oldVendorBaseInr: requiresRoe(
                            v.oldVendorBaseCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.oldVendorBaseRoe ?? "")
                            : "",
                        });
                      }}
                      roe={v.oldVendorBaseRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          oldVendorBaseRoe: roe,
                          oldVendorBaseInr: computeInr(
                            v.oldVendorBasePrice ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.oldVendorBaseInr || ""}
                      notes={v.oldVendorBaseNotes || ""}
                      onNotesChange={(val) =>
                        update({ oldVendorBaseNotes: val })
                      }
                      showNotes={advNotesVisible.oldVendorBase}
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          oldVendorBase: !p.oldVendorBase,
                        }))
                      }
                      businessCurrency={businessCurrency}
                      requiresRoe={requiresRoe}
                      inputClassName={inputBase}
                      readOnly={readOnly}
                      amountInputWidth="44%"
                    />
                  </div>
                </div>

                {/* Vendor Invoice Refund */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-b border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                    Additional Vendor Invoice (Base)
                    {displayNewBookingDate ? (
                      <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                        {displayNewBookingDate}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={
                        (v.additionalVendorBaseCurrency as Currency) || "INR"
                      }
                      amountInputWidth="44%"
                      onCurrencyChange={(val) =>
                        update({
                          additionalVendorBaseCurrency: val,
                          additionalVendorBaseRoe: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.additionalVendorBaseRoe ?? "")
                            : "",
                          additionalVendorBaseInr: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.additionalVendorBaseInr ?? "")
                            : "",
                        })
                      }
                      amount={v.additionalVendorBasePrice || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          additionalVendorBasePrice: amount,
                          additionalVendorBaseInr: requiresRoe(
                            v.additionalVendorBaseCurrency,
                            businessCurrency,
                          )
                            ? computeInr(
                                amount,
                                v.additionalVendorBaseRoe ?? "",
                              )
                            : (v.additionalVendorBaseInr ?? ""),
                        });
                      }}
                      roe={v.additionalVendorBaseRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          additionalVendorBaseRoe: roe,
                          additionalVendorBaseInr: computeInr(
                            v.additionalVendorBasePrice ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.additionalVendorBaseInr || ""}
                      notes={v.additionalVendorBaseNotes || ""}
                      onNotesChange={(val) =>
                        update({ additionalVendorBaseNotes: val })
                      }
                      showNotes={advNotesVisible.additionalVendorInvoiceBase}
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          additionalVendorInvoiceBase:
                            !p.additionalVendorInvoiceBase,
                        }))
                      }
                      businessCurrency={businessCurrency}
                      requiresRoe={requiresRoe}
                      inputClassName={smallInputBase}
                      useWhiteDropdown={false}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Supplier Incentive Received */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                    Old Vendor Incentive Received
                    {displayBookingDate ? (
                      <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                        {displayBookingDate}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={
                        (v.oldVendorIncentiveCurrency as Currency) || "INR"
                      }
                      onCurrencyChange={(val) => {
                        const next: any = {
                          ...v,
                          oldVendorIncentiveCurrency: val,
                        };
                        if (requiresRoe(val, businessCurrency)) {
                          next.oldVendorIncentiveInr = computeInr(
                            String(v.oldVendorIncentiveReceived ?? ""),
                            String(v.oldVendorIncentiveRoe ?? ""),
                          );
                        } else {
                          next.oldVendorIncentiveRoe = "";
                          next.oldVendorIncentiveInr = "";
                        }
                        onChange(next);
                      }}
                      amountInputWidth="44%"
                      amount={v.oldVendorIncentiveReceived || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          oldVendorIncentiveReceived: amount,
                          oldVendorIncentiveInr: requiresRoe(
                            v.oldVendorIncentiveCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.oldVendorIncentiveRoe ?? "")
                            : "",
                        });
                      }}
                      roe={v.oldVendorIncentiveRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          oldVendorIncentiveRoe: roe,
                          oldVendorIncentiveInr: computeInr(
                            v.oldVendorIncentiveReceived ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.oldVendorIncentiveInr || ""}
                      notes={v.oldVendorIncentiveNotes || ""}
                      onNotesChange={(val) =>
                        update({ oldVendorIncentiveNotes: val })
                      }
                      showNotes={advNotesVisible.oldVendorIncentiveReceived}
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          oldVendorIncentiveReceived:
                            !p.oldVendorIncentiveReceived,
                        }))
                      }
                      businessCurrency={businessCurrency}
                      requiresRoe={requiresRoe}
                      inputClassName={inputBase}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Chargeback */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                    Additional Vendor Incentive Received
                    {displayNewBookingDate ? (
                      <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                        {displayNewBookingDate}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={
                        (v.additionalVendorIncentiveCurrency as Currency) ||
                        "INR"
                      }
                      onCurrencyChange={(val) =>
                        update({
                          additionalVendorIncentiveCurrency: val,
                          additionalVendorIncentiveRoe: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.additionalVendorIncentiveRoe ?? "")
                            : "",
                          additionalVendorIncentiveInr: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.additionalVendorIncentiveInr ?? "")
                            : "",
                        })
                      }
                      amountInputWidth="44%"
                      amount={v.additionalVendorIncentive || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          additionalVendorIncentive: amount,
                          additionalVendorIncentiveInr: requiresRoe(
                            v.additionalVendorIncentiveCurrency,
                            businessCurrency,
                          )
                            ? computeInr(
                                amount,
                                v.additionalVendorIncentiveRoe ?? "",
                              )
                            : (v.additionalVendorIncentiveInr ?? ""),
                        });
                      }}
                      roe={v.additionalVendorIncentiveRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          additionalVendorIncentiveRoe: roe,
                          additionalVendorIncentiveInr: computeInr(
                            v.additionalVendorIncentive ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.additionalVendorIncentiveInr || ""}
                      notes={v.additionalVendorIncentiveNotes || ""}
                      onNotesChange={(val) =>
                        update({ additionalVendorIncentiveNotes: val })
                      }
                      showNotes={
                        advNotesVisible.additionalVendorIncentiveReceived
                      }
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          additionalVendorIncentiveReceived:
                            !p.additionalVendorIncentiveReceived,
                        }))
                      }
                      businessCurrency={businessCurrency}
                      requiresRoe={requiresRoe}
                      inputClassName={smallInputBase}
                      useWhiteDropdown={false}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Commission Payout */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-t border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                    Old Commission Payout
                    {displayBookingDate ? (
                      <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                        {displayBookingDate}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={(v.oldCommissionCurrency as Currency) || "INR"}
                      onCurrencyChange={(val) => {
                        const next: any = { ...v, oldCommissionCurrency: val };
                        if (requiresRoe(val, businessCurrency)) {
                          next.oldCommissionInr = computeInr(
                            String(v.oldCommissionPaid ?? ""),
                            String(v.oldCommissionRoe ?? ""),
                          );
                        } else {
                          next.oldCommissionRoe = "";
                          next.oldCommissionInr = "";
                        }
                        onChange(next);
                      }}
                      amount={v.oldCommissionPaid || ""}
                      amountInputWidth="44%"
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          oldCommissionPaid: amount,
                          oldCommissionInr: requiresRoe(
                            v.oldCommissionCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.oldCommissionRoe ?? "")
                            : "",
                        });
                      }}
                      roe={v.oldCommissionRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          oldCommissionRoe: roe,
                          oldCommissionInr: computeInr(
                            v.oldCommissionPaid ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.oldCommissionInr || ""}
                      notes={v.oldCommissionNotes || ""}
                      onNotesChange={(val) =>
                        update({ oldCommissionNotes: val })
                      }
                      showNotes={advNotesVisible.oldCommissionPayout}
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          oldCommissionPayout: !p.oldCommissionPayout,
                        }))
                      }
                      businessCurrency={businessCurrency}
                      requiresRoe={requiresRoe}
                      useWhiteDropdown={true}
                      inputClassName={inputBase}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Commission Refund */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                    Additional Commission Payout
                    {displayNewBookingDate ? (
                      <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                        {displayNewBookingDate}
                      </div>
                    ) : null}
                  </div>
                  <div className="p-4 border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={
                        (v.additionalCommissionCurrency as Currency) || "INR"
                      }
                      onCurrencyChange={(val) =>
                        update({
                          additionalCommissionCurrency: val,
                          additionalCommissionRoe: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.additionalCommissionRoe ?? "")
                            : "",
                          additionalCommissionInr: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.additionalCommissionInr ?? "")
                            : "",
                        })
                      }
                      amount={v.additionalCommissionPaid || ""}
                      amountInputWidth="44%"
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          additionalCommissionPaid: amount,
                          additionalCommissionInr: requiresRoe(
                            v.additionalCommissionCurrency,
                            businessCurrency,
                          )
                            ? computeInr(
                                amount,
                                v.additionalCommissionRoe ?? "",
                              )
                            : (v.additionalCommissionInr ?? ""),
                        });
                      }}
                      roe={v.additionalCommissionRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          additionalCommissionRoe: roe,
                          additionalCommissionInr: computeInr(
                            v.additionalCommissionPaid ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.additionalCommissionInr || ""}
                      notes={v.additionalCommissionNotes || ""}
                      onNotesChange={(val) =>
                        update({ additionalCommissionNotes: val })
                      }
                      showNotes={advNotesVisible.additionalCommissionPayout}
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          additionalCommissionPayout:
                            !p.additionalCommissionPayout,
                        }))
                      }
                      businessCurrency={businessCurrency}
                      requiresRoe={requiresRoe}
                      useWhiteDropdown={false}
                      inputClassName={smallInputBase}
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-t border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                    Net Cost Price
                  </div>
                  <div className="p-4 border-t border-[#E2E1E1]">
                    <div className="px-3 py-1.5 w-fit text-[#7135AD] bg-[#7135AD0D] rounded-[10px] font-[500] text-[13px]">
                      {`${getStoredCurrencySymbol()} ${formatIndianNumber(
                        derivedNetCost,
                      )}`}
                    </div>
                  </div>
                </div>
              </>
            </div>
          </>
        )}
        <h4 className="text-[13px] font-[500] text-[#414141] mb-3">
          Customer Revenue Summary
        </h4>

        <div className="border border-[#E2E1E1] overflow-hidden">
          {rescheduledSellingPrices.map((sp, idx) => (
            <React.Fragment key={idx}>
              {/* Old Selling Price */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                  Old Selling Price
                  {rescheduledSellingPrices.length > 1
                    ? ` (Customer ${idx + 1})`
                    : ""}
                  {displayBookingDate ? (
                    <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                      {displayBookingDate}
                    </div>
                  ) : null}
                </div>
                <div className="p-4 border-b border-[#E2E1E1]">
                  <MultiCurrencyInput
                    currency={(sp.oldSellingCurrency as Currency) || "INR"}
                    onCurrencyChange={(val) => {
                      const patch: Partial<RescheduledSellingPriceEntry> = {
                        oldSellingCurrency: val,
                      };
                      if (requiresRoe(val, businessCurrency)) {
                        patch.oldSellingInr = computeInr(
                          String(sp.oldSellingPrice ?? ""),
                          String(sp.oldSellingRoe ?? ""),
                        );
                      } else {
                        patch.oldSellingRoe = "";
                        patch.oldSellingInr = "";
                      }
                      updateRescheduledSellingPrice(idx, patch);
                    }}
                    amount={sp.oldSellingPrice || ""}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      updateRescheduledSellingPrice(idx, {
                        oldSellingPrice: amount,
                        oldSellingInr: requiresRoe(
                          sp.oldSellingCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, sp.oldSellingRoe ?? "")
                          : "",
                      });
                    }}
                    roe={sp.oldSellingRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      updateRescheduledSellingPrice(idx, {
                        oldSellingRoe: roe,
                        oldSellingInr: computeInr(
                          sp.oldSellingPrice ?? "",
                          roe,
                        ),
                      });
                    }}
                    inr={sp.oldSellingInr || ""}
                    notes={sp.oldSellingNotes || ""}
                    onNotesChange={(val) =>
                      updateRescheduledSellingPrice(idx, {
                        oldSellingNotes: val,
                      })
                    }
                    showNotes={!!sellingNotesFlags[idx]}
                    onToggleNotes={() =>
                      setSellingNotesFlags((p) => ({
                        ...p,
                        [idx]: !p[idx],
                      }))
                    }
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    useWhiteDropdown={true}
                    inputClassName={inputBase}
                    readOnly={readOnly}
                    amountInputWidth="44%"
                  />
                </div>
              </div>

              {/* Additional Selling Price */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex flex-col items-center justify-center text-[13px] font-medium text-[#414141]">
                  Additional Selling Price
                  {rescheduledSellingPrices.length > 1
                    ? ` (Customer ${idx + 1})`
                    : ""}
                  {displayNewBookingDate ? (
                    <div className="mt-1 text-[12px] border border-[#E2E1E1] text-[#414141] rounded-[8px] bg-white px-2 py-0.5">
                      {displayNewBookingDate}
                    </div>
                  ) : null}
                </div>
                <div
                  className={`p-4${idx < rescheduledSellingPrices.length - 1 ? " border-b border-[#E2E1E1]" : ""}`}
                >
                  <MultiCurrencyInput
                    currency={
                      (sp.additionalSellingCurrency as Currency) || "INR"
                    }
                    onCurrencyChange={(val) =>
                      updateRescheduledSellingPrice(idx, {
                        additionalSellingCurrency: val,
                        additionalSellingRoe: requiresRoe(val, businessCurrency)
                          ? (sp.additionalSellingRoe ?? "")
                          : "",
                        additionalSellingInr: requiresRoe(val, businessCurrency)
                          ? (sp.additionalSellingInr ?? "")
                          : "",
                      })
                    }
                    amount={sp.additionalSellingPrice || ""}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      updateRescheduledSellingPrice(idx, {
                        additionalSellingPrice: amount,
                        additionalSellingInr: requiresRoe(
                          sp.additionalSellingCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, sp.additionalSellingRoe ?? "")
                          : (sp.additionalSellingInr ?? ""),
                      });
                    }}
                    roe={sp.additionalSellingRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      updateRescheduledSellingPrice(idx, {
                        additionalSellingRoe: roe,
                        additionalSellingInr: computeInr(
                          sp.additionalSellingPrice ?? "",
                          roe,
                        ),
                      });
                    }}
                    inr={sp.additionalSellingInr || ""}
                    notes={sp.additionalSellingNotes || ""}
                    onNotesChange={(val) =>
                      updateRescheduledSellingPrice(idx, {
                        additionalSellingNotes: val,
                      })
                    }
                    showNotes={!!additionalSellingNotesFlags[idx]}
                    onToggleNotes={() =>
                      setAdditionalSellingNotesFlags((p) => ({
                        ...p,
                        [idx]: !p[idx],
                      }))
                    }
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    useWhiteDropdown={true}
                    inputClassName={smallInputBase}
                    amountInputWidth="44%"
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <SummaryPriceDisplay
        value={v}
        showAdvancedPricing={showAdvancedPricing}
        businessCurrency={businessCurrency}
        variant="rescheduled"
      />
    </div>
  );
};

export default RescheduledPriceSection;
