"use client";

import React, { useEffect, useCallback } from "react";

interface DueTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskClick?: (taskId: string) => void;
}

type PriorityTab = "high" | "medium" | "low";

const DueTodayModal: React.FC<DueTodayModalProps> = ({
  isOpen,
  onClose,
  onTaskClick,
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

  // tab button styling
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
    } else {
      return isActive
        ? "bg-green-100 text-green-700 font-semibold"
        : "text-gray-600";
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
        className="bg-white rounded-xl p-2 shadow-xl overflow-hidden max-w-3xl w-[700px] h-[700px] mx-4 transition-all duration-300 transform max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl font-semibold border-r border-gray-200 pe-2 text-gray-900">
                Tasks due today (2)
              </h2>
              <span className="text-gray-500">10th May 2025</span>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 -mt-4 transition-colors"
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

          <hr className="mb-6 -mt-2 border-t border-gray-200" />

          {/* Priority Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("high")}
              className={`px-4 py-2 rounded-full text-sm transition-all ${getTabStyles(
                "high"
              )}`}
            >
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
              Low Priority (1)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {activeTab === "high" && (
            <div className="space-y-4">
              {/* Task Card */}
              <div
                className="border-2 border-red-300 h-[210px] rounded-xl p-4 bg-white hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => onTaskClick?.("TA-ABC12")}
              >
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-4 border-white"></div>

                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      Task ID:{" "}
                      <span className="font-semibold text-gray-900">
                        TA-ABC12
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">10-05-2025, 10:00</div>
                </div>

                <div className="flex items-center w-[580px] rounded-lg bg-gray-100 p-2 justify-between mb-3">
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
                    OS-ABC12
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-4 mt-4">
                  Upload documents to{" "}
                  <span className="font-semibold">Booking - OS</span> with ID{" "}
                  <span className="font-semibold">#OS-ABC12</span>
                </p>

                {/* assignee circles */}
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
            <div className="space-y-4">
              {/* Task Card */}
              <div
                className="border-2 border-green-300 rounded-xl p-4 bg-white hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => onTaskClick?.("TA-ABC12")}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      Task ID:{" "}
                      <span className="font-semibold text-gray-900">
                        TA-ABC12
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">10-05-2025, 10:00</div>
                </div>

                <div className="flex items-center w-[580px] rounded-lg bg-gray-100 p-2 justify-between mb-3">
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
                    OS-ABC12
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-4 mt-4">
                  Upload documents to{" "}
                  <span className="font-semibold">Booking - OS</span> with ID{" "}
                  <span className="font-semibold">#OS-ABC12</span>
                </p>

                {/* assignees */}
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
        </div>
      </div>
    </div>
  );
};

export default React.memo(DueTodayModal);
