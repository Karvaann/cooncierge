"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import SummaryPriceDisplay from "@/components/SummaryPriceDisplay";
import { allowOnlyNumbers } from "@/utils/inputValidators";
import type {
  AmountSectionValue,
  SellingPriceEntry,
} from "@/components/AmountSection";

type Currency = "INR" | "USD";

interface CancellationSectionProps {
  value: AmountSectionValue;
  onChange: (next: AmountSectionValue) => void;
  showAdvancedPricing: boolean;
  isReadOnly?: boolean | undefined;
  isSubmitting?: boolean | undefined;
  customerCount?: number;
  customerLabels?: string[];
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

const CancellationSection: React.FC<CancellationSectionProps> = ({
  value,
  onChange,
  showAdvancedPricing,
  isReadOnly = false,
  isSubmitting = false,
  customerCount = 1,
  customerLabels = [],
}) => {
  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user as any);

  const v = value ?? {};
  const update = (patch: Partial<AmountSectionValue>) =>
    onChange({ ...v, ...patch });

  const readOnly = !!isReadOnly || !!isSubmitting;

  // Notes toggle state
  const [showCostNotes, setShowCostNotes] = useState(false);
  const [showCostRefundNotes, setShowCostRefundNotes] = useState(false);
  const [sellingNotesFlags, setSellingNotesFlags] = useState<
    Record<number, boolean>
  >({});
  const [sellingRefundNotesFlags, setSellingRefundNotesFlags] = useState<
    Record<number, boolean>
  >({});
  const [advNotesVisible, setAdvNotesVisible] = useState({
    vendorBase: false,
    vendorInvoiceRefund: false,
    vendorIncentive: false,
    chargeback: false,
    commissionPaid: false,
    commissionRefund: false,
  });

