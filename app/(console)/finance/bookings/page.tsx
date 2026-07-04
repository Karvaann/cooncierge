"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import type { JSX } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { CiFilter } from "react-icons/ci";
import { TbArrowsExchange, TbArrowsUpDown } from "react-icons/tb";
import { FaRegCalendar } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import { LuDownload, LuSend } from "react-icons/lu";
import { FiCheck, FiCopy, FiEdit2, FiLink, FiTrash2, FiX } from "react-icons/fi";
import { RiRefreshLine } from "react-icons/ri";
import FilterSkeleton from "@/components/skeletons/FilterSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import Modal from "@/components/Modal";
import DropDown from "@/components/DropDown";
import AvatarTooltip from "@/components/AvatarToolTip";
import TaskButton from "@/components/TaskButton";
import UnderlineTabs from "@/components/UnderlineTabs";
import BookingsPageViewport from "@/components/bookings/BookingsPageViewport";
import RecordPaymentSidesheet from "@/components/Sidesheets/RecordPaymentSidesheet";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import FinanceSummaryPills from "@/components/finance/FinanceSummaryPills";
import FinanceBookingsCalendar from "@/components/finance/FinanceBookingsCalendar";
import TotalCountPill from "@/components/table/TotalCountPill";
import TableHeaderActions from "@/components/table/TableHeaderActions";
import {
  formatNumberByStoredCurrency,
  formatServiceType,
  getStoredCurrencySymbol,
} from "@/utils/helper";
import {
  getNextTriSortState,
  getItemTimestamp,
  type TriSortState,
} from "@/utils/sorting";
import {
  FINANCE_BOOKINGS_MOCK,
  type FinanceBookingRow,
  type FinancePaymentStatus,
  type FinanceApprovalStatus,
} from "@/mock-data/finance";

const Filter = dynamic(() => import("@/components/Filter"), {
  loading: () => <FilterSkeleton />,
  ssr: false,
});

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type FilterPayload = {
  serviceType: string | string[];
  status: string;
  owner: string | string[];
  bookingType: string;
  search: string;
  searchBy: string;
  bookingStartDate: string;
  bookingEndDate: string;
  tripStartDate: string;
  tripEndDate: string;
  primaryOwner?: string | string[];
  secondaryOwners?: string[];
};

const TAB_OPTIONS = ["Bookings", "Deleted", "Waiting for Approval"] as const;

const APPROVAL_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
] as const;

const PAYMENT_STATUS_SORT_ORDER: Record<FinancePaymentStatus, number> = {
  paid: 0,
  partially_paid: 1,
  pending: 2,
};

const toFilterArray = (value: string | string[]) =>
  Array.isArray(value) ? value : value ? [value] : [];

const VOUCHER_MENU_OPTIONS = [
  "Booking Voucher",
  "Customer Invoice(s)",
  "Vendor Voucher(s)",
  "Vendor Invoice(s)",
];

const getApprovalStatus = (row: FinanceBookingRow): FinanceApprovalStatus =>
  row.approvalStatus ??
  (row.isWaitingForApproval ? "pending" : "approved");

const OWNER_COLOR_FALLBACK = "border-pink-700 text-pink-700";

const getPaymentStatusLabel = (status: FinancePaymentStatus): string => {
  switch (status) {
    case "paid":
      return "Paid";
    case "partially_paid":
      return "Partially Paid";
    case "pending":
      return "Pending";
    default:
      return "Pending";
  }
};

const getPaymentStatusBadgeClass = (status: FinancePaymentStatus): string => {
  switch (status) {
    case "paid":
      return "px-2 py-1 text-[12px] border border-[#DCFCE7] font-[500] rounded-full bg-[#F0FDF4] text-[#15803D]";
    case "partially_paid":
      return "px-2 py-1 text-[12px] border border-[#FEF9C3] font-[500] rounded-full bg-[#FEFCE8] text-[#854D0E]";
    case "pending":
    default:
      return "px-2 py-1 text-[12px] border border-[#FFEDD5] font-[500] rounded-full bg-[#FFF7ED] text-[#C2410C]";
  }
};

const formatTravelDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--";
  return format(date, "dd MMM ''yy");
};

const isWithinRange = (
  rawDate: string | undefined,
  start: string,
  end: string,
) => {
  if (!rawDate) return false;
  const dt = new Date(rawDate);
  if (Number.isNaN(dt.getTime())) return false;
  if (start && dt < new Date(start)) return false;
  if (end) {
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    if (dt > e) return false;
  }
  return true;
};

