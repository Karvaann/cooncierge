"use client";

import React, { useEffect, useCallback, useState } from "react";
import AddTaskModal from "../AddTaskModal";
import { RxCross2 } from "react-icons/rx";
import { FiAlertTriangle } from "react-icons/fi";
import ViewTaskModal from "./ViewTaskModal";

import PriorityTaskCard from "@/components/PriorityTaskCard";

interface DayWiseTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskClick?: (taskId: string) => void;
  text?: string;
}

type PriorityTab = "high" | "medium" | "low" | "completed";

const completedTasks = [
  {
    id: "TA-ABC16",
    title: "General",
    subtitle: "Documents",
    description: "Documents need to be verified",
    assignedBy: "Yash Manocha",
    iconType: "document",
    assignees: [
      {
        short: "AS",
        full: "Avanish Sharma",
        color: "border-pink-700 text-pink-700",
      },
      {
        short: "AK",
        full: "Ankit Kumar",
        color: "border-[#AF52DE] text-[#AF52DE]",
      },
      {
        short: "SR",
        full: "Suresh Raj",
        color: "border-[#5856D6] text-[#5856D6]",
      },
      {
        short: "VG",
        full: "Vijay Gupta",
        color: "border-cyan-700 text-cyan-700",
      },
    ],
    dateTime: "09-05-2025, 09:00",
  },
  {
    id: "TA-ABC17",
    title: "Booking - OS",
    subtitle: "Follow up",
    description: "Follow up needed in Booking - OS with ID, OS-ABC13",

    assignedBy: "Yash Manocha",
    iconType: "booking",
    assignees: [
      {
        short: "AS",
        full: "Avanish Sharma",
        color: "border-pink-700 text-pink-700",
      },
      {
        short: "AK",
        full: "Ankit Kumar",
        color: "border-[#AF52DE] text-[#AF52DE]",
      },
      {
        short: "SR",
        full: "Suresh Raj",
        color: "border-[#5856D6] text-[#5856D6]",
      },
      {
        short: "VG",
        full: "Vijay Gupta",
        color: "border-cyan-700 text-cyan-700",
      },
    ],
    dateTime: "09-05-2025, 14:00",
  },
  {
    id: "TA-ABC18",
    title: "Booking - IS",
    subtitle: "Payment",
    description:
      "Payment verification required for Booking - IS with ID, IS-XYZ45",

    assignedBy: "Ravi Kumar",
    iconType: "booking",
    assignees: [
      {
        short: "AS",
        full: "Avanish Sharma",
        color: "border-pink-700 text-pink-700",
      },
      {
        short: "VG",
        full: "Vijay Gupta",
        color: "border-cyan-700 text-cyan-700",
      },
    ],
    dateTime: "09-05-2025, 16:30",
  },
  {
    id: "TA-ABC19",
    title: "General",
    subtitle: "Email",
    description: "Send confirmation email to client",

    assignedBy: "Akash Kapoor",
    iconType: "document",
    assignees: [
      {
        short: "AS",
        full: "Avanish Sharma",
        color: "border-pink-700 text-pink-700",
      },
      {
        short: "AK",
        full: "Ankit Kumar",
        color: "border-[#AF52DE] text-[#AF52DE]",
      },
    ],
    dateTime: "09-05-2025, 11:15",
  },
  {
    id: "TA-ABC20",
    title: "Booking - FS",
    subtitle: "Documents",
    description: "Upload documents to Booking - FS with ID #FS-QWE78",

    assignedBy: "Yash Manocha",
    iconType: "booking",
    assignees: [
      {
        short: "SR",
        full: "Suresh Raj",
        color: "border-[#5856D6] text-[#5856D6]",
      },
      {
        short: "VG",
        full: "Vijay Gupta",
        color: "border-cyan-700 text-cyan-700",
      },
    ],
    dateTime: "09-05-2025, 13:45",
  },
];