  // summary calculations are now handled inside SummaryPriceDisplay

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
            sellingRefundAmount: v.sellingRefundAmount,
            sellingRefundCurrency: v.sellingRefundCurrency,
            sellingRefundRoe: v.sellingRefundRoe,
            sellingRefundInr: v.sellingRefundInr,
            sellingRefundNotes: v.sellingRefundNotes,
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
    if (first.sellingRefundAmount !== undefined)
      flat.sellingRefundAmount = first.sellingRefundAmount;
    if (first.sellingRefundCurrency !== undefined)
      flat.sellingRefundCurrency = first.sellingRefundCurrency;
    if (first.sellingRefundRoe !== undefined)
      flat.sellingRefundRoe = first.sellingRefundRoe;
    if (first.sellingRefundInr !== undefined)
      flat.sellingRefundInr = first.sellingRefundInr;
    if (first.sellingRefundNotes !== undefined)
      flat.sellingRefundNotes = first.sellingRefundNotes;
    onChange(flat as AmountSectionValue);
  };

  const displayCustomerLabel = (index: number) =>
    // customerLabels[index] ||
    `Customer ${index + 1}`;

  return (
    <div className="space-y-2">
      <div className="space-y-3">
        {!showAdvancedPricing ? (
          <>
            <h4 className="text-[13px] font-[500] text-[#414141] mb-3">
              Vendor Payment Summary
            </h4>
            <div className="border border-[#E2E1E1] rounded-[14px] overflow-hidden">
              {/* (Cost) */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-b border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Cost Price
                </div>
                <div className="p-4 border-b border-[#E2E1E1]">
                  <MultiCurrencyInput
                    currency={(v.costCurrency as Currency) || "INR"}
                    onCurrencyChange={(val) => {
                      const next: any = { ...v, costCurrency: val };
                      if (requiresRoe(val, businessCurrency)) {
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
                      const amount = allowOnlyNumbers(val);
                      update({
                        costprice: amount,
                        costInr: requiresRoe(v.costCurrency, businessCurrency)
                          ? computeInr(amount, v.costRoe ?? "")
                          : "",
                      });
                    }}
                    roe={v.costRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      update({
                        costRoe: roe,
                        costInr: computeInr(v.costprice ?? "", roe),
                      });
                    }}
                    inr={v.costInr || ""}
                    notes={v.costNotes || ""}
                    onNotesChange={(val) => update({ costNotes: val })}
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
                <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  Refund Received
                </div>
                <div className="p-4">
                  <MultiCurrencyInput
                    currency={(v.costRefundCurrency as Currency) || "INR"}
                    onCurrencyChange={(val) =>
                      update({
                        costRefundCurrency: val,
                        costRefundRoe: requiresRoe(val, businessCurrency)
                          ? (v.costRefundRoe ?? "")
                          : "",
                        costRefundInr: requiresRoe(val, businessCurrency)
                          ? (v.costRefundInr ?? "")
                          : "",
                      })
                    }
                    amount={v.costRefundAmount || ""}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      update({
                        costRefundAmount: amount,
                        costRefundInr: requiresRoe(
                          v.costRefundCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, v.costRefundRoe ?? "")
                          : (v.costRefundInr ?? ""),
                      });
                    }}
                    roe={v.costRefundRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      update({
                        costRefundRoe: roe,
                        costRefundInr: computeInr(
                          v.costRefundAmount ?? "",
                          roe,
                        ),
                      });
                    }}
                    inr={v.costRefundInr || ""}
                    notes={v.costRefundNotes || ""}
                    onNotesChange={(val) => update({ costRefundNotes: val })}
                    showNotes={showCostRefundNotes}
                    onToggleNotes={() => setShowCostRefundNotes((s) => !s)}
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
            <div className="border border-[#E2E1E1]  rounded-[14px] overflow-hidden">
              <>
                {/* ADVANCED PRICING: Vendor Base Price */}

                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                    Vendor Invoice (Base)
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={(v.vendorBaseCurrency as Currency) || "INR"}
                      onCurrencyChange={(val) => {
                        const next: any = { ...v, vendorBaseCurrency: val };
                        if (requiresRoe(val, businessCurrency)) {
                          next.vendorBaseInr = computeInr(
                            String(v.vendorBasePrice ?? ""),
                            String(v.vendorBaseRoe ?? ""),
                          );
                        } else {
                          next.vendorBaseRoe = "";
                          next.vendorBaseInr = "";
                        }
                        onChange(next);
                      }}
                      amount={v.vendorBasePrice || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          vendorBasePrice: amount,
                          vendorBaseInr: requiresRoe(
                            v.vendorBaseCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.vendorBaseRoe ?? "")
                            : "",
                        });
                      }}
                      roe={v.vendorBaseRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          vendorBaseRoe: roe,
                          vendorBaseInr: computeInr(
                            v.vendorBasePrice ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.vendorBaseInr || ""}
                      notes={v.vendorBaseNotes || ""}
                      onNotesChange={(val) => update({ vendorBaseNotes: val })}
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
                      readOnly={readOnly}
                      amountInputWidth="44%"
                    />
                  </div>
                </div>

                {/* Vendor Invoice Refund */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-b border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                    Refund Received
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={
                        (v.vendorInvoiceRefundCurrency as Currency) || "INR"
                      }
                      amountInputWidth="44%"
                      onCurrencyChange={(val) =>
                        update({
                          vendorInvoiceRefundCurrency: val,
                          vendorInvoiceRefundRoe: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.vendorInvoiceRefundRoe ?? "")
                            : "",
                          vendorInvoiceRefundInr: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.vendorInvoiceRefundInr ?? "")
                            : "",
                        })
                      }
                      amount={v.vendorInvoiceRefundAmount || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          vendorInvoiceRefundAmount: amount,
                          vendorInvoiceRefundInr: requiresRoe(
                            v.vendorInvoiceRefundCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.vendorInvoiceRefundRoe ?? "")
                            : (v.vendorInvoiceRefundInr ?? ""),
                        });
                      }}
                      roe={v.vendorInvoiceRefundRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          vendorInvoiceRefundRoe: roe,
                          vendorInvoiceRefundInr: computeInr(
                            v.vendorInvoiceRefundAmount ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.vendorInvoiceRefundInr || ""}
                      notes={v.vendorInvoiceRefundNotes || ""}
                      onNotesChange={(val) =>
                        update({ vendorInvoiceRefundNotes: val })
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
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Vendor Incentive Received */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                    Vendor Incentive Received
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={
                        (v.vendorIncentiveCurrency as Currency) || "INR"
                      }
                      onCurrencyChange={(val) => {
                        const next: any = {
                          ...v,
                          vendorIncentiveCurrency: val,
                        };
                        if (requiresRoe(val, businessCurrency)) {
                          next.vendorIncentiveInr = computeInr(
                            String(v.vendorIncentiveReceived ?? ""),
                            String(v.vendorIncentiveRoe ?? ""),
                          );
                        } else {
                          next.vendorIncentiveRoe = "";
                          next.vendorIncentiveInr = "";
                        }
                        onChange(next);
                      }}
                      amountInputWidth="44%"
                      amount={v.vendorIncentiveReceived || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          vendorIncentiveReceived: amount,
                          vendorIncentiveInr: requiresRoe(
                            v.vendorIncentiveCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.vendorIncentiveRoe ?? "")
                            : "",
                        });
                      }}
                      roe={v.vendorIncentiveRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          vendorIncentiveRoe: roe,
                          vendorIncentiveInr: computeInr(
                            v.vendorIncentiveReceived ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.vendorIncentiveInr || ""}
                      notes={v.vendorIncentiveNotes || ""}
                      onNotesChange={(val) =>
                        update({ vendorIncentiveNotes: val })
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
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Chargeback */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                    Vendor Incentive Chargeback
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={(v.chargebackCurrency as Currency) || "INR"}
                      onCurrencyChange={(val) =>
                        update({
                          chargebackCurrency: val,
                          chargebackRoe: requiresRoe(val, businessCurrency)
                            ? (v.chargebackRoe ?? "")
                            : "",
                          chargebackInr: requiresRoe(val, businessCurrency)
                            ? (v.chargebackInr ?? "")
                            : "",
                        })
                      }
                      amountInputWidth="44%"
                      amount={v.chargebackAmount || ""}
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          chargebackAmount: amount,
                          chargebackInr: requiresRoe(
                            v.chargebackCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.chargebackRoe ?? "")
                            : (v.chargebackInr ?? ""),
                        });
                      }}
                      roe={v.chargebackRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          chargebackRoe: roe,
                          chargebackInr: computeInr(
                            v.chargebackAmount ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.chargebackInr || ""}
                      notes={v.chargebackNotes || ""}
                      onNotesChange={(val) => update({ chargebackNotes: val })}
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
                      readOnly={readOnly}
                    />
                  </div>
                </div>

                {/* Commission Payout */}
                <div className="grid grid-cols-[280px_1fr]">
                  <div className="bg-[#F9F9F9] border-r border-t border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                    Commission Payout
                  </div>
                  <div className="p-4 border-b border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={(v.commissionCurrency as Currency) || "INR"}
                      onCurrencyChange={(val) => {
                        const next: any = { ...v, commissionCurrency: val };
                        if (requiresRoe(val, businessCurrency)) {
                          next.commissionInr = computeInr(
                            String(v.commissionPaid ?? ""),
                            String(v.commissionRoe ?? ""),
                          );
                        } else {
                          next.commissionRoe = "";
                          next.commissionInr = "";
                        }
                        onChange(next);
                      }}
                      amount={v.commissionPaid || ""}
                      amountInputWidth="44%"
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          commissionPaid: amount,
                          commissionInr: requiresRoe(
                            v.commissionCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.commissionRoe ?? "")
                            : "",
                        });
                      }}
                      roe={v.commissionRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          commissionRoe: roe,
                          commissionInr: computeInr(
                            v.commissionPaid ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.commissionInr || ""}
                      notes={v.commissionNotes || ""}
                      onNotesChange={(val) => update({ commissionNotes: val })}
                      showNotes={advNotesVisible.commissionPaid}
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          commissionPaid: !p.commissionPaid,
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
                  <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                    Commission Payout Chargeback
                  </div>
                  <div className="p-4 border-[#E2E1E1]">
                    <MultiCurrencyInput
                      currency={
                        (v.commissionRefundCurrency as Currency) || "INR"
                      }
                      onCurrencyChange={(val) =>
                        update({
                          commissionRefundCurrency: val,
                          commissionRefundRoe: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.commissionRefundRoe ?? "")
                            : "",
                          commissionRefundInr: requiresRoe(
                            val,
                            businessCurrency,
                          )
                            ? (v.commissionRefundInr ?? "")
                            : "",
                        })
                      }
                      amount={v.commissionRefundAmount || ""}
                      amountInputWidth="44%"
                      onAmountChange={(val) => {
                        const amount = allowOnlyNumbers(val);
                        update({
                          commissionRefundAmount: amount,
                          commissionRefundInr: requiresRoe(
                            v.commissionRefundCurrency,
                            businessCurrency,
                          )
                            ? computeInr(amount, v.commissionRefundRoe ?? "")
                            : (v.commissionRefundInr ?? ""),
                        });
                      }}
                      roe={v.commissionRefundRoe || ""}
                      onRoeChange={(val) => {
                        const roe = allowOnlyNumbers(val);
                        update({
                          commissionRefundRoe: roe,
                          commissionRefundInr: computeInr(
                            v.commissionRefundAmount ?? "",
                            roe,
                          ),
                        });
                      }}
                      inr={v.commissionRefundInr || ""}
                      notes={v.commissionRefundNotes || ""}
                      onNotesChange={(val) =>
                        update({ commissionRefundNotes: val })
                      }
                      showNotes={advNotesVisible.commissionRefund}
                      onToggleNotes={() =>
                        setAdvNotesVisible((p) => ({
                          ...p,
                          commissionRefund: !p.commissionRefund,
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
              </>
            </div>
          </>
        )}
        <h4 className="text-[13px] font-[500] text-[#414141] mb-3">
          Customer Revenue Summary
        </h4>

        <div className="border border-[#E2E1E1] rounded-[14px] overflow-hidden">
          {sellingPrices.map((sp, i) => (
            <React.Fragment key={i}>
              {/* Selling Price */}
              <div className="grid grid-cols-[280px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-b border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                  {customerCount > 1
                    ? `Selling Price (${displayCustomerLabel(i)})`
                    : "Selling Price"}
                </div>
                <div className="p-4 border-b border-[#E2E1E1]">
                  <MultiCurrencyInput
                    currency={(sp.sellingCurrency as Currency) || "INR"}
                    onCurrencyChange={(val) => {
                      const patch: Partial<SellingPriceEntry> = {
                        sellingCurrency: val as Currency,
                      };
                      if (requiresRoe(val, businessCurrency)) {
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
                      const amount = allowOnlyNumbers(val);
                      const patch: Partial<SellingPriceEntry> = {
                        sellingprice: amount,
                        sellingInr: requiresRoe(
                          sp.sellingCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, sp.sellingRoe ?? "")
                          : "",
                      };
                      updateSellingPrice(i, patch);
                    }}
                    roe={sp.sellingRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      updateSellingPrice(i, {
                        sellingRoe: roe,
                        sellingInr: computeInr(sp.sellingprice ?? "", roe),
                      });
                    }}
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
                    useWhiteDropdown={true}
                    inputClassName={inputBase}
                    readOnly={readOnly}
                    amountInputWidth="44%"
                  />
                </div>
              </div>

              {/* Refund Paid */}
              <div className="grid grid-cols-[280px_1fr]">
                <div
                  className={`bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141] ${i < sellingPrices.length - 1 ? "border-b" : ""}`}
                >
                  {`Refund Paid${customerCount > 1 ? ` (Customer ${i + 1})` : ""}`}
                </div>
                <div
                  className={`p-4 ${i < sellingPrices.length - 1 ? "border-b border-[#E2E1E1]" : ""}`}
                >
                  <MultiCurrencyInput
                    currency={(sp.sellingRefundCurrency as Currency) || "INR"}
                    onCurrencyChange={(val) => {
                      updateSellingPrice(i, {
                        sellingRefundCurrency: val as Currency,
                        sellingRefundRoe: requiresRoe(val, businessCurrency)
                          ? (sp.sellingRefundRoe ?? "")
                          : "",
                        sellingRefundInr: requiresRoe(val, businessCurrency)
                          ? (sp.sellingRefundInr ?? "")
                          : "",
                      });
                    }}
                    amount={sp.sellingRefundAmount || ""}
                    onAmountChange={(val) => {
                      const amount = allowOnlyNumbers(val);
                      updateSellingPrice(i, {
                        sellingRefundAmount: amount,
                        sellingRefundInr: requiresRoe(
                          sp.sellingRefundCurrency,
                          businessCurrency,
                        )
                          ? computeInr(amount, sp.sellingRefundRoe ?? "")
                          : (sp.sellingRefundInr ?? ""),
                      });
                    }}
                    roe={sp.sellingRefundRoe || ""}
                    onRoeChange={(val) => {
                      const roe = allowOnlyNumbers(val);
                      updateSellingPrice(i, {
                        sellingRefundRoe: roe,
                        sellingRefundInr: computeInr(
                          sp.sellingRefundAmount ?? "",
                          roe,
                        ),
                      });
                    }}
                    inr={sp.sellingRefundInr || ""}
                    notes={sp.sellingRefundNotes || ""}
                    onNotesChange={(val) =>
                      updateSellingPrice(i, { sellingRefundNotes: val })
                    }
                    showNotes={!!sellingRefundNotesFlags[i]}
                    onToggleNotes={() =>
                      setSellingRefundNotesFlags((prev) => ({
                        ...prev,
                        [i]: !prev[i],
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
      />
    </div>
  );
};

export default CancellationSection;
