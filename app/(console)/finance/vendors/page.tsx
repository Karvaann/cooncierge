"use client";

import { useMemo, useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import type { JSX } from "react";
import dynamic from "next/dynamic";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import FullScreenLoader from "@/components/FullScreenLoader";
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
import PaymentsApi from "@/services/paymentsApi";
import {
  allowNoSpecialCharacters,
  allowOnlyText,
} from "@/utils/inputValidators";
import { vi } from "date-fns/locale";
import LedgerModal from "@/components/Modals/LedgerModal";
import AddVendorSideSheet from "@/components/Sidesheets/AddVendorSideSheet";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import { deleteVendor } from "@/services/vendorApi";
import { BookingProvider } from "@/context/BookingContext";
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
  raw?: any;
  rawId: string;
};

// No initial dummy vendors — will load from API

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
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerVendorName, setLedgerVendorName] = useState<string | null>(null);
  const [ledgerVendorId, setLedgerVendorId] = useState<string | null>(null);
  const [ledgerRawId, setLedgerRawId] = useState<string | null>(null);

  const [amountFilter, setAmountFilter] = useState<("in" | "out")[]>([]);
  const [vendorViewOpen, setVendorViewOpen] = useState(false);
  const [selectedVendorData, setSelectedVendorData] = useState<any | null>(
    null,
  );
  const [editVendorOpen, setEditVendorOpen] = useState(false);
  const [editVendorData, setEditVendorData] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetVendorId, setTargetVendorId] = useState<string | null>(null);
  const [targetVendorName, setTargetVendorName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch vendor closing balances on mount and map to VendorRow
  useEffect(() => {
    let mounted = true;
    const fetchBalances = async () => {
      try {
        const res = await PaymentsApi.listVendorClosingBalances();

        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.vendors)) list = res.vendors;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.closingBalances))
          list = res.closingBalances;

        const mapped: VendorRow[] = (list || []).map((it: any) => {
          const rawVendor = it.vendor ?? it;
          const rawId = it.vendor._id;
          const vendorId =
            it?.vendor?.customId ??
            it.customId ??
            it.vendorId ??
            it._id ??
            it.id ??
            it.vendor?.id ??
            String(it?.vendorId ?? "");
          const name =
            it.name ??
            it.companyName ??
            it.vendorName ??
            it.vendor?.companyName ??
            it.vendor?.name ??
            "";
          const pocName =
            it.pocName ??
            it.poc ??
            it.contactName ??
            it.contactPerson ??
            it.vendor?.contactPerson ??
            "";
          const rawBalance =
            it.closingBalance?.amount ??
            it.closing_balance?.amount ??
            it.balance ??
            it.amount ??
            it.closingBalance ??
            0;
          const closingBalance = Number(rawBalance);
          const balanceType = (it.closingBalance?.balanceType ??
            it.balanceType ??
            it.type ??
            (Number(rawBalance) < 0 ? "debit" : "credit")) as
            | "debit"
            | "credit";

          return {
            vendorId,
            rawId,
            name,
            pocName,
            closingBalance: Math.abs(closingBalance),
            balanceType,
            raw: rawVendor,
          };
        });

        if (mounted) setVendors(mapped);
      } catch (e) {
        console.error("Failed to load vendor closing balances", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchBalances();
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
          onApply={(sel) => {
            setAmountFilter(sel as ("in" | "out")[]);
          }}
        >
          <CiFilter className="text-white stroke-[1.5]" />
        </FilterTrigger>
      ),
    };
  }, [userOptions]);

  // Calculate totals (will be recomputed for visible vendors below)
  const { youGet, youGive } = { youGet: 0, youGive: 0 };

  // Search state
  const [searchValue, setSearchValue] = useState("");
  const [searchFilter, setSearchFilter] = useState<
    "poc" | "vendorId" | "vendorName"
  >("poc");

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

  const visibleVendors = useMemo(() => {
    const q =
      effectiveSearch && effectiveSearch.length >= 3
        ? effectiveSearch.toLowerCase()
        : "";

    return vendors.filter((v) => {
      /* Search filter */
      if (q) {
        if (searchFilter === "poc") {
          if (!v.pocName.toLowerCase().includes(q)) return false;
        }

        if (searchFilter === "vendorId") {
          if (!v.vendorId.toLowerCase().includes(q)) return false;
        }

        if (searchFilter === "vendorName") {
          if (!v.name.toLowerCase().includes(q)) return false;
        }
      }

      /* Closing Balance filter */
      if (amountFilter.length > 0) {
        const balanceDirection = v.balanceType === "credit" ? "in" : "out";

        if (!amountFilter.includes(balanceDirection)) {
          return false;
        }
      }

      return true;
    });
  }, [vendors, effectiveSearch, searchFilter, amountFilter]);

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
          <button
            type="button"
            onClick={() => {
              setSelectedVendorData(
                vendor.raw ?? { name: vendor.name, customId: vendor.vendorId },
              );
              setVendorViewOpen(true);
            }}
            className="p-0 m-0 bg-transparent border-0 hover:underline font-medium"
            aria-label={`View ${vendor.name}`}
          >
            {vendor.name}
          </button>
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
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center justify-center gap-2 transition-all duration-200 ${
              index === 0
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setLedgerVendorName(vendor.name);
                setLedgerVendorId(vendor.vendorId);
                setLedgerRawId(vendor.rawId);
                setLedgerOpen(true);
              }}
              className="bg-[#FFF1C2] text-[#8B6914] px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-[#F5E6C3] hover:bg-[#FDF1D5]"
            >
              <span className="flex items-center gap-1">
                <MdOutlineRemoveRedEye size={12} className="text-[#414141]" />{" "}
                View ledger
              </span>
            </button>
            <ActionMenu
              actions={[
                {
                  label: "Edit",
                  icon: <FaRegEdit />,
                  color: "text-blue-600",
                  onClick: () => {
                    setEditVendorData(
                      vendor.raw ?? {
                        name: vendor.name,
                        customId: vendor.vendorId,
                      },
                    );
                    setEditVendorOpen(true);
                  },
                },
                {
                  label: "Delete",
                  icon: <FaRegTrashAlt />,
                  color: "text-red-600",
                  onClick: () => {
                    setTargetVendorId(vendor.vendorId || null);
                    setTargetVendorName(vendor.name || null);
                    setConfirmOpen(true);
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

  // Recompute totals based on currently visible (filtered) vendors
  const totalsForVisibleVendors = useMemo(() => {
    const get = visibleVendors
      .filter((c) => c.balanceType === "credit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    const give = visibleVendors
      .filter((c) => c.balanceType === "debit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    return { youGet: get, youGive: give };
  }, [visibleVendors]);

  const youGetVisibleV = totalsForVisibleVendors.youGet;
  const youGiveVisibleV = totalsForVisibleVendors.youGive;

  return (
    <>
      {isLoading ? (
        <FullScreenLoader />
      ) : (
        <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
          <div className="flex items-center justify-between rounded-2xl px-4 py-3">
            {/* Summary Pills (You Get / You Give) */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#E0F2E9] rounded-full px-4 py-2 border border-[#B8DFC8]">
                  <div className="flex items-center gap-3">
                    <span className="text-[#414141] text-[13px] font-medium">
                      You Get
                    </span>
                    <span className="text-[#4CA640] text-[14px] font-semibold">
                      ₹ {youGetVisibleV.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FCE8E8] rounded-full px-4 py-2 border border-[#F5C6C6]">
                  <div className="flex items-center gap-3">
                    <span className="text-[#414141] text-[13px] font-medium">
                      You Give
                    </span>
                    <span className="text-[#C30010] text-[14px] font-semibold">
                      ₹ {youGiveVisibleV.toLocaleString()}
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
                  customWidth="w-37"
                  customHeight="py-2.5"
                  noBorder={false}
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const value =
                      searchFilter === "vendorId"
                        ? allowNoSpecialCharacters(raw)
                        : allowOnlyText(raw);
                    setSearchValue(value);
                    if (value.length === 0) setEffectiveSearch("");
                    else if (value.length >= 3) setEffectiveSearch(value);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-[350px] text-[14px] py-2.5 pl-4 pr-10 rounded-r-md border border-gray-200 border-l-0 focus:outline-none focus:ring-2 focus:ring-[#0D4B37] hover:border-green-300 text-gray-700 bg-white"
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
              enableRowHoverActions={true}
              rowIds={visibleVendors.map((v) => v.vendorId)}
            />
          </div>
        </div>
      )}

      <LedgerModal
        isOpen={ledgerOpen}
        onClose={() => {
          setLedgerOpen(false);
          setLedgerVendorName(null);
          setLedgerVendorId(null);
        }}
        isVendorLedger={true}
        customerName={ledgerVendorName ?? null}
        customerId={ledgerVendorId ?? null}
        rawId={ledgerRawId ?? null}
      />

      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setTargetVendorId(null);
          setTargetVendorName(null);
          setIsDeleting(false);
        }}
        onConfirm={async () => {
          if (!targetVendorId) return;
          try {
            setIsDeleting(true);
            await deleteVendor(targetVendorId);
            setVendors((prev) =>
              prev.filter((v) => v.vendorId !== targetVendorId),
            );
          } catch (e) {
            console.error("Failed to delete vendor", e);
          } finally {
            setConfirmOpen(false);
            setTargetVendorId(null);
            setTargetVendorName(null);
            setIsDeleting(false);
          }
        }}
        title={
          targetVendorName
            ? `Delete ${targetVendorName}?`
            : `Delete vendor ${targetVendorId}?`
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmButtonColor="bg-red-600"
      />

      <BookingProvider>
        <AddVendorSideSheet
          data={selectedVendorData}
          isOpen={vendorViewOpen}
          onCancel={() => {
            setVendorViewOpen(false);
            setSelectedVendorData(null);
          }}
          mode="view"
          vendorCode={selectedVendorData?.customId ?? selectedVendorData?._id}
        />
        <AddVendorSideSheet
          data={editVendorData}
          isOpen={editVendorOpen}
          onCancel={() => {
            setEditVendorOpen(false);
            setEditVendorData(null);
          }}
          mode="edit"
          vendorCode={editVendorData?.customId ?? editVendorData?._id}
          onSuccess={() => {
            setEditVendorOpen(false);
            setEditVendorData(null);
          }}
        />
      </BookingProvider>
    </>
  );
};

export default FinanceVendorsPage;