const DayWiseTaskModal: React.FC<DayWiseTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskClick,
  text = "OS-ABC12",
}) => {
  const [activeTab, setActiveTab] = React.useState<PriorityTab>("high");
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = React.useState(false);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);

  const openAddTaskModal = () => {
    setIsAddTaskModalOpen(true);
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

  const getTabStyles = (tab: PriorityTab) => {
    const isActive = activeTab === tab;

    if (tab === "high") {
      return isActive
        ? "bg-red-100 text-red-700 font-medium text-[0.55rem]"
        : "text-gray-600";
    } else if (tab === "medium") {
      return isActive
        ? "bg-yellow-100 text-yellow-700 font-medium text-[0.55rem]"
        : "text-gray-600";
    } else if (tab === "low") {
      return isActive
        ? "bg-green-100 text-green-700 font-medium text-[0.55rem]"
        : "text-gray-600";
    } else {
      return isActive
        ? "bg-gray-200 text-gray-800 font-medium text-[0.55rem]"
        : "text-gray-600";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/40 flex justify-center items-center"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-xl p-2 shadow-xl overflow-hidden 
        w-[32vw] h-[70vh] 
        transition-all duration-300 transform flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="relative flex flex-col items-center px-3 py-2">
          <button
            onClick={onClose}
            className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 transition"
          >
            <RxCross2 size={18} />
          </button>

          <div className="w-full flex flex-col items-start ml-1">
            <div className="flex gap-2 mt-1">
              <h2 className="text-[0.85rem] font-semibold text-gray-900 mb-2">
                {text}
              </h2>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="text-[0.75rem] text-black font-medium">
                BOOKINGS - OS
              </div>
            </div>

            <hr className="mb-3 w-full border-t border-gray-200" />

            {/* STATS BAR */}
            <div className="flex gap-3 mb-3 w-[10rem] border border-gray-200 px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-2 border-r border-gray-300 ml-1 pr-3">
                <span className="text-gray-600 text-[0.65rem]">Total</span>
                <span className="font-semibold text-gray-900 text-[0.75rem]">
                  4
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-[0.65rem]">Overdue</span>
                <span className="font-semibold text-red-600 text-[0.75rem]">
                  1
                </span>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2">
            {(["high", "medium", "low", "completed"] as PriorityTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-1 whitespace-nowrap rounded-full flex items-center gap-1 text-xs transition-all ${getTabStyles(
                    tab
                  )}`}
                >
                  {tab === "high" && (
                    <FiAlertTriangle className="w-3 h-3 text-red-700" />
                  )}
                  {tab === "high" && "High Priority (1)"}
                  {tab === "medium" && "Medium Priority (0)"}
                  {tab === "low" && "Low Priority (0)"}
                  {tab === "completed" && "Completed (3)"}
                </button>
              )
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-3 py-2 overflow-y-auto flex-1 space-y-3">
          {/* HIGH PRIORITY */}
          {activeTab === "high" && (
            <PriorityTaskCard
              priority="high"
              taskId="TA-ABC15"
              date="09-05-2025"
              title="Booking - OS"
              description="Upload documents for Booking - OS (#OS-ABC16)"
              assignedBy="Yash"
              assignees={[
                {
                  short: "AS",
                  full: "Avanish Sharma",
                  color: "border-pink-700 text-pink-700",
                },
                {
                  short: "AK",
                  full: "Ankit Kumar",
                  color: "border-[#AF52DE] text-[#AF52DE]",
                },
                {
                  short: "SR",
                  full: "Suresh Raj",
                  color: "border-[#5856D6] text-[#5856D6]",
                },
                {
                  short: "VG",
                  full: "Vijay Gupta",
                  color: "border-cyan-700 text-cyan-700",
                },
              ]}
              onClick={() => setIsViewTaskOpen(true)}
              borderColor="border-red-400"
            />
          )}

          {/* EMPTY STATES */}
          {activeTab === "medium" && (
            <p className="text-center text-xs text-gray-500 py-10">
              No tasks here
            </p>
          )}

          {activeTab === "low" && (
            <p className="text-center text-xs text-gray-500 py-10">
              No tasks here
            </p>
          )}

          {/* COMPLETED */}
          {activeTab === "completed" &&
            completedTasks.map((task, index) => (
              <PriorityTaskCard
                key={task.id}
                priority="completed"
                taskId={task.id}
                date={task.dateTime}
                title={task.title}
                description={task.description}
                assignedBy={task.assignedBy ?? ""}
                assignees={task.assignees}
                onClick={() => setIsViewTaskOpen(true)}
              />
            ))}
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex justify-end">
          <button
            type="button"
            onClick={openAddTaskModal}
            className="flex items-center text-[0.75rem] justify-center h-7 px-3 py-2 rounded-lg font-semibold 
               border border-[#0D4B37] bg-white text-[#0D4B37] text-center 
               font-poppins text-base leading-6 hover:bg-gray-200 transition-colors"
          >
            + Add Task
          </button>
        </div>
      </div>

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
      />

      <ViewTaskModal
        isOpen={isViewTaskOpen}
        onClose={() => setIsViewTaskOpen(false)}
      />
    </div>
  );
};

export default React.memo(DayWiseTaskModal);
