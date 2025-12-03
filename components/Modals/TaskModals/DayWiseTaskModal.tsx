"use client";
import { getTeams } from "@/services/teamsApi";
import React, { useEffect, useCallback, useState } from "react";
import AddTaskModal from "../AddTaskModal";
import { RxCross2 } from "react-icons/rx";
import { FiAlertTriangle } from "react-icons/fi";
import ViewTaskModal from "./ViewTaskModal";
import { updateLogStatus } from "@/services/logsApi";
import { getLogsByBookingId } from "@/services/logsApi";
import PriorityTaskCard from "@/components/PriorityTaskCard";
import { BookingApiService } from "@/services/bookingApi";

interface DayWiseTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskClick?: (taskId: string) => void;
  text?: string;
  bookingId?: string; // booking against which task is created
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
  text,
  bookingId,
}) => {
  const [activeTab, setActiveTab] = React.useState<PriorityTab>("high");
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = React.useState(false);
  const [isViewTaskOpen, setIsViewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [quotationId, setQuotationId] = useState<string>("");

  // Fetch quotation details to get customId
  useEffect(() => {
    if (!isOpen || !bookingId) return;

    const fetchQuotation = async () => {
      try {
        console.log("Fetching quotation for bookingId:", bookingId);
        const response = await BookingApiService.getQuotationById(bookingId);
        console.log("API Response:", response);

        if (response.success && response.data) {
          // The API returns { success: true, quotation: {...} }
          const data = response.data as any;
          console.log("Response data:", data);

          const quotation = data.quotation || data;
          console.log("Quotation object:", quotation);

          const customIdValue = quotation.customId || quotation._id || "";
          console.log("CustomId value:", customIdValue);

          setQuotationId(customIdValue);
        } else {
          console.error("API response not successful or no data:", response);
        }
      } catch (err) {
        console.error("Failed to fetch quotation:", err);
      }
    };

    fetchQuotation();
  }, [isOpen, bookingId]);

  // Fetch logs for this booking when modal opens or after edits
  useEffect(() => {
    if (!isOpen) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const isObjectId = (v: unknown) =>
          typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

        if (bookingId && isObjectId(bookingId)) {
          const resp = await getLogsByBookingId(bookingId);
          const list = Array.isArray(resp?.logs) ? resp.logs : [];
          const withPriority = list.filter((l: any) =>
            ["High", "Medium", "Low"].includes(l?.priority)
          );
          setLogs(withPriority);
        } else {
          if (bookingId) {
            console.warn(
              "Invalid or missing bookingId for task view:",
              bookingId
            );
          }
          setLogs([]);
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [isOpen, bookingId, selectedDate]);

  const highPriority = logs.filter(
    (l) =>
      l.priority?.toLowerCase() === "high" &&
      l.status?.toLowerCase() !== "completed"
  );
  const mediumPriority = logs.filter(
    (l) =>
      l.priority?.toLowerCase() === "medium" &&
      l.status?.toLowerCase() !== "completed"
  );
  const lowPriority = logs.filter(
    (l) =>
      l.priority?.toLowerCase() === "low" &&
      l.status?.toLowerCase() !== "completed"
  );
  const completedPriority = logs.filter(
    (l) => l.status?.toLowerCase() === "completed"
  );

  const openAddTaskModal = () => {
    // Creation mode: ensure previous edit context cleared
    setSelectedTask(null);
    setIsEditingTask(false);
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

  // Fetch teams once when modal opens to resolve assignedTo names
  useEffect(() => {
    const fetchTeams = async () => {
      if (!isOpen) return;
      try {
        setLoadingTeams(true);
        const resp = await getTeams();
        const list = Array.isArray(resp) ? resp : resp?.teams || [];
        setTeams(list);
      } catch (e) {
        console.error("Failed to load teams for task view:", e);
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, [isOpen]);

  const resolveAssignedToNames = (task: any): string[] => {
    const raw = task?.assignedTo;
    if (Array.isArray(raw) && raw.length) {
      // If backend populated assignedTo with team objects ({ _id, name }) we can directly read names
      if (typeof raw[0] === "object") {
        const objNames = raw
          .map((m: any) => (typeof m?.name === "string" ? m.name : null))
          .filter(Boolean) as string[];
        if (objNames.length) return objNames;
      }
      // Otherwise treat array as list of IDs and try to resolve from loaded teams
      if (teams.length) {
        const ids = raw.filter((v: any) => typeof v === "string");
        const names = ids
          .map((id: string) => teams.find((t: any) => t._id === id)?.name)
          .filter(Boolean) as string[];
        if (names.length) return names;
      }
    }
    return [];
  };

  const getInitials = (name: string): string => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) {
      const single = parts[0] || "";
      return single.slice(0, 2).toUpperCase();
    }
    const first = parts[0] || "";
    const last = parts[parts.length - 1] || "";
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  const formatDateTime = (value: string | Date): string => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year}, ${hours}:${minutes}`;
  };

  const getTabStyles = (tab: PriorityTab) => {
    const isActive = activeTab === tab;
    // Base consistent sizing & layout with larger font
    const base =
      "h-6 px-3 flex items-center rounded-full text-[0.65rem] font-normal border border-transparent";
    if (tab === "high") {
      return `${base} ${
        isActive
          ? "bg-red-100 text-red-700 font-medium border-red-300"
          : "bg-white text-gray-600"
      }`;
    } else if (tab === "medium") {
      return `${base} ${
        isActive
          ? "bg-yellow-100 text-yellow-700 font-medium border-yellow-300"
          : "bg-white text-gray-600"
      }`;
    } else if (tab === "low") {
      return `${base} ${
        isActive
          ? "bg-green-100 text-green-700 font-medium border-green-300"
          : "bg-white text-gray-600"
      }`;
    } else {
      return `${base} ${
        isActive
          ? "bg-gray-200 text-gray-800 font-medium border-gray-300"
          : "bg-white text-gray-600"
      }`;
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
        w-[500px] h-[70vh] 
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
                {quotationId || (bookingId ? "Loading..." : "No ID")}
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
                  {logs.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-[0.65rem]">Overdue</span>
                <span className="font-semibold text-red-600 text-[0.75rem]">
                  {highPriority.length}
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
                  className={`${getTabStyles(
                    tab
                  )} whitespace-nowrap transition-colors duration-150`}
                >
                  {tab === "high" && (
                    <FiAlertTriangle className="w-3 h-3 text-red-700 mr-2" />
                  )}
                  {tab === "high" && `High Priority (${highPriority.length})`}
                  {tab === "medium" &&
                    `Medium Priority (${mediumPriority.length})`}
                  {tab === "low" && `Low Priority (${lowPriority.length})`}
                  {tab === "completed" &&
                    `Completed (${completedPriority.length})`}
                </button>
              )
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-3 py-2 overflow-y-auto flex-1 space-y-3">
          {/* HIGH PRIORITY */}
          {activeTab === "high" && (
            <>
              {loading ? (
                <p className="text-center text-xs text-gray-500 py-10">
                  Loading...
                </p>
              ) : highPriority.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-10">
                  No high priority tasks
                </p>
              ) : (
                highPriority.map((task: any) => (
                  <PriorityTaskCard
                    key={task._id}
                    priority="high"
                    taskId={task._id}
                    date={task?.dateTime ? formatDateTime(task.dateTime) : "-"}
                    title={task?.subCategory || task?.category || "Task"}
                    description={task?.activity || "-"}
                    assignedBy={
                      typeof task?.assignedBy === "object"
                        ? task?.assignedBy?.name || "Unknown"
                        : task?.assignedByName || "Unknown"
                    }
                    assignees={resolveAssignedToNames(task).map(
                      (name: string) => ({
                        short: getInitials(name),
                        full: name,
                        color: "border-[#5856D6] text-[#5856D6]",
                      })
                    )}
                    onClick={() => {
                      setSelectedTask({
                        ...task,
                        assignees: resolveAssignedToNames(task),
                        assignedByName:
                          typeof task?.assignedBy === "object"
                            ? task?.assignedBy?.name || "Unknown"
                            : task?.assignedByName || "Unknown",
                      });
                      setIsViewTaskOpen(true);
                    }}
                    borderColor="border-red-400"
                  />
                ))
              )}
            </>
          )}

          {/* EMPTY STATES */}
          {activeTab === "medium" &&
            (mediumPriority.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-10">
                No tasks here
              </p>
            ) : (
              mediumPriority.map((task: any) => (
                <PriorityTaskCard
                  key={task._id}
                  priority="medium"
                  taskId={task._id}
                  date={task?.dateTime ? formatDateTime(task.dateTime) : "-"}
                  title={task?.subCategory || task?.category || "Task"}
                  description={task?.activity || "-"}
                  assignedBy={
                    typeof task?.assignedBy === "object"
                      ? task?.assignedBy?.name || "Unknown"
                      : task?.assignedByName || "Unknown"
                  }
                  assignees={resolveAssignedToNames(task).map(
                    (name: string) => ({
                      short: getInitials(name),
                      full: name,
                      color: "border-[#5856D6] text-[#5856D6]",
                    })
                  )}
                  onClick={() => {
                    setSelectedTask({
                      ...task,
                      assignees: resolveAssignedToNames(task),
                      assignedByName:
                        typeof task?.assignedBy === "object"
                          ? task?.assignedBy?.name || "Unknown"
                          : task?.assignedByName || "Unknown",
                    });
                    setIsViewTaskOpen(true);
                  }}
                />
              ))
            ))}

          {activeTab === "low" &&
            (lowPriority.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-10">
                No tasks here
              </p>
            ) : (
              lowPriority.map((task: any) => (
                <PriorityTaskCard
                  key={task._id}
                  priority="low"
                  taskId={task._id}
                  date={task?.dateTime ? formatDateTime(task.dateTime) : "-"}
                  title={task?.subCategory || task?.category || "Task"}
                  description={task?.activity || "-"}
                  assignedBy={
                    typeof task?.assignedBy === "object"
                      ? task?.assignedBy?.name || "Unknown"
                      : task?.assignedByName || "Unknown"
                  }
                  assignees={resolveAssignedToNames(task).map(
                    (name: string) => ({
                      short: getInitials(name),
                      full: name,
                      color: "border-[#5856D6] text-[#5856D6]",
                    })
                  )}
                  onClick={() => {
                    setSelectedTask({
                      ...task,
                      assignees: resolveAssignedToNames(task),
                      assignedByName:
                        typeof task?.assignedBy === "object"
                          ? task?.assignedBy?.name || "Unknown"
                          : task?.assignedByName || "Unknown",
                    });
                    setIsViewTaskOpen(true);
                  }}
                />
              ))
            ))}

          {/* COMPLETED */}
          {activeTab === "completed" &&
            (completedPriority.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-10">
                No completed tasks
              </p>
            ) : (
              completedPriority.map((task: any) => (
                <PriorityTaskCard
                  key={task._id}
                  priority="completed"
                  taskId={task._id}
                  date={task?.dateTime ? formatDateTime(task.dateTime) : "-"}
                  title={task?.subCategory || task?.category || "Task"}
                  description={task?.activity || "-"}
                  assignedBy={
                    typeof task?.assignedBy === "object"
                      ? task?.assignedBy?.name || "Unknown"
                      : task?.assignedByName || "Unknown"
                  }
                  assignees={resolveAssignedToNames(task).map(
                    (name: string) => ({
                      short: getInitials(name),
                      full: name,
                      color: "border-[#5856D6] text-[#5856D6]",
                    })
                  )}
                  onClick={() => {
                    setSelectedTask({
                      ...task,
                      assignees: resolveAssignedToNames(task),
                      assignedByName:
                        typeof task?.assignedBy === "object"
                          ? task?.assignedBy?.name || "Unknown"
                          : task?.assignedByName || "Unknown",
                    });
                    setIsViewTaskOpen(true);
                  }}
                />
              ))
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
        onClose={() => {
          setIsAddTaskModalOpen(false);
          setTimeout(() => setSelectedDate(new Date(selectedDate)), 50); // triggers refetch
          // Clear edit context after close
          setIsEditingTask(false);
          setSelectedTask(null);
        }}
        isEditMode={isEditingTask}
        initialData={isEditingTask && selectedTask ? selectedTask : {}}
        onEdit={(updated) => {
          // Optimistically update local cache
          setLogs((prev) =>
            prev.map((t: any) =>
              t._id === updated._id ? { ...t, ...updated } : t
            )
          );
        }}
        {...(bookingId ? { bookingId } : {})}
      />

      <ViewTaskModal
        isOpen={isViewTaskOpen}
        onClose={() => {
          setIsViewTaskOpen(false);
          setTimeout(() => setSelectedDate(new Date(selectedDate)), 50);
        }}
        task={selectedTask}
        onEdit={(t) => {
          setSelectedTask(t);
          setIsViewTaskOpen(false);
          setTimeout(() => {
            setIsEditingTask(true);
            setIsAddTaskModalOpen(true);
          }, 50);
        }}
        onMarkComplete={async () => {
          if (!selectedTask?._id) return;
          try {
            // Optimistic UI: mark locally first
            setLogs((prev) =>
              prev.map((l: any) =>
                l._id === selectedTask._id ? { ...l, status: "Completed" } : l
              )
            );
            const updated = await updateLogStatus(
              selectedTask._id,
              "Completed"
            );
            setLogs((prev) =>
              prev.map((l: any) => (l._id === updated._id ? updated : l))
            );
            setSelectedTask(updated);
            setTimeout(() => setSelectedDate(new Date(selectedDate)), 50);
          } catch (e) {
            console.error("Failed to mark task complete", e);
            // Revert optimistic change if backend fails
            setLogs((prev) =>
              prev.map((l: any) =>
                l._id === selectedTask._id
                  ? { ...l, status: selectedTask.status }
                  : l
              )
            );
          }
        }}
      />
    </div>
  );
};

export default React.memo(DayWiseTaskModal);
