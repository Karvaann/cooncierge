"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import type { JSX } from "react";
import DateRangeInput from "@/components/DateRangeInput";
import dynamic from "next/dynamic";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { HiArrowsUpDown } from "react-icons/hi2";
import {
  getNextTriSortState,
  type TriSortState,
  getItemTimestamp,
} from "@/utils/sorting";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

// Column definitions
const columns: string[] = [
  "Payment ID",
  "Party Name",
  "Linked Booking",
  "Amount",
  "Account",
  "Date",
  "Actions",
];

const columnIconMap: Record<string, JSX.Element> = {
  Date: (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
};

// Dummy payment data
type PaymentRow = {
  paymentId: string;
  partyName: string;
  linkedBooking: string;
  amount: number;
  amountType: "gave" | "got";
  account: string;
  date: string;
  createdAt: string;
};

const dummyPayments: PaymentRow[] = [
  {
    paymentId: "PO-ABC01",
    partyName: "Anand Mishra",
    linkedBooking: "OS42J4D",
    amount: 24580,
    amountType: "gave",
    account: "Bank 1",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PI-ABC02",
    partyName: "Deepanshu",
    linkedBooking: "OS42J4S",
    amount: 24580,
    amountType: "got",
    account: "Bank 1",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PO-ABC03",
    partyName: "Anand Mishra",
    linkedBooking: "OS42J4J",
    amount: 24580,
    amountType: "gave",
    account: "Cash",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PI-ABC04",
    partyName: "Anand Mishra",
    linkedBooking: "OS42J6K",
    amount: 24580,
    amountType: "got",
    account: "Bank 2",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PI-ABC05",
    partyName: "Deepanshu",
    linkedBooking: "OS42J4J",
    amount: 24580,
    amountType: "got",
    account: "Bank 2",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PI-ABC06",
    partyName: "Deepanshu",
    linkedBooking: "OS42J4D",
    amount: 24580,
    amountType: "got",
    account: "Bank 1",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PI-ABC07",
    partyName: "Anand Mishra",
    linkedBooking: "OS42J4J",
    amount: 24580,
    amountType: "got",
    account: "Bank 2",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PO-ABC08",
    partyName: "Anand Mishra",
    linkedBooking: "OS42J4D",
    amount: 24580,
    amountType: "gave",
    account: "Cash",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
  {
    paymentId: "PI-ABC09",
    partyName: "Deepanshu",
    linkedBooking: "OS42J4S",
    amount: 24580,
    amountType: "got",
    account: "Bank 1",
    date: "10-09-2025, 10:00 AM",
    createdAt: "2025-09-10T10:00:00Z",
  },
];

const PaymentsPage = () => {
  const tabOptions = useMemo(
    () => ["Approved", "Pending", "Deleted", "Denied"],
    []
  );
  const [activeTab, setActiveTab] = useState<string>(() => tabOptions[0] ?? "");

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = tabOptions.indexOf(activeTab);
      const activeEl = tabRefs.current[activeIndex];
      const container = tabsContainerRef.current;
      if (activeEl && container) {
        const { width, left } = activeEl.getBoundingClientRect();
        const containerLeft = container.getBoundingClientRect().left;
        setIndicatorStyle({ width, left: left - containerLeft });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabOptions]);

  const totalCount = useMemo(() => 78, []);

  // Date range + search state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // Sorting state
  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });

  const handleSort = (column: string) => {
    if (column !== "Date") return;
    setSortState((prev) => getNextTriSortState(prev, column));
  };

  // Apply sorting to payments
  const sortedPayments = useMemo(() => {
    const payments = [...dummyPayments];

    if (!sortState.key || sortState.direction === "none") {
      return payments;
    }

    const withIndex = payments.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));

    withIndex.sort((a, b) => {
      let cmp = 0;
      if (sortState.key === "Date") {
        const ta = new Date(a.item.createdAt).getTime();
        const tb = new Date(b.item.createdAt).getTime();
        cmp = ta - tb;
      }

      if (cmp === 0) return a.originalIndex - b.originalIndex;
      return sortState.direction === "asc" ? cmp : -cmp;
    });

    return withIndex.map((x) => x.item);
  }, [sortState]);

  // Convert payments to table data
  const tableData = useMemo<JSX.Element[][]>(() => {
    return sortedPayments.map((payment, index) => {
      const cells: JSX.Element[] = [];

      cells.push(
        <td
          key={`paymentId-${index}`}
          className="px-4 py-3 font-[500] text-left"
        >
          {payment.paymentId}
        </td>,
        <td key={`partyName-${index}`} className="px-4 py-3 text-center">
          {payment.partyName}
        </td>,
        <td key={`linkedBooking-${index}`} className="px-4 py-3 text-center">
          {payment.linkedBooking}
        </td>,
        <td key={`amount-${index}`} className="px-4 py-3 text-center">
          <span
            className={`font-semibold ${
              payment.amountType === "gave" ? "text-red-600" : "text-green-600"
            }`}
          >
            {payment.amountType === "gave" ? "⊖" : "⊕"} ₹{" "}
            {payment.amount.toLocaleString()}
          </span>
        </td>,
        <td key={`account-${index}`} className="px-4 py-3 text-center">
          {payment.account}
        </td>,
        <td key={`date-${index}`} className="px-4 py-3 text-center">
          {payment.date}
        </td>,
        <td key={`actions-${index}`} className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="bg-[#E0F2E9] text-[#0D4B37] px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-gray-200 hover:bg-[#d0e7dc]"
            >
              👁 View
            </button>
            <ActionMenu
              actions={[
                {
                  label: "Edit",
                  icon: <FaRegEdit />,
                  color: "text-blue-600",
                  onClick: () => {
                    console.log("Edit payment:", payment.paymentId);
                  },
                },
                {
                  label: "Delete",
                  icon: <FaRegTrashAlt />,
                  color: "text-red-600",
                  onClick: () => {
                    console.log("Delete payment:", payment.paymentId);
                  },
                },
              ]}
              width="w-22"
            />
          </div>
        </td>
      );

      return cells;
    });
  }, [sortedPayments]);

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/* Tabs */}
        <div
          className="flex items-center bg-[#F3F3F3] gap-[28px] rounded-[10px] relative p-1"
          ref={tabsContainerRef}
        >
          <div
            className="absolute h-[calc(100%-0.60rem)] bg-[#0D4B37] rounded-[8px] shadow-sm transition-all duration-300 ease-in-out top-1/2 -translate-y-1/2"
            style={{
              width:
                indicatorStyle.width > 0
                  ? `${indicatorStyle.width}px`
                  : `calc((100% - 3.25rem) / ${tabOptions.length})`,
              left: `${indicatorStyle.left}px`,
            }}
          />

          {tabOptions.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              ref={(el) => { tabRefs.current[idx] = el; }}
              className={`relative z-10 px-[12px] py-[6px] rounded-[8px] text-[14px] font-medium transition-colors duration-300 flex-1 ${
                activeTab === tab
                  ? "text-white"
                  : "text-[#818181] hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Total + Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
            <span className="text-gray-600 text-[0.85rem] font-medium">
              Total
            </span>
            <span className="bg-gray-100 text-black font-semibold text-[0.85rem] px-2 mr-1 rounded-lg shadow-sm">
              {totalCount}
            </span>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white font-medium">
            <span className="text-sm">You Gave</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-medium">
            <span className="text-sm">You Got</span>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 mb-4 mt-3"></div>

      {/* Date range + Search row */}
      <div className="flex items-center justify-between mb-4 px-2 gap-4">
        <div className="flex items-center gap-4">
          <DateRangeInput
            label="Booking Date"
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
        </div>

        <div className="flex-1 max-w-xl ml-auto">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by Payment ID/Party Name"
              className="w-full text-[0.95rem] py-3 pl-4 pr-10 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D4B37] text-gray-700 bg-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <FiSearch />
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-[200px] mt-2 px-2">
        <Table
          data={tableData}
          columns={columns}
          columnIconMap={columnIconMap}
          onSort={handleSort}
          categoryName="Payments"
        />
      </div>
    </div>
  );
};

export default PaymentsPage;
