"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useLayoutEffect, useRef } from "react";
import FilterSkeleton from "@/components/skeletons/FilterSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import type { FilterState } from "@/components/Filter";
import type { JSX } from "react";
import { CiFilter } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import { AiOutlineEye } from "react-icons/ai";
import { LuFileText } from "react-icons/lu";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import { getNextTriSortState, type TriSortState } from "@/utils/sorting";

const Filter = dynamic(() => import("@/components/Filter"), {
  loading: () => <FilterSkeleton />,
  ssr: false,
});

// const SummaryCards = dynamic(() => import("@/components/SummaryCards"), {
//   loading: () => <SummaryCardsSkeleton />,
//   ssr: false,
// });

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type JournalStatus = "Active" | "Cancelled";
type JournalCategory = "Bank Charges" | "Commission Payout";

type JournalRow = {
  id: string;
  journalName: string;
  notes?: string;
  balance: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  category: JournalCategory;
  status: JournalStatus;
};

type JournalFilterState = FilterState;

const columns: string[] = [
  "Balance",
  "Journal",
  "Date Created",
  "Last Updated",
  "Category",
  "Actions",
];

const columnIconMap: Record<string, JSX.Element> = {
  "Date Created": (
    <TbArrowsUpDown className="inline w-3 h-3 text-white stroke-[1.5]" />
  ),
  Category: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
};

const formatDMY = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const isWithinRange = (rawDate: string, start: string, end: string) => {
  const dt = new Date(rawDate);
  if (isNaN(dt.getTime())) return false;

  if (start) {
    const s = new Date(start);
    if (dt < s) return false;
  }
  if (end) {
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    if (dt > e) return false;
  }
  return true;
};

const dummyJournals: JournalRow[] = [
  {
    id: "jrnl-1",
    journalName: "Bank Charges (1)",
    notes: "Monthly bank fees",
    balance: -1500,
    createdAt: "2025-11-12T00:00:00.000Z",
    updatedAt: "2026-01-07T00:00:00.000Z",
    category: "Bank Charges",
    status: "Active",
  },
  {
    id: "jrnl-2",
    journalName: "Commission (1)",
    notes: "Partner payout",
    balance: -700,
    createdAt: "2025-11-09T00:00:00.000Z",
    updatedAt: "2026-01-06T00:00:00.000Z",
    category: "Commission Payout",
    status: "Active",
  },
  {
    id: "jrnl-3",
    journalName: "Commission (2)",
    notes: "Agent payout",
    balance: -1200,
    createdAt: "2025-10-28T00:00:00.000Z",
    updatedAt: "2026-01-07T00:00:00.000Z",
    category: "Commission Payout",
    status: "Active",
  },
  {
    id: "jrnl-4",
    journalName: "Bank Charges (2)",
    notes: "Bank transfer charges",
    balance: -400,
    createdAt: "2025-10-10T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    category: "Bank Charges",
    status: "Cancelled",
  },
];

