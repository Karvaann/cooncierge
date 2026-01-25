"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Modal from "../Modal";
import Table from "../Table";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { CiUser } from "react-icons/ci";
import { MdOutlinePersonSearch } from "react-icons/md";
import { FaStore } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { CiFilter } from "react-icons/ci";
import type { JSX } from "react";

const BookingFormSidesheet = dynamic(
  () => import("@/components/BookingFormSidesheet"),
  { ssr: false },
);

interface BookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewCustomer?: (() => void) | undefined;
  onEditCustomer?: (() => void) | undefined;
  bookings: Array<Record<string, any>>;
  /** Optional display name for the record (customer/vendor/traveller/team member) */
  recordName?: string | null;
  /** Optional id for the record to show next to the name */
  recordId?: string | null;
  /** Category used for table display text (e.g. "customers", "vendors", "teams") */
  categoryName?: string | null;
}

const statusColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-800",
  deleted: "bg-red-100 text-red-700",
};

const BookingHistoryModal: React.FC<BookingHistoryModalProps> = ({
  isOpen,
  onClose,
  onViewCustomer,
  onEditCustomer,
  bookings,
  recordName = null,
  recordId = null,
  categoryName = null,
}) => {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetMode, setSideSheetMode] = useState<"view" | "edit">("edit");
  const [selectedBooking, setSelectedBooking] = useState<Record<
    string,
    any
  > | null>(null);
  const [localBookings, setLocalBookings] = useState<Array<any>>(
    bookings || [],
  );

  // Import services lazily via require to avoid SSR issues
  const { getVendorBookingHistory } = require("@/services/vendorApi");
  const { getBookingHistoryByCustomer } = require("@/services/customerApi");
  const { getTravellerBookingHistory } = require("@/services/travellerApi");
  const { getBookingHistoryByTeamMember } = require("@/services/teamsApi");

  useEffect(() => {
    setLocalBookings(bookings || []);
  }, [bookings]);

  const isMongoObjectId = (value: unknown) =>
    typeof value === "string" && /^[a-f\d]{24}$/i.test(value.trim());

  const resolveRecordObjectId = () => {
    const direct = String(recordId || "").trim();
    if (isMongoObjectId(direct)) return direct;

    const first = (localBookings?.[0] || bookings?.[0]) as any;
    if (!first) return "";

    const cat = String(categoryName || "").toLowerCase();
    const pickId = (candidate: any) => {
      if (!candidate) return "";
      if (typeof candidate === "string" && isMongoObjectId(candidate))
        return candidate;
      if (typeof candidate === "object" && isMongoObjectId(candidate?._id))
        return String(candidate._id);
      return "";
    };

    if (cat.includes("vendor")) return pickId(first.vendorId);
    if (cat.includes("customer")) return pickId(first.customerId);
    if (cat.includes("traveller") || cat.includes("traveler"))
      return pickId(first.travellerId || first.travelerId);
    if (cat.includes("team")) return pickId(first.teamMemberId || first.userId);

    return (
      pickId(first.customerId) ||
      pickId(first.vendorId) ||
      pickId(first.travellerId || first.travelerId) ||
      pickId(first.teamMemberId || first.userId)
    );
  };

  const refreshHistory = async (
    params: any = {
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 10,
    },
  ) => {
    try {
      const cat = String(categoryName || "").toLowerCase();
      const id = resolveRecordObjectId();
      if (!id) {
        console.warn(
          "BookingHistoryModal: cannot refresh history without a Mongo _id",
          { categoryName, recordId },
        );
        return;
      }

      let resp: any = null;
      if (cat.includes("vendor")) {
        resp = await getVendorBookingHistory(id, params);
      } else if (cat.includes("customer")) {
        resp = await getBookingHistoryByCustomer(id, params);
      } else if (cat.includes("traveller") || cat.includes("traveler")) {
        resp = await getTravellerBookingHistory(id, params);
      } else if (cat.includes("team") || cat.includes("team member")) {
        resp = await getBookingHistoryByTeamMember(id, params);
      } else {
        // fallback: try customer then vendor
        try {
          resp = await getBookingHistoryByCustomer(id, params);
        } catch (e) {
          resp = await getVendorBookingHistory(id, params);
        }
      }

      const quotations =
        resp?.quotations ||
        resp?.data?.quotations ||
        resp?.data?.data?.quotations ||
        [];
      setLocalBookings(quotations || []);
    } catch (err) {
      console.error("Failed to refresh booking history:", err);
    }
  };

  const formatDMY = (dateString: string) => {
    const direct = new Date(dateString);
    if (!isNaN(direct.getTime())) {
      const day = String(direct.getDate()).padStart(2, "0");
      const month = String(direct.getMonth() + 1).padStart(2, "0");
      const year = direct.getFullYear();
      return `${day}-${month}-${year}`;
    }
    const m = String(dateString).match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    );
    if (m) {
      const d = m[1] || "";
      const mo = m[2] || "";
      const y = m[3] || "";
      const day = d.padStart(2, "0");
      const month = mo.padStart(2, "0");
      return `${day}-${month}-${y}`;
    }
    return dateString || "—";
  };
  const columns = [
    "ID",
    "Booking Date",
    "Travel Date",
    "Status",
    "Amount",
    "Action",
  ];

  const columnIconMap: Record<string, JSX.Element> = {
    "Booking Date": (
      <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
    ),
    "Travel Date": (
      <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
    ),
    Status: (
      <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
    ),
  };

  const tabs = [
    { label: "Customer", icon: <CiUser size={20} /> },
    { label: "Traveller", icon: <MdOutlinePersonSearch size={20} /> },
    { label: "Vendor", icon: <FaStore size={18} /> },
  ];

  const handleOpenSideSheet = (
    booking: Record<string, any>,
    mode: "view" | "edit",
  ) => {
    console.log("Opening Booking", booking, mode);
    setSelectedBooking(booking);
    setSideSheetMode(mode);
    setIsSideSheetOpen(true);
  };

  const rows = localBookings.map((item: any) => [
    <td
      key={`${item._id}-id`}
      className="px-2 py-2 text-center font-medium text-[0.75rem]"
    >
      {item.customId || item._id}
    </td>,

    <td
      key={`${item._id}-bdate`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      {item.formFields.bookingdate
        ? formatDMY(item.formFields.bookingdate)
        : "—"}
    </td>,

    <td
      key={`${item._id}-tdate`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      {item.travelDate ? formatDMY(item.travelDate) : "—"}
    </td>,

    <td
      key={`${item._id}-status`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      <span
        className={`
        px-2 py-[3px] rounded-full text-[0.7rem] font-semibold text-capitalize
        ${statusColors[item.serviceStatus]}
      `}
      >
        {item.serviceStatus}
      </span>
    </td>,

    <td
      key={`${item._id}-amount`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      ₹ {item.totalAmount || item.amount || "0"}
    </td>,
    <td
      key={`${item._id}-action`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      <div className="flex items-center gap-2 mr-2">
        <button
          className="p-1.5 rounded-md bg-yellow-100 hover:bg-yellow-200 transition"
          type="button"
          onClick={() => handleOpenSideSheet(item, "view")}
        >
          <FiEye className="text-gray-700" size={14} />
        </button>
        <button
          className="p-1.5 rounded-md bg-blue-100 hover:bg-blue-200 transition"
          type="button"
          onClick={() => handleOpenSideSheet(item, "edit")}
        >
          <MdOutlineEdit className="text-blue-500" size={16} />
        </button>
      </div>
    </td>,
  ]);

  return (
    <Modal
      title=""
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      customWidth="w-[800px]"
      customeHeight="h-fit"
      className="pb-2"
      closeOnOverlayClick={true}
      closeOnEscape={true}
      zIndexClass="z-[200]"
      disableOverlayClick={false}
    >
      <div className="px-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 -mt-6">
          <div className="flex items-center gap-2">
            <h2 className="text-md font-semibold">Booking History</h2>

            <div className="w-px h-6 bg-gray-300" />

            <span className="text-sm font-medium">{recordName ?? "—"}</span>

            <div className="w-[0.5px] h-6 bg-gray-300" />

            <span className="text-sm text-gray-500">{recordId ?? "—"}</span>
          </div>

          <div className="flex items-center gap-2 mr-2">
            <button
              className="p-1.5 rounded-md bg-yellow-100 hover:bg-yellow-200 transition"
              onClick={onViewCustomer}
              type="button"
            >
              <FiEye className="text-gray-700" size={14} />
            </button>
            <button
              className="p-1.5 rounded-md bg-blue-100 hover:bg-blue-200 transition"
              type="button"
              onClick={onEditCustomer}
            >
              <MdOutlineEdit className="text-blue-500" size={16} />
            </button>
          </div>
        </div>
        <Table
          data={rows}
          columns={columns}
          columnIconMap={columnIconMap}
          initialRowsPerPage={5}
          hideRowsPerPage={false}
          categoryName={categoryName ?? "entries"}
        />
      </div>

      {isSideSheetOpen && (
        <BookingFormSidesheet
          isOpen={isSideSheetOpen}
          onClose={() => setIsSideSheetOpen(false)}
          selectedService={null}
          initialData={selectedBooking}
          mode={sideSheetMode}
          // Allow the sidesheet to request switching into edit mode
          onRequestEdit={() => setSideSheetMode("edit")}
          // When the booking gets updated inside the sidesheet, refresh history
          onBookingSaved={async (updatedBooking: any) => {
            try {
              // update selected booking shown and refresh the modal's listing
              setSelectedBooking(updatedBooking || selectedBooking);
              await refreshHistory();
            } catch (e) {
              console.error("Error handling bookingSaved callback:", e);
            }
          }}
        />
      )}
    </Modal>
  );
};

export default BookingHistoryModal;
