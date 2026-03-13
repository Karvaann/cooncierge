"use client";

import React, { useMemo } from "react";
import { getStoredCurrencySymbol } from "@/utils/helper";
import { requiresRoe } from "@/utils/currencyUtil";
import type { AmountSectionValue } from "@/components/AmountSection";
import type { RescheduledAmountValue } from "@/components/RescheduledPriceSection";

interface Props {
  value: AmountSectionValue | RescheduledAmountValue;
  showAdvancedPricing: boolean;
  businessCurrency?: string | null;
  variant?: "cancellation" | "rescheduled";
}

const SummaryPriceDisplay: React.FC<Props> = ({
  value: v,
  showAdvancedPricing,
  businessCurrency,
  variant = "cancellation",
}) => {
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

  // Normalize both types into a common field shape
  const f = useMemo(() => {
    if (variant === "rescheduled") {
      const r = v as RescheduledAmountValue;
      return {
        costPrice: r.oldCostPrice,
        costCurrency: r.oldCostCurrency,
        costRoe: r.oldCostRoe,
        costInr: r.oldCostInr,
        newCostPrice: r.additionalCostPrice,
        newCostCurrency: r.additionalCostCurrency,
        newCostRoe: r.additionalCostRoe,
        newCostInr: r.additionalCostInr,
        sellingPrice: r.oldSellingPrice,
        sellingCurrency: r.oldSellingCurrency,
        sellingRoe: r.oldSellingRoe,
        sellingInr: r.oldSellingInr,
        newSellingPrice: r.additionalSellingPrice,
        newSellingCurrency: r.additionalSellingCurrency,
        newSellingRoe: r.additionalSellingRoe,
        newSellingInr: r.additionalSellingInr,
        vendorBase: r.oldVendorBasePrice,
        vendorBaseCurrency: r.oldVendorBaseCurrency,
        vendorBaseRoe: r.oldVendorBaseRoe,
        vendorBaseInr: r.oldVendorBaseInr,
        vendorRefund: r.additionalVendorBasePrice,
        vendorRefundCurrency: r.additionalVendorBaseCurrency,
        vendorRefundRoe: r.additionalVendorBaseRoe,
        vendorRefundInr: r.additionalVendorBaseInr,
        incentive: r.oldVendorIncentiveReceived,
        incentiveCurrency: r.oldVendorIncentiveCurrency,
        incentiveRoe: r.oldVendorIncentiveRoe,
        incentiveInr: r.oldVendorIncentiveInr,
        chargeback: r.additionalVendorIncentive,
        chargebackCurrency: r.additionalVendorIncentiveCurrency,
        chargebackRoe: r.additionalVendorIncentiveRoe,
        chargebackInr: r.additionalVendorIncentiveInr,
        commission: r.oldCommissionPaid,
        commissionCurrency: r.oldCommissionCurrency,
        commissionRoe: r.oldCommissionRoe,
        commissionInr: r.oldCommissionInr,
        commissionRefund: r.additionalCommissionPaid,
        commissionRefundCurrency: r.additionalCommissionCurrency,
        commissionRefundRoe: r.additionalCommissionRoe,
        commissionRefundInr: r.additionalCommissionInr,
      };
    }
    const c = v as AmountSectionValue;
    return {
      costPrice: c.costprice,
      costCurrency: c.costCurrency,
      costRoe: c.costRoe,
      costInr: c.costInr,
      newCostPrice: c.costRefundAmount,
      newCostCurrency: c.costRefundCurrency,
      newCostRoe: c.costRefundRoe,
      newCostInr: c.costRefundInr,
      sellingPrice: c.sellingprice,
      sellingCurrency: c.sellingCurrency,
      sellingRoe: c.sellingRoe,
      sellingInr: c.sellingInr,
      newSellingPrice: c.sellingRefundAmount,
      newSellingCurrency: c.sellingRefundCurrency,
      newSellingRoe: c.sellingRefundRoe,
      newSellingInr: c.sellingRefundInr,
      vendorBase: c.vendorBasePrice,
      vendorBaseCurrency: c.vendorBaseCurrency,
      vendorBaseRoe: c.vendorBaseRoe,
      vendorBaseInr: c.vendorBaseInr,
      vendorRefund: c.vendorInvoiceRefundAmount,
      vendorRefundCurrency: c.vendorInvoiceRefundCurrency,
      vendorRefundRoe: c.vendorInvoiceRefundRoe,
      vendorRefundInr: c.vendorInvoiceRefundInr,
      incentive: c.vendorIncentiveReceived,
      incentiveCurrency: c.vendorIncentiveCurrency,
      incentiveRoe: c.vendorIncentiveRoe,
      incentiveInr: c.vendorIncentiveInr,
      chargeback: c.chargebackAmount,
      chargebackCurrency: c.chargebackCurrency,
      chargebackRoe: c.chargebackRoe,
      chargebackInr: c.chargebackInr,
      commission: c.commissionPaid,
      commissionCurrency: c.commissionCurrency,
      commissionRoe: c.commissionRoe,
      commissionInr: c.commissionInr,
      commissionRefund: c.commissionRefundAmount,
      commissionRefundCurrency: c.commissionRefundCurrency,
      commissionRefundRoe: c.commissionRefundRoe,
      commissionRefundInr: c.commissionRefundInr,
    };
  }, [v, variant]);

  const oldCostPrice = useMemo(() => {
    if (showAdvancedPricing) {
      const vendorBase = parseToInr(
        f.vendorBase,
        f.vendorBaseCurrency,
        f.vendorBaseRoe,
        f.vendorBaseInr,
      );
      const supplierIncentive = parseToInr(
        f.incentive,
        f.incentiveCurrency,
        f.incentiveRoe,
        f.incentiveInr,
      );
      const commission = parseToInr(
        f.commission,
        f.commissionCurrency,
        f.commissionRoe,
        f.commissionInr,
      );
      return vendorBase - supplierIncentive + commission;
    }
    return parseToInr(f.costPrice, f.costCurrency, f.costRoe, f.costInr);
  }, [showAdvancedPricing, f, businessCurrency]);

  const oldSellingPrice = useMemo(() => {
    if (variant === "rescheduled") {
      const r = v as RescheduledAmountValue;
      const entries = r.rescheduledSellingPrices?.length
        ? r.rescheduledSellingPrices
        : [
            {
              oldSellingPrice: r.oldSellingPrice,
              oldSellingCurrency: r.oldSellingCurrency,
              oldSellingRoe: r.oldSellingRoe,
              oldSellingInr: r.oldSellingInr,
            },
          ];
      return entries.reduce(
        (sum, sp) =>
          sum +
          parseToInr(
            sp.oldSellingPrice,
            sp.oldSellingCurrency,
            sp.oldSellingRoe,
            sp.oldSellingInr,
          ),
        0,
      );
    }
    const c = v as AmountSectionValue;
    const entries = c.sellingPrices?.length
      ? c.sellingPrices
      : [
          {
            sellingprice: c.sellingprice,
            sellingCurrency: c.sellingCurrency,
            sellingRoe: c.sellingRoe,
            sellingInr: c.sellingInr,
          },
        ];
    return entries.reduce(
      (sum, sp) =>
        sum +
        parseToInr(
          sp.sellingprice,
          sp.sellingCurrency,
          sp.sellingRoe,
          sp.sellingInr,
        ),
      0,
    );
  }, [v, variant, businessCurrency]);

  const newCostPrice = useMemo(() => {
    if (showAdvancedPricing) {
      const vendorRefund = parseToInr(
        f.vendorRefund,
        f.vendorRefundCurrency,
        f.vendorRefundRoe,
        f.vendorRefundInr,
      );
      const chargeback = parseToInr(
        f.chargeback,
        f.chargebackCurrency,
        f.chargebackRoe,
        f.chargebackInr,
      );
      const commissionRefund = parseToInr(
        f.commissionRefund,
        f.commissionRefundCurrency,
        f.commissionRefundRoe,
        f.commissionRefundInr,
      );
      return vendorRefund - chargeback + commissionRefund;
    }
    return parseToInr(
      f.newCostPrice,
      f.newCostCurrency,
      f.newCostRoe,
      f.newCostInr,
    );
  }, [showAdvancedPricing, f, businessCurrency]);

  const newSellingPrice = useMemo(() => {
    if (variant === "rescheduled") {
      const r = v as RescheduledAmountValue;
      const entries = r.rescheduledSellingPrices?.length
        ? r.rescheduledSellingPrices
        : [
            {
              additionalSellingPrice: r.additionalSellingPrice,
              additionalSellingCurrency: r.additionalSellingCurrency,
              additionalSellingRoe: r.additionalSellingRoe,
              additionalSellingInr: r.additionalSellingInr,
            },
          ];
      return entries.reduce(
        (sum, sp) =>
          sum +
          parseToInr(
            sp.additionalSellingPrice,
            sp.additionalSellingCurrency,
            sp.additionalSellingRoe,
            sp.additionalSellingInr,
          ),
        0,
      );
    }
    const c = v as AmountSectionValue;
    const entries = c.sellingPrices?.length
      ? c.sellingPrices
      : [
          {
            sellingRefundAmount: c.sellingRefundAmount,
            sellingRefundCurrency: c.sellingRefundCurrency,
            sellingRefundRoe: c.sellingRefundRoe,
            sellingRefundInr: c.sellingRefundInr,
          },
        ];
    return entries.reduce(
      (sum, sp) =>
        sum +
        parseToInr(
          sp.sellingRefundAmount,
          sp.sellingRefundCurrency,
          sp.sellingRefundRoe,
          sp.sellingRefundInr,
        ),
      0,
    );
  }, [v, variant, businessCurrency]);

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
    <div className="mt-4 space-y-2 px-1">
      <div className="flex items-center gap-2">
        <div>
          <div className="text-[13px] font-[500] text-[#414141] mb-1">
            Old Cost Price
          </div>
          <div className="w-fit min-w-[116px] font-medium rounded-[12px] px-3 py-1.5 text-[14px] text-[#818181] bg-[#F9F9F9]">
            {getStoredCurrencySymbol()} {formatCurrency(oldCostPrice)}
          </div>
        </div>

        <div>
          <div className="text-[13px] font-[500] text-[#414141] mb-1">
            Old Selling Price
          </div>
          <div className="w-fit min-w-[116px] rounded-[12px] px-3 py-1.5 text-[14px] text-[#818181] bg-gray-50">
            {getStoredCurrencySymbol()} {formatCurrency(oldSellingPrice)}
          </div>
        </div>

        <div>
          <div className="text-[13px] font-[500] text-[#414141] mb-1">Net</div>
          <div className="w-fit min-w-[116px] rounded-[12px] px-3 py-1.5 text-[14px] text-[#818181] bg-gray-50">
            {getStoredCurrencySymbol()} {formatCurrency(oldNet)}
          </div>
        </div>

        <div className="w-2" />

        <div>
          <div className="text-[13px] font-semibold text-[#818181] mb-1">
            &nbsp;
          </div>
          <div className="px-1 py-2 text-[14px] text-gray-500">{oldMargin}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div>
          <div className="text-[13px] font-[500] text-[#414141] mb-1">
            New Cost Price
          </div>
          <div className="w-fit min-w-[116px] font-[500] rounded-[12px] px-3 py-1.5 text-[14px] text-[#7135AD] bg-[#7135AD0D]">
            {getStoredCurrencySymbol()} {formatCurrency(newCostPrice)}
          </div>
        </div>

        <div>
          <div className="text-[13px] font-[500] text-[#414141] mb-1">
            New Selling Price
          </div>
          <div className="w-fit min-w-[116px] font-[500] rounded-[12px] px-3 py-1.5 text-[14px] text-[#7135AD] bg-[#7135AD0D]">
            {getStoredCurrencySymbol()} {formatCurrency(newSellingPrice)}
          </div>
        </div>

        <div>
          <div className="text-[13px] font-[500] text-[#414141] mb-1">Net</div>
          <div className="w-fit min-w-[116px] font-[500] rounded-[12px] px-3 py-1.5 text-[14px] text-[#7135AD] bg-[#7135AD0D]">
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
  );
};

export default SummaryPriceDisplay;
