"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback } from "react";
import { BookingApiService, DraftManager } from "@/services/bookingApi";
import type { DraftBooking } from "@/services/bookingApi";
import { getAuthUser } from "@/services/storage/authStorage";
import FilterSkeleton from "@/components/skeletons/FilterSkeleton";
import SummaryCardsSkeleton from "@/components/skeletons/SummaryCardsSkeleton";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ModalSkeleton from "@/components/skeletons/ModalSkeleton";
import SidesheetSkeleton from "@/components/skeletons/SidesheetSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import type { JSX } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { TbArrowAutofitRight } from "react-icons/tb";
import { FiCopy } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { HiArrowsUpDown } from "react-icons/hi2";
import Image from "next/image";

const Filter = dynamic(() => import("@/components/Filter"), {
  loading: () => <FilterSkeleton />,
  ssr: false,
});

const SummaryCards = dynamic(() => import("@/components/SummaryCards"), {
  loading: () => <SummaryCardsSkeleton />,
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
  }
);

const BookingFormSidesheet = dynamic(
  () => import("@/components/BookingFormSidesheet"),
  {
    loading: () => <SidesheetSkeleton />,
    ssr: false,
  }
);

type BookingStatus =
  | "Successful"
  | "Pending"
  | "Failed"
  | "confirmed"
  | "draft"
  | "cancelled";

type BookingRow = {
  id: string;
  leadPax: string;
  travelDate: string;
  service: string;
  bookingStatus: BookingStatus;
  amount: string;
  voucher: string;
  tasks: number;
  isReal?: boolean;
  originalIndex?: number;
};

type BookingService = {
  id: string;
  title: string;
  image: string;
  category: "travel" | "accommodation" | "transport" | "activity";
  description?: string;
};

type FilterPayload = {
  serviceType: string;
  status: string;
  owner: string;
  search: string;
  bookingStartDate: string;
  bookingEndDate: string;
  tripStartDate: string;
  tripEndDate: string;
};

// API Data Types
interface QuotationData {
  _id: string;
  quotationType: string;
  channel: string;
  partyId: string;
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

interface SummaryData {
  total: {
    amount: string;
    change: string;
    isPositive: boolean;
  };
  youGive: {
    amount: string;
    change: string;
    isPositive: boolean;
  };
  youGet: {
    amount: string;
    change: string;
    isPositive: boolean;
  };
}

const columns: string[] = [
  "#ID",
  "Lead Pax",
  "Travel Date",
  "Service",
  "Booking Status",
  "Amount",
  "Voucher",
  "Tasks",
  "Actions",
];

const columnIconMap: Record<string, JSX.Element> = {
  "Travel Date": (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold" />
  ),
  Service: <CiFilter className="inline w-3 h-3 text-white font-semibold" />,
  "Booking Status": (
    <CiFilter className="inline w-3 h-3 text-white font-semibold" />
  ),
};

const tableSeed: BookingRow[] = [
  {
    id: "#001",
    leadPax: "Anand Mishra",
    travelDate: "12-09-2025",
    service: "✈️ Flight",
    bookingStatus: "Successful",
    amount: "₹ 24,580",
    voucher: "📄",
    tasks: 3,
  },
  {
    id: "#002",
    leadPax: "Priya Sharma",
    travelDate: "15-09-2025",
    service: "🏨 Hotel",
    bookingStatus: "Pending",
    amount: "₹ 18,200",
    voucher: "📄",
    tasks: 2,
  },
  {
    id: "#003",
    leadPax: "Rajesh Kumar",
    travelDate: "20-09-2025",
    service: "🚗 Car Rental",
    bookingStatus: "Successful",
    amount: "₹ 12,500",
    voucher: "📄",
    tasks: 1,
  },
  {
    id: "#004",
    leadPax: "Sneha Patel",
    travelDate: "25-09-2025",
    service: "🎫 Package",
    bookingStatus: "Failed",
    amount: "₹ 45,000",
    voucher: "📄",
    tasks: 5,
  },
  {
    id: "#005",
    leadPax: "Vikram Singh",
    travelDate: "30-09-2025",
    service: "✈️ Flight",
    bookingStatus: "Successful",
    amount: "₹ 32,100",
    voucher: "📄",
    tasks: 2,
  },
];

const getStatusBadgeClass = (status: BookingStatus): string => {
  switch (status) {
    case "Successful":
      return "px-2 py-1 text-xs rounded-full bg-green-100 text-green-700";
    case "Pending":
      return "px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700";
    case "Failed":
    default:
      return "px-2 py-1 text-xs rounded-full bg-red-100 text-red-700";
  }
};

const OSBookingsPage = () => {
  // UI State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<BookingService | null>(
    null
  );
  const tabOptions = ["Approved", "Pending", "Drafts", "Denied", "Deleted"];
  const [activeTab, setActiveTab] = useState("Approved");

