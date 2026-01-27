"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback } from "react";
import { BookingApiService } from "@/services/bookingApi";
import { CustomIdApi } from "@/services/customIdApi";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import FilterSkeleton from "@/components/skeletons/FilterSkeleton";
import SummaryCardsSkeleton from "@/components/skeletons/SummaryCardsSkeleton";
// import SummaryCardsSkeleton from "@/components/skeletons/SummaryCardsSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import SidesheetSkeleton from "@/components/skeletons/SidesheetSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import type { JSX } from "react";
import { formatServiceType } from "@/utils/helper";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { TbArrowAutofitRight } from "react-icons/tb";
import { FiCopy } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import Image from "next/image";
import AvatarTooltip from "@/components/AvatarToolTip";
import { MdOutlineDirectionsCarFilled } from "react-icons/md";
import TaskButton from "@/components/TaskButton";
import RecordPaymentSidesheet from "@/components/Sidesheets/RecordPaymentSidesheet";
import ErrorToast from "@/components/ErrorToast";
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

const SummaryCards = dynamic(() => import("@/components/SummaryCards"), {
  loading: () => <SummaryCardsSkeleton />,
  ssr: false,
});

const BookingFormSidesheet = dynamic(
  () => import("@/components/BookingFormSidesheet"),
  {
    loading: () => <SidesheetSkeleton />,
    ssr: false,
  },
);

type BookingStatus = "Confirmed" | "draft" | "Cancelled";

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
  primaryOwner?: string | string[];
  secondaryOwners?: string[];
};

// API Data Types
interface QuotationData {
  customId: string;
  _id: string;
  quotationType: string;
  channel: string;
  partyId: string;
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
    <TbArrowsUpDown className="inline w-3 h-3 text-white stroke-[1.5]" />
  ),
  Service: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
  "Booking Status": (
    <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />
  ),
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "Confirmed":
      return "px-2 py-1 text-[0.70rem] border border-green-100 font-semibold rounded-full bg-[#F0FDF4] text-[#15803D]";
    case "Draft":
      return "px-2 py-1 text-[0.70rem] border border-yellow-200 font-semibold rounded-full bg-yellow-100 text-yellow-700";
    case "Deleted":
    default:
      return "px-2 py-1 text-[0.75rem] border border-red-100 font-semibold rounded-full bg-[#FEE2E2] text-[#991B1B]";
  }
};

