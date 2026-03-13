"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import { BookingApiService } from "@/services/bookingApi";
import { CustomIdApi } from "@/services/customIdApi";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import ChooseBookingTypeModal from "@/components/Modals/ChooseBookingTypeModal";
import FilterSkeleton from "@/components/skeletons/FilterSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ModalSkeleton from "@/components/skeletons/ModalSkeleton";
import SidesheetSkeleton from "@/components/skeletons/SidesheetSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import type { JSX } from "react";
import {
  formatServiceType,
  formatNumberByStoredCurrency,
  getStoredCurrencySymbol,
} from "@/utils/helper";
import { FaRegTrashAlt } from "react-icons/fa";
import {
  MdOutlineEdit,
  MdOutlineKeyboardArrowDown,
  MdOutlineTravelExplore,
} from "react-icons/md";
import { TbArrowAutofitRight } from "react-icons/tb";
import { FiCheck, FiCopy } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import { FaRegCalendar, FaRegClock } from "react-icons/fa";
import Image from "next/image";
import AvatarTooltip from "@/components/AvatarToolTip";
import TaskButton from "@/components/TaskButton";
import TableTabs from "@/components/TableTabs";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LuPlane, LuHotel, LuTicket, LuDownload } from "react-icons/lu";
import { PiCarProfileLight } from "react-icons/pi";
import {
  IoChevronBack,
  IoChevronForward,
  IoChevronDown,
} from "react-icons/io5";
import { getNextTriSortState, type TriSortState } from "@/utils/sorting";
import UnderlineTabs from "@/components/UnderlineTabs";
import { RiRefreshLine } from "react-icons/ri";

const Filter = dynamic(() => import("@/components/Filter"), {
  loading: () => <FilterSkeleton />,
  ssr: false,
});

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

const BookingFormModal = dynamic(
  () => import("@/components/BookingFormModal"),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  },
);

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
  serviceType: string | string[];
  status: string | string[];
  owner: string | string[];
  bookingType: string;
  search: string;
  searchBy: string;
  bookingStartDate: string;
  bookingEndDate: string;
  tripStartDate: string;
  tripEndDate: string;
};

// API Data Types
interface QuotationData {
  customId: string;
  _id: string;
  quotationType: string;
  isBookingDataComplete: true;
  channel: string;
  partyId: string;
  taskCount: number;
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  formFields: {
    customer?: string;
    destination?: string;
    departureDate?: string;
    budget?: number;
    traveller1?: string;
    [key: string]: unknown;
  };
  // Optional fields present on some responses / normalized objects
  travelDate?: string;
  serviceStatus?: string;
  owner?: Array<{ name?: string }>;
  primaryOwner?: { name?: string };
  secondaryOwner?: Array<{ name?: string }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  adultTravelers?: Array<{ name?: string; email?: string; phone?: string }>;
  childTravelers?: Array<{ name?: string; email?: string; phone?: string }>;
}

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
  "Service",
  "Service Status",
  "Amount",
  "Owners",
  "Voucher",
  "Tasks",
  "Actions",
];

interface Owner {
  short: string;
  full: string;
  color: string;
}

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "Confirmed":
      return "px-2 py-1 text-[12px] border border-[#DCFCE7] font-[500] rounded-full bg-[#F0FDF4] text-[#15803D]";
    case "Rescheduled":
      return "px-2 py-1 text-[12px] border border-[#DBEAFE] font-[500] rounded-full bg-[#EFF6FF] text-[#1D4ED8]";
    case "Cancelled":
      return "px-2 py-1 text-[12px] border border-[#FEE2E2] font-[500] rounded-full bg-[#FFF5F5] text-[#991B1B]";
    case "Draft":
      return "px-2 py-1 text-[12px] border border-[#FEF9C3] font-[500] rounded-full bg-[#FEF9C3] text-[#854D0E]";
    case "Deleted":
    default:
      return "px-2 py-1 text-[12px] border border-[#FEE2E2] font-[500] rounded-full bg-[#FFF5F5] text-[#991B1B]";
  }
};

const VOUCHER_MENU_OPTIONS = [
  "Booking Voucher",
  "Customer Invoice(s)",
  "Vendor Voucher(s)",
  "Vendor Invoice(s)",
];

const mapStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
    cancelled: "Cancelled",
  };
  return statusMap[status?.toLowerCase()] || "Confirmed";
};

const RECENT_CREATED_SESSION_KEY = "os_bookings_recent_created_v1";
const RECENT_CREATED_TTL_MS = 1000 * 60 * 60 * 3;

const isBookingIncomplete = (item: any): boolean =>
  !(
    item?.isBookingDataComplete === true ||
    item?.isBookingDataComplete === "true"
  );

const getCreatedAtTimestamp = (item: any): number => {
  const raw = item?.createdAt || item?.updatedAt || item?.travelDate;
  const parsed = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeKey = (value: string): string => value.toLowerCase().trim();
const toFilterArray = (value: string | string[] | undefined): string[] =>
  Array.isArray(value)
    ? value.filter(Boolean).map((v) => normalizeKey(String(v)))
    : value
      ? [normalizeKey(String(value))]
      : [];

const OS_SERVICE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "flight", label: "Flight" },
  { value: "accommodation", label: "Accommodation" },
  { value: "transportation", label: "Transportation" },
  { value: "ticket", label: "Ticket (Attraction)" },
  { value: "activity", label: "Activity" },
  { value: "travel insurance", label: "Travel Insurance" },
  { value: "visa", label: "Visa" },
  { value: "others", label: "Others" },
];

const getOsServiceKey = (quotationType?: string): string => {
  const v = normalizeKey(String(quotationType || ""));
  if (!v) return "others";
  if (["flight", "flights", "travel"].includes(v)) return "flight";
  if (["hotel", "accommodation"].includes(v)) return "accommodation";
  if (
    [
      "car",
      "transport-land",
      "land-transport",
      "land",
      "transportation",
      "transport-maritime",
      "maritime",
    ].includes(v)
  ) {
    return "transportation";
  }
  if (["ticket", "tickets"].includes(v)) return "ticket";
  if (["activity", "activities"].includes(v)) return "activity";
  if (["insurance", "travel insurance"].includes(v)) return "travel insurance";
  if (["visa", "visas"].includes(v)) return "visa";
  return "others";
};

const getBookingSourceType = (item: any): "os" | "limitless" => {
  const explicitType = normalizeKey(
    String(item?.bookingType || item?.sourceType || item?.source || ""),
  );
  if (explicitType === "limitless") return "limitless";
  if (explicitType === "os") return "os";

  if (
    Array.isArray(item?.limitlessDestinations) &&
    item.limitlessDestinations.length
  ) {
    return "limitless";
  }

  return "os";
};

const normalizeAlphaNumeric = (value: string): string =>
  value.replace(/[^a-z0-9]/gi, "").toLowerCase();

const normalizeDigits = (value: string): string => value.replace(/\D/g, "");

const getSubsequenceMatchIndices = (
  source: string,
  query: string,
  matchMode: "alnum" | "digits",
): number[] | null => {
  if (!query) return [];

  const normalizedQuery =
    matchMode === "digits"
      ? normalizeDigits(query)
      : normalizeAlphaNumeric(query);
  if (!normalizedQuery) return [];

  const indices: number[] = [];
  let queryCursor = 0;

  for (
    let i = 0;
    i < source.length && queryCursor < normalizedQuery.length;
    i++
  ) {
    const char = source[i] || "";
    const normalizedChar =
      matchMode === "digits"
        ? (char.match(/\d/) || [])[0] || ""
        : (char.match(/[a-z0-9]/i) || [])[0]?.toLowerCase() || "";

    if (!normalizedChar) continue;

    if (normalizedChar === normalizedQuery[queryCursor]) {
      indices.push(i);
      queryCursor += 1;
    }
  }

  if (queryCursor !== normalizedQuery.length) return null;
  return indices;
};

const matchesOrderedSubsequence = (
  source: string,
  query: string,
  matchMode: "alnum" | "digits",
): boolean => {
  const indices = getSubsequenceMatchIndices(source, query, matchMode);
  return indices !== null;
};