  // Data State
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [drafts, setDrafts] = useState<DraftBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  // Load quotations from backend
  const loadQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await BookingApiService.getAllQuotations();

      if (response.success && response.data) {
        setQuotations(response.data?.quotations || response.data);
        calculateSummaryData(response.data?.quotations);
      } else {
        throw new Error(response.message || "Failed to load quotations");
      }
    } catch (err) {
      console.error("Error loading quotations:", err);
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load drafts from localStorage
  const loadDrafts = useCallback(async () => {
    try {
      const response = await BookingApiService.getDrafts();
      if (response.success && response.data) {
        setDrafts(response.data);
      }
    } catch (err) {
      console.error("Error loading drafts:", err);
    }
  }, []);

  // Calculate summary data from quotations
  const calculateSummaryData = useCallback((quotationData: QuotationData[]) => {
    const total = quotationData.reduce(
      (sum, q) => sum + (q.totalAmount || 0),
      0
    );
    const confirmed = quotationData.filter((q) => q.status === "confirmed");
    const pending = quotationData.filter(
      (q) => q.status === "draft" || q.status === "pending"
    );

    const confirmedAmount = confirmed.reduce(
      (sum, q) => sum + (q.totalAmount || 0),
      0
    );
    const pendingAmount = pending.reduce(
      (sum, q) => sum + (q.totalAmount || 0),
      0
    );

    setSummaryData({
      total: {
        amount: `₹ ${total.toLocaleString("en-IN")}`,
        change: `${quotationData.length} total bookings`,
        isPositive: true,
      },
      youGive: {
        amount: `₹ ${pendingAmount.toLocaleString("en-IN")}`,
        change: `${pending.length} pending bookings`,
        isPositive: false,
      },
      youGet: {
        amount: `₹ ${confirmedAmount.toLocaleString("en-IN")}`,
        change: `${confirmed.length} confirmed bookings`,
        isPositive: true,
      },
    });
  }, []);

  // Sync drafts with backend
  const syncDrafts = useCallback(async () => {
    try {
      await BookingApiService.syncDraftsWithBackend();
      await loadDrafts(); // Reload drafts after sync
    } catch (err) {
      console.error("Error syncing drafts:", err);
    }
  }, [loadDrafts]);

  // Load data on component mount
  useEffect(() => {
    loadQuotations();
    loadDrafts();
    syncDrafts();
  }, [loadQuotations, loadDrafts, syncDrafts]);

  const handleServiceSelect = (service: BookingService) => {
    setSelectedService(service);
    setIsSideSheetOpen(true);
  };

  // Handle booking completion (refresh data)
  const handleBookingComplete = useCallback(async () => {
    await loadQuotations();
    await loadDrafts();
    setIsSideSheetOpen(false);
  }, [loadQuotations, loadDrafts]);

  const getServiceIcon = (quotationType: string): string => {
    const iconMap: Record<string, string> = {
      flight: "✈️",
      flights: "✈️",
      hotel: "🏨",
      accommodation: "🏨",
      car: "🚗",
      transportation: "🚗",
      package: "🎫",
      activity: "🎯",
      insurance: "🛡️",
      visa: "📋",
    };
    return iconMap[quotationType?.toLowerCase()] || "📋";
  };

  const mapStatus = (status: string): BookingStatus => {
    const statusMap: Record<string, BookingStatus> = {
      confirmed: "Successful",
      draft: "Pending",
      pending: "Pending",
      cancelled: "Failed",
    };
    return statusMap[status?.toLowerCase()] || "Pending";
  };

  // Handle viewing quotation details
  const handleViewQuotation = useCallback(async (quotation: QuotationData) => {
    console.log("Viewing quotation:", quotation);
    // You can implement a modal or navigation to view quotation details
  }, []);

  console.log(quotations);

  // Convert quotations to table data
  const tableData = useMemo<JSX.Element[][]>(() => {
    const combinedData = [
      // Real quotations from API
      ...quotations.map((quotation, index) => ({
        id: `#${quotation._id}`,
        leadPax:
          quotation.formFields?.customer ||
          quotation.formFields?.traveller1 ||
          "Unknown",
        travelDate:
          quotation.formFields?.departureDate ||
          new Date(quotation.createdAt).toLocaleDateString("en-GB"),
        service:
          getServiceIcon(quotation.quotationType) +
          " " +
          quotation.quotationType,
        bookingStatus: mapStatus(quotation.status),
        amount: `₹ ${quotation.totalAmount?.toLocaleString("en-IN") || "0"}`,
        voucher: (
          <Image
            src="/icons/voucher-icon.svg"
            alt="voucher"
            width={17}
            height={17}
            className="cursor-pointer"
          />
        ),
        tasks: Math.floor(Math.random() * 5) + 1, // Random tasks for demo
        isReal: true,
        originalIndex: index,
      })),
    ];

    return combinedData.map((row, index) => [
      <td
        key={`id-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        {row.id}
      </td>,
      <td
        key={`lead-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        {row.leadPax}
      </td>,
      <td
        key={`date-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        {row.travelDate}
      </td>,
      <td
        key={`service-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        {row.service}
      </td>,
      <td
        key={`status-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        <span className={getStatusBadgeClass(row.bookingStatus)}>
          {row.bookingStatus}
        </span>
      </td>,
      <td
        key={`amount-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        {row.amount}
      </td>,
      <td
        key={`voucher-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        <button
          className="hover:scale-110 transition-transform"
          aria-label="View voucher"
          type="button"
          onClick={() => {
            if (
              row.isReal &&
              row.originalIndex !== undefined &&
              quotations[row.originalIndex]
            ) {
              handleViewQuotation(quotations[row.originalIndex]!);
            }
          }}
        >
          {row.voucher}
        </button>
      </td>,
      <td
        key={`tasks-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
          {row.tasks}
        </span>
      </td>,

      // ✅ ✅ ACTIONS COLUMN (NEW!)
      <td
        key={`actions-${index}`}
        className="px-4 py-2 text-center align-middle h-[4rem]"
      >
        <ActionMenu
          actions={[
            {
              label: "Edit",
              icon: <MdOutlineEdit />,
              color: "text-blue-600",
              onClick: () => console.log("Edit", row.id),
            },
            {
              label: "Delete",
              icon: <FaRegTrashAlt />,
              color: "text-red-600",
              onClick: () => console.log("Delete", row.id),
            },

            {
              label: "Move",
              onClick: () => console.log("View clicked"),
              icon: <TbArrowAutofitRight />,
              color: "text-gray-400",
            },

            {
              label: "Duplicate",
              onClick: () => console.log("Duplicate clicked"),
              icon: <FiCopy />,
              color: "text-gray-400",
            },
          ]}
        />
      </td>,
    ]);
  }, [quotations, handleViewQuotation]);

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
      owners: [
        { value: "anand", label: "Anand Mishra" },
        { value: "priya", label: "Priya Sharma" },
        { value: "rajesh", label: "Rajesh Kumar" },
      ],
    }),
    []
  );

  const handleFilterChange = (filters: FilterPayload) => {
    console.log("Filters changed:", filters);
  };

  return (
    <>
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
          serviceTypes={filterOptions.serviceTypes}
          statuses={filterOptions.statuses}
          owners={filterOptions.owners}
          createOpen={isCreateOpen}
          setCreateOpen={setIsCreateOpen}
        />

        {isLoading ? (
          <SummaryCardsSkeleton />
        ) : (
          <SummaryCards data={summaryData ?? undefined} />
        )}

        <div className="bg-white rounded-2xl shadow pt-4 pb-3 px-3 relative">
          {/* Tabs + Total Count Row */}
          <div className="flex w-full justify-between items-center mb-2">
            {/* ✅ Left side — Tabs */}
            <div className="flex w-[32rem] ml-2 items-center bg-[#F3F3F3] rounded-2xl">
              {tabOptions.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-[0.85rem] font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-[#0D4B37] text-white shadow-sm"
                      : "text-[#818181] hover:bg-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ✅ Right side — Total Count Box */}
            <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
              <span className="text-gray-600 text-[0.85rem] font-medium">
                Total
              </span>
              <span className="bg-gray-100 text-black font-semibold text-[0.85rem] px-2 mr-1 rounded-lg shadow-sm">
                78
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
              />
            )}
          </div>
        </div>
      </div>

      {isCreateOpen && (
        <BookingFormModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSelectedService={handleServiceSelect}
        />
      )}

      {isSideSheetOpen && (
        <BookingFormSidesheet
          isOpen={isSideSheetOpen}
          onClose={handleBookingComplete}
          selectedService={selectedService}
        />
      )}
    </>
  );
};

export default OSBookingsPage;