const FinanceBookingsPage = () => {
  // UI State
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

  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedPaymentBooking, setSelectedPaymentBooking] =
    useState<any>(null);

  // Toast state for toasts coming from sidesheets
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBgClass, setToastBgClass] = useState("bg-red-50");
  const [toastMessageColor, setToastMessageColor] = useState("text-red-600");
  const [toastBorderClass, setToastBorderClass] = useState("border-red-200");
  const [toastCloseBtnClass, setToastCloseBtnClass] = useState(
    "text-red-400 hover:text-red-600",
  );
  const [toastShowLabel, setToastShowLabel] = useState(true);

  const showError = (msg: string) => {
    setToastMessage(String(msg));
    setToastBgClass("bg-red-50");
    setToastMessageColor("text-red-600");
    setToastBorderClass("border-red-200");
    setToastCloseBtnClass("text-red-400 hover:text-red-600");
    setToastShowLabel(true);
    setToastVisible(true);
  };

  const showSuccess = (msg: string) => {
    setToastMessage(String(msg));
    setToastBgClass("bg-green-50");
    setToastMessageColor("text-green-800");
    setToastBorderClass("border-green-200");
    setToastCloseBtnClass("text-green-600 hover:text-green-800");
    setToastShowLabel(false);
    setToastVisible(true);
  };

  const { user } = useAuth();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
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
    primaryOwner: "",
    secondaryOwners: [],
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

  // Apply all filters client-side (search, booking date, travel date, owner)
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q, idx) => {
      if (filters.search.trim()) {
        const s = filters.search.toLowerCase();
        const formattedServiceType = formatServiceType(
          q.quotationType || "",
        ).toLowerCase();
        const matchesSearch =
          (q.customId || "").toLowerCase().includes(s) ||
          formattedServiceType.includes(s) ||
          (q.quotationType || "").toLowerCase().includes(s) ||
          (q.customerId?.name || "").toLowerCase().includes(s) ||
          (q.formFields.traveller1 || "").toLowerCase().includes(s);
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

      // Check if we're using advanced search (primary + secondary owners)
      const selectedPrimaryOwners: string[] = Array.isArray(
        filters.primaryOwner,
      )
        ? filters.primaryOwner
        : filters.primaryOwner
          ? [filters.primaryOwner]
          : [];
      const selectedSecondaryOwners: string[] = filters.secondaryOwners || [];

      const isAdvancedSearch =
        selectedPrimaryOwners.length > 0 || selectedSecondaryOwners.length > 0;

      if (isAdvancedSearch) {
        // Advanced search: match primary owner with primaryOwner field, secondary with secondaryOwner array
        let primaryMatch = true;
        let secondaryMatch = true;

        if (selectedPrimaryOwners.length > 0) {
          const quotationPrimaryOwner = q.primaryOwner?.name || "";
          primaryMatch = selectedPrimaryOwners.includes(quotationPrimaryOwner);
        }

        if (selectedSecondaryOwners.length > 0) {
          const quotationSecondaryOwners = Array.isArray(q.secondaryOwner)
            ? q.secondaryOwner.map((o: any) => o?.name || "").filter(Boolean)
            : [];
          // Check if all selected secondary owners are in the quotation's secondary owners
          secondaryMatch = selectedSecondaryOwners.every((selectedSecondary) =>
            quotationSecondaryOwners.includes(selectedSecondary),
          );
        }

        // Both conditions must be satisfied
        if (!primaryMatch || !secondaryMatch) {
          return false;
        }

        // Store owners for display
        const ownerArray = ([] as any[]).concat(
          q.secondaryOwner || [],
          q.primaryOwner ? [q.primaryOwner] : [],
        );
        const rowOwners: string[] = Array.isArray(ownerArray)
          ? ownerArray.map((o: any) => o?.name || "").filter(Boolean)
          : [];
        (q as any).__owners = rowOwners;
      } else {
        // Regular owner filtering: check against all owners (primary + secondary combined)
        const selectedOwners: string[] = Array.isArray(filters.owner)
          ? filters.owner
          : filters.owner
            ? [filters.owner]
            : [];

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
      }

      return true;
    });
  }, [quotations, filters]);

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
      } = {};

      if (filters.bookingStartDate)
        apiParams.bookingStartDate = filters.bookingStartDate;
      if (filters.bookingEndDate)
        apiParams.bookingEndDate = filters.bookingEndDate;
      if (filters.tripStartDate)
        apiParams.travelStartDate = filters.tripStartDate;
      if (filters.tripEndDate) apiParams.travelEndDate = filters.tripEndDate;
      // loading quotations
      // Note: Owner filtering is done client-side since API returns owner objects with names

      const response = await BookingApiService.getAllQuotations({
        ...apiParams,
        activeTab: "All",
      });

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
  ]);

  const handleServiceSelect = (service: BookingService) => {
    setSelectedQuotation(null);
    setSelectedService(service);
    setSideSheetMode("edit");
    setIsSideSheetOpen(true);
  };

  // Handle booking completion (refresh data)
  const handleBookingComplete = useCallback(async () => {
    await loadQuotations();
    setIsSideSheetOpen(false);
    setSelectedQuotation(null);
  }, [loadQuotations]);

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
      insurance: (
        <Image
          src="/icons/service-icons/insurance.svg"
          alt="Insurance"
          width={14}
          height={14}
          className="object-contain"
        />
      ),
      ticket: (
        <Image
          src="/icons/service-icons/ticket.svg"
          alt="Tickets"
          width={14}
          height={14}
          className="object-contain"
        />
      ),
      tickets: (
        <Image
          src="/icons/service-icons/ticket.svg"
          alt="Tickets"
          width={14}
          height={14}
          className="object-contain"
        />
      ),
      land: (
        <Image
          src="/icons/service-icons/land-icon.svg"
          alt="Land Transport"
          width={11}
          height={11}
          className="object-contain"
        />
      ),
      visa: (
        <Image
          src="/icons/service-icons/visa-icon-final.svg"
          alt="visa"
          width={12}
          height={12}
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

    // Only expose Edit and Delete in finance view
    return baseActions;
  };

  const formatDMY = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
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

  // Combine filtered quotations and backend drafts to show all bookings
  const finalQuotations = useMemo(() => {
    const normalizedDrafts = drafts.map(normalizeDraft);

    const combined = [...filteredQuotations, ...normalizedDrafts];

    // Deduplicate by _id when present
    const seen = new Set<string>();
    const result: any[] = [];
    for (const item of combined) {
      const id = item?._id || item?.customId || JSON.stringify(item);
      if (!seen.has(id)) {
        seen.add(id);
        result.push(item);
      }
    }

    return result;
  }, [filteredQuotations, drafts]) as any[];

  const summaryData = useMemo(() => {

    const youGiveValue = finalQuotations.reduce((sum, item) => {
      const val =
        Number(item.formFields?.costprice) || 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    const youGetValue = finalQuotations.reduce((sum, item) => {
      const val =
        Number(item.totalAmount) || Number(item.formFields?.sellingprice) || 0;
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const totalValue = Math.abs(youGiveValue - youGetValue);

    const fmt = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

    return {
      total: { amount: fmt(totalValue), change: "", isPositive: true },
      youGive: { amount: fmt(youGiveValue), change: "", isPositive: false },
      youGet: { amount: fmt(youGetValue), change: "", isPositive: true },
    };
  }, [finalQuotations]);

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
        {item.customerId?.name || item.formFields?.customer || "--"}
      </td>,
      <td
        key={`date-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center align-middle h-[3rem] cursor-pointer"
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
        className="px-4 py-3 text-center text-[14px] text-[#020202] font-normal align-middle h-[3rem] cursor-pointer"
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 flex items-center justify-center">
            {getServiceIcon(item.quotationType || "draft")}
          </div>
          <span className="text-center leading-tight">
            {formatServiceType(item.quotationType || "draft")}
          </span>
        </div>
      </td>,
      <td
        key={`status-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center align-middle text-[14px] h-[3rem] cursor-pointer"
      >
        <span className={getStatusBadgeClass(mapStatus(item.status))}>
          {mapStatus(item.status)}
        </span>
      </td>,
      <td
        key={`amount-${index}`}
        onClick={() => handleViewBooking(item)}
        className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem] cursor-pointer"
      >
        {item.totalAmount
          ? `₹ ${item.totalAmount.toLocaleString("en-IN")}`
          : item.formFields?.budget
            ? `₹ ${item.formFields.budget.toLocaleString("en-IN")}`
            : "--"}
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
              const name = item.primaryOwner.name;
              const ownerMeta = ownersList.find((o) => o.full === name) || {
                short: computeInitials(name),
                full: name,
                color: colorPalette[0] ?? "",
              };

              return (
                <div className="mr-2">
                  {" "}
                  {/* 👈 GAP AFTER PRIMARY */}
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
      <td className="px-4 py-3 text-center align-middle h-[3rem]">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
      flex items-center justify-center gap-2
      transition-all duration-200
      ${index === 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
    `}
        >
          {/* ₹ Button */}
          <button
            className="w-8 h-8 rounded-md bg-blue-100 text-blue-700
                 flex items-center justify-center hover:bg-blue-200"
            onClick={() => {
              setSelectedPaymentBooking(item);
              setIsRecordPaymentOpen(true);
            }}
          >
            ₹
          </button>

          <ActionMenu
            actions={getActionsForTab("All", item)}
            right="right-15"
          />
        </div>
      </td>,
    ]);
    return rows;
  }, [sortedQuotationsForTable, ownersList]);

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
          <ErrorToast
            visible={toastVisible}
            message={toastMessage}
            onClose={() => setToastVisible(false)}
            bgColorClass={toastBgClass}
            messageColorClass={toastMessageColor}
            borderColorClass={toastBorderClass}
            closeButtonClass={toastCloseBtnClass}
            showLabel={toastShowLabel}
          />
          {/* {!error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
            <button
              onClick={loadQuotations}
              className="ml-4 text-sm underline hover:no-underline"
              type="button"
            >
              Retry
            </button>
          </div>
        )} */}

          <Filter
            onFilterChange={handleFilterChange}
            onSearchChange={(value) => setSearchValue(value)}
            serviceTypes={filterOptions.serviceTypes}
            statuses={filterOptions.statuses}
            owners={filterOptions.owners}
            showCreateButton={false}
            totalCount={finalQuotations.length}
            showBookingType={true}
          />

          <SummaryCards data={summaryData} />

          <div className="bg-white rounded-2xl shadow mt-4 pt-5 pb-3 px-3 relative">
            {/* Header row removed: tabs and inline total moved into Filter */}
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
                  enableRowHoverActions
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
        />

        <RecordPaymentSidesheet
          isOpen={isRecordPaymentOpen}
          booking={selectedPaymentBooking}
          onClose={() => {
            setIsRecordPaymentOpen(false);
            setSelectedPaymentBooking(null);
          }}
          onError={showError}
          onSuccess={showSuccess}
        />
      </div>
    </div>
  );
};

export default FinanceBookingsPage;
