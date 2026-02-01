"use client";
import { getCurrencySymbol, getCurrencyLocale } from "@/utils/helper";

import dynamic from "next/dynamic";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { CustomIdApi } from "@/services/customIdApi";
import LimitlessApi, {
  type GetAllLimitlessParams,
  type LimitlessServiceStatus,
} from "@/services/limitlessApi";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import FilterSkeleton from "@/components/skeletons/FilterSkeleton";
// import SummaryCardsSkeleton from "@/components/skeletons/SummaryCardsSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import SidesheetSkeleton from "@/components/skeletons/SidesheetSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import type { JSX } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { TbArrowAutofitRight } from "react-icons/tb";
import { FiCopy } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import AvatarTooltip from "@/components/AvatarToolTip";
import TaskButton from "@/components/TaskButton";
import { useAuth } from "@/context/AuthContext";
import {
  getNextTriSortState,
  type TriSortState,
  getItemTimestamp,
} from "@/utils/sorting";

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

const BookingFormSidesheet = dynamic(
  () => import("@/components/BookingFormSidesheet"),
  {
    loading: () => <SidesheetSkeleton />,
    ssr: false,
  },
);

type BookingService = {
  id: string;
  title: string;
  image: string;
  category:
    | "travel"
    | "accommodation"
    | "activity"
    | "transport-land"
    | "transport-maritime"
    | "tickets"
    | "travel insurance"
    | "visas"
    | "others";
  description?: string;
};

type FilterPayload = {
  serviceType: string;
  status: string;
  owner: string | string[];
  search: string;
  bookingStartDate: string;
  bookingEndDate: string;
  tripStartDate: string;
  tripEndDate: string;
};

type OwnerRef = { _id?: string; name?: string; email?: string };

type LimitlessBooking = {
  _id: string;
  customId?: string;
  createdAt?: string;
  updatedAt?: string;
  travelDate?: string;
  bookingDate?: string;
  status?: "confirmed" | "cancelled";
  serviceStatus?: LimitlessServiceStatus;
  isDeleted?: boolean;
  totalAmount?: number;
  currency?: string;
  customerId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
  primaryOwner?: OwnerRef;
  secondaryOwner?: OwnerRef[];
  limitlessDestinations?: string[];
  limitlessTitle?: string;
  description?: string;
};

// interface SummaryData {
//   total: {
//     amount: string;
//     change: string;
//     isPositive: boolean;
//   };
//   youGive: {
//     amount: string;
//     change: string;
//     isPositive: boolean;
//   };
//   youGet: {
//     amount: string;
//     change: string;
//     isPositive: boolean;
//   };
// }

const columns: string[] = [
  "Booking ID",
  "Lead Pax",
  "Travel Date",
  "Destination",
  "Service Status",
  "Amount",
  "Owners",
  "Tasks",
  "Actions",
];

interface Owner {
  short: string;
  full: string;
  color: string;
}

const columnIconMap: Record<string, JSX.Element> = {
  "Travel Date": (
    <TbArrowsUpDown className="inline w-3 h-3 text-white stroke-[1.5]" />
  ),
  Destination: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
  "Booking Status": (
    <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />
  ),
};

const formatServiceStatusLabel = (status?: LimitlessServiceStatus) => {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending";
    case "draft":
      return "Draft";
    case "denied":
      return "Denied";
    default:
      return "--";
  }
};

const getServiceStatusBadgeClass = (
  status?: LimitlessServiceStatus,
): string => {
  switch (status) {
    case "approved":
      return "px-2 py-1 text-[0.70rem] border border-green-100 font-semibold rounded-full bg-[#F0FDF4] text-[#15803D]";
    case "pending":
      return "px-2 py-1 text-[0.70rem] border border-yellow-200 font-semibold rounded-full bg-yellow-100 text-yellow-700";
    case "draft":
      return "px-2 py-1 text-[0.70rem] border border-gray-200 font-semibold rounded-full bg-gray-100 text-gray-700";
    case "denied":
    default:
      return "px-2 py-1 text-[0.75rem] border border-red-100 font-semibold rounded-full bg-[#FEE2E2] text-[#991B1B]";
  }
};

