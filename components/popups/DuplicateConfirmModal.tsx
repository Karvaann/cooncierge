"use client";

import React from "react";
import Modal from "../Modal";

type DuplicateConfirmModalProps = {
  isOpen: boolean;
  itemId: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const DuplicateConfirmModal: React.FC<DuplicateConfirmModalProps> = ({
  isOpen,
  itemId,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title=""
      size="sm"
      customWidth="w-[400px]"
      customeHeight="h-fit"
      showCloseButton={false}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      noBodyPadding
      className="!rounded-[16px]"
      zIndexClass="z-[1200]"
    >
      <div className="px-5 py-5">
        <p className="text-center font-[Poppins,sans-serif] text-[14px] font-normal leading-snug text-[#414141]">
          Are you sure you want to duplicate{" "}
          <span className="font-semibold">&lsquo;{itemId}&rsquo;</span> ?
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[8px] border border-[#E2E1E1] bg-white px-4 py-1.5 font-[Poppins,sans-serif] text-[12px] font-medium text-[#414141] transition-colors hover:bg-[#FAFAFA]"
          >
            No, Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[8px] bg-[#7135AD] px-4 py-1.5 font-[Poppins,sans-serif] text-[12px] font-medium text-white transition-colors hover:bg-[#5E2B91]"
          >
            Yes, Duplicate
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DuplicateConfirmModal;
