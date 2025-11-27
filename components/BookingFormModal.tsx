"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Modal from "./Modal";

// Type definitions
interface Service {
  id: string;
  title: string;
  image: string;
  category:
    | "travel"
    | "accommodation"
    | "transport-land"
    | "activity"
    | "transport-maritime"
    | "tickets"
    | "travel insurance"
    | "visas"
    | "others";
  description?: string;
}

interface ServiceCardProps {
  service: Service;
  onClick: (service: Service) => void;
  isLoading?: boolean;
}

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectedService: (service: Service) => void;
  services?: Service[];
  isLoading?: boolean;
}

// Service card component matching Figma design
const ServiceCard: React.FC<ServiceCardProps> = React.memo(
  ({ service, onClick, isLoading = false }) => {
    const handleClick = useCallback(() => {
      if (!isLoading) {
        onClick(service);
      }
    }, [service, onClick, isLoading]);

    // Service icons mapping
    const serviceIcons = {
      Flights: "✈️",
      Accommodation: "🏨",
      "Land Transportation": "🚗",
      "Transportation (Land)": "🚗",
      "Transportation (Maritime)": "🚢",
      Activity: "🎯",
      "Tickets (Attraction)": "🎫",
      "Travel Insurance": "🛡️",
      Visas: "📋",
    };

    const icon =
      serviceIcons[service.title as keyof typeof serviceIcons] || "📋";

    return (
      <div
        className={`
    cursor-pointer rounded-[24px] w-full relative overflow-hidden
    transition-all duration-300 hover:scale-105 hover:shadow-lg
    ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
  `}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`Select ${service.title} service`}
      >
        <div className="relative w-full aspect-[4/3]">
          <Image
            src={service.image}
            alt={`${service.title} service`}
            fill
            className="object-cover rounded-[24px] w-full h-full"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#114958]" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

ServiceCard.displayName = "ServiceCard";

const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSelectedService,
  services: customServices,
  isLoading = false,
}) => {
  const [page, setPage] = useState(1);
  // Default services matching Figma design
  const defaultServices: Service[] = useMemo(
    () => [
      {
        id: "flights",
        title: "Flights",
        image: "/images/flight.png",
        category: "travel",
        description: "Book domestic and international flights",
      },
      {
        id: "accommodation",
        title: "Accommodation",
        image: "/images/accomodation.png",
        category: "accommodation",
        description: "Hotels, resorts, and vacation rentals",
      },
      {
        id: "transportation-land",
        title: "Transportation (Land)",
        image: "/images/transportation(land).png",
        category: "transport-land",
        description: "Car rentals, buses, and ground transport",
      },
      {
        id: "transportation-maritime",
        title: "Transportation (Maritime)",
        image: "/images/transportation(maritime).png",
        category: "transport-maritime",
        description: "Ferry, cruise, and water transport",
      },
      {
        id: "tickets-attraction",
        title: "Tickets (Attraction)",
        image: "/images/ticket.png",
        category: "tickets",
        description: "Theme parks, museums, and attractions",
      },
      {
        id: "activity",
        title: "Activity",
        image: "/images/activity.png",
        category: "activity",
        description: "Tours, experiences, and activities",
      },
      {
        id: "travel-insurance",
        title: "Travel Insurance",
        image: "/images/insurance.png",
        category: "travel insurance",
        description: "Comprehensive travel protection",
      },
      {
        id: "visas",
        title: "Visas",
        image: "/images/visas.png",
        category: "visas",
        description: "Visa processing and documentation",
      },
    ],
    []
  );

  const services = customServices || defaultServices;

  // PAGE SPLIT LOGIC
  const page1: Service[] = services;
  const page2: Service[] = [
    {
      id: "others",
      title: "Others",
      image: "/images/others-service-image1.png",
      category: "others",
      description: "Other services",
    },
  ];

  const cardsToShow = page === 1 ? page1 : page2;

  // Optimized card click handler
  const handleCardClick = useCallback(
    (service: Service) => {
      onSelectedService(service);
      onClose();
    },
    [onSelectedService, onClose]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Service"
      size="xl"
      customWidth="w-[62.5vw]"
      customeHeight="h-[70vh]"
      // className="w-[90vw]"
    >
      <div className="h-full justify between flex flex-col">
        {/* HEADER TEXT */}
        <div className="text-gray-500 text-sm text-center w-full mb-4">
          Choose from the range of services provided by{" "}
          <span className="text-[#114958] font-bold">Company ABC</span>
        </div>

        {/* TOP CONTENT AREA — TAKES SPACE */}
        <div className="flex-grow flex flex-col items-center justify-start">
          {/* LOADING */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114958]" />
              <span className="ml-3 text-gray-600">Loading services...</span>
            </div>
          )}

          {/* NO SERVICES */}
          {!isLoading && services.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No services available at the moment.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-[#114958] text-white rounded-lg hover:bg-[#0d3a45] transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* SERVICE CARDS */}
          {!isLoading && services.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-[95%]">
              {cardsToShow.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onClick={handleCardClick}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM ARROWS FIXED */}
        {!isLoading && services.length > 0 && (
          <div className="h-[60px] flex items-center justify-center gap-6 pb-2 mt-4">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className={`text-gray-400 transition ${
                page === 1
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:text-[#114958]"
              }`}
            >
              <span className="text-2xl">‹</span>
            </button>

            <button
              onClick={() => setPage(2)}
              disabled={page === 2}
              className={`text-gray-400 transition ${
                page === 2
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:text-[#114958]"
              }`}
            >
              <span className="text-2xl">›</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(BookingFormModal);
