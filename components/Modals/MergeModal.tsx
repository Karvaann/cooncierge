"use client";

import React, { useState, useEffect } from "react";
import { unstable_batchedUpdates } from "react-dom";
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
import AddVendorSideSheet from "@/components/Sidesheets/AddVendorSideSheet";
import { BookingProvider } from "@/context/BookingContext";
import {
  mergeCustomers,
  getBookingHistoryByCustomer,
  getCustomerById,
} from "@/services/customerApi";
import { getVendorBookingHistory, getVendorById } from "@/services/vendorApi";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { mergeVendors } from "@/services/vendorApi";
import { LuMenu } from "react-icons/lu";

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: DeletableItem[]; // selected customers passed from parent menu
  mode: "customer" | "vendor";
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
  <div className="flex items-center justify-center text-gray-400 cursor-grab">
    <LuMenu size={16} />
  </div>
);

const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  items = [],
  mode,
}) => {
  const columns =
    mode === "vendor"
      ? [
          "",
          "Vendor ID",
          "Vendor Name",
          "POC",
          "Date Modified",
          "Rating",
          "Actions",
        ]
      : [
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

  // sync local state when items prop changes
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
    if (mode === "vendor") {
      if (column === "Rating" || column === "Date Modified") {
        setMergeFromItems((prev) => [...prev].reverse());
      }
      return;
    }

    if (
      column === "Customer ID" ||
      column === "Rating" ||
      column === "Date Modified"
    ) {
      setMergeFromItems((prev) => [...prev].reverse());
    }
  };

  const primaryId = primaryItem?.id;
  const secondaryIds = secondaryItems.map((i) => i.id);

  // Booking history / sidesheet state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [selectedCustomerFull, setSelectedCustomerFull] = useState<any | null>(
    null
  );
  const [selectedVendorFull, setSelectedVendorFull] = useState<any | null>(
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
      if (mode === "vendor") {
        // vendor booking history
        const resp = await getVendorBookingHistory(item.id, {
          sortBy: "createdAt",
          sortOrder: "desc",
          page: 1,
          limit: 10,
        } as any);
        const quotations = resp?.quotations || resp || [];
        setBookingHistory(mapQuotationsToModal(quotations));

        try {
          const vendor = await getVendorById(item.id);
          setSelectedVendorFull(vendor);
        } catch (e) {
          setSelectedVendorFull(null);
        }

        setIsHistoryOpen(true);
        return;
      }

      // default: customer
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

  const columnIconMap =
    mode === "vendor"
      ? {
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
        }
      : {
          "Customer ID": <HiArrowsUpDown className="w-3 h-3" />,
          Name: <CiFilter className="w-3 h-3" />,
          Owner: <CiFilter className="w-3 h-3" />,
          Rating: <HiArrowsUpDown className="w-3 h-3" />,
          "Date Modified": <HiArrowsUpDown className="w-3 h-3" />,
        };

  // Convert item to a <td> row for the Table component
  const toRow = (item: DeletableItem) => {
    const displayName = (item as any).vendorName || item.name || "—";
    const displayPOC = (item as any).poc || item.owner || "—";
    const displayDate = item.dateModified || "—";

    if (mode === "vendor") {
      return [
        <td key="drag" className="px-2 py-2 text-center">
          <DragHandle />
        </td>,
        <td
          key="id"
          className="px-2 py-2 text-center font-medium text-gray-900 text-[0.75rem]"
        >
          {item.id}
        </td>,
        <td key="vendorName" className="px-2 py-2 text-center">
          <div className="font-medium text-gray-900 text-[0.75rem]">
            {displayName}
          </div>
        </td>,
        <td
          key="poc"
          className="px-2 py-2 text-center text-gray-700 text-[0.75rem]"
        >
          {displayPOC}
        </td>,
        <td
          key="date"
          className="px-2 py-2 text-center text-gray-700 text-[0.75rem]"
        >
          {displayDate}
        </td>,
        <td key="rating" className="px-2 py-2 text-center">
          {getRatingBadge(item.rating)}
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
    }

    return [
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
  };

  /*  data built from passed items  */
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
        if (!moved) return;
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

    // move between tables with swap logic enforcing max 1 item in mergeIntoItems
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

    // If destination is the 'into' table, enforce only one item there.
    if (destIsInto) {
      // If 'into' is empty, simply place moved there.
      if (destList.length === 0) {
        destList.splice(destination.index, 0, moved);

        // batch state updates to avoid intermediate re-renders
        unstable_batchedUpdates(() => {
          if (sourceIsInto) setMergeIntoItems(sourceList);
          else setMergeFromItems(sourceList);

          setMergeIntoItems(destList);
        });

        return;
      }
      const previousInto = destList[0]!;
      // remove previous from dest
      destList.splice(0, 1);

      // insert moved into dest
      const insertIndexInto = Math.min(destination.index, destList.length);
      destList.splice(insertIndexInto, 0, moved);

      // insert previousInto into sourceList at the original source.index position
      const insertIndexSource = Math.min(source.index, sourceList.length);
      sourceList.splice(insertIndexSource, 0, previousInto);

      // batch state updates to avoid flicker during swap
      unstable_batchedUpdates(() => {
        if (sourceIsInto) setMergeIntoItems(sourceList);
        else setMergeFromItems(sourceList);

        setMergeIntoItems(destList);
      });

      return;
    }

    // Normal move into `from` table (dest is not into)
    destList.splice(destination.index, 0, moved);

    // batch final writes to state to avoid visual jank
    unstable_batchedUpdates(() => {
      if (sourceIsInto) setMergeIntoItems(sourceList);
      else setMergeFromItems(sourceList);

      if (destIsInto) setMergeIntoItems(destList);
      else setMergeFromItems(destList);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "customer" ? "Merge Customers" : "Merge Vendors"}
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
              enableDragAndDrop={true}
              rowIds={mergeIntoRowIds}
              droppableId="into"
              categoryName={mode === "customer" ? "Customers" : "Vendors"}
              hideEntriesText={true}
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
              onSort={handleSort}
              enableDragAndDrop={true}
              rowIds={mergeFromRowIds}
              droppableId="from"
              headerClassName="bg-blue-900"
              categoryName={mode === "customer" ? "Customers" : "Vendors"}
              sortableHeaderHoverClass="bg-blue-800"
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
            : mode === "customer"
            ? "Select at least two customers to merge"
            : "Select at least two vendors to merge"
        }
        cancelText="Cancel"
        confirmButtonColor="bg-[#3B8132]"
        onClose={() => setIsConfirmationModalOpen(false)}
        confirmText={isMerging ? "Merging..." : "Yes, Merge"}
        onConfirm={async () => {
          try {
            if (!primaryId || secondaryIds.length === 0) {
              console.error("Invalid selection for merge");
              return;
            }

            setIsMerging(true);

            if (mode === "customer") {
              await mergeCustomers({
                primaryCustomerId: primaryId,
                secondaryCustomersId: secondaryIds,
              });
              console.log("Customers merged successfully");
            }

            if (mode === "vendor") {
              await mergeVendors({
                primaryVendorId: primaryId,
                secondaryVendorsId: secondaryIds,
              });
              console.log("Vendors merged successfully");
            }

            setIsConfirmationModalOpen(false);
            onClose();
          } catch (err: any) {
            console.error("Merge Error:", err?.message || "Merge failed", err);
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
            recordName={
              mode === "vendor"
                ? selectedVendorFull?.companyName ||
                  selectedVendorFull?.name ||
                  selectedVendorFull?.vendorName ||
                  "—"
                : selectedCustomerFull?.name ||
                  selectedCustomerFull?.companyName ||
                  selectedCustomerFull?.vendorName ||
                  "—"
            }
            recordId={
              mode === "vendor"
                ? selectedVendorFull?._id ||
                  selectedVendorFull?.vendorID ||
                  selectedVendorFull?.id ||
                  "—"
                : selectedCustomerFull?._id ||
                  selectedCustomerFull?.customerID ||
                  selectedCustomerFull?.id ||
                  "—"
            }
            onViewCustomer={async () => {
              // open appropriate side sheet depending on mode
              if (mode === "vendor") {
                // ensure vendor data exists (was set when opening history)
                setSideSheetMode("view");
                setIsSideSheetOpen(true);
                setIsHistoryOpen(false);
                return;
              }

              // customer flow
              setSideSheetMode("view");
              setIsSideSheetOpen(true);
              setIsHistoryOpen(false);
            }}
            onEditCustomer={async () => {
              if (mode === "vendor") {
                setSideSheetMode("edit");
                setIsSideSheetOpen(true);
                setIsHistoryOpen(false);
                return;
              }

              setSideSheetMode("edit");
              setIsSideSheetOpen(true);
              setIsHistoryOpen(false);
            }}
          />
        </div>
      )}

      {isSideSheetOpen && (
        <BookingProvider>
          {mode === "vendor" ? (
            <AddVendorSideSheet
              isOpen={isSideSheetOpen}
              onCancel={() => {
                setIsSideSheetOpen(false);
                setSelectedVendorFull(null);
                setSideSheetMode("view");
              }}
              data={selectedVendorFull}
              mode={sideSheetMode}
            />
          ) : (
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
          )}
        </BookingProvider>
      )}
    </Modal>
  );
};

export default MergeModal;