const FinanceJournalsPage = () => {
  const tabOptions: JournalStatus[] = ["Active", "Cancelled"];
  const [activeTab, setActiveTab] = useState<JournalStatus>("Active");

  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const update = () => {
      const container = tabContainerRef.current;
      if (!container) return;
      const activeBtn = container.querySelector(
        `[data-tab="${activeTab}"]`,
      ) as HTMLElement | null;
      if (!activeBtn) return;

      const shrinkPx = 5;
      const left = activeBtn.offsetLeft + Math.round(shrinkPx / 2);
      const width = Math.max(0, activeBtn.offsetWidth - shrinkPx);
      setIndicator({ left, width });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab]);

  const [filters, setFilters] = useState<JournalFilterState>({
    serviceType: "",
    status: "",
    owner: "",
    bookingType: "",
    category: "",
    search: "",
    bookingStartDate: "",
    bookingEndDate: "",
    tripStartDate: "",
    tripEndDate: "",
    primaryOwner: "",
    secondaryOwners: [],
  });

  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });

  const filteredJournals = useMemo(() => {
    return dummyJournals.filter((j) => {
      if (j.status !== activeTab) return false;

      if (filters.category) {
        if (j.category !== filters.category) return false;
      }

      const search = filters.search.trim().toLowerCase();
      if (search) {
        const inName = j.journalName.toLowerCase().includes(search);
        const inNotes = (j.notes || "").toLowerCase().includes(search);
        if (!inName && !inNotes) return false;
      }

      if (filters.bookingStartDate || filters.bookingEndDate) {
        if (
          !isWithinRange(
            j.createdAt,
            filters.bookingStartDate,
            filters.bookingEndDate,
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, filters]);

  const handleSort = (column: string) => {
    if (column !== "Date Created") return;
    setSortState((prev) => getNextTriSortState(prev, column));
  };

  const sortedJournals = useMemo(() => {
    if (sortState.key !== "Date Created" || sortState.direction === "none") {
      return filteredJournals;
    }

    const withIndex = filteredJournals.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));

    withIndex.sort((a, b) => {
      const at = new Date(a.item.createdAt).getTime();
      const bt = new Date(b.item.createdAt).getTime();

      const aValid = !isNaN(at);
      const bValid = !isNaN(bt);
      if (!aValid && !bValid) return a.originalIndex - b.originalIndex;
      if (!aValid) return 1;
      if (!bValid) return -1;

      const diff = at - bt;
      if (diff !== 0) return sortState.direction === "asc" ? diff : -diff;
      return a.originalIndex - b.originalIndex;
    });

    return withIndex.map((x) => x.item);
  }, [filteredJournals, sortState.direction, sortState.key]);

  const tableData = useMemo<JSX.Element[][]>(() => {
    return sortedJournals.map((j, index) => {
      const amountClass = j.balance < 0 ? "text-red-600" : "text-emerald-600";
      const absAmount = Math.abs(j.balance);

      const categoryPill =
        j.category === "Bank Charges"
          ? {
              dot: "bg-blue-500",
              label: "Bank Charges",
            }
          : {
              dot: "bg-red-500",
              label: "Commission Payout",
            };

      return [
        <td
          key={`bal-${j.id}`}
          className={`px-4 py-3 text-center font-semibold align-middle h-[3rem] ${amountClass}`}
        >
          ₹ {absAmount.toLocaleString("en-IN")}
        </td>,
        <td
          key={`name-${j.id}`}
          className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
        >
          {j.journalName}
        </td>,
        <td
          key={`created-${j.id}`}
          className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
        >
          {formatDMY(j.createdAt)}
        </td>,
        <td
          key={`updated-${j.id}`}
          className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
        >
          {formatDMY(j.updatedAt)}
        </td>,
        <td
          key={`cat-${j.id}`}
          className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
        >
          <div className="flex items-center justify-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm ${categoryPill.dot}`} />
            <span>{categoryPill.label}</span>
          </div>
        </td>,
        <td
          key={`actions-${j.id}`}
          className="px-4 py-3 text-center align-middle h-[3rem]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 transition-all duration-200 opacity-0 pointer-events-none group-[.row-actions-active]:opacity-100 group-[.row-actions-active]:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
          >
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FFF3C8] text-[#7A5A00] border border-[#FFE9A3] hover:bg-[#FFE9A3] text-[12px] font-semibold"
              onClick={() => {
                // placeholder
                console.log("View ledger", j.id);
              }}
            >
              <AiOutlineEye size={16} />
              View ledger
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-md bg-white border border-orange-200 text-orange-600 flex items-center justify-center hover:bg-orange-50"
              onClick={() => {
                console.log("Open journal", j.id);
              }}
              aria-label="Open journal"
            >
              <LuFileText size={16} />
            </button>

            <ActionMenu
              actions={[
                {
                  label: "Edit",
                  icon: <MdOutlineEdit />,
                  color: "text-blue-600",
                  onClick: () => console.log("Edit journal", j.id),
                },
                {
                  label: "Delete",
                  icon: <FaRegTrashAlt />,
                  color: "text-red-600",
                  onClick: () => console.log("Delete journal", j.id),
                },
              ]}
              right="right-15"
            />
          </div>
        </td>,
      ];
    });
  }, [sortedJournals]);

  const handleFilterChange = (next: JournalFilterState) => {
    setFilters(next);
  };

  return (
    <div className="bg-gray-50">
      <div className="min-h-screen">
        <Filter
          onFilterChange={handleFilterChange}
          createButtonText="+ New Journal"
          onCreateClick={() => console.log("Create new journal")}
          showCreateButton
          showOwners={false}
          showTravelDateFilter={false}
          showBookingDateFilter
          bookingDateLabel="Date Range"
          showCategory
          allowAdvanceOwnerSearch={true}
          categories={[
            { value: "Bank Charges", label: "Bank Charges" },
            { value: "Commission Payout", label: "Commission Payout" },
          ]}
          searchPlaceholder="Search by Name/Notes"
          searchWidth="w-[22rem]"
        />

        <div className="bg-white rounded-2xl shadow mt-4 pt-5 pb-3 px-3 relative">
          <div className="flex w-full justify-between items-center mb-2">
            <div
              ref={tabContainerRef}
              style={{ width: "fit-content" }}
              className="flex w-[14rem] ml-2 items-center bg-[#F3F3F3] rounded-xl relative py-1.5 gap-6"
            >
              <div
                className="absolute h-[calc(100%-0.5rem)] bg-[#0D4B37] rounded-xl shadow-sm transition-all duration-300 ease-in-out top-1"
                style={{
                  left: `${indicator.left}px`,
                  width: `${indicator.width}px`,
                }}
              />

              {tabOptions.map((tab) => (
                <button
                  key={tab}
                  data-tab={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative z-10 py-1 px-4 rounded-lg text-[14px] font-medium transition-colors duration-300 text-center ${
                    activeTab === tab
                      ? "text-white"
                      : "text-[#818181] hover:text-gray-900 font-semibold"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
              <span className="text-gray-600 text-[14px] font-medium">
                Total
              </span>
              <span className="bg-gray-100 text-black font-semibold text-[14px] px-2 mr-1 rounded-lg shadow-sm">
                {filteredJournals.length}
              </span>
            </div>
          </div>

          <div className="p-2 mt-2">
            <Table
              data={tableData}
              columns={columns}
              columnIconMap={columnIconMap}
              onSort={handleSort}
              categoryName="Journals"
              headerAlign={{ Balance: "center" }}
              enableRowHoverActions
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceJournalsPage;
