"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback } from "react";
import { BookingApiService, DraftManager } from "@/services/bookingApi";
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
import { HiArrowsUpDown } from "react-icons/hi2";
import Image from "next/image";
import AvatarTooltip from "@/components/AvatarToolTip";
import { MdOutlineDirectionsCarFilled } from "react-icons/md";
import TaskButton from "@/components/TaskButton";
import { format } from "path";

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
    <HiArrowsUpDown className="inline w-3 h-3 text-white stroke-[1.5]" />
  ),
  Service: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
  "Booking Status": (
    <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />
  ),
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "Confirmed":
      return "px-2 py-1 text-[0.70rem] border border-green-200 font-semibold rounded-full bg-green-100 text-green-700";
    case "Draft":
      return "px-2 py-1 text-[0.70rem] border border-yellow-200 font-semibold rounded-full bg-yellow-100 text-yellow-700";
    case "Deleted":
    default:
      return "px-2 py-1 text-[0.75rem] border border-red-200 font-semibold rounded-full bg-red-100 text-red-700";
  }
};

const OSBookingsPage = () => {
  // UI State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(
    null
  );
  const [selectedService, setSelectedService] = useState<BookingService | null>(
    null
  );
  const tabOptions = ["Bookings", "Drafts", "Deleted"];
  const [activeTab, setActiveTab] = useState("Bookings");

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
      const ownerArray = q.owner || [];
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
    activeTab
  ]);


  const handleServiceSelect = (service: BookingService) => {
    setSelectedQuotation(null);
    setSelectedService(service);
    setIsSideSheetOpen(true);
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
          className="object-contain"
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
      visa: "Visa",
      package: "Package", // optional: add a package icon later
    };

    return iconMap[key] || "📋"; // fallback
  };

  const mapStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      confirmed: "Confirmed",
      cancelled: "Cancelled",
    };
    return statusMap[status?.toLowerCase()] || 'Confirmed';
  };

  // Handle viewing quotation details
  const handleViewQuotation = useCallback(async (quotation: QuotationData) => {
    console.log("Viewing quotation:", quotation);
    // You can implement a modal or navigation to view quotation details
  }, []);

  console.log(quotations);

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

  const getActionsForTab = (tab: string, row: any) => {
    const id = row.isReal
      ? quotations?.[row.originalIndex]?._id
      : finalQuotations[row.originalIndex]?.id;

    const baseActions = [
      {
        label: "Edit",
        icon: <MdOutlineEdit />,
        color: "text-blue-600",
        onClick: () => { setIsSideSheetOpen(true); setSelectedQuotation(row); },
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
        onClick: () => console.log("Duplicate", row.id),
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
      onClick: () => console.log("Duplicate", row.id),
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
      console.log('Inside Drafts')
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
    console.log('Outside Drafts', filteredQuotations);

    // Filter quotations by status based on active tab
    return filteredQuotations.filter((q) => {
      console.log(q, "STATUS:", q.serviceStatus);
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
    // const combinedData = [
    //   // Real quotations from API
    //   ...quotations.map((item, index) => ({
    //     id: item.customId ? `${item.customId}` : `Draft-${index + 1}`,
    //     leadPax: item.customerId?.name || item.formFields?.customer || "--",
    //     travelDate: item.travelDate
    //       ? formatDMY(item.travelDate)
    //       : item.formFields?.departureDate
    //       ? formatDMY(item.formFields.departureDate)
    //       : item.createdAt
    //       ? formatDMY(item.createdAt)
    //       : "--",
    //     service: (
    //       <div className="flex items-center justify-center gap-2">
    //         <div className="w-5 h-5 flex items-center justify-center">
    //           {getServiceIcon(
    //             item.quotationType || item.serviceType || "draft"
    //           )}
    //         </div>
    //         <span className="text-center leading-tight">
    //           {formatServiceType(
    //             item.quotationType || item.serviceType || "draft"
    //           )}
    //         </span>
    //       </div>
    //     ),

    //     bookingStatus: mapStatus(item.serviceStatus, item.isDeleted),

    //     amount: item.totalAmount
    //       ? `₹ ${item.totalAmount.toLocaleString("en-IN")}`
    //       : item.formFields?.budget
    //       ? `₹ ${item.formFields.budget.toLocaleString("en-IN")}`
    //       : "--",

    //     ownerNames: Array.isArray((item as any).owner)
    //       ? (item as any).owner.map((o: any) => o?.name || "--")
    //       : [],

    //     tasks: Math.floor(Math.random() * 5) + 1, // Random tasks for demo
    //     isReal: Boolean(item._id),
    //     originalIndex: index,
    //   })),
    // ];

    const rows = filteredQuotations.map((item, index) => [
      <td
        key={`id-${index}`}
        className="px-4 py-2 text-center font-semibold align-middle h-[4rem]"
      >
        {item.customId ? `${item.customId}` : `${item._id}`}
      </td>,
      <td
        key={`lead-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        {item.customerId?.name || item.formFields?.customer || "--"}
      </td>,
      <td
        key={`date-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
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
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center">
              {getServiceIcon(
                item.quotationType || item.serviceType || "draft"
              )}
            </div>
            <span className="text-center leading-tight">
              {formatServiceType(
                item.quotationType || item.serviceType || "draft"
              )}
            </span>
          </div>
      </td>,
      <td
        key={`status-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        <span className={getStatusBadgeClass(mapStatus(item.status))}>
          {mapStatus(item.status)}
        </span>
      </td>,
      <td
        key={`amount-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        {item.totalAmount
          ? `₹ ${item.totalAmount.toLocaleString("en-IN")}`
          : item.formFields?.budget
          ? `₹ ${item.formFields.budget.toLocaleString("en-IN")}`
          : "--"}
      </td>,
      <td
        key={`owners-${index}`}
        className="px-4 py-2 text-center align-middle h-[2.5rem]"
      >
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            {(Array.isArray((item as any).owner)
          ? (item as any).owner.map((o: any) => o?.name || "--")
          : []).map((ownerName: string, i: number) => {
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
        className="px-4 py-2 text-center align-middle h-[2.5rem]"
      >
        <div className="flex justify-center">
          <TaskButton
            count={0}
            bookingId={item._id}
          />
        </div>
      </td>,

      // ACTIONS COLUMN
      <td
        key={`actions-${index}`}
        className="px-4 py-2  text-center align-middle h-[4rem]"
      >
        <ActionMenu actions={getActionsForTab(activeTab, item)} />
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
          />

          <div className="bg-white rounded-2xl shadow mt-4 pt-4 pb-3 px-3 relative">
            {/* Tabs and Total Count Row */}
            <div className="flex w-full justify-between items-center mb-2">
              <div className="flex w-[25rem] ml-2 items-center bg-[#F3F3F3] rounded-2xl relative p-1">
                {/* Sliding background indicator */}
                <div
                  className="absolute h-[calc(100%-0.5rem)] bg-[#0D4B37] rounded-xl shadow-sm transition-all duration-300 ease-in-out top-1"
                  style={{
                    width: `calc((100% - 0.5rem) / ${tabOptions.length})`,
                    left: `calc(${
                      tabOptions.indexOf(activeTab) * (100 / tabOptions.length)
                    }% + 0.25rem)`,
                  }}
                />
                {tabOptions.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative z-10 px-3 py-1.5 rounded-xl text-[0.85rem] font-medium transition-colors duration-300 flex-1 ${
                      activeTab === tab
                        ? "text-white"
                        : "text-[#818181] hover:text-gray-900"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
                <span className="text-gray-600 text-[0.85rem] font-medium">
                  Total
                </span>
                <span className="bg-gray-100 text-black font-semibold text-[0.85rem] px-2 mr-1 rounded-lg shadow-sm">
                  {filteredQuotations.length}
                </span>
              </div>
            </div>
            <div className="p-2">
              {isLoading ? (
                <TableSkeleton />
              ) : (
                <Table
                  data={tableData}
                  columns={columns}
                  columnIconMap={columnIconMap}
                  onSort={handleSort}
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
          />
        )}
      </div>
    </div>
  );
};

export default OSBookingsPage;
