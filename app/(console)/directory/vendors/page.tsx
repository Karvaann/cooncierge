"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FiSearch } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { HiArrowsUpDown } from "react-icons/hi2";
import {
  getVendors,
  deleteVendor,
  getVendorBookingHistory,
  getVendorById,
} from "@/services/vendorApi";
import { IoEllipsisHorizontal } from "react-icons/io5";
import type { JSX } from "react";
import { BookingProvider } from "@/context/BookingContext";
import AddVendorSideSheet from "@/components/Sidesheets/AddVendorSideSheet";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";
import type { DeletableItem } from "@/components/Modals/DeleteModal";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import { FaRegStar } from "react-icons/fa";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { MdHistory } from "react-icons/md";
import Image from "next/image";
// (Removed traveller form integration per request)

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type VendorRow = {
  vendorID: string;
  vendorName: string;
  rating: string;
  poc: string;
  dateModified: string;
  actions: React.ComponentType<any> | string;
};

const columns: string[] = [
  "Vendor ID",
  "Vendor Name",
  "POC",
  "Date Modified",
  "Rating",
  "Actions",
];

const columnIconMap: Record<string, JSX.Element> = {
  "Vendor Name": (
    <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
  POC: (
    <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
  Rating: (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
  "Date Modified": (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
};

// const VendorTableSeed: VendorRow[] = [
//   {
//     vendorID: "#C001",
//     name: "Amit Verma",
//     owner: "Riya Kapoor",
//     rating: "⭐️⭐️⭐️⭐️",
//     dateCreated: "05-09-2025",
//     actions: "⋮",
//   },
//   {
//     vendorID: "#C002",
//     name: "Neha Gupta",
//     owner: "Arjun Mehta",
//     rating: "⭐️⭐️⭐️⭐️⭐️",
//     dateCreated: "10-09-2025",
//     actions: "⋮",
//   },
//   {
//     vendorID: "#C003",
//     name: "Suresh Raina",
//     owner: "Priya Nair",
//     rating: "⭐️⭐️⭐️",
//     dateCreated: "15-09-2025",
//     actions: "⋮",
//   },
//   {
//     vendorID: "#C004",
//     name: "Anjali Sharma",
//     owner: "Karan Malhotra",
//     rating: "⭐️⭐️⭐️⭐️",
//     dateCreated: "20-09-2025",
//     actions: "⋮",
//   },
//   {
//     vendorID: "#C005",
//     name: "Rohit Yadav",
//     owner: "Sneha Joshi",
//     rating: "⭐️⭐️⭐️⭐️⭐️",
//     dateCreated: "25-09-2025",
//     actions: "⋮",
//   },
// ];

const VendorDirectory = () => {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Vendors");
  const [searchValue, setSearchValue] = useState("");
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const tabOptions = ["Vendors", "Deleted"];
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [menuMode, setMenuMode] = useState<"main" | "action">("main");

  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyBookings, setHistoryBookings] = useState<
    {
      id: string;
      bookingDate: string;
      travelDate: string;
      status: "Confirmed" | "On Hold" | "In Progress" | "Failed";
      amount: string;
    }[]
  >([]);

  const filteredVendors = useMemo(() => {
    if (!searchValue.trim()) return vendors;

    return vendors.filter((v) => {
      const search = searchValue.toLowerCase();

      return (
        v.vendorName?.toLowerCase().includes(search) ||
        v.vendorID?.toLowerCase().includes(search) ||
        v.poc?.toLowerCase().includes(search)
      );
    });
  }, [vendors, searchValue]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleOpenConfirmDeleteModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleCloseMenu = () => setIsMenuOpen(false);

  const handleSelectClick = () => {
    setSelectMode(true);
    setMenuMode("action"); // switch to new action menu

    setIsMenuOpen(false); // Close current menu once
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedVendors([]);
    setMenuMode("main");
  };

  const handleSort = (column: string) => {
    const sorted = [...vendors];

    if (column === "Rating") {
      sorted.reverse();
    }

    if (column === "Date Modified") {
      sorted.reverse();
    }

    setVendors(sorted);
  };

  const getRatingBadge = (ratingString: string | number) => {
    const ratingRaw =
      typeof ratingString === "string"
        ? ratingString.match(/⭐️/g)?.length || Number(ratingString)
        : Number(ratingString);

    const rating = Math.min(Math.max(Math.round(ratingRaw), 1), 5);

    const tierIcon = `/icons/tier-${rating}.png`;

    return (
      <div className="flex items-center gap-2 justify-center">
        {/* Your custom tier icon */}
        <div className="w-6 h-6 relative">
          <Image
            src={tierIcon}
            alt={`Tier ${rating}`}
            width={20}
            height={20}
            className="object-contain"
            unoptimized // Important for local PNGs served from /public
          />
        </div>
        <span className="text-[0.75rem] font-semibold text-gray-700">
          {rating}
        </span>
      </div>
    );
  };

  const formatDMY = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const mapStatusForModal = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Confirmed" as const;
      case "cancelled":
        // Align with BookingHistoryModal expected status union which uses 'Failed'
        return "Failed" as const;
      case "draft":
      default:
        return "In Progress" as const;
    }
  };

  const openHistoryForVendor = async (row: VendorRow) => {
    try {
      // Fetch full vendor data first
      const fullVendorData = await getVendorById(row.vendorID);
      setSelectedVendor(fullVendorData);

      const resp = await getVendorBookingHistory(row.vendorID, {
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        limit: 10,
      });

      const quotations = resp?.quotations || [];
      setHistoryBookings(quotations);
      setIsHistoryOpen(true);
    } catch (e) {
      console.error("Failed to open vendor history:", e);
      setHistoryBookings([]);
      setIsHistoryOpen(true);
    }
  };

  // Handle Delete Vendor
  const handleDeleteVendor = async (vendorId: string) => {
    try {
      await deleteVendor(vendorId);
      // Refresh your vendor list or remove from state
      // Example: setVendors(vendors.filter(v => v.id !== vendorId));
    } catch (error: any) {
      console.error("Error deleting vendor:", error);
      throw error;
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await getVendors({ isDeleted: activeTab === "Deleted" });
      const mappedRows: VendorRow[] = data.map((v: any, index: number) => ({
        ...v,
        vendorID: v.customId || v._id || `#V00${index + 1}`,
        vendorName: v.companyName || v.name || "—",
        poc: v.contactPerson || "—",
        rating: v.tier ? Number(v.tier.replace("tier", "")) : 4,
        dateModified: formatDMY(v.createdAt),
        actions: "⋮",
      }));
      setVendors(mappedRows);
    } catch (err) {
      console.error("Failed to fetch Vendors:", err);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [activeTab]);

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      filteredVendors.map((row, index) => {
        const cells: JSX.Element[] = [];

        // Checkbox column when selectMode ON
        if (selectMode) {
          const isSelected = selectedVendors.includes(row.vendorID);

          cells.push(
            <td key={`select-${index}`} className="px-4 py-3 text-center">
              <div className="flex items-center justify-center">
                {/* Hidden checkbox */}
                <input
                  type="checkbox"
                  id={`vendor-select-${row.vendorID}`}
                  className="hidden peer"
                  checked={isSelected}
                  onChange={() => {
                    setSelectedVendors(
                      (prev) =>
                        isSelected
                          ? prev.filter((id) => id !== row.vendorID) // deselect
                          : [...prev, row.vendorID] // select
                    );
                  }}
                />

                {/* Styled custom checkbox */}
                <label
                  htmlFor={`vendor-select-${row.vendorID}`}
                  className={`w-5 h-5 border border-gray-400 rounded-md flex items-center justify-center cursor-pointer transition 
        `}
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="11"
                      viewBox="0 0 12 11"
                      fill="none"
                    >
                      <path
                        d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                        stroke="#0D4B37"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </label>
              </div>
            </td>
          );
        }

        // Normal Table Columns
        cells.push(
          <td key={`vendorID-${index}`} className="px-4 py-3  text-center">
            {row.vendorID}
          </td>,
          <td key={`vendorName-${index}`} className="px-4 py-3  text-center">
            {row.vendorName}
          </td>,
          <td key={`poc-${index}`} className="px-4 py-3  text-center">
            {row.poc}
          </td>,
          <td key={`dateModified-${index}`} className="px-4 py-3  text-center">
            {row.dateModified}
          </td>,
          <td key={`rating-${index}`} className="px-4 py-3  text-center">
            {getRatingBadge(row.rating)}
          </td>,

          // Action menu
          <td key={`actions-${index}`} className="px-4 py-3  text-center">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className="bg-[#E9ECF0] text-gray-800 px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-gray-200 hover:bg-gray-200"
                onClick={() => openHistoryForVendor(row)}
              >
                <MdHistory className="inline mr-1" size={14} />
                Booking History
              </button>
              <ActionMenu
                actions={[
                  {
                    label: "Edit",
                    icon: <FaRegEdit />,
                    color: "text-blue-600",
                    onClick: () => {
                      setSelectedVendor(row);
                      setIsSideSheetOpen(true);
                      setMode("edit");
                    },
                  },
                  {
                    label: "Delete",
                    icon: <FaRegTrashAlt />,
                    color: "text-red-600",
                    onClick: () => {
                      setSelectedVendor(row);
                      handleOpenConfirmDeleteModal();
                    },
                  },
                ]}
                width="w-22"
              />
            </div>
          </td>
        );

        return cells;
      }),
    [filteredVendors, selectMode, selectedVendors]
  );

  const selectedDeletables: DeletableItem[] = useMemo(() => {
    return vendors
      .filter((v) => selectedVendors.includes(v.vendorID))
      .map((v) => ({
        id: v.vendorID,
        vendorName: v.vendorName,
        poc: v.poc,
        rating: Number(v.rating),
        dateModified: v.dateModified,
      }));
  }, [vendors, selectedVendors]);

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/*  Tabs */}
        <div className="flex w-[12.3rem] -ml-2 items-center bg-[#F3F3F3] rounded-2xl relative p-1">
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

        {/*  Total Count + Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
            <span className="text-gray-600 text-[0.85rem] font-medium">
              Total
            </span>
            <span className="bg-gray-100 text-black font-semibold text-[0.85rem] px-2 mr-1 rounded-lg shadow-sm">
              {vendors.length}
            </span>
          </div>
          <button
            onClick={() => setIsSideSheetOpen(true)}
            className="flex items-center text-[0.85rem] cursor-pointer gap-2 border border-green-900 text-white bg-green-900 px-3 py-1.5 rounded-md font-semibold transition-all duration-200"
            type="button"
          >
            + Add Vendor
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 mb-4 mt-2"></div>

      {/* SEARCH & SORT */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="relative w-[24rem] ">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by Vendor ID/Name/POC"
            className="w-full text-[0.85rem] py-2 pl-4 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900 text-gray-700 bg-white"
          />

          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[0.85rem] pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Show these two only in select mode selecting functionality of customer array */}
          {selectMode && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelSelectMode}
                className="px-2 py-1.5 w-[5rem] text-[0.75rem] font-medium text-[#414141] border border-gray-200 bg-[#F9F9F9] hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedVendors.length === vendors.length) {
                    setSelectedVendors([]); // deselect all
                  } else {
                    setSelectedVendors(vendors.map((v) => v.vendorID)); // select all
                  }
                }}
                className="px-2 py-1.5 w-[6rem] mr-3 text-[0.75rem] font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
              >
                {selectedVendors.length === vendors.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleMenuToggle}
            className="p-2 rounded-lg mr-1 border border-gray-200 bg-white hover:bg-gray-100 relative z-[30]"
          >
            <IoEllipsisHorizontal className="text-[0.85rem] text-gray-500" />
          </button>

          {/* Conditionally render menus */}
          {isMenuOpen && (
            <div
              className="
        absolute
        top-full
        right-0
        
        z-[40]
      "
              style={{ pointerEvents: "auto" }}
            >
              {menuMode === "main" ? (
                <SelectUploadMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  onSelect={handleSelectClick} // triggers the switch
                  entity="vendor"
                />
              ) : (
                <DownloadMergeMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  entity="vendor"
                  items={selectedDeletables}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-screen mt-2 px-2">
        <Table
          data={tableData}
          columns={columns}
          columnIconMap={columnIconMap}
          showCheckboxColumn={selectMode}
          onSort={handleSort}
          categoryName="Vendors"
        />
      </div>
      {isSideSheetOpen && (
        <BookingProvider>
          <AddVendorSideSheet
            isOpen={isSideSheetOpen}
            onCancel={() => {
              setIsSideSheetOpen(false);
              setSelectedVendor(null);
              setMode("create");
            }}
            data={selectedVendor} // REQUIRED
            mode={mode}
            onSuccess={fetchVendors}
          />
        </BookingProvider>
      )}

      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Are you sure you want to delete the selected vendor?"
          confirmText="Yes, Delete"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
          onConfirm={() => {
            if (!selectedVendor) return;

            handleDeleteVendor(selectedVendor.vendorID);
            setIsConfirmModalOpen(false);
          }}
        />
      )}
      {isHistoryOpen && (
        <BookingHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onViewCustomer={
            selectedVendor
              ? async () => {
                  try {
                    // Fetch fresh vendor data if needed
                    const vendorData = await getVendorById(
                      selectedVendor._id || selectedVendor.vendorID
                    );
                    setSelectedVendor(vendorData);
                    setMode("view");
                    setIsSideSheetOpen(true);
                    setIsHistoryOpen(false);
                  } catch (e) {
                    console.error("Failed to fetch vendor:", e);
                  }
                }
              : undefined
          }
          onEditCustomer={
            selectedVendor
              ? async () => {
                  try {
                    // Fetch fresh vendor data if needed
                    const vendorData = await getVendorById(
                      selectedVendor._id || selectedVendor.vendorID
                    );
                    setSelectedVendor(vendorData);
                    setMode("edit");
                    setIsSideSheetOpen(true);
                    setIsHistoryOpen(false);
                  } catch (e) {
                    console.error("Failed to fetch vendor:", e);
                  }
                }
              : undefined
          }
          bookings={historyBookings}
          recordName={
            selectedVendor?.companyName ||
            selectedVendor?.name ||
            selectedVendor?.vendorName ||
            "—"
          }
          recordId={
            selectedVendor?._id ||
            selectedVendor?.vendorID ||
            selectedVendor?.id ||
            "—"
          }
          categoryName="vendors"
        />
      )}
    </div>
  );
};

export default VendorDirectory;
