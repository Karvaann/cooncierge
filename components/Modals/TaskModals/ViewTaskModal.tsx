"use client";

import React, { useEffect, useCallback } from "react";
import { TbLuggage } from "react-icons/tb";
import { MdOutlineKeyboardArrowLeft } from "react-icons/md";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { CiCirclePlus } from "react-icons/ci";
import { TbSquareToggle } from "react-icons/tb";
import { FaRegCalendar } from "react-icons/fa";
import { FaRegClock } from "react-icons/fa";
import { GoPerson } from "react-icons/go";
import Image from "next/image";

interface ViewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onMarkComplete?: () => void;
}

const ViewTaskModal: React.FC<ViewTaskModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onMarkComplete,
}) => {
  const [activeTab, setActiveTab] = React.useState<"info" | "log">("info");

  const taskData = {
    taskId: "TA-ABC12",
    date: "Friday, 10th May 2025",
    priority: "High Priority",
    status: "Pending Task",
    title: "Booking - OS",
    bookingId: "OS-ABC12",
    dueDate: "May 10th 2025",
    dueTime: "10:00",
    dateCreated: "May 05th 2025",
    assignedTo: ["Avanish Sharma", "Akash Kapoor", "+2"],
    assignedBy: "Yash Manocha",
    attachedFiles: 3,
  };

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return;
  }, [isOpen, handleEscape]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High Priority":
        return "bg-red-100 text-red-800";
      case "Medium Priority":
        return "bg-yellow-100 text-yellow-600";
      case "Low Priority":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-300"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-xl overflow-hidden max-w-2xl w-full mx-4 transition-all duration-300 transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex-1 flex items-center justify-center gap-2">
              <MdOutlineKeyboardArrowLeft
                size={26}
                className="text-gray-500 -mt-4 mr-1 cursor-pointer transition-colors"
              />

              <div className="text-center">
                <h2 className="text-lg mt-2 font-semibold text-gray-900">
                  {taskData.date}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Today</p>
              </div>

              <MdOutlineKeyboardArrowRight
                size={26}
                className="text-gray-500 -mt-4 ml-1 cursor-pointer transition-colors"
              />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Task ID:</span>
              <span className="ml-1 font-semibold text-gray-900">
                {taskData.taskId}
              </span>
            </div>
            {activeTab === "info" && (
              <span
                className={`px-3 py-2 rounded-full text-xs font-semibold ${getPriorityColor(
                  taskData.priority
                )}`}
              >
                {taskData.priority}
              </span>
            )}

            <div className="flex bg-[#FFFAF2] px-2 py-2 rounded-3xl items-center gap-2 text-[#818181]">
              <Image
                src="/icons/hour-glass-icon.svg"
                alt="Clock Icon"
                width={16}
                height={16}
              />
              <span className="text-sm font-medium">{taskData.status}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "info"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Task Info
            </button>
            <button
              onClick={() => setActiveTab("log")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "log"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Task Log
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-280px)]">
          {activeTab === "info" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TbLuggage className="text-[#126ACB] bg-blue-100 rounded-full px-1.5 py-1.5 w-8 h-8" />
                    <h3 className="font-semibold text-gray-900">
                      {taskData.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500 underline cursor-pointer hover:text-gray-700">
                    {taskData.bookingId}
                  </span>
                </div>
                <p className="text-sm text-gray-500 ml-7">Documents</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Description
                </h4>
                <span className="text-sm flex gap-1 text-gray-600">
                  Please Upload required documents to{" "}
                  <p className="text-[#020202] font-semibold">Booking-OS</p>{" "}
                  with{" "}
                  <p className="text-[#020202] font-semibold"> ID #OS-ABC12</p>{" "}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Due Date
                  </h4>
                  <p className="text-sm font-semibold text-gray-900">
                    {taskData.dueDate}
                  </p>
                </div>
                <div className="mx-auto">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Due Time
                  </h4>
                  <p className="text-sm font-semibold text-gray-900">
                    {taskData.dueTime}
                  </p>
                </div>
                <div className="ml-20">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Date Created
                  </h4>
                  <p className="text-sm font-semibold text-gray-900">
                    {taskData.dateCreated}
                  </p>
                </div>
              </div>

              {/* Assigned To and By */}
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Assigned To
                  </h4>
                  <p className="text-sm font-semibold text-gray-900">
                    {taskData.assignedTo}
                  </p>
                </div>
                <div className="ml-47">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Assigned By
                  </h4>
                  <p className="text-sm font-semibold text-gray-900">
                    {taskData.assignedBy}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">
                  Attached Files ({taskData.attachedFiles})
                </h4>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                    <span className="text-sm text-blue-600 font-medium">
                      File_1.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                    <span className="text-sm text-blue-600 font-medium">
                      File_2.pdf
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                    <span className="text-sm text-blue-600 font-medium">
                      File_3.pdf
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "log" && (
            <div className="py-4">
              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Task Added */}
                <div className="relative flex gap-4 mb-8">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center z-10">
                    <CiCirclePlus
                      size={24}
                      className="text-blue-600 font-bold"
                    />
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-4 mt-1">
                    <h3 className="text-blue-600 font-semibold text-lg mb-3">
                      Task Added
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">
                      <span className="font-semibold">
                        Documents task (TA-ABC12)
                      </span>{" "}
                      has been added to{" "}
                      <span className="font-semibold">
                        Booking - OS (OS-ABC12)
                      </span>
                      .
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <GoPerson className="w-3 h-3" />
                        <span>Yash Manocha</span>
                      </div>
                      <div className="ml-60 flex gap-2">
                        <div className="flex items-center gap-1">
                          <FaRegCalendar className="w-3 h-3" />
                          <span>05-05-2025</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaRegClock className="w-3 h-3" />
                          <span>10:45</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Modified 1 */}
                <div className="relative flex gap-4 mb-8">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center z-10">
                    <TbSquareToggle size={24} className="text-orange-600" />
                  </div>
                  <div className="flex-1 bg-orange-50 rounded-lg p-4 mt-1">
                    <h3 className="text-orange-600 font-semibold text-lg mb-3">
                      Task Modified
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">
                      <span className="font-semibold">Task (TA-ABC12)</span> has
                      been modified.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <GoPerson className="w-3 h-3" />
                        <span>Ravi Kumar</span>
                      </div>
                      <div className="ml-65 flex gap-2">
                        <div className="flex items-center gap-1">
                          <FaRegCalendar className="w-3 h-3" />
                          <span>06-05-2025</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaRegClock className="w-3 h-3" />
                          <span>18:30</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Modified 2 */}
                <div className="relative flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center z-10">
                    <TbSquareToggle size={24} className="text-orange-600" />
                  </div>
                  <div className="flex-1 bg-orange-50 rounded-lg p-4 mt-1">
                    <h3 className="text-orange-600 font-semibold text-lg mb-3">
                      Task Modified
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">
                      <span className="font-semibold">Task (TA-ABC12)</span> has
                      been modified.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <GoPerson className="w-3 h-3" />
                        <span>Yash Manocha</span>
                      </div>
                      <div className="ml-59 flex gap-2">
                        <div className="flex items-center gap-1">
                          <FaRegCalendar className="w-3 h-3" />
                          <span>08-05-2025</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaRegClock className="w-3 h-3" />
                          <span>13:00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4">
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-lg font-medium hover:bg-teal-50 transition-colors"
            >
              Edit Task
            </button>
            <button
              onClick={() => {
                onMarkComplete?.();
                onClose();
              }}
              className="flex-1 px-6 py-3 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 transition-colors"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ViewTaskModal);
