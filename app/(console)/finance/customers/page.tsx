"use client";

import { useMemo, useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import type { JSX } from "react";
import dynamic from "next/dynamic";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import FullScreenLoader from "@/components/FullScreenLoader";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import DropDown from "@/components/DropDown";
import AvatarTooltip from "@/components/AvatarToolTip";
import { CiFilter } from "react-icons/ci";
import type { FilterCardOption } from "@/components/FilterCard";
import FilterTrigger from "@/components/FilterTrigger";
import { getUsers } from "@/services/userApi";
import PaymentsApi from "@/services/paymentsApi";
import LedgerModal from "@/components/Modals/LedgerModal";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import { BookingProvider } from "@/context/BookingContext";
import { PiArrowCircleUpRight } from "react-icons/pi";
import { PiArrowCircleDownLeft } from "react-icons/pi";
import {
  allowNoSpecialCharacters,
  allowOnlyText,
} from "@/utils/inputValidators";

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
  customId?: string;
  name: string;
  ownerIds: string[];
  ownerNames: string[]; // Array of owner full names
  closingBalance: number;
  balanceType: "debit" | "credit"; // debit = you give (red), credit = you get (green)
  raw?: any;
};
// No initial dummy customers — will load from API

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
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ownerFilterIds, setOwnerFilterIds] = useState<string[]>([]);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerCustomerName, setLedgerCustomerName] = useState<string | null>(
    null,
  );
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);
  const [amountFilter, setAmountFilter] = useState<("in" | "out")[]>([]);
  const [customerViewOpen, setCustomerViewOpen] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState<any | null>(
    null,
  );
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<any | null>(null);

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

  // Fetch customer closing balances on mount and map to CustomerRow
  useEffect(() => {
    let mounted = true;
    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const res = await PaymentsApi.listCustomerClosingBalances();

        let list: any[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.customers)) list = res.customers;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.closingBalances))
          list = res.closingBalances;

        const mapped: CustomerRow[] = (list || []).map((it: any) => {
          const rawCustomer = it.customer ?? it;

          const customerId =
            it?.customer?.customId ??
            it.customId ??
            it._id ??
            it.id ??
            it.customer?.id ??
            String(it?.customerId ?? "");
          const name =
            it.name ??
            it.fullName ??
            it.customerName ??
            it.customer?.name ??
            "";
          // Resolve owner names
          let ownerNames: string[] = [];
          const ownerIds: string[] = [];
          if (Array.isArray(it.ownerNames) && it.ownerNames.length > 0) {
            ownerNames = it.ownerNames;
          } else if (Array.isArray(it.owners) && it.owners.length > 0) {
            ownerNames = it.owners.map((o: any) => o.name ?? String(o));
          } else {
            const ownerVal = rawCustomer?.ownerId ?? it.ownerId ?? null;
            if (ownerVal) {
              if (typeof ownerVal === "string") {
                ownerNames = [ownerVal];
                ownerIds.push(ownerVal);
              } else if (typeof ownerVal === "object") {
                ownerNames = [
                  ownerVal.name ||
                    ownerVal.email ||
                    String(ownerVal._id || ownerVal.id || ""),
                ];
                const oid = String(ownerVal._id || ownerVal.id || "");
                if (oid) ownerIds.push(oid);
              }
            }
          }
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
            customerId,
            name,
            ownerIds,
            ownerNames,
            closingBalance: Math.abs(closingBalance),
            balanceType,
            raw: rawCustomer,
          };
        });

        if (mounted) setCustomers(mapped);

        // No fallback fetch for owner names — rely on API response
      } catch (e) {
        console.error("Failed to load customer closing balances", e);
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
      Owner: (
        <FilterTrigger
          options={userOptions}
          onApply={(selected) => setOwnerFilterIds(selected as string[])}
        >
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
          onApply={(selected) => {
            setAmountFilter(selected as ("in" | "out")[]);
          }}
        >
          <CiFilter className="text-white stroke-[1.5]" />
        </FilterTrigger>
      ),
    };
  }, [userOptions]);

  // Calculate totals
  const { youGet, youGive } = useMemo(() => {
    const get = customers
      .filter((c) => c.balanceType === "credit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    const give = customers
      .filter((c) => c.balanceType === "debit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    return { youGet: get, youGive: give };
  }, [customers]);

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
  const visibleCustomers = useMemo(() => {
    const q =
      effectiveSearch && effectiveSearch.length >= 3
        ? effectiveSearch.toLowerCase()
        : "";

    return customers.filter((c) => {
      /* Search filter */
      if (q) {
        if (searchFilter === "owner") {
          if (!c.ownerNames.some((n) => n.toLowerCase().includes(q))) {
            return false;
          }
        }

        if (searchFilter === "customerId") {
          if (!c.customerId.toLowerCase().includes(q)) return false;
        }

        if (searchFilter === "customerName") {
          if (!c.name.toLowerCase().includes(q)) return false;
        }
      }

      /* Closing Balance filter */
      if (amountFilter.length > 0) {
        const balanceDirection = c.balanceType === "credit" ? "in" : "out";

        if (!amountFilter.includes(balanceDirection)) {
          return false;
        }
      }

      /* Owner filter (by selected owner ids) */
      if (ownerFilterIds.length > 0) {
        if (!Array.isArray(c.ownerIds) || c.ownerIds.length === 0) return false;
        const match = c.ownerIds.some((id) => ownerFilterIds.includes(id));
        if (!match) return false;
      }

      return true;
    });
  }, [customers, effectiveSearch, searchFilter, amountFilter, ownerFilterIds]);

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
          <button
            type="button"
            onClick={() => {
              setSelectedCustomerData(
                customer.raw ?? {
                  name: customer.name,
                  customId: customer.customerId,
                },
              );
              setCustomerViewOpen(true);
            }}
            className="p-0 m-0 bg-transparent border-0 hover:underline font-medium"
            aria-label={`View ${customer.name}`}
          >
            {customer.name}
          </button>
        </td>,
        <td key={`owner-${index}`} className="px-4 py-3 text-center">
          <div className="flex items-center justify-center">
            {customer.ownerNames && customer.ownerNames.length > 0 && (
              <>
                <div className="mr-2">
                  <AvatarTooltip
                    short={computeInitials(customer.ownerNames[0] ?? "")}
                    full={customer.ownerNames[0] ?? ""}
                    color={getOwnerColor(0)}
                  />
                </div>

                <div className="flex items-center">
                  {customer.ownerNames.slice(1).map((ownerName, idx) => (
                    <AvatarTooltip
                      key={idx + 1}
                      short={computeInitials(ownerName ?? "")}
                      full={ownerName ?? ""}
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
          className="px-4 py-3 text-center text-[14px] align-middle h-[4rem]"
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
                setLedgerCustomerName(customer.name);
                setLedgerCustomerId(customer.customerId);
                setLedgerOpen(true);
              }}
              className="bg-[#FFF1C2] text-[#414141] px-3 py-1.5 rounded-md text-[0.75rem] font-semibold border border-[#F5E6C3] hover:bg-[#FDF1D5]"
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
                    setEditCustomerData(
                      customer.raw ?? {
                        name: customer.name,
                        customId: customer.customerId,
                      },
                    );
                    setEditCustomerOpen(true);
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
    <>
      {isLoading ? (
        <FullScreenLoader />
      ) : (
        <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
          <div className="flex items-center justify-between rounded-2xl px-4 py-3">
            {/* Summary Pills (You Get / You Give) */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-[#E0F2E9] rounded-full px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#414141] text-[13px] font-medium">
                      You Get
                    </span>
                    <span className="text-[#4CA640] text-[14px] font-semibold">
                      ₹ {youGet.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FCE8E8] rounded-full px-4 py-2 ">
                  <div className="flex items-center gap-3">
                    <span className="text-[#414141] text-[13px] font-medium">
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
                    setSearchFilter(
                      val as "owner" | "customerId" | "customerName",
                    )
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
                      searchFilter === "customerId"
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

          <div className="min-h-[200px] mt-2 px-2">
            <Table
              data={tableData}
              columns={columns}
              columnIconMap={columnIconMap}
              categoryName="Customers"
              enableRowHoverActions={true}
              rowIds={visibleCustomers.map((c) => c.customerId)}
            />
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      <LedgerModal
        isOpen={ledgerOpen}
        onClose={closeLedger}
        customerName={ledgerCustomerName ?? null}
        customerId={ledgerCustomerId ?? null}
      />

      {/* Customer View SideSheet (read-only) */}
      <BookingProvider>
        <AddCustomerSideSheet
          data={selectedCustomerData}
          isOpen={customerViewOpen}
          onCancel={() => {
            setCustomerViewOpen(false);
            setSelectedCustomerData(null);
          }}
          mode="view"
          customerCode={
            selectedCustomerData?.customId ?? selectedCustomerData?._id
          }
        />
      </BookingProvider>

      <BookingProvider>
        <AddCustomerSideSheet
          data={editCustomerData}
          isOpen={editCustomerOpen}
          onCancel={() => {
            setEditCustomerOpen(false);
            setEditCustomerData(null);
          }}
          mode="edit"
          customerCode={editCustomerData?.customId ?? editCustomerData?._id}
        />
      </BookingProvider>
    </>
  );
};

export default FinanceCustomersPage;
