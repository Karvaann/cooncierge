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
  confirmText,
  cancelText,
  onConfirm,
  confirmButtonColor,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="sm"
      customWidth="w-[383px]"
      customeHeight="h-[220px]"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="p-0 w-[500px]"
    >
      <div className="flex flex-col items-center -mt-5 rounded-[12px] justify-center px-2">
        <div className="text-center mb-6 text-black text-base md:text-lg font-normal">
          {title}
        </div>

        <div className="flex flex-row gap-4 w-full justify-center">
          <button
            className="border border-[#1A7F64] text-[#1A7F64] bg-white rounded-lg px-6 py-2 font-medium hover:bg-[#1A7F64]/10 transition-colors"
            onClick={onClose}
          >
            {cancelText}
          </button>

          <button
            className={`border text-white ${confirmButtonColor} rounded-lg px-6 py-2 font-medium transition-colors`}
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
