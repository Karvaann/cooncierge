import Modal from "@/components/Modal";
import Table from "@/components/Table";
import React, { useState } from "react";

interface TransferDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransferDataModal: React.FC<TransferDataModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("Customers");

  const tabs = [
    { name: "Customers", count: 6 },
    { name: "Bookings-OS", count: 5 },
    { name: "Bookings-Limitless", count: 7 },
    { name: "Leads/Queries", count: 5 },
    { name: "Tasks", count: 4 },
    { name: "Quotations", count: 6 },
  ];

  const customerData = [
    {
      id: "CU-AB001",
      name: "Jatin Sharma",
      location: "Karavann",
      owner: "Sumit Jain",
      rating: 5,
      ratingColor: "bg-green-500",
      date: "10-09-2025",
    },
    {
      id: "CU-AB002",
      name: "Deepanshu",
      location: "Karavann",
      owner: "Sumit Jain",
      rating: 2,
      ratingColor: "bg-orange-500",
      date: "09-09-2025",
    },
    {
      id: "CU-AB003",
      name: "Anand Mishra",
      location: "Karavann",
      owner: "Apurav Mishra",
      rating: 3,
      ratingColor: "bg-yellow-500",
      date: "09-09-2025",
    },
    {
      id: "CU-AB004",
      name: "Anand Mishra",
      location: "Karavann",
      owner: "Harish Chaudhary",
      rating: 1,
      ratingColor: "bg-red-500",
      date: "07-09-2025",
    },
    {
      id: "CU-AB005",
      name: "Anand Mishra",
      location: "Karavann",
      owner: "Dhruv Pandey",
      rating: 4,
      ratingColor: "bg-green-500",
      date: "31-08-2025",
    },
    {
      id: "CU-AB006",
      name: "Deepanshu",
      location: "Karavann",
      owner: "Harish Chaudhary",
      rating: 2,
      ratingColor: "bg-orange-500",
      date: "25-08-2025",
    },
  ];

  const columns = [
    "Customer ID",
    "Name",
    "Owner",
    "Rating",
    "Date Modified",
    "Booking History",
  ];

  const columnIconMap = {
    "Customer ID": (
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 11l5-5m0 0l5 5m-5-5v12"
        />
      </svg>
    ),
    Name: (
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    ),
    Owner: (
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    ),
    Rating: (
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 11l5-5m0 0l5 5m-5-5v12"
        />
      </svg>
    ),
    "Date Modified": (
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 11l5-5m0 0l5 5m-5-5v12"
        />
      </svg>
    ),
  };

  const tableData = customerData.map((customer) => [
    <td key="id" className="px-3 py-2 text-center text-[0.75rem] font-medium">
      {customer.id}
    </td>,
    <td key="name" className="px-3 py-2 text-center">
      <div className="flex items-center gap-2 justify-center">
        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-[0.65rem] font-semibold text-gray-700">
            {customer.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
        </div>
        <div className="text-left">
          <div className="text-[0.75rem] font-medium text-gray-900">
            {customer.name}
          </div>
          <div className="text-[0.65rem] text-gray-500">
            {customer.location}
          </div>
        </div>
      </div>
    </td>,
    <td key="owner" className="px-3 py-2 text-center text-[0.75rem]">
      {customer.owner}
    </td>,
    <td key="rating" className="px-3 py-2 text-center">
      <div className="flex items-center justify-center gap-1">
        <div
          className={`w-5 h-5 rounded-full ${customer.ratingColor} flex items-center justify-center text-white text-[0.65rem] font-semibold`}
        >
          {customer.rating}
        </div>
      </div>
    </td>,
    <td key="date" className="px-3 py-2 text-center text-[0.75rem]">
      {customer.date}
    </td>,
    <td key="history" className="px-3 py-2 text-center">
      <button className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[0.7rem] text-gray-700 mx-auto">
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Booking History
      </button>
    </td>,
  ]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Transfer Data"
        subtitle="Arun Srivastava    TE-ABC12"
        customWidth="90vw"
        customeHeight="85vh"
        showCloseButton={true}
      >
        <div className="flex flex-col h-full">
          {/* Header with Select and Transfer buttons */}
          <div className="flex justify-end gap-2 mb-3">
            <button className="px-4 py-1.5 border border-gray-300 rounded text-[0.75rem] text-gray-700 hover:bg-gray-50 font-medium">
              Select
            </button>
            <button className="px-4 py-1.5 bg-green-600 text-white rounded text-[0.75rem] hover:bg-green-700 font-medium">
              Transfer
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`px-3 py-2 text-[0.75rem] font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.name
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            <Table
              data={tableData}
              columns={columns}
              initialRowsPerPage={10}
              columnIconMap={columnIconMap}
              hideRowsPerPage={false}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransferDataModal;
