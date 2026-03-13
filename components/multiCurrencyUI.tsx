"use client";

import React, { useMemo } from "react";
import DropDown from "./DropDown";
import NotesButtonToolTip from "./NotesButtonToolTip";
import { CURRENCIES } from "../utils/currencies";
import StyledDescription from "./StyledDescription";
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

  // Optional: direct width for the notes input
  notesInputWidth?: string;

  // Optional: direct width for the amount input
  amountInputWidth?: string;
  // Optional: Use white background for currency dropdown instead of gray
  useWhiteDropdown?: boolean;
  readOnly?: boolean;
};

const groupBase =
  "flex items-center border border-gray-200 rounded-[15px] overflow-hidden bg-white";

const groupInput =
  "h-[34px] px-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 outline-none rounded-[15px]";

const addonLabel =
  "h-[34px] px-2 text-[0.72rem] font-[500] bg-[#F9F9F9] text-[#414141] border-r border-gray-200 flex items-center";

const inputBase =
  "w-full border border-gray-200 rounded-[15px] px-3 py-2 text-[0.78rem] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600";

const groupSelectWhite =
  "h-[34px] px-0 text-[0.78rem] bg-white text-gray-700 border-r border-gray-200 rounded-[15px]";

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
  notesInputWidth,
  amountInputWidth,
  readOnly = false,
}: MultiCurrencyInputProps) {
  const showRoeFields = requiresRoe(currency, businessCurrency);

  const gridTemplate = showRoeFields
    ? `${amountInputWidth ?? "220px"} 90px 250px`
    : `${amountInputWidth ?? "380px"} 44px`;

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
        className={`grid gap-3 items-center`}
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {/* Currency + Amount */}
        <div className={groupBase}>
          <DropDown
            options={CURRENCIES.map((c) => ({
              value: c.value,
              label: `${c.value}`,
              buttonLabel: c.value,
              searchLabel: `${c.value} ${c.label} ${c.symbol}`,
            }))}
            value={currency}
            onChange={(val) => onCurrencyChange(val as Currency)}
            customWidth="w-[60px]"
            menuWidth="w-[70px]"
            noBorder={true}
            noButtonRadius={true}
            focusRingClass=""
            buttonClassName={` text-[11px] text-gray-700 h-[34px] rounded-l-[15px]`}
            className={groupSelectWhite}
            typeable
            readOnly={readOnly}
            menuClassName="rounded-[15px] scrollbar-thin"
          />
          <input
            className={`${groupInput} flex-1${readOnly ? "cursor-not-allowed" : ""}`}
            type="text"
            placeholder={amountPlaceholder}
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            readOnly={readOnly}
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
                className={`${groupInput} flex-1${readOnly ? "cursor-not-allowed" : ""}`}
                placeholder=""
                readOnly={readOnly}
              />
            </div>

            {/* INR field + Notes*/}
            <div className="flex items-center gap-3">
              <div className="flex w-fit items-center border border-gray-200 rounded-[15px] bg-[#F6F2E8] overflow-hidden h-[34px]">
                <span className="px-2 text-[0.78rem] text-[#414141] bg-[#F6F2E8]">
                  INR
                </span>
                <div className="flex-1 px-2 text-[0.78rem] text-[#414141] bg-[#F6F2E8]">
                  {computedInr || "0"}
                </div>
              </div>
              <div className="rounded-[12px]">
                <NotesButtonToolTip onClick={onToggleNotes} />
              </div>
            </div>
          </>
        )}

        {/* Notes button for non-ROE layout */}
        {!showRoeFields && (
          <div className="rounded-[12px]">
            <NotesButtonToolTip onClick={onToggleNotes} />
          </div>
        )}
      </div>

      {/* Notes input */}
      {showNotes && (
        <div className="mt-3">
          <label className="block text-[0.78rem] font-[500] text-gray-700 mb-1">
            Notes
          </label>
          <div className="-mt-4">
            <StyledDescription
              value={notes}
              onChange={onNotesChange}
              readOnly={readOnly}
              boxWidth={notesInputWidth ?? "w-[99%]"}
              label=""
              rows={2}
            />
          </div>
        </div>
      )}
    </>
  );
}
