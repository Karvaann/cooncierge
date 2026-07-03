"use client";

import React, { useState, useEffect, useCallback, useLayoutEffect } from "react";
import { unstable_batchedUpdates } from "react-dom";
import Image from "next/image";
import { MdHistory } from "react-icons/md";
import { BOOKING_HISTORY_ACTION_BUTTON_CLASS } from "@/components/table/bookingHistoryActionStyles";
import { TbArrowsUpDown } from "react-icons/tb";
import { CiFilter } from "react-icons/ci";
import { LuMenu } from "react-icons/lu";
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
import { getVendorBookingHistory, getVendorById, mergeVendors } from "@/services/vendorApi";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import type { DeletableItem } from "./DeleteModal";

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: DeletableItem[];
  mode: "customer" | "vendor";
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier I",
  2: "Tier II",
  3: "Tier III",
};

const SOURCE_ICON_MAP: Record<string, string> = {
  meta: "/icons/source-icons/meta.svg",
  google: "/icons/source-icons/google-organic.svg",
  referral: "/icons/source-icons/referal.svg",
  seo: "/icons/source-icons/seo.svg",
  "word-of-mouth": "/icons/source-icons/word-of-mouth.svg",
};

const CUSTOMER_COLUMNS = [
  "",
  "Customer ID",
  "Name",
  "Source",
  "Tier",
  "Last Modified",
  "Booking History",
  "",
];

const VENDOR_COLUMNS = [
  "",
  "Vendor ID",
  "Vendor Name",
  "POC",
  "Date Modified",
  "Rating",
  "Booking History",
  "",
];

const CUSTOMER_COLUMN_ICONS: Record<string, React.ReactNode> = {
  Name: (
    <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
  ),
  Source: (
    <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
  ),
  Tier: (
    <span className="inline-flex items-center gap-2">
      <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
    </span>
  ),
  "Last Modified": (
    <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
  ),
};

const TABLE_HEADER_PROPS = {
  headerClassName: "bg-[#F3F3F3]",
  headerRowTextClassName: "text-[#818181]",
  headerCellTextClassName: "text-[#818181]",
  headerAlign: {
    "Customer ID": "center" as const,
    Name: "center" as const,
    Source: "center" as const,
    Tier: "center" as const,
    "Last Modified": "center" as const,
    "Booking History": "center" as const,
  },
  columnWidthClassMap: {
    "Customer ID": "w-[8rem]",
    Name: "w-[12rem]",
    Source: "w-[11rem]",
    Tier: "w-[8rem]",
    "Last Modified": "w-[9rem]",
    "Booking History": "w-[10rem]",
  },
};

const DragHandle = () => (
  <div className="flex cursor-grab items-center justify-center text-[#818181]">
    <LuMenu size={16} />
  </div>
);

