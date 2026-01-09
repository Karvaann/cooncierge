"use client";

import React, { useMemo } from "react";
import Filter from "@/components/Filter";
import SummaryCards from "@/components/SummaryCards";
import Table from "@/components/Table";
import { BookingProvider, useBooking } from "@/context/BookingContext";
import BookingFormModal from "@/components/BookingFormModal";
import BookingFormSidesheet from "@/components/BookingFormSidesheet";

// Type definitions
interface OSTableRowData {
  id: string;
  leadPax: string;
  travelDate: string;
  service: string;
  bookingStatus: 'Successful' | 'Pending' | 'Failed';
  amount: string;
  voucher: string;
  tasks: number;
}

// Other Services content component
const OSSalesContent: React.FC = () => {
  const {
    state,
    openModal,
    closeModal,
    closeSidesheet,
    selectService,
  } = useBooking();
  // Memoized column definitions
  const columns = useMemo(() => [
    "#ID",
    "Lead Pax",
    "Travel Date",
    "Service",
    "Booking Status",
    "Amount",
    "Voucher",
    "Tasks",
  ], []);

  // Memoized table data for Other Services
  const tableData: OSTableRowData[] = useMemo(() => [
    {
      id: "#OS001",
      leadPax: "Amit Verma",
      travelDate: "10-10-2025",
      service: "🎭 Event Planning",
      bookingStatus: "Successful",
      amount: "₹ 85,000",
      voucher: "📄",
      tasks: 4,
    },
    {
      id: "#OS002",
      leadPax: "Kavya Reddy",
      travelDate: "18-10-2025",
      service: "📸 Photography",
      bookingStatus: "Pending",
      amount: "₹ 25,000",
      voucher: "📄",
      tasks: 2,
    },
    {
      id: "#OS003",
      leadPax: "Rohit Gupta",
      travelDate: "22-10-2025",
      service: "🍽️ Catering",
      bookingStatus: "Successful",
      amount: "₹ 45,500",
      voucher: "📄",
      tasks: 3,
    },
    {
      id: "#OS004",
      leadPax: "Meera Joshi",
      travelDate: "28-10-2025",
      service: "🎵 Entertainment",
      bookingStatus: "Failed",
      amount: "₹ 35,000",
      voucher: "📄",
      tasks: 1,
    },
    {
      id: "#OS005",
      leadPax: "Suresh Nair",
      travelDate: "05-11-2025",
      service: "🚌 Transportation",
      bookingStatus: "Successful",
      amount: "₹ 18,750",
      voucher: "📄",
      tasks: 2,
    },
  ], []);

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: OSTableRowData['bookingStatus']): string => {
    switch (status) {
      case 'Successful':
        return 'px-2 py-1 text-xs rounded-full bg-green-100 text-green-700';
      case 'Pending':
        return 'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700';
      case 'Failed':
        return 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-700';
      default:
        return 'px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700';
    }
  };

  // Memoized formatted data for the table component
  const formattedData = useMemo(() => 
    tableData.map((row, index) => [
      <td key={`id-${index}`} className="px-4 py-3">
        {row.id}
      </td>,
      <td key={`lead-${index}`} className="px-4 py-3">
        {row.leadPax}
      </td>,
      <td key={`date-${index}`} className="px-4 py-3">
        {row.travelDate}
      </td>,
      <td key={`service-${index}`} className="px-4 py-3">
        {row.service}
      </td>,
      <td key={`status-${index}`} className="px-4 py-3">
        <span className={getStatusBadgeClass(row.bookingStatus)}>
          {row.bookingStatus}
        </span>
      </td>,
      <td key={`amount-${index}`} className="px-4 py-3">
        {row.amount}
      </td>,
      <td key={`voucher-${index}`} className="px-4 py-3">
        <button 
          className="hover:scale-110 transition-transform"
          aria-label="View voucher"
        >
          {row.voucher}
        </button>
      </td>,
      <td key={`tasks-${index}`} className="px-4 py-3">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
          {row.tasks}
        </span>
      </td>,
    ]), [tableData]
  );

  // Filter options specific to Other Services
  const filterOptions = useMemo(() => ({
    serviceTypes: [
      { value: 'event', label: '🎭 Event Planning' },
      { value: 'photography', label: '📸 Photography' },
      { value: 'catering', label: '🍽️ Catering' },
      { value: 'entertainment', label: '🎵 Entertainment' },
      { value: 'transportation', label: '🚌 Transportation' },
    ],
    statuses: [
      { value: 'successful', label: 'Successful' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' },
    ],
    owners: [
      { value: 'amit', label: 'Amit Verma' },
      { value: 'kavya', label: 'Kavya Reddy' },
      { value: 'rohit', label: 'Rohit Gupta' },
      { value: 'meera', label: 'Meera Joshi' },
    ],
  }), []);

  const handleFilterChange = (filters: any) => {
    console.log('Other Services filters changed:', filters);
    // Implement filter logic here
  };

  return (
    <div className="bg-[#F3F3F3]">
      <div className="flex justify-end gap-4 p-6 w-full mx-[10px] mt-[-15px]">
        <button className="bg-white text-[#114958] px-6 py-2 rounded-lg shadow hover:bg-gray-100 transition-colors">
          View Draft
        </button>
        <button className="bg-[#114958] text-white px-6 py-2 rounded-lg shadow hover:bg-[#14505e] transition-colors" onClick={openModal}>
          Create +
        </button>
      </div>
      
      <div className="min-h-screen mt-2 p-5">
        <Filter 
          onFilterChange={handleFilterChange}
          serviceTypes={filterOptions.serviceTypes}
          statuses={filterOptions.statuses}
          owners={filterOptions.owners}
        />
        <SummaryCards />
        <Table data={formattedData} columns={columns} />
      </div>

      {/* Booking Components */}
      <BookingFormModal
        isOpen={state.isModalOpen}
        onClose={closeModal}
        onSelectedService={selectService}
      />

      <BookingFormSidesheet
        isOpen={state.isSidesheetOpen}
        onClose={closeSidesheet}
        selectedService={state.selectedService}
      />
    </div>
  );
};

// Main component with providers
const OSSalesPage: React.FC = () => {
  return (
    <BookingProvider>
      <OSSalesContent />
    </BookingProvider>
  );
};

export default React.memo(OSSalesPage);
