"use client";

import React, { useMemo } from "react";
import { TbNotes } from "react-icons/tb";
import DropDown from "./DropDown";

type Currency = "USD" | "INR";

type MultiCurrencyInputProps = {
  // Currency selection
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;

  // Amount field
  amount: string;
  onAmountChange: (amount: string) => void;
  amountPlaceholder?: string;

  // ROE field (only shown when requiresRoe returns true)
  roe: string;
  onRoeChange: (roe: string) => void;

  // INR field (computed, read-only)
  inr: string;

  // Notes
  notes: string;
  onNotesChange: (notes: string) => void;
  showNotes: boolean;
  onToggleNotes: () => void;
  notesPlaceholder?: string;

  // Business currency to determine if ROE is needed
  businessCurrency: string | null;

  // Helper function to check if ROE is required
  requiresRoe: (currency: string, businessCurrency: string | null) => boolean;

  // Optional: Override the input element class for notes
  inputClassName?: string;

  // Optional: Use white background for currency dropdown instead of gray
  useWhiteDropdown?: boolean;
};

const groupBase =
  "flex items-center border border-gray-200 rounded-md overflow-hidden bg-white";

const groupInput =
  "h-[34px] px-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 outline-none flex-1";

const addonLabel =
  "h-[34px] px-2 text-[0.72rem] text-gray-600 bg-gray-50 border-r border-gray-200 flex items-center";

const noteBtn =
  "w-9 h-9 rounded-md bg-[#FFF2D6] hover:bg-[#FFE8B7] transition flex items-center justify-center";

const inputBase =
  "w-full border border-gray-200 rounded-md px-3 py-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600";

const groupSelectWhite =
  "h-[34px] px-2 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 flex items-center justify-center";

export default function MultiCurrencyInput({
  currency,
  onCurrencyChange,
  amount,
  onAmountChange,
  amountPlaceholder = "Enter Amount",
  roe,
  onRoeChange,
  inr,
  notes,
  onNotesChange,
  showNotes,
  onToggleNotes,
  notesPlaceholder = "Enter your notes here",
  businessCurrency,
  requiresRoe,
  inputClassName,
  useWhiteDropdown = true,
}: MultiCurrencyInputProps) {
  const showRoeFields = requiresRoe(currency, businessCurrency);

  const computedInr = useMemo(() => {
    if (!showRoeFields) return "";
    if (String(inr ?? "").trim() !== "") return String(inr);

    const amountNum = Number(String(amount ?? "").replace(/,/g, ""));
    const roeNum = Number(String(roe ?? "").replace(/,/g, ""));
    if (
      !isFinite(amountNum) ||
      !isFinite(roeNum) ||
      amountNum === 0 ||
      roeNum === 0
    ) {
      return "";
    }

    const product = amountNum * roeNum;
    const hasFraction = Math.abs(product - Math.round(product)) > 1e-9;
    return product.toLocaleString("en-US", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }, [amount, roe, inr, showRoeFields]);

  return (
    <>
      <div
        className={`grid ${
          showRoeFields
            ? "grid-cols-[220px_160px_170px_44px]"
            : "grid-cols-[380px_44px]"
        } gap-3 items-center`}
      >
        {/* Currency + Amount */}
        <div className={groupBase}>
          <DropDown
            options={[
              { value: "INR", label: "INR" },
              { value: "USD", label: "USD" },
            ]}
            value={currency}
            onChange={(val) => onCurrencyChange(val as Currency)}
            customWidth="w-[64px]"
            noBorder={true}
            noButtonRadius={true}
            focusRingClass=""
            buttonClassName={`${useWhiteDropdown ? "bg-white" : "bg-gray-50"} text-[0.78rem] text-gray-700 px-2 h-[34px]`}
            className={groupSelectWhite}
          />
          <input
            className={groupInput}
            type="text"
            placeholder={amountPlaceholder}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
        </div>

        {/* ROE field (conditional) */}
        {showRoeFields && (
          <>
            <div className={groupBase}>
              <span className={addonLabel}>ROE</span>
              <input
                value={roe}
                onChange={(e) => onRoeChange(e.target.value)}
                className={groupInput}
                placeholder=""
              />
            </div>

            {/* INR field (read-only) */}
            <div className="flex items-center border border-gray-200 rounded-md bg-[#FFF7E7] overflow-hidden h-[34px]">
              <span className="px-2 text-[0.78rem] text-gray-700 border-r border-gray-200 bg-[#FFF7E7]">
                INR
              </span>
              <div className="flex-1 px-2 text-[0.78rem] text-gray-700 bg-[#FFF7E7]">
                {computedInr || ""}
              </div>
            </div>
          </>
        )}

        {/* Notes toggle button */}
        <button
          type="button"
          className={noteBtn}
          aria-label="Add notes"
          onClick={onToggleNotes}
        >
          <TbNotes size={16} className="text-[#F59E0B]" />
        </button>
      </div>

      {/* Notes input (conditional) */}
      {showNotes && (
        <div className="mt-3">
          <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1">
            Notes
          </label>
          <input
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className={inputClassName || inputBase}
            placeholder={notesPlaceholder}
          />
        </div>
      )}
    </>
  );
}