const MergeModal: React.FC<MergeModalProps> = ({
  isOpen,
  onClose,
  items = [],
  mode,
}) => {
  const columns = mode === "vendor" ? VENDOR_COLUMNS : CUSTOMER_COLUMNS;

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const [mergeIntoItems, setMergeIntoItems] = useState<DeletableItem[]>([]);
  const [mergeFromItems, setMergeFromItems] = useState<DeletableItem[]>([]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    if (items.length > 0) {
      setMergeIntoItems([items[0]!]);
      setMergeFromItems(items.slice(1));
    } else {
      setMergeIntoItems([]);
      setMergeFromItems([]);
    }
  }, [isOpen, items]);

  const primaryItem = mergeIntoItems.length > 0 ? mergeIntoItems[0] : null;
  const secondaryItems = mergeFromItems;

  const handleSort = (column: string) => {
    if (column === "Tier" || column === "Last Modified" || column === "Rating" || column === "Date Modified") {
      setMergeFromItems((prev) => [...prev].reverse());
    }
  };

  const primaryId = primaryItem?.mongoId || primaryItem?.id;
  const secondaryIds = secondaryItems.map((i) => i.mongoId || i.id);

  // Booking history / sidesheet state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [selectedCustomerFull, setSelectedCustomerFull] = useState<any | null>(
    null,
  );
  const [selectedVendorFull, setSelectedVendorFull] = useState<any | null>(
    null,
  );
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetMode, setSideSheetMode] = useState<"view" | "edit">("view");
  const [mergeIntoPage, setMergeIntoPage] = useState(1);
  const [mergeIntoRowsPerPage, setMergeIntoRowsPerPage] = useState(8);
  const [mergeFromPage, setMergeFromPage] = useState(1);
  const [mergeFromRowsPerPage, setMergeFromRowsPerPage] = useState(8);

  const getRecordId = (item: DeletableItem) => item.mongoId || item.id;

  const getTierBadge = (tier?: number) => {
    const rating = Math.min(Math.max(Math.round(tier || 2), 1), 3);
    const tierIcon = `/icons/tier-${rating}.svg`;
    const tierLabel = TIER_LABELS[rating] ?? `Tier ${rating}`;

    return (
      <div className="flex items-center justify-center gap-2">
        <div className="relative h-5 w-5">
          <Image
            src={tierIcon}
            alt={tierLabel}
            width={20}
            height={20}
            className="object-contain"
            unoptimized
          />
        </div>
        <span className="text-[#414141]">{tierLabel}</span>
      </div>
    );
  };

  const renderNameCell = (item: DeletableItem) => (
    <div className="mx-auto w-fit text-center">
      <div className="font-[500] text-[#020202]">{item.name || "—"}</div>
      {item.subtitle ? (
        <div className="table-cell-subtext mt-0.5 text-[#818181]">
          {item.subtitle}
        </div>
      ) : null}
    </div>
  );

  const renderSource = (source?: DeletableItem["source"]) => {
    if (!source || source.type === "none") {
      return <span className="text-[#414141]">—</span>;
    }

    const iconSrc = SOURCE_ICON_MAP[source.type];
    if (!iconSrc) {
      return <span className="text-[#414141]">{source.label}</span>;
    }

    return (
      <div className="mx-auto flex flex-col items-center justify-center gap-1">
        <Image
          src={iconSrc}
          alt={source.label}
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 object-contain"
          unoptimized
        />
        <span className="text-center font-[400] text-[#414141]">{source.label}</span>
      </div>
    );
  };

  const handleRemoveItem = useCallback(
    (list: "into" | "from", itemId: string) => {
      if (list === "into") {
        const removed = mergeIntoItems.find((item) => item.id === itemId);
        const nextInto = mergeIntoItems.filter((item) => item.id !== itemId);
        if (nextInto.length === 0 && mergeFromItems.length > 0) {
          const [promoted, ...rest] = mergeFromItems;
          setMergeIntoItems(promoted ? [promoted] : []);
          setMergeFromItems(removed ? [removed, ...rest] : rest);
          return;
        }
        setMergeIntoItems(nextInto);
        if (removed) {
          setMergeFromItems((prev) => [...prev, removed]);
        }
        return;
      }

      setMergeFromItems((prev) => prev.filter((item) => item.id !== itemId));
    },
    [mergeFromItems, mergeIntoItems],
  );

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


  const handleOpenBookingHistory = async (item: DeletableItem) => {
    const recordId = getRecordId(item);

    try {
      if (mode === "vendor") {
        const resp = await getVendorBookingHistory(recordId, {
          sortBy: "createdAt",
          sortOrder: "desc",
          page: 1,
          limit: 10,
        } as any);
        const quotations = resp?.quotations || resp || [];
        setBookingHistory(mapQuotationsToModal(quotations));

        try {
          const vendor = await getVendorById(recordId);
          setSelectedVendorFull(vendor);
        } catch {
          setSelectedVendorFull(null);
        }

        setIsHistoryOpen(true);
        return;
      }

      const history = await getBookingHistoryByCustomer(recordId);
      const quotations = history?.quotations || history || [];
      setBookingHistory(mapQuotationsToModal(quotations));

      try {
        const customer = await getCustomerById(recordId);
        setSelectedCustomerFull(customer);
      } catch {
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
            <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181]" />
          ),
          POC: (
            <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181]" />
          ),
          Rating: (
            <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181]" />
          ),
          "Date Modified": (
            <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181]" />
          ),
        }
      : CUSTOMER_COLUMN_ICONS;

  const renderRemoveButton = (list: "into" | "from", item: DeletableItem) => (
    <button
      type="button"
      onClick={() => handleRemoveItem(list, item.id)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#818181] transition-colors hover:bg-[#F3F3F3] hover:text-[#414141]"
      aria-label={`Remove ${item.name || item.id}`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );

  const toRow = (item: DeletableItem, list: "into" | "from") => {
    if (mode === "vendor") {
      const displayName = item.vendorName || item.name || "—";
      const displayPOC = item.poc || item.owner || "—";
      const displayDate = item.dateModified || "—";

      return [
        <td key="drag" className="h-[4rem] px-3 py-3 text-center align-middle">
          <DragHandle />
        </td>,
        <td
          key="id"
          className="h-[4rem] px-4 py-3 text-center align-middle font-medium text-[#020202]"
        >
          {item.id}
        </td>,
        <td key="vendorName" className="h-[4rem] px-4 py-3 text-center align-middle">
          <div className="font-[500] text-[#020202]">{displayName}</div>
        </td>,
        <td
          key="poc"
          className="h-[4rem] px-4 py-3 text-center align-middle text-[#414141]"
        >
          {displayPOC}
        </td>,
        <td
          key="date"
          className="h-[4rem] px-4 py-3 text-center align-middle text-[#414141]"
        >
          {displayDate}
        </td>,
        <td key="rating" className="h-[4rem] px-4 py-3 text-center align-middle">
          {getTierBadge(item.rating)}
        </td>,
        <td key="history" className="h-[4rem] px-4 py-3 text-center align-middle">
          <button
            type="button"
            className={BOOKING_HISTORY_ACTION_BUTTON_CLASS}
            onClick={() => void handleOpenBookingHistory(item)}
          >
            <MdHistory size={14} />
            Booking History
          </button>
        </td>,
        <td key="remove" className="h-[4rem] px-3 py-3 text-center align-middle">
          {renderRemoveButton(list, item)}
        </td>,
      ];
    }

    return [
      <td key="drag" className="h-[4rem] px-3 py-3 text-center align-middle">
        <DragHandle />
      </td>,
      <td
        key="id"
        className="h-[4rem] px-4 py-3 text-center align-middle font-medium text-[#020202]"
      >
        {item.id}
      </td>,
      <td key="name" className="h-[4rem] px-4 py-3 text-center align-middle">
        {renderNameCell(item)}
      </td>,
      <td key="source" className="h-[4rem] px-4 py-3 text-center align-middle">
        {renderSource(item.source)}
      </td>,
      <td key="tier" className="h-[4rem] px-4 py-3 text-center align-middle">
        {getTierBadge(item.rating)}
      </td>,
      <td
        key="date"
        className="h-[4rem] px-4 py-3 text-center align-middle text-[#414141]"
      >
        {item.dateModified || "—"}
      </td>,
      <td key="history" className="h-[4rem] px-4 py-3 text-center align-middle">
        <button
          type="button"
          className={BOOKING_HISTORY_ACTION_BUTTON_CLASS}
          onClick={() => void handleOpenBookingHistory(item)}
        >
          <MdHistory size={14} />
          Booking History
        </button>
      </td>,
      <td key="remove" className="h-[4rem] px-3 py-3 text-center align-middle">
        {renderRemoveButton(list, item)}
      </td>,
    ];
  };

  const mergeIntoData = mergeIntoItems.map((item) => toRow(item, "into"));
  const mergeFromData = mergeFromItems.map((item) => toRow(item, "from"));

  const mergeIntoRowIds = mergeIntoItems.map((i) => i.id);
  const mergeFromRowIds = mergeFromItems.map((i) => i.id);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const getPaginationForDroppable = (droppableId: string) =>
      droppableId === "into"
        ? { page: mergeIntoPage, rowsPerPage: mergeIntoRowsPerPage }
        : { page: mergeFromPage, rowsPerPage: mergeFromRowsPerPage };

    const getSourceIndex = (
      droppableId: string,
      index: number,
      len: number,
    ) => {
      const { page, rowsPerPage } = getPaginationForDroppable(droppableId);
      const globalIndex = (page - 1) * rowsPerPage + index;
      if (
        !Number.isInteger(globalIndex) ||
        globalIndex < 0 ||
        globalIndex >= len
      )
        return null;
      return globalIndex;
    };

    const getDestinationIndex = (
      droppableId: string,
      index: number,
      len: number,
    ) => {
      const { page, rowsPerPage } = getPaginationForDroppable(droppableId);
      const globalIndex = (page - 1) * rowsPerPage + index;
      if (!Number.isInteger(globalIndex) || globalIndex < 0) return null;
      return Math.min(globalIndex, len);
    };

    // same-table reorder
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === "into") {
        const updated = [...mergeIntoItems];
        const sourceIndex = getSourceIndex(
          source.droppableId,
          source.index,
          updated.length,
        );
        const destinationIndex = getDestinationIndex(
          destination.droppableId,
          destination.index,
          updated.length,
        );
        if (sourceIndex == null || destinationIndex == null) return;

        const [moved] = updated.splice(sourceIndex, 1);
        if (!moved) return;
        updated.splice(destinationIndex, 0, moved);
        setMergeIntoItems(updated);
      } else {
        const updated = [...mergeFromItems];
        const sourceIndex = getSourceIndex(
          source.droppableId,
          source.index,
          updated.length,
        );
        const destinationIndex = getDestinationIndex(
          destination.droppableId,
          destination.index,
          updated.length,
        );
        if (sourceIndex == null || destinationIndex == null) return;

        const [moved] = updated.splice(sourceIndex, 1);
        if (!moved) return;
        updated.splice(destinationIndex, 0, moved);
        setMergeFromItems(updated);
      }
      return;
    }

    // move between tables with swap logic enforcing max 1 item in mergeIntoItems
    const sourceIsInto = source.droppableId === "into";
    const destIsInto = destination.droppableId === "into";

    const sourceList = sourceIsInto ? [...mergeIntoItems] : [...mergeFromItems];
    const destList = destIsInto ? [...mergeIntoItems] : [...mergeFromItems];

    const sourceIndex = getSourceIndex(
      source.droppableId,
      source.index,
      sourceList.length,
    );
    const destinationIndex = getDestinationIndex(
      destination.droppableId,
      destination.index,
      destList.length,
    );
    if (sourceIndex == null || destinationIndex == null) return;

    const [moved] = sourceList.splice(sourceIndex, 1);
    if (!moved) return;

    // If destination is the 'into' table, enforce only one item there.
    if (destIsInto) {
      // If 'into' is empty, simply place moved there.
      if (destList.length === 0) {
        destList.splice(destinationIndex, 0, moved);

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
      const insertIndexInto = Math.min(destinationIndex, destList.length);
      destList.splice(insertIndexInto, 0, moved);

      // insert previousInto into sourceList at the original source.index position
      const insertIndexSource = Math.min(sourceIndex, sourceList.length);
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
    destList.splice(destinationIndex, 0, moved);

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
      customWidth="w-[min(1100px,calc(100vw-2rem))]"
      customeHeight="h-fit"
      zIndexClass="z-[9999]"
    >
      <div className="pb-2 text-center">
        <p className="font-[Poppins,sans-serif] text-[13px] text-[#DD1425]">
          Note : This action cannot be undone
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-[Poppins,sans-serif] text-[14px] font-medium text-[#020202]">
              Merge Into
            </h3>
            <Table
              data={mergeIntoData}
              columns={columns}
              initialRowsPerPage={8}
              maxRowsPerPageOptions={[8, 16, 24, 48]}
              columnIconMap={columnIconMap}
              enableDragAndDrop={true}
              rowIds={mergeIntoRowIds}
              droppableId="into"
              categoryName={mode === "customer" ? "Customers" : "Vendors"}
              onPaginationChange={(page, rowsPerPage) => {
                setMergeIntoPage(page);
                setMergeIntoRowsPerPage(rowsPerPage);
              }}
              {...(mode === "customer" ? TABLE_HEADER_PROPS : {
                headerClassName: "bg-[#F3F3F3]",
                headerRowTextClassName: "text-[#818181]",
                headerCellTextClassName: "text-[#818181]",
              })}
            />
          </div>

          <div>
            <h3 className="mb-3 font-[Poppins,sans-serif] text-[14px] font-medium text-[#020202]">
              Merge From
            </h3>
            <Table
              data={mergeFromData}
              columns={columns}
              initialRowsPerPage={8}
              maxRowsPerPageOptions={[8, 16, 24, 48]}
              columnIconMap={columnIconMap}
              onSort={handleSort}
              enableDragAndDrop={true}
              rowIds={mergeFromRowIds}
              droppableId="from"
              categoryName={mode === "customer" ? "Customers" : "Vendors"}
              onPaginationChange={(page, rowsPerPage) => {
                setMergeFromPage(page);
                setMergeFromRowsPerPage(rowsPerPage);
              }}
              {...(mode === "customer" ? TABLE_HEADER_PROPS : {
                headerClassName: "bg-[#F3F3F3]",
                headerRowTextClassName: "text-[#818181]",
                headerCellTextClassName: "text-[#818181]",
              })}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                if (!primaryItem || secondaryItems.length === 0) {
                  console.error("Select at least two customers to merge.");
                  return;
                }
                setIsConfirmationModalOpen(true);
              }}
              className={`rounded-[10px] px-5 py-2.5 font-[Poppins,sans-serif] text-[14px] font-medium text-white transition-colors ${
                primaryItem && secondaryItems.length > 0
                  ? "bg-[#7135AD] hover:bg-[#5C2B8E]"
                  : "cursor-not-allowed bg-[#C9A8E8]"
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
