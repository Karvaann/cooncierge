"use client";

import { useMemo, useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import type { JSX } from "react";
import dynamic from "next/dynamic";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import DropDown from "@/components/DropDown";
import { PiArrowCircleUpRight } from "react-icons/pi";
import { PiArrowCircleDownLeft } from "react-icons/pi";
import AvatarTooltip from "@/components/AvatarToolTip";
import { TbArrowsUpDown } from "react-icons/tb";
import { CiFilter } from "react-icons/ci";
import type { FilterCardOption } from "@/components/FilterCard";
import FilterTrigger from "@/components/FilterTrigger";
import { getUsers } from "@/services/userApi";
import { vi } from "date-fns/locale";
import LedgerModal from "@/components/Modals/LedgerModal";
import { MdOutlineRemoveRedEye } from "react-icons/md";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

// Column definitions
const columns: string[] = [
  "Vendor ID",
  "Vendor Name",
  "POC",
  "Closing Balance",
  "Actions",
];

// Dummy vendor data
type VendorRow = {
  vendorId: string;
  name: string;
  pocName: string; // point of contact
  closingBalance: number;
  balanceType: "debit" | "credit"; // debit = you give (red), credit = you get (green)
};

const dummyVendors: VendorRow[] = [
  {
    vendorId: "VE-AB001",
    name: "Company ABC",
    pocName: "Sumit Jain",
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    vendorId: "VE-AB002",
    name: "Company XYZ",
    pocName: "Apurav Mishra",
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    vendorId: "VE-AB003",
    name: "Company LMN",
    pocName: "Harish Chaudhary",
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    vendorId: "VE-AB004",
    name: "Company QRS",
    pocName: "Dhruv Pandey",
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    vendorId: "VE-AB005",
    name: "Company TUV",
    pocName: "Suman Rao",
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    vendorId: "VE-AB006",
    name: "Company OPQ",
    pocName: "Nitin Verma",
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    vendorId: "VE-AB007",
    name: "Company RST",
    pocName: "Karan Singh",
    closingBalance: 24580,
    balanceType: "debit",
  },
  {
    vendorId: "VE-AB008",
    name: "Company UVW",
    pocName: "Ankit Sharma",
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    vendorId: "VE-AB009",
    name: "Company DEF",
    pocName: "Rohit Kumar",
    closingBalance: 24580,
    balanceType: "credit",
  },
  {
    vendorId: "VE-AB010",
    name: "Company GHI",
    pocName: "Manish Gupta",
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

const FinanceVendorsPage = () => {
  const [userOptions, setUserOptions] = useState<FilterCardOption[]>([]);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerVendorName, setLedgerVendorName] = useState<string | null>(null);
  const [ledgerVendorId, setLedgerVendorId] = useState<string | null>(null);

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
      POC: (
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
    const get = dummyVendors
      .filter((c) => c.balanceType === "credit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    const give = dummyVendors
      .filter((c) => c.balanceType === "debit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    return { youGet: get, youGive: give };
  }, []);

  // Search state
  const [searchValue, setSearchValue] = useState("");
  const [searchFilter, setSearchFilter] = useState<
    "poc" | "vendorId" | "vendorName"
  >("poc");
  // effectiveSearch matches bookings Filter behavior: only apply when empty or >=3 chars
  const [effectiveSearch, setEffectiveSearch] = useState("");

  // Filter options for dropdown
  const filterOptions = useMemo(
    () => [
      { value: "poc", label: "POC" },
      { value: "vendorId", label: "Vendor ID" },
      { value: "vendorName", label: "Vendor Name" },
    ],
    [],
  );

  // Dynamic placeholder based on selected filter
  const searchPlaceholder = useMemo(() => {
    switch (searchFilter) {
      case "poc":
        return "Search by POC";
      case "vendorId":
        return "Search by Vendor ID";
      case "vendorName":
        return "Search by Vendor Name";
      default:
        return "Search...";
    }
  }, [searchFilter]);

  // Convert customers to table data
  // Apply search filtering (only when effectiveSearch empty or >=3 chars)
  const visibleVendors = useMemo(() => {
    if (!effectiveSearch || effectiveSearch.length < 3) return dummyVendors;
    const q = effectiveSearch.toLowerCase();
    return dummyVendors.filter((c) => {
      if (searchFilter === "poc") {
        return c.pocName.toLowerCase().includes(q);
      }
      if (searchFilter === "vendorId")
        return c.vendorId.toLowerCase().includes(q);
      if (searchFilter === "vendorName")
        return c.name.toLowerCase().includes(q);
      return false;
    });
  }, [effectiveSearch, searchFilter]);

  const tableData = useMemo<JSX.Element[][]>(() => {
    return visibleVendors.map((vendor, index) => {
      const cells: JSX.Element[] = [];

      cells.push(
        <td
          key={`vendorId-${index}`}
          className="px-4 py-3  font-[500] text-[14px] text-center"
        >
          {vendor.vendorId}
        </td>,
        <td key={`name-${index}`} className="px-4 py-3 text-[14px] text-center">
          {vendor.name}
        </td>,
        <td key={`poc-${index}`} className="px-4 py-3 text-[14px] text-center">
          {vendor.pocName}
        </td>,
        <td
          key={`balance-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
          <span
            className={`inline-flex items-center justify-center gap-2 font-semibold ${
              vendor.balanceType === "debit" ? "text-red-600" : "text-green-600"
            }`}
          >
            {vendor.balanceType === "debit" ? (
              <PiArrowCircleUpRight className="text-red-600" size={16} />
            ) : (
              <PiArrowCircleDownLeft className="text-green-600" size={16} />
            )}
            <span>₹ {vendor.closingBalance.toLocaleString()}</span>
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
                setLedgerVendorName(vendor.name);
                setLedgerVendorId(vendor.vendorId);
                setLedgerOpen(true);
              }}
              className="bg-[#FEF7E7] text-[#8B6914] px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-[#F5E6C3] hover:bg-[#FDF1D5]"
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
                    console.log("Edit vendor:", vendor.vendorId);
                  },
                },
                {
                  label: "Delete",
                  icon: <FaRegTrashAlt />,
                  color: "text-red-600",
                  onClick: () => {
                    console.log("Delete vendor:", vendor.vendorId);
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
  }, [visibleVendors]);

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/* Summary Pills (You Get / You Give) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#E0F2E9] rounded-full px-4 py-2 border border-[#B8DFC8]">
              <div className="flex items-center gap-3">
                <span className="text-[#818181] text-[13px] font-medium">
                  You Get
                </span>
                <span className="text-[#4CA640] text-[14px] font-semibold">
                  ₹ {youGet.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-[#FCE8E8] rounded-full px-4 py-2 border border-[#F5C6C6]">
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
                setSearchFilter(val as "poc" | "vendorId" | "vendorName")
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

      <div className="border-t border-gray-200 mb-4 mt-3"></div>

      <div className="min-h-[200px] mt-2 px-2">
        <Table
          data={tableData}
          columns={columns}
          columnIconMap={columnIconMap}
          categoryName="Vendors"
        />
      </div>
      <LedgerModal
        isOpen={ledgerOpen}
        onClose={() => {
          setLedgerOpen(false);
          setLedgerVendorName(null);
          setLedgerVendorId(null);
        }}
        customerName={ledgerVendorName ?? null}
        customerId={ledgerVendorId ?? null}
      />
    </div>
  );
};

export default FinanceVendorsPage;
