"use client";

import React from "react";
import Modal from "@/components/Modal";
import ChooseBookingTypeCard from "@/components/ChooseBookingTypeCard";

import Image from "next/image";

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
      customWidth="w-[700px]"
      customeHeight="min-h-[97vh]"
      customBorderRadius="rounded-3xl"
      showCloseButton={true}
      title={
        <div className="px-6 pt-5 text-center">
          <h3 className="text-[29px] font-[600] text-[#020202] font-roboto">
            Booking Type
          </h3>
          <p className="mt-[7px] text-[14px] font-[400] text-[#818181]">
            Choose whether you want to create
            <span className="font-[600] text-[#020202]">
              {" "}
              Other Service Booking{" "}
            </span>{" "}
            or
            <span className="font-[600] text-[#020202]"> Limitless </span>
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-[28px] px-7.5 pt-[40px]">
        <ChooseBookingTypeCard
          title="Other Services"
          description="Select individual services to create bookings"
          pills={[
            {
              label: "Flight",
              icon: (
                <Image
                  src="/icons/service-icons/flight.svg"
                  alt="Flight"
                  height={15}
                  width={15}
                />
              ),
            },
            {
              label: "Accommodation",
              icon: (
                <Image
                  src="/icons/service-icons/accommodation.svg"
                  alt="Accommodation"
                  height={15}
                  width={15}
                />
              ),
            },
            {
              label: "Transportation",
              icon: (
                <Image
                  src="/icons/service-icons/transport.svg"
                  alt="Transportation"
                  height={15}
                  width={15}
                />
              ),
            },
            {
              label: "Ticket (Attraction)",
              icon: (
                <Image
                  src="/icons/service-icons/ticket.svg"
                  alt="Ticket"
                  height={15}
                  width={15}
                />
              ),
            },
            {
              label: "Activity",
              icon: (
                <Image
                  src="/icons/service-icons/activity.svg"
                  alt="Activity"
                  height={15}
                  width={15}
                />
              ),
            },
            {
              label: "Visas",
              icon: (
                <Image
                  src="/icons/service-icons/visa-icon-final.svg"
                  alt="Visa"
                  height={15}
                  width={15}
                />
              ),
            },
            {
              label: "Travel Insurance",
              icon: (
                <Image
                  src="/icons/service-icons/insurance.svg"
                  alt="Insurance"
                  height={15}
                  width={15}
                />
              ),
            },
            {
              label: "Others",
              icon: (
                <Image
                  src="/icons/service-icons/others.svg"
                  alt="Others"
                  height={15}
                  width={15}
                />
              ),
            },
          ]}
          image="/images/booking-cards/OS-card-img2.png"
          onProceed={() => onSelect("os")}
        />

        <ChooseBookingTypeCard
          title="Limitless"
          description="Choose from a wide range of Destinations"
          pills={[
            { label: "UAE" },
            { label: "Vietnam" },
            { label: "Thailand" },
            { label: "Azerbaijan" },
            { label: "Germany" },
            { label: "Saudi Arabia" },
            { label: "Malaysia" },
            { label: "Indonesia" },
            { label: "Sri Lanka" },
            { label: "Serbia" },
            { label: "Italy" },
            { label: "Spain" },
            { label: "United Kingdom" },
          ]}
          image="/images/booking-cards/limitless-card-img2.png"
          showMore
          moreCount="& more"
          onProceed={() => onSelect("limitless")}
        />
      </div>
    </Modal>
  );
};

export default React.memo(ChooseBookingTypeModal);
