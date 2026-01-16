"use client";

import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import type { JSX } from "react";
import dynamic from "next/dynamic";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import DropDown from "@/components/DropDown";
import AvatarTooltip from "@/components/AvatarToolTip";
import { TbArrowsUpDown } from "react-icons/tb";
import { CiFilter } from "react-icons/ci";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

// Column definitions
const columns: string[] = [
  "Customer ID",
  "Name",
  "Owner",
  "Closing Balance",
  "Actions",
];

// Dummy customer data
type CustomerRow = {
  customerId: string;
  name: string;
  ownerNames: string[]; // Array of owner full names
  closingBalance: number;
  balanceType: "debit" | "credit"; // debit = you give (red), credit = you get (green)
};

const dummyCustomers: CustomerRow[] = [
  {
    customerId: "CU-AB001",
    name: "Jatin Sharma",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-AB002",
    name: "Deepanshu",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    customerId: "CU-AB003",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    customerId: "CU-AB004",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-AB005",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    customerId: "CU-AB006",
    name: "Deepanshu",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-AB007",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-AB008",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-AB009",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    customerId: "CU-AB010",
    name: "Deepanshu",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
];

// Color palette for owner avatars
const colorPalette = [
  "border-pink-700 text-pink-700",
  "border-[#AF52DE] text-[#AF52DE]",
  "border-[#5856D6] text-[#5856D6]",
  "border-cyan-700 text-cyan-700",
  "border-emerald-700 text-emerald-700",
  "border-amber-700 text-amber-700",
];

// Helper function to compute initials from full name
const computeInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase();
};

// Helper function to get dynamic color for owner
const getOwnerColor = (index: number): string => {
  if (colorPalette.length === 0) return "";
  const idx = index % colorPalette.length;
  return colorPalette[idx] ?? "";
};

// Column icons (re-using helper pattern from finance bookings page)
const columnIconMap: Record<string, JSX.Element> = {
  Name: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
  Owner: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
  "Closing Balance": (
    <TbArrowsUpDown className="inline w-3 h-3 text-white stroke-[1]" />
  ),
};

const FinanceCustomersPage = () => {
  // Calculate totals
  const { youGet, youGive } = useMemo(() => {
    const get = dummyCustomers
      .filter((c) => c.balanceType === "credit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    const give = dummyCustomers
      .filter((c) => c.balanceType === "debit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    return { youGet: get, youGive: give };
  }, []);

  // Search state
  const [searchValue, setSearchValue] = useState("");
  const [searchFilter, setSearchFilter] = useState<
    "owner" | "customerId" | "customerName"
  >("owner");

  // Filter options for dropdown
  const filterOptions = useMemo(
    () => [
      { value: "owner", label: "Owner" },
      { value: "customerId", label: "Customer ID" },
      { value: "customerName", label: "Customer Name" },
    ],
    []
  );

  // Dynamic placeholder based on selected filter
  const searchPlaceholder = useMemo(() => {
    switch (searchFilter) {
      case "owner":
        return "Search by Owner";
      case "customerId":
        return "Search by Customer ID";
      case "customerName":
        return "Search by Customer Name";
      default:
        return "Search...";
    }
  }, [searchFilter]);

  // Convert customers to table data
  const tableData = useMemo<JSX.Element[][]>(() => {
    return dummyCustomers.map((customer, index) => {
      const cells: JSX.Element[] = [];

      cells.push(
        <td
          key={`customerId-${index}`}
          className="px-4 py-3  font-[500] text-[14px] text-center"
        >
          {customer.customerId}
        </td>,
        <td key={`name-${index}`} className="px-4 py-3 text-[14px] text-center">
          {customer.name}
        </td>,
        <td key={`owner-${index}`} className="px-4 py-3 text-center">
          <div className="flex items-center justify-center">
            {customer.ownerNames.map((ownerName, idx) => (
              <AvatarTooltip
                key={idx}
                short={computeInitials(ownerName)}
                full={ownerName}
                color={getOwnerColor(idx)}
              />
            ))}
          </div>
        </td>,
        <td
          key={`balance-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
          <span
            className={`font-semibold ${
              customer.balanceType === "debit"
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {customer.balanceType === "debit" ? "⊖" : "⊕"} ₹{" "}
            {customer.closingBalance.toLocaleString()}
          </span>
        </td>,
        <td
          key={`actions-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="bg-[#FEF7E7] text-[#8B6914] px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-[#F5E6C3] hover:bg-[#FDF1D5]"
            >
              👁 View ledger
            </button>
            <ActionMenu
              actions={[
                {
                  label: "Edit",
                  icon: <FaRegEdit />,
                  color: "text-blue-600",
                  onClick: () => {
                    console.log("Edit customer:", customer.customerId);
                  },
                },
                {
                  label: "Delete",
                  icon: <FaRegTrashAlt />,
                  color: "text-red-600",
                  onClick: () => {
                    console.log("Delete customer:", customer.customerId);
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
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/* Summary Cards */}
        <div className="flex items-center gap-4">
          <div className="bg-[#E0F2E9] rounded-xl px-5 py-3 border border-[#B8DFC8]">
            <div className="flex items-center gap-2">
              <span className="text-[#0D4B37] text-sm font-medium">
                You Get
              </span>
              <span className="text-[#0D4B37] text-lg font-bold">
                ₹ {youGet.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-[#FCE8E8] rounded-xl px-5 py-3 border border-[#F5C6C6]">
            <div className="flex items-center gap-2">
              <span className="text-[#B91C1C] text-sm font-medium">
                You Give
              </span>
              <span className="text-[#B91C1C] text-lg font-bold">
                ₹ {youGive.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Search with Filter Dropdown */}
        <div className="flex items-center gap-0 max-w-md">
          <div className="relative z-10">
            <DropDown
              options={filterOptions}
              value={searchFilter}
              onChange={(val) =>
                setSearchFilter(val as "owner" | "customerId" | "customerName")
              }
              buttonClassName="!rounded-r-none border-r-0 bg-gray-50 hover:bg-gray-100 !py-3 !px-4 text-sm font-medium text-gray-700"
              customWidth="w-40"
              noBorder={false}
              noButtonRadius={true}
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-[0.95rem] py-3 pl-4 pr-10 rounded-r-md border border-gray-200 border-l-0 focus:outline-none focus:ring-2 focus:ring-[#0D4B37] text-gray-700 bg-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <FiSearch />
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mb-4 mt-3"></div>

      <div className="min-h-[200px] mt-2 px-2">
        <Table
          data={tableData}
          columns={columns}
          columnIconMap={columnIconMap}
          categoryName="Customers"
        />
      </div>
    </div>
  );
};

export default FinanceCustomersPage;
