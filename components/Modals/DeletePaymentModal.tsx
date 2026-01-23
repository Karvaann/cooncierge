"use client";

import React from "react";
import Modal from "@/components/Modal";
import { FiTrash2 } from "react-icons/fi";

interface DeletePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment?: any;
}

const DeletePaymentModal: React.FC<DeletePaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payment,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMoney = (value: number) => {
    try {
      return value.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return String(value);
    }
  };

  const paymentId = payment?.customId || payment?.data?.customId || "—";
  const partyName = payment?.data?.partyId?.name || payment?.partyName || "—";
  const paymentDate = formatDate(
    payment?.data?.paymentDate || payment?.paymentDate || payment?.date,
  );
  const paymentMode = payment?.data?.paymentType || payment?.paymentType || "—";
  const amount = payment?.data?.amount || payment?.amount || 0;

  return (
    <Modal
      title=""
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      customWidth="w-[600px]"
      customeHeight="h-fit"
      closeOnOverlayClick={true}
      closeOnEscape={true}
      zIndexClass="z-[990]"
    >
      <div className="px-6 py-4">
        <h2 className="text-center text-[18px] font-semibold text-gray-900">
          Are you sure you want to delete?
        </h2>
        <p className="mt-2 text-center text-[13px] text-red-600 font-medium">
          Note : This action cannot be undone
        </p>

        <div className="mt-6">
          <h3 className="text-[14px] font-semibold text-gray-900 mb-3">
            Payment Details
          </h3>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-700 bg-gray-50 w-[40%]">
                    Payment ID
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-900">
                    {paymentId}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-700 bg-gray-50">
                    Party Name
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-900">
                    {partyName}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-700 bg-gray-50">
                    Date
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-900">
                    {paymentDate}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-700 bg-gray-50">
                    Mode
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-900 uppercase">
                    {paymentMode}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[13px] font-medium text-gray-700 bg-gray-50">
                    Amount
                  </td>
                  <td className="px-4 py-3 text-[13px] text-gray-900 font-semibold">
                    ₹ {formatMoney(amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-md border border-gray-300 bg-white text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-red-600 text-[14px] font-semibold text-white hover:bg-red-700 transition"
          >
            <FiTrash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeletePaymentModal;
