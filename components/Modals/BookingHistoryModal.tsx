"use client";

import React from "react";
import Modal from "../Modal";
import Table from "../Table";
import { FiEye } from "react-icons/fi";
import { FiEdit } from "react-icons/fi";
import { CiUser } from "react-icons/ci";
import { MdOutlinePersonSearch } from "react-icons/md";
import { FaStore } from "react-icons/fa";

interface BookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewCustomer?: (() => void) | undefined;
  onEditCustomer?: (() => void) | undefined;
  bookings: {
    id: string;
    bookingDate: string;
    travelDate: string;
    status: "Successful" | "On Hold" | "In Progress" | "Cancelled";
    amount: string;
  }[];
}

const statusColors: Record<string, string> = {
  Successful: "bg-green-100 text-green-700",
  "On Hold": "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-orange-100 text-orange-700",
  Cancelled: "bg-red-100 text-red-700",
};

const BookingHistoryModal: React.FC<BookingHistoryModalProps> = ({
  isOpen,
  onClose,
  onViewCustomer,
  onEditCustomer,
  bookings,
}) => {
  const formatDMY = (dateString: string) => {
    const direct = new Date(dateString);
    if (!isNaN(direct.getTime())) {
      const day = String(direct.getDate()).padStart(2, "0");
      const month = String(direct.getMonth() + 1).padStart(2, "0");
      const year = direct.getFullYear();
      return `${day}-${month}-${year}`;
    }
    const m = String(dateString).match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/
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
    // "Actions",
  ];

  const tabs = [
    { label: "Customer", icon: <CiUser size={20} /> },
    { label: "Traveller", icon: <MdOutlinePersonSearch size={20} /> },
    { label: "Vendor", icon: <FaStore size={18} /> },
  ];

  const rows = bookings.map((item: any) => [
    <td
      key={`${item.id}-id`}
      className="px-2 py-2 text-center font-medium text-[0.75rem]"
    >
      {item.id}
    </td>,

    <td
      key={`${item.id}-bdate`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      {item.bookingDate ? formatDMY(item.bookingDate) : "—"}
    </td>,

    <td
      key={`${item.id}-tdate`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      {item.travelDate ? formatDMY(item.travelDate) : "—"}
    </td>,

    <td
      key={`${item.id}-status`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      <span
        className={`
        px-2 py-[3px] rounded-full text-[0.7rem] font-semibold
        ${statusColors[item.status]}
      `}
      >
        {item.status}
      </span>
    </td>,

    <td
      key={`${item.id}-amount`}
      className="px-2 py-2 text-center text-[0.75rem]"
    >
      ₹ {item.totalAmount || item.amount || "0"}
    </td>,

    // <td
    //   key={`${item.id}-actions`}
    //   className="px-2 py-2 text-center justify-center flex items-center gap-2"
    // >
    //   <button
    //     className="p-1.5 rounded-md bg-yellow-100 hover:bg-yellow-200 transition"
    //     onClick={onViewCustomer}
    //     type="button"
    //   >
    //     <FiEye className="text-gray-700" size={14} />
    //   </button>

    //   <button className="p-1.5 rounded-md bg-blue-100 hover:bg-blue-200 transition">
    //     <FiEdit className="text-gray-700" size={14} />
    //   </button>
    // </td>,
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
      zIndexClass="z-[9999]"
      disableOverlayClick={false}
    >
      <div className="px-2">
        {/* CUSTOM HEADER */}
        <div className="flex items-center justify-between px-4 py-2 -mt-6">
          {/* Left: Title */}
          <h2 className="text-md font-semibold">Booking History</h2>

          {/* Middle: Buttons (Eye + Edit) */}
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
              <FiEdit className="text-gray-700" size={16} />
            </button>
          </div>

          {/* Right: Close button (Modal already renders X, so we leave space for it) */}
        </div>
        {/* Tabs */}
        {/* <div className="flex items-center gap-3 mb-3 border-b pb-2">
        {tabs.map((t) => (
          <div
            key={t.label}
            className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer
          border border-gray-300 hover:bg-gray-100 transition
          text-[0.75rem]
          ${
            t.label === "Customer"
              ? "bg-[#0D4B37] text-white border-transparent"
              : "text-gray-700"
          }
        `}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {t.icon}
            </span>
            <span className="font-medium">{t.label}</span>
          </div>
        ))}
      </div> */}

        {/* Table */}
        <Table
          data={rows}
          columns={columns}
          initialRowsPerPage={5}
          hideRowsPerPage={false}
        />
      </div>
    </Modal>
  );
};

export default BookingHistoryModal;
