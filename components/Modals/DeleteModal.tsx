"use client";

import React, { useMemo, useState, useCallback } from "react";
import Modal from "@/components/Modal";
import Table from "@/components/Table";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import {
  deleteCustomer,
  getBookingHistoryByCustomer,
  getCustomerById,
} from "@/services/customerApi";
import { deleteVendor, getVendorById } from "@/services/vendorApi";
import { getVendorBookingHistory } from "@/services/vendorApi";
import {
  deleteTeam,
  getBookingHistoryByTeamMember,
  getTeamById,
} from "@/services/teamsApi";
import {
  deleteTraveller,
  getTravellerBookingHistory,
  getTravellerById,
} from "@/services/travellerApi";
import { MdHistory } from "react-icons/md";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import AddVendorSideSheet from "@/components/Sidesheets/AddVendorSideSheet";
import AddTeamSideSheet from "@/components/Sidesheets/AddTeamSideSheet";
import AddNewTravellerForm from "@/components/forms/AddNewForms/AddNewTravellerForm";
import { BookingProvider } from "@/context/BookingContext";
import { CiFilter } from "react-icons/ci";
import { HiArrowsUpDown } from "react-icons/hi2";
import type { JSX } from "react";
import Image from "next/image";

type EntityType = "customer" | "vendor" | "team" | "traveller";

export interface DeletableItem {
  id: string;
  // shared
  name?: string; // customer name / vendorName / memberName fallback
  avatar?: string;
  subtitle?: string;
  owner?: string; // customer owner
  rating?: number; // customer/vendor rating
  dateModified?: string; // customer date modified / vendor date modified
  dateCreated?: string; // traveller date created
  isLinked?: boolean; // legacy flag (kept if upstream still passes)
  isDeletable?: boolean; // new flag controlling deletion permission
  // vendor specific
  vendorName?: string;
  poc?: string;
  // team specific
  memberName?: string;
  alias?: string;
  userStatus?: string;
  joiningDate?: string;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeletableItem[];
  entity: EntityType;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  items,
  entity,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking history states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<DeletableItem | null>(null);

  // Sidesheet states
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit" | "view">("view");
  const [fullEntityData, setFullEntityData] = useState<any | null>(null);

  // Close handler that won't propagate when history is open
  const handleDeleteModalClose = useCallback(() => {
    if (!isHistoryOpen && !isSideSheetOpen) {
      onClose();
    }
  }, [isHistoryOpen, isSideSheetOpen, onClose]);

  const formatDMY = useCallback((dateString: string) => {
    const direct = new Date(dateString);
    if (!isNaN(direct.getTime())) {
      const day = String(direct.getDate()).padStart(2, "0");
      const month = String(direct.getMonth() + 1).padStart(2, "0");
      const year = direct.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dateString || "—";
  }, []);

  const mapStatusForModal = useCallback((status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Successful" as const;
      case "cancelled":
        return "Cancelled" as const;
      case "draft":
      default:
        return "In Progress" as const;
    }
  }, []);

  const mapQuotationsToModal = useCallback(
    (qs: any[]) =>
      qs.map((q: any) => ({
        id: q.customId || q._id,
        bookingDate: q.createdAt ? formatDMY(q.createdAt) : "—",
        travelDate: q.travelDate ? String(q.travelDate) : "",
        status: mapStatusForModal(q.status),
        amount: q.totalAmount != null ? String(q.totalAmount) : "0",
      })),
    [mapStatusForModal, formatDMY]
  );

  const handleOpenBookingHistory = useCallback(
    async (item: DeletableItem) => {
      try {
        setSelectedItem(item);
        let quotations: any[] = [];

        switch (entity) {
          case "customer":
            const customerHistory = await getBookingHistoryByCustomer(item.id);
            quotations = customerHistory.quotations || [];
            // Fetch full customer data for sidesheet
            const customerData = await getCustomerById(item.id);
            setFullEntityData(customerData);
            break;
          case "vendor":
            const vendorHistory = await getVendorBookingHistory(item.id, {
              sortBy: "createdAt",
              sortOrder: "desc",
              page: 1,
              limit: 10,
            });
            quotations = vendorHistory?.quotations || [];
            // Fetch full vendor data for sidesheet
            const vendorData = await getVendorById(item.id);
            setFullEntityData(vendorData);
            break;
          case "team":
            const teamHistory = await getBookingHistoryByTeamMember(item.id);
            quotations = teamHistory.quotations || [];
            // Fetch full team member data for sidesheet
            const teamData = await getTeamById(item.id);
            setFullEntityData(teamData);
            break;
          case "traveller":
            const travellerHistory = await getTravellerBookingHistory(item.id, {
              sortBy: "createdAt",
              sortOrder: "desc",
              page: 1,
              limit: 10,
            });
            quotations = travellerHistory?.quotations || [];
            // Fetch full traveller data for sidesheet
            const travellerData = await getTravellerById(item.id);
            setFullEntityData(travellerData);
            break;
        }

        setBookingHistory(mapQuotationsToModal(quotations));
        setIsHistoryOpen(true);
      } catch (err) {
        console.error(`Failed to load ${entity} booking history:`, err);
        setBookingHistory([]);
        setIsHistoryOpen(true);
      }
    },
    [entity, mapQuotationsToModal]
  );

