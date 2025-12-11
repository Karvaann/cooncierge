"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaRegStar } from "react-icons/fa";
import { MdOutlineHistory, MdHistory } from "react-icons/md";
import { HiArrowsUpDown } from "react-icons/hi2";
import { CiFilter } from "react-icons/ci";
import Modal from "../Modal";
import Table from "@/components/Table";
import ConfirmationModal from "../popups/ConfirmationModal";
import BookingHistoryModal from "./BookingHistoryModal";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import { BookingProvider } from "@/context/BookingContext";
import {
  mergeCustomers,
  getBookingHistoryByCustomer,
  getCustomerById,
} from "@/services/customerApi";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: DeletableItem[]; // selected customers passed from parent menu
}

type DeletableItem = {
  id: string;
  name?: string;
  owner?: string;
  rating?: number;
  dateModified?: string;
};

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

const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  items = [],
}) => {
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
  const [isMerging, setIsMerging] = useState(false);

  const [mergeIntoItems, setMergeIntoItems] = useState<DeletableItem[]>([]);
  const [mergeFromItems, setMergeFromItems] = useState<DeletableItem[]>([]);

  // sync local state when `items` prop changes
  useEffect(() => {
    if (items && items.length > 0) {
      setMergeIntoItems([items[0]!]);
      setMergeFromItems(items.slice(1));
    } else {
      setMergeIntoItems([]);
      setMergeFromItems([]);
    }
  }, [items]);

  // derive primary and secondary from local state
  const primaryItem = mergeIntoItems.length > 0 ? mergeIntoItems[0] : null;
  const secondaryItems = mergeFromItems;

  // reverse arrays when sortable headers are clicked
  const handleSort = (column: string) => {
    if (
      column === "Customer ID" ||
      column === "Rating" ||
      column === "Date Modified"
    ) {
      setMergeFromItems((prev) => [...prev].reverse());
    }
  };

  const primaryCustomerId = primaryItem?.id;
  const secondaryCustomersId = secondaryItems.map((i) => i.id);

  // Booking history / sidesheet state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [selectedCustomerFull, setSelectedCustomerFull] = useState<any | null>(
    null
  );
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetMode, setSideSheetMode] = useState<"view" | "edit">("view");

  const mapStatusForModal = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Successful" as const;
      case "cancelled":
        return "Cancelled" as const;
      case "draft":
      default:
        return "In Progress" as const;
    }
  };

  const mapQuotationsToModal = (qs: any[]) =>
    qs.map((q: any) => ({
      id: q.customId || q._id,
      bookingDate: q.createdAt || q.bookingDate,
      travelDate: q.travelDate ? String(q.travelDate) : "",
      status: mapStatusForModal(q.status),
      amount:
        q.totalAmount != null ? String(q.totalAmount) : String(q.amount || "0"),
    }));

  const getRatingBadge = (ratingString?: string | number) => {
    const ratingRaw =
      typeof ratingString === "string"
        ? ratingString.match(/⭐️/g)?.length || Number(ratingString)
        : Number(ratingString || 0);

    const rating = Math.min(Math.max(Math.round(ratingRaw) || 1, 1), 5);
    const tierIcon = `/icons/tier-${rating}.png`;

    return (
      <div className="flex items-center gap-2 justify-center">
        <div className="w-6 h-6 relative">
          <Image
            src={tierIcon}
            alt={`Tier ${rating}`}
            width={20}
            height={20}
            className="object-contain"
            unoptimized
          />
        </div>
        <span className="text-[0.75rem] font-semibold text-gray-700">
          {rating}
        </span>
      </div>
    );
  };

  const handleOpenBookingHistory = async (item: DeletableItem) => {
    try {
      const history = await getBookingHistoryByCustomer(item.id);
      const quotations = history?.quotations || history || [];
      setBookingHistory(mapQuotationsToModal(quotations));

      try {
        const customer = await getCustomerById(item.id);
        setSelectedCustomerFull(customer);
      } catch (e) {
        setSelectedCustomerFull(null);
      }

      setIsHistoryOpen(true);
    } catch (err) {
      console.error("Failed to load booking history:", err);
      setBookingHistory([]);
      setIsHistoryOpen(true);
    }
  };

  const columnIconMap = {
    "Customer ID": <HiArrowsUpDown className="w-3 h-3" />,
    Name: <CiFilter className="w-3 h-3" />,
    Owner: <CiFilter className="w-3 h-3" />,
    Rating: <HiArrowsUpDown className="w-3 h-3" />,
    "Date Modified": <HiArrowsUpDown className="w-3 h-3" />,
  };

  // Convert item to a <td>[] row for the Table component
  const toRow = (item: DeletableItem) => [
    <td key="drag" className="px-2 py-2 text-center">
      <DragHandle />
    </td>,
    <td
      key="id"
      className="px-2 py-2 text-center font-medium text-gray-900 text-[0.75rem]"
    >
      {item.id}
    </td>,
    <td key="name" className="px-2 py-2 text-center">
      <div className="font-medium text-gray-900 text-[0.75rem]">
        {item.name}
      </div>
    </td>,
    <td
      key="owner"
      className="px-2 py-2 text-center text-gray-700 text-[0.75rem]"
    >
      {item.owner || "—"}
    </td>,
    <td key="rating" className="px-2 py-2 text-center">
      {getRatingBadge(item.rating)}
    </td>,
    <td
      key="date"
      className="px-2 py-2 text-center text-gray-700 text-[0.75rem]"
    >
      {item.dateModified || "—"}
    </td>,
    <td key="actions" className="px-2 py-2 text-center">
      <button
        type="button"
        className="bg-[#E9ECF0] text-gray-800 px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-gray-200 hover:bg-gray-200"
        onClick={async () => await handleOpenBookingHistory(item)}
      >
        <MdHistory className="inline mr-1" size={14} />
        Booking History
      </button>
    </td>,
  ];

  /* ---- data built from passed items ---- */
  const mergeIntoData = mergeIntoItems.map((i) => toRow(i));

  const mergeFromData = mergeFromItems.map((i) => toRow(i));

  const mergeIntoRowIds = mergeIntoItems.map((i) => i.id);
  const mergeFromRowIds = mergeFromItems.map((i) => i.id);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // Helper to guard indices
    const isIndexValid = (list: any[], idx: number) =>
      Number.isInteger(idx) && idx >= 0 && idx < list.length;

    // same-table reorder
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "into") {
        const updated = [...mergeIntoItems];
        if (
          !isIndexValid(updated, source.index) ||
          !isIndexValid(updated, destination.index)
        )
          return;

        const [moved] = updated.splice(source.index, 1);
        if (!moved) return; // TYPE-SAFE: moved might be undefined
        updated.splice(destination.index, 0, moved);
        setMergeIntoItems(updated);
      } else {
        const updated = [...mergeFromItems];
        if (
          !isIndexValid(updated, source.index) ||
          !isIndexValid(updated, destination.index)
        )
          return;

        const [moved] = updated.splice(source.index, 1);
        if (!moved) return;
        updated.splice(destination.index, 0, moved);
        setMergeFromItems(updated);
      }
      return;
    }

    // move between tables
    // create copies
    const sourceIsInto = source.droppableId === "into";
    const destIsInto = destination.droppableId === "into";

    const sourceList = sourceIsInto ? [...mergeIntoItems] : [...mergeFromItems];
    const destList = destIsInto ? [...mergeIntoItems] : [...mergeFromItems];

    // validate indices on source and destination (destination can be equal to destList.length for append)
    if (!isIndexValid(sourceList, source.index)) return;
    if (
      !(
        Number.isInteger(destination.index) &&
        destination.index >= 0 &&
        destination.index <= destList.length
      )
    )
      return;

    const [moved] = sourceList.splice(source.index, 1);
    if (!moved) return;

    destList.splice(destination.index, 0, moved);

    // write back to state depending on which lists were source/dest
    if (sourceIsInto) setMergeIntoItems(sourceList);
    else setMergeFromItems(sourceList);

    if (destIsInto) setMergeIntoItems(destList);
    else setMergeFromItems(destList);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Merge Customers"
      size="xl"
      className="text-[0.75rem]"
      customWidth="w-[900px]"
      customeHeight="h-fit"
    >
      {/* Note */}
      <div className="px-3 py-1 -mt-6 text-center">
        <p className="text-red-500 text-[0.7rem]">
          Note: This action cannot be undone
        </p>
      </div>

      <hr className="my-1 border-gray-200" />

      <DragDropContext onDragEnd={handleDragEnd}>
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
              enableDragAndDrop={true}
              rowIds={mergeIntoRowIds}
              droppableId="into"
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
              onSort={handleSort}
              enableDragAndDrop={true}
              rowIds={mergeFromRowIds}
              droppableId="from"
            />
          </div>

          <hr className="my-1 border-gray-200" />

          {/* Merge Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                if (!primaryItem || secondaryItems.length === 0) {
                  console.error("Select at least two customers to merge.");
                  return;
                }
                setIsConfirmationModalOpen(true);
              }}
              className={`px-5 py-2 rounded-md text-[0.75rem] font-medium text-white ${
                primaryItem && secondaryItems.length > 0
                  ? "bg-[#0D4B37] hover:bg-[#0a3a2a]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Merge
            </button>
          </div>
        </div>
      </DragDropContext>

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title={
          primaryItem && secondaryItems.length
            ? `Do you want to merge ${secondaryItems
                .map((s) => s.name || s.id)
                .join(", ")} into ${primaryItem.name || primaryItem.id}?`
            : "Select at least two customers to merge"
        }
        cancelText="Cancel"
        confirmButtonColor="bg-[#3B8132]"
        onClose={() => setIsConfirmationModalOpen(false)}
        confirmText={isMerging ? "Merging..." : "Yes, Merge"}
        onConfirm={async () => {
          try {
            if (!primaryCustomerId || secondaryCustomersId.length === 0) {
              console.error("Invalid selection for merge");
              return;
            }
            setIsMerging(true);
            await mergeCustomers({ primaryCustomerId, secondaryCustomersId });
            console.log("Customers merged successfully");
            setIsConfirmationModalOpen(false);
            onClose();
          } catch (err: any) {
            const message =
              err?.message || err?.data?.message || "Merge failed";
            console.error("Merge error:", message, err);
          } finally {
            setIsMerging(false);
          }
        }}
      />
      {isHistoryOpen && (
        <div
          className="absolute inset-0 z-[250]"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <BookingHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            bookings={bookingHistory}
            onViewCustomer={() => {
              setSideSheetMode("view");
              setIsSideSheetOpen(true);
              setIsHistoryOpen(false);
            }}
            onEditCustomer={() => {
              setSideSheetMode("edit");
              setIsSideSheetOpen(true);
              setIsHistoryOpen(false);
            }}
          />
        </div>
      )}

      {isSideSheetOpen && (
        <BookingProvider>
          <AddCustomerSideSheet
            isOpen={isSideSheetOpen}
            onCancel={() => {
              setIsSideSheetOpen(false);
              setSelectedCustomerFull(null);
              setSideSheetMode("view");
            }}
            data={selectedCustomerFull}
            mode={sideSheetMode}
          />
        </BookingProvider>
      )}
    </Modal>
  );
};

export default MergeModal;
