"use client";

import React, { useMemo } from "react";
import { RiExchangeDollarLine } from "react-icons/ri";
import { FaArrowCircleLeft, FaRegArrowAltCircleRight } from "react-icons/fa";

// Type definitions
interface SummaryData {
  total: {
    amount: string;
    change: string;
    isPositive: boolean;
  };
  youGive: {
    amount: string;
    change: string;
    isPositive: boolean;
  };
  youGet: {
    amount: string;
    change: string;
    isPositive: boolean;
  };
}

interface SummaryCardsProps {
  data?: SummaryData;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  // Default data with proper typing
  const defaultData: SummaryData = useMemo(
    () => ({
      total: {
        amount: "₹ 12,45,890",
        change: "+8.5% from last month",
        isPositive: true,
      },
      youGive: {
        amount: "₹ 8,45,620",
        change: "-3.2% from last month",
        isPositive: false,
      },
      youGet: {
        amount: "₹ 4,00,270",
        change: "+12.3% from last month",
        isPositive: true,
      },
    }),
    []
  );

  const summaryData = data || defaultData;

  // Memoized change text styling
  const getChangeTextClass = useMemo(
    () =>
      (isPositive: boolean): string =>
        isPositive
          ? "text-green-600 mt-2 font-medium"
          : "text-red-500 mt-2 font-medium",
    []
  );

  return (
    <div className="flex flex-col md:flex-row mb-4 mx-[-2px] mt-4">
      {/* Total Card */}
      <div className="bg-white border border-blue-100 rounded-2xl shadow p-4 flex flex-col justify-between h-fit w-[16.25rem] min-w-[220px] md:mr-[140px] hover:shadow-lg transition-shadow">
        <span className="text-gray-500 text-lg mb-2">Total</span>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-[#114958]">
            {summaryData.total.amount}
          </span>
          <div className="bg-blue-100 rounded-full p-3">
            <RiExchangeDollarLine className="text-[#114958]" size={23} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 ml-auto">
        {/* You Give Card */}
        <div className="bg-white border border-red-100 rounded-2xl shadow p-4 flex flex-col justify-between h-fit w-[15rem] min-w-[120px] md:mr-6 hover:shadow-lg transition-shadow">
          <span className="text-gray-500 text-lg mb-2">You Give</span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-black">
              {summaryData.youGive.amount}
            </span>
            <div className="bg-red-100 rounded-full p-3">
              <FaArrowCircleLeft className="text-red-500" size={20} />
            </div>
          </div>
        </div>

        {/* You Get Card */}
        <div className="bg-white border border-green-100 rounded-2xl shadow p-4 flex flex-col justify-between h-fit w-[15rem] min-w-[120px] hover:shadow-lg transition-shadow">
          <span className="text-gray-500 text-lg mb-2">You Get</span>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-black">
              {summaryData.youGet.amount}
            </span>
            <div className="bg-green-100 rounded-full p-3">
              <FaRegArrowAltCircleRight className="text-green-500" size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SummaryCards);
