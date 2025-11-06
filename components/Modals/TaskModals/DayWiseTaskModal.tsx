"use client";

import React, { useEffect, useCallback } from "react";
import { TbLuggage } from "react-icons/tb";
import { TbArticle } from "react-icons/tb";

interface DayWiseTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskClick?: (taskId: string) => void;
  date?: string;
}

type PriorityTab = "high" | "medium" | "low" | "completed";

const completedTasks = [
  {
    id: "TA-ABC16",
    title: "General",
    subtitle: "Documents",
    description: "Documents need to be verified",
    bookingId: null,
    assignedBy: "Yash Manocha",
    assignees: ["AS", "AK", "SR", "VG"],
    dateTime: "09-05-2025, 09:00",
    icon: "general",
  },
  {
    id: "TA-ABC17",
    title: "Booking - OS",
    subtitle: "Follow up",
    description: "Follow up needed in Booking - OS with ID, OS-ABC13",
    bookingId: "OS-ABC13",
    assignedBy: "Yash Manocha",
    assignees: ["AS", "AK", "SR", "VG"],
    dateTime: "09-05-2025, 14:00",
    icon: "booking",
  },
  {
    id: "TA-ABC18",
    title: "Booking - IS",
    subtitle: "Payment",
    description:
      "Payment verification required for Booking - IS with ID, IS-XYZ45",
    bookingId: "IS-XYZ45",
    assignedBy: "Ravi Kumar",
    assignees: ["AS", "VG"],
    dateTime: "09-05-2025, 16:30",
    icon: "booking",
  },
  {
    id: "TA-ABC19",
    title: "General",
    subtitle: "Email",
    description: "Send confirmation email to client",
    bookingId: null,
    assignedBy: "Akash Kapoor",
    assignees: ["AS", "AK"],
    dateTime: "09-05-2025, 11:15",
    icon: "general",
  },
  {
    id: "TA-ABC20",
    title: "Booking - FS",
    subtitle: "Documents",
    description: "Upload documents to Booking - FS with ID #FS-QWE78",
    bookingId: "FS-QWE78",
    assignedBy: "Yash Manocha",
    assignees: ["SR", "VG"],
    dateTime: "09-05-2025, 13:45",
    icon: "booking",
  },
];

