"use client";

import type { ReactNode } from "react";
import {
  TbCalculator,
  TbCircleArrowDownLeft,
  TbCircleArrowUpRight,
} from "react-icons/tb";
import {
  formatNumberByStoredCurrency,
  getStoredCurrencySymbol,
} from "@/utils/helper";

type FinanceSummaryPillProps = {
  icon: ReactNode;
  label: string;
  amount: number;
  valueClassName: string;
  labelItalic?: boolean;
};

function FinanceSummaryPill({
  icon,
  label,
  amount,
  valueClassName,
  labelItalic = false,
}: FinanceSummaryPillProps) {
  return (
    <div className="inline-flex items-center gap-4 rounded-full border border-[#ECECEC] bg-white px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[#9A9A9A]">
          {icon}
        </span>
        <span
          className={`text-[14px] text-[#757575] ${labelItalic ? "italic" : ""}`}
        >
          {label}
        </span>
      </div>
      <span className={`text-[14px] font-semibold ${valueClassName}`}>
        {getStoredCurrencySymbol()} {formatNumberByStoredCurrency(amount)}
      </span>
    </div>
  );
}

type FinanceSummaryPillsProps = {
  net: number;
  youGive: number;
  youGet: number;
};

export default function FinanceSummaryPills({
  net,
  youGive,
  youGet,
}: FinanceSummaryPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FinanceSummaryPill
        icon={<TbCalculator className="text-[20px]" />}
        label="Net"
        amount={net}
        valueClassName="text-[#5E9D5A]"
      />
      <FinanceSummaryPill
        icon={<TbCircleArrowUpRight className="text-[22px]" />}
        label="You Give"
        amount={youGive}
        valueClassName="text-[#C85542]"
        labelItalic
      />
      <FinanceSummaryPill
        icon={<TbCircleArrowDownLeft className="text-[22px]" />}
        label="You Get"
        amount={youGet}
        valueClassName="text-[#5E9D5A]"
        labelItalic
      />
    </div>
  );
}
