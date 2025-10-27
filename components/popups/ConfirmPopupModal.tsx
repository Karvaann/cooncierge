import React from "react";
import Modal from "../Modal";

interface ConfirmPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDontSave: () => void;
  onSaveAsDrafts: () => void;
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
      title=""
      size="sm"
      customWidth="w-[500px]"
      customeHeight="h-[250px]"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="p-0 w-[500px]"
    >
      <div className="flex flex-col items-center -mt-4 justify-center px-2">
        <div className="text-center mb-6 text-[#114958] text-base md:text-lg font-normal">
          {title}
        </div>

        <div className="flex flex-row gap-4 w-full justify-center">
          <button
            className="border border-[#1A7F64] text-[#1A7F64] bg-white rounded-lg px-6 py-2 font-medium hover:bg-[#1A7F64]/10 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="border border-[#D32F2F] text-white bg-[#D32F2F] rounded-lg px-6 py-2 font-medium hover:bg-[#b71c1c] transition-colors"
            onClick={onDontSave}
          >
            Don't Save
          </button>
          <button
            className="border border-[#1A7F64] text-white bg-[#1A7F64] rounded-lg px-6 py-2 font-medium hover:bg-[#145c47] transition-colors"
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
