"use client";

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type JSX,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MdOutlineRemoveRedEye, MdOutlineKeyboardArrowDown } from "react-icons/md";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { CiSearch, CiFilter } from "react-icons/ci";
import { TbArrowsUpDown, TbCircleArrowDownLeft, TbCircleArrowUpRight } from "react-icons/tb";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import FilterTrigger from "@/components/FilterTrigger";
import PaymentsApi from "@/services/paymentsApi";
import { deleteCustomer, getCustomerById } from "@/services/customerApi";
import CustomIdApi from "@/services/customIdApi";
import LedgerModal from "@/components/Modals/LedgerModal/LedgerModal";
import LinkProfilesModal, {
  type LinkProfileSource,
} from "@/components/Modals/LinkProfilesModal";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import { BookingProvider } from "@/context/BookingContext";
import {
  allowNoSpecialCharacters,
  allowOnlyText,
} from "@/utils/inputValidators";
import {
  formatNumberByStoredCurrency,
  getStoredCurrencySymbol,
} from "@/utils/helper";
import { formatDirectoryDisplayDate, mapTierToNumber } from "@/utils/directoryApiMappers";
import BookingsPageViewport from "@/components/bookings/BookingsPageViewport";
import FinanceSummaryPills from "@/components/finance/FinanceSummaryPills";
import TotalCountPill from "@/components/table/TotalCountPill";
import TableHeaderActions from "@/components/table/TableHeaderActions";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";
import { BOOKING_HISTORY_ACTION_BUTTON_CLASS } from "@/components/table/bookingHistoryActionStyles";
import type { DeletableItem } from "@/components/Modals/DeleteModal";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

const columns: string[] = [
  "Customer ID",
  "Name",
  "Last Modified",
  "Closing Balance",
  "Actions",
];

type CustomerRow = {
  customerId: string;
  rawId: string;
  name: string;
  subtitle?: string;
  lastModified: string;
  lastModifiedRaw?: string;
  closingBalance: number;
  balanceType: "debit" | "credit";
  raw?: any;
};

function renderSelectCheckbox(
  inputId: string,
  checked: boolean,
  onToggle: () => void,
  indeterminate = false,
) {
  const isActive = checked || indeterminate;

  return (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        id={inputId}
        className="sr-only"
        checked={checked}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggle}
      />
      <label
        htmlFor={inputId}
        onClick={(e) => e.stopPropagation()}
        className={`flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-[5px] border transition ${
          isActive
            ? "border-[#7135AD] bg-[#7135AD]"
            : "border-[#D1D5DB] bg-white"
        }`}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="8"
            viewBox="0 0 12 11"
            fill="none"
            aria-hidden
          >
            <path
              d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {indeterminate && !checked && (
          <span
            className="block h-[2px] w-[10px] rounded-full bg-white"
            aria-hidden
          />
        )}
      </label>
    </div>
  );
}

const FinanceCustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerCustomerName, setLedgerCustomerName] = useState<string | null>(
    null,
  );
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);
  const [ledgerRawId, setLedgerRawId] = useState<string | null>(null);
  const [ledgerCustomerData, setLedgerCustomerData] = useState<any | null>(null);

  const [amountFilter, setAmountFilter] = useState<("in" | "out")[]>([]);
  const [customerViewOpen, setCustomerViewOpen] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState<any | null>(
    null,
  );
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<any | null>(null);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [duplicateCustomerData, setDuplicateCustomerData] = useState<any | null>(
    null,
  );
  const [generatedCustomerCode, setGeneratedCustomerCode] = useState<
    string | null
  >(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkSourceProfile, setLinkSourceProfile] =
    useState<LinkProfileSource | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);
  const selectActionsRef = useRef<HTMLDivElement | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [searchBy, setSearchBy] = useState<"customerId" | "name">("customerId");
  const [searchByOpen, setSearchByOpen] = useState(false);
  const searchByRef = useRef<HTMLButtonElement | null>(null);
  const [searchByPos, setSearchByPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const [sortState, setSortState] = useState<{
    key: string;
    direction: "asc" | "desc" | "none";
  }>({ key: "", direction: "none" });

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await PaymentsApi.listCustomerClosingBalances();

      let list: Record<string, unknown>[] = [];
      if (Array.isArray(res)) list = res;
      else if (Array.isArray(res?.customers)) list = res.customers;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.closingBalances)) list = res.closingBalances;

      const mapped: CustomerRow[] = (list || []).map((it) => {
        const rawCustomer = (it.customer ?? it) as Record<string, unknown>;
        const rawId = String(rawCustomer?._id ?? rawCustomer?.id ?? "");
        const customerId = String(
          (it as { customer?: { customId?: string } })?.customer?.customId ??
            it.customId ??
            it._id ??
            it.id ??
            (it as { customer?: { id?: string } }).customer?.id ??
            it.customerId ??
            "",
        );
        const name = String(
          it.name ??
            it.fullName ??
            it.customerName ??
            rawCustomer?.name ??
            "",
        );

        const alias = String(rawCustomer?.alias ?? it.alias ?? "").trim();
        const gstin = String(rawCustomer?.gstin ?? it.gstin ?? "").trim();
        const subtitle =
          alias || (gstin ? `GSTIN : ${gstin}` : undefined);

        const updatedAt = String(
          rawCustomer?.updatedAt ?? it.updatedAt ?? rawCustomer?.createdAt ?? it.createdAt ?? "",
        );

        const rawBalance =
          (it as { closingBalance?: { amount?: number } }).closingBalance
            ?.amount ??
          (it as { closing_balance?: { amount?: number } }).closing_balance
            ?.amount ??
          it.balance ??
          it.amount ??
          (it as { closingBalance?: number }).closingBalance ??
          0;
        const closingBalance = Number(rawBalance);
        const balanceType = ((it as { closingBalance?: { balanceType?: string } })
          .closingBalance?.balanceType ??
          it.balanceType ??
          it.type ??
          (Number(rawBalance) < 0 ? "debit" : "credit")) as "debit" | "credit";

        return {
          customerId,
          rawId,
          name,
          ...(subtitle ? { subtitle } : {}),
          lastModified: formatDirectoryDisplayDate(updatedAt),
          lastModifiedRaw: updatedAt,
          closingBalance: Math.abs(closingBalance),
          balanceType,
          raw: rawCustomer,
        };
      });

      setCustomers(mapped);
    } catch (e) {
      console.error("Failed to load customer closing balances", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    if (!searchByOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (
        searchByRef.current &&
        !searchByRef.current.contains(event.target as Node)
      ) {
        setSearchByOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [searchByOpen]);

  const columnIconMap = useMemo<Record<string, JSX.Element>>(
    () => ({
      Name: (
        <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      "Last Modified": (
        <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      "Closing Balance": (
        <span className="inline-flex items-center gap-2">
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
            <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
          </FilterTrigger>
          <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
        </span>
      ),
    }),
    [],
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (searchValue.trim()) {
        const search = searchValue.toLowerCase();
        if (searchBy === "customerId") {
          if (!c.customerId.toLowerCase().includes(search)) return false;
        } else if (!c.name.toLowerCase().includes(search)) {
          return false;
        }
      }

      if (amountFilter.length > 0) {
        const balanceDirection = c.balanceType === "credit" ? "in" : "out";
        if (!amountFilter.includes(balanceDirection)) return false;
      }

      return true;
    });
  }, [customers, searchValue, searchBy, amountFilter]);

  const sortedCustomers = useMemo(() => {
    if (!sortState.key || sortState.direction === "none") {
      return filteredCustomers;
    }

    const sorted = [...filteredCustomers];
    const direction = sortState.direction === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      if (sortState.key === "Name") {
        return a.name.localeCompare(b.name) * direction;
      }
      if (sortState.key === "Last Modified") {
        const ta = a.lastModifiedRaw
          ? new Date(a.lastModifiedRaw).getTime()
          : 0;
        const tb = b.lastModifiedRaw
          ? new Date(b.lastModifiedRaw).getTime()
          : 0;
        return (ta - tb) * direction;
      }
      if (sortState.key === "Closing Balance") {
        return (a.closingBalance - b.closingBalance) * direction;
      }
      return 0;
    });

    return sorted;
  }, [filteredCustomers, sortState]);

  const summary = useMemo(() => {
    const youGet = filteredCustomers
      .filter((c) => c.balanceType === "credit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    const youGive = filteredCustomers
      .filter((c) => c.balanceType === "debit")
      .reduce((sum, c) => sum + c.closingBalance, 0);
    return { youGet, youGive, net: youGet - youGive };
  }, [filteredCustomers]);

  const isAllSelected =
    sortedCustomers.length > 0 &&
    selectedCustomerIds.length === sortedCustomers.length;
  const isSomeSelected =
    selectedCustomerIds.length > 0 && !isAllSelected;

  const selectedDeletables = useMemo((): DeletableItem[] => {
    const rowById = new Map(customers.map((c) => [c.customerId, c]));
    return selectedCustomerIds
      .map((id) => rowById.get(id))
      .filter((c): c is CustomerRow => Boolean(c))
      .map((c) => ({
        id: c.customerId,
        mongoId: c.rawId,
        name: c.name,
        ...(c.subtitle ? { subtitle: c.subtitle } : {}),
        dateModified: c.lastModified,
      }));
  }, [customers, selectedCustomerIds]);

  const selectAllHeaderCheckbox = useMemo(
    () =>
      renderSelectCheckbox(
        "finance-customers-select-all",
        isAllSelected,
        () => {
          if (isAllSelected) {
            setSelectedCustomerIds([]);
          } else {
            setSelectedCustomerIds(sortedCustomers.map((c) => c.customerId));
          }
        },
        isSomeSelected,
      ),
    [isAllSelected, isSomeSelected, sortedCustomers],
  );

  const renderNameCell = (row: { name: string; subtitle?: string }) => (
    <div className="mx-auto w-fit text-center">
      <div className="font-[500] text-[#020202]">{row.name}</div>
      {row.subtitle ? (
        <div className="table-cell-subtext mt-0.5 text-[#818181]">
          {row.subtitle}
        </div>
      ) : null}
    </div>
  );

  const openCustomerView = useCallback((customer: CustomerRow) => {
    setSelectedCustomerData(
      customer.raw ?? {
        name: customer.name,
        customId: customer.customerId,
      },
    );
    setCustomerViewOpen(true);
  }, []);

  const buildCustomerActions = useCallback(
    (row: CustomerRow) => [
      {
        label: "Edit",
        icon: <FaRegEdit size={14} />,
        color: "text-[#126ACB]",
        onClick: async () => {
          try {
            const customer = row.rawId
              ? await getCustomerById(row.rawId)
              : row.raw ?? { name: row.name, customId: row.customerId };
            setEditCustomerData(customer);
            setEditCustomerOpen(true);
          } catch (e) {
            console.error("Failed to fetch customer for edit:", e);
          }
        },
      },
      {
        label: "Delete",
        icon: <FaRegTrashAlt size={14} />,
        color: "text-red-600",
        confirmDeleteId: row.customerId,
        onClick: async () => {
          if (!row.rawId) return;
          await deleteCustomer(row.rawId);
          await fetchBalances();
        },
      },
      {
        label: "Link",
        icon: (
          <Image
            src="/icons/link-icon.svg"
            alt="Link"
            width={14}
            height={14}
            className="object-contain"
          />
        ),
        color: "text-[#419836]",
        onClick: () => {
          setLinkSourceProfile({
            profileType: "Customer",
            id: row.customerId,
            name: row.name,
            ...(row.subtitle ? { nickname: row.subtitle } : {}),
            tier: mapTierToNumber(row.raw?.tier),
          });
          setIsLinkModalOpen(true);
        },
      },
      {
        label: "Duplicate",
        icon: <FiCopy size={14} />,
        color: "text-[#818181]",
        confirmDuplicateId: row.customerId,
        onClick: async () => {
          try {
            const customer = row.rawId
              ? await getCustomerById(row.rawId)
              : row.raw;
            const res = await CustomIdApi.generate("customer");
            setGeneratedCustomerCode(res?.customId || "");
            setDuplicateCustomerData({
              ...customer,
              _id: undefined,
              customId: res?.customId || "",
            });
            setAddCustomerOpen(true);
          } catch (e) {
            console.error("Failed to duplicate customer:", e);
          }
        },
      },
    ],
    [fetchBalances],
  );

  const tableData = useMemo<JSX.Element[][]>(() => {
    return sortedCustomers.map((customer, index) => {
      const cells: JSX.Element[] = [];

      if (selectMode) {
        const isSelected = selectedCustomerIds.includes(customer.customerId);
        cells.push(
          <td key={`select-${index}`} className="px-4 py-3 text-center">
            {renderSelectCheckbox(
              `finance-customer-${customer.customerId}`,
              isSelected,
              () => {
                setSelectedCustomerIds((prev) =>
                  isSelected
                    ? prev.filter((id) => id !== customer.customerId)
                    : [...prev, customer.customerId],
                );
              },
            )}
          </td>,
        );
      }

      cells.push(
        <td
          key={`customerId-${index}`}
          className="h-[4rem] px-4 py-3 text-center align-middle font-[500] text-[#020202]"
        >
          {customer.customerId}
        </td>,
        <td
          key={`name-${index}`}
          className="h-[4rem] px-4 py-3 text-center align-middle"
        >
          <button
            type="button"
            onClick={() => openCustomerView(customer)}
            className="m-0 border-0 bg-transparent p-0"
            aria-label={`View ${customer.name}`}
          >
            {renderNameCell(customer)}
          </button>
        </td>,
        <td
          key={`lastModified-${index}`}
          className="h-[4rem] px-4 py-3 text-center align-middle text-[#414141]"
        >
          {customer.lastModified}
        </td>,
        <td
          key={`balance-${index}`}
          className="h-[4rem] px-4 py-3 text-center align-middle text-[14px]"
        >
          <span
            className={`inline-flex items-center justify-center gap-2 font-medium ${
              customer.balanceType === "debit"
                ? "text-[#C85542]"
                : "text-[#5E9D5A]"
            }`}
          >
            {customer.balanceType === "debit" ? (
              <TbCircleArrowUpRight className="text-[18px]" />
            ) : (
              <TbCircleArrowDownLeft className="text-[18px]" />
            )}
            <span>
              {getStoredCurrencySymbol()}{" "}
              {formatNumberByStoredCurrency(customer.closingBalance)}
            </span>
          </span>
        </td>,
        <td
          key={`actions-${index}`}
          className="h-[4rem] px-4 py-3 text-center align-middle text-[14px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto grid w-[12rem] grid-cols-[1fr_2rem] items-center gap-2"
          >
            <div className="flex min-h-[34px] items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setLedgerCustomerName(customer.name);
                  setLedgerCustomerId(customer.customerId);
                  setLedgerRawId(customer.rawId);
                  setLedgerCustomerData(
                    customer.raw ?? {
                      name: customer.name,
                      customId: customer.customerId,
                      _id: customer.rawId,
                    },
                  );
                  setLedgerOpen(true);
                }}
                className={BOOKING_HISTORY_ACTION_BUTTON_CLASS}
              >
                <MdOutlineRemoveRedEye size={14} />
                Ledger
              </button>
            </div>
            <div className="flex items-center justify-center">
              <ActionMenu
                actions={buildCustomerActions(customer)}
                align="left"
                width="min-w-[7.5rem]"
              />
            </div>
          </div>
        </td>,
      );

      return cells;
    });
  }, [
    buildCustomerActions,
    openCustomerView,
    selectMode,
    selectedCustomerIds,
    sortedCustomers,
  ]);

  const handleSort = useCallback((column: string) => {
    setSortState((prev) => {
      if (prev.key !== column) {
        return { key: column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key: column, direction: "desc" };
      }
      return { key: "", direction: "none" };
    });
  }, []);

  const handleSelectClick = useCallback(() => {
    setSelectMode(true);
    setSelectedCustomerIds([]);
    setIsMoreActionsOpen(false);
  }, []);

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedCustomerIds([]);
    setIsMoreActionsOpen(false);
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    if (isAllSelected) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(sortedCustomers.map((c) => c.customerId));
    }
  }, [isAllSelected, sortedCustomers]);

  const closeLedger = () => {
    setLedgerOpen(false);
    setLedgerCustomerName(null);
    setLedgerCustomerId(null);
    setLedgerRawId(null);
    setLedgerCustomerData(null);
  };

  const handleAddCustomer = async () => {
    try {
      setIsGeneratingCode(true);
      setDuplicateCustomerData(null);
      const res = await CustomIdApi.generate("customer");
      setGeneratedCustomerCode(res?.customId || null);
      setAddCustomerOpen(true);
    } catch (err) {
      console.error("Failed to generate customer code", err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const totalCount = customers.length;

  return (
    <>
      <BookingsPageViewport>
        <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-x-hidden">
          <div className="mb-6 flex items-center justify-between gap-4">
            <FinanceSummaryPills
              net={summary.net}
              youGive={summary.youGive}
              youGet={summary.youGet}
            />

            <div ref={moreActionsRef}>
              <TableHeaderActions
                selectMode={selectMode}
                isAllSelected={isAllSelected}
                isMenuOpen={isMoreActionsOpen}
                onMenuToggle={() => setIsMoreActionsOpen((prev) => !prev)}
                onCancelSelect={handleCancelSelectMode}
                onSelectAllToggle={handleSelectAllToggle}
                selectModeMenu={
                  <div
                    className="relative inline-flex items-center"
                    ref={selectActionsRef}
                  >
                    <button
                      type="button"
                      onClick={() => setIsMoreActionsOpen((prev) => !prev)}
                      className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] text-[#414141] transition-colors hover:bg-[#F3F3F3]"
                      aria-label="More actions"
                      aria-expanded={isMoreActionsOpen}
                    >
                      <IoEllipsisHorizontal className="text-[22px]" />
                    </button>
                    <DownloadMergeMenu
                      isOpen={isMoreActionsOpen}
                      onClose={() => setIsMoreActionsOpen(false)}
                      callback={() => {
                        setSelectedCustomerIds([]);
                        void fetchBalances();
                      }}
                      entity="customer"
                      items={selectedDeletables}
                      rootRef={selectActionsRef}
                      menuVariant="dropdown"
                    />
                  </div>
                }
                menu={
                  <SelectUploadMenu
                    isOpen={isMoreActionsOpen}
                    onClose={() => setIsMoreActionsOpen(false)}
                    onSelect={handleSelectClick}
                    entity="customer"
                    rootRef={moreActionsRef}
                  />
                }
                extraAction={
                  <button
                    type="button"
                    onClick={() => void handleAddCustomer()}
                    disabled={isGeneratingCode}
                    className="cursor-pointer rounded-[14px] bg-[#7135AD] px-[14px] py-[8px] text-[14px] font-[500] text-white disabled:opacity-60"
                  >
                    + Add Customer
                  </button>
                }
              />
            </div>
          </div>

          <div className="relative flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex h-[44px] max-w-[34rem] items-stretch overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white">
                  <button
                    ref={searchByRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = searchByRef.current?.getBoundingClientRect();
                      if (rect) {
                        setSearchByPos({
                          left: rect.left,
                          top: rect.top,
                          width: rect.width,
                          height: rect.height,
                        });
                      }
                      setSearchByOpen((prev) => !prev);
                    }}
                    className="flex h-full shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap px-3 text-[12px] font-[400] text-[#020202]"
                  >
                    <span>
                      {searchBy === "name" ? "Name" : "Customer ID"}
                    </span>
                    <MdOutlineKeyboardArrowDown className="text-[20px] text-[#7A7A7A]" />
                  </button>

                  <div className="flex min-w-0 flex-1 items-center border-l border-[#D9D9D9]">
                    <input
                      type="text"
                      placeholder="Type here"
                      value={searchValue}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const value =
                          searchBy === "customerId"
                            ? allowNoSpecialCharacters(raw)
                            : allowOnlyText(raw);
                        setSearchValue(value);
                      }}
                      className="h-full min-w-0 flex-1 bg-transparent pl-3 pr-3 text-[12px] font-normal text-[#111111] outline-none placeholder:text-[#A0A9BA]"
                    />
                    <CiSearch
                      className="mr-4 shrink-0 text-[#808080]"
                      size={22}
                    />
                  </div>
                </div>

                {searchByOpen &&
                  searchByPos &&
                  createPortal(
                    <div
                      style={{
                        position: "fixed",
                        left: searchByPos.left,
                        top: searchByPos.top + searchByPos.height + 4,
                        minWidth: searchByPos.width,
                        zIndex: 9999,
                      }}
                      className="overflow-hidden rounded-[16px] border border-[#D9D9D9] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.10)]"
                    >
                      {[
                        { value: "customerId", label: "Customer ID" },
                        { value: "name", label: "Name" },
                      ].map((option, index, arr) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSearchBy(option.value as "customerId" | "name");
                            setSearchByOpen(false);
                          }}
                          className={`block w-full cursor-pointer whitespace-nowrap px-3 py-2 text-left text-[12px] ${
                            searchBy === option.value
                              ? "text-[#7C3AED]"
                              : "text-[#444444]"
                          } ${index < arr.length - 1 ? "border-b border-[#D9D9D9]" : ""}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>,
                    document.body,
                  )}
              </div>

              <div className="flex shrink-0 items-center gap-[20px]">
                <TotalCountPill count={totalCount} />
              </div>
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col px-5 pb-0 pt-[4px]">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <Table
                  data={tableData}
                  columns={columns}
                  columnIconMap={columnIconMap}
                  onSort={handleSort}
                  categoryName="Customers"
                  initialRowsPerPage={10}
                  maxRowsPerPageOptions={[10, 20, 50, 100]}
                  headerClassName="bg-[#F3F3F3]"
                  headerRowTextClassName="text-[#818181]"
                  headerAlign={{
                    "Customer ID": "center",
                    Name: "center",
                    "Last Modified": "center",
                    "Closing Balance": "center",
                    Actions: "center",
                  }}
                  headerCellTextClassName="text-[#818181]"
                  columnWidthClassMap={{
                    "Customer ID": "w-[8rem]",
                    Name: "w-[12rem]",
                    "Last Modified": "w-[9rem]",
                    "Closing Balance": "w-[10rem]",
                    Actions: "w-[14rem]",
                  }}
                  showCheckboxColumn={selectMode}
                  headerCheckbox={selectMode ? selectAllHeaderCheckbox : undefined}
                  rowIds={sortedCustomers.map((c) => c.customerId)}
                  {...(selectMode
                    ? {}
                    : {
                        onRowClick: (index: number) => {
                          const row = sortedCustomers[index];
                          if (row) openCustomerView(row);
                        },
                      })}
                />
              )}
            </div>
          </div>
        </div>
      </BookingsPageViewport>

      <LedgerModal
        isOpen={ledgerOpen}
        onClose={closeLedger}
        customerName={ledgerCustomerName ?? null}
        customerId={ledgerCustomerId ?? null}
        rawId={ledgerRawId ?? null}
        onViewCustomer={() => {
          setSelectedCustomerData(ledgerCustomerData);
          setCustomerViewOpen(true);
        }}
        onEditCustomer={async () => {
          try {
            const customer = ledgerRawId
              ? await getCustomerById(ledgerRawId)
              : ledgerCustomerData;
            setEditCustomerData(customer);
            setEditCustomerOpen(true);
          } catch (e) {
            console.error("Failed to fetch customer for edit:", e);
          }
        }}
      />

      <BookingProvider>
        <AddCustomerSideSheet
          data={selectedCustomerData}
          isOpen={customerViewOpen}
          onCancel={() => {
            setCustomerViewOpen(false);
            setSelectedCustomerData(null);
          }}
          mode="view"
          customerCode={selectedCustomerData?.customId ?? selectedCustomerData?._id}
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
          onSuccess={() => void fetchBalances()}
          customerCode={editCustomerData?.customId ?? editCustomerData?._id}
        />
      </BookingProvider>

      <BookingProvider>
        <AddCustomerSideSheet
          data={duplicateCustomerData}
          isOpen={addCustomerOpen}
          onCancel={() => {
            setAddCustomerOpen(false);
            setGeneratedCustomerCode(null);
            setDuplicateCustomerData(null);
          }}
          mode="create"
          onSuccess={() => {
            setAddCustomerOpen(false);
            setGeneratedCustomerCode(null);
            setDuplicateCustomerData(null);
            void fetchBalances();
          }}
          {...(generatedCustomerCode ? { customerCode: generatedCustomerCode } : {})}
        />
      </BookingProvider>

      {isLinkModalOpen && (
        <LinkProfilesModal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setLinkSourceProfile(null);
          }}
          sourceProfile={linkSourceProfile}
        />
      )}
    </>
  );
};

export default FinanceCustomersPage;