const getServiceIcon = (quotationType: string): JSX.Element | string => {
  const normalized = quotationType.toLowerCase().trim();
  const iconMap: Record<string, JSX.Element | string> = {
    flight: (
      <Image
        src="/icons/service-icons/flight.svg"
        alt="Flight"
        width={16}
        height={16}
        className="object-contain"
      />
    ),
    accommodation: (
      <Image
        src="/icons/service-icons/accommodation.svg"
        alt="Accommodation"
        width={14}
        height={14}
        className="object-contain"
      />
    ),
    activity: (
      <Image
        src="/icons/service-icons/activity.svg"
        alt="Activity"
        width={9}
        height={9}
        className="object-contain"
      />
    ),
    transportation: (
      <Image
        src="/icons/service-icons/transport.svg"
        alt="Transportation"
        width={15}
        height={14}
        className="object-contain"
      />
    ),
    ticket: (
      <Image
        src="/icons/service-icons/ticket.svg"
        alt="Ticket"
        width={14}
        height={14}
        className="object-contain"
      />
    ),
    "travel insurance": (
      <Image
        src="/icons/service-icons/insurance.svg"
        alt="Insurance"
        width={14}
        height={14}
        className="object-contain"
      />
    ),
    visa: (
      <Image
        src="/icons/service-icons/visa-icon-final.svg"
        alt="Visa"
        width={12}
        height={12}
        className="object-contain"
      />
    ),
  };

  return iconMap[normalized] || formatServiceType(quotationType);
};

