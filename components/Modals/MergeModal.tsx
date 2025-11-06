"use client";

import React, { useState } from "react";
import { FaRegStar } from "react-icons/fa";
import { MdOutlineHistory } from "react-icons/md";
import { HiArrowsUpDown } from "react-icons/hi2";
import { CiFilter } from "react-icons/ci";
import Modal from "../Modal";
import Table from "@/components/Table";
import ConfirmationModal from "../popups/ConfirmationModal";

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Drag Handle Icon Component
const DragHandle = () => (
  <div className="flex items-center justify-center text-gray-400">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4" cy="3" r="1.5" />
      <circle cx="12" cy="3" r="1.5" />
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="4" cy="13" r="1.5" />
      <circle cx="12" cy="13" r="1.5" />
    </svg>
  </div>
);

// Main Merge Modal Component
const MergeModal: React.FC<MergeModalProps> = ({ isOpen, onClose }) => {
  const columns = [
    "",
    "Customer ID",
    "Name",
    "Owner",
    "Rating",
    "Date Modified",
    "Actions",
  ];

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const columnIconMap = {
    "Customer ID": <HiArrowsUpDown className="w-4 h-4" />,
    Name: <CiFilter className="w-4 h-4" />,
    Owner: <CiFilter className="w-4 h-4" />,
    Rating: <HiArrowsUpDown className="w-4 h-4" />,
    "Date Modified": <HiArrowsUpDown className="w-4 h-4" />,
  };

  // Merge Into Data - Single Entry
  const mergeIntoData = [
    [
      <td key="drag" className="px-4 py-3">
        <DragHandle />
      </td>,
      <td key="id" className="px-4 py-3 font-medium text-gray-900">
        CU-AB001
      </td>,
      <td key="name" className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="https://i.pravatar.cc/40?img=1"
            alt="Avatar"
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="font-medium text-gray-900">Jatin Sharma</div>
            <div className="text-xs text-gray-500">Karvaann</div>
          </div>
        </div>
      </td>,
      <td key="owner" className="px-4 py-3 text-gray-700">
        Sumit Jain
      </td>,
      <td key="rating" className="px-4 py-3">
        <div className="flex items-center gap-1">
          <FaRegStar className="w-4 h-4 fill-green-500 text-green-500" />
          <span className="font-medium">5</span>
        </div>
      </td>,
      <td key="date" className="px-4 py-3 text-gray-700">
        10-09-2025
      </td>,
      <td key="actions" className="px-4 py-3">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <MdOutlineHistory className="w-4 h-4" />
          Booking History
        </button>
      </td>,
    ],
  ];

  // Merge From Data - Multiple Entries
  const mergeFromData = [
    [
      <td key="drag" className="px-4 py-3">
        <DragHandle />
      </td>,
      <td key="id" className="px-4 py-3 font-medium text-gray-900">
        CU-AB002
      </td>,
      <td key="name" className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-medium">
            D
          </div>
          <div>
            <div className="font-medium text-gray-900">Deepanshu</div>
            <div className="text-xs text-gray-500">Karvaann</div>
          </div>
        </div>
      </td>,
      <td key="owner" className="px-4 py-3 text-gray-700">
        Sumit Jain
      </td>,
      <td key="rating" className="px-4 py-3">
        <div className="flex items-center gap-1">
          <FaRegStar className="w-4 h-4 fill-orange-500 text-orange-500" />
          <span className="font-medium">2</span>
        </div>
      </td>,
      <td key="date" className="px-4 py-3 text-gray-700">
        09-09-2025
      </td>,
      <td key="actions" className="px-4 py-3">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <MdOutlineHistory className="w-4 h-4" />
          Booking History
        </button>
      </td>,
    ],
    [
      <td key="drag" className="px-4 py-3">
        <DragHandle />
      </td>,
      <td key="id" className="px-4 py-3 font-medium text-gray-900">
        CU-AB003
      </td>,
      <td key="name" className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="https://i.pravatar.cc/40?img=3"
            alt="Avatar"
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="font-medium text-gray-900">Anand Mishra</div>
            <div className="text-xs text-gray-500">Karvaann</div>
          </div>
        </div>
      </td>,
      <td key="owner" className="px-4 py-3 text-gray-700">
        Apurav Mishra
      </td>,
      <td key="rating" className="px-4 py-3">
        <div className="flex items-center gap-1">
          <FaRegStar className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          <span className="font-medium">3</span>
        </div>
      </td>,
      <td key="date" className="px-4 py-3 text-gray-700">
        09-09-2025
      </td>,
      <td key="actions" className="px-4 py-3">
        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <MdOutlineHistory className="w-4 h-4" />
          Booking History
        </button>
      </td>,
    ],
  ];

  const handleMerge = () => {
    setIsConfirmationModalOpen(true);
    console.log("Merge action triggered");
    // Add your merge logic here
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Merge Customers/Vendors/Travellers"
      size="xl"
      className="max-w-7xl w-full"
      customWidth="w-[1100px]"
      customeHeight="h-[720px]"
    >
      {/* Warning Note */}
      <div className="px-6 py-2 -mt-6.5 text-center">
        <p className="text-red-500 text-sm">
          Note : This action cannot be undone
        </p>
      </div>

      <hr className="mb-4 mt-2 border-t border-gray-200" />

      {/* Content */}
      <div className="px-6 pb-6 space-y-4">
        {/* Merge Into Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Merge Into
          </h3>
          <Table
            data={mergeIntoData}
            columns={columns}
            initialRowsPerPage={2}
            columnIconMap={columnIconMap}
            hideRowsPerPage={true}
          />
        </div>

        <hr className="mb-2 mt-2 border-t border-gray-200" />

        {/* Merge From Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Merge From
          </h3>
          <Table
            data={mergeFromData}
            columns={columns}
            initialRowsPerPage={2}
            columnIconMap={columnIconMap}
            hideRowsPerPage={true}
          />
        </div>

        <hr className="mb-4 mt-2 border-t border-gray-200" />

        {/* Merge Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleMerge}
            className="bg-[#0D4B37] hover:bg-[#0a3a2a] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Merge
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title="Do you want to merge CU-AB001 into CU-AB003"
        cancelText="Cancel"
        confirmButtonColor="bg-[#EB382B]"
        onClose={() => setIsConfirmationModalOpen(false)}
        confirmText="Yes Merge"
        onConfirm={() => {
          console.log("Merging confirmed!");
          // perform merge logic here
        }}
      />
    </Modal>
  );
};

export default MergeModal;
