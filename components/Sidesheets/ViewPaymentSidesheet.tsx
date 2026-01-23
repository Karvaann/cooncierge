"use client";

import React, { useMemo, useState } from "react";
import SideSheet from "@/components/SideSheet";
import { FaRegFolder } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

type ViewPaymentTab = "settled" | "history";

interface ViewPaymentSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (paymentData: any) => void;
  onDelete?: () => void;
  payment?: any; // The actual payment data from API
}

const ViewPaymentSidesheet: React.FC<ViewPaymentSidesheetProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  payment,
}) => {
  const [activeTab, setActiveTab] = useState<ViewPaymentTab>("settled");

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
  const partyLabel = payment?.customer?.name || payment?.vendor?.name || "—";
  const amount = payment?.amount || 0;
  const paymentDate = formatDate(payment?.paymentDate || payment?.date);
  const paymentType = payment?.paymentType || "—";
  const bankName = payment?.bank?.name || payment?.account || "—";
  const files = payment?.documents || [];
  const internalNotes = payment?.internalNotes || payment?.remarks || "—";
  const settledDocs = payment?.allocations || [];
  const outstandingAmount = payment?.outstandingAmount || 0;

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      position="right"
      title={
        <div className="flex items-center gap-2">
          <span>View Payment In</span>
          <span className="font-semibold">{paymentId}</span>
          {partyLabel !== "—" && (
            <>
              <span className="text-gray-400">|</span>
              <span className="font-semibold text-gray-700">{partyLabel}</span>
            </>
          )}
        </div>
      }
      headerRight={
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={() => onEdit?.(payment)}
            className="flex items-center gap-2 rounded-md border border-[#126ACB] bg-white px-3 py-1.5 text-[13px] font-medium text-[#126ACB] hover:bg-blue-50 disabled:opacity-50"
            disabled={!onEdit}
          >
            <FiEdit2 size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-[13px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            disabled={!onDelete}
          >
            <FiTrash2 size={14} />
            Delete
          </button>
        </div>
      }
    >
      <div className="px-6 pb-8">
        <div className="mt-2 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-gray-900">
            {partyLabel}
          </div>
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
                      key={`${row.quotationId || row.bookingId}-${idx}`}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-3 text-center text-[13px] font-semibold text-gray-800">
                        {row.quotation?.customId ||
                          row.booking?.customId ||
                          row.quotationId ||
                          row.bookingId ||
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-[13px] text-gray-700">
                        {formatDate(row.date || row.bookingDate)}
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
    </SideSheet>
  );
};

export default ViewPaymentSidesheet;
