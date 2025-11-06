"use client";
import React, { useState, useRef, useEffect } from "react";
import { PiDotsThreeBold } from "react-icons/pi";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashAlt } from "react-icons/fa";
import { deleteCustomer } from "@/services/customerApi";
const ActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );
    if (!confirmDelete) return;
    try {
      const response = await deleteCustomer(id);
      console.log(response.message); // "Customer deleted"
      // Optionally, refresh the customer list or update UI here
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex items-center justify-center border border-gray-200">
      <div className="rounded-lg p-1">
        <div className="flex items-center justify-between">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="More actions"
            >
              <PiDotsThreeBold className="w-5 h-5 text-gray-600" />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-10">
                <button
                  onClick={() => {
                    console.log("Edit clicked");
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <FaRegEdit className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">Edit</span>
                </button>

                <hr className="border border-gray-100" />

                <button
                  onClick={() => {
                    handleDelete;
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <FaRegTrashAlt className="w-4 h-4 text-red-600" />
                  <span className="text-red-600 font-medium">Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionMenu;
