"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback } from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
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
import { MdOutlineEdit } from "react-icons/md";
import { TbArrowAutofitRight } from "react-icons/tb";
import { FiCopy } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import { FaRegClock } from "react-icons/fa";
import Image from "next/image";
import AvatarTooltip from "@/components/AvatarToolTip";
import TaskButton from "@/components/TaskButton";
import TableTabs from "@/components/TableTabs";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LuPlane, LuHotel, LuTicket } from "react-icons/lu";
import { PiCarProfileLight } from "react-icons/pi";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { MdOutlineTravelExplore } from "react-icons/md";
import {
  getNextTriSortState,
  type TriSortState,
  getItemTimestamp,
} from "@/utils/sorting";
import UnderlineTabs from "@/components/UnderlineTabs";
import Toggle from "@/components/Toggle";

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
  serviceType: string;
  status: string;
  owner: string | string[];
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
  id: string;
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
    <TbArrowsUpDown className="inline w-3 h-3 text-[#818181] hover:text-green-600 stroke-[2]" />
  ),
  Service: (
    <CiFilter className="inline w-3 h-3 text-[#818181] hover:text-green-600  stroke-[2]" />
  ),
  "Booking Status": (
    <CiFilter className="inline w-3 h-3 text-[#818181] hover:text-green-600  stroke-[2]" />
  ),
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "Confirmed":
      return "px-2 py-1 text-[12px] border border-[#DCFCE7] font-[500] rounded-full bg-[#F0FDF4] text-[#15803D]";
    case "Draft":
      return "px-2 py-1 text-[12px] border border-[#FEF9C3] font-[500] rounded-full bg-[#FEF9C3] text-[#854D0E]";
    case "Deleted":
    default:
      return "px-2 py-1 text-[12px] border border-[#FEE2E2] font-[500] rounded-full bg-[#FFF5F5] text-[#991B1B]";
  }
};

