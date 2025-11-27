import React from "react";
import Modal from "../Modal";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmButtonColor = "bg-red-600",
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={""}
      size="sm"
      customWidth="w-[23vw]"
      customeHeight="h-[18vh]"
      showCloseButton={false} // 🔥 custom close button only
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="p-0"
    >
      <div className="relative px-2 -mt-3 pb-2 -ml-2 flex flex-col items-center">
        {/* 🔥 Custom Close Button */}
        <button
          onClick={onClose}
          className="absolute -right-3 -top-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* 🔥 TITLE */}
        <div className="text-center mb-5 text-[#414141] text-[0.9rem] font-medium leading-tight px-3">
          {title}
        </div>

        {/* 🔥 BUTTONS */}
        <div className="flex flex-row gap-3 w-full justify-center">
          {/* Cancel */}
          <button
            className="
              border border-[#1A7F64] text-[#1A7F64] bg-white
              rounded-md px-4 py-1.5 text-[0.75rem] font-medium
              hover:bg-[#1A7F64]/10 transition-colors
            "
            onClick={onClose}
          >
            {cancelText}
          </button>

          {/* Confirm */}
          <button
            className={`
              text-white ${confirmButtonColor}
              rounded-md px-4 py-1.5 text-[0.75rem] font-medium
              hover:opacity-90 transition-colors
            `}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
