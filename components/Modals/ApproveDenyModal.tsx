"use client";

import React, { useState, useEffect } from "react";
import Modal from "../Modal";

interface ApproveDenyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  action?: "approve" | "deny";
  title?: string;
  confirmColor?: string;
}

const ApproveDenyModal: React.FC<ApproveDenyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action = "approve",
  title,
  confirmColor,
}) => {
  const [reason, setReason] = useState("");
  const [showNote, setShowNote] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setShowNote(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setShowNote(true);
      return;
    }
    onConfirm(reason.trim());
  };

  const headerText =
    title ||
    (action === "approve"
      ? "Are you sure you want to approve this booking?"
      : "Are you sure you want to deny this booking?");

  const confirmBtnClass =
    confirmColor ||
    (action === "deny"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#4CA640] hover:bg-green-600");

  return (
    <Modal
      title=""
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      customWidth="w-[480px]"
    >
      <div className="p-1 -mt-6">
        <div className="mb-3 text-left">
          <h3 className="text-[13px] md:text-[15px] font-semibold text-[#414141]">
            {headerText}
          </h3>
        </div>

        <div>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setShowNote(false);
            }}
            placeholder="Enter your comments here..."
            className="w-full h-22 md:h-26 p-3 border border-gray-200 rounded-md resize-none text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500"
          />

          {showNote || !reason.trim() ? (
            <p className="text-[13px] text-red-600 mt-2">
              Note : Please enter reason for approval/denail
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold rounded-md border border-[#0D4B37] text-[#0D4B37] bg-white hover:bg-green-50 text-[14px]"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className={`px-4 py-1.5 font-semibold rounded-md text-white text-[14px] ${confirmBtnClass}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(ApproveDenyModal);
