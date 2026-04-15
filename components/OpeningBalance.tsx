"use client";
import React from "react";
import { getStoredCurrencySymbol } from "@/utils/helper";

type Props = {
  readOnly?: boolean;
  balanceType: "debit" | "credit";
  setBalanceType: (v: "debit" | "credit") => void;
  balanceAmount: string;
  setBalanceAmount: (v: string) => void;
  showAlertOnInvalid?: boolean;
};

const OpeningBalance: React.FC<Props> = ({
  readOnly,
  balanceType,
  setBalanceType,
  balanceAmount,
  setBalanceAmount,
  showAlertOnInvalid = false,
}) => {
  return (
    <div className="border border-gray-200 rounded-[15px] p-3.5">
      <h2 className="text-[13px] font-medium mb-2">Opening Balance</h2>
      <hr className="mt-1 mb-3 border-t border-gray-200" />

      <div className="flex items-center gap-6 mb-3">
        <label className="flex items-center gap-2 cursor-pointer text-[13px]">
          <input
            type="radio"
            name="balanceType"
            value="debit"
            checked={balanceType === "debit"}
            onChange={() => setBalanceType("debit")}
            className="w-3 h-3 accent-[#7135AD]"
            disabled={readOnly}
          />
          <span className="text-gray-700">Debit</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-[13px]">
          <input
            type="radio"
            name="balanceType"
            value="credit"
            checked={balanceType === "credit"}
            onChange={() => setBalanceType("credit")}
            className="w-3 h-3 accent-[#7135AD]"
            disabled={readOnly}
          />
          <span className="text-gray-700">Credit</span>
        </label>
      </div>

      <div className="relative">
        <div className="flex items-center border border-gray-300 rounded-[15px] px-3 py-2 focus-within:ring-1 focus-within:ring-[#7135AD]">
          <span className="text-gray-500 mr-2 text-[13px]">
            {getStoredCurrencySymbol()}
          </span>
          <input
            type="text"
            value={balanceAmount}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setBalanceAmount(value);
              } else {
                if (showAlertOnInvalid) {
                  alert(
                    "Please enter only numbers. Letters and special characters are not allowed.",
                  );
                }
              }
            }}
            placeholder={
              balanceType === "debit"
                ? "Enter Debit Amount"
                : "Enter Credit Amount"
            }
            disabled={readOnly}
            className="flex-1 outline-none text-[#020202] text-[13px] disabled:bg-gray-100 disabled:text-gray-700 hover:border-[#7135AD] focus:ring-[#7135AD]"
          />
        </div>
        <div className="absolute right-3 top-2 text-sm font-medium">
          {balanceType === "debit" ? (
            <span className=" text-[#EB382B] text-[11px] font-[600]">
              Customer pays you {getStoredCurrencySymbol()}{" "}
              {balanceAmount || ""}
            </span>
          ) : (
            <span className="text-[#4CA640] text-[11px] font-[600]">
              You pay the customer {getStoredCurrencySymbol()}{" "}
              {balanceAmount || ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpeningBalance;
