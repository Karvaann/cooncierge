"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import { getStoredCurrencySymbol } from "@/utils/helper";
import { allowOnlyNumbers } from "@/utils/inputValidators";
import type { AmountSectionValue } from "@/components/AmountSection";

type Currency = "INR" | "USD";

interface CancellationInlineProps {
  value: AmountSectionValue;
  onChange: (next: AmountSectionValue) => void;
  showAdvancedPricing: boolean;
  isReadOnly?: boolean | undefined;
  isSubmitting?: boolean | undefined;
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

const CancellationInline: React.FC<CancellationInlineProps> = ({
  value,
  onChange,
  showAdvancedPricing,
  isReadOnly = false,
  isSubmitting = false,
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
  const [showSellingNotes, setShowSellingNotes] = useState(false);
  const [showSellingRefundNotes, setShowSellingRefundNotes] = useState(false);
  const [advNotesVisible, setAdvNotesVisible] = useState({
    vendorBase: false,
    vendorInvoiceRefund: false,
    vendorIncentive: false,
    chargeback: false,
    commissionPaid: false,
    commissionRefund: false,
  });

  // Helper to parse currency value to INR
  const parseToInr = (
    amount?: string,
    currency?: string,
    roe?: string,
    inr?: string,
  ): number => {
    if (requiresRoe(currency ?? "", businessCurrency) && inr) {
      return parseFloat(String(inr).replace(/,/g, "")) || 0;
    }
    return parseFloat(String(amount ?? "").replace(/,/g, "")) || 0;
  };

  const oldCostPrice = useMemo(() => {
    if (showAdvancedPricing) {
      const vendorBase = parseToInr(
        v.vendorBasePrice,
        v.vendorBaseCurrency,
        v.vendorBaseRoe,
        v.vendorBaseInr,
      );
      const supplierIncentive = parseToInr(
        v.vendorIncentiveReceived,
        v.vendorIncentiveCurrency,
        v.vendorIncentiveRoe,
        v.vendorIncentiveInr,
      );
      const commission = parseToInr(
        v.commissionPaid,
        v.commissionCurrency,
        v.commissionRoe,
        v.commissionInr,
      );
      return vendorBase - supplierIncentive + commission;
    }
    return parseToInr(v.costprice, v.costCurrency, v.costRoe, v.costInr);
  }, [
    showAdvancedPricing,
    v.vendorBasePrice,
    v.vendorBaseCurrency,
    v.vendorBaseRoe,
    v.vendorBaseInr,
    v.vendorIncentiveReceived,
    v.vendorIncentiveCurrency,
    v.vendorIncentiveRoe,
    v.vendorIncentiveInr,
    v.commissionPaid,
    v.commissionCurrency,
    v.commissionRoe,
    v.commissionInr,
    v.costprice,
    v.costCurrency,
    v.costRoe,
    v.costInr,
  ]);

  const oldSellingPrice = useMemo(() => {
    return parseToInr(
      v.sellingprice,
      v.sellingCurrency,
      v.sellingRoe,
      v.sellingInr,
    );
  }, [v.sellingprice, v.sellingCurrency, v.sellingRoe, v.sellingInr]);

  const newCostPrice = useMemo(() => {
    if (showAdvancedPricing) {
      const vendorRefund = parseToInr(
        v.vendorInvoiceRefundAmount,
        v.vendorInvoiceRefundCurrency,
        v.vendorInvoiceRefundRoe,
        v.vendorInvoiceRefundInr,
      );
      const chargeback = parseToInr(
        v.chargebackAmount,
        v.chargebackCurrency,
        v.chargebackRoe,
        v.chargebackInr,
      );
      const commissionRefund = parseToInr(
        v.commissionRefundAmount,
        v.commissionRefundCurrency,
        v.commissionRefundRoe,
        v.commissionRefundInr,
      );
      return vendorRefund - chargeback + commissionRefund;
    }
    return parseToInr(
      v.costRefundAmount,
      v.costRefundCurrency,
      v.costRefundRoe,
      v.costRefundInr,
    );
  }, [
    showAdvancedPricing,
    v.vendorInvoiceRefundAmount,
    v.vendorInvoiceRefundCurrency,
    v.vendorInvoiceRefundRoe,
    v.vendorInvoiceRefundInr,
    v.chargebackAmount,
    v.chargebackCurrency,
    v.chargebackRoe,
    v.chargebackInr,
    v.commissionRefundAmount,
    v.commissionRefundCurrency,
    v.commissionRefundRoe,
    v.commissionRefundInr,
    v.costRefundAmount,
    v.costRefundCurrency,
    v.costRefundRoe,
    v.costRefundInr,
  ]);

  const newSellingPrice = useMemo(() => {
    return parseToInr(
      v.sellingRefundAmount,
      v.sellingRefundCurrency,
      v.sellingRefundRoe,
      v.sellingRefundInr,
    );
  }, [
    v.sellingRefundAmount,
    v.sellingRefundCurrency,
    v.sellingRefundRoe,
    v.sellingRefundInr,
  ]);

  const oldNet = oldSellingPrice - oldCostPrice;
  const newNet = newSellingPrice - newCostPrice;
  const oldMargin =
    oldSellingPrice === 0
      ? "0.00%"
      : ((oldNet / oldSellingPrice) * 100).toFixed(2) + "%";
  const newMargin =
    newSellingPrice === 0
      ? "0.00%"
      : ((newNet / newSellingPrice) * 100).toFixed(2) + "%";

  const formatCurrency = (val: number) =>
    val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-2">
      <div className="border border-[#E2E1E1] rounded-lg overflow-hidden">
        {!showAdvancedPricing ? (
          <div>
            {/* COST PRICE */}
            <div className="grid grid-cols-[280px_1fr]">
              <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
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
                />
              </div>
            </div>

            {/* COST REFUND RECEIVED */}
            <div className="grid grid-cols-[280px_1fr]">
              <div className="bg-[#F9F9F9] border-r border-b border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                Refund Received
              </div>
              <div className="p-4 border-b border-[#E2E1E1]">
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
                      costRefundInr: computeInr(v.costRefundAmount ?? "", roe),
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
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ADVANCED PRICING: Vendor Base Price */}
            <div className="grid grid-cols-[280px_1fr]">
              <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                Vendor Base Price
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
                      vendorBaseInr: computeInr(v.vendorBasePrice ?? "", roe),
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
                  onCurrencyChange={(val) =>
                    update({
                      vendorInvoiceRefundCurrency: val,
                      vendorInvoiceRefundRoe: requiresRoe(val, businessCurrency)
                        ? (v.vendorInvoiceRefundRoe ?? "")
                        : "",
                      vendorInvoiceRefundInr: requiresRoe(val, businessCurrency)
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

            {/* Supplier Incentive Received */}
            <div className="grid grid-cols-[280px_1fr]">
              <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                Supplier Incentive Received
              </div>
              <div className="p-4 border-b border-[#E2E1E1]">
                <MultiCurrencyInput
                  currency={(v.vendorIncentiveCurrency as Currency) || "INR"}
                  onCurrencyChange={(val) => {
                    const next: any = { ...v, vendorIncentiveCurrency: val };
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
                  onNotesChange={(val) => update({ vendorIncentiveNotes: val })}
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
                Chargeback
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
                      chargebackInr: computeInr(v.chargebackAmount ?? "", roe),
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
                      commissionInr: computeInr(v.commissionPaid ?? "", roe),
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
              <div className="bg-[#F9F9F9] border-r border-b border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
                Refund Received
              </div>
              <div className="p-4 border-b border-[#E2E1E1]">
                <MultiCurrencyInput
                  currency={(v.commissionRefundCurrency as Currency) || "INR"}
                  onCurrencyChange={(val) =>
                    update({
                      commissionRefundCurrency: val,
                      commissionRefundRoe: requiresRoe(val, businessCurrency)
                        ? (v.commissionRefundRoe ?? "")
                        : "",
                      commissionRefundInr: requiresRoe(val, businessCurrency)
                        ? (v.commissionRefundInr ?? "")
                        : "",
                    })
                  }
                  amount={v.commissionRefundAmount || ""}
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
        )}

        {/* SELLING PRICE */}
        <div className="grid grid-cols-[280px_1fr]">
          <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
            Selling Price
          </div>
          <div className="p-4 border-b border-[#E2E1E1]">
            <MultiCurrencyInput
              currency={(v.sellingCurrency as Currency) || "INR"}
              onCurrencyChange={(val) => {
                const next: any = { ...v, sellingCurrency: val };
                if (requiresRoe(val, businessCurrency)) {
                  next.sellingInr = computeInr(
                    String(v.sellingprice ?? ""),
                    String(v.sellingRoe ?? ""),
                  );
                } else {
                  next.sellingRoe = "";
                  next.sellingInr = "";
                }
                onChange(next);
              }}
              amount={v.sellingprice || ""}
              onAmountChange={(val) => {
                const amount = allowOnlyNumbers(val);
                update({
                  sellingprice: amount,
                  sellingInr: requiresRoe(v.sellingCurrency, businessCurrency)
                    ? computeInr(amount, v.sellingRoe ?? "")
                    : "",
                });
              }}
              roe={v.sellingRoe || ""}
              onRoeChange={(val) => {
                const roe = allowOnlyNumbers(val);
                update({
                  sellingRoe: roe,
                  sellingInr: computeInr(v.sellingprice ?? "", roe),
                });
              }}
              inr={v.sellingInr || ""}
              notes={v.sellingNotes || ""}
              onNotesChange={(val) => update({ sellingNotes: val })}
              showNotes={showSellingNotes}
              onToggleNotes={() => setShowSellingNotes((s) => !s)}
              businessCurrency={businessCurrency}
              requiresRoe={requiresRoe}
              useWhiteDropdown={true}
              inputClassName={inputBase}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* SELLING REFUND RECEIVED */}
        <div className="grid grid-cols-[280px_1fr]">
          <div className="bg-[#F9F9F9] border-r border-[#E2E1E1] flex items-center justify-center text-[13px] font-medium text-[#414141]">
            Refund Received
          </div>
          <div className="p-4">
            <MultiCurrencyInput
              currency={(v.sellingRefundCurrency as Currency) || "INR"}
              onCurrencyChange={(val) =>
                update({
                  sellingRefundCurrency: val,
                  sellingRefundRoe: requiresRoe(val, businessCurrency)
                    ? (v.sellingRefundRoe ?? "")
                    : "",
                  sellingRefundInr: requiresRoe(val, businessCurrency)
                    ? (v.sellingRefundInr ?? "")
                    : "",
                })
              }
              amount={v.sellingRefundAmount || ""}
              onAmountChange={(val) => {
                const amount = allowOnlyNumbers(val);
                update({
                  sellingRefundAmount: amount,
                  sellingRefundInr: requiresRoe(
                    v.sellingRefundCurrency,
                    businessCurrency,
                  )
                    ? computeInr(amount, v.sellingRefundRoe ?? "")
                    : (v.sellingRefundInr ?? ""),
                });
              }}
              roe={v.sellingRefundRoe || ""}
              onRoeChange={(val) => {
                const roe = allowOnlyNumbers(val);
                update({
                  sellingRefundRoe: roe,
                  sellingRefundInr: computeInr(
                    v.sellingRefundAmount ?? "",
                    roe,
                  ),
                });
              }}
              inr={v.sellingRefundInr || ""}
              notes={v.sellingRefundNotes || ""}
              onNotesChange={(val) => update({ sellingRefundNotes: val })}
              showNotes={showSellingRefundNotes}
              onToggleNotes={() => setShowSellingRefundNotes((s) => !s)}
              businessCurrency={businessCurrency}
              requiresRoe={requiresRoe}
              useWhiteDropdown={true}
              inputClassName={smallInputBase}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 space-y-2 px-1">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[13px] font-[500] text-[#414141] mb-1">
              Old Cost Price
            </div>
            <div className="w-[116px] font-medium rounded-[12px] px-3 py-1.5 text-[14px] text-[#818181] bg-[#F9F9F9]">
              {getStoredCurrencySymbol()} {formatCurrency(oldCostPrice)}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-[500] text-[#414141] mb-1">
              Old Selling Price
            </div>
            <div className="w-[116px] rounded-[12px] px-3 py-1.5 text-[14px] text-[#818181] bg-gray-50">
              {getStoredCurrencySymbol()} {formatCurrency(oldSellingPrice)}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-[500] text-[#414141] mb-1">
              Net
            </div>
            <div className="w-[116px] rounded-[12px] px-3 py-1.5 text-[14px] text-[#818181] bg-gray-50">
              {getStoredCurrencySymbol()} {formatCurrency(oldNet)}
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
            <div className="text-[13px] font-[500] text-[#414141] mb-1">
              New Cost Price
            </div>
            <div className="w-[116px] font-[500] rounded-[12px] px-3 py-1.5 text-[14px] text-[#7135AD] bg-[#7135AD0D]">
              {getStoredCurrencySymbol()} {formatCurrency(newCostPrice)}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-[500] text-[#414141] mb-1">
              New Selling Price
            </div>
            <div className="w-[116px] font-[500] rounded-[12px] px-3 py-1.5 text-[14px] text-[#7135AD] bg-[#7135AD0D]">
              {getStoredCurrencySymbol()} {formatCurrency(newSellingPrice)}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-[500] text-[#414141] mb-1">
              Net
            </div>
            <div className="w-[116px] font-[500] rounded-[12px] px-3 py-1.5 text-[14px] text-[#7135AD] bg-[#7135AD0D]">
              {getStoredCurrencySymbol()} {formatCurrency(newNet)}
            </div>
          </div>

          <div className="w-2" />

          <div>
            <div className="text-[13px] font-[500] text-[#818181] mb-1">
              &nbsp;
            </div>
            <div className="px-1 py-2 text-[0.8rem] text-[#414141]">
              {newMargin}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationInline;
