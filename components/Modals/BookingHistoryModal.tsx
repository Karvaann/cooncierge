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
  bookings: {
    id: string;
    bookingDate: string;
    travelDate: string;
    status: "Successful" | "On Hold" | "In Progress" | "Failed";
    amount: string;
  }[];
}

const statusColors: Record<string, string> = {
  Successful: "bg-green-100 text-green-700",
  "On Hold": "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-orange-100 text-orange-700",
  Failed: "bg-red-100 text-red-700",
};

const BookingHistoryModal: React.FC<BookingHistoryModalProps> = ({
  isOpen,
  onClose,
  bookings,
}) => {
  const columns = [
    "ID",
    "Booking Date",
    "Travel Date",
    "Status",
    "Amount",
    "Actions",
  ];

  const tabs = [
    { label: "Customer", icon: <CiUser size={20} /> },
    { label: "Traveller", icon: <MdOutlinePersonSearch size={20} /> },
    { label: "Vendor", icon: <FaStore size={18} /> },
  ];

  const rows = bookings.map((item) => [
    <td key={`${item.id}-id`} className="px-4 py-3 font-medium">
      {item.id}
    </td>,

    <td key={`${item.id}-bdate`} className="px-4 py-3">
      {item.bookingDate}
    </td>,

    <td key={`${item.id}-tdate`} className="px-4 py-3">
      {item.travelDate}
    </td>,

    <td key={`${item.id}-status`} className="px-4 py-3">
      <span
        className={`px-3 py-[6px] rounded-full text-sm font-semibold ${
          statusColors[item.status]
        }`}
      >
        {item.status}
      </span>
    </td>,

    <td key={`${item.id}-amount`} className="px-4 py-3">
      ₹ {item.amount}
    </td>,

    <td
      key={`${item.id}-actions`}
      className="px-4 py-3 flex items-center gap-3"
    >
      <button className="p-2 rounded-md bg-yellow-100 hover:bg-yellow-200 transition">
        <FiEye className="text-gray-700" size={18} />
      </button>

      <button className="p-2 rounded-md bg-blue-100 hover:bg-blue-200 transition">
        <FiEdit className="text-gray-700" size={18} />
      </button>
    </td>,
  ]);

  return (
    <Modal
      title="Booking History"
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      customWidth="max-w-[1100px]"
      customeHeight="max-h-[90vh]"
      className="pb-4"
    >
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4 border-b pb-2">
        {tabs.map((t) => (
          <div
            key={t.label}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer
              border border-gray-300 hover:bg-gray-100 transition
              ${
                t.label === "Customer"
                  ? "bg-[#0D4B37] text-white border-transparent"
                  : ""
              }
            `}
          >
            {t.icon}
            <span className="font-medium">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <Table
        data={rows}
        columns={columns}
        initialRowsPerPage={10}
        hideRowsPerPage={false}
      />
    </Modal>
  );
};

export default BookingHistoryModal;
