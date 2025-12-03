"use client";

import React, { useEffect, useCallback } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { TbSquareToggle } from "react-icons/tb";
import { FaRegCalendar } from "react-icons/fa";
import { FaRegClock } from "react-icons/fa";
import { GoPerson } from "react-icons/go";
import { FaRegFolder } from "react-icons/fa";
import Image from "next/image";

interface ViewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: any) => void;
  onMarkComplete?: () => void;
  task?: any | null;
}

const ViewTaskModal: React.FC<ViewTaskModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onMarkComplete,
  task,
}) => {
  const [activeTab, setActiveTab] = React.useState<"info" | "log">("info");

  // Derived task fields
  const t: any = task || {};
  const taskId: string = t.taskId || t._id || "-";
  const status: string = t.status || "Pending";
  const priorityRaw: string = (t.priority || "").toString();
  const priorityDisplay =
    priorityRaw.toLowerCase() === "high"
      ? "High Priority"
      : priorityRaw.toLowerCase() === "medium"
      ? "Medium Priority"
      : priorityRaw.toLowerCase() === "low"
      ? "Low Priority"
      : priorityRaw || "-";
  const title: string = t.title || t.subCategory || t.category || "-";
  const description: string = t.description || t.activity || "-";
  const dueISO: string | undefined = t.dueDate || t.dueISO;
  const createdISO: string | undefined = t.dateTime || t.createdAt;
  const assignedBy: string = t.assignedByName || t.assignedBy || "-";
  const assignedTo: string[] = Array.isArray(t.assignees)
    ? t.assignees
        .map((a: any) =>
          typeof a === "string" ? a : a?.full || a?.name || a?.email
        )
        .filter((v: any) => typeof v === "string" && v.trim().length > 0)
    : [];

  const taskLogs: Array<{
    heading?: string;
    description?: string;
    logBy?: string;
    logDate?: string | Date;
  }> = Array.isArray(t.logs) ? t.logs : [];

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "2-digit",
    };
    return d.toLocaleDateString(undefined, options);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
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
      className="fixed inset-0 z-[140] bg-black/40 flex justify-center items-center"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[500px] h-fit max-w-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-4 mt-2">
            <div className="flex-1 flex items-center justify-center gap-2 ml-4">
              <h2 className="text-[0.8rem] font-semibold text-gray-900">
                {taskId}
              </h2>
              <div className="w-px h-5 bg-gray-300"></div>
              <div className="text-[0.75rem] text-black font-medium">
                {t.category ? String(t.category).toUpperCase() : "TASK"}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-5"
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

          {/* Task ID + Priority */}
          <div className="flex items-center justify-between mb-2 mt-2">
            <div className="flex items-center gap-1">
              <span className="text-[0.75rem] text-gray-600">Task ID:</span>
              <span className="font-semibold text-[0.75rem] text-gray-900">
                {taskId}
              </span>
            </div>

            {activeTab === "info" && (
              <span
                className={`px-2 py-1 -ml-2 rounded-full text-[0.65rem] font-semibold ${getPriorityColor(
                  priorityDisplay
                )}`}
              >
                {priorityDisplay}
              </span>
            )}

            <div className="flex bg-[#FFF7E8] px-2 py-1 rounded-2xl items-center gap-1 text-[#818181]">
              <Image
                src="/icons/hour-glass-icon.svg"
                alt="Clock"
                width={12}
                height={12}
              />
              <span className="text-[0.7rem] font-medium">{status} Task</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-3 py-2 text-[0.75rem] ${
                activeTab === "info"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-500"
              }`}
            >
              Task Info
            </button>
            <button
              onClick={() => setActiveTab("log")}
              className={`px-3 py-2 text-[0.75rem] ${
                activeTab === "log"
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-500"
              }`}
            >
              Task Log
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-4 py-3 overflow-y-auto">
          {activeTab === "info" && (
            <div className="space-y-4 text-left">
              {/* Top Block */}
              <div>
                <div className="flex items-center justify-between mb-1 bg-gray-100 px-3 py-2 rounded-md">
                  <h3 className="font-medium text-[0.8rem] text-gray-900">
                    {title}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <div className="text-left">
                <h4 className="text-[0.75rem] font-medium text-gray-700 mb-1">
                  Description
                </h4>
                <p className="text-[0.75rem] text-gray-600">{description}</p>
              </div>

              {/* Due / Created */}
              <div className="grid grid-cols-3 gap-3 border-b border-gray-200 pb-3">
                <div className="text-left">
                  <h4 className="text-[0.7rem] text-gray-500">Due Date</h4>
                  <p className="text-[0.75rem] font-medium">
                    {formatDate(dueISO)}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-[0.7rem] text-gray-500">Due Time</h4>
                  <p className="text-[0.75rem] font-medium">
                    {formatTime(dueISO)}
                  </p>
                </div>
                <div className="text-right">
                  <h4 className="text-[0.7rem] text-gray-500">Date Created</h4>
                  <p className="text-[0.75rem] font-medium">
                    {formatDate(createdISO)}
                  </p>
                </div>
              </div>

              {/* Assigned */}
              <div className="grid grid-cols-2 gap-3 border-b border-gray-200 pb-3">
                <div className="text-left">
                  <h4 className="text-[0.7rem] text-gray-500">Assigned To</h4>
                  <p className="text-[0.75rem] font-medium text-gray-900">
                    {assignedTo.length ? assignedTo.join(", ") : "-"}
                  </p>
                </div>
                <div className="text-right">
                  <h4 className="text-[0.7rem] text-gray-500">Assigned By</h4>
                  <p className="text-[0.75rem] font-medium">{assignedBy}</p>
                </div>
              </div>

              {/* Attached Files (static placeholders) */}
              {/* <div className="text-left mb-2">
                <h4 className="text-[0.75rem] text-gray-500 mb-1">
                  Attached Files (
                  {Array.isArray(t.files)
                    ? t.files.length
                    : t.attachedFiles || 0}
                  )
                </h4>

                <div className="flex gap-2">
                  {[1, 2, 3].map((num) => (
                    <div
                      key={num}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100"
                    >
                      <FaRegFolder className="text-blue-500 w-3 h-3" />
                      <span className="text-[0.7rem] text-blue-500 font-normal">
                        File_{num}.pdf
                      </span>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          )}

          {/* LOG TAB (dynamic from task.logs) */}
          {activeTab === "log" && (
            <div className="py-2 ml-6 -mt-2">
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-gray-200"></div>

                {(!taskLogs || taskLogs.length === 0) && (
                  <div className="text-center text-[0.75rem] text-gray-500 py-4">
                    No activity yet
                  </div>
                )}

                {taskLogs
                  .slice()
                  .sort((a, b) => {
                    const ad = new Date(a?.logDate || 0).getTime();
                    const bd = new Date(b?.logDate || 0).getTime();
                    return bd - ad; // newest first
                  })
                  .map((entry, idx) => {
                    const heading = String(entry?.heading || "");
                    const desc = String(entry?.description || "");
                    const isCreated = /created/i.test(heading);
                    const isUpdated = /updated|modified/i.test(heading);
                    const isCategoryChange =
                      /category|sub\s*category/i.test(heading) ||
                      /category|sub\s*category/i.test(desc);

                    let Icon = CiCirclePlus;
                    let badgeBg = "bg-blue-100";
                    let cardBg = "bg-blue-50";
                    let titleColor = "text-blue-600";
                    let resolvedHeading = heading;

                    if (isUpdated && !isCreated) {
                      Icon = TbSquareToggle;
                      if (isCategoryChange) {
                        badgeBg = "bg-blue-100";
                        cardBg = "bg-blue-50";
                        titleColor = "text-blue-600";
                      } else {
                        badgeBg = "bg-orange-100";
                        cardBg = "bg-orange-50";
                        titleColor = "text-orange-600";
                      }
                      resolvedHeading = "Task has been Modified";
                    }

                    const by = entry?.logBy || "-";
                    const dateStr = formatDate(String(entry?.logDate || ""));
                    const timeStr = formatTime(String(entry?.logDate || ""));
                    const key = `${resolvedHeading}-${String(
                      entry?.logDate || idx
                    )}-${idx}`;
                    const fromToMatch = /(from)\s+(.+?)\s+(to)\s+(.+)/i.exec(
                      desc
                    );

                    return (
                      <div className="relative flex gap-3 mb-6" key={key}>
                        <div
                          className={`w-10 h-10 ${badgeBg} rounded-full flex items-center justify-center z-10`}
                        >
                          <Icon
                            size={18}
                            className={
                              isCreated
                                ? "text-blue-600"
                                : isCategoryChange
                                ? "text-blue-600"
                                : "text-orange-600"
                            }
                          />
                        </div>
                        <div className={`${cardBg} rounded-md p-3 w-[20rem]`}>
                          <div className="text-left">
                            <h3
                              className={`${titleColor} font-semibold text:[0.8rem] mb-1`}
                            >
                              {isCreated ? (
                                heading || "Task Created"
                              ) : (
                                <>
                                  Task '
                                  <span className="font-bold">{taskId}</span>'
                                  has been modified.
                                </>
                              )}
                            </h3>
                            <hr className="mb-2 mt-1 border-t border-gray-200" />
                            {isCreated && (
                              <p className="text-[0.7rem] text-gray-700 mb-2">
                                {entry?.description || "Task created"}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[0.6rem] text-gray-500">
                            <div className="flex items-center gap-1">
                              <GoPerson className="w-3 h-3" />
                              <span>{by}</span>
                            </div>
                            <div className="flex gap-3">
                              <div className="flex items-center gap-1">
                                <FaRegCalendar className="w-3 h-3" />
                                <span>{dateStr}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaRegClock className="w-3 h-3" />
                                <span>{timeStr}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-3 flex gap-2">
          <button
            onClick={() => {
              if (status.toLowerCase() === "completed") return;
              onEdit?.(t);
            }}
            disabled={status.toLowerCase() === "completed"}
            className={`flex-1 px-4 py-1.5 font-semibold rounded-md text-[0.75rem] border transition-colors 
              ${
                status.toLowerCase() === "completed"
                  ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100"
                  : "border-blue-600 text-blue-600 hover:bg-blue-50"
              }`}
          >
            {status.toLowerCase() === "completed" ? "Locked" : "Edit Task"}
          </button>

          <button
            onClick={() => {
              if (status.toLowerCase() === "completed") return;
              onMarkComplete?.();
              onClose();
            }}
            disabled={status.toLowerCase() === "completed"}
            className={`flex-1 px-4 py-1.5 rounded-md text-[0.75rem] font-semibold transition-colors 
              ${
                status.toLowerCase() === "completed"
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#0D4B37] text-white hover:bg-teal-800"
              }`}
          >
            {status.toLowerCase() === "completed"
              ? "Completed"
              : "Mark Complete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ViewTaskModal);