  const deletableItems = useMemo(
    () => (items || []).filter((i) => i.isDeletable !== false),
    [items]
  );
  const nonDeletableItems = useMemo(
    () => (items || []).filter((i) => i.isDeletable === false),
    [items]
  );

  const performDeletion = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const promises = deletableItems.map((item) => {
        switch (entity) {
          case "customer":
            return deleteCustomer(item.id);
          case "vendor":
            return deleteVendor(item.id);
          case "team":
            return deleteTeam(item.id);
          case "traveller":
            return deleteTraveller(item.id);
          default:
            return Promise.resolve();
        }
      });
      await Promise.allSettled(promises); // swallow individual failures, could surface later
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to delete selected entries");
    } finally {
      setIsProcessing(false);
      setShowConfirm(false);
    }
  }, [deletableItems, entity, onClose]);

  const handlePrimaryDeleteClick = () => {
    if (nonDeletableItems.length === 0) {
      // all deletable -> immediate deletion
      performDeletion();
    } else {
      // need confirmation modal
      setShowConfirm(true);
    }
  };

  const getRatingBadge = (ratingString: string | number) => {
    const ratingRaw =
      typeof ratingString === "string"
        ? ratingString.match(/⭐️/g)?.length || Number(ratingString)
        : Number(ratingString);

    const rating = Math.min(Math.max(Math.round(ratingRaw), 1), 5);

    const tierIcon = `/icons/tier-${rating}.png`;

    return (
      <div className="flex items-center gap-2 justify-center">
        {/* Your custom tier icon */}
        <div className="w-6 h-6 relative">
          <Image
            src={tierIcon}
            alt={`Tier ${rating}`}
            width={20}
            height={20}
            className="object-contain"
            unoptimized // Important for local PNGs served from /public
          />
        </div>
        <span className="text-[0.75rem] font-semibold text-gray-700">
          {rating}
        </span>
      </div>
    );
  };

  const [sortedItems, setSortedItems] = useState<DeletableItem[]>(items);

  // Update sorted items when items prop changes
  useMemo(() => {
    setSortedItems(items);
  }, [items]);

  const handleSort = useCallback((column: string) => {
    setSortedItems((prev) => {
      const sorted = [...prev];

      if (column === "Rating") {
        sorted.reverse();
      } else if (column === "Date Modified" || column === "Joining Date") {
        sorted.reverse();
      }

      return sorted;
    });
  }, []);

  const columnIconMap: Record<string, JSX.Element> = useMemo(() => {
    if (entity === "customer") {
      return {
        Name: (
          <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        Owner: (
          <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        Rating: (
          <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        "Date Modified": (
          <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
      };
    }
    if (entity === "vendor") {
      return {
        "Vendor Name": (
          <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        POC: (
          <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        "Date Modified": (
          <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        Rating: (
          <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
      };
    }
    if (entity === "team") {
      return {
        "Member Name": (
          <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        "User Status": (
          <CiFilter className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
        "Joining Date": (
          <HiArrowsUpDown className="inline w-3 h-3 text-white font-semibold stroke-[1]" />
        ),
      };
    }
    return {};
  }, [entity]);

  const columns = useMemo(() => {
    if (entity === "customer") {
      return ["ID", "Name", "Owner", "Rating", "Date Modified", "Actions"];
    }
    if (entity === "vendor") {
      return [
        "Vendor ID",
        "Vendor Name",
        "POC",
        "Date Modified",
        "Rating",
        "Actions",
      ];
    }
    if (entity === "traveller") {
      return ["ID", "Name", "Owner", "Date Created", "Actions"];
    }
    return [
      "ID",
      "Member Name",
      "Alias",
      "User Status",
      "Joining Date",
      "Actions",
    ];
  }, [entity]);

  const tableData = useMemo(() => {
    if (!sortedItems) return [];
    return sortedItems.map((item) => {
      const actionsCell = (
        <td
          key={`${item.id}-actions`}
          className="px-3 py-1.5 text-center justify-center text-[0.75rem]"
        >
          <button
            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-[0.7rem] transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenBookingHistory(item);
            }}
            type="button"
          >
            <MdHistory className="inline" size={14} />
            Booking History
          </button>
        </td>
      );

      if (entity === "customer") {
        return [
          <td
            key={`${item.id}-id`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            <div className="flex items-center justify-center gap-2">
              {item.isDeletable === false && (
                <svg
                  className="w-4 h-4 text-red-500 fill-current"
                  viewBox="0 0 24 24"
                  aria-label="Cannot delete"
                >
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z" />
                </svg>
              )}
              <span>{item.id}</span>
            </div>
          </td>,
          <td
            key={`${item.id}-name`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.name || "—"}
          </td>,
          <td
            key={`${item.id}-owner`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.owner || "—"}
          </td>,
          <td
            key={`${item.id}-rating`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {getRatingBadge(item.rating || 0)}
          </td>,
          <td
            key={`${item.id}-date`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.dateModified || "—"}
          </td>,

          actionsCell,
        ];
      }
      if (entity === "vendor") {
        return [
          <td
            key={`${item.id}-id`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            <div className="flex items-center justify-center gap-2">
              {item.isDeletable === false && (
                <svg
                  className="w-4 h-4 text-red-500 fill-current"
                  viewBox="0 0 24 24"
                  aria-label="Cannot delete"
                >
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z" />
                </svg>
              )}
              <span>{item.id}</span>
            </div>
          </td>,
          <td
            key={`${item.id}-vendorName`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.vendorName || item.name || "—"}
          </td>,
          <td
            key={`${item.id}-poc`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.poc || item.owner || "—"}
          </td>,
          <td
            key={`${item.id}-dateModified`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.dateModified || "—"}
          </td>,
          <td
            key={`${item.id}-rating`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {getRatingBadge(item.rating || 0)}
          </td>,
          actionsCell,
        ];
      }
      if (entity === "traveller") {
        return [
          <td
            key={`${item.id}-id`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            <div className="flex items-center justify-center gap-2">
              {item.isDeletable === false && (
                <svg
                  className="w-4 h-4 text-red-500 fill-current"
                  viewBox="0 0 24 24"
                  aria-label="Cannot delete"
                >
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z" />
                </svg>
              )}
              <span>{item.id}</span>
            </div>
          </td>,
          <td
            key={`${item.id}-name`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.name || "—"}
          </td>,
          <td
            key={`${item.id}-owner`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.owner || "—"}
          </td>,
          <td
            key={`${item.id}-dateCreated`}
            className="px-3 py-1.5 text-center text-[0.75rem]"
          >
            {item.dateCreated || "—"}
          </td>,
          actionsCell,
        ];
      }
      // team
      return [
        <td
          key={`${item.id}-id`}
          className="px-3 py-1.5 text-center text-[0.75rem]"
        >
          <div className="flex items-center justify-center gap-2">
            {item.isDeletable === false && (
              <svg
                className="w-4 h-4 text-red-500 fill-current"
                viewBox="0 0 24 24"
                aria-label="Cannot delete"
              >
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z" />
              </svg>
            )}
            <span>{item.id}</span>
          </div>
        </td>,
        <td
          key={`${item.id}-memberName`}
          className="px-3 py-1.5 text-center text-[0.75rem]"
        >
          {item.memberName || item.name || "—"}
        </td>,
        <td
          key={`${item.id}-alias`}
          className="px-3 py-1.5 text-center text-[0.75rem]"
        >
          {item.alias || "—"}
        </td>,
        <td
          key={`${item.id}-userStatus`}
          className="px-3 py-1.5 text-center text-[0.75rem]"
        >
          {item.userStatus || "—"}
        </td>,
        <td
          key={`${item.id}-joiningDate`}
          className="px-3 py-1.5 text-center text-[0.75rem]"
        >
          {item.joiningDate || "—"}
        </td>,
        actionsCell,
      ];
    });
  }, [sortedItems, entity]);
  const nonDeletableIds = useMemo(
    () => nonDeletableItems.map((c) => c.id),
    [nonDeletableItems]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Modal
        isOpen={isOpen}
        onClose={handleDeleteModalClose}
        title={
          entity === "customer"
            ? "Delete Customers"
            : entity === "vendor"
            ? "Delete Vendors"
            : entity === "traveller"
            ? "Delete Travellers"
            : "Delete Team Members"
        }
        customWidth="w-[60vw]"
        customeHeight="h-fit"
        className="max-w-[1100px]"
        closeOnOverlayClick={true}
        closeOnEscape={!isHistoryOpen && !isSideSheetOpen}
        zIndexClass={"z-[100]"}
        disableOverlayClick={isHistoryOpen || isSideSheetOpen}
      >
        <div className="flex h-full flex-col -mt-5 px-2 pb-1 text-[0.75rem] overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="text-center text-red-500 text-[0.75rem] font-medium mb-3">
              Note : This action cannot be undone
            </div>

            <div className="min-h-0">
              <Table
                data={tableData}
                columns={columns}
                columnIconMap={columnIconMap}
                onSort={handleSort}
                initialRowsPerPage={5}
                maxRowsPerPageOptions={[5, 10, 25, 50]}
                hideRowsPerPage={false}
              />
            </div>

            {/* Warning moved to footer next to Delete button */}
          </div>

          <div className="flex justify-end items-center gap-4 pt-3 bg-white shrink-0">
            {nonDeletableItems.length > 0 && (
              <div className="flex items-center text-red-500 text-[0.7rem] gap-1">
                <span>Records with</span>
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z" />
                </svg>
                <span>cannot be deleted</span>
              </div>
            )}
            <button
              disabled={isProcessing || items.length === 0}
              onClick={handlePrimaryDeleteClick}
              className="px-4 py-2 bg-red-500 disabled:opacity-50 text-white rounded-md hover:bg-red-600 transition-colors text-[0.7rem]"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Render BookingHistoryModal inside DeleteModal to prevent overlay conflicts */}
        {isHistoryOpen && (
          <div
            className="absolute inset-0 z-[150]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <BookingHistoryModal
              isOpen={isHistoryOpen}
              onClose={() => {
                setIsHistoryOpen(false);
                setBookingHistory([]);
                setSelectedItem(null);
              }}
              onViewCustomer={
                selectedItem
                  ? () => {
                      setMode("view");
                      setIsSideSheetOpen(true);
                      setIsHistoryOpen(false);
                    }
                  : undefined
              }
              onEditCustomer={
                selectedItem
                  ? () => {
                      setMode("edit");
                      setIsSideSheetOpen(true);
                      setIsHistoryOpen(false);
                    }
                  : undefined
              }
              bookings={bookingHistory}
            />
          </div>
        )}
      </Modal>
      {showConfirm && (
        <ConfirmationModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={performDeletion}
          title={
            nonDeletableItems.length === items.length
              ? "None of the selected entries can be deleted."
              : `The following ${entity}${
                  nonDeletableItems.length > 1 ? "s" : ""
                } cannot be deleted: ${nonDeletableIds.join(
                  ", "
                )}. Proceed to remove the rest?`
          }
          confirmText={
            nonDeletableItems.length === items.length
              ? "Close"
              : "Remove, Delete"
          }
          cancelText={
            nonDeletableItems.length === items.length ? "Cancel" : "Keep All"
          }
          confirmButtonColor="bg-red-600"
        />
      )}

      {isSideSheetOpen && entity === "customer" && (
        <BookingProvider>
          <AddCustomerSideSheet
            isOpen={isSideSheetOpen}
            onCancel={() => {
              setIsSideSheetOpen(false);
              setMode("view");
              setFullEntityData(null);
            }}
            data={fullEntityData}
            mode={mode}
          />
        </BookingProvider>
      )}

      {isSideSheetOpen && entity === "vendor" && (
        <BookingProvider>
          <AddVendorSideSheet
            isOpen={isSideSheetOpen}
            onCancel={() => {
              setIsSideSheetOpen(false);
              setMode("view");
              setFullEntityData(null);
            }}
            data={fullEntityData}
            mode={mode}
          />
        </BookingProvider>
      )}

      {isSideSheetOpen && entity === "team" && (
        <AddTeamSideSheet
          isOpen={isSideSheetOpen}
          onCancel={() => {
            setIsSideSheetOpen(false);
            setMode("view");
            setFullEntityData(null);
          }}
          data={fullEntityData}
          mode={mode}
        />
      )}

      {isSideSheetOpen && entity === "traveller" && (
        <BookingProvider>
          <AddNewTravellerForm
            isOpen={isSideSheetOpen}
            onClose={() => {
              setIsSideSheetOpen(false);
              setMode("view");
              setFullEntityData(null);
            }}
            mode={mode}
            data={fullEntityData}
          />
        </BookingProvider>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow text-[0.7rem]">
          {error}
        </div>
      )}
    </div>
  );
};

export default DeleteModal;
