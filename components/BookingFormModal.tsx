"use client";

import React, { useCallback, useMemo } from "react";
import Image from "next/image";
import Modal from "./Modal";

// Type definitions
interface Service {
  id: string;
  title: string;
  image: string;
  category: "travel" | "accommodation" | "transport" | "activity";
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
        category: "transport",
        description: "Car rentals, buses, and ground transport",
      },
      {
        id: "transportation-maritime",
        title: "Transportation (Maritime)",
        image: "/images/transportation(maritime).png",
        category: "transport",
        description: "Ferry, cruise, and water transport",
      },
      {
        id: "tickets-attraction",
        title: "Tickets (Attraction)",
        image: "/images/ticket.png",
        category: "activity",
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
        category: "travel",
        description: "Comprehensive travel protection",
      },
      {
        id: "visas",
        title: "Visas",
        image: "/images/visas.png",
        category: "travel",
        description: "Visa processing and documentation",
      },
    ],
    []
  );

  const services = customServices || defaultServices;

  // Optimized card click handler
  const handleCardClick = useCallback(
    (service: Service) => {
      onSelectedService(service);
      onClose();
    },
    [onSelectedService, onClose]
  );

  // Memoized service cards
  const serviceCards = useMemo(
    () =>
      services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onClick={handleCardClick}
          isLoading={isLoading}
        />
      )),
    [services, handleCardClick, isLoading]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Service"
      size="xl"
      customWidth="w-300"
      customeHeight="h-fit"
      // className="w-[90vw]"
    >
      <div className="flex flex-col items-center w-full p-2 -mt-5 rounded-xl ">
        <div className="text-gray-500 text-sm text-center w-full mb-6">
          Choose from the range of services provided by{" "}
          <span className="text-[#114958] font-bold">Company ABC</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#114958]" />
            <span className="ml-3 text-gray-600">Loading services...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-[90%] mb-6">
              {serviceCards}
            </div>

            {/* Navigation arrows matching Figma design */}
            <div className="flex items-center justify-center space-x-4">
              <button
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                aria-label="Previous page"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                aria-label="Next page"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </>
        )}

        {services.length === 0 && !isLoading && (
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
      </div>
    </Modal>
  );
};

export default React.memo(BookingFormModal);
