"use client";

import React from "react";
import Modal from "@/components/Modal";

type BookingType = "os" | "limitless";

interface ChooseBookingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BookingType) => void;
}

const ChooseBookingTypeModal: React.FC<ChooseBookingTypeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      customWidth="w-[430px]"
      showCloseButton={true}
      title={
        <div className="px-6 pt-6 text-left">
          <h3 className="text-[20px] font-[600] text-[#020202]">
            Choose Booking Type
          </h3>
          <p className="mt-1 text-[13px] font-[400] text-[#6B7280]">
            Select where you want to create the booking.
          </p>
        </div>
      }
    >
      <div className="px-6 pb-6 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onSelect("os")}
            className="rounded-[12px] border border-[#E2E1E1] bg-white px-4 py-3 text-[14px] font-[500] text-[#020202] transition hover:border-[#7135AD] hover:text-[#7135AD]"
          >
            OS
          </button>
          <button
            type="button"
            onClick={() => onSelect("limitless")}
            className="rounded-[12px] border border-[#E2E1E1] bg-white px-4 py-3 text-[14px] font-[500] text-[#020202] transition hover:border-[#7135AD] hover:text-[#7135AD]"
          >
            Limitless
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(ChooseBookingTypeModal);
