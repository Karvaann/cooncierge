"use client";

import dynamic from "next/dynamic";
import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { BookingApiService, DraftManager } from "@/services/bookingApi";
import { CustomIdApi } from "@/services/customIdApi";
import type { DraftBooking } from "@/services/bookingApi";
import apiClient from "@/services/apiClient";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import FilterSkeleton from "@/components/skeletons/FilterSkeleton";
// import SummaryCardsSkeleton from "@/components/skeletons/SummaryCardsSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ModalSkeleton from "@/components/skeletons/ModalSkeleton";
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
import { useAuth } from "@/context/AuthContext";

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

const BookingFormModal = dynamic(
  () => import("@/components/BookingFormModal"),
  {
    loading: () => <ModalSkeleton />,
    ssr: false,
  }
);

const BookingFormSidesheet = dynamic(
  () => import("@/components/BookingFormSidesheet"),
  {
    loading: () => <SidesheetSkeleton />,
    ssr: false,
  }
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

const OSBookingsPage = () => {
  // UI State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [generatedBookingCode, setGeneratedBookingCode] = useState<
    string | null
  >(null);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<BookingService | null>(
    null
  );
  const [generatedCustomerCode, setGeneratedCustomerCode] = useState<
    string | null
  >(null);
  const [generatedVendorCode, setGeneratedVendorCode] = useState<string | null>(
    null
  );

  const {user} = useAuth();

  let tabOptions;

  if (user.isBookingMaker) {
    tabOptions = ["Approved", "Pending", "Deleted", "Drafts", "Deleted"];
  } else {
    tabOptions = ["Bookings", "Drafts", "Deleted"];
  }


  const [activeTab, setActiveTab] = useState("Bookings");

  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const update = () => {
      const container = tabContainerRef.current;
      if (!container) return;
      const activeBtn = container.querySelector(
        `[data-tab="${activeTab}"]`
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
  });

  // Data State
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const [reverse, setReverse] = useState(false);
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
      const ownerArray = [...q.secondaryOwner, q.primaryOwner] || [];
      if (Array.isArray(ownerArray)) {
        ownerArray.forEach((o: any) => {
          if (o?.name) uniqueOwnerNames.add(o.name);
        });
      }
    });

    const list: Owner[] = Array.from(uniqueOwnerNames).map((name, idx) => ({
      short: computeInitials(name),
      full: name,
      color: colorPalette[idx % colorPalette.length] as string,
    }));

    setOwnersList(list);
  }, [quotations]);

  const handleSort = (column: string) => {
    if (column === "Travel Date") {
      setReverse((prev) => !prev);
    }
  };

  // Helper for date range checks
  const isWithinRange = (
    rawDate: string | undefined,
    start: string,
    end: string
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
        const formattedServiceType = formatServiceType(
          q.quotationType || ""
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
            filters.bookingEndDate
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
            filters.tripEndDate
          )
        )
          return false;
      }

      // Extract owner names from the API response (owner is an array of objects with name property)
      const ownerArray = (q as any).owner || [];
      const rowOwners: string[] = Array.isArray(ownerArray)
        ? ownerArray.map((o: any) => o?.name || "").filter(Boolean)
        : [];

      (q as any).__owners = rowOwners;

      // Filter by selected owners if any are selected
      if (selectedOwners.length) {
        const intersects = rowOwners.some((ownerName) =>
          selectedOwners.includes(ownerName)
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
      } = {};

      if (filters.bookingStartDate)
        apiParams.bookingStartDate = filters.bookingStartDate;
      if (filters.bookingEndDate)
        apiParams.bookingEndDate = filters.bookingEndDate;
      if (filters.tripStartDate)
        apiParams.travelStartDate = filters.tripStartDate;
      if (filters.tripEndDate) apiParams.travelEndDate = filters.tripEndDate;
      apiParams.activeTab = activeTab;
      // Note: Owner filtering is done client-side since API returns owner objects with names

      const response = await BookingApiService.getAllQuotations(
        Object.keys(apiParams).length ? apiParams : undefined
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
    setIsSideSheetOpen(true);
  };

  // When user requests create from Filter, generate custom id first then open create modal
  const handleCreateRequested = async () => {
    try {
      // simple guard against rapid duplicate calls
      const now = Date.now();
      const last = (window as any).__lastBookingCodeRequestAt || 0;
      const IGNORE_MS = 1200;
      if (now - last < IGNORE_MS) {
        setIsCreateOpen(true);
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
    } finally {
      setIsCreateOpen(true);
    }
  };

  // Handle booking completion (refresh data)
  const handleBookingComplete = useCallback(async () => {
    await loadQuotations();
    setIsSideSheetOpen(false);
    setSelectedQuotation(null);
  }, [loadQuotations, activeTab]);

  const getServiceIcon = (
    quotationType: string
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
      const response = await BookingApiService.deleteQuotation(
        selectedDeleteId
      );

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

  // Filter quotations based on active tab and status
  const finalQuotations = useMemo(() => {
    // Drafts tab shows drafts from backend with search filtering
    if (activeTab === "Drafts") {
      const normalizedDrafts = drafts.map(normalizeDraft);

      // Apply search filter to drafts
      if (filters.search.trim()) {
        const s = filters.search.toLowerCase();
        return normalizedDrafts.filter((draft: any, index: number) => {
          const formattedServiceType = formatServiceType(
            draft.quotationType || ""
          ).toLowerCase();
          const draftId = draft.customId || `Draft-${index + 1}`;
          const customerName =
            draft.customerId?.name || draft.formFields?.customer || "";

          return (
            draftId.toLowerCase().includes(s) ||
            formattedServiceType.includes(s) ||
            (draft.quotationType || "").toLowerCase().includes(s) ||
            customerName.toLowerCase().includes(s)
          );
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
  }, [activeTab, filteredQuotations]) as any[];

  // Convert quotations to table data
  const tableData = useMemo<JSX.Element[][]>(() => {
    const rows = filteredQuotations.map((item, index) => [
      <td
        key={`id-${index}`}
        className="px-4 py-3 text-center text-[#020202]  font-medium align-middle h-[3rem]"
      >
        {item.customId ? `${item.customId}` : `${item._id}`}
      </td>,
      <td
        key={`lead-${index}`}
        className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
      >
        {item.customerId?.name || item.formFields?.customer || "--"}
      </td>,
      <td
        key={`date-${index}`}
        className="px-4 py-3 text-center align-middle h-[3rem]"
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
        className="px-4 py-3 text-center text-[14px] text-[#020202] font-normal align-middle h-[3rem]"
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
        className="px-4 py-3 text-center align-middle text-[14px] h-[3rem]"
      >
        <span className={getStatusBadgeClass(mapStatus(item.status))}>
          {mapStatus(item.status)}
        </span>
      </td>,
      <td
        key={`amount-${index}`}
        className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
      >
        {item.totalAmount
          ? `₹ ${item.totalAmount.toLocaleString("en-IN")}`
          : item.formFields?.budget
          ? `₹ ${item.formFields.budget.toLocaleString("en-IN")}`
          : "--"}
      </td>,
      <td
        key={`owners-${index}`}
        className="px-4 py-3 text-center align-middle h-[3rem]"
      >
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            {(Array.isArray([...(item as any).secondaryOwner, (item as any).primaryOwner])
              ? [...(item as any).secondaryOwner, (item as any).primaryOwner].map((o: any) => o?.name || "--")
              : []
            ).map((ownerName: string, i: number) => {
              // Try to find owner in ownersList (fetched from API)
              let ownerMeta = ownersList.find((o) => o.full === ownerName);

              // If not found (e.g., for drafts), create a temporary owner object
              if (!ownerMeta && ownerName && ownerName !== "--") {
                ownerMeta = {
                  short: computeInitials(ownerName),
                  full: ownerName,
                  color: (colorPalette[i % colorPalette.length] ||
                    colorPalette[0]) as string,
                };
              }

              if (!ownerMeta) return null;

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
        <div className="flex justify-center">
          <TaskButton count={0} bookingId={item._id} />
        </div>
      </td>,

      // ACTIONS COLUMN
      <td
        key={`actions-${index}`}
        className="px-4 py-3 text-center align-middle h-[3rem]"
      >
        <ActionMenu
          actions={getActionsForTab(activeTab, item)}
          right="right-15"
        />
      </td>,
    ]);
    return reverse ? rows.reverse() : rows;
  }, [finalQuotations, drafts, activeTab, reverse]);

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
    [ownersList]
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
            createOpen={isCreateOpen}
            setCreateOpen={setIsCreateOpen}
            onCreateClick={handleCreateRequested}
          />

          <div className="bg-white rounded-2xl shadow mt-4 pt-5 pb-3 px-3 relative">
            {/* Tabs and Total Count Row */}
            <div className="flex w-full justify-between items-center mb-2">
              <div
                ref={tabContainerRef}
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

        {isCreateOpen && (
          <BookingFormModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSelectedService={handleServiceSelect}
          />
        )}

        {isSideSheetOpen && (
          <BookingFormSidesheet
            key={selectedQuotation?._id || "create"}
            isOpen={isSideSheetOpen}
            onClose={handleBookingComplete}
            selectedService={selectedService}
            initialData={selectedQuotation}
            bookingCode={generatedBookingCode ?? ""}
            customerCode={generatedCustomerCode ?? ""}
            vendorCode={generatedVendorCode ?? ""}
          />
        )}
      </div>
    </div>
  );
};

export default OSBookingsPage;