const LimitlessBookingsPage = () => {
  // UI State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [generatedBookingCode, setGeneratedBookingCode] = useState<
    string | null
  >(null);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<BookingService | null>(
    null,
  );
  const [generatedCustomerCode, setGeneratedCustomerCode] = useState<
    string | null
  >(null);
  const [generatedVendorCode, setGeneratedVendorCode] = useState<string | null>(
    null,
  );
  const [sideSheetMode, setSideSheetMode] = useState<"view" | "edit">("edit");

  const { user } = useAuth();

  const isBookingMaker = Boolean(user?.isBookingMaker);

  let tabOptions;

  if (isBookingMaker) {
    tabOptions = ["Approved", "Pending", "Drafts", "Denied", "Deleted"];
  } else {
    tabOptions = ["Bookings", "Drafts", "Deleted"];
  }

  const [activeTab, setActiveTab] = useState("Bookings");

  useEffect(() => {
    // If auth resolves later and user is a booking maker, default to Approved.
    if (isBookingMaker && activeTab === "Bookings") {
      setActiveTab("Approved");
    }
  }, [isBookingMaker, activeTab]);

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
      // Use offsetLeft/offsetWidth so measurement is relative to container and ignores container padding
      const shrinkPx = 5;
      const left = activeBtn.offsetLeft + Math.round(shrinkPx / 2);
      const width = Math.max(0, activeBtn.offsetWidth - shrinkPx);
      setIndicator({ left, width });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  // Filters state
  const [filters, setFilters] = useState<FilterPayload>({
    serviceType: "",
    status: "",
    owner: "",
    search: "",
    bookingStartDate: "",
    bookingEndDate: "",
    tripStartDate: "",
    tripEndDate: "",
  });

  // Data State
  const [bookings, setBookings] = useState<LimitlessBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });
  // Owners list built dynamically from bookings data
  const [ownersList, setOwnersList] = useState<Owner[]>([]);

  const computeInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
    return (first + last).toUpperCase();
  };

  const colorPalette = [
    "border-pink-700 text-pink-700",
    "border-[#AF52DE] text-[#AF52DE]",
    "border-[#5856D6] text-[#5856D6]",
    "border-cyan-700 text-cyan-700",
    "border-emerald-700 text-emerald-700",
    "border-amber-700 text-amber-700",
  ];

  // Build owners list from bookings data
  useEffect(() => {
    if (bookings.length === 0) return;

    const uniqueOwnerNames = new Set<string>();
    bookings.forEach((q: any) => {
      const ownerArray = ([] as any[])
        .concat(q?.secondaryOwner || [], [q?.primaryOwner])
        .filter(Boolean);
      ownerArray.forEach((o: any) => {
        if (o?.name) uniqueOwnerNames.add(o.name);
      });
    });

    const list: Owner[] = Array.from(uniqueOwnerNames).map((name, idx) => ({
      short: computeInitials(name),
      full: name,
      color: colorPalette[idx % colorPalette.length] as string,
    }));

    setOwnersList(list);
  }, [bookings]);

  const handleSort = (column: string) => {
    // Only "Travel Date" is sortable on this table right now.
    if (column !== "Travel Date") return;
    setSortState((prev) => getNextTriSortState(prev, column));
  };

  // Helper for date range checks
  const isWithinRange = (
    rawDate: string | undefined,
    start: string,
    end: string,
  ) => {
    if (!rawDate) return false;
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

  const handleViewBooking = (item: any) => {
    setSelectedQuotation(item);
    setSelectedService({
      id: item._id,
      title: "Limitless",
      image: "",
      category: "limitless" as any,
      description: "",
    });

    setSideSheetMode("view");
    setIsSideSheetOpen(true);
  };

  // Owner selection normalization
  const selectedOwners: string[] = Array.isArray(filters.owner)
    ? filters.owner
    : filters.owner
      ? [filters.owner]
      : [];

  // Apply all filters client-side (search, booking date, travel date, owner)
  const filteredQuotations = useMemo(() => {
    return bookings.filter((q, idx) => {
      if (filters.search.trim()) {
        const s = filters.search.toLowerCase();

        const destination = (q.limitlessDestinations || []).join(", ");
        const title = q.limitlessTitle || "";
        const matchesSearch =
          (q.customId || "").toLowerCase().includes(s) ||
          (q.customerId?.name || "").toLowerCase().includes(s) ||
          destination.toLowerCase().includes(s) ||
          title.toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }

      // Booking date range (createdAt)
      if (filters.bookingStartDate || filters.bookingEndDate) {
        if (
          !isWithinRange(
            q.createdAt,
            filters.bookingStartDate,
            filters.bookingEndDate,
          )
        )
          return false;
      }

      // Travel date range (departureDate)
      if (filters.tripStartDate || filters.tripEndDate) {
        if (
          !isWithinRange(
            q.travelDate,
            filters.tripStartDate,
            filters.tripEndDate,
          )
        )
          return false;
      }

      // Extract owner names from the API response
      const ownerArray = ([] as any[]).concat(
        q.secondaryOwner || [],
        q.primaryOwner ? [q.primaryOwner] : [],
      );
      const rowOwners: string[] = Array.isArray(ownerArray)
        ? ownerArray.map((o: any) => o?.name || "").filter(Boolean)
        : [];

      (q as any).__owners = rowOwners;

      // Filter by selected owners if any are selected
      if (selectedOwners.length) {
        const intersects = rowOwners.some((ownerName) =>
          selectedOwners.includes(ownerName),
        );
        if (!intersects) return false;
      }

      return true;
    });
  }, [bookings, filters, selectedOwners]);

  const getParamsForActiveTab = useCallback(
    (
      tab: string,
    ): Pick<GetAllLimitlessParams, "serviceStatus" | "isDeleted"> => {
      if (tab === "Deleted") return { isDeleted: true };

      if (tab === "Approved")
        return { serviceStatus: "approved", isDeleted: false };
      if (tab === "Pending")
        return { serviceStatus: "pending", isDeleted: false };
      if (tab === "Drafts") return { serviceStatus: "draft", isDeleted: false };
      if (tab === "Denied")
        return { serviceStatus: "denied", isDeleted: false };

      // Non-booking-maker default tab.
      if (tab === "Bookings")
        return { serviceStatus: "approved", isDeleted: false };

      return { isDeleted: false };
    },
    [],
  );

  // Load limitless bookings from backend
  const loadBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tabParams = getParamsForActiveTab(activeTab);
      const params: GetAllLimitlessParams = {
        ...tabParams,
      };

      if (filters.bookingStartDate)
        params.bookingStartDate = filters.bookingStartDate;
      if (filters.bookingEndDate)
        params.bookingEndDate = filters.bookingEndDate;
      if (filters.tripStartDate) params.travelStartDate = filters.tripStartDate;
      if (filters.tripEndDate) params.travelEndDate = filters.tripEndDate;

      // Note: Owner filtering is done client-side since API expects owner IDs.

      const response: any = await LimitlessApi.getAll(
        Object.keys(params).length ? params : undefined,
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to load limitless bookings",
        );
      }

      const items = (response?.limitless as LimitlessBooking[]) || [];
      setBookings(items);
    } catch (err) {
      console.error("Error loading limitless bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.bookingStartDate,
    filters.bookingEndDate,
    filters.tripStartDate,
    filters.tripEndDate,
    activeTab,
    getParamsForActiveTab,
  ]);

  // Load bookings on component mount and filter changes
  useEffect(() => {
    loadBookings();
  }, [
    loadBookings,
    filters.bookingStartDate,
    filters.bookingEndDate,
    filters.tripStartDate,
    filters.tripEndDate,
    filters.owner,
    activeTab,
  ]);

  // When user requests create from Filter, generate custom id first then open sidesheet directly
  const handleCreateRequested = async () => {
    try {
      // simple guard against rapid duplicate calls
      const now = Date.now();
      const last = (window as any).__lastBookingCodeRequestAt || 0;
      const IGNORE_MS = 1200;
      if (now - last < IGNORE_MS) {
        return;
      }
      (window as any).__lastBookingCodeRequestAt = now;

      // generate booking and customer ids in parallel
      const [bookingResp, customerResp, vendorResp] = await Promise.all([
        CustomIdApi.generate("limitless"),
        CustomIdApi.generate("customer"),
        CustomIdApi.generate("vendor"),
      ]);
      const bookingId = bookingResp?.customId || null;
      const customerId = customerResp?.customId || null;
      const vendorId = vendorResp?.customId || null;
      setGeneratedBookingCode(bookingId);
      setGeneratedCustomerCode(customerId);
      setGeneratedVendorCode(vendorId);

      // Set limitless service and open sidesheet directly
      setSelectedQuotation(null);
      setSelectedService({
        id: "limitless",
        title: "Limitless",
        image: "",
        category: "limitless" as any,
        description: "",
      });
      setSideSheetMode("edit");
      setIsSideSheetOpen(true);
    } catch (err) {
      console.error("Failed to generate custom id:", err);
      setGeneratedBookingCode(null);
      setGeneratedCustomerCode(null);
      setGeneratedVendorCode(null);
      alert("Could not generate booking ID. Please refresh and try again.");
    }
  };

  // Handle booking completion (refresh data)
  const handleBookingComplete = useCallback(async () => {
    await loadBookings();
    setIsSideSheetOpen(false);
    setSelectedQuotation(null);
  }, [loadBookings, activeTab]);

  const handleDeleteClick = (quotationId: string) => {
    setSelectedDeleteId(quotationId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDeleteId) return;

    try {
      const response: any =
        await LimitlessApi.deleteLimitless(selectedDeleteId);

      if (response.success) {
        // Remove from UI
        setBookings((prev) => prev.filter((q) => q._id !== selectedDeleteId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }

    setIsDeleteModalOpen(false);
    setSelectedDeleteId(null);
  };

  // fetch new booking custom id, clone quotation and open sidesheet
  const handleDuplicate = async (item: any) => {
    try {
      // fetch custom id for booking
      const resp = await CustomIdApi.generate("limitless");
      const newId = resp?.customId || resp?.customid || null;
      if (!newId) {
        console.error("Failed to generate booking custom id", resp);
        return;
      }

      // prepare cloned data for editing as a new quotation
      const clone = JSON.parse(JSON.stringify(item || {}));
      // remove database id
      delete clone._id;
      // ensure customId is blank
      clone.customId = null;

      setGeneratedBookingCode(newId);
      setSelectedQuotation(clone);
      setSelectedService({
        id: newId,
        title: "Limitless",
        image: "",
        category: "limitless" as any,
        description: "",
      });

      // open sidesheet only after id was fetched and state set
      setIsSideSheetOpen(true);
    } catch (err) {
      console.error("Error duplicating quotation:", err);
    }
  };

  const getActionsForTab = (tab: string, row: any) => {
    // Accept both, the table "row metadata" shape
    const id =
      row?._id ||
      row?.id ||
      (row.isReal
        ? bookings?.[row.originalIndex]?._id
        : finalQuotations?.[row.originalIndex]?.id);

    const baseActions = [
      {
        label: "Edit",
        icon: <MdOutlineEdit />,
        color: "text-blue-600",
        onClick: () => {
          // Resolve the actual booking object and ensure selectedService is set
          const resolvedId =
            row?._id ||
            row?.id ||
            (row.isReal ? bookings?.[row.originalIndex]?._id : null) ||
            (row.originalIndex != null
              ? bookings?.[row.originalIndex]?._id
              : null);

          const bookingObj =
            bookings.find((b) => b._id === resolvedId) || row || null;

          setSelectedQuotation(bookingObj);
          setSelectedService({
            id: bookingObj?._id || resolvedId || "limitless",
            title: "Limitless",
            image: "",
            category: "limitless" as any,
            description: "",
          });
          setIsSideSheetOpen(true);
          setSideSheetMode("edit");
        },
      },
      {
        label: "Delete",
        icon: <FaRegTrashAlt />,
        color: "text-red-600",
        onClick: () => {
          if (id) handleDeleteClick(id);
        },
      },
    ];

    // Denied
    if (tab === "Denied") {
      baseActions.push({
        label: "Request again",
        icon: <TbArrowAutofitRight />,
        color: "text-gray-400",
        onClick: () => console.log("Request again", row.id),
      });
      baseActions.push({
        label: "Duplicate",
        icon: <FiCopy />,
        color: "text-gray-400",
        onClick: () => handleDuplicate(row),
      });
      return baseActions;
    }

    // Deleted
    if (tab === "Deleted") {
      return [
        {
          label: "Recover",
          icon: <TbArrowAutofitRight />,
          color: "text-gray-400",
          onClick: () => console.log("Recover", row.id),
        },
      ];
    }

    // Approved
    if (tab === "Approved") {
      baseActions.push({
        label: "Move",
        icon: <TbArrowAutofitRight />,
        color: "text-gray-400",
        onClick: () => console.log("Move", row.id),
      });
    }

    if (tab === "Bookings") {
      baseActions.push({
        label: "Move",
        icon: <TbArrowAutofitRight />,
        color: "text-gray-400",
        onClick: () => console.log("Move", row.id),
      });
    }

    // Default for Pending + Drafts
    baseActions.push({
      label: "Duplicate",
      icon: <FiCopy />,
      color: "text-gray-400",
      onClick: () => handleDuplicate(row),
    });

    return baseActions;
  };

  const formatDMY = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Active tab filtering is done server-side (via loadBookings params).
  // Client-side filtering (search/date/owner) is applied in filteredQuotations.
  const finalQuotations = filteredQuotations as any[];

  // Use shared timestamp extractor from utils/sorting.ts
  // (keeps logic consistent across pages)

  const sortedQuotationsForTable = useMemo(() => {
    if (sortState.key !== "Travel Date" || sortState.direction === "none") {
      return finalQuotations;
    }

    // Stable sort: keep original order for ties.
    const withIndex = finalQuotations.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));

    withIndex.sort((a, b) => {
      const at = getItemTimestamp(a.item);
      const bt = getItemTimestamp(b.item);

      // Always keep missing/invalid dates at the bottom.
      if (at === null && bt === null) return a.originalIndex - b.originalIndex;
      if (at === null) return 1;
      if (bt === null) return -1;

      const diff = at - bt;
      if (diff !== 0) return sortState.direction === "asc" ? diff : -diff;
      return a.originalIndex - b.originalIndex;
    });

    return withIndex.map((x) => x.item);
  }, [finalQuotations, sortState.direction, sortState.key]);

  // Convert quotations to table data
  const tableData = useMemo<JSX.Element[][]>(() => {
    const rows = sortedQuotationsForTable.map((item, index) => [
      <td
        key={`id-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center text-[#020202]  font-medium align-middle h-[3rem] cursor-pointer"
      >
        <button
          onClick={() => handleViewBooking(item)}
          className="text-[#114958] hover:underline font-semibold"
        >
          {item.customId || item._id}
        </button>
      </td>,
      <td
        key={`lead-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem] cursor-pointer"
      >
        {item.customerId?.name || "--"}
      </td>,
      <td
        key={`date-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center align-middle h-[3rem] cursor-pointer"
      >
        {item.travelDate
          ? formatDMY(item.travelDate)
          : item.createdAt
            ? formatDMY(item.createdAt)
            : "--"}
      </td>,
      <td
        key={`destination-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center text-[14px] text-[#020202] font-normal align-middle h-[3rem] cursor-pointer"
      >
        <div className="text-center leading-tight">
          <div>
            {(Array.isArray(item.limitlessDestinations) &&
            item.limitlessDestinations.length
              ? item.limitlessDestinations.join(", ")
              : item.limitlessTitle) || "--"}
          </div>
          {item.limitlessTitle ? (
            <div className="mt-1 flex justify-center">
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {item.limitlessTitle}
              </span>
            </div>
          ) : null}
        </div>
      </td>,
      <td
        key={`status-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center align-middle text-[14px] h-[3rem] cursor-pointer"
      >
        <span className={getServiceStatusBadgeClass(item.serviceStatus)}>
          {formatServiceStatusLabel(item.serviceStatus)}
        </span>
      </td>,
      <td
        key={`amount-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem] cursor-pointer"
      >
        {item.totalAmount ? (
          <span>
            {getCurrencySymbol(item?.currency)}{" "}
            {new Intl.NumberFormat(getCurrencyLocale(item?.currency)).format(
              item.totalAmount,
            )}
          </span>
        ) : (
          "--"
        )}
      </td>,
      <td
        key={`owners-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center align-middle h-[3rem] cursor-pointer"
      >
        <div className="flex items-center justify-center">
          {/* PRIMARY OWNER */}
          {item.primaryOwner?.name &&
            (() => {
              const name = item.primaryOwner?.name || "";
              const ownerMeta = ownersList.find((o) => o.full === name) || {
                short: computeInitials(name),
                full: name,
                color: colorPalette[0] ?? "",
              };

              return (
                <div className="mr-2">
                  <AvatarTooltip
                    short={ownerMeta.short}
                    full={ownerMeta.full}
                    color={ownerMeta.color}
                  />
                </div>
              );
            })()}

          {/* SECONDARY OWNERS */}
          <div className="flex items-center">
            {Array.isArray(item.secondaryOwner) &&
              item.secondaryOwner.map((o: any, i: number) => {
                if (!o?.name) return null;

                const ownerMeta = ownersList.find((x) => x.full === o.name) || {
                  short: computeInitials(o.name),
                  full: o.name,
                  color:
                    colorPalette[(i + 1) % colorPalette.length] ??
                    colorPalette[0] ??
                    "",
                };

                return (
                  <AvatarTooltip
                    key={i}
                    short={ownerMeta.short}
                    full={ownerMeta.full}
                    color={ownerMeta.color}
                  />
                );
              })}
          </div>
        </div>
      </td>,
      <td
        key={`tasks-${index}`}
        className="px-4 py-3 text-center align-middle h-[3rem]"
      >
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <TaskButton count={0} bookingId={item._id} />
        </div>
      </td>,

      // ACTIONS COLUMN
      <td
        key={`actions-${index}`}
        className="px-4 py-3 text-center align-middle h-[3rem]"
      >
        <div onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            actions={getActionsForTab(activeTab, item)}
            right="right-15"
          />
        </div>
      </td>,
    ]);
    return rows;
  }, [sortedQuotationsForTable, ownersList, activeTab]);

  // Helper functions

  const filterOptions = useMemo(
    () => ({
      serviceTypes: [{ value: "limitless", label: "♾️ Limitless" }],
      statuses: [
        { value: "approved", label: "Approved" },
        { value: "pending", label: "Pending" },
        { value: "draft", label: "Draft" },
        { value: "denied", label: "Denied" },
      ],
      owners: ownersList.map((o) => ({ value: o.full, label: o.full })),
    }),
    [ownersList],
  );

  const handleFilterChange = (next: FilterPayload) => {
    setFilters(next);
  };

  return (
    <div className="bg-gray-50">
      <div className="bg-gray-50">
        {/* <div className="flex justify-between items-center gap-4 p-6 w-full mx-[10px] mt-[-20px]"> */}
        {/* Draft count and sync button */}
        {/* <div className="flex items-center gap-4">
          {drafts.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                {drafts.length} Draft{drafts.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <button
            onClick={syncDrafts}
            className="text-sm text-gray-600 hover:text-gray-800 transition"
            type="button"
            title="Sync drafts with backend"
          >
            🔄 Sync
          </button>
        </div> */}
        {/* </div> */}

        <div className="min-h-screen">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
              <button
                onClick={loadBookings}
                className="ml-4 text-sm underline hover:no-underline"
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          <Filter
            onFilterChange={handleFilterChange}
            onSearchChange={(value) =>
              setFilters((prev) => ({ ...prev, search: value }))
            }
            serviceTypes={filterOptions.serviceTypes}
            statuses={filterOptions.statuses}
            owners={filterOptions.owners}
            createOpen={isCreateOpen}
            setCreateOpen={setIsCreateOpen}
            onCreateClick={handleCreateRequested}
          />

          <div className="bg-white rounded-2xl shadow mt-4 pt-5 pb-3 px-3 relative">
            {/* Tabs and Total Count Row */}
            <div className="flex w-full justify-between items-center mb-2">
              <div
                ref={tabContainerRef}
                style={{ width: "fit-content" }}
                className="flex w-[20.5rem] ml-2 items-center bg-[#F3F3F3] rounded-xl relative py-1.5 gap-8.5"
              >
                {/* Sliding background indicator sized to active button */}
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
                  {filteredQuotations.length}
                </span>
              </div>
            </div>
            <div className="p-2 mt-2">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <Table
                  data={tableData}
                  columns={columns}
                  columnIconMap={columnIconMap}
                  onSort={handleSort}
                  categoryName="Bookings"
                  headerAlign={{ "Booking ID": "center" }}
                />
              )}
            </div>
          </div>
        </div>

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Do you want to delete this quotation?"
          confirmText="Yes, Delete"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
          onConfirm={confirmDelete}
        />

        {/* Booking Form Modal removed - limitless page opens sidesheet directly */}

        <BookingFormSidesheet
          key={selectedQuotation?._id || "create"}
          isOpen={isSideSheetOpen}
          onClose={handleBookingComplete}
          selectedService={selectedService}
          initialData={selectedQuotation}
          bookingCode={generatedBookingCode ?? ""}
          customerCode={generatedCustomerCode ?? ""}
          vendorCode={generatedVendorCode ?? ""}
          mode={sideSheetMode}
          hideVendor={true}
        />
      </div>
    </div>
  );
};

export default LimitlessBookingsPage;
