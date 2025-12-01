"use client";

import React, { useMemo } from "react";
import Modal from "@/components/Modal";
import Table from "@/components/Table";

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
  isLinked?: boolean;
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
  const getRatingIcon = (rating: number) => {
    const colors = {
      1: "bg-red-100 text-red-500",
      2: "bg-orange-100 text-orange-500",
      3: "bg-yellow-100 text-yellow-500",
      4: "bg-green-100 text-green-500",
      5: "bg-green-100 text-green-500",
    };

    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full ${
          colors[rating as keyof typeof colors]
        }`}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        <span className="text-sm font-semibold">{rating}</span>
      </div>
    );
  };

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
  // Rating badge similar to directory pages
  const renderRatingBadge = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">—</span>;
    const bgMap: Record<number, string> = {
      1: "bg-red-100 text-red-600",
      2: "bg-orange-100 text-orange-600",
      3: "bg-yellow-100 text-yellow-600",
      4: "bg-green-100 text-green-600",
      5: "bg-emerald-100 text-emerald-600",
    };
    const bgClass = bgMap[rating] || "bg-gray-100 text-gray-600";
    return (
      <div className="flex items-center gap-2 justify-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${bgClass}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </div>
        <span className="text-[0.75rem] font-semibold text-gray-700">
          {rating}
        </span>
      </div>
    );
  };

  const tableData = useMemo(() => {
    if (!items) return [];
    return items.map((item) => {
      const actionsCell = (
        <td
          key={`${item.id}-actions`}
          className="px-3 py-1.5 text-center justify-center text-[0.75rem]"
        >
          <button className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-[0.7rem] transition-colors">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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
            {item.id}
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
            {renderRatingBadge(item.rating)}
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
            {item.id}
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
            {renderRatingBadge(item.rating)}
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
            {item.id}
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
          {item.id}
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
  }, [items, entity]);
  const linkedCustomers = useMemo(
    () => (items || []).filter((c) => c.isLinked).map((c) => c.id),
    [items]
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
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
                initialRowsPerPage={5}
                maxRowsPerPageOptions={[5, 10, 25, 50]}
                hideRowsPerPage={false}
              />
            </div>

            {/* Warning moved to footer next to Delete button */}
          </div>

          <div className="flex justify-end items-center gap-3 pt-3 bg-white shrink-0">
            <div className="flex items-center text-red-500 text-[0.7rem] gap-1">
              <span>Entries with</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>cannot be deleted as they are linked</span>
            </div>

            <button
              onClick={() => alert("Deleting non-linked customers...")}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-[0.7rem]"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteModal;
