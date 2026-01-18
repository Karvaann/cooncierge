"use client";

import { useMemo, useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import type { JSX } from "react";
import dynamic from "next/dynamic";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import {
  FaRegEdit,
  FaRegTrashAlt,
  FaArrowCircleLeft,
  FaRegArrowAltCircleRight,
} from "react-icons/fa";
import DropDown from "@/components/DropDown";
import AvatarTooltip from "@/components/AvatarToolTip";
import { TbArrowsUpDown } from "react-icons/tb";
import { CiFilter } from "react-icons/ci";
import type { FilterCardOption } from "@/components/FilterCard";
import FilterTrigger from "@/components/FilterTrigger";
import { getUsers } from "@/services/userApi";
import LedgerModal from "@/components/Modals/LedgerModal";
import { PiArrowCircleUpRight } from "react-icons/pi";
import { PiArrowCircleDownLeft } from "react-icons/pi";

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
    customerId: "CU-XB005",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    customerId: "CU-PB006",
    name: "Deepanshu",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-TB007",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-RB008",
    name: "Anand Mishra",
    ownerNames: ["Anand Singh", "Aman Kumar", "Suresh Raina", "Virat Goel"],
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    customerId: "CU-SB009",
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

const FinanceCustomersPage = () => {
  const [userOptions, setUserOptions] = useState<FilterCardOption[]>([]);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerCustomerName, setLedgerCustomerName] = useState<string | null>(
    null,
  );
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);

  // Fetch users on mount to populate Owner filter options
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await getUsers();

        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.users)) list = res.users;
        else if (Array.isArray(res?.data)) list = res.data;

        const opts: FilterCardOption[] = list.map((u) => ({
          value: u._id ?? u.id ?? u.userId ?? String(u?.email ?? u?.name ?? u),
          label: u.name ?? u.fullName ?? u.email ?? String(u),
        }));

        if (mounted) setUserOptions(opts);
      } catch (e) {
        console.error("Failed to load users for Owner filter", e);
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, []);

  // Map column names to header icons/components
  const columnIconMap: Record<string, JSX.Element | null> = useMemo(() => {
    return {
      Owner: (
        <FilterTrigger options={userOptions}>
          <CiFilter className="text-white stroke-[1.5]" />
        </FilterTrigger>
      ),
      "Closing Balance": (
        <FilterTrigger
          ariaLabel="Filter Amount"
          options={[
            { value: "in", label: "Payment In" },
            { value: "out", label: "Payment Out" },
          ]}
          onApply={(sel) => console.log("Amount filter applied:", sel)}
        >
          <CiFilter className="text-white stroke-[1.5]" />
        </FilterTrigger>
      ),
    };
  }, [userOptions]);

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
  // effectiveSearch matches bookings Filter behavior: only apply when empty or >=3 chars
  const [effectiveSearch, setEffectiveSearch] = useState("");

  // Filter options for dropdown
  const filterOptions = useMemo(
    () => [
      { value: "owner", label: "Owner" },
      { value: "customerId", label: "Customer ID" },
      { value: "customerName", label: "Customer Name" },
    ],
    [],
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
  // Apply search filtering (only when effectiveSearch empty or >=3 chars)
  const visibleCustomers = useMemo(() => {
    if (!effectiveSearch || effectiveSearch.length < 3) return dummyCustomers;
    const q = effectiveSearch.toLowerCase();
    return dummyCustomers.filter((c) => {
      if (searchFilter === "owner") {
        return c.ownerNames.some((n) => n.toLowerCase().includes(q));
      }
      if (searchFilter === "customerId")
        return c.customerId.toLowerCase().includes(q);
      if (searchFilter === "customerName")
        return c.name.toLowerCase().includes(q);
      return false;
    });
  }, [effectiveSearch, searchFilter]);

  const tableData = useMemo<JSX.Element[][]>(() => {
    return visibleCustomers.map((customer, index) => {
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
            {customer.ownerNames && customer.ownerNames.length > 0 && (
              <>
                <div className="mr-2">
                  <AvatarTooltip
                    short={computeInitials(customer.ownerNames[0])}
                    full={customer.ownerNames[0]}
                    color={getOwnerColor(0)}
                  />
                </div>

                <div className="flex items-center">
                  {customer.ownerNames.slice(1).map((ownerName, idx) => (
                    <AvatarTooltip
                      key={idx + 1}
                      short={computeInitials(ownerName)}
                      full={ownerName}
                      color={getOwnerColor(idx + 1)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </td>,
        <td
          key={`balance-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
          <span
            className={`inline-flex items-center justify-center gap-2 font-semibold ${
              customer.balanceType === "debit"
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {customer.balanceType === "debit" ? (
              <PiArrowCircleUpRight className="text-red-600" size={16} />
            ) : (
              <PiArrowCircleDownLeft className="text-green-600" size={16} />
            )}
            <span>₹ {customer.closingBalance.toLocaleString()}</span>
          </span>
        </td>,
        <td
          key={`actions-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLedgerCustomerName(customer.name);
                setLedgerCustomerId(customer.customerId);
                setLedgerOpen(true);
              }}
              className="bg-[#FFF1C2] text-[#414141] px-3 py-1.5 rounded-md text-[0.75rem] font-semibold border border-[#F5E6C3] hover:bg-[#FDF1D5]"
            >
              <span className="flex items-center gap-1">
                <MdOutlineRemoveRedEye size={12} className="text-[#414141]" />{" "}
                View ledger{" "}
              </span>
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
        </td>,
      );

      return cells;
    });
  }, [visibleCustomers]);

  // Ledger modal handlers
  const closeLedger = () => {
    setLedgerOpen(false);
    setLedgerCustomerName(null);
    setLedgerCustomerId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/* Summary Pills (You Get / You Give) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#E0F2E9] rounded-full px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-[#818181] text-[13px] font-medium">
                  You Get
                </span>
                <span className="text-[#4CA640] text-[14px] font-semibold">
                  ₹ {youGet.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-[#FCE8E8] rounded-full px-4 py-2 ">
              <div className="flex items-center gap-3">
                <span className="text-[#818181] text-[13px] font-medium">
                  You Give
                </span>
                <span className="text-[#C30010] text-[14px] font-semibold">
                  ₹ {youGive.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search with Filter Dropdown */}
        <div className="flex items-center gap-0 max-w-xl">
          <div className="relative z-10">
            <DropDown
              options={filterOptions}
              value={searchFilter}
              onChange={(val) =>
                setSearchFilter(val as "owner" | "customerId" | "customerName")
              }
              buttonClassName="!rounded-l-md !rounded-r-none border bg-gray-50 text-[13px] font-normal text-gray-500"
              customWidth="w-40"
              customHeight="py-2.5"
              noBorder={false}
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                const value = e.target.value;
                setSearchValue(value);
                if (value.length === 0) setEffectiveSearch("");
                else if (value.length >= 3) setEffectiveSearch(value);
              }}
              placeholder={searchPlaceholder}
              className="w-[260px] text-[14px] py-2.5 pl-4 pr-10 rounded-r-md border border-gray-200 border-l-0 focus:outline-none focus:ring-2 focus:ring-[#0D4B37] hover:border-green-300 text-gray-700 bg-white"
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
          categoryName="Customers"
        />
      </div>

      {/* Ledger Modal */}
      <LedgerModal
        isOpen={ledgerOpen}
        onClose={closeLedger}
        customerName={ledgerCustomerName ?? null}
        customerId={ledgerCustomerId ?? null}
      />
    </div>
  );
};

export default FinanceCustomersPage;
