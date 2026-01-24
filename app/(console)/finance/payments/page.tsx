"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { FiSearch } from "react-icons/fi";
import type { JSX } from "react";
import DateRangeInput from "@/components/DateRangeInput";
import dynamic from "next/dynamic";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { HiArrowsUpDown } from "react-icons/hi2";
import { getNextTriSortState, type TriSortState } from "@/utils/sorting";
import { PiArrowCircleUpRight } from "react-icons/pi";
import { PiArrowCircleDownLeft } from "react-icons/pi";
import { CiFilter } from "react-icons/ci";
import type { FilterCardOption } from "@/components/FilterCard";
import FilterTrigger from "@/components/FilterTrigger";

import AddPaymentSidesheet from "@/components/Sidesheets/AddPaymentSidesheet";
import ErrorToast from "@/components/ErrorToast";
import PaymentsApi from "@/services/paymentsApi";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import BankApi from "@/services/bankApi";
import CustomIdApi from "@/services/customIdApi";

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

// Service type options for linked-booking filter
const serviceOptions: FilterCardOption[] = [
  { value: "flights", label: "Flights" },
  { value: "accommodation", label: "Accommodation" },
  { value: "insurance", label: "Travel Insurance" },
  { value: "activity", label: "Activity" },
  { value: "visas", label: "Visas" },
  { value: "tickets", label: "Ticket (attraction)" },
  { value: "others", label: "Others" },
  { value: "transportation_land", label: "Transportation (Land)" },
  { value: "transportation_maritime", label: "Transportation (Maritime)" },
];

// Dummy payment data
type PaymentRow = {
  paymentId: string;
  partyName: string;
  linkedBooking: string;
  amount: number;
  amountType: "gave" | "got";
  account: string;
  paymentType: string;
  paymentDateRaw: string | null;
  date: string;
  createdAt: string;
  id?: string | null;
  bankId?: string | null;
  partyType?: "Customer" | "Vendor";
};

// const dummyPayments: PaymentRow[] = [
//   {
//     paymentId: "PO-ABC01",
//     partyName: "Anand Mishra",
//     linkedBooking: "OS42J4D",
//     amount: 24580,
//     amountType: "gave",
//     account: "Bank 1",
//     date: "10-09-2026, 05:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PI-ABC02",
//     partyName: "Deepanshu",
//     linkedBooking: "OS42J4S",
//     amount: 24580,
//     amountType: "got",
//     account: "Bank 1",
//     date: "10-21-2026, 09:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PO-ABC03",
//     partyName: "Anand Mishra",
//     linkedBooking: "OS42J4J",
//     amount: 24580,
//     amountType: "gave",
//     account: "Cash",
//     date: "10-24-2026, 07:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PI-XBC04",
//     partyName: "Anand Mishra",
//     linkedBooking: "OS42J6K",
//     amount: 24580,
//     amountType: "got",
//     account: "Bank 2",
//     date: "10-14-2026, 08:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PI-TBC05",
//     partyName: "Deepanshu",
//     linkedBooking: "OS42J4J",
//     amount: 24580,
//     amountType: "got",
//     account: "Bank 2",
//     date: "10-11-2026, 10:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PI-OBC06",
//     partyName: "Deepanshu",
//     linkedBooking: "OS42J4D",
//     amount: 24580,
//     amountType: "got",
//     account: "Bank 1",
//     date: "10-16-2026, 10:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PI-IBC07",
//     partyName: "Anand Mishra",
//     linkedBooking: "OS42J4J",
//     amount: 24580,
//     amountType: "got",
//     account: "Bank 2",
//     date: "10-09-2026, 10:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PO-CBC08",
//     partyName: "Anand Mishra",
//     linkedBooking: "OS42J4D",
//     amount: 24580,
//     amountType: "gave",
//     account: "Cash",
//     date: "10-09-2026, 10:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
//   {
//     paymentId: "PI-ABC09",
//     partyName: "Deepanshu",
//     linkedBooking: "OS42J4S",
//     amount: 24580,
//     amountType: "got",
//     account: "Bank 1",
//     date: "10-09-2026, 10:00 AM",
//     createdAt: "2026-09-10T10:00:00Z",
//   },
// ];

