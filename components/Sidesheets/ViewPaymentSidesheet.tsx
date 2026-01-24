"use client";

import React, { useMemo, useState } from "react";
import SideSheet from "@/components/SideSheet";
import { FaRegFolder } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import DeletePaymentModal from "@/components/Modals/DeletePaymentModal";

type ViewPaymentTab = "settled" | "history";

interface ViewPaymentSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  onEdit?: (paymentData: any) => void;

  payment?: any; // The actual payment data from API
}

const ViewPaymentSidesheet: React.FC<ViewPaymentSidesheetProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDeleted,
  payment,
}) => {
  const [activeTab, setActiveTab] = useState<ViewPaymentTab>("settled");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const formatMoney = (value: number) => {
    try {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return String(value);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB").replace(/\//g, "-");
  };

  // Extract data from payment object
  const paymentId = payment?.customId || "—";
  const partyLabel =
    payment?.data?.partyId?.name ||
    payment?.customer?.name ||
    payment?.vendor?.name ||
    payment?.partyName ||
    "—";
  const amount = payment?.amount || payment?.data?.amount || 0;
  const paymentDate = formatDate(
    payment?.data?.paymentDate || payment?.paymentDate || payment?.date,
  );
  const paymentType = payment?.data?.paymentType || payment?.paymentType || "—";
  const bankName =
    payment?.data?.bankId?.name ||
    payment?.bank?.name ||
    payment?.account ||
    "—";
  const files = payment?.data?.documents || payment?.documents || [];
  const internalNotes =
    payment?.data?.internalNotes ||
    payment?.data?.notes ||
    payment?.internalNotes ||
    payment?.remarks ||
    "—";
  const settledDocs = payment?.allocations || payment?.data?.allocations || [];
  const outstandingAmount =
    payment?.data?.unallocatedAmount || payment?.outstandingAmount || 0;

  const viewTitle =
    paymentId && typeof paymentId === "string"
      ? paymentId.startsWith("PO-")
        ? "View Payment Out"
        : paymentId.startsWith("PI-")
          ? "View Payment In"
          : "View Payment"
      : "View Payment";

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      position="right"
      title={
        <div className="flex items-center gap-2">
          <span>{viewTitle}</span>
          <div className="w-px h-7 bg-gray-300"></div>
          <span className="font-semibold">{paymentId}</span>
        </div>
      }
      headerRight={
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => {
              if (!onEdit) return;
              const payload: any = {
                ...payment,
                // prefer bank id from nested data, fall back to any _id fields
                bank:
                  payment?.data?.bankId?._id ||
                  payment?.bank?._id ||
                  payment?.data?.bankId ||
                  "",
              };
              onEdit(payload);
            }}
            className="flex items-center gap-2 rounded-md border border-[#126ACB] bg-white px-3 py-1.5 text-[13px] font-medium text-[#126ACB] hover:bg-blue-50 disabled:opacity-50"
            disabled={!onEdit}
          >
            <FiEdit2 size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      }
    >
      <div className="px-6 pb-8">
        <div className="mt-2 flex items-center justify-end">
          <div className="text-[12px] font-medium text-red-500">
            Outstanding: ₹ {formatMoney(outstandingAmount)}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-gray-200 bg-white">
          <div className="p-4">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <div className="text-[12px] font-medium text-gray-500">
                  Amount
                </div>
                <div className="mt-1 text-[13px] font-semibold text-gray-900">
                  ₹ {formatMoney(amount)}
                </div>
              </div>

              <div>
                <div className="text-[12px] font-medium text-gray-500">
                  Payment Date
                </div>
                <div className="mt-1 text-[13px] font-medium text-gray-900">
                  {paymentDate}
                </div>
              </div>

              <div>
                <div className="text-[12px] font-medium text-gray-500">
                  Payment Type
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[12px] font-medium text-purple-700">
                    {paymentType}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[12px] font-medium text-gray-500">
                  Bank
                </div>
                <div className="mt-1 text-[13px] font-medium text-gray-900">
                  {bankName}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-200" />

            {files.length > 0 && (
              <div className="mt-4">
                <div className="text-[12px] font-medium text-gray-500">
                  Files
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((file: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() =>
                        file.url && window.open(file.url, "_blank")
                      }
                    >
                      <FaRegFolder size={14} className="text-gray-600" />
                      {file.name || file.filename || `Document ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {internalNotes && internalNotes !== "—" && (
              <div className="mt-4">
                <div className="text-[12px] font-medium text-gray-500">
                  Remarks
                </div>
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 text-[13px] leading-5 text-gray-700">
                  {internalNotes}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-gray-200 pt-3">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab("settled")}
              className={`text-[13px] font-semibold transition-colors ${
                activeTab === "settled"
                  ? "text-[#0D4B37] underline underline-offset-[10px]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Settled Documents
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`text-[13px] font-semibold transition-colors ${
                activeTab === "history"
                  ? "text-[#0D4B37] underline underline-offset-[10px]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Edit History
            </button>
          </div>
        </div>

        {activeTab === "settled" ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-center text-[12px] font-semibold text-gray-600">
                    Booking ID
                  </th>
                  <th className="px-4 py-3 text-center text-[12px] font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-gray-600">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {settledDocs.length > 0 ? (
                  settledDocs.map((row: any, idx: number) => (
                    <tr
                      key={`${row.quotationId?._id || row.quotationId || row.bookingId}-${idx}`}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-3 text-center text-[13px] font-semibold text-gray-800">
                        {row.quotationId?.customId ||
                          row.quotation?.customId ||
                          row.booking?.customId ||
                          row.bookingId ||
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-[13px] text-gray-700">
                        {formatDate(
                          row.appliedAt || row.date || row.bookingDate,
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-gray-700">
                        ₹ {formatMoney(row.amount || 0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-[13px] text-gray-500"
                    >
                      No settled documents
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-[13px] text-gray-600">
              No edit history yet.
            </div>
          </div>
        )}
      </div>

      <DeletePaymentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => {
          setIsDeleteModalOpen(false);
          onClose(); // close sidesheet
          onDeleted?.(); // refresh payments list / ledger
        }}
        payment={payment}
      />
    </SideSheet>
  );
};

export default ViewPaymentSidesheet;
