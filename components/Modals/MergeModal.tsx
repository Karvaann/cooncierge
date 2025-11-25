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

/* --- drag handle --- */
const DragHandle = () => (
  <div className="flex items-center justify-center text-gray-400">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4" cy="3" r="1.3" />
      <circle cx="12" cy="3" r="1.3" />
      <circle cx="4" cy="8" r="1.3" />
      <circle cx="12" cy="8" r="1.3" />
      <circle cx="4" cy="13" r="1.3" />
      <circle cx="12" cy="13" r="1.3" />
    </svg>
  </div>
);

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
    "Customer ID": <HiArrowsUpDown className="w-3 h-3" />,
    Name: <CiFilter className="w-3 h-3" />,
    Owner: <CiFilter className="w-3 h-3" />,
    Rating: <HiArrowsUpDown className="w-3 h-3" />,
    "Date Modified": <HiArrowsUpDown className="w-3 h-3" />,
  };

  /* ---- data unchanged ---- */
  const mergeIntoData = [
    [
      <td key="drag" className="px-2 py-2">
        <DragHandle />
      </td>,
      <td
        key="id"
        className="px-2 py-2 font-medium text-gray-900 text-[0.75rem]"
      >
        CU-AB001
      </td>,
      <td key="name" className="px-2 py-2">
        <div className="flex items-center gap-2">
          <img
            src="https://i.pravatar.cc/40?img=1"
            className="w-6 h-6 rounded-full"
          />
          <div>
            <div className="font-medium text-gray-900 text-[0.75rem]">
              Jatin Sharma
            </div>
            <div className="text-[0.65rem] text-gray-500">Karvaann</div>
          </div>
        </div>
      </td>,
      <td key="owner" className="px-2 py-2 text-gray-700 text-[0.75rem]">
        Sumit Jain
      </td>,
      <td key="rating" className="px-2 py-2">
        <div className="flex items-center gap-1">
          <FaRegStar className="w-3 h-3 fill-green-500 text-green-500" />
          <span className="font-medium text-[0.75rem]">5</span>
        </div>
      </td>,
      <td key="date" className="px-2 py-2 text-gray-700 text-[0.75rem]">
        10-09-2025
      </td>,
      <td key="actions" className="px-2 py-2">
        <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-[0.7rem]">
          <MdOutlineHistory className="w-3 h-3" />
          History
        </button>
      </td>,
    ],
  ];

  const mergeFromData = [
    [
      <td key="drag" className="px-2 py-2">
        <DragHandle />
      </td>,
      <td
        key="id"
        className="px-2 py-2 font-medium text-gray-900 text-[0.75rem]"
      >
        CU-AB002
      </td>,
      <td key="name" className="px-2 py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white font-medium text-[0.7rem]">
            D
          </div>
          <div>
            <div className="font-medium text-gray-900 text-[0.75rem]">
              Deepanshu
            </div>
            <div className="text-[0.65rem] text-gray-500">Karvaann</div>
          </div>
        </div>
      </td>,
      <td key="owner" className="px-2 py-2 text-gray-700 text-[0.75rem]">
        Sumit Jain
      </td>,
      <td key="rating" className="px-2 py-2">
        <div className="flex items-center gap-1">
          <FaRegStar className="w-3 h-3 fill-orange-500 text-orange-500" />
          <span className="font-medium text-[0.75rem]">2</span>
        </div>
      </td>,
      <td key="date" className="px-2 py-2 text-gray-700 text-[0.75rem]">
        09-09-2025
      </td>,
      <td key="actions" className="px-2 py-2">
        <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-[0.7rem]">
          <MdOutlineHistory className="w-3 h-3" />
          History
        </button>
      </td>,
    ],
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Merge Customers"
      size="xl"
      className="text-[0.75rem]"
      customWidth="w-[55rem]"
      customeHeight="h-[37rem]"
    >
      {/* Note */}
      <div className="px-3 py-1 -mt-6 text-center">
        <p className="text-red-500 text-[0.7rem]">
          Note: This action cannot be undone
        </p>
      </div>

      <hr className="my-1 border-gray-200" />

      <div className="px-2 space-y-3">
        {/* Merge Into */}
        <div>
          <h3 className="text-[0.75rem] font-semibold text-gray-900 mb-2">
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

        <hr className="my-1 border-gray-200" />

        {/* Merge From */}
        <div>
          <h3 className="text-[0.75rem] font-semibold text-gray-900 mb-2">
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

        <hr className="my-1 border-gray-200" />

        {/* Merge Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsConfirmationModalOpen(true)}
            className="bg-[#0D4B37] hover:bg-[#0a3a2a] text-white px-5 py-2 rounded-md text-[0.75rem] font-medium"
          >
            Merge
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title="Do you want to merge CU-AB001 into CU-AB003?"
        cancelText="Cancel"
        confirmButtonColor="bg-[#EB382B]"
        onClose={() => setIsConfirmationModalOpen(false)}
        confirmText="Yes, Merge"
      />
    </Modal>
  );
};

export default MergeModal;
