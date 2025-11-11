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
import { getCustomers } from "@/services/customerApi";
import type { JSX } from "react";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";

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
  "Customer ID",
  "Name",
  "Owner",
  "Rating",
  "Date Modified",
  "Actions",
];

const columnIconMap: Record<string, JSX.Element> = {
  "Customer ID": (
    <HiArrowsUpDown className="inline w-5 h-5 text-white font-semibold " />
  ),
  Name: <CiFilter className="inline w-5 h-5 text-white font-semibold" />,
  Owner: <CiFilter className="inline w-5 h-5 text-white font-semibold" />,
  Rating: (
    <HiArrowsUpDown className="inline w-5 h-5 text-white font-semibold" />
  ),
  "Date Modified": (
    <HiArrowsUpDown className="inline w-5 h-5 text-white font-semibold" />
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

  // Sorting Of Customers
  // const [sortAsc, setSortAsc] = useState(true);

  // const handleSort = (column: string) => {
  //   if (column === "Customer ID") {
  //     const sortedCustomers = [...customers].reverse();
  //     setCustomers(sortedCustomers);
  //     setSortAsc(!sortAsc);
  //   }
  // };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => setIsMenuOpen(false);

  const handleSelectClick = () => {
    setSelectMode(true);
    setMenuMode("action"); // switch to new action menu

    setIsMenuOpen(false); // Close current menu once
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedCustomers([]);
    setMenuMode("main"); // ✅ Revert menu to SelectUploadMenu
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customers = await getCustomers();
        console.log("Fetched customers:", customers);

        const mappedRows: CustomerRow[] = customers.map(
          (c: any, index: number) => ({
            customerID: c._id || `#C00${index + 1}`,
            name: c.name,
            owner:
              typeof c.ownerId === "object" && c.ownerId !== null
                ? c.ownerId.name
                : c.ownerId || "—",
            rating: "⭐️⭐️⭐️⭐️",
            dateCreated: new Date(c.createdAt).toLocaleDateString(),
            actions: "⋮",
          })
        );
        setCustomers(mappedRows);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        // Any cleanup or final steps
      }
    };

    fetchCustomers();
  }, []);

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      customers.map((row, index) => [
        <td key={`customerID-${index}`} className="px-4 py-3">
          {row.customerID}
        </td>,
        <td key={`name-${index}`} className="px-4 py-3">
          {row.name}
        </td>,
        <td key={`owner-${index}`} className="px-4 py-3">
          {row.owner}
        </td>,

        <td key={`rating-${index}`} className="px-4 py-3">
          {row.rating}
        </td>,
        <td key={`dateCreated-${index}`} className="px-4 py-3">
          {row.dateCreated}
        </td>,
        <td key={`actions-${index}`} className="px-4 py-3">
          <ActionMenu
            actions={[
              {
                label: "Edit",
                icon: <FaRegEdit />,
                color: "text-green-600",
                onClick: () => console.log("Edit"),
              },
              {
                label: "Delete",
                icon: <FaRegTrashAlt />,
                color: "text-red-600",
                onClick: () => console.log("Delete"),
              },
            ]}
          />
        </td>,
      ]),
    [customers]
  );

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/*  Tabs */}
        <div className="flex w-[21rem] -ml-2 items-center bg-[#F3F3F3] rounded-2xl">
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

        {/*  Total Count + Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
            <span className="text-gray-600 text-[0.85rem] font-medium">
              Total
            </span>
            <span className="bg-gray-100 text-black font-semibold text-[0.85rem] px-2 mr-1 rounded-lg shadow-sm">
              78
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
        <div className="relative w-[26rem] ">
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
          {/* Show these two only in select mode ---- selecting functionality of customer array */}
          {selectMode && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelSelectMode}
                className="px-3 py-2 w-[83px] text-sm font-medium text-[#414141] border border-gray-200 bg-[#F9F9F9] hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedCustomers.length === customers.length) {
                    setSelectedCustomers([]); // deselect all
                  } else {
                    setSelectedCustomers(customers.map((c) => c.customerID)); // select all
                  }
                }}
                className="px-3 py-2 w-[115px] mr-3 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
              >
                {selectedCustomers.length === customers.length
                  ? "Select All"
                  : "Deselect All"}
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
                  onSelect={handleSelectClick} // 🔥 triggers the switch
                />
              ) : (
                <DownloadMergeMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  onDownload={() => console.log("Download clicked")}
                  onDelete={() => console.log("Delete clicked")}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* onSelect={() => setSelectMode((prev) => !prev)} ---- to enable select mode to select customers */}

      <div className="min-h-screen mt-2 px-2">
        <Table
          data={tableData}
          columns={columns}
          columnIconMap={columnIconMap}
        />
      </div>
      {isSideSheetOpen && (
        <AddCustomerSideSheet
          isOpen={isSideSheetOpen}
          onCancel={() => setIsSideSheetOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerDirectory;