const OSBookingsPage = () => {
  const router = useRouter();
  // UI State
  const [isCreateSourceModalOpen, setIsCreateSourceModalOpen] = useState(false);
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

  const tabOptions = useMemo(
    () =>
      isBookingMaker
        ? ["Bookings", "Pending", "Drafts", "Denied", "Deleted"]
        : ["Bookings", "Drafts", "Deleted"],
    [isBookingMaker],
  );

  const [bookingSourceTab, setBookingSourceTab] = useState("My Bookings");
  const [activeTab, setActiveTab] = useState("Bookings");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<
    "Travel Date" | "Service" | "Service Status" | null
  >(null);
  const [pendingServiceTypes, setPendingServiceTypes] = useState<string[]>([]);
  const [pendingStatusTypes, setPendingStatusTypes] = useState<string[]>([]);
  const [pendingDateField, setPendingDateField] = useState<
    "travelDate" | "bookingDate"
  >("travelDate");
  const [travelDateField, setTravelDateField] = useState<
    "travelDate" | "bookingDate"
  >("travelDate");
  const [recentCreatedMap, setRecentCreatedMap] = useState<
    Record<string, number>
  >({});
  const hasLoadedInitialBatchRef = useRef(false);
  const knownBookingIdsRef = useRef<Set<string>>(new Set());

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [activeVoucherRowId, setActiveVoucherRowId] = useState<string | null>(
    null,
  );
  const [hoveredBookingRowId, setHoveredBookingRowId] = useState<string | null>(
    null,
  );
  const [calendarStartDate, setCalendarStartDate] = useState(() =>
    addDays(startOfDay(new Date()), -2),
  );
  const [selectedTimelineDate, setSelectedTimelineDate] = useState<Date | null>(
    null,
  );
  // Filters state
  const [filters, setFilters] = useState<FilterPayload>({
    serviceType: "",
    status: "",
    owner: "",
    search: "",
    searchBy: "bookingId",
    bookingStartDate: "",
    bookingEndDate: "",
    tripStartDate: "",
    tripEndDate: "",
    bookingType: "",
  });

  // Data State
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });
  // Owners list built dynamically from quotations data
  const [ownersList, setOwnersList] = useState<Owner[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RECENT_CREATED_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      const now = Date.now();
      const cleaned = Object.fromEntries(
        Object.entries(parsed || {}).filter(
          ([, createdAt]) => now - Number(createdAt) < RECENT_CREATED_TTL_MS,
        ),
      );
      setRecentCreatedMap(cleaned);
    } catch {
      setRecentCreatedMap({});
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        RECENT_CREATED_SESSION_KEY,
        JSON.stringify(recentCreatedMap),
      );
    } catch {
      // no-op
    }
  }, [recentCreatedMap]);

  useEffect(() => {
    if (!activeHeaderFilter) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-header-filter-trigger]") ||
        target.closest("[data-header-filter-dropdown]")
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
    if (activeHeaderFilter === "Service Status") {
      setPendingStatusTypes(toFilterArray(filters.status));
    }
    if (activeHeaderFilter === "Travel Date") {
      setPendingDateField(travelDateField);
    }
  }, [
    activeHeaderFilter,
    filters.serviceType,
    filters.status,
    travelDateField,
  ]);

  useEffect(() => {
    if (!activeVoucherRowId) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-voucher-trigger]") ||
        target.closest("[data-voucher-menu]")
      ) {
        return;
      }
      setActiveVoucherRowId(null);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activeVoucherRowId]);

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

  // Build owners list from quotations data
  useEffect(() => {
    if (quotations.length === 0) return;

    const uniqueOwnerNames = new Set<string>();
    quotations.forEach((q: any) => {
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
  }, [quotations]);

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
    const quotationTypeNormalized = String(item?.quotationType || "")
      .toLowerCase()
      .trim();

    // Only flight-type quotations should open the Flights view page.

    if (quotationTypeNormalized === "travel") {
      const quotationId = item?._id;
      if (quotationId) {
        // Pass the full quotation object to the flights page via sessionStorage.

        try {
          const storageKey = `os-flight-quotation:${quotationId}`;
          sessionStorage.setItem(storageKey, JSON.stringify(item));
          router.push(
            `/bookings/other-services/view-booking/flights?cacheKey=${encodeURIComponent(
              storageKey,
            )}`,
          );
          return;
        } catch (e) {
          console.error("Failed to cache quotation for view booking:", e);
        }

        router.push(
          `/bookings/other-services/view-booking/flights?quotationId=${encodeURIComponent(
            quotationId,
          )}`,
        );
      }
      return;
    }

    const quotationType = item.quotationType || "";
    const category = mapQuotationTypeToCategory(quotationType);
    const title = formatServiceType(quotationType);

    setSelectedQuotation(item);
    setSelectedService({
      id: item._id,
      title,
      image: "",
      category,
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
    return quotations.filter((q, idx) => {
      const selectedServiceTypes = toFilterArray(filters.serviceType);
      const selectedStatuses = toFilterArray(filters.status);
      const bookingType = getBookingSourceType(q);
      const selectedBookingType = normalizeKey(filters.bookingType || "");

      if (
        (selectedBookingType === "os" || selectedBookingType === "limitless") &&
        bookingType !== selectedBookingType
      ) {
        return false;
      }

      if (selectedServiceTypes.length > 0) {
        if (
          bookingType === "limitless" &&
          selectedBookingType === "limitless"
        ) {
          const destinationValues = [
            ...(Array.isArray((q as any)?.limitlessDestinations)
              ? ((q as any).limitlessDestinations as string[])
              : []),
            String(q.formFields?.destination || ""),
          ]
            .map((v) => normalizeKey(v))
            .filter(Boolean);

          if (
            !selectedServiceTypes.some((sel) => destinationValues.includes(sel))
          ) {
            return false;
          }
        } else {
          if (bookingType !== "os") return false;
          const serviceValue = getOsServiceKey(String(q.quotationType || ""));
          if (!selectedServiceTypes.includes(serviceValue)) {
            return false;
          }
        }
      }

      if (selectedStatuses.length > 0) {
        const normalizedStatus = normalizeKey(
          mapStatus(String(q.status || "")),
        );
        if (!selectedStatuses.includes(normalizedStatus)) {
          return false;
        }
      }

      if (filters.search.trim()) {
        const s = filters.search.trim();
        const ownerNames = ([] as Array<{ name?: string }>)
          .concat(
            q.secondaryOwner || [],
            q.primaryOwner ? [q.primaryOwner] : [],
            q.owner || [],
          )
          .map((owner) => owner?.name || "")
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        const bookingId = q.customId || q._id || "";
        const leadPaxName =
          q.adultTravelers?.[0]?.name ||
          q.customerId?.name ||
          q.formFields?.customer ||
          "";
        const customerName = q.customerId?.name || q.formFields?.customer || "";
        const rawAmount = q.totalAmount ?? q.formFields?.budget;
        const amountString =
          rawAmount === undefined || rawAmount === null
            ? ""
            : String(rawAmount);

        const matchesSearch =
          filters.searchBy === "bookingId"
            ? matchesOrderedSubsequence(bookingId, s, "alnum")
            : filters.searchBy === "leadPax"
              ? leadPaxName.toLowerCase().includes(s.toLowerCase())
              : filters.searchBy === "customerName"
                ? customerName.toLowerCase().includes(s.toLowerCase())
                : filters.searchBy === "amount"
                  ? matchesOrderedSubsequence(amountString, s, "digits")
                  : filters.searchBy === "owner"
                    ? ownerNames.includes(s.toLowerCase())
                    : false;
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
            q.formFields?.departureDate as string,
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
  }, [quotations, filters, selectedOwners]);

  // Load quotations from backend
  const loadQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiParams: {
        bookingStartDate?: string;
        bookingEndDate?: string;
        travelStartDate?: string;
        travelEndDate?: string;
        owner?: string | string[];
        activeTab: string;
      } = { activeTab };

      if (filters.bookingStartDate)
        apiParams.bookingStartDate = filters.bookingStartDate;
      if (filters.bookingEndDate)
        apiParams.bookingEndDate = filters.bookingEndDate;
      if (filters.tripStartDate)
        apiParams.travelStartDate = filters.tripStartDate;
      if (filters.tripEndDate) apiParams.travelEndDate = filters.tripEndDate;
      console.log("Active tab:", activeTab);
      // Note: Owner filtering is done client-side since API returns owner objects with names

      const response = await BookingApiService.getAllQuotations(
        Object.keys(apiParams).length ? apiParams : undefined,
      );

      if (response.success && response.data) {
        const raw: any = response.data;
        const allQuotations =
          (raw?.quotations as any[]) || (raw as any[]) || [];

        const now = Date.now();
        const fetchedIds = new Set<string>();
        allQuotations.forEach((item: any) => {
          const id = String(item?._id || item?.id || "");
          if (id) fetchedIds.add(id);
        });

        setRecentCreatedMap((prev) => {
          const next: Record<string, number> = {};

          Object.entries(prev).forEach(([id, ts]) => {
            if (
              fetchedIds.has(id) &&
              now - Number(ts) < RECENT_CREATED_TTL_MS
            ) {
              next[id] = Number(ts);
            }
          });

          if (hasLoadedInitialBatchRef.current) {
            allQuotations.forEach((item: any) => {
              const id = String(item?._id || item?.id || "");
              if (id && !knownBookingIdsRef.current.has(id)) {
                next[id] = now;
              }
            });
          } else {
            hasLoadedInitialBatchRef.current = true;
          }

          return next;
        });
        knownBookingIdsRef.current = fetchedIds;

        setQuotations(allQuotations);
        // calculateSummaryData(response.data?.quotations);
      } else {
        throw new Error(response.message || "Failed to load quotations");
      }
    } catch (err) {
      console.error("Error loading quotations:", err);
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
  ]);

  // Load quotations on component mount and filter changes
  useEffect(() => {
    loadQuotations();
  }, [
    loadQuotations,
    filters.bookingStartDate,
    filters.bookingEndDate,
    filters.tripStartDate,
    filters.tripEndDate,
    filters.owner,
    activeTab,
  ]);

  const handleServiceSelect = (service: BookingService) => {
    setSelectedQuotation(null);
    setSelectedService(service);
    setSideSheetMode("edit");
    setIsSideSheetOpen(true);
  };

  const handleCreateRequested = () => {
    setIsCreateSourceModalOpen(true);
  };

  // Existing OS create flow: generate ids and then open service-selection modal
  const handleOSCreateRequested = async () => {
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
        CustomIdApi.generate("booking"),
        CustomIdApi.generate("customer"),
        CustomIdApi.generate("vendor"),
      ]);
      const bookingId = bookingResp?.customId || null;
      const customerId = customerResp?.customId || null;
      const vendorId = vendorResp?.customId || null;
      setGeneratedBookingCode(bookingId);
      setGeneratedCustomerCode(customerId);
      setGeneratedVendorCode(vendorId);
    } catch (err) {
      console.error("Failed to generate custom id:", err);
      setGeneratedBookingCode(null);
      setGeneratedCustomerCode(null);
      setGeneratedVendorCode(null);
    }
  };

  const handleCreateSourceSelected = async (source: "os" | "limitless") => {
    setIsCreateSourceModalOpen(false);

    if (source === "limitless") {
      router.push("/bookings/limitless?create=1");
      return;
    }

    // Generate IDs
    await handleOSCreateRequested();

    // Open sidesheet directly with Flights selected by default
    setSelectedQuotation(null);
    setSelectedService({
      id: "flights",
      title: "Flights",
      image: "/images/flight-icon.png",
      category: "travel",
      description: "Book domestic and international flights",
    });
    setSideSheetMode("edit");
    setIsSideSheetOpen(true);
  };

  // Handle booking completion (refresh data)
  const handleBookingComplete = useCallback(async () => {
    await loadQuotations();
    setIsSideSheetOpen(false);
    setSelectedQuotation(null);
  }, [loadQuotations, activeTab]);

  const getServiceIcon = (
    quotationType: string,
  ): React.ReactElement | string => {
    if (!quotationType) return "Visa";

    const normalized = quotationType.toLowerCase().trim();

    // Use the same logic as formatServiceType for consistency
    const typeMap: Record<string, string> = {
      flight: "flight",
      flights: "flight",
      travel: "flight",

      hotel: "accommodation",
      accommodation: "accommodation",

      maritime: "maritime",
      "transport-maritime": "maritime",
      "maritime transportation": "maritime",
      "maritime-transportation": "maritime",
      maritime_transportation: "maritime",
      car: "land",
      "land transportation": "land",
      "land-transportation": "land",
      land_transportation: "land",
      transportation: "land",
      land: "land",
      "transport-land": "land",

      package: "package",

      "travel insurance": "insurance",

      activity: "activity",
      activities: "activity",

      insurance: "insurance",

      visa: "visa",
      visas: "visa",

      ticket: "ticket",
      tickets: "ticket",
    };

    const key = typeMap[normalized] || normalized;

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
          width={16}
          height={16}
          className="object-contain text-[##7135AD]"
        />
      ),
      activity: (
        <Image
          src="/icons/service-icons/activity.svg"
          alt="Activity"
          width={16}
          height={16}
          className="object-contain"
        />
      ),
      insurance: (
        <Image
          src="/icons/service-icons/insurance.svg"
          alt="Insurance"
          width={16}
          height={16}
          className="object-contain"
        />
      ),
      ticket: (
        <Image
          src="/icons/service-icons/ticket.svg"
          alt="Tickets"
          width={16}
          height={16}
          className="object-contain"
        />
      ),
      tickets: (
        <Image
          src="/icons/service-icons/ticket.svg"
          alt="Tickets"
          width={16}
          height={16}
          className="object-contain"
        />
      ),
      land: (
        <Image
          src="/icons/service-icons/land-icon.svg"
          alt="Land Transport"
          width={16}
          height={16}
          className="object-contain"
        />
      ),
      visa: (
        <Image
          src="/icons/service-icons/visa-icon-final.svg"
          alt="visa"
          width={16}
          height={16}
          className="object-contain"
        />
      ),
      package: "Package", // optional: add a package icon later
    };

    return iconMap[key] || "📋"; // fallback
  };

  const handleDeleteClick = (quotationId: string) => {
    setSelectedDeleteId(quotationId);
    setIsDeleteModalOpen(true);
  };

  const openBookingInEditMode = useCallback((item: any) => {
    const quotationType = item?.quotationType || "";
    const category = mapQuotationTypeToCategory(quotationType);
    const title = formatServiceType(quotationType || "others");

    setSideSheetMode("edit");
    setSelectedQuotation(item);
    setSelectedService({
      id: item?._id || item?.id || "",
      title,
      image: "",
      category,
      description: "",
    });
    setIsSideSheetOpen(false);
    requestAnimationFrame(() => {
      setIsSideSheetOpen(true);
    });
  }, []);

  const confirmDelete = async () => {
    if (!selectedDeleteId) return;

    try {
      const response =
        await BookingApiService.deleteQuotation(selectedDeleteId);

      if (response.success) {
        // Remove from UI
        setQuotations((prev) => prev.filter((q) => q._id !== selectedDeleteId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }

    setIsDeleteModalOpen(false);
    setSelectedDeleteId(null);
  };

  // Map various quotationType values to the service category used by sidesheet
  const mapQuotationTypeToCategory = (qt?: string) => {
    const v = (qt || "").toLowerCase().trim();
    const map: Record<string, string> = {
      flight: "travel",
      flights: "travel",
      travel: "travel",
      hotel: "accommodation",
      accommodation: "accommodation",
      car: "transport-land",
      "transport-land": "transport-land",
      "land-transport": "transport-land",
      land: "transport-land",
      transportation: "transport-land",
      maritime: "transport-maritime",
      "transport-maritime": "transport-maritime",
      ticket: "tickets",
      tickets: "tickets",
      activity: "activity",
      activities: "activity",
      insurance: "travel insurance",
      "travel insurance": "travel insurance",
      visa: "visas",
      visas: "visas",
      others: "others",
      package: "others",
    };

    return (map[v] as any) || "others";
  };

  // fetch new booking custom id, clone quotation and open sidesheet
  const handleDuplicate = async (item: any) => {
    try {
      // fetch custom id for booking
      const resp = await CustomIdApi.generate("booking");
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

      // determine and set service object expected by sidesheet
      const quotationType = clone.quotationType || clone.serviceType || "";
      const category = mapQuotationTypeToCategory(quotationType);
      const title = formatServiceType(quotationType || "others");

      setGeneratedBookingCode(newId);
      setSelectedQuotation(clone);
      setSelectedService({
        id: newId,
        title,
        image: "",
        category,
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
        ? quotations?.[row.originalIndex]?._id
        : finalQuotations?.[row.originalIndex]?.id);

    const baseActions = [
      {
        label: "Edit",
        icon: <MdOutlineEdit />,
        color: "text-blue-600",
        onClick: () => {
          setIsSideSheetOpen(true);
          setSideSheetMode("edit");
          setSelectedQuotation(row);
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

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const normalizeDraft = (draft: any) => {
    // Backend drafts are quotations with serviceStatus = 'draft'
    // They have the same structure as regular quotations
    return {
      _id: draft._id,
      customId: draft.customId || null,
      quotationType: draft.quotationType || "others",
      formFields: draft.formFields || {},
      totalAmount: draft.totalAmount || 0,
      status: "draft",
      serviceStatus: draft.serviceStatus,
      createdAt: draft.createdAt || null,
      travelDate: draft.travelDate || null,
      isDraft: true,
      customerId: draft.customerId,
      vendorId: draft.vendorId,
      owner: draft.owner || [],
      travelers: draft.travelers || [],
      adultTravlers: draft.adultTravlers || 0,
      childTravlers: draft.childTravlers || 0,
      remarks: draft.remarks || "",
    };
  };

  // Filter quotations based on active tab and status
  const finalQuotations = useMemo(() => {
    // Drafts tab shows drafts from backend with search filtering
    if (activeTab === "Drafts") {
      const normalizedDrafts = drafts.map(normalizeDraft);

      // Apply search filter to drafts
      if (filters.search.trim()) {
        const s = filters.search.trim();
        return normalizedDrafts.filter((draft: any) => {
          const selectedServiceTypes = toFilterArray(filters.serviceType);
          const selectedStatuses = toFilterArray(filters.status);
          const bookingType = getBookingSourceType(draft);
          const selectedBookingType = normalizeKey(filters.bookingType || "");

          if (
            (selectedBookingType === "os" ||
              selectedBookingType === "limitless") &&
            bookingType !== selectedBookingType
          ) {
            return false;
          }

          if (selectedServiceTypes.length > 0) {
            if (
              bookingType === "limitless" &&
              selectedBookingType === "limitless"
            ) {
              const destinationValues = [
                ...(Array.isArray(draft?.limitlessDestinations)
                  ? (draft.limitlessDestinations as string[])
                  : []),
                String(draft.formFields?.destination || ""),
              ]
                .map((v) => normalizeKey(v))
                .filter(Boolean);

              if (
                !selectedServiceTypes.some((sel) =>
                  destinationValues.includes(sel),
                )
              ) {
                return false;
              }
            } else {
              if (bookingType !== "os") return false;
              const serviceValue = getOsServiceKey(
                String(draft.quotationType || ""),
              );
              if (!selectedServiceTypes.includes(serviceValue)) {
                return false;
              }
            }
          }

          if (selectedStatuses.length > 0) {
            const normalizedStatus = normalizeKey(
              mapStatus(String(draft.status || "")),
            );
            if (!selectedStatuses.includes(normalizedStatus)) {
              return false;
            }
          }

          const ownerNames = ([] as Array<{ name?: string }>)
            .concat(
              draft.owner || [],
              draft.secondaryOwner || [],
              draft.primaryOwner ? [draft.primaryOwner] : [],
            )
            .map((owner) => owner?.name || "")
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          const bookingId = draft.customId || draft._id || "";
          const leadPaxName =
            draft.adultTravelers?.[0]?.name ||
            draft.customerId?.name ||
            draft.formFields?.customer ||
            "";
          const customerName =
            draft.customerId?.name || draft.formFields?.customer || "";
          const rawAmount = draft.totalAmount ?? draft.formFields?.budget;
          const amountString =
            rawAmount === undefined || rawAmount === null
              ? ""
              : String(rawAmount);

          if (filters.searchBy === "bookingId") {
            return matchesOrderedSubsequence(bookingId, s, "alnum");
          }
          if (filters.searchBy === "leadPax") {
            return leadPaxName.toLowerCase().includes(s.toLowerCase());
          }
          if (filters.searchBy === "customerName") {
            return customerName.toLowerCase().includes(s.toLowerCase());
          }
          if (filters.searchBy === "amount") {
            return matchesOrderedSubsequence(amountString, s, "digits");
          }
          if (filters.searchBy === "owner") {
            return ownerNames.includes(s.toLowerCase());
          }
          return false;
        });
      }

      return normalizedDrafts.filter((draft: any) => {
        const selectedServiceTypes = toFilterArray(filters.serviceType);
        const selectedStatuses = toFilterArray(filters.status);
        const bookingType = getBookingSourceType(draft);
        const selectedBookingType = normalizeKey(filters.bookingType || "");

        if (
          (selectedBookingType === "os" ||
            selectedBookingType === "limitless") &&
          bookingType !== selectedBookingType
        ) {
          return false;
        }

        if (selectedServiceTypes.length > 0) {
          if (
            bookingType === "limitless" &&
            selectedBookingType === "limitless"
          ) {
            const destinationValues = [
              ...(Array.isArray(draft?.limitlessDestinations)
                ? (draft.limitlessDestinations as string[])
                : []),
              String(draft.formFields?.destination || ""),
            ]
              .map((v) => normalizeKey(v))
              .filter(Boolean);

            if (
              !selectedServiceTypes.some((sel) =>
                destinationValues.includes(sel),
              )
            ) {
              return false;
            }
          } else {
            if (bookingType !== "os") return false;
            const serviceValue = getOsServiceKey(
              String(draft.quotationType || ""),
            );
            if (!selectedServiceTypes.includes(serviceValue)) {
              return false;
            }
          }
        }

        if (selectedStatuses.length > 0) {
          const normalizedStatus = normalizeKey(
            mapStatus(String(draft.status || "")),
          );
          if (!selectedStatuses.includes(normalizedStatus)) {
            return false;
          }
        }

        return true;
      });
    }

    // Filter quotations by status based on active tab
    return filteredQuotations.filter((q) => {
      const status = q.serviceStatus?.toLowerCase();

      switch (activeTab) {
        case "Bookings":
          // Show confirmed bookings
          return status === "approved";
        case "Pending":
          // Show pending or draft status bookings
          return status === "pending" || status === "draft";
        case "Deleted":
          // Show deleted bookings (if you have a deleted flag or status)
          return status === "deleted";
        default:
          return true;
      }
    });
  }, [
    activeTab,
    drafts,
    filteredQuotations,
    filters.search,
    filters.searchBy,
  ]) as any[];

  // Use shared timestamp extractor from utils/sorting.ts
  // (keeps logic consistent across pages)

  const getSelectedDateFieldRawValue = useCallback(
    (item: any) =>
      travelDateField === "bookingDate"
        ? item.createdAt || item.updatedAt || null
        : item.travelDate || item.formFields?.departureDate || null,
    [travelDateField],
  );

  const toggledQuotations = useMemo(
    () =>
      showIncompleteOnly
        ? finalQuotations.filter((item) => isBookingIncomplete(item))
        : finalQuotations,
    [finalQuotations, showIncompleteOnly],
  );

  const sortedQuotationsForTable = useMemo(() => {
    if (sortState.key !== "Travel Date" || sortState.direction === "none") {
      const withIndex = toggledQuotations.map((item, originalIndex) => ({
        item,
        originalIndex,
      }));

      withIndex.sort((a, b) => {
        const aId = String(a.item?._id || a.item?.id || "");
        const bId = String(b.item?._id || b.item?.id || "");
        const aRecent = aId ? recentCreatedMap[aId] || 0 : 0;
        const bRecent = bId ? recentCreatedMap[bId] || 0 : 0;

        if (aRecent || bRecent) {
          if (!aRecent) return 1;
          if (!bRecent) return -1;
          const recentDiff = bRecent - aRecent;
          if (recentDiff !== 0) return recentDiff;
        }

        const createdDiff =
          getCreatedAtTimestamp(b.item) - getCreatedAtTimestamp(a.item);
        if (createdDiff !== 0) return createdDiff;

        return a.originalIndex - b.originalIndex;
      });

      return withIndex.map((entry) => entry.item);
    }

    // Stable sort: keep original order for ties.
    const withIndex = toggledQuotations.map((item, originalIndex) => ({
      item,
      originalIndex,
    }));

    withIndex.sort((a, b) => {
      const atRaw = getSelectedDateFieldRawValue(a.item);
      const btRaw = getSelectedDateFieldRawValue(b.item);
      const at = atRaw ? new Date(atRaw).getTime() : null;
      const bt = btRaw ? new Date(btRaw).getTime() : null;

      // Always keep missing/invalid dates at the bottom.
      if (!Number.isFinite(at) && !Number.isFinite(bt)) {
        return a.originalIndex - b.originalIndex;
      }
      if (!Number.isFinite(at)) return 1;
      if (!Number.isFinite(bt)) return -1;

      const diff = Number(at) - Number(bt);
      if (diff !== 0) return sortState.direction === "asc" ? diff : -diff;
      return a.originalIndex - b.originalIndex;
    });

    return withIndex.map((x) => x.item);
  }, [
    toggledQuotations,
    sortState.direction,
    sortState.key,
    recentCreatedMap,
    getSelectedDateFieldRawValue,
  ]);

  // Convert quotations to table data
  const shouldHighlight = Boolean(filters.search.trim());
  const highlightText = useCallback(
    (
      text: string,
      mode: "substring-ci" | "subsequence-alnum" | "subsequence-digits",
      onlyWhenSearchBy?: string[],
    ) => {
      if (!text) return text;
      const query = filters.search.trim();
      if (!query || !shouldHighlight) return text;
      if (onlyWhenSearchBy && !onlyWhenSearchBy.includes(filters.searchBy)) {
        return text;
      }

      if (mode === "substring-ci") {
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const start = lowerText.indexOf(lowerQuery);
        if (start < 0) return text;
        const end = start + lowerQuery.length;
        return (
          <>
            {text.slice(0, start)}
            <span className="rounded-[2px] bg-[#FFF3B0]">
              {text.slice(start, end)}
            </span>
            {text.slice(end)}
          </>
        );
      }

      const indices =
        mode === "subsequence-digits"
          ? getSubsequenceMatchIndices(text, query, "digits")
          : getSubsequenceMatchIndices(text, query, "alnum");
      if (!indices || indices.length === 0) return text;
      const indexSet = new Set(indices);

      return (
        <>
          {Array.from(text).map((char, idx) =>
            indexSet.has(idx) ? (
              <span
                key={`${char}-${idx}`}
                className="rounded-[2px] bg-[#FFF3B0]"
              >
                {char}
              </span>
            ) : (
              <span key={`${char}-${idx}`}>{char}</span>
            ),
          )}
        </>
      );
    },
    [filters.search, filters.searchBy, shouldHighlight],
  );

  const tableData = useMemo<JSX.Element[][]>(() => {
    const rows = sortedQuotationsForTable.map((item, index) => [
      <td
        key={`id-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center  font-[400] align-middle h-[3rem] cursor-pointer"
      >
        <div
          className="relative inline-flex items-center justify-center"
          onMouseEnter={() =>
            setHoveredBookingRowId(String(item?._id || item?.id || ""))
          }
          onMouseLeave={() =>
            setHoveredBookingRowId((prev) =>
              prev === String(item?._id || item?.id || "") ? null : prev,
            )
          }
        >
          <div className="fade-content">
            <button
              onClick={() => handleViewBooking(item)}
              className="text-[13px] hover:underline font-[500]"
            >
              {highlightText(
                item.customId || item._id || "--",
                "subsequence-alnum",
                ["bookingId"],
              )}
            </button>
          </div>

          {!item.isBookingDataComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openBookingInEditMode(item);
              }}
              className={`
              absolute left-[-10px] top-1/2 z-[100] -translate-y-1/2
              whitespace-nowrap flex items-center gap-2 rounded-[8px] bg-[#FFF] px-[12px] py-[8px]
              text-[12px] font-[500] text-[#7135AD]
              shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]
              transition-opacity duration-300 ease-in-out
              ${hoveredBookingRowId === String(item?._id || item?.id || "") ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
            >
              Complete Booking
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M5 12H19M19 12L15 16M19 12L15 8"
                  stroke="#7135AD"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </td>,
      <td
        key={`lead-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 fade-content py-3 text-center text-[13px] font-[400] align-middle h-[3rem] cursor-pointer"
      >
        {highlightText(
          item.adultTravelers?.[0]?.name ||
            item.customerId?.name ||
            item.formFields?.customer ||
            "--",
          "substring-ci",
          ["leadPax", "customerName"],
        )}
      </td>,
      <td
        key={`date-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 fade-content py-3 text-center  text-[13px] font-[400] align-middle h-[3rem] cursor-pointer"
      >
        {getSelectedDateFieldRawValue(item)
          ? formatDMY(String(getSelectedDateFieldRawValue(item)))
          : "--"}
      </td>,
      <td
        key={`service-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 fade-content text-center text-[13px] font-normal align-middle h-[3rem] cursor-pointer"
      >
        <div className="flex flex-col fade-content items-center justify-center gap-2">
          <div className="w-[16px] h-[16px] flex items-center justify-center">
            {getServiceIcon(item.quotationType || "draft")}
          </div>
          <span className="text-center font-[400] leading-tight">
            {formatServiceType(item.quotationType || "draft")}
          </span>
        </div>
      </td>,
      <td
        key={`status-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 fade-content text-center align-middle text-[13px] h-[3rem] cursor-pointer"
      >
        <span className={getStatusBadgeClass(mapStatus(item.status))}>
          {mapStatus(item.status)}
        </span>
      </td>,
      <td
        key={`amount-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 fade-content text-center text-[#020202] font-[400] align-middle h-[3rem] cursor-pointer"
      >
        {item.totalAmount || item.formFields?.budget
          ? highlightText(
              `${getStoredCurrencySymbol()} ${formatNumberByStoredCurrency(
                item.totalAmount || item.formFields?.budget,
              )}`,
              "subsequence-digits",
              ["amount"],
            )
          : "--"}
      </td>,
      <td
        key={`owners-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 fade-content text-center align-middle h-[3rem] cursor-pointer"
      >
        <div className="flex items-center justify-center">
          {/* PRIMARY OWNER */}
          {item.primaryOwner?.name &&
            (() => {
              const name = item.primaryOwner.name;
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
                    colorPalette[(i + 1) % colorPalette.length] ||
                    colorPalette[0] ||
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
        key={`voucher-${index}`}
        className="px-4 py-3 fade-content text-center align-middle h-[3rem]"
      >
        <div className="relative flex items-center justify-center">
          <div className="inline-flex overflow-hidden rounded-[7px] border border-[#E2E1E1] bg-[#FFF] hover:bg-[#F7F7F7]">
            <span className="flex p-[6px] items-center justify-center border-r border-[#E2E1E1]">
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
                const rowId = String(item?._id || item?.id || index);
                setActiveVoucherRowId((prev) =>
                  prev === rowId ? null : rowId,
                );
              }}
              className="flex p-[6px] items-center justify-center"
            >
              <IoChevronDown className="h-[14px] w-[14px] text-[#8A8A8A]" />
            </button>
          </div>

          {activeVoucherRowId === String(item?._id || item?.id || index) && (
            <div
              data-voucher-menu
              className="absolute left-1/2 top-[48px] z-[140] w-[180px] -translate-x-1/2 overflow-hidden rounded-[12px] border border-[#D6D6D6] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
              onClick={(e) => e.stopPropagation()}
            >
              {VOUCHER_MENU_OPTIONS.map((label, optionIndex) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    console.log(
                      "Voucher download option clicked:",
                      label,
                      item?._id || item?.id,
                    );
                    setActiveVoucherRowId(null);
                  }}
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
      </td>,
      <td
        key={`tasks-${index}`}
        className="px-4 py-3 fade-content text-center align-middle h-[3rem]"
      >
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <TaskButton count={item.taskCount} bookingId={item._id} />
        </div>
      </td>,

      // ACTIONS COLUMN
      <td
        key={`actions-${index}`}
        className="px-4 py-3 text-center fade-content align-middle h-[4rem]"
      >
        <div
          className="mx-auto flex w-fit items-center gap-[8px] opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out [.row-actions-active_&]:opacity-100 [.row-actions-active_&]:pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative group">
            <button
              type="button"
              className="rounded-[6px] border border-[#E2E1E1] bg-[#FFF] px-[11px] py-1.5 text-[14px] text-[#414141] font-[400]"
            >
              ₹
            </button>
            <div className="pointer-events-none z-[99999] absolute left-1/2 bottom-full mb-2 -translate-x-1/2 rounded-[6px] bg-[#111111] px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap">
              Record Payment
            </div>
          </div>
          <ActionMenu
            actions={getActionsForTab(activeTab, item)}
            right="right-15"
          />
        </div>
      </td>,
    ]);
    return rows;
  }, [
    sortedQuotationsForTable,
    ownersList,
    activeTab,
    hoveredBookingRowId,
    highlightText,
    getSelectedDateFieldRawValue,
    activeVoucherRowId,
    openBookingInEditMode,
  ]);

  const rowClassNameResolver = useCallback(
    (rowIndex: number) => {
      const item = sortedQuotationsForTable[rowIndex];
      if (!item) return "";
      const itemId = String(item?._id || item?.id || "");

      const isBookingDataComplete = !isBookingIncomplete(item);

      const baseClass = !isBookingDataComplete
        ? "!bg-[#FFFDEF] border-l-4 border-l-[#FEDB6B]"
        : "";
      const hoverOverlayClass =
        hoveredBookingRowId === itemId && !isBookingDataComplete
          ? "[&>.fade-content]:opacity-30 [&>.fade-content]:transition-opacity [&>.fade-content]:duration-300 [&>.fade-content]:ease-in-out"
          : "text-[#020202]";

      return `${baseClass} ${hoverOverlayClass}`.trim();
    },
    [hoveredBookingRowId, sortedQuotationsForTable],
  );

  // Helper functions

  const filterOptions = useMemo(() => {
    const limitlessDestinationSet = new Set<string>();

    quotations.forEach((item) => {
      const sourceType = getBookingSourceType(item);
      if (sourceType === "limitless") {
        const destinations = [
          ...(Array.isArray((item as any).limitlessDestinations)
            ? ((item as any).limitlessDestinations as string[])
            : []),
          String(item.formFields?.destination || ""),
        ]
          .map((d) => d.trim())
          .filter(Boolean);

        destinations.forEach((destination) =>
          limitlessDestinationSet.add(destination),
        );
        return;
      }
    });

    const selectedBookingType = normalizeKey(filters.bookingType || "");
    const serviceTypes =
      selectedBookingType === "limitless"
        ? Array.from(limitlessDestinationSet)
            .sort((a, b) => a.localeCompare(b))
            .map((destination) => ({ value: destination, label: destination }))
        : OS_SERVICE_OPTIONS;

    return {
      serviceTypes,
      statuses: [
        { value: "confirmed", label: "Confirmed" },
        { value: "rescheduled", label: "Rescheduled" },
        { value: "cancelled", label: "Cancelled" },
      ],
      owners: ownersList.map((o) => ({ value: o.full, label: o.full })),
    };
  }, [ownersList, quotations, filters.bookingType]);

  const columnIconMap = useMemo<Record<string, JSX.Element>>(
    () => ({
      "Travel Date": (
        <span className="inline-flex items-center gap-2">
          <button
            type="button"
            data-header-filter-trigger="Travel Date"
            onClick={(e) => {
              e.stopPropagation();
              setActiveHeaderFilter((prev) =>
                prev === "Travel Date" ? null : "Travel Date",
              );
            }}
            className="inline-flex items-center"
          >
            <CiFilter
              className={`inline w-3 h-3 stroke-[2] ${
                activeHeaderFilter === "Travel Date"
                  ? "text-[#7C3AED]"
                  : "text-[#818181] hover:text-[#7135AD]"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSort("Travel Date");
            }}
            className="inline-flex items-center"
          >
            <TbArrowsUpDown className="inline w-3 h-3 text-[#818181] hover:text-[#7135AD] stroke-[2]" />
          </button>
        </span>
      ),
      "Booking Date": (
        <span className="inline-flex items-center gap-2">
          <button
            type="button"
            data-header-filter-trigger="Travel Date"
            onClick={(e) => {
              e.stopPropagation();
              setActiveHeaderFilter((prev) =>
                prev === "Travel Date" ? null : "Travel Date",
              );
            }}
            className="inline-flex items-center"
          >
            <CiFilter
              className={`inline w-3 h-3 stroke-[2] ${
                activeHeaderFilter === "Travel Date"
                  ? "text-[#7C3AED]"
                  : "text-[#818181] hover:text-[#7135AD]"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSort("Travel Date");
            }}
            className="inline-flex items-center"
          >
            <TbArrowsUpDown className="inline w-3 h-3 text-[#818181] hover:text-[#7135AD] stroke-[2]" />
          </button>
        </span>
      ),
      Service: (
        <CiFilter
          className={`inline w-3 h-3 stroke-[2] ${
            activeHeaderFilter === "Service"
              ? "text-[#7C3AED]"
              : "text-[#818181] hover:text-[#7135AD]"
          }`}
        />
      ),
      "Service Status": (
        <CiFilter
          className={`inline w-3 h-3 stroke-[2] ${
            activeHeaderFilter === "Service Status"
              ? "text-[#7C3AED]"
              : "text-[#818181] hover:text-[#7135AD]"
          }`}
        />
      ),
    }),
    [activeHeaderFilter],
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "confirmed", label: "Confirmed" },
      { value: "cancelled", label: "Cancelled" },
      { value: "rescheduled", label: "Rescheduled" },
    ],
    [],
  );

  const travelDateFieldOptions = useMemo(
    () => [
      { value: "travelDate", label: "Travel Date" },
      { value: "bookingDate", label: "Booking Date" },
    ],
    [],
  );
  const dateColumnLabel =
    travelDateField === "bookingDate" ? "Booking Date" : "Travel Date";
  const displayColumns = useMemo(
    () => columns.map((col) => (col === "Travel Date" ? dateColumnLabel : col)),
    [dateColumnLabel],
  );

  const renderSingleSelectDropdown = useCallback(
    (
      value: string,
      options: Array<{ value: string; label: string }>,
      onSelect: (nextValue: string) => void,
      placeholder: string,
      onReset: () => void,
      onApply: () => void,
    ) => (
      <div className="flex max-h-[340px] w-[200px] flex-col overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
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
                <FiCheck className="w-3 h-3" />
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
      <div className="flex max-h-[320px] w-[220px] flex-col overflow-hidden rounded-[18px] border border-[#D7D7D7] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
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
                  <FiCheck className="w-3 h-3" />
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
          "Date Field",
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
          "Date Field",
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
          OS_SERVICE_OPTIONS,
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
              serviceType: pendingServiceTypes.length
                ? pendingServiceTypes
                : "",
            }));
            setActiveHeaderFilter(null);
          },
        ),
      },
      "Service Status": {
        isOpen: activeHeaderFilter === "Service Status",
        align: "center" as const,
        content: renderMultiSelectDropdown(
          statusFilterOptions,
          pendingStatusTypes,
          (value) =>
            setPendingStatusTypes((prev) =>
              prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value],
            ),
          () => setPendingStatusTypes([]),
          () => {
            setFilters((prev) => ({
              ...prev,
              status: pendingStatusTypes.length ? pendingStatusTypes : "",
            }));
            setActiveHeaderFilter(null);
          },
        ),
      },
    }),
    [
      activeHeaderFilter,
      filters.bookingType,
      filters.serviceType,
      filters.status,
      renderSingleSelectDropdown,
      renderMultiSelectDropdown,
      statusFilterOptions,
      travelDateField,
      travelDateFieldOptions,
      pendingServiceTypes,
      pendingStatusTypes,
      pendingDateField,
    ],
  );

  const handleHeaderIconClick = useCallback((column: string) => {
    if (column !== "Service" && column !== "Service Status") return;

    const nextColumn =
      column === "Service" || column === "Service Status" ? column : null;
    setActiveHeaderFilter((prev) => (prev === nextColumn ? null : nextColumn));
  }, []);

  const handleFilterChange = useCallback((next: FilterPayload) => {
    setFilters(next);
    setSearchValue(next.search);
  }, []);

  const getBookingTimelineDate = useCallback((item: any) => {
    const rawDate =
      item.travelDate ||
      item.formFields?.departureDate ||
      item.createdAt ||
      item.updatedAt;
    if (!rawDate) return null;

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return null;

    return parsed;
  }, []);

  const getTimelineServiceLabel = useCallback((quotationType?: string) => {
    const normalized = String(quotationType || "")
      .toLowerCase()
      .trim();

    if (["flight", "flights", "travel"].includes(normalized)) {
      return "Flight";
    }
    if (["hotel", "accommodation"].includes(normalized)) {
      return "Flights";
    }
    if (
      ["car", "land", "transport-land", "transportation"].includes(normalized)
    ) {
      return "Transport";
    }
    if (["ticket", "tickets"].includes(normalized)) {
      return "Tickets";
    }
    if (["activity", "activities"].includes(normalized)) {
      return "Activity";
    }

    return formatServiceType(quotationType || "others");
  }, []);

  const getTimelineServiceIcon = useCallback((quotationType?: string) => {
    const normalized = String(quotationType || "")
      .toLowerCase()
      .trim();

    if (["flight", "flights", "travel"].includes(normalized)) {
      return <LuPlane className="h-4 w-4 text-[#7A3EC8]" />;
    }
    if (["hotel", "accommodation"].includes(normalized)) {
      return <LuHotel className="h-4 w-4 text-[#7A3EC8]" />;
    }
    if (
      ["car", "land", "transport-land", "transportation"].includes(normalized)
    ) {
      return <PiCarProfileLight className="h-4 w-4 text-[#7A3EC8]" />;
    }
    if (["ticket", "tickets"].includes(normalized)) {
      return <LuTicket className="h-4 w-4 text-[#7A3EC8]" />;
    }

    return <MdOutlineTravelExplore className="h-4 w-4 text-[#7A3EC8]" />;
  }, []);

  const timelineDates = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) =>
        addDays(calendarStartDate, index),
      ),
    [calendarStartDate],
  );

  const hasOwnerFilter = useMemo(
    () =>
      Array.isArray(filters.owner)
        ? filters.owner.length > 0
        : Boolean(filters.owner),
    [filters.owner],
  );

  const isCalendarFilterApplied = useMemo(
    () =>
      Boolean(
        filters.search ||
        filters.bookingStartDate ||
        filters.bookingEndDate ||
        filters.tripStartDate ||
        filters.tripEndDate ||
        toFilterArray(filters.serviceType).length > 0 ||
        toFilterArray(filters.status).length > 0 ||
        filters.bookingType ||
        hasOwnerFilter,
      ),
    [
      filters.search,
      filters.bookingStartDate,
      filters.bookingEndDate,
      filters.tripStartDate,
      filters.tripEndDate,
      filters.serviceType,
      filters.status,
      filters.bookingType,
      hasOwnerFilter,
    ],
  );

  const matchedCalendarDates = useMemo(() => {
    const dateMap = new Map<number, Date>();
    filteredQuotations.forEach((item) => {
      const raw = getBookingTimelineDate(item);
      if (!raw) return;
      const normalized = startOfDay(raw);
      dateMap.set(normalized.getTime(), normalized);
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => a.getTime() - b.getTime(),
    );
  }, [filteredQuotations, getBookingTimelineDate]);

  const currentCalendarAnchorDate = useMemo(
    () => addDays(calendarStartDate, 2),
    [calendarStartDate],
  );

  const calendarNavigatorIndex = useMemo(() => {
    if (matchedCalendarDates.length === 0) return 0;

    const anchor = startOfDay(currentCalendarAnchorDate).getTime();
    let nearestIndex = 0;
    let nearestDiff = Number.POSITIVE_INFINITY;

    matchedCalendarDates.forEach((date, idx) => {
      const diff = Math.abs(date.getTime() - anchor);
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearestIndex = idx;
      }
    });

    return nearestIndex + 1;
  }, [currentCalendarAnchorDate, matchedCalendarDates]);

  const jumpToCalendarMatch = useCallback(
    (direction: -1 | 1) => {
      if (!isCalendarFilterApplied || matchedCalendarDates.length === 0) return;
      const selectedIndex = selectedTimelineDate
        ? matchedCalendarDates.findIndex((date) =>
            isSameDay(date, selectedTimelineDate),
          )
        : -1;
      const currentIndex = Math.max(
        0,
        selectedIndex >= 0 ? selectedIndex : calendarNavigatorIndex - 1,
      );
      const targetIndex = Math.min(
        matchedCalendarDates.length - 1,
        Math.max(0, currentIndex + direction),
      );
      const targetDate = matchedCalendarDates[targetIndex];
      if (!targetDate) return;
      const normalizedTarget = startOfDay(targetDate);
      const windowStart = startOfDay(calendarStartDate);
      const windowEnd = addDays(windowStart, 9);

      if (normalizedTarget.getTime() < windowStart.getTime()) {
        const gapDays = differenceInCalendarDays(windowStart, normalizedTarget);
        const batches = Math.ceil(gapDays / 10);
        setCalendarStartDate(addDays(windowStart, -10 * batches));
      } else if (normalizedTarget.getTime() > windowEnd.getTime()) {
        const gapDays = differenceInCalendarDays(normalizedTarget, windowEnd);
        const batches = Math.ceil(gapDays / 10);
        setCalendarStartDate(addDays(windowStart, 10 * batches));
      }

      setSelectedTimelineDate(normalizedTarget);
    },
    [
      calendarStartDate,
      calendarNavigatorIndex,
      isCalendarFilterApplied,
      matchedCalendarDates,
      selectedTimelineDate,
      setCalendarStartDate,
    ],
  );

  const isCalendarNavigatorActive =
    bookingSourceTab === "My Calender" &&
    isCalendarFilterApplied &&
    matchedCalendarDates.length > 0;

  useEffect(() => {
    if (bookingSourceTab !== "My Calender" || !isCalendarFilterApplied) {
      setSelectedTimelineDate(null);
    }
  }, [bookingSourceTab, isCalendarFilterApplied]);

  const timelineBuckets = useMemo(
    () =>
      timelineDates.map((date) => {
        const sourceBookings = showIncompleteOnly
          ? filteredQuotations.filter((item) => isBookingIncomplete(item))
          : filteredQuotations;
        const bookings = sourceBookings
          .filter((item) => {
            const bookingDate = getBookingTimelineDate(item);
            return bookingDate ? isSameDay(bookingDate, date) : false;
          })
          .sort((a, b) => {
            const aTime = getBookingTimelineDate(a)?.getTime() ?? 0;
            const bTime = getBookingTimelineDate(b)?.getTime() ?? 0;
            return aTime - bTime;
          });

        return {
          date,
          bookings,
          osCount: bookings.length,
          limitlessCount: 0,
        };
      }),
    [
      filteredQuotations,
      getBookingTimelineDate,
      timelineDates,
      showIncompleteOnly,
    ],
  );

  return (
    <div className="h-[83vh] overflow-hidden bg-[#F9F9F9] px-7 py-0">
      <div className="flex h-full flex-col bg-[#F9F9F9]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex w-full mb-6 items-center justify-between">
            <TableTabs
              tabs={["My Bookings", "My Calender"]}
              activeTab={bookingSourceTab}
              onChange={setBookingSourceTab}
              totalCount={filteredQuotations.length}
              tabsClassName="w-[20.5rem]"
              draggableIndicator={true}
            />

            <button
              onClick={() => handleCreateRequested()}
              className="text-white text-[14px] font-[500] bg-[#7135AD] rounded-[14px] px-[14px] py-[8px]"
            >
              + Create
            </button>
          </div>

          <Filter
            onFilterChange={handleFilterChange}
            onSearchChange={(value) => setSearchValue(value)}
            serviceTypes={filterOptions.serviceTypes}
            statuses={filterOptions.statuses}
            owners={filterOptions.owners}
            showResultNavigator={
              bookingSourceTab === "My Calender" && isCalendarFilterApplied
            }
            resultNavigatorActive={isCalendarNavigatorActive}
            resultNavigatorCurrent={
              isCalendarNavigatorActive ? calendarNavigatorIndex : 0
            }
            resultNavigatorTotal={
              isCalendarNavigatorActive ? matchedCalendarDates.length : 0
            }
            onResultNavigatorPrev={() => jumpToCalendarMatch(-1)}
            onResultNavigatorNext={() => jumpToCalendarMatch(1)}
            searchOptions={[
              {
                value: "bookingId",
                label: "Booking ID",
                placeholder: "Search by Booking ID",
                minChars: 3,
              },
              {
                value: "leadPax",
                label: "Lead Pax",
                placeholder: "Search by Lead Pax",
                minChars: 3,
              },
              {
                value: "customerName",
                label: "Customer Name",
                placeholder: "Search by Customer Name",
                minChars: 3,
              },
              {
                value: "amount",
                label: "Amount",
                placeholder: "Search by Amount",
                minChars: 2,
              },
            ]}
            onCreateClick={handleCreateRequested}
            allowAdvanceOwnerSearch={true}
            showBookingType={true}
          />

          {bookingSourceTab === "My Bookings" ? (
            <div className="relative mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-[1px] border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between border-b border-[#E5E7EB]">
                <UnderlineTabs
                  tabs={tabOptions}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  totalCount={filteredQuotations.length}
                  className="!border-b-0"
                />
                <div className="flex items-center gap-[20px] px-4">
                  <div className="flex items-center gap-[6px]">
                    <button
                      onClick={() => setShowIncompleteOnly((prev) => !prev)}
                      className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
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

                    <span className="text-[12px] font-[400] text-[#414141]">
                      Show Incomplete Bookings
                    </span>
                  </div>

                  <div className="rounded-full border border-[#C6B2DE] px-[14px] py-[6px] text-[12px] font-[500] text-[#4B4B4B]">
                    Total :{" "}
                    <span className="font-[500] text-[#7135AD]">
                      {sortedQuotationsForTable.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex-1 min-h-0 overflow-auto px-5 py-[4px]">
                {isLoading ? (
                  <TableSkeleton />
                ) : (
                  <Table
                    data={tableData}
                    columns={displayColumns}
                    columnIconMap={columnIconMap}
                    onHeaderIconClick={handleHeaderIconClick}
                    headerIconClickableColumns={["Service", "Service Status"]}
                    headerDropdownMap={headerDropdownMap}
                    columnWidthClassMap={{
                      "Booking ID": "w-[8rem]",
                      Voucher: "w-[9rem]",
                      Tasks: "w-[7.5rem]",
                      Actions: "w-[7.5rem]",
                    }}
                    onSort={handleSort}
                    categoryName="Bookings"
                    headerAlign={{ "Booking ID": "center" }}
                    rowClassNameResolver={rowClassNameResolver}
                    enableRowHoverActions={true}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-between border-b border-[#E2E1E1] py-[7px] px-5">
                <h2 className="text-[15px] whitespace-pre font-[600] text-[#020202]">
                  Bookings Timeline
                </h2>
                <div className="flex items-center gap-[14px]">
                  <div className="flex items-center gap-[6px]">
                    <button
                      onClick={() => setShowIncompleteOnly((prev) => !prev)}
                      className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
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
                    <span className="text-[12px] font-[400] text-[#414141] whitespace-nowrap">
                      Show Incomplete Bookings
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarStartDate((prev) => addDays(prev, -10))
                    }
                    className="rounded-full p-2 text-[#7A7A7A] transition-colors hover:bg-[#F3F3F3]"
                    aria-label="Previous 10 dates"
                  >
                    <IoChevronBack className="h-[12px] w-[12px]" />
                  </button>
                  <div className="rounded-full bg-[#F9F9F9] px-[10px] py-[7px] text-[13px] font-[500] text-[#020202]">
                    {`${format(timelineDates[0]!, "d MMM ''yy")} - ${format(
                      timelineDates[timelineDates.length - 1]!,
                      "d MMM ''yy",
                    )}`}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarStartDate((prev) => addDays(prev, 10))
                    }
                    className="rounded-full p-2 text-[#7A7A7A] transition-colors hover:bg-[#F3F3F3]"
                    aria-label="Next 10 dates"
                  >
                    <IoChevronForward className="h-[12px] w-[12px]" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-5 overflow-y-scroll p-5">
                {timelineBuckets.map((bucket, index) => {
                  const isFilterArrowSelectedCard =
                    Boolean(selectedTimelineDate) &&
                    isCalendarNavigatorActive &&
                    isSameDay(bucket.date, selectedTimelineDate as Date);

                  return (
                    <div
                      key={bucket.date.toISOString()}
                      className={`flex h-[260px] min-h-0 flex-col overflow-hidden rounded-[16px] bg-[#FAFAFA] ${
                        isFilterArrowSelectedCard
                          ? "border-2 border-[#D8CDE8]  shadow-[0_2px_8px_0_rgba(161,94,241,0.5)]"
                          : "shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      }`}
                    >
                      <div
                        className={`shrink-0 p-[10px] ${
                          isFilterArrowSelectedCard
                            ? "bg-gradient-to-r from-[#6F2DBD] to-[#8D4FD7] text-white"
                            : "border-[0.5px] border-[#E2E1E1] bg-gradient-to-r from-[#F6ECFF] to-[#FDFAFF] text-[#7135AD]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                isFilterArrowSelectedCard
                                  ? "bg-[rgba(255,255,255,0.12)]"
                                  : "bg-[rgba(113,53,173,0.08)]"
                              }`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                              >
                                <path
                                  d="M14.6641 2.75V6.41667M7.33073 2.75V6.41667M3.66406 10.0833H18.3307M10.0807 13.75H10.9974V16.5M5.4974 4.58333H16.4974C17.5099 4.58333 18.3307 5.40414 18.3307 6.41667V17.4167C18.3307 18.4292 17.5099 19.25 16.4974 19.25H5.4974C4.48487 19.25 3.66406 18.4292 3.66406 17.4167V6.41667C3.66406 5.40414 4.48487 4.58333 5.4974 4.58333Z"
                                  stroke={
                                    isFilterArrowSelectedCard
                                      ? "white"
                                      : "#7135AD"
                                  }
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <div>
                              <div
                                className={`text-[14px] font-[500] ${
                                  isFilterArrowSelectedCard
                                    ? "text-white"
                                    : "text-[#7135AD]"
                                }`}
                              >
                                {format(bucket.date, "do MMM")}
                              </div>
                              <div
                                className={`text-[13px] ${
                                  isFilterArrowSelectedCard
                                    ? "text-white/95"
                                    : "text-[#7135AD]"
                                }`}
                              >
                                {format(bucket.date, "EEEE")}
                              </div>
                            </div>
                          </div>

                          <div className="flex min-w-[100px] flex-col gap-2">
                            <div
                              className={`rounded-full px-[10px] py-[2px] text-center text-[12px] font-[500] ${
                                isFilterArrowSelectedCard
                                  ? "bg-[rgba(0,0,0,0.14)] text-white"
                                  : "bg-[#F6EDFF] text-[#7135AD]"
                              }`}
                            >
                              OS : {bucket.osCount}
                            </div>
                            <div
                              className={`rounded-full px-[10px] py-[2px] text-center text-[12px] font-[500] ${
                                isFilterArrowSelectedCard
                                  ? "bg-[rgba(0,0,0,0.14)] text-white"
                                  : "bg-[#F6EDFF] text-[#7135AD]"
                              }`}
                            >
                              Limitless : {bucket.limitlessCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-[236px] space-y-[12px] overflow-y-auto p-[12px]">
                        {bucket.bookings.length > 0 ? (
                          bucket.bookings.map((item, bookingIndex) => {
                            const bookingDate = getBookingTimelineDate(item);
                            const normalizedStatus = mapStatus(
                              String(item.status || ""),
                            ).toLowerCase();
                            const sideColor =
                              normalizedStatus === "rescheduled"
                                ? "#F59E0B"
                                : normalizedStatus === "cancelled"
                                  ? "#A3A3A3"
                                  : "#3FAE49";
                            const isCancelled =
                              normalizedStatus === "cancelled";

                            return (
                              <button
                                key={`${item._id}-${bookingIndex}`}
                                type="button"
                                onClick={() => handleViewBooking(item)}
                                className={`flex w-full flex-col gap-[12px] rounded-[14px] border-l-4 border-transparent [border-left-color:var(--timeline-accent)] p-[12px] text-left shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] transition-all duration-300 hover:border hover:border-[var(--timeline-accent)] ${
                                  isCancelled
                                    ? "bg-[#F4F4F4] opacity-75"
                                    : "bg-white"
                                }`}
                                style={{
                                  ["--timeline-accent" as string]: sideColor,
                                }}
                              >
                                <div className="flex items-center justify-between gap-3 text-[#7A7A7A]">
                                  <div className="flex items-center gap-2 text-[12px] font-[500]">
                                    <FaRegClock className="h-3.5 w-3.5" />
                                    <span>
                                      {bookingDate
                                        ? format(bookingDate, "HH:mm")
                                        : "--:--"}
                                    </span>
                                  </div>
                                  <span className="text-[13px] font-[500] underline underline-offset-2">
                                    {item.customId || item._id}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="">
                                      {getTimelineServiceIcon(
                                        item.quotationType,
                                      )}
                                    </div>
                                    <span className="text-[14px] font-[500] text-[#020202]">
                                      {getTimelineServiceLabel(
                                        item.quotationType,
                                      )}
                                    </span>
                                  </div>
                                  <span className="rounded-full bg-[#F9F9F9] px-[10px] py-[2px] text-[11px] font-[500] text-[#333333]">
                                    Hotel Transfer
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="flex h-full min-h-[7rem] items-center justify-center rounded-[20px] border border-dashed border-[#E5D7F8] bg-white/60 px-4 text-center text-[13px] text-[#8A8A8A]">
                            No bookings for this date
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

        <ChooseBookingTypeModal
          isOpen={isCreateSourceModalOpen}
          onClose={() => setIsCreateSourceModalOpen(false)}
          onSelect={handleCreateSourceSelected}
        />

        <BookingFormSidesheet
          isOpen={isSideSheetOpen}
          onClose={handleBookingComplete}
          selectedService={selectedService}
          initialData={selectedQuotation}
          bookingCode={generatedBookingCode ?? ""}
          customerCode={generatedCustomerCode ?? ""}
          vendorCode={generatedVendorCode ?? ""}
          mode={sideSheetMode}
        />
      </div>
    </div>
  );
};

export default OSBookingsPage;
