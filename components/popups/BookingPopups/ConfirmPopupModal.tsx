import React from "react";
import Modal from "../../Modal";

interface ConfirmPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontSave?: () => void;
  onSaveAsDrafts?: () => void;
  title: string;
}

const ConfirmPopupModal: React.FC<ConfirmPopupModalProps> = ({
  isOpen,
  onClose,
  onDontSave,
  onSaveAsDrafts,
  title,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={""}
      size="sm"
      customWidth="w-[360px]"
      customeHeight="h-fit"
      showCloseButton={false} // ⬅️ we control it manually
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="p-0"
      zIndexClass="z-[1000]"
    >
      <div className="relative px-1 -mt-4 pb-1.5 flex flex-col items-center">
        {/* ❌ Custom Close Button */}
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

        {/* CENTERED TITLE */}
        <div className="text-left text-[#414141] text-[0.9rem] font-medium leading-tight mb-5 pr-6">
          {title}
        </div>

        {/* BUTTON GROUP */}
        <div className="flex flex-row gap-2 w-full justify-end">
          {/* <button
            className="border border-[#1A7F64] text-[#1A7F64] bg-white
              rounded-md px-3 py-1 text-[0.75rem] font-medium
              hover:bg-[#1A7F64]/10 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button> */}

          <button
            className="border border-[#D32F2F] bg-[#D32F2F] text-white
              rounded-md px-4 py-1 text-[0.75rem] font-medium
              hover:bg-[#b71c1c] transition-colors"
            onClick={onDontSave}
          >
            Don't Save
          </button>

          <button
            className="border border-[#1A7F64] bg-[#3B8132] text-white
              rounded-md px-4 py-1.5 text-[0.75rem] font-medium
              hover:bg-[#145c47] transition-colors"
            onClick={onSaveAsDrafts}
          >
            Save as Drafts
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmPopupModal;