const FinanceBookingsPage = () => {
  const [activeTab, setActiveTab] = useState<string>(TAB_OPTIONS[0]);
  const [bookingScope, setBookingScope] = useState("");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<
    "Travel Date" | "Service" | null
  >(null);
  const [pendingServiceTypes, setPendingServiceTypes] = useState<string[]>([]);
  const [pendingDateField, setPendingDateField] = useState<
    "travelDate" | "bookingDate"
  >("travelDate");
  const [travelDateField, setTravelDateField] = useState<
    "travelDate" | "bookingDate"
  >("travelDate");
  const [filters, setFilters] = useState<FilterPayload>({
    serviceType: "",
    status: "",
    owner: "",
    bookingType: "",
    search: "",
    searchBy: "bookingId",
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
  const [activeVoucherRowId, setActiveVoucherRowId] = useState<string | null>(
    null,
  );
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedPaymentBooking, setSelectedPaymentBooking] =
    useState<FinanceBookingRow | null>(null);
  const [approvalConfirm, setApprovalConfirm] = useState<{
    action: "approve" | "reject";
    booking: FinanceBookingRow;
  } | null>(null);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const moreActionsRef = useRef<HTMLDivElement | null>(null);

  const { summary, totalCount, bookings } = FINANCE_BOOKINGS_MOCK;

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

  const columns = useMemo(
    () => [
      "Booking ID",
      "Lead Pax",
      travelDateField === "bookingDate" ? "Booking Date" : "Travel Date",
      "Service",
      "Payment Status",
      "Amount",
      "Owner",
      "Voucher",
      "Tasks",
      "Actions",
    ],
    [travelDateField],
  );

  const dateColumnLabel =
    travelDateField === "bookingDate" ? "Booking Date" : "Travel Date";

  useEffect(() => {
    if (!activeHeaderFilter) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("[data-header-filter-trigger]") ||
        target?.closest("[data-header-filter-dropdown]")
      ) {
        return;
      }
      setActiveHeaderFilter(null);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activeHeaderFilter]);

  useEffect(() => {
    if (activeHeaderFilter === "Service") {
      setPendingServiceTypes(toFilterArray(filters.serviceType));
    }
    if (activeHeaderFilter === "Travel Date") {
      setPendingDateField(travelDateField);
    }
  }, [activeHeaderFilter, filters.serviceType, travelDateField]);

  useEffect(() => {
    if (!activeVoucherRowId) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("[data-voucher-menu]") ||
        target?.closest("[data-voucher-trigger]")
      ) {
        return;
      }
      setActiveVoucherRowId(null);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activeVoucherRowId]);

  useEffect(() => {
    if (!isMoreActionsOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (
        moreActionsRef.current &&
        !moreActionsRef.current.contains(event.target as Node)
      ) {
        setIsMoreActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isMoreActionsOpen]);

  const ownerOptions = useMemo(() => {
    const names = new Set<string>();
    bookings.forEach((row) =>
      row.owners.forEach((owner) => names.add(owner.name)),
    );
    return Array.from(names).map((name) => ({ value: name, label: name }));
  }, [bookings]);

  const filterOptions = useMemo(
    () => ({
      serviceTypes: [
        { value: "flight", label: "Flight" },
        { value: "accommodation", label: "Accommodation" },
        { value: "transportation", label: "Transportation" },
        { value: "activity", label: "Activity" },
        { value: "visa", label: "Visa" },
      ],
      statuses: [
        { value: "paid", label: "Paid" },
        { value: "partially_paid", label: "Partially Paid" },
        { value: "pending", label: "Pending" },
      ],
      owners: ownerOptions,
    }),
    [ownerOptions],
  );

  const filteredBookings = useMemo(() => {
    return bookings.filter((row) => {
      if (activeTab === "Deleted") {
        if (!row.isDeleted) return false;
      } else if (activeTab === "Waiting for Approval") {
        if (!row.isWaitingForApproval || row.isDeleted) return false;
      } else if (row.isDeleted) {
        return false;
      }

      if (bookingScope && getApprovalStatus(row) !== bookingScope) {
        return false;
      }

      if (filters.bookingType === "os" && !row.customId.startsWith("OS")) {
        return false;
      }
      if (filters.bookingType === "limitless" && !row.customId.startsWith("LI")) {
        return false;
      }

      if (showIncompleteOnly && !row.isIncomplete) {
        return false;
      }

      if (filters.search.trim()) {
        const search = filters.search.toLowerCase();
        const matches =
          filters.searchBy === "leadPax"
            ? row.leadPax.toLowerCase().includes(search)
            : filters.searchBy === "amount"
              ? String(row.amount).includes(search.replace(/[^\d]/g, ""))
              : row.customId.toLowerCase().includes(search);
        if (!matches) return false;
      }

      if (filters.bookingStartDate || filters.bookingEndDate) {
        if (
          !isWithinRange(
            row.bookingDate,
            filters.bookingStartDate,
            filters.bookingEndDate,
          )
        ) {
          return false;
        }
      }

      if (filters.tripStartDate || filters.tripEndDate) {
        if (
          !isWithinRange(
            row.travelDate,
            filters.tripStartDate,
            filters.tripEndDate,
          )
        ) {
          return false;
        }
      }

      const selectedOwners = Array.isArray(filters.owner)
        ? filters.owner
        : filters.owner
          ? [filters.owner]
          : [];

      if (selectedOwners.length > 0) {
        const rowOwnerNames = row.owners.map((owner) => owner.name);
        if (!rowOwnerNames.some((name) => selectedOwners.includes(name))) {
          return false;
        }
      }

      const selectedServices = Array.isArray(filters.serviceType)
        ? filters.serviceType
        : filters.serviceType
          ? [filters.serviceType]
          : [];

      if (selectedServices.length > 0) {
        if (!selectedServices.includes(row.quotationType)) return false;
      }

      if (filters.status) {
        const normalized = filters.status.toLowerCase();
        if (row.paymentStatus !== normalized.replace(/\s+/g, "_")) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, bookingScope, bookings, filters, showIncompleteOnly]);

  const isAllSelected = useMemo(() => {
    if (!selectMode) return false;
    if (filteredBookings.length === 0) return false;
    return filteredBookings.every((row) => selectedBookingIds.includes(row.id));
  }, [filteredBookings, selectMode, selectedBookingIds]);

  const isSomeSelected = useMemo(() => {
    if (!selectMode) return false;
    if (selectedBookingIds.length === 0) return false;
    return !isAllSelected;
  }, [isAllSelected, selectMode, selectedBookingIds.length]);

  const selectAllHeaderCheckbox = useMemo(
    () =>
      renderSelectCheckbox(
        "finance-bookings-select-all",
        isAllSelected,
        () => {
          if (isAllSelected) {
            setSelectedBookingIds([]);
          } else {
            setSelectedBookingIds(filteredBookings.map((r) => r.id));
          }
        },
        isSomeSelected,
      ),
    [filteredBookings, isAllSelected, isSomeSelected],
  );

  const sortedBookings = useMemo(() => {
    if (!sortState.key || sortState.direction === "none") {
      return filteredBookings;
    }

    const withIndex = filteredBookings.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));

    withIndex.sort((a, b) => {
      let cmp = 0;
      if (sortState.key === "Travel Date" || sortState.key === "Booking Date") {
        const dateKey =
          travelDateField === "bookingDate" ? "bookingDate" : "travelDate";
        const ta = getItemTimestamp({ createdAt: a.item[dateKey] }) ?? 0;
        const tb = getItemTimestamp({ createdAt: b.item[dateKey] }) ?? 0;
        cmp = ta - tb;
      } else if (sortState.key === "Lead Pax") {
        cmp = a.item.leadPax.localeCompare(b.item.leadPax);
      } else if (sortState.key === "Payment Status") {
        cmp =
          PAYMENT_STATUS_SORT_ORDER[a.item.paymentStatus] -
          PAYMENT_STATUS_SORT_ORDER[b.item.paymentStatus];
      } else if (sortState.key === "Amount") {
        cmp = a.item.amount - b.item.amount;
      }
      if (cmp === 0) return a.originalIndex - b.originalIndex;
      return sortState.direction === "asc" ? cmp : -cmp;
    });

    return withIndex.map((entry) => entry.item);
  }, [filteredBookings, sortState.direction, sortState.key, travelDateField]);

  const handleSort = useCallback((column: string) => {
    const sortableColumns = [
      "Travel Date",
      "Booking Date",
      "Lead Pax",
      "Payment Status",
      "Amount",
    ];
    if (!sortableColumns.includes(column)) return;
    setSortState((prev) => getNextTriSortState(prev, column));
  }, []);

  const handleFilterChange = useCallback((next: FilterPayload) => {
    setFilters(next);
  }, []);

  const travelDateFieldOptions = useMemo(
    () => [
      { value: "travelDate", label: "Travel Date" },
      { value: "bookingDate", label: "Booking Date" },
    ],
    [],
  );

  const renderSingleSelectDropdown = useCallback(
    (
      value: string,
      options: Array<{ value: string; label: string }>,
      onSelect: (nextValue: string) => void,
      onReset: () => void,
      onApply: () => void,
    ) => (
      <div
        data-header-filter-dropdown="Travel Date"
        className="flex max-h-[340px] w-[200px] flex-col overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.14)]"
      >
        <div className="overflow-y-auto">
          {options.map((opt, idx) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`flex w-full items-center gap-[8px] p-[12px] text-left font-[400] text-[13px] text-[#414141] ${idx === 0 ? "border-t border-[#E1E1E1]" : ""} border-b border-[#E1E1E1] last:border-b-0`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-[6px] border ${
                  value === opt.value
                    ? "border-[#7135AD] bg-[#7135AD] text-white"
                    : "border-[#D3D3D3] bg-white text-transparent"
                }`}
              >
                <FiCheck className="h-3 w-3" />
              </span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="sticky bottom-0 flex items-center justify-between border-t border-[#D7D7D7] bg-white px-4 py-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-[8px] border border-[#D7D7D7] p-2 text-[13px] text-[#6A6A6A]"
          >
            <RiRefreshLine size={12} />
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-[10px] bg-[#7135AD] px-5 py-1.5 text-[13px] font-[600] text-white"
          >
            Apply
          </button>
        </div>
      </div>
    ),
    [],
  );

  const renderMultiSelectDropdown = useCallback(
    (
      options: Array<{ value: string; label: string }>,
      pendingValues: string[],
      onToggle: (value: string) => void,
      onReset: () => void,
      onApply: () => void,
    ) => (
      <div
        data-header-filter-dropdown="Service"
        className="flex max-h-[320px] w-[220px] flex-col overflow-hidden rounded-[18px] border border-[#D7D7D7] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.14)]"
      >
        <div className="overflow-y-auto">
          {options.map((opt, idx) => {
            const checked = pendingValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggle(opt.value)}
                className={`flex w-full items-center gap-[8px] p-[10px] text-left font-[400] text-[12px] text-[#020202] ${
                  idx < options.length - 1 ? "border-b border-[#D7D7D7]" : ""
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-[6px] border text-[15px] ${
                    checked
                      ? "border-[#7135AD] bg-[#7135AD] text-white"
                      : "border-[#D3D3D3] bg-white text-transparent"
                  }`}
                >
                  <FiCheck className="h-3 w-3" />
                </span>
                <span className="text-[#4A4A4A]">{opt.label}</span>
              </button>
            );
          })}
        </div>
        <div className="sticky bottom-0 flex items-center justify-between border-t border-[#D7D7D7] bg-white px-5 py-4">
          <button
            type="button"
            onClick={onReset}
            className="rounded-[8px] border border-[#D7D7D7] p-2 text-[14px] text-[#6A6A6A]"
          >
            <RiRefreshLine size={15} />
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-[12px] bg-[#7135AD] px-6 py-2 text-[14px] font-[600] text-white"
          >
            Apply
          </button>
        </div>
      </div>
    ),
    [],
  );

  const columnIconMap = useMemo(() => {
    const sortButton = (column: string) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSort(column);
        }}
        className="inline-flex items-center rounded-sm text-[#818181] transition-colors hover:text-[#7135AD]"
      >
        <TbArrowsUpDown className="inline h-[13px] w-[13px] stroke-[2]" />
      </button>
    );
    const swapSortButton = (column: string) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSort(column);
        }}
        className="inline-flex items-center rounded-sm text-[#818181] transition-colors hover:text-[#7135AD]"
      >
        <TbArrowsExchange className="inline h-[14px] w-[14px] stroke-[2]" />
      </button>
    );

    return {
      "Lead Pax": swapSortButton("Lead Pax"),
      "Travel Date": (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            data-header-filter-trigger="Travel Date"
            onClick={(e) => {
              e.stopPropagation();
              setActiveHeaderFilter((prev) =>
                prev === "Travel Date" ? null : "Travel Date",
              );
            }}
            className="inline-flex items-center rounded-sm transition-colors"
          >
            <CiFilter
              className={`inline h-[13px] w-[13px] stroke-[2] ${
                activeHeaderFilter === "Travel Date"
                  ? "text-[#7C3AED]"
                  : "text-[#818181] hover:text-[#7135AD]"
              }`}
            />
          </button>
          {sortButton(dateColumnLabel)}
        </span>
      ),
      "Booking Date": (
        <span className="inline-flex items-center gap-1.5">
          <button
            type="button"
            data-header-filter-trigger="Travel Date"
            onClick={(e) => {
              e.stopPropagation();
              setActiveHeaderFilter((prev) =>
                prev === "Travel Date" ? null : "Travel Date",
              );
            }}
            className="inline-flex items-center rounded-sm transition-colors"
          >
            <CiFilter
              className={`inline h-[13px] w-[13px] stroke-[2] ${
                activeHeaderFilter === "Travel Date"
                  ? "text-[#7C3AED]"
                  : "text-[#818181] hover:text-[#7135AD]"
              }`}
            />
          </button>
          {sortButton(dateColumnLabel)}
        </span>
      ),
      Service: (
        <CiFilter
          className={`inline h-[13px] w-[13px] stroke-[2] ${
            activeHeaderFilter === "Service"
              ? "text-[#7C3AED]"
              : "text-[#818181] hover:text-[#7135AD]"
          }`}
        />
      ),
      "Payment Status": swapSortButton("Payment Status"),
      Amount: sortButton("Amount"),
    } as Record<string, JSX.Element>;
  }, [activeHeaderFilter, dateColumnLabel, handleSort]);

  const headerDropdownMap = useMemo(
    () => ({
      "Travel Date": {
        isOpen: activeHeaderFilter === "Travel Date",
        align: "center" as const,
        content: renderSingleSelectDropdown(
          pendingDateField,
          travelDateFieldOptions,
          (nextValue) => {
            if (nextValue === "travelDate" || nextValue === "bookingDate") {
              setPendingDateField(nextValue);
            }
          },
          () => setPendingDateField("travelDate"),
          () => {
            setTravelDateField(pendingDateField);
            setActiveHeaderFilter(null);
          },
        ),
      },
      "Booking Date": {
        isOpen: activeHeaderFilter === "Travel Date",
        align: "center" as const,
        content: renderSingleSelectDropdown(
          pendingDateField,
          travelDateFieldOptions,
          (nextValue) => {
            if (nextValue === "travelDate" || nextValue === "bookingDate") {
              setPendingDateField(nextValue);
            }
          },
          () => setPendingDateField("travelDate"),
          () => {
            setTravelDateField(pendingDateField);
            setActiveHeaderFilter(null);
          },
        ),
      },
      Service: {
        isOpen: activeHeaderFilter === "Service",
        align: "center" as const,
        content: renderMultiSelectDropdown(
          filterOptions.serviceTypes,
          pendingServiceTypes,
          (value) =>
            setPendingServiceTypes((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value],
            ),
          () => setPendingServiceTypes([]),
          () => {
            setFilters((prev) => ({
              ...prev,
              serviceType: pendingServiceTypes,
            }));
            setActiveHeaderFilter(null);
          },
        ),
      },
    }),
    [
      activeHeaderFilter,
      filterOptions.serviceTypes,
      pendingDateField,
      pendingServiceTypes,
      renderMultiSelectDropdown,
      renderSingleSelectDropdown,
      travelDateFieldOptions,
    ],
  );

  const handleHeaderIconClick = useCallback((column: string) => {
    if (column !== "Service") return;
    setActiveHeaderFilter((prev) => (prev === "Service" ? null : "Service"));
  }, []);

  const tableData = useMemo<JSX.Element[][]>(() => {
    return sortedBookings.map((row, index) => {
      const cells: JSX.Element[] = [];
      const showApprovalActions = Boolean(row.requiresApprovalAction);

      if (selectMode) {
        const isSelected = selectedBookingIds.includes(row.id);
        cells.push(
          <td key={`select-${index}`} className="px-4 py-3 text-center">
            {renderSelectCheckbox(`finance-booking-${row.id}`, isSelected, () => {
              setSelectedBookingIds((prev) =>
                isSelected
                  ? prev.filter((id) => id !== row.id)
                  : [...prev, row.id],
              );
            })}
          </td>,
        );
      }

      cells.push(
        <td
          key={`id-${index}`}
          className="h-[3rem] cursor-pointer px-4 py-3 text-center align-middle font-[500] text-[13px]"
        >
          {row.customId}
        </td>,
      <td
        key={`lead-${index}`}
        className="h-[3rem] cursor-pointer px-4 py-3 text-center align-middle text-[13px] font-[400]"
      >
        {row.leadPax}
      </td>,
      <td
        key={`date-${index}`}
        className="h-[3rem] cursor-pointer px-4 py-3 text-center align-middle text-[13px] font-[400]"
      >
        {formatTravelDate(
          travelDateField === "bookingDate" ? row.bookingDate : row.travelDate,
        )}
      </td>,
      <td
        key={`service-${index}`}
        className="h-[3rem] cursor-pointer px-4 py-3 text-center align-middle text-[13px] font-[400]"
      >
        {row.serviceDisplayVariant === "pill" ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-[13px] font-[500] leading-[16px] text-[#020202]">
              {row.serviceLabel.split("/")[0]?.trim() || row.serviceLabel}
            </span>
            <span className="inline-flex rounded-full bg-[#F3E8FF] px-3 py-1 text-[12px] font-[500] leading-[14px] text-[#7135AD]">
              {row.serviceLabel.split("/")[1]?.trim() || row.serviceLabel}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex h-4 w-4 items-center justify-center">
              {getServiceIcon(row.quotationType)}
            </div>
            <span className="text-center leading-tight">{row.serviceLabel}</span>
          </div>
        )}
      </td>,
      <td
        key={`status-${index}`}
        className="h-[3rem] cursor-pointer px-4 py-3 text-center align-middle text-[13px]"
      >
        <span className="group/status relative inline-flex">
          <span className={getPaymentStatusBadgeClass(row.paymentStatus)}>
            {getPaymentStatusLabel(row.paymentStatus)}
          </span>
          {row.paymentStatus === "pending" ? (
            <span className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-[160] hidden w-max -translate-x-1/2 rounded-[10px] bg-[#202020] px-4 py-3 text-left font-[Poppins,sans-serif] text-[11px] font-[600] leading-[18px] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)] group-hover/status:block">
              <span className="block text-[10px] font-[700] uppercase tracking-[0.4px]">
                Pending Amount
              </span>
              <span className="mt-1 block whitespace-nowrap">
                CUSTOMER : {getStoredCurrencySymbol()}{" "}
                {formatNumberByStoredCurrency(row.amount)}
              </span>
              <span className="block whitespace-nowrap">
                VENDOR : {getStoredCurrencySymbol()}{" "}
                {formatNumberByStoredCurrency(row.amount)}
              </span>
              <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-[#202020]" />
            </span>
          ) : null}
        </span>
      </td>,
      <td
        key={`amount-${index}`}
        className="h-[3rem] cursor-pointer px-4 py-3 text-center align-middle text-[13px] font-[400] text-[#020202]"
      >
        {getStoredCurrencySymbol()}{" "}
        {formatNumberByStoredCurrency(row.amount)}
      </td>,
      <td
        key={`owners-${index}`}
        className="h-[3rem] cursor-pointer px-4 py-3 text-center align-middle"
      >
        <div className="flex items-center justify-center">
          {row.owners.map((owner, ownerIndex) => (
            <AvatarTooltip
              key={`${owner.initials}-${ownerIndex}`}
              short={owner.initials}
              full={owner.name}
              color={owner.color || OWNER_COLOR_FALLBACK}
            />
          ))}
        </div>
      </td>,
      <td key={`voucher-${index}`} className="h-[3rem] px-4 py-3 text-center align-middle">
        {row.hasVoucher === false ? (
          <span className="text-[18px] font-[400] leading-none text-[#020202]">--</span>
        ) : (
          <div className="relative flex items-center justify-center">
            <div className="inline-flex overflow-hidden rounded-[7px] border border-[#E2E1E1] bg-[#FFF] hover:bg-[#F7F7F7]">
              <span className="flex items-center justify-center border-r border-[#E2E1E1] p-[6px]">
                <Image
                  src="/icons/voucher-icon.svg"
                  alt="Voucher"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </span>
              <button
                type="button"
                data-voucher-trigger
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVoucherRowId((prev) =>
                    prev === row.id ? null : row.id,
                  );
                }}
                className="flex items-center justify-center p-[6px]"
              >
                <IoChevronDown className="h-[14px] w-[14px] text-[#8A8A8A]" />
              </button>
            </div>

            {activeVoucherRowId === row.id && (
              <div
                data-voucher-menu
                className="absolute left-1/2 top-[48px] z-[140] w-[180px] -translate-x-1/2 overflow-hidden rounded-[12px] border border-[#D6D6D6] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
                onClick={(e) => e.stopPropagation()}
              >
                {VOUCHER_MENU_OPTIONS.map((label, optionIndex) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveVoucherRowId(null)}
                    className={`flex w-full items-center gap-[6px] px-[16px] py-[10px] text-left text-[12px] font-[400] text-[#3E3E3E] hover:bg-[#FAF7FF] ${
                      optionIndex < VOUCHER_MENU_OPTIONS.length - 1
                        ? "border-b border-[#DCDCDC]"
                        : ""
                    }`}
                  >
                    <LuDownload className="h-[15px] w-[15px] text-[#7C3AED]" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </td>,
      <td key={`tasks-${index}`} className="h-[3rem] px-4 py-3 text-center align-middle">
        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
          {row.hasVoucher === false && row.taskCount === 0 ? (
            <span className="text-[18px] font-[400] leading-none text-[#020202]">--</span>
          ) : (
            <TaskButton count={row.taskCount} bookingId={row.id} />
          )}
        </div>
      </td>,
      <td key={`actions-${index}`} className="h-[4rem] px-4 py-3 text-center align-middle">
        <div
          className="mx-auto flex w-fit items-center gap-[8px]"
          onClick={(e) => e.stopPropagation()}
        >
          {showApprovalActions ? (
            <>
              <button
                type="button"
                aria-label="Approve booking"
                onClick={() =>
                  setApprovalConfirm({ action: "approve", booking: row })
                }
                className="flex h-11 w-11 items-center justify-center rounded-[9px] border border-[#3FA34D] bg-white text-[#3FA34D] transition-colors hover:bg-[#F0FDF4]"
              >
                <FiCheck className="h-[22px] w-[22px] stroke-[3]" />
              </button>
              <button
                type="button"
                aria-label="Reject booking"
                onClick={() =>
                  setApprovalConfirm({ action: "reject", booking: row })
                }
                className="flex h-11 w-11 items-center justify-center rounded-[9px] border border-[#DD1425] bg-white text-[#DD1425] transition-colors hover:bg-[#FFF5F5]"
              >
                <FiX className="h-[22px] w-[22px] stroke-[3]" />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="rounded-[6px] border border-[#E2E1E1] bg-[#FFF] px-[11px] py-1.5 text-[14px] font-[400] text-[#414141] hover:text-[#7135AD]"
              onClick={() => {
                setSelectedPaymentBooking(row);
                setIsRecordPaymentOpen(true);
              }}
            >
              {getStoredCurrencySymbol()}
            </button>
          )}
          <ActionMenu
            actions={
              row.paymentStatus === "pending"
                ? [
                    {
                      label: "Send for Approval",
                      icon: <LuSend size={18} />,
                      color: "text-[#414141]",
                      onClick: () => {},
                      showDividerAfter: true,
                    },
                    {
                      label: "Delete",
                      icon: <FiTrash2 size={18} />,
                      color: "text-[#DD1425]",
                      onClick: () => {},
                      showDividerAfter: true,
                    },
                    {
                      label: "Duplicate",
                      icon: <FiCopy size={18} />,
                      color: "text-[#414141]",
                      onClick: () => {},
                    },
                  ]
                : [
                    {
                      label: "Edit",
                      icon: <FiEdit2 size={16} />,
                      color: "text-[#006FE7]",
                      onClick: () => {
                        setSelectedPaymentBooking(row);
                        setIsRecordPaymentOpen(true);
                      },
                      showDividerAfter: true,
                    },
                    {
                      label: "Delete",
                      icon: <FiTrash2 size={16} />,
                      color: "text-[#DD1425]",
                      onClick: () => {},
                      showDividerAfter: true,
                    },
                    {
                      label: "Link",
                      icon: <FiLink size={16} />,
                      color: "text-[#3FA34D]",
                      onClick: () => {},
                      showDividerAfter: true,
                    },
                    {
                      label: "Duplicate",
                      icon: <FiCopy size={16} />,
                      color: "text-[#818181]",
                      onClick: () => {},
                    },
                  ]
            }
            width={row.paymentStatus === "pending" ? "w-[17.25rem]" : "w-[13rem]"}
            right="right-10"
          />
        </div>
      </td>,
      );

      return cells;
    });
  }, [
    activeTab,
    activeVoucherRowId,
    sortedBookings,
    selectMode,
    selectedBookingIds,
    travelDateField,
  ]);


  const handleSelectClick = useCallback(() => {
    setViewMode("table");
    setSelectMode(true);
    setSelectedBookingIds([]);
    setIsMoreActionsOpen(false);
  }, []);

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedBookingIds([]);
    setIsMoreActionsOpen(false);
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    if (isAllSelected) {
      setSelectedBookingIds([]);
    } else {
      setSelectedBookingIds(filteredBookings.map((r) => r.id));
    }
  }, [filteredBookings, isAllSelected]);

  return (
    <BookingsPageViewport>
      <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-x-hidden bg-[#F9F9F9]">
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
              menu={
                <SelectUploadMenu
                  isOpen={isMoreActionsOpen}
                  onClose={() => setIsMoreActionsOpen(false)}
                  onSelect={handleSelectClick}
                  entity="booking"
                  rootRef={moreActionsRef}
                />
              }
              extraAction={
                <button
                  type="button"
                  onClick={() =>
                    setViewMode((prev) =>
                      prev === "calendar" ? "table" : "calendar",
                    )
                  }
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-[14px] border transition-colors ${
                    viewMode === "calendar"
                      ? "border-[#7135AD] bg-white text-[#7135AD] hover:bg-[#7135AD0D]"
                      : "border-[#E2E1E1] bg-white text-[#414141] hover:bg-[#FAFAFA]"
                  }`}
                  aria-label="Calendar view"
                  aria-pressed={viewMode === "calendar"}
                >
                  <FaRegCalendar className="h-[18px] w-[18px]" />
                </button>
              }
            />
          </div>
        </div>

        <Filter
          onFilterChange={handleFilterChange}
          onSearchChange={(value) =>
            setFilters((prev) => ({ ...prev, search: value }))
          }
          serviceTypes={filterOptions.serviceTypes}
          statuses={filterOptions.statuses}
          owners={filterOptions.owners}
          searchOptions={[
            {
              value: "bookingId",
              label: "Booking ID",
              placeholder: "Search by Booking ID",
              minChars: 2,
            },
            {
              value: "leadPax",
              label: "Lead Pax",
              placeholder: "Search by Lead Pax",
              minChars: 2,
            },
            {
              value: "amount",
              label: "Amount",
              placeholder: "Search by Amount",
              minChars: 2,
            },
          ]}
          showCreateButton={false}
          showBookingType={true}
          allowAdvanceOwnerSearch={true}
        />

        {viewMode === "calendar" ? (
          <FinanceBookingsCalendar />
        ) : (
        <div className="relative mt-4 flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
            <div className="flex min-w-0 flex-1 items-center">
              <UnderlineTabs
                tabs={[...TAB_OPTIONS]}
                activeTab={activeTab}
                onChange={setActiveTab}
                totalCount={filteredBookings.length}
                className="!border-b-0"
                indicatorClassName="!bottom-[-18px]"
              />
              <div className="ml-2 shrink-0">
                <DropDown
                  options={APPROVAL_FILTER_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: (
                      <span
                        className={
                          bookingScope === opt.value
                            ? "font-[500] text-[#7135AD]"
                            : "text-[#414141]"
                        }
                      >
                        {opt.label}
                      </span>
                    ),
                  }))}
                  value={bookingScope}
                  onChange={setBookingScope}
                  customWidth="w-[132px]"
                  customHeight="py-[6px]"
                  buttonClassName="!rounded-[10px] !border-[#E2E1E1] !bg-white !px-3 !text-[13px] !font-[500] !leading-[20px] !text-[#414141]"
                  menuWidth="w-full"
                  menuClassName="!rounded-[8px] !border-[#E2E1E1] !shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
                  optionClassName="!px-3 !py-1.5 !text-[12px] !leading-[20px] [&_*]:!text-[12px] [&_*]:!leading-[20px]"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-[20px]">
              <div className="flex items-center gap-[6px]">
                <button
                  type="button"
                  onClick={() => setShowIncompleteOnly((prev) => !prev)}
                  className={`relative inline-flex h-5 w-8 cursor-pointer items-center rounded-full transition-colors ${
                    showIncompleteOnly ? "bg-[#7135AD]" : "bg-[#C9CCCE]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showIncompleteOnly
                        ? "translate-x-3.5"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="whitespace-nowrap text-[12px] font-[400] text-[#414141]">
                  Show Incomplete Bookings
                </span>
              </div>

              <TotalCountPill count={totalCount} />
            </div>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col px-5 pb-0 pt-[4px]">
            <Table
              data={tableData}
              columns={columns}
              columnIconMap={columnIconMap}
              onHeaderIconClick={handleHeaderIconClick}
              headerIconClickableColumns={["Service"]}
              headerDropdownMap={headerDropdownMap}
              onSort={handleSort}
              categoryName="Bookings"
              headerAlign={{ "Booking ID": "center" }}
              enableRowHoverActions
              showCheckboxColumn={selectMode}
              headerCheckbox={selectMode ? selectAllHeaderCheckbox : undefined}
              columnWidthClassMap={{
                "Booking ID": "w-[8rem]",
                Voucher: "w-[9rem]",
                Tasks: "w-[7.5rem]",
                Actions: "w-[10rem]",
              }}
              initialRowsPerPage={8}
              maxRowsPerPageOptions={[8, 16, 24, 48]}
              headerClassName="bg-[#F3F3F3]"
              headerRowTextClassName="text-[#818181]"
              headerCellTextClassName="text-[#818181]"
            />
          </div>
        </div>
        )}

      </div>

      <RecordPaymentSidesheet
        isOpen={isRecordPaymentOpen}
        booking={
          selectedPaymentBooking
            ? {
                _id: selectedPaymentBooking.id,
                customId: selectedPaymentBooking.customId,
                formFields: { customer: selectedPaymentBooking.leadPax },
              }
            : null
        }
        onClose={() => {
          setIsRecordPaymentOpen(false);
          setSelectedPaymentBooking(null);
        }}
        onError={() => {}}
        onSuccess={() => {}}
      />

      {approvalConfirm ? (
        <Modal
          isOpen={Boolean(approvalConfirm)}
          onClose={() => setApprovalConfirm(null)}
          title=""
          customWidth="w-[330px]"
          customeHeight="h-fit"
          showCloseButton={false}
          zIndexClass="z-[1200]"
          noBodyPadding
          className="!rounded-[14px]"
        >
          <div className="px-5 py-4 font-[Poppins,sans-serif]">
            <p className="text-[12px] font-[400] leading-[18px] text-[#414141]">
              Are you sure you want to{" "}
              {approvalConfirm.action === "approve" ? "approve" : "reject"} this
              booking with ID{" "}
              <span className="font-[600]">
                &apos;{approvalConfirm.booking.customId}&apos;
              </span>
              ?
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setApprovalConfirm(null)}
                className="rounded-[8px] border border-[#E2E1E1] bg-white px-4 py-1.5 text-[12px] font-[500] text-[#414141] transition-colors hover:bg-[#F2F2F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setApprovalConfirm(null)}
                className={`rounded-[8px] px-4 py-1.5 text-[12px] font-[600] text-white transition-opacity hover:opacity-90 ${
                  approvalConfirm.action === "approve"
                    ? "bg-[#3FA34D]"
                    : "bg-[#DD1425]"
                }`}
              >
                {approvalConfirm.action === "approve"
                  ? "Yes, Approve"
                  : "Yes, Reject"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

    </BookingsPageViewport>
  );
};

export default FinanceBookingsPage;
