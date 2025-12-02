"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FiSearch } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { HiArrowsUpDown } from "react-icons/hi2";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { getCustomers, deleteCustomer } from "@/services/customerApi";
import type { JSX } from "react";
import LinkProfilesModal from "@/components/Modals/LinkProfilesModal";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import { BookingProvider } from "@/context/BookingContext";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";
import type { DeletableItem } from "@/components/Modals/DeleteModal";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import { FaRegStar } from "react-icons/fa";
import { CiLink } from "react-icons/ci";
import {
  getTravellers,
  deleteTraveller,
  getTravellerBookingHistory,
} from "@/services/travellerApi";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { MdHistory } from "react-icons/md";
import { getBookingHistoryByCustomer } from "@/services/customerApi";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type CustomerRow = {
  customerID: string;
  name: string;
  rating: string;
  owner: string;
  dateCreated: string;
  actions: React.ComponentType<any> | string;
};

const columns: string[] = [
  "ID",
  "Name",
  "Owner",
  "Rating",
  "Date Modified",
  "Actions",
];

const travellerColumns = ["ID", "Name", "Owner", "Date Created", "Actions"];

const travellerColumnIconMap: Record<string, JSX.Element> = {
  "Date Created": (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1] " />
  ),
};

const columnIconMap: Record<string, JSX.Element> = {
  "Customer ID": (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1] " />
  ),
  Name: (
    <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
  Owner: (
    <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
  Rating: (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
  "Date Modified": (
    <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
  ),
};

// const customerTableSeed: CustomerRow[] = [
//   {
//     customerID: "#C001",
//     name: "Amit Verma",
//     owner: "Riya Kapoor",
//     rating: "⭐️⭐️⭐️⭐️",
//     dateCreated: "05-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C002",
//     name: "Neha Gupta",
//     owner: "Arjun Mehta",
//     rating: "⭐️⭐️⭐️⭐️⭐️",
//     dateCreated: "10-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C003",
//     name: "Suresh Raina",
//     owner: "Priya Nair",
//     rating: "⭐️⭐️⭐️",
//     dateCreated: "15-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C004",
//     name: "Anjali Sharma",
//     owner: "Karan Malhotra",
//     rating: "⭐️⭐️⭐️⭐️",
//     dateCreated: "20-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C005",
//     name: "Rohit Yadav",
//     owner: "Sneha Joshi",
//     rating: "⭐️⭐️⭐️⭐️⭐️",
//     dateCreated: "25-09-2025",
//     actions: "⋮",
//   },
// ];

const CustomerDirectory = () => {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Customers");
  const [searchValue, setSearchValue] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const tabOptions = ["Customers", "Travellers", "Deleted"];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMode, setMenuMode] = useState<"main" | "action">("main");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedTravellers, setSelectedTravellers] = useState<string[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [travellers, setTravellers] = useState<any[]>([]);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const mapStatusForModal = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Successful" as const;
      case "cancelled":
        return "Failed" as const;
      case "draft":
      default:
        return "In Progress" as const;
    }
  };
  const mapQuotationsToModal = (qs: any[]) =>
    qs.map((q: any) => ({
      id: q.customId || q._id,
      bookingDate: q.createdAt
        ? new Date(q.createdAt).toLocaleDateString("en-IN")
        : "—",
      travelDate: q.travelDate ? String(q.travelDate) : "",
      status: mapStatusForModal(q.status),
      amount: q.totalAmount != null ? String(q.totalAmount) : "0",
    }));

  const handleOpenLinkModal = () => {
    setIsLinkModalOpen(true);
  };

  const handleCloseLinkModal = () => {
    setIsLinkModalOpen(false);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchValue.trim()) return customers;

    const search = searchValue.toLowerCase();

    return customers.filter(
      (c) =>
        (c.customerID || "").toLowerCase().includes(search) ||
        (c.name || "").toLowerCase().includes(search) ||
        (c.owner || "").toLowerCase().includes(search)
    );
  }, [customers, searchValue]);

  const handleSort = (column: string) => {
    const sorted = [...customers];

    if (column === "Customer ID") {
      sorted.reverse();
    }

    if (column === "Rating") {
      sorted.reverse();
    }

    if (column === "Date Modified") {
      sorted.reverse();
    }

    setCustomers(sorted);
  };

  const handleOpenConfirmDeleteModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => setIsMenuOpen(false);

  const getRatingBadge = (ratingString: string) => {
    // Convert "⭐️⭐️⭐️" OR "4" to a number
    const rating =
      typeof ratingString === "string"
        ? ratingString.match(/⭐️/g)?.length || Number(ratingString)
        : Number(ratingString);

    // Map rating → background color
    const bgMap: Record<number, string> = {
      1: "bg-red-100 text-red-600",
      2: "bg-orange-100 text-orange-600",
      3: "bg-yellow-100 text-yellow-600",
      4: "bg-green-100 text-green-600",
      5: "bg-emerald-100 text-emerald-600",
    };

    const bgClass = bgMap[rating] || "bg-gray-100 text-gray-600";

    return (
      <div className="flex items-center gap-2 justify-center">
        {/* Circle around star */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${bgClass}`}
        >
          <FaRegStar size={14} />
        </div>

        {/* Rating number OUTSIDE the circle */}
        <span className="text-[0.8rem] font-semibold text-gray-700">
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

  const handleSelectClick = () => {
    setSelectMode(true);
    setMenuMode("action"); // switch to new action menu

    setIsMenuOpen(false); // Close current menu once
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedCustomers([]);
    setSelectedTravellers([]);
    setMenuMode("main"); // Revert menu to SelectUploadMenu
  };

  const handleDeleteCustomer = async (customerID: string) => {
    try {
      // Call your API
      const response = await deleteCustomer(customerID);

      console.log("Customer deleted successfully:", response.message);

      // Refresh list after delete
      // setCustomers((prev) => prev.filter((c) => c.customerID !== customerID));
    } catch (error: any) {
      console.error("Error deleting customer:", error.message || error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === "Customers") {
          const customers = await getCustomers({ isDeleted: false });

          const mappedRows: CustomerRow[] = customers.map(
            (c: any, index: number) => ({
              ...c,
              customerID: c._id || `#C00${index + 1}`,
              name: c.name,
              owner:
                typeof c.ownerId === "object" && c.ownerId !== null
                  ? c.ownerId.name
                  : c.ownerId || "—",
              rating: c.tier ? Number(c.tier.replace("tier", "")) : 4,
              dateCreated: formatDMY(c.createdAt),
              actions: "⋮",
            })
          );

          setCustomers(mappedRows);
        }

        if (activeTab === "Travellers") {
          const data = await getTravellers({ isDeleted: false });

          const mappedTravellers = data.map((t: any) => ({
            travellerID: t._id,
            name: t.name,
            owner:
              t.ownerId && typeof t.ownerId === "object" ? t.ownerId.name : "—",
            dateCreated: formatDMY(t.createdAt),
            actions: "⋮",
          }));

          setTravellers(mappedTravellers);
        }

        if (activeTab === "Deleted") {
          const deleted = await getCustomers({ isDeleted: true });

          const mappedRows: CustomerRow[] = deleted.map(
            (c: any, index: number) => ({
              ...c,
              customerID: c._id || `#D00${index + 1}`,
              name: c.name,
              owner:
                typeof c.ownerId === "object" && c.ownerId !== null
                  ? c.ownerId.name
                  : c.ownerId || "—",
              rating: c.tier ? Number(c.tier.replace("tier", "")) : 4,
              dateCreated: formatDMY(c.createdAt),
              actions: "⋮",
            })
          );

          setCustomers(mappedRows);
        }
      } catch (err) {
        console.error("Failed to fetch:", err);
      }
    };

    fetchData();
  }, [activeTab]);

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      filteredCustomers.map((row, index) => {
        const cells: JSX.Element[] = [];

        // If select mode is ON, insert checkbox column
        if (selectMode) {
          const isSelected = selectedCustomers.includes(row.customerID);

          cells.push(
            <td key={`select-${index}`} className="px-4 py-3 text-center">
              <div className="flex items-center justify-center">
                {/* Hidden checkbox */}
                <input
                  type="checkbox"
                  id={`customer-select-${row.customerID}`}
                  className="hidden peer"
                  checked={isSelected}
                  onChange={() => {
                    setSelectedCustomers(
                      (prev) =>
                        isSelected
                          ? prev.filter((id) => id !== row.customerID) // deselect
                          : [...prev, row.customerID] // select
                    );
                  }}
                />

                {/* Styled checkbox UI */}
                <label
                  htmlFor={`customer-select-${row.customerID}`}
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
        cells.push(
          <td key={`customerID-${index}`} className="px-4 py-3  text-center">
            {row.customerID}
          </td>,
          <td key={`name-${index}`} className="px-4 py-3  text-center">
            {row.name}
          </td>,
          <td key={`owner-${index}`} className="px-4 py-3  text-center">
            {row.owner}
          </td>,

          <td key={`rating-${index}`} className="px-4 py-3  text-center">
            {getRatingBadge(row.rating)}
          </td>,
          <td key={`dateCreated-${index}`} className="px-4 py-3  text-center">
            {row.dateCreated}
          </td>,
          <td key={`actions-${index}`} className="px-4 py-3  text-center">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-gray-200 hover:bg-gray-200"
                onClick={async () => {
                  setSelectedCustomer(row);

                  try {
                    const history = await getBookingHistoryByCustomer(
                      row.customerID
                    );
                    setBookingHistory(
                      mapQuotationsToModal(history.quotations || [])
                    );
                  } catch (err) {
                    console.error("Failed to load booking history:", err);
                    setBookingHistory([]);
                  }

                  setIsHistoryOpen(true);
                }}
              >
                <MdHistory className="inline mr-1" size={14} />
                Booking History
              </button>
              <div className="">
                <ActionMenu
                  actions={[
                    {
                      label: "Edit",
                      icon: <FaRegEdit />,
                      color: "text-blue-600",
                      onClick: () => {
                        setSelectedCustomer(row); // full data
                        setIsSideSheetOpen(true);
                        setMode("edit");
                      },
                    },
                    {
                      label: "Link",
                      icon: <CiLink />,
                      color: "text-green-600",
                      onClick: () => {
                        handleOpenLinkModal();
                      },
                    },
                    {
                      label: "Delete",
                      icon: <FaRegTrashAlt />,
                      color: "text-red-600",
                      onClick: () => {
                        setSelectedCustomer(row); // store customer to delete
                        setIsConfirmModalOpen(true);
                      },
                    },
                  ]}
                />
              </div>
            </div>
          </td>
        );

        return cells;
      }),
    [filteredCustomers, selectMode, selectedCustomers]
  );

  const travellerTableData = useMemo<JSX.Element[][]>(() => {
    return travellers.map((row, index) => {
      const cells: JSX.Element[] = [];

      if (selectMode && activeTab === "Travellers") {
        const isSelected = selectedTravellers.includes(row.travellerID);

        cells.push(
          <td key={`t-select-${index}`} className="px-4 py-3 text-center">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                id={`traveller-select-${row.travellerID}`}
                className="hidden peer"
                checked={isSelected}
                onChange={() => {
                  setSelectedTravellers((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== row.travellerID)
                      : [...prev, row.travellerID]
                  );
                }}
              />
              <label
                htmlFor={`traveller-select-${row.travellerID}`}
                className={`w-5 h-5 border border-gray-400 rounded-md flex items-center justify-center cursor-pointer transition`}
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

      cells.push(
        <td key={`id-${index}`} className="px-4 py-3 text-center">
          {row.travellerID}
        </td>,
        <td key={`name-${index}`} className="px-4 py-3 text-center">
          {row.name}
        </td>,
        <td key={`owner-${index}`} className="px-4 py-3 text-center">
          {row.owner}
        </td>,
        <td key={`date-${index}`} className="px-4 py-3 text-center">
          {row.dateCreated}
        </td>,
        <td key={`actions-${index}`} className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-gray-200 hover:bg-gray-200"
              onClick={async () => {
                try {
                  const resp = await getTravellerBookingHistory(
                    row.travellerID,
                    {
                      sortBy: "createdAt",
                      sortOrder: "desc",
                      page: 1,
                      limit: 10,
                    }
                  );
                  const mapped = mapQuotationsToModal(resp?.quotations || []);
                  setBookingHistory(mapped);
                } catch (err) {
                  console.error(
                    "Failed to load traveller booking history:",
                    err
                  );
                  setBookingHistory([]);
                }
                setIsHistoryOpen(true);
              }}
            >
              <MdHistory className="inline mr-1" size={14} />
              Booking History
            </button>
            <ActionMenu
              actions={[
                {
                  label: "Delete",
                  icon: <FaRegTrashAlt />,
                  color: "text-red-600",
                  onClick: async () => {
                    try {
                      await deleteTraveller(row.travellerID);
                      setTravellers((prev) =>
                        prev.filter((t) => t.travellerID !== row.travellerID)
                      );
                    } catch (err) {
                      console.error(err);
                    }
                  },
                },
              ]}
            />
          </div>
        </td>
      );

      return cells;
    });
  }, [travellers, selectMode, activeTab, selectedTravellers]);

  const handleTravellerSort = (column: string) => {
    if (column === "Date Created") {
      setTravellers((prev) => [...prev].reverse());
    }
  };

  const selectedDeletables: DeletableItem[] = useMemo(() => {
    return customers
      .filter((c) => selectedCustomers.includes(c.customerID))
      .map((c) => ({
        id: c.customerID,
        name: c.name,
        owner: c.owner,
        rating: Number(c.rating),
        dateModified: c.dateCreated,
      }));
  }, [customers, selectedCustomers]);

  const selectedTravellerDeletables: DeletableItem[] = useMemo(() => {
    return travellers
      .filter((t) => selectedTravellers.includes(t.travellerID))
      .map((t) => ({
        id: t.travellerID,
        name: t.name,
        owner: t.owner,
        dateCreated: t.dateCreated,
      }));
  }, [travellers, selectedTravellers]);

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/*  Tabs */}
        <div className="flex w-[21rem] -ml-2 items-center bg-[#F3F3F3] rounded-2xl space-x-4">
          {tabOptions.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-[0.85rem] font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#0D4B37] text-white shadow-sm"
                  : "text-[#818181] hover:bg-gray-200"
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
              {activeTab === "Travellers"
                ? travellers.length
                : customers.length}
            </span>
          </div>
          <button
            onClick={() => setIsSideSheetOpen(true)}
            className="flex items-center text-[0.85rem] cursor-pointer gap-2 border border-green-900 text-white bg-green-900 px-3 py-1.5 rounded-md font-semibold transition-all duration-200"
            type="button"
          >
            + Add Customer
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
            placeholder="Search by Customer ID/Name/Owner"
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
                className="px-2 py-1.5 w-[5rem] text-[0.75rem] font-medium text-[#414141] border border-gray-200 bg-[#F9F9F9] hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeTab === "Customers") {
                    if (selectedCustomers.length === customers.length) {
                      setSelectedCustomers([]);
                    } else {
                      setSelectedCustomers(customers.map((c) => c.customerID));
                    }
                  } else if (activeTab === "Travellers") {
                    if (selectedTravellers.length === travellers.length) {
                      setSelectedTravellers([]);
                    } else {
                      setSelectedTravellers(
                        travellers.map((t) => t.travellerID)
                      );
                    }
                  }
                }}
                className="px-2 py-1.5 w-[6rem] mr-3 text-[0.75rem] font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-100"
              >
                {activeTab === "Customers"
                  ? selectedCustomers.length === customers.length
                    ? "Deselect All"
                    : "Select All"
                  : selectedTravellers.length === travellers.length
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
        w-max
        z-[40]
      "
              style={{ pointerEvents: "auto" }}
            >
              {menuMode === "main" ? (
                <SelectUploadMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  onSelect={handleSelectClick} // triggers the switch
                />
              ) : (
                <DownloadMergeMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  entity={
                    activeTab === "Travellers"
                      ? ("traveller" as any)
                      : "customer"
                  }
                  items={
                    activeTab === "Travellers"
                      ? selectedTravellerDeletables
                      : selectedDeletables
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2">
        {activeTab === "Customers" && (
          <Table
            data={tableData}
            columns={columns}
            columnIconMap={columnIconMap}
            showCheckboxColumn={selectMode}
            onSort={handleSort}
          />
        )}

        {activeTab === "Travellers" && (
          <Table
            data={travellerTableData}
            columns={travellerColumns}
            columnIconMap={travellerColumnIconMap}
            onSort={handleTravellerSort}
            showCheckboxColumn={selectMode}
          />
        )}

        {activeTab === "Deleted" && (
          <Table
            data={tableData}
            columns={columns}
            columnIconMap={columnIconMap}
            showCheckboxColumn={selectMode}
            onSort={handleSort}
          />
        )}
      </div>
      {isSideSheetOpen && (
        <BookingProvider>
          <AddCustomerSideSheet
            isOpen={isSideSheetOpen}
            onCancel={() => {
              setIsSideSheetOpen(false);
              setSelectedCustomer(null);
              setMode("create");
            }}
            data={selectedCustomer} // REQUIRED
            mode={mode}
          />
        </BookingProvider>
      )}
      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Are you sure you want to delete the selected customer(s)? This action cannot be undone."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
          onConfirm={() => {
            if (!selectedCustomer) return;

            handleDeleteCustomer(selectedCustomer.customerID);
            setIsConfirmModalOpen(false);
          }}
        />
      )}

      {isLinkModalOpen && (
        <LinkProfilesModal
          isOpen={isLinkModalOpen}
          onClose={handleCloseLinkModal}
        />
      )}
      {isHistoryOpen && (
        <BookingHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onViewCustomer={
            activeTab === "Customers" && selectedCustomer
              ? () => {
                  setMode("view");
                  setIsSideSheetOpen(true);
                  setIsHistoryOpen(false);
                }
              : undefined
          }
          bookings={bookingHistory}
        />
      )}
    </div>
  );
};

export default CustomerDirectory;