const DayWiseTaskModal: React.FC<DayWiseTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskClick,
  date = "Thursday, 9th May 2025",
}) => {
  const [activeTab, setActiveTab] = React.useState<PriorityTab>("high");

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

  const getTabStyles = (tab: PriorityTab) => {
    const isActive = activeTab === tab;

    if (tab === "high") {
      return isActive
        ? "bg-red-100 text-red-700 font-semibold"
        : "text-gray-600";
    } else if (tab === "medium") {
      return isActive
        ? "bg-yellow-100 text-yellow-700 font-semibold"
        : "text-gray-600";
    } else if (tab === "low") {
      return isActive
        ? "bg-green-100 text-green-700 font-semibold"
        : "text-gray-600";
    } else {
      return isActive
        ? "bg-gray-200 text-gray-800 font-semibold"
        : "text-gray-600";
    }
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-white text-pink-700 border-pink-700",
      "bg-white text-[#AF52DE] border-[#AF52DE]",
      "bg-white text-[#5856D6] border-[#5856D6]",
      "bg-white text-cyan-700 border-cyan-700",
    ];
    return colors[index % colors.length];
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
        className="bg-white rounded-xl p-2 shadow-xl overflow-hidden w-[39.93vw] h-[700px] mx-4 transition-all duration-300 transform flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex flex-col items-center">
          <div className="flex justify-center items-center mb-4 gap-35">
            <div className="flex items-center gap-3">
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-xl font-bold text-gray-900">{date}</h2>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 -mr-40 hover:text-gray-600 transition-colors"
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

          {/* Task Stats */}
          <div className="flex gap-4 mb-4 w-[17.1875rem] bg-white border border-gray-200 px-4 py-2 rounded-lg align-items-center">
            <div className="flex items-center gap-3 border-r border-gray-300 pr-2 -mr-[2px]">
              <span className="text-gray-600 text-sm">Total Task</span>
              <span className="font-bold text-gray-900 text-lg mr-1">4</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-sm">Task Overdue</span>
              <span className="font-bold text-red-600 text-lg">1</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("high")}
              className={`px-4 py-2 rounded-full text-sm transition-all flex items-center gap-2 ${getTabStyles(
                "high"
              )}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
              High Priority (1)
            </button>
            <button
              onClick={() => setActiveTab("medium")}
              className={`px-4 py-2 rounded-full text-sm transition-all ${getTabStyles(
                "medium"
              )}`}
            >
              Medium Priority (0)
            </button>
            <button
              onClick={() => setActiveTab("low")}
              className={`px-4 py-2 rounded-full text-sm transition-all ${getTabStyles(
                "low"
              )}`}
            >
              Low Priority (0)
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-full text-sm transition-all ${getTabStyles(
                "completed"
              )}`}
            >
              Completed (3)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {activeTab === "high" && (
            <div className="space-y-4">
              <div
                className="border-2 border-red-300 rounded-xl p-4 bg-white hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => onTaskClick?.("TA-ABC15")}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 rounded-xl bg-red-200 px-2 py-1 text-[#EB382B] text-sm">
                    <div className="w-2 h-2 bg-[#EB382B] rounded-full"></div>
                    Overdue
                  </div>
                  <div className="flex-1 text-center text-sm text-gray-600">
                    Task ID:{" "}
                    <span className="font-semibold text-gray-900">
                      TA-ABC15
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">09-05-2025, 15:30</div>
                </div>

                <div className="flex items-center w-full rounded-lg bg-gray-100 p-2 justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                    </svg>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Booking - OS
                      </div>
                      <div className="text-xs text-gray-500">Documents</div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 underline">
                    OS-ABC16
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-4 mt-4">
                  Upload documents to{" "}
                  <span className="font-semibold">Booking - OS</span> with ID{" "}
                  <span className="font-semibold">#OS-ABC16</span>
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Assigned By:{" "}
                    <span className="font-semibold">Yash Manocha</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600 mr-2">
                      Assignees:
                    </span>
                    <div className="w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center text-xs font-semibold border-2 border-white">
                      AS
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-xs font-semibold border-2 border-white -ml-2">
                      AK
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-semibold border-2 border-white -ml-2">
                      SR
                    </div>
                    <div className="w-8 h-8 rounded-full bg-cyan-200 text-cyan-700 flex items-center justify-center text-xs font-semibold border-2 border-white -ml-2">
                      VG
                    </div>
                  </div>
                </div>

                <div className="absolute right-2 top-1/2 mt-3 -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
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
                </div>
              </div>
            </div>
          )}

          {activeTab === "medium" && (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-500 text-lg">No tasks to show here</p>
            </div>
          )}

          {activeTab === "low" && (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-500 text-lg">No tasks to show here</p>
            </div>
          )}

          {/* Completed Tab */}
          {activeTab === "completed" && (
            <div className="space-y-4">
              {completedTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => onTaskClick?.(task.id)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 bg-green-100 rounded-2xl px-2 py-1 text-[#4CA640] text-sm">
                      <div className="w-2 h-2 bg-[#4CA640] rounded-full"></div>
                      Completed
                    </div>
                    <div className="flex-1 text-center text-sm text-gray-600">
                      Task ID:{" "}
                      <span className="font-semibold ml-1 text-[#414141]">
                        {task.id}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mr-4">
                      {task.dateTime}
                    </div>
                  </div>

                  {/* Task Info */}
                  <div className="flex items-center justify-between w-full rounded-lg bg-gray-100 p-2 mb-3">
                    <div className="flex items-center gap-2">
                      {task.icon === "booking" ? (
                        <TbLuggage className="text-[#126ACB] w-5 h-5 -mt-2" />
                      ) : (
                        <TbArticle className="text-[#A2845E] w-5 h-5 -mt-2" />
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {task.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.subtitle}
                        </div>
                      </div>
                    </div>
                    {task.bookingId && (
                      <span className="text-sm text-gray-500 underline">
                        {task.bookingId}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#818181]">
                      Assigned By:{" "}
                      <span className="font-semibold text-[#414141]">
                        {task.assignedBy}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mr-3">
                      <span className="text-sm text-gray-600 mr-2">
                        Assignees:
                      </span>
                      {task.assignees.map((assignee, idx) => (
                        <div
                          key={idx}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                            idx > 0 ? "-ml-3" : ""
                          } ${getAvatarColor(idx)}`}
                        >
                          {assignee}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute right-1 top-1/2 mt-3 -translate-y-1/2">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(DayWiseTaskModal);
