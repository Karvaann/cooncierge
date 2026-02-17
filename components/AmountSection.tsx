"use client";

import React, { useId, useMemo, useState } from "react";
import DropDown from "@/components/DropDown";
import { TbNotes } from "react-icons/tb";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import MultiCurrencyInput from "@/components/multiCurrencyUI";

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
}

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
}) => {
  const checkboxId = useId();

  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user);

  const v = value ?? {};
  const update = (patch: Partial<AmountSectionValue>) =>
    onChange({ ...v, ...patch });

  const [showCostNotesFlag, setShowCostNotesFlag] = useState<boolean>(false);
  const [showSellingNotesFlag, setShowSellingNotesFlag] =
    useState<boolean>(false);
  const [showVendorBaseNotesFlag, setShowVendorBaseNotesFlag] =
    useState<boolean>(false);
  const [showVendorIncentiveNotesFlag, setShowVendorIncentiveNotesFlag] =
    useState<boolean>(false);
  const [showCommissionNotesFlag, setShowCommissionNotesFlag] =
    useState<boolean>(false);

  const isCancelled =
    bookingStatus?.toLowerCase() === "cancelled" && Boolean(cancellationForm);

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

  const handlePriceChange =
    (field: "costprice" | "sellingprice") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const sanitized = sanitizeNumeric(raw);
      const next: any = { ...v, [field]: sanitized };

      if (field === "costprice") {
        if (requiresRoe(v.costCurrency, businessCurrency)) {
          next.costInr = computeInr(sanitized, v.costRoe ?? "");
        } else {
          next.costInr = "";
        }
      }

      if (field === "sellingprice") {
        if (requiresRoe(v.sellingCurrency, businessCurrency)) {
          next.sellingInr = computeInr(sanitized, v.sellingRoe ?? "");
        } else {
          next.sellingInr = "";
        }
      }

      onChange(next);
    };

  return (
    <div className="mb-4 border border-gray-200 rounded-lg w-[48vw] p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-medium text-gray-700">Amount</h3>

        {!(isCancelled && !editableCancelled) && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id={checkboxId}
              className="hidden"
              checked={showAdvancedPricing}
              onChange={() => onToggleAdvancedPricing(!showAdvancedPricing)}
            />
            <label
              htmlFor={checkboxId}
              className="w-4 h-4 -mt-1 border border-gray-300 rounded-sm flex items-center justify-center cursor-pointer peer-checked:bg-green-600"
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
          </label>
        )}
      </div>

      <hr className="mb-3 -mt-1 border-t border-gray-200" />

      {/* CANCELLATION MODAL SAVED DATA VIEW (read-only) */}
      {isCancelled && !editableCancelled ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {!showAdvancedPricing ? (
            <div>
              {/* COST PRICE */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Cost Price
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.costCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.costCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.costprice || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.costCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.costRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.costInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.costNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.costNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COST REFUND RECEIVED */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.costRefundCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.costRefundCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.costRefundAmount || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.costRefundCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.costRefundRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.costRefundInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.costRefundNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.costRefundNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SELLING PRICE */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Selling Price
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.sellingCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[170px_100px_140px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.sellingCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.sellingprice || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.sellingCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.sellingRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.sellingInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.sellingNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.sellingNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SELLING REFUND RECEIVED */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Refund Received
                </div>
                <div className="p-4">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.sellingRefundCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.sellingRefundCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.sellingRefundAmount || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.sellingRefundCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.sellingRefundRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.sellingRefundInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.sellingRefundNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.sellingRefundNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ADVANCED PRICING VIEW - VENDOR BASE PRICE */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Vendor Base Price
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.vendorBaseCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.vendorBaseCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.vendorBasePrice || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.vendorBaseCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.vendorBaseRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.vendorBaseInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.vendorBaseNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.vendorBaseNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VENDOR INVOICE REFUND RECEIVED */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.vendorInvoiceRefundCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.vendorInvoiceRefundCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.vendorInvoiceRefundAmount || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.vendorInvoiceRefundCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={
                              cancellationForm?.vendorInvoiceRefundRoe || ""
                            }
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.vendorInvoiceRefundInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.vendorInvoiceRefundNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.vendorInvoiceRefundNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SUPPLIER INCENTIVE RECEIVED */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Supplier Incentive Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.vendorIncentiveCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.vendorIncentiveCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.vendorIncentiveReceived || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.vendorIncentiveCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.vendorIncentiveRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.vendorIncentiveInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.vendorIncentiveNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.vendorIncentiveNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CHARGEBACK */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Chargeback
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.chargebackCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.chargebackCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.chargebackAmount || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.chargebackCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.chargebackRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.chargebackInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.chargebackNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.chargebackNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COMMISSION PAYOUT */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Commission Payout
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.commissionCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.commissionCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.commissionPaid || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.commissionCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.commissionRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.commissionInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.commissionNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.commissionNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COMMISSION REFUND */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Refund Received
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.commissionRefundCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.commissionRefundCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.commissionRefundAmount || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.commissionRefundCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.commissionRefundRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.commissionRefundInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.commissionRefundNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.commissionRefundNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SELLING PRICE */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Selling Price
                </div>
                <div className="p-4 border-b border-gray-200">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.sellingCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[170px_100px_140px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.sellingCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.sellingprice || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.sellingCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.sellingRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.sellingInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.sellingNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.sellingNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SELLING REFUND RECEIVED */}
              <div className="grid grid-cols-[220px_1fr]">
                <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
                  Refund Received
                </div>
                <div className="p-4">
                  <div
                    className={`grid ${
                      requiresRoe(
                        cancellationForm?.sellingRefundCurrency,
                        businessCurrency,
                      )
                        ? "grid-cols-[160px_90px_130px]"
                        : "grid-cols-[340px]"
                    } gap-3 items-center`}
                  >
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                      <div className="h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center min-w-[64px]">
                        {cancellationForm?.sellingRefundCurrency || "INR"}
                      </div>
                      <div className="h-[34px] px-3 text-[13px] flex-1 flex items-center bg-gray-50 text-gray-700">
                        {cancellationForm?.sellingRefundAmount || "0"}
                      </div>
                    </div>

                    {requiresRoe(
                      cancellationForm?.sellingRefundCurrency,
                      businessCurrency,
                    ) && (
                      <>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <span className="h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center">
                            ROE
                          </span>
                          <input
                            type="text"
                            value={cancellationForm?.sellingRefundRoe || ""}
                            onChange={() => {}}
                            className="h-[34px] px-2 text-[13px] outline-none w-full bg-white"
                            placeholder=""
                          />
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
                          <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                            INR
                          </span>
                          <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                            {cancellationForm?.sellingRefundInr || ""}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {cancellationForm?.sellingRefundNotes && (
                    <div className="mt-3">
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
                        Notes
                      </label>
                      <div className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 bg-gray-50">
                        {cancellationForm?.sellingRefundNotes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Saved summary cards for cancelled saved data */}
          {cancellationForm?.summary && (
            <div className="mt-4 space-y-2 px-1">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-gray-600 mb-1">
                    Old Cost Price
                  </div>
                  <div className="border border-gray-200 w-[116px] font-medium rounded-md px-3 py-2 text-[14px] text-[#818181] bg-[#F9F9F9]">
                    ₹ {cancellationForm.summary.oldCost}
                  </div>
                </div>

                <div className="w-px h-10 mt-6 bg-gray-300"></div>

                <div>
                  <div className="text-[13px] font-semibold text-gray-600 mb-1">
                    Old Selling Price
                  </div>
                  <div className="border border-gray-200 w-[116px] rounded-md px-3 py-2 text-[14px] text-[#818181] bg-gray-50">
                    ₹ {cancellationForm.summary.oldSelling}
                  </div>
                </div>

                <div className="w-px h-10 mt-6 bg-gray-300"></div>

                <div>
                  <div className="text-[13px] font-semibold text-[#818181] mb-1">
                    Net
                  </div>
                  <div className="border border-gray-200 w-[116px] rounded-md px-3 py-2 text-[14px] text-[#818181] bg-gray-50">
                    ₹ {cancellationForm.summary.oldNet}
                  </div>
                </div>

                <div className="w-2" />

                <div>
                  <div className="text-[13px] font-semibold text-[#818181] mb-1">
                    &nbsp;
                  </div>
                  <div className="px-1 py-2 text-[14px] text-gray-500">
                    {cancellationForm.summary.oldMargin}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#818181] mb-1">
                    New Cost Price
                  </div>
                  <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
                    ₹ {cancellationForm.summary.newCost}
                  </div>
                </div>

                <div className="w-px h-10 mt-6 bg-gray-300"></div>

                <div>
                  <div className="text-[13px] font-semibold text-[#818181] mb-1">
                    New Selling Price
                  </div>
                  <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
                    ₹ {cancellationForm.summary.newSelling}
                  </div>
                </div>

                <div className="w-px h-10 mt-6 bg-gray-300"></div>

                <div>
                  <div className="text-[13px] font-semibold text-[#818181] mb-1">
                    Net
                  </div>
                  <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
                    ₹ {cancellationForm.summary.newNet}
                  </div>
                </div>

                <div className="w-2" />

                <div>
                  <div className="text-[13px] font-semibold text-[#818181] mb-1">
                    &nbsp;
                  </div>
                  <div className="px-1 py-2 text-[0.8rem] text-gray-500">
                    {cancellationForm.summary.newMargin}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Selling Price
                </label>
                <MultiCurrencyInput
                  currency={(v.sellingCurrency as "INR" | "USD") || "INR"}
                  onCurrencyChange={(val) => {
                    const next: any = {
                      ...v,
                      sellingCurrency: val,
                    };
                    if (requiresRoe(val as string, businessCurrency)) {
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
                    const sanitized = sanitizeNumeric(val);
                    const next: any = { ...v, sellingprice: sanitized };
                    if (requiresRoe(v.sellingCurrency, businessCurrency)) {
                      next.sellingInr = computeInr(
                        sanitized,
                        v.sellingRoe ?? "",
                      );
                    } else {
                      next.sellingInr = "";
                    }
                    onChange(next);
                  }}
                  roe={v.sellingRoe || ""}
                  onRoeChange={(val) =>
                    update({
                      sellingRoe: val,
                      sellingInr: computeInr(String(v.sellingprice ?? ""), val),
                    })
                  }
                  inr={v.sellingInr || ""}
                  notes={v.sellingNotes || ""}
                  onNotesChange={(val) => update({ sellingNotes: val })}
                  showNotes={showSellingNotesFlag}
                  onToggleNotes={() => setShowSellingNotesFlag((s) => !s)}
                  businessCurrency={businessCurrency}
                  requiresRoe={requiresRoe}
                  notesInputWidth="60%"
                  amountInputWidth="30%"
                />
              </div>

              {/* NET */}
              <div className="w-fit rounded-lg p-1 mt-1 bg-white">
                <span className="text-[13px] font-medium text-gray-700 block mb-2">
                  Net
                </span>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[13px] font-medium rounded-md">
                    {`INR ${Number(v.sellingprice) - Number(v.costprice)}`}
                  </span>

                  <span className="text-[13px] text-gray-700 font-medium">
                    {v.costprice && v.sellingprice
                      ? `${(
                          ((Number(v.sellingprice) - Number(v.costprice)) /
                            Number(v.costprice)) *
                          100
                        ).toFixed(2)}%`
                      : "0%"}
                  </span>
                </div>
              </div>

              {/* Saved summary cards (appear after user saves via CancellationModal) */}
              {cancellationForm?.summary && (
                <div className="mt-4 space-y-2 px-1">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-[13px] font-semibold text-gray-600 mb-1">
                        Old Cost Price
                      </div>
                      <div className="border border-gray-200 w-[116px] font-medium rounded-md px-3 py-2 text-[14px] text-[#818181] bg-[#F9F9F9]">
                        ₹ {cancellationForm.summary.oldCost}
                      </div>
                    </div>

                    <div className="w-px h-10 mt-6 bg-gray-300"></div>

                    <div>
                      <div className="text-[13px] font-semibold text-gray-600 mb-1">
                        Old Selling Price
                      </div>
                      <div className="border border-gray-200 w-[116px] rounded-md px-3 py-2 text-[14px] text-[#818181] bg-gray-50">
                        ₹ {cancellationForm.summary.oldSelling}
                      </div>
                    </div>

                    <div className="w-px h-10 mt-6 bg-gray-300"></div>

                    <div>
                      <div className="text-[13px] font-semibold text-[#818181] mb-1">
                        Net
                      </div>
                      <div className="border border-gray-200 w-[116px] rounded-md px-3 py-2 text-[14px] text-[#818181] bg-gray-50">
                        ₹ {cancellationForm.summary.oldNet}
                      </div>
                    </div>

                    <div className="w-2" />

                    <div>
                      <div className="text-[13px] font-semibold text-[#818181] mb-1">
                        &nbsp;
                      </div>
                      <div className="px-1 py-2 text-[14px] text-gray-500">
                        {cancellationForm.summary.oldMargin}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-[13px] font-semibold text-[#818181] mb-1">
                        New Cost Price
                      </div>
                      <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
                        ₹ {cancellationForm.summary.newCost}
                      </div>
                    </div>

                    <div className="w-px h-10 mt-6 bg-gray-300"></div>

                    <div>
                      <div className="text-[13px] font-semibold text-[#818181] mb-1">
                        New Selling Price
                      </div>
                      <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
                        ₹ {cancellationForm.summary.newSelling}
                      </div>
                    </div>

                    <div className="w-px h-10 mt-6 bg-gray-300"></div>

                    <div>
                      <div className="text-[13px] font-semibold text-[#818181] mb-1">
                        Net
                      </div>
                      <div className="border border-blue-100 w-[116px] rounded-md px-3 py-2 text-[14px] text-blue-600 bg-blue-50">
                        ₹ {cancellationForm.summary.newNet}
                      </div>
                    </div>

                    <div className="w-2" />

                    <div>
                      <div className="text-[13px] font-semibold text-[#818181] mb-1">
                        &nbsp;
                      </div>
                      <div className="px-1 py-2 text-[0.8rem] text-gray-500">
                        {cancellationForm.summary.newMargin}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Advanced Pricing Component */
            <div className="space-y-3">
              <h4 className="text-[13px] font-medium text-gray-700 mb-3">
                Vendor Payment Summary
              </h4>

              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {[
                  { label: "Vendor Base Price", key: "price" },
                  { label: "Vendor Incentive Received", key: "received" },
                  { label: "Commission Paid", key: "payout" },
                  { label: "Cost Price", key: "cost" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 border-b last:border-b-0 border-gray-200"
                  >
                    <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] text-[0.8rem] text-gray-700 font-medium py-5">
                      {item.label}
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
                            amountInputWidth="40%"
                          />
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-blue-600 font-semibold text-[0.9rem]">
                          {`₹ ${derivedCostPrice.toFixed(2)}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-[0.8rem] font-semibold text-gray-700">
                Customer Revenue Summary
              </h4>

              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="grid grid-cols-12">
                  <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] text-[0.8rem] text-gray-700 font-medium py-5">
                    Selling Price
                  </div>

                  <div className="col-span-8 flex flex-col gap-2 py-3 px-4 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-600 text-[0.85rem] font-medium">
                        ₹
                      </div>

                      <div className="flex-1">
                        <MultiCurrencyInput
                          currency={
                            (v.sellingCurrency as "INR" | "USD") || "INR"
                          }
                          onCurrencyChange={(val) => {
                            const next: any = {
                              ...v,
                              sellingCurrency: val,
                            };
                            if (requiresRoe(val as string, businessCurrency)) {
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
                            const sanitized = sanitizeNumeric(val);
                            const next: any = { ...v, sellingprice: sanitized };
                            if (
                              requiresRoe(v.sellingCurrency, businessCurrency)
                            ) {
                              next.sellingInr = computeInr(
                                sanitized,
                                v.sellingRoe ?? "",
                              );
                            } else {
                              next.sellingInr = "";
                            }
                            onChange(next);
                          }}
                          roe={v.sellingRoe || ""}
                          onRoeChange={(val) =>
                            update({
                              sellingRoe: val,
                              sellingInr: computeInr(
                                String(v.sellingprice ?? ""),
                                val,
                              ),
                            })
                          }
                          inr={v.sellingInr || ""}
                          notes={v.sellingNotes || ""}
                          onNotesChange={(val) => update({ sellingNotes: val })}
                          showNotes={showSellingNotesFlag}
                          onToggleNotes={() =>
                            setShowSellingNotesFlag((s) => !s)
                          }
                          businessCurrency={businessCurrency}
                          requiresRoe={requiresRoe}
                          amountInputWidth="40%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-fit rounded-lg p-1 mt-1 bg-white">
                <span className="text-[13px] font-medium text-gray-700 block mb-2">
                  Net
                </span>

                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[13px] font-medium rounded-md">
                    {`INR ${(
                      (Number(v.sellingprice) || 0) - derivedCostPrice
                    ).toFixed(2)}`}
                  </span>

                  <span className="text-[13px] text-gray-700 font-medium">
                    {derivedCostPrice > 0 && v.sellingprice
                      ? `${(
                          (((Number(v.sellingprice) || 0) - derivedCostPrice) /
                            derivedCostPrice) *
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
