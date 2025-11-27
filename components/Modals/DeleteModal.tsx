"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Modal from "@/components/Modal";
import Table from "@/components/Table";

interface Customer {
  id: string;
  name: string;
  avatar: string;
  subtitle: string;
  owner: string;
  rating: number;
  dateModified: string;
  isLinked: boolean;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose }) => {
  // Sample customer data matching the screenshot
  const customers: Customer[] = [
    {
      id: "CU-AB001",
      name: "Jatin Sharma",
      avatar: "https://i.pravatar.cc/150?img=1",
      subtitle: "Karvaann",
      owner: "Sumit Jain",
      rating: 5,
      dateModified: "10-09-2025",
      isLinked: true,
    },
    {
      id: "CU-AB002",
      name: "Deepanshu",
      avatar: "https://i.pravatar.cc/150?img=2",
      subtitle: "Karvaann",
      owner: "Sumit Jain",
      rating: 2,
      dateModified: "09-09-2025",
      isLinked: false,
    },
    {
      id: "CU-AB003",
      name: "Anand Mishra",
      avatar: "https://i.pravatar.cc/150?img=3",
      subtitle: "Karvaann",
      owner: "Apurav Mishra",
      rating: 3,
      dateModified: "09-09-2025",
      isLinked: false,
    },
    {
      id: "CU-AB004",
      name: "Anand Mishra",
      avatar: "https://i.pravatar.cc/150?img=4",
      subtitle: "Karvaann",
      owner: "Harish Chaudhary",
      rating: 1,
      dateModified: "07-09-2025",
      isLinked: true,
    },
    {
      id: "CU-AB005",
      name: "Anand Mishra",
      avatar: "https://i.pravatar.cc/150?img=5",
      subtitle: "Karvaann",
      owner: "Dhruv Pandey",
      rating: 4,
      dateModified: "31-08-2025",
      isLinked: false,
    },
  ];

  const getRatingIcon = (rating: number) => {
    const colors = {
      1: "bg-red-100 text-red-500",
      2: "bg-orange-100 text-orange-500",
      3: "bg-yellow-100 text-yellow-500",
      4: "bg-green-100 text-green-500",
      5: "bg-green-100 text-green-500",
    };

    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full ${
          colors[rating as keyof typeof colors]
        }`}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        <span className="text-sm font-semibold">{rating}</span>
      </div>
    );
  };

  const columns = [
    "Customer ID",
    "Name",
    "Owner",
    "Rating",
    "Date Modified",
    "Booking History",
  ];

  const tableData = customers.map((customer) => [
    <td key="id" className="px-3 py-1.5 text-[0.75rem]">
      <div className="flex items-center gap-3">
        {customer.isLinked && (
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        )}
        <span className={customer.isLinked ? "text-gray-400" : "text-gray-800"}>
          {customer.id}
        </span>
      </div>
    </td>,
    <td key="name" className="px-3 py-1.5 text-[0.75rem]">
      <div className="flex items-center gap-3">
        <img
          src={customer.avatar}
          alt={customer.name}
          className="w-7 h-7 rounded-full object-cover"
        />
        <div>
          <div
            className={
              customer.isLinked
                ? "text-gray-400 font-medium"
                : "text-gray-800 font-medium"
            }
          >
            {customer.name}
          </div>
          <div className="text-gray-400 text-xs">{customer.subtitle}</div>
        </div>
      </div>
    </td>,
    <td key="owner" className="px-4 py-3">
      <span className={customer.isLinked ? "text-gray-400" : "text-gray-800"}>
        {customer.owner}
      </span>
    </td>,
    <td key="rating" className="px-4 py-3">
      <div className="flex justify-center">
        {getRatingIcon(customer.rating)}
      </div>
    </td>,
    <td key="date" className="px-4 py-3">
      <span className={customer.isLinked ? "text-gray-400" : "text-gray-800"}>
        {customer.dateModified}
      </span>
    </td>,
    <td key="history" className="px-4 py-3">
      <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-[0.7rem] transition-colors">
        <svg
          className="w-3.5 h-3.5"
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

  const linkedCustomers = customers.filter((c) => c.isLinked).map((c) => c.id);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Delete Customers"
        customWidth="w-[75vw]"
        customeHeight="h-[85vh]"
        className="max-w-[1100px]"
      >
        <div className="space-y-4 text-[0.75rem]">
          {/* Warning Message */}
          <div className="flex items-center justify-center gap-1 text-red-500 text-[0.7rem]">
            <span>Entries with</span>
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>cannot be deleted as they are linked</span>
          </div>

          {/* Table */}
          <Table
            data={tableData}
            columns={columns}
            initialRowsPerPage={10}
            maxRowsPerPageOptions={[5, 10, 25, 50]}
            hideRowsPerPage={false}
          />

          {/* Footer Message */}
          <div className="text-right text-gray-600 text-[0.7rem] pt-1">
            <span className="font-semibold">{linkedCustomers.join(", ")}</span>{" "}
            are linked and cannot be deleted.
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-[0.7rem]"
            >
              No, Cancel
            </button>

            <button
              onClick={() => {
                alert("Deleting non-linked customers...");
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-[0.7rem]"
            >
              Remove & Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteModal;