const PaymentsPage = () => {
  const tabOptions = useMemo(
    () => ["Approved", "Pending", "Deleted", "Denied"],
    [],
  );
  const [activeTab, setActiveTab] = useState<string>(() => tabOptions[0] ?? "");

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  // Filter state
  const [linkedBookingFilter, setLinkedBookingFilter] = useState<string[]>([]);
  const [amountFilter, setAmountFilter] = useState<("in" | "out")[]>([]);
  const [accountFilter, setAccountFilter] = useState<string[]>([]);
  const [bankOptions, setBankOptions] = useState<FilterCardOption[]>([]);

  // Using shared `FilterTrigger` component from components/FilterTrigger.

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

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [editingPayment, setEditingPayment] = useState<PaymentRow | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<{
    id?: string | null;
    customId?: string | null;
  } | null>(null);

  const totalCount = useMemo(() => payments.length, [payments]);

  // Date range + search state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchValue, setSearchValue] = useState("");
  // effectiveSearch mirrors the Filter component behavior: only propagate when empty or >= 3 chars
  const [effectiveSearch, setEffectiveSearch] = useState("");
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [addPaymentMode, setAddPaymentMode] = useState<"out" | "in">("out");
  const [generatedPaymentCustomId, setGeneratedPaymentCustomId] = useState<
    string | null
  >(null);

  // Toast state for success / error messages using ErrorToast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBgClass, setToastBgClass] = useState("bg-red-50");
  const [toastMessageColor, setToastMessageColor] = useState("text-red-600");
  const [toastBorderClass, setToastBorderClass] = useState("border-red-200");
  const [toastCloseBtnClass, setToastCloseBtnClass] = useState(
    "text-red-400 hover:text-red-600",
  );
  const [toastShowLabel, setToastShowLabel] = useState(true);

  // Sorting state
  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });

  const handleSort = (column: string) => {
    if (column !== "Date") return;
    setSortState((prev) => getNextTriSortState(prev, column));
  };

  // Column icons (Date header shows tri-state visuals based on `sortState`)
  const columnIconMap: Record<string, JSX.Element> = {
    Date: (
      <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[2]" />
    ),
    "Linked Booking": (
      <FilterTrigger
        ariaLabel="Filter Linked Booking"
        options={serviceOptions}
        onApply={(selected) => {
          setLinkedBookingFilter(selected);
        }}
        children={
          <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />
        }
      />
    ),
    Amount: (
      <FilterTrigger
        ariaLabel="Filter Amount"
        options={[
          { value: "in", label: "Payment In" },
          { value: "out", label: "Payment Out" },
        ]}
        onApply={(selected) => {
          setAmountFilter(selected as ("in" | "out")[]);
        }}
        children={
          <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />
        }
      />
    ),
    Account: (
      <FilterTrigger
        ariaLabel="Filter Account"
        options={bankOptions}
        onApply={(selected) => {
          setAccountFilter(selected);
        }}
        children={
          <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />
        }
      />
    ),
  };

  // Apply sorting to payments
  const sortedPayments = useMemo(() => {
    if (sortState.key !== "Date" || sortState.direction === "none") {
      return payments;
    }

    const getPaymentTimestamp = (item: PaymentRow): number | null => {
      const raw = item.paymentDateRaw || item.createdAt;
      if (!raw) return null;
      const ts = new Date(raw).getTime();
      return Number.isFinite(ts) ? ts : null;
    };

    // Stable sort: keep original order for ties.
    const withIndex = payments.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));

    withIndex.sort((a, b) => {
      const at = getPaymentTimestamp(a.item);
      const bt = getPaymentTimestamp(b.item);

      // Always keep missing/invalid dates at the bottom.
      if (at === null && bt === null) return a.originalIndex - b.originalIndex;
      if (at === null) return 1;
      if (bt === null) return -1;

      const diff = at - bt;
      if (diff !== 0) return sortState.direction === "asc" ? diff : -diff;
      return a.originalIndex - b.originalIndex;
    });

    return withIndex.map((x) => x.item);
  }, [payments, sortState.direction, sortState.key]);

  // Fetch payments whenever activeTab changes (status/isDeleted)
  const fetchPayments = useCallback(async () => {
    try {
      const params: any = {};
      if (activeTab === "Pending") params.status = "pending";
      else if (activeTab === "Approved") params.status = "approved";
      else if (activeTab === "Denied") params.status = "denied";
      else if (activeTab === "Deleted") params.isDeleted = true;

      const data = await PaymentsApi.listPayments(params);
      const list = (data?.payments || data?.data || data || []) as any[];
      const mapped: PaymentRow[] = list.map((p) => {
        const paymentId = p.customId
          ? String(p.customId)
          : p._id
            ? String(p._id)
            : "";

        let partyName = "";
        if (p.partyName) partyName = String(p.partyName);
        else if (p.partyId) {
          if (typeof p.partyId === "object") {
            partyName = String(
              p.partyId.name ||
                p.partyId.companyName ||
                p.partyId.customId ||
                p.partyId._id ||
                "",
            );
          } else {
            partyName = String(p.partyId);
          }
        } else if (p.party) partyName = String(p.party);

        let linkedBooking = "-";
        if (p.allocations && p.allocations.length > 0) {
          const firstAlloc = p.allocations[0];
          const q = firstAlloc.quotationId;
          if (q) {
            if (typeof q === "object") {
              linkedBooking = String(q.customId || q._id || "-");
            } else {
              linkedBooking = String(q);
            }
          }
        }
        const amount = Number(p.amount || 0);
        const amountType = p.entryType === "credit" ? "got" : "gave";
        const account = (p.bankId && (p.bankId.name || p.bankId)) || "Cash";
        const paymentType = String(p.paymentType || "cash");
        const paymentDateRaw = p.paymentDate ? String(p.paymentDate) : null;
        const date = p.paymentDate
          ? new Date(p.paymentDate).toLocaleDateString()
          : p.createdAt
            ? new Date(p.createdAt).toLocaleDateString()
            : "";
        const createdAt = p.createdAt || new Date().toISOString();
        const inferredPartyType: "Customer" | "Vendor" = (():
          | "Customer"
          | "Vendor" => {
          try {
            if (p && p.partyId && typeof p.partyId === "object") {
              // presence of companyName/contactPerson suggests a vendor
              if (p.partyId.companyName || p.partyId.contactPerson)
                return "Vendor";
            }
            return "Customer";
          } catch {
            return "Customer";
          }
        })();

        return {
          paymentId,
          partyName,
          linkedBooking,
          amount,
          amountType: amountType as "gave" | "got",
          account,
          paymentType,
          paymentDateRaw,
          date,
          createdAt,
          id: p._id ? String(p._id) : null,
          bankId:
            p.bankId && (p.bankId._id || p.bankId)
              ? String(p.bankId._id || p.bankId)
              : null,
          partyType: inferredPartyType,
        };
      });
      setPayments(mapped);
    } catch (err) {
      console.error("Failed to load payments", err);
      setPayments([]);
    }
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchPayments();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPayments]);

  // Load bank list for Account filter
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await BankApi.getBanks({ isDeleted: false });
        const list = (resp?.banks || resp?.data || resp || []) as any[];
        const opts: FilterCardOption[] = [
          { value: "Cash", label: "Cash" },
          ...list.map((b) => ({
            value: String(b.name || b._id || b),
            label: String(b.name || b._id || b),
          })),
        ];
        if (mounted) setBankOptions(opts);
      } catch (e) {
        console.error("Failed to load banks for filter", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Convert payments to table data
  // apply date & search filtering
  const visiblePayments = useMemo(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // expand end to end-of-day for inclusive filtering
    const endOfDay = end
      ? new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate(),
          23,
          59,
          59,
          999,
        )
      : null;

    // const byDate = (p: PaymentRow) => {
    //   if (!start || !endOfDay) return true;
    //   const t = new Date(p.createdAt).getTime();
    //   return t >= start.getTime() && t <= endOfDay.getTime();
    // };

    const q =
      effectiveSearch && effectiveSearch.length >= 3
        ? effectiveSearch.toLowerCase()
        : "";

    return sortedPayments.filter((p) => {
      /* Date filter */
      if (start && endOfDay) {
        const t = new Date(p.createdAt).getTime();
        if (t < start.getTime() || t > endOfDay.getTime()) {
          return false;
        }
      }

      /* Search filter */
      if (q) {
        const matchesSearch =
          p.paymentId.toLowerCase().includes(q) ||
          p.partyName.toLowerCase().includes(q);

        if (!matchesSearch) return false;
      }

      /* Linked Booking filter */
      if (linkedBookingFilter.length > 0) {
        // dummy assumption: booking prefix or mapping
        const matchesBooking = linkedBookingFilter.some((type) =>
          p.linkedBooking.toLowerCase().includes(type),
        );

        if (!matchesBooking) return false;
      }

      /* Account filter */
      if (accountFilter.length > 0) {
        // payments' `account` holds bank name or 'Cash'
        const matchesAccount = accountFilter.some((val) =>
          String(p.account || "")
            .toLowerCase()
            .includes(String(val || "").toLowerCase()),
        );
        if (!matchesAccount) return false;
      }

      /* Amount filter */
      if (amountFilter.length > 0) {
        const paymentType = p.amountType === "got" ? "in" : "out";
        if (!amountFilter.includes(paymentType)) return false;
      }

      return true;
    });
  }, [
    sortedPayments,
    startDate,
    endDate,
    effectiveSearch,
    linkedBookingFilter,
    accountFilter,
    amountFilter,
  ]);

  const tableData = useMemo<JSX.Element[][]>(() => {
    return visiblePayments.map((payment, index) => {
      const cells: JSX.Element[] = [];
      cells.push(
        <td
          key={`paymentId-${index}`}
          className="px-4 py-3 font-[500] text-center"
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
            className={`font-medium ${payment.amountType === "gave" ? "text-red-600" : "text-green-600"} flex items-center justify-center gap-2`}
          >
            {payment.amountType === "gave" ? (
              <PiArrowCircleUpRight size={16} className="shrink-0" />
            ) : (
              <PiArrowCircleDownLeft size={16} className="shrink-0" />
            )}
            ₹ {payment.amount.toLocaleString()}
          </span>
        </td>,
        <td key={`account-${index}`} className="px-4 py-3 text-center">
          <div className="relative inline-flex items-center justify-center">
            <span className="peer cursor-default">{payment.account}</span>

            <div
              className="absolute -top-8 left-1/2 z-50 px-2 py-1 text-[0.75rem] text-white bg-gray-800 rounded-md shadow-lg pointer-events-none -translate-x-1/2 transition-opacity duration-150 ease-in-out opacity-0 invisible whitespace-nowrap peer-hover:opacity-100 peer-hover:visible"
              role="tooltip"
            >
              {String(payment.paymentType || "cash").toUpperCase()}
              <div
                className="absolute left-1/2 -bottom-1 w-2.5 h-2.5 bg-gray-800"
                style={{
                  transform: "translateX(-50%) rotate(45deg)",
                  WebkitTransform: "translateX(-50%) rotate(45deg)",
                }}
              />
            </div>
          </div>
        </td>,
        <td key={`date-${index}`} className="px-4 py-3 text-center">
          <div className="text-[13px]">{payment.date}</div>
        </td>,
        <td
          key={`actions-${index}`}
          className="px-4 py-3 text-center align-middle h-[4rem]"
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
              className="bg-[#FFF1C2] text-[#0D4B37] px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-gray-200 hover:bg-[#d0e7dc]"
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
                    setEditingPayment(payment);
                    setIsAddPaymentOpen(true);
                  },
                },
                {
                  label: "Delete",
                  icon: <FaRegTrashAlt />,
                  color: "text-red-600",
                  onClick: () => {
                    setPaymentToDelete({
                      id: payment.id || null,
                      customId: payment.paymentId || null,
                    });
                    setIsConfirmOpen(true);
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
  }, [visiblePayments]);

  return (
    <>
      <ErrorToast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        bgColorClass={toastBgClass}
        messageColorClass={toastMessageColor}
        borderColorClass={toastBorderClass}
        closeButtonClass={toastCloseBtnClass}
        showLabel={toastShowLabel}
      />

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
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                className={`relative z-10 px-[14px] py-[6px] rounded-[8px] text-[14px] font-medium transition-colors duration-300 flex-1 ${
                  activeTab === tab
                    ? "text-white"
                    : "text-[#818181] hover:text-gray-900 font-semibold"
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

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white font-medium"
              onClick={async () => {
                setAddPaymentMode("out");
                try {
                  const data = await CustomIdApi.generate("paymentOut");
                  const id =
                    data?.customId ||
                    data?.customIdValue ||
                    (typeof data === "string" ? data : null);
                  setGeneratedPaymentCustomId(
                    id || `PO-${Date.now().toString().slice(-6)}`,
                  );
                } catch (e) {
                  setGeneratedPaymentCustomId(
                    `PO-${Date.now().toString().slice(-6)}`,
                  );
                }
                setIsAddPaymentOpen(true);
              }}
            >
              <span className="text-sm flex items-center gap-1">
                {" "}
                <PiArrowCircleUpRight
                  size={18}
                  height="bold"
                  strokeWidth={2}
                />{" "}
                You Gave
              </span>
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#4CA640] text-white font-medium"
              onClick={async () => {
                setAddPaymentMode("in");
                try {
                  const data = await CustomIdApi.generate("paymentIn");
                  const id =
                    data?.customId ||
                    data?.customIdValue ||
                    (typeof data === "string" ? data : null);
                  setGeneratedPaymentCustomId(
                    id || `PI-${Date.now().toString().slice(-6)}`,
                  );
                } catch (e) {
                  setGeneratedPaymentCustomId(
                    `PI-${Date.now().toString().slice(-6)}`,
                  );
                }
                setIsAddPaymentOpen(true);
              }}
            >
              <span className="text-sm flex items-center gap-1">
                {" "}
                <PiArrowCircleDownLeft
                  size={18}
                  height="bold"
                  strokeWidth={2}
                />
                You Got
              </span>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 mb-4 mt-3"></div>

        {/* Date range + Search row */}
        <div className="flex items-center justify-between mb-4 px-2 gap-4">
          <div className="flex items-center gap-4">
            <DateRangeInput
              startDate={startDate}
              endDate={endDate}
              onChange={(s, e) => {
                setStartDate(s);
                setEndDate(e);
              }}
            />
          </div>

          <div className="flex-1 max-w-sm ml-auto">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchValue(value);
                  if (value.length === 0) {
                    setEffectiveSearch("");
                  } else if (value.length >= 3) {
                    setEffectiveSearch(value);
                  }
                }}
                placeholder="Search by Payment ID/Party Name"
                className="w-full text-[14px] py-3 pl-4  rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0D4B37] text-gray-700 bg-white"
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
            enableRowHoverActions={true}
            rowIds={visiblePayments.map((p) => p.paymentId)}
          />
        </div>

        <AddPaymentSidesheet
          isOpen={isAddPaymentOpen}
          title={
            editingPayment
              ? "Edit Payment"
              : addPaymentMode === "in"
                ? "Payment In"
                : "Payment Out"
          }
          mode={editingPayment ? "edit" : "create"}
          initialPayment={
            editingPayment
              ? ({
                  _id: editingPayment.id || undefined,
                  amount: String(editingPayment.amount || ""),
                  paymentDate:
                    editingPayment.paymentDateRaw || editingPayment.createdAt,
                  bank:
                    editingPayment.bankId ||
                    (editingPayment.account === "Cash"
                      ? ""
                      : editingPayment.account),
                  paymentType: String(
                    editingPayment.paymentType || "",
                  ).toUpperCase(),
                  internalNotes: "",
                } as any)
              : undefined
          }
          customId={generatedPaymentCustomId}
          // opened from payments list edit action -> hide view button
          showViewButton={editingPayment ? false : true}
          prefillPartyName={editingPayment ? editingPayment.partyName : null}
          prefillPartyType={editingPayment ? editingPayment.partyType : null}
          entryTypeDefault={addPaymentMode === "out" ? "credit" : "debit"}
          onClose={() => {
            setIsAddPaymentOpen(false);
            setGeneratedPaymentCustomId(null);
            setEditingPayment(null);
          }}
          onSubmit={async (data) => {
            console.log("AddPaymentSidesheet submitted:", data);
            setIsAddPaymentOpen(false);
            setGeneratedPaymentCustomId(null);
            setEditingPayment(null);

            // show success toast
            setToastMessage("Yay! the payment has been created successfully.");
            setToastBgClass("bg-green-50");
            setToastMessageColor("text-green-800");
            setToastBorderClass("border-green-200");
            setToastCloseBtnClass("text-green-600 hover:text-green-800");
            setToastShowLabel(false);
            setToastVisible(true);

            try {
              await fetchPayments();
            } catch (e) {
              console.error(
                "Failed to refresh payments after create/update",
                e,
              );
            }
          }}
          onError={(msg: string) => {
            // show error toast from sidesheet errors
            setToastMessage(String(msg || "An error occurred"));
            setToastBgClass("bg-red-50");
            setToastMessageColor("text-red-600");
            setToastBorderClass("border-red-200");
            setToastCloseBtnClass("text-red-400 hover:text-red-600");
            setToastShowLabel(true);
            setToastVisible(true);
          }}
        />
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => {
            setIsConfirmOpen(false);
            setPaymentToDelete(null);
          }}
          onConfirm={async () => {
            try {
              if (paymentToDelete?.id) {
                await PaymentsApi.deletePayment(String(paymentToDelete.id));
                await fetchPayments();
                // show success toast on delete
                setToastMessage("Payment deleted successfully!");
                setToastBgClass("bg-green-50");
                setToastMessageColor("text-green-800");
                setToastBorderClass("border-green-200");
                setToastCloseBtnClass("text-green-600 hover:text-green-800");
                setToastShowLabel(false);
                setToastVisible(true);
              }
            } catch (err) {
              console.error("Failed to delete payment", err);
              const msg =
                (err as any)?.response?.data?.message ||
                (err as any)?.message ||
                "Failed to delete payment";
              setToastMessage(String(msg));
              setToastBgClass("bg-red-50");
              setToastMessageColor("text-red-600");
              setToastBorderClass("border-red-200");
              setToastCloseBtnClass("text-red-400 hover:text-red-600");
              setToastShowLabel(true);
              setToastVisible(true);
            } finally {
              setIsConfirmOpen(false);
              setPaymentToDelete(null);
            }
          }}
          title={`Do you want to Delete ${paymentToDelete?.customId || "payment"}?`}
          confirmText="Yes, Delete"
          cancelText="Cancel"
        />
      </div>
    </>
  );
};

export default PaymentsPage;
