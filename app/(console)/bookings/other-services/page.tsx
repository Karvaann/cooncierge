"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useCallback } from "react";
import { BookingApiService, DraftManager } from "@/services/bookingApi";
import type { DraftBooking } from "@/services/bookingApi";
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

type BookingStatus =
  | "Successful"
  | "Pending"
  | "Failed"
  | "confirmed"
  | "draft"
  | "cancelled";

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
  "#ID",
  "Lead Pax",
  "Travel Date",
  "Service",
  "Booking Status",
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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string | null>(null);

  // Data State
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [drafts, setDrafts] = useState<DraftBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const [reverse, setReverse] = useState(false);

  const handleSort = (column: string) => {
    if (column === "Travel Date") {
      setReverse((prev) => !prev);
    }
  };

  // Load quotations from backend
  const loadQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await BookingApiService.getAllQuotations();

      if (response.success && response.data) {
        setQuotations(response.data?.quotations || response.data);
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
  // const calculateSummaryData = useCallback((quotationData: QuotationData[]) => {
  //   const total = quotationData.reduce(
  //     (sum, q) => sum + (q.totalAmount || 0),
  //     0
  //   );
  //   const confirmed = quotationData.filter((q) => q.status === "confirmed");
  //   const pending = quotationData.filter(
  //     (q) => q.status === "draft" || q.status === "pending"
  //   );

  //   const confirmedAmount = confirmed.reduce(
  //     (sum, q) => sum + (q.totalAmount || 0),
  //     0
  //   );
  //   const pendingAmount = pending.reduce(
  //     (sum, q) => sum + (q.totalAmount || 0),
  //     0
  //   );

  //   setSummaryData({
  //     total: {
  //       amount: `₹ ${total.toLocaleString("en-IN")}`,
  //       change: `${quotationData.length} total bookings`,
  //       isPositive: true,
  //     },
  //     youGive: {
  //       amount: `₹ ${pendingAmount.toLocaleString("en-IN")}`,
  //       change: `${pending.length} pending bookings`,
  //       isPositive: false,
  //     },
  //     youGet: {
  //       amount: `₹ ${confirmedAmount.toLocaleString("en-IN")}`,
  //       change: `${confirmed.length} confirmed bookings`,
  //       isPositive: true,
  //     },
  //   });
  // }, []);

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
    // syncDrafts();
  }, [loadQuotations, loadDrafts]);

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

  const getServiceIcon = (
    quotationType: string
  ): React.ReactElement | string => {
    const iconMap: Record<string, any> = {
      flight: (
        <Image
          src="/icons/service-icons/flight.svg"
          alt="Flights"
          width={18}
          height={18}
        />
      ),
      flights: (
        <Image
          src="/icons/service-icons/flight.svg"
          alt="Flights"
          width={18}
          height={18}
        />
      ),
      accommodation: (
        <Image
          src="/icons/service-icons/accommodation.svg"
          alt="Accommodation"
          width={18}
          height={18}
        />
      ),
      car: "🚗",
      "land transportation": (
        <MdOutlineDirectionsCarFilled size={18} className="text-[#22C55E]" />
      ),
      "land-transportation": (
        <MdOutlineDirectionsCarFilled size={18} className="text-[#22C55E]" />
      ),
      land_transportation: (
        <MdOutlineDirectionsCarFilled size={18} className="text-[#22C55E]" />
      ),
      land: (
        <MdOutlineDirectionsCarFilled size={18} className="text-[#22C55E]" />
      ),
      transportation: (
        <MdOutlineDirectionsCarFilled size={18} className="text-[#22C55E]" />
      ),

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

  const ownersList: Owner[] = [
    {
      short: "AS",
      full: "Avanish Sharma",
      color: "border-pink-700 text-pink-700",
    },
    {
      short: "AK",
      full: "Ankit Kumar",
      color: "border-[#AF52DE] text-[#AF52DE]",
    },
    {
      short: "SR",
      full: "Suresh Raj",
      color: "border-[#5856D6] text-[#5856D6]",
    },
    {
      short: "VG",
      full: "Vijay Gupta",
      color: "border-cyan-700 text-cyan-700",
    },
  ];

  const getActionsForTab = (tab: string, row: any) => {
    const id = row.isReal
      ? quotations?.[row.originalIndex]?._id
      : finalQuotations[row.originalIndex]?.id;

    const baseActions = [
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
    const travelDate =
      draft.flightinfoform?.traveldate ||
      draft.accommodationinfoform?.traveldate ||
      draft.otherServiceInfoForm?.traveldate ||
      draft.landTransportInfoForm?.traveldate ||
      draft.maritimeinfoform?.traveldate ||
      draft.ticketsinfoform?.traveldate ||
      "";

    const amount =
      draft.flightinfoform?.sellingprice ||
      draft.accommodationinfoform?.sellingprice ||
      draft.otherServiceInfoForm?.sellingprice ||
      draft.landTransportInfoForm?.sellingprice ||
      draft.maritimeinfoform?.sellingprice ||
      draft.ticketsinfoform?.sellingprice ||
      0;

    return {
      _id: null,
      quotationType: draft.draftName?.split(" - ")[0]?.toLowerCase() || "draft",

      formFields: {
        customer:
          draft.customerform?.firstname ||
          draft.generalInfo?.customer ||
          "Unknown",
        departureDate: travelDate,
        budget: amount,
      },

      totalAmount: amount,
      status: "draft",
      createdAt: draft.timestamp,
      isDraft: true,
    };
  };

  const finalQuotations = (
    activeTab === "Drafts" ? drafts.map(normalizeDraft) : quotations
  ) as any[];

  // Convert quotations to table data
  const tableData = useMemo<JSX.Element[][]>(() => {
    const combinedData = [
      // Real quotations from API
      ...finalQuotations.map((item, index) => ({
        id: item._id ? `#${item._id}` : `Draft-${index + 1}`,
        leadPax:
          item.formFields?.customer || item.formFields?.traveller1 || "Unknown",
        travelDate: item.formFields?.departureDate
          ? formatDMY(item.formFields?.departureDate)
          : item.createdAt
          ? formatDMY(item.createdAt)
          : "Not Selected",
        service: (
          <div className="flex items-center gap-1">
            {getServiceIcon(item.quotationType || item.serviceType || "draft")}
            <span>
              {formatServiceType(
                item.quotationType || item.serviceType || "draft"
              )}
            </span>
          </div>
        ),

        bookingStatus: mapStatus(item.status),
        amount: item.totalAmount
          ? `₹ ${item.totalAmount.toLocaleString("en-IN")}`
          : `₹ ${item.formFields?.budget || "0"}`,

        tasks: Math.floor(Math.random() * 5) + 1, // Random tasks for demo
        isReal: Boolean(item._id),
        originalIndex: index,
      })),
    ];

    const rows = combinedData.map((row, index) => [
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
        key={`owners-${index}`}
        className="px-4 py-2 text-center align-middle h-[2.5rem]"
      >
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            {ownersList.map((owner, i) => (
              <AvatarTooltip
                key={i}
                short={owner.short}
                full={owner.full}
                color={owner.color}
              />
            ))}
          </div>
        </div>
      </td>,
      <td
        key={`tasks-${index}`}
        className="px-4 py-2 text-center align-middle h-[2.5rem]"
      >
        <div className="flex justify-center">
          <TaskButton count={row.tasks} />
        </div>
      </td>,

      // ACTIONS COLUMN
      <td
        key={`actions-${index}`}
        className="px-4 py-2  text-left align-middle h-[4rem]"
      >
        <ActionMenu actions={getActionsForTab(activeTab, row)} />
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

        <div className="bg-white rounded-2xl shadow mt-4 pt-4 pb-3 px-3 relative">
          {/* Tabs and Total Count Row */}
          <div className="flex w-full justify-between items-center mb-2">
            <div className="flex w-[30.5rem] ml-2 items-center bg-[#F3F3F3] rounded-2xl space-x-4">
              {tabOptions.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-[0.85rem] font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-[#0D4B37] text-white shadow-sm"
                      : "text-[#818181] hover:bg-gray-200"
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
                {quotations.length}
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
          isOpen={isSideSheetOpen}
          onClose={handleBookingComplete}
          selectedService={selectedService}
        />
      )}
    </>
  );
};

export default OSBookingsPage;
