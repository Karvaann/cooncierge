"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FiSearch } from "react-icons/fi";
import { IoMdArrowDropdown } from "react-icons/io";
import { BsThreeDotsVertical } from "react-icons/bs";
import { getVendors } from "@/services/vendorApi";
import type { JSX } from "react";
import AddVendorSideSheet from "@/components/Sidesheets/AddVendorSideSheet";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type VendorRow = {
  vendorID: string;
  name: string;
  rating: string;
  owner: string;
  dateCreated: string;
  actions: React.ComponentType<any> | string;
};

const columns: string[] = [
  "Vendor ID",
  "Name",
  "Owner",
  "Date Created",
  "Rating",
  "Actions",
];

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
  const [activeTab, setActiveTab] = useState("All");
  const [searchValue, setSearchValue] = useState("");
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const tabOptions = ["All", "Service", "Company", "Deleted"];

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const data = await getVendors();

        const mappedRows: VendorRow[] = data.map((c: any, index: number) => ({
          customerID: c._id || `#C00${index + 1}`,
          name: c.name,
          owner: c.ownerId || "—",
          rating: "⭐️⭐️⭐️⭐️",
          dateCreated: new Date(c.createdAt).toLocaleDateString(),
          actions: "⋮",
        }));
        setVendors(mappedRows);
      } catch (err) {
        console.error("Failed to fetch Vendors:", err);
      } finally {
        // Any cleanup or final steps
      }
    };

    fetchVendors();
  }, []);

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      vendors.map((row, index) => [
        <td key={`customerID-${index}`} className="px-4 py-3">
          {row.vendorID}
        </td>,
        <td key={`name-${index}`} className="px-4 py-3">
          {row.name}
        </td>,
        <td key={`owner-${index}`} className="px-4 py-3">
          {row.owner}
        </td>,
        <td key={`dateCreated-${index}`} className="px-4 py-3">
          {row.dateCreated}
        </td>,
        <td key={`rating-${index}`} className="px-4 py-3">
          {row.rating}
        </td>,
        <td key={`actions-${index}`} className="px-4 py-3">
          <ActionMenu />
        </td>,
      ]),
    []
  );

  return (
    <div className="bg-white rounded-2xl shadow p-5 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/*  Tabs */}
        <div className="flex items-center bg-gray-100 rounded-2xl p-1">
          {tabOptions.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-green-900 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/*  Total Count + Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <span className="text-gray-600 text-sm font-medium">Total</span>
            <span className="bg-white text-black font-bold text-sm px-3 py-1 rounded-lg shadow-sm">
              78
            </span>
          </div>
          <button
            onClick={() => setIsSideSheetOpen(true)}
            className="flex items-center gap-2 border border-green-900 text-green-900 px-6 py-2 rounded-lg font-semibold hover:bg-green-900 hover:text-white transition-all duration-200"
            type="button"
          >
            + Add Vendor
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 my-4"></div>

      {/* SEARCH & SORT */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-[600px]">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by Customer ID/Name/Owner"
            className="w-full py-2 pl-4 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900 text-gray-700 bg-white"
          />

          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none" />
        </div>

        <button className="p-2 ml-[870px] rounded-lg border border-gray-200 bg-white hover:bg-gray-100">
          <BsThreeDotsVertical className="text-xl text-gray-500" />
        </button>
      </div>

      <div className="min-h-screen mt-2">
        <Table data={tableData} columns={columns} />
      </div>
      {isSideSheetOpen && (
        <AddVendorSideSheet
          isOpen={isSideSheetOpen}
          onCancel={() => setIsSideSheetOpen(false)}
        />
      )}
    </div>
  );
};

export default VendorDirectory;
