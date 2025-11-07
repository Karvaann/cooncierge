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
      <div className="bg-white border border-blue-100 rounded-2xl shadow p-3 flex flex-col justify-between h-fit w-[12.25rem] min-w-[220px] md:mr-[140px] hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-500 text-[0.75rem] mb-1">Total</div>
            <div className="text-[1.15rem] font-medium text-[#114958]">
              {summaryData.total.amount}
            </div>
          </div>
         
          <div className="bg-blue-100 rounded-full p-3">
            <RiExchangeDollarLine className="text-[#114958]" size={14} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 ml-auto">
        {/* You Give Card */}
        <div className="bg-white border border-red-100 rounded-2xl shadow p-4 flex flex-col justify-between h-fit w-[12.25rem] min-w-[120px] md:mr-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-[0.75rem] mb-2">You Give</div>
              <div className="text-[1.15rem] font-medium text-black">
                {summaryData.youGive.amount}
              </div>

            </div>
            
            <div className="bg-red-100 rounded-full p-3">
              <FaArrowCircleLeft className="text-red-500" size={16} />
            </div>
          </div>
        </div>

        {/* You Get Card */}
        <div className="bg-white border border-green-100 rounded-2xl shadow p-4 flex flex-col justify-between h-fit w-[12.25rem] min-w-[120px] hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-[0.75rem] mb-2">You Get</div>
              <div className="text-[1.15rem] font-medium text-black">
                {summaryData.youGet.amount}
              </div>
            </div>
            
            <div className="bg-green-100 rounded-full p-3">
              <FaRegArrowAltCircleRight className="text-green-500" size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SummaryCards);