const OSBookingsPage = () => {
  const router = useRouter();
  // UI State
  const [isCreateSourceModalOpen, setIsCreateSourceModalOpen] = useState(false);
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

  const tabOptions = useMemo(
    () =>
      isBookingMaker
        ? ["Approved", "Pending", "Drafts", "Denied", "Deleted"]
        : ["Bookings", "Drafts", "Deleted"],
    [isBookingMaker],
  );

  const [bookingSourceTab, setBookingSourceTab] = useState("My Bookings");
  const [activeTab, setActiveTab] = useState("Bookings");

  useEffect(() => {
    // If auth resolves later and user is a booking maker, default to Approved.
    if (isBookingMaker && activeTab === "Bookings") {
      setActiveTab("Approved");
    }
  }, [isBookingMaker, activeTab]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [hoveredBookingRowId, setHoveredBookingRowId] = useState<string | null>(
    null,
  );
  const [calendarStartDate, setCalendarStartDate] = useState(() =>
    startOfDay(new Date()),
  );
  // Toggle whether incomplete bookings should be shown in the table
  const [showIncomplete, setShowIncomplete] = useState(false);
  // Filters state
  const [filters, setFilters] = useState<FilterPayload>({
    serviceType: "",
    status: "",
    owner: "",
    search: "",
    searchBy: "customerId",
    bookingStartDate: "",
    bookingEndDate: "",
    tripStartDate: "",
    tripEndDate: "",
    bookingType: "os",
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
      if (filters.search.trim()) {
        const s = filters.search.toLowerCase();
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
        const matchesSearch =
          filters.searchBy === "customerName"
            ? (q.customerId?.name || q.formFields.customer || "")
                .toLowerCase()
                .includes(s)
            : filters.searchBy === "owner"
              ? ownerNames.includes(s)
              : (q.customerId?._id || "").toLowerCase().includes(s);
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

      // If "Show Incomplete" is off, hide incomplete bookings
      const isComplete =
        q?.isBookingDataComplete === true ||
        q?.isBookingDataComplete === "true";
      if (!showIncomplete && !isComplete) return false;

      return true;
    });
  }, [quotations, filters, selectedOwners, showIncomplete]);

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

  // Generate booking / customer / vendor IDs
  const handleOSCreateRequested = async () => {
    try {
      const now = Date.now();
      const last = (window as any).__lastBookingCodeRequestAt || 0;
      const IGNORE_MS = 1200;
      if (now - last < IGNORE_MS) return;
      (window as any).__lastBookingCodeRequestAt = now;

      const [bookingResp, customerResp, vendorResp] = await Promise.all([
        CustomIdApi.generate("booking"),
        CustomIdApi.generate("customer"),
        CustomIdApi.generate("vendor"),
      ]);
      setGeneratedBookingCode(bookingResp?.customId || null);
      setGeneratedCustomerCode(customerResp?.customId || null);
      setGeneratedVendorCode(vendorResp?.customId || null);
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

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      confirmed: "Confirmed",
      cancelled: "Cancelled",
    };
    return statusMap[status?.toLowerCase()] || "Confirmed";
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
      // show in view mode so fields remain disabled and user can only Save
      setSideSheetMode("view");
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
        const s = filters.search.toLowerCase();
        return normalizedDrafts.filter((draft: any) => {
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
          const customerName = (
            draft.customerId?.name ||
            draft.formFields?.customer ||
            ""
          ).toLowerCase();

          if (filters.searchBy === "customerName")
            return customerName.includes(s);
          if (filters.searchBy === "owner") return ownerNames.includes(s);
          return (draft.customerId?._id || "").toLowerCase().includes(s);
        });
      }

      return normalizedDrafts;
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

  const sortedQuotationsForTable = useMemo(() => {
    if (sortState.key !== "Travel Date" || sortState.direction === "none") {
      return filteredQuotations;
    }

    // Stable sort: keep original order for ties.
    const withIndex = filteredQuotations.map((item, originalIndex) => ({
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
  }, [filteredQuotations, sortState.direction, sortState.key]);

  // Convert quotations to table data
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
              {item.customId || item._id}
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
        {item.adultTravelers?.[0]?.name ||
          item.customerId?.name ||
          item.formFields?.customer ||
          "--"}
      </td>,
      <td
        key={`date-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 fade-content py-3 text-center  text-[13px] font-[400] align-middle h-[3rem] cursor-pointer"
      >
        {item.travelDate
          ? formatDMY(item.travelDate)
          : item.formFields?.departureDate
            ? formatDMY(item.formFields.departureDate)
            : item.createdAt
              ? formatDMY(item.createdAt)
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
        {item.totalAmount
          ? `${getStoredCurrencySymbol()} ${formatNumberByStoredCurrency(item.totalAmount)}`
          : item.formFields?.budget
            ? `${getStoredCurrencySymbol()} ${formatNumberByStoredCurrency(item.formFields.budget)}`
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
        className="px-4 py-3 text-center fade-content align-middle h-[3rem]"
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
  }, [
    sortedQuotationsForTable,
    ownersList,
    activeTab,
    hoveredBookingRowId,
    openBookingInEditMode,
  ]);

  const rowClassNameResolver = useCallback(
    (rowIndex: number) => {
      const item = sortedQuotationsForTable[rowIndex];
      if (!item) return "";
      const itemId = String(item?._id || item?.id || "");

      const isBookingDataComplete =
        item?.isBookingDataComplete === true ||
        item?.isBookingDataComplete === "true";

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

  const filterOptions = useMemo(
    () => ({
      serviceTypes: [
        { value: "flight", label: "✈️ Flight" },
        { value: "hotel", label: "🏨 Hotel" },
        { value: "car", label: "🚗 Car Rental" },
        { value: "package", label: "🎫 Package" },
      ],
      statuses: [
        { value: "successful", label: "Successful" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
      ],
      owners: ownersList.map((o) => ({ value: o.full, label: o.full })),
    }),
    [ownersList],
  );

  const handleFilterChange = (next: FilterPayload) => {
    setFilters(next);
    setSearchValue(next.search);
  };

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

  const timelineBuckets = useMemo(
    () =>
      timelineDates.map((date) => {
        const bookings = filteredQuotations
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
    [filteredQuotations, getBookingTimelineDate, timelineDates],
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
              className="text-white text-[14px] font-[500] bg-[#7135AD] rounded-[14px] px-[14px] py-[7px]"
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
            searchOptions={[
              {
                value: "customerId",
                label: "Customer ID",
                placeholder: "Search by Customer ID",
              },
              {
                value: "customerName",
                label: "Customer Name",
                placeholder: "Search by Customer Name",
              },
              {
                value: "owner",
                label: "Owner",
                placeholder: "Search by Owner",
              },
            ]}
            createOpen={isCreateOpen}
            setCreateOpen={setIsCreateOpen}
            onCreateClick={handleCreateRequested}
            allowAdvanceOwnerSearch={true}
            showBookingType={true}
          />

          {bookingSourceTab === "My Bookings" ? (
            <div className="relative mt-4 flex min-h-0 flex-1 flex-col rounded-2xl border border-[#E5E7EB] pt-1.5 bg-white">
              <div className="relative">
                <UnderlineTabs
                  tabs={tabOptions}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  totalCount={filteredQuotations.length}
                  className="w-full"
                />

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[13px] text-[#414141]">
                    <Toggle
                      checked={showIncomplete}
                      onChange={(v: boolean) => setShowIncomplete(v)}
                      checkedBg="#7135AD"
                      uncheckedBg="#E5E7EB"
                    />

                    <span className="whitespace-nowrap text-[#414141] font-[400] text-[13px]">
                      Show Incomplete Bookings
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="rounded-full text-[13px] border border-[#7135AD66] px-4 py-1.5 text-[#7135AD] font-[500]">
                      <span className="text-[#414141] font-[500]">Total </span>{" "}
                      : {filteredQuotations.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex-1 min-h-0 overflow-auto px-5 py-[4px]">
                {isLoading ? (
                  <TableSkeleton />
                ) : (
                  <Table
                    data={tableData}
                    columns={columns}
                    columnIconMap={columnIconMap}
                    columnWidthClassMap={{
                      "Booking ID": "w-[8rem]",
                      Tasks: "w-[7.5rem]",
                      Actions: "w-[7.5rem]",
                    }}
                    onSort={handleSort}
                    categoryName="Bookings"
                    headerAlign={{ "Booking ID": "center" }}
                    rowClassNameResolver={rowClassNameResolver}
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
                <div className="flex items-center gap-[10px]">
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
                  return (
                    <div
                      key={bucket.date.toISOString()}
                      className="flex h-[260px] min-h-0 flex-col overflow-hidden rounded-[16px] bg-[#FAFAFA] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    >
                      <div className="shrink-0 border-[0.5px] border-[#E2E1E1] bg-gradient-to-r from-[#F6ECFF] to-[#FDFAFF]  p-[10px] text-[#7135AD]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <path
                                d="M14.6641 2.75V6.41667M7.33073 2.75V6.41667M3.66406 10.0833H18.3307M10.0807 13.75H10.9974V16.5M5.4974 4.58333H16.4974C17.5099 4.58333 18.3307 5.40414 18.3307 6.41667V17.4167C18.3307 18.4292 17.5099 19.25 16.4974 19.25H5.4974C4.48487 19.25 3.66406 18.4292 3.66406 17.4167V6.41667C3.66406 5.40414 4.48487 4.58333 5.4974 4.58333Z"
                                stroke="#7135AD"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                            <div>
                              <div className="text-[14px] font-[500]">
                                {format(bucket.date, "do MMM")}
                              </div>
                              <div className="text-[13px]">
                                {format(bucket.date, "EEEE")}
                              </div>
                            </div>
                          </div>

                          <div className="flex min-w-[100px] flex-col gap-2">
                            <div className="rounded-full bg-[#F6EDFF] px-[10px] py-[2px] text-center text-[12px] font-[500] text-[#7135AD]">
                              OS : {bucket.osCount}
                            </div>
                            <div className="rounded-full bg-[#F6EDFF] px-[10px] py-[2px] text-center text-[12px] font-[500] text-[#7135AD]">
                              Limitless : {bucket.limitlessCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-[236px] space-y-[12px] overflow-y-auto p-[12px]">
                        {bucket.bookings.length > 0 ? (
                          bucket.bookings.map((item, bookingIndex) => {
                            const bookingDate = getBookingTimelineDate(item);
                            const sideColor =
                              bookingIndex % 3 === 1
                                ? "#F59E0B"
                                : bookingIndex % 3 === 2
                                  ? "#A78BFA"
                                  : "#3FAE49";

                            return (
                              <button
                                key={`${item._id}-${bookingIndex}`}
                                type="button"
                                onClick={() => handleViewBooking(item)}
                                className="flex w-full flex-col gap-[12px] rounded-[14px] border-l-4 border-transparent [border-left-color:var(--timeline-accent)] bg-white p-[12px] text-left shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] transition-all duration-300 hover:border hover:border-[var(--timeline-accent)]"
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

        <BookingFormModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSelectedService={handleServiceSelect}
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
