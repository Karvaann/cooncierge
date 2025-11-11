"use client";

import dynamic from "next/dynamic";
import React, { useState, useMemo, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { getAuthToken } from "@/services/storage/authStorage";
import { getRandomBgTextClass, getRandomDarkBgClass } from "@/utils/helper";
import { useCalendar } from "@/context/CalendarContext";
import { BookingProvider } from "@/context/BookingContext";
import CalendarSkeleton from "@/components/skeletons/CalendarSkeleton";
import { IoIosExpand } from "react-icons/io";
import AddTaskModal from "@/components/Modals/AddTaskModal";
import { LuCalendarCog } from "react-icons/lu";
import { FiAlertTriangle } from "react-icons/fi";
import { MdHistoryToggleOff } from "react-icons/md";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import TaskCard from "@/components/TaskCard";
import ViewTaskModal from "@/components/Modals/TaskModals/ViewTaskModal";
import DueTodayTaskModal from "@/components/Modals/TaskModals/DueTodayTaskModal";
import DayWiseTaskModal from "@/components/Modals/TaskModals/DayWiseTaskModal";

const Calendar = dynamic(() => import("@/components/Calendar"), {
  loading: () => <CalendarSkeleton />,
  ssr: false,
});

type TaskLog = {
  activity: string;
  dateTime: string;
  status?: "completed" | "in-progress" | "pending";
  [key: string]: unknown;
};

interface PercentageLogs {
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  completedPercent: string;
}

interface SummaryData {
  currentUserPendingTaskCount: number;
  dateWiseLogs?: Record<string, TaskLog[]>;
  percentageLogs?: PercentageLogs;
  teamPercentCompleteLogs?: Record<string, number>;
  recentLogs?: TaskLog[];
}

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-[11.87rem] h-[8.75rem] -mt-2 -ml-6 mx-auto">
      <svg viewBox="0 0 200 200" className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#4CA640"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[1.75rem] w-[3.75rem] h-[2.5rem] font-semibold text-gray-900">
          {percentage}%
        </span>
      </div>
    </div>
  );
};

const DashboardContent: React.FC = () => {
  const { calenderShow, setCalenderShow } = useCalendar();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const openAddTaskModal = () => setIsAddTaskModalOpen(true);
  const closeAddTaskModal = () => setIsAddTaskModalOpen(false);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    currentUserPendingTaskCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("assigned-to-me");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDueTodayModalOpen, setIsDueTodayModalOpen] = useState(false);
  const [activePriority, setActivePriority] = useState<
    "high" | "medium" | "low"
  >("high");
  const [isDayWiseModalOpen, setIsDayWiseModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const completionPercentage = 65;

  interface Task {
    title: string;
    subtitle: string;
    time: string;
    code: string;
    status: "pending" | "upcoming" | "completed";
    completed: boolean;
  }

  interface TaskCardProps {
    date: string;
    day: string;
    pendingCount: number;
    onTaskClick?: (task: Task) => void;
    onClick?: () => void;
    tasks: Task[];
  }

  const daysData: TaskCardProps[] = [
    {
      date: "8th May",
      day: "Wednesday",
      pendingCount: 1,
      tasks: [
        {
          title: "Directory - Team",
          subtitle: "General",
          time: "10:00",
          code: "TE-ABC12",
          status: "upcoming",
          completed: false,
        },
        {
          title: "Directory - Vendor",
          subtitle: "Follow up",
          time: "09:00",
          code: "VE-AB001",
          status: "completed",
          completed: true,
        },
      ],
    },
    {
      date: "9th May",
      day: "Thursday",
      pendingCount: 2,
      tasks: [
        {
          title: "Bookings - Limitless",
          subtitle: "Client Confirmation",
          time: "11:30",
          code: "BK-LIM23",
          status: "upcoming",
          completed: false,
        },
        {
          title: "Sales - OS",
          subtitle: "Payment Follow-up",
          time: "14:00",
          code: "SA-OS44",
          status: "upcoming",
          completed: false,
        },
        {
          title: "Finance - Reports",
          subtitle: "Monthly Closure",
          time: "16:00",
          code: "FI-RP99",
          status: "completed",
          completed: true,
        },
        {
          title: "Finance - Reports",
          subtitle: "Monthly Closure",
          time: "16:00",
          code: "FI-RP99",
          status: "completed",
          completed: true,
        },
        {
          title: "Finance - Reports",
          subtitle: "Monthly Closure",
          time: "16:00",
          code: "FI-RP99",
          status: "pending",
          completed: true,
        },
      ],
    },
    {
      date: "10th May",
      day: "Today",
      pendingCount: 1,
      tasks: [
        {
          title: "Leads - Campaign",
          subtitle: "Email Outreach",
          time: "10:15",
          code: "LE-CM32",
          status: "completed",
          completed: true,
        },
        {
          title: "Operations - Limitless",
          subtitle: "Vendor Coordination",
          time: "13:30",
          code: "OP-LM07",
          status: "pending",
          completed: false,
        },
      ],
    },
    {
      date: "11th May",
      day: "Saturday",
      pendingCount: 0,
      tasks: [
        {
          title: "Dashboard Review",
          subtitle: "Performance Summary",
          time: "09:45",
          code: "DB-REV01",
          status: "completed",
          completed: true,
        },
        {
          title: "Team Meeting",
          subtitle: "Weekly Wrap-up",
          time: "12:00",
          code: "TM-WR02",
          status: "pending",
          completed: true,
        },
      ],
    },
    {
      date: "12th May",
      day: "Sunday",
      pendingCount: 2,
      tasks: [
        {
          title: "Finance - OS",
          subtitle: "Expense Verification",
          time: "11:00",
          code: "FI-OS23",
          status: "upcoming",
          completed: false,
        },
        {
          title: "Bookings - OS",
          subtitle: "Customer Follow-up",
          time: "15:30",
          code: "BK-OS77",
          status: "pending",
          completed: false,
        },
        {
          title: "Bookings - OS",
          subtitle: "Customer Follow-up",
          time: "15:30",
          code: "BK-OS77",
          status: "upcoming",
          completed: false,
        },
        {
          title: "Bookings - OS",
          subtitle: "Customer Follow-up",
          time: "15:30",
          code: "BK-OS77",
          status: "upcoming",
          completed: false,
        },
      ],
    },
  ];

  const taskCards = [
    {
      title: "Tasks Overdue",
      count: 2,
      icon: <FiAlertTriangle className="w-5 h-5" />,
      iconColor: "text-red-500",
      tasks: [
        {
          priority: "High Priority",
          count: 1,
          color: "text-red-500",
          dotColor: "bg-red-500",
        },
        {
          priority: "Medium priority",
          count: 1,
          color: "text-orange-500",
          dotColor: "bg-orange-500",
        },
        {
          priority: "Low Priority",
          count: 0,
          color: "text-green-500",
          dotColor: "bg-green-500",
        },
      ],
    },
    {
      title: "Tasks due today",
      count: 2,
      icon: <LuCalendarCog className="w-5 h-5" />,
      iconColor: "text-gray-600",
      tasks: [
        {
          priority: "High Priority",
          count: 1,
          color: "text-red-500",
          dotColor: "bg-red-500",
        },
        {
          priority: "Medium priority",
          count: 0,
          color: "text-orange-500",
          dotColor: "bg-orange-500",
        },
        {
          priority: "Low Priority",
          count: 1,
          color: "text-green-500",
          dotColor: "bg-green-500",
        },
      ],
    },
    {
      title: "Upcoming Tasks",
      count: 1,
      icon: <MdHistoryToggleOff className="w-5 h-5" />,
      iconColor: "text-[#126ACB]",
      tasks: [
        {
          priority: "High Priority",
          count: 0,
          color: "text-red-500",
          dotColor: "bg-red-500",
        },
        {
          priority: "Medium priority",
          count: 1,
          color: "text-orange-500",
          dotColor: "bg-orange-500",
        },
        {
          priority: "Low Priority",
          count: 0,
          color: "text-green-500",
          dotColor: "bg-green-500",
        },
      ],
    },
  ];

  const handlePriorityClick = (priority: "high" | "medium" | "low") => {
    setActivePriority(priority);
    setIsDueTodayModalOpen(true);
  };

  const closeModal = () => setIsDueTodayModalOpen(false);

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedTask(null);
  };

  const openDayWiseModal = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsDayWiseModalOpen(true);
  };

  const closeDayWiseModal = () => {
    setSelectedTaskId(null);
    setIsDayWiseModalOpen(false);
  };

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();

    const getSuffix = (day: number): string => {
      if (day % 10 === 1 && day !== 11) return "st";
      if (day % 10 === 2 && day !== 12) return "nd";
      if (day % 10 === 3 && day !== 13) return "rd";
      return "th";
    };

    const suffix = getSuffix(day);
    const month = date.toLocaleString("default", { month: "short" });

    return `${day}${suffix} ${month}`;
  }, []);

  const fetchSummaryData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await apiClient.get<SummaryData>(
        "/logs/get-user-logs/689000000000000000000003",
        {
          timeout: 10000,
        }
      );

      setSummaryData(response.data);
    } catch (err) {
      console.error("API not available, running in UI-only mode:", err);
      setError("Failed to load dashboard data");
      setSummaryData({ currentUserPendingTaskCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCalendar = useCallback(() => {
    setCalenderShow(!calenderShow);
  }, [calenderShow, setCalenderShow]);

  const statusBadge = useMemo(() => {
    const pendingCount = summaryData.currentUserPendingTaskCount;

    if (pendingCount === 0) {
      return (
        <div className="flex items-center h-8 px-4 py-2 rounded-full bg-[#DCFCE7] text-[#166534] font-poppins text-base font-semibold leading-8">
          Hurrah! You are up to Date
        </div>
      );
    }

    return (
      <div className="flex items-center h-8 px-4 py-2 rounded-full bg-[#fcdcdc] text-[#651616] font-poppins text-base font-semibold leading-8">
        Pending Tasks: {pendingCount}
      </div>
    );
  }, [summaryData.currentUserPendingTaskCount]);

  const dateWiseLogsCards = useMemo(() => {
    if (!summaryData.dateWiseLogs) return null;

    return Object.entries(summaryData.dateWiseLogs).map(
      ([date, logs], index) => (
        <div
          key={`${date}-${index}`}
          className="flex-shrink-0 w-64 rounded-xl bg-[#F9FAFB] border border-gray-200 shadow-sm p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{formatDate(date)}</h3>
            <span className="text-gray-400" role="img" aria-label="view">
              👁
            </span>
          </div>
          <ul className="space-y-2">
            {logs.map((task, i) => (
              <li
                key={`${date}-${i}`}
                className={`text-sm font-medium px-3 py-1 rounded-full ${getRandomBgTextClass()}`}
              >
                {task.activity}
              </li>
            ))}
          </ul>
        </div>
      )
    );
  }, [summaryData.dateWiseLogs, formatDate]);

  return (
    <div className="transition-all duration-500 ease-in-out space-y-6">
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      )}
      {!calenderShow && (
        <>
          <div className="bg-white shadow-sm border border-[#E2E1E1] rounded-xl p-4 gap-4">
            <div className="h-[500px] bg-white p-4">
              <div className="max-w-9xl mx-2 ml-4">
                <div className="flex items-center justify-between mb-8">
                  {/* Tab Navigation */}
                  <div className="flex gap-2 -ml-5 bg-[#F3F3F3] border border-[#E2E1E1] w-[16.40625vw] rounded-xl">
                    <button
                      onClick={() => setActiveTab("assigned-to-me")}
                      className={`px-4 py-2 rounded-xl font-medium text-[0.65rem] transition-colors ${
                        activeTab === "assigned-to-me"
                          ? "bg-[#0D4B37] text-white"
                          : " text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Assigned to me
                    </button>
                    <button
                      onClick={() => setActiveTab("assigned-by-me")}
                      className={`px-4 py-2 rounded-xl font-medium text-[0.65rem] transition-colors ${
                        activeTab === "assigned-by-me"
                          ? "bg-[#0D4B37] text-white"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Assigned by me
                    </button>
                  </div>

                  <div className="">
                    <button
                      type="button"
                      onClick={openAddTaskModal}
                      className="flex items-center justify-center h-10 px-5 py-2 rounded-lg font-semibold border border-[#0D4B37] bg-white text-[#0D4B37] text-center font-poppins text-base leading-6 hover:bg-gray-200 transition-colors"
                    >
                      + Task
                    </button>
                  </div>
                </div>

                {/* Main Content Grid */}
                {activeTab === "assigned-to-me" && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 px-3 h-[21.87rem] w-[90vw] rounded-xl gap-6 border border-[#E2E1E1] -mt-3 -ml-6">
                    <div className="bg-white px-7 py-6 w-[13vw] h-[21.7rem] border-r border-[#E2E1E1]">
                      <div className="mb-4 w-[12vw] h-[2.62rem] -mt-2 -ml-2">
                        <h3 className="text-green-600 font-medium text-[0.87rem] mb-1   mt-1">
                          Almost there, just a few
                        </h3>
                        <p className="text-green-600 font-medium text-[0.87rem]  mt-1">
                          left to complete!
                        </p>
                      </div>

                      <CircularProgress percentage={completionPercentage} />
                      <div className="-ml-4">
                        <p className="text-center w-[9.62rem] text-gray-500 text-md font-medium mt-2">
                          Task Completion Rate
                        </p>

                        <div className="bg-green-50 w-[9.62rem] ml-4 text-black text-sm font-medium rounded-lg mt-2 px-4 py-2">
                          {`13 out of 20 Tasks completed`}
                        </div>
                      </div>
                    </div>

                    {/* Tasks in Hand */}
                    <div className="lg:col-span-3 py-6 px-7 -mt-4">
                      <div className="flex w-[11.25rem] items-center gap-3 mb-1 mt-2 -ml-30 bg-[#F9F9F9] rounded-3xl px-3 py-2">
                        <h2 className="text-gray-700 font-medium text-base">
                          Tasks in Hand
                        </h2>
                        <span className="text-xl ml-4 font-semibold text-gray-900">
                          5
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -ml-38 mb-4 w-[70rem]">
                        {taskCards.map((card, index) => (
                          <div
                            key={index}
                            className={`bg-white mt-4 rounded-xl p-6 border h-[15rem]  
    ${
      index === 1
        ? "border-[rgba(235,56,43,0.30)] shadow-md shadow-red-200" // special card style
        : "border-gray-200 shadow-sm"
    } // default style
  `}
                          >
                            <div
                              className={`text-3xl items-center justify-center flex font-bold mb-3 ${
                                index === 0
                                  ? "text-red-500"
                                  : index === 1
                                  ? "text-gray-800"
                                  : "text-blue-500"
                              }`}
                            >
                              {card.count}
                            </div>

                            <div className="flex items-center justify-center gap-3 mb-3">
                              <div className={card.iconColor}>{card.icon}</div>
                              <h3 className="text-[#818181]  text-md">
                                {card.title}
                              </h3>
                            </div>

                            <div className="space-y-2 p-1">
                              {card.tasks.map((task, taskIndex) => (
                                <div
                                  key={taskIndex}
                                  className="flex items-center text-[#818181] justify-between bg-[#F9F9F9] rounded-xl px-3 py-1"
                                  onClick={() =>
                                    handlePriorityClick(
                                      task.priority
                                        .toLowerCase()
                                        .includes("high")
                                        ? "high"
                                        : task.priority
                                            .toLowerCase()
                                            .includes("medium")
                                        ? "medium"
                                        : "low"
                                    )
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${task.dotColor}`}
                                    ></div>
                                    <span className="text-gray-600 text-sm">
                                      {task.priority}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={`font-semibold text-sm ${
                                        task.count === 0
                                          ? "text-gray-400"
                                          : task.color
                                      }`}
                                    >
                                      {task.count} task
                                    </span>
                                    <MdOutlineKeyboardArrowRight className="w-5 h-5 text-gray-400" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "assigned-by-me" && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-4 bg-white rounded-xl p-12 shadow-sm border border-gray-200">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          Assigned by me
                        </h3>
                        <p className="text-gray-500">
                          Tasks you've assigned to others will appear here
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start self-stretch bg-white w-full">
              <div className="flex justify-between items-center w-[100%] px-5 py-4">
                <h3 className="font-semibold text-black text-lg">
                  Task Timeline
                </h3>
                <div className="flex items-center justify-end gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={toggleCalendar}
                    className="flex items-center justify-center h-10 px-5 py-2 rounded-lg border border-[#114958] bg-white text-[#114958] text-center font-poppins text-base font-semibold leading-6 hover:bg-gray-50 transition-colors"
                  >
                    {calenderShow ? "Collapse" : <IoIosExpand size={20} />}
                  </button>
                </div>
              </div>

              <div className="max-w-[1300px] mx-auto">
                <div
                  className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth
      no-scrollbar
  [&::-webkit-scrollbar]:hidden
  [-ms-overflow-style:'none']
  [scrollbar-width:'none']"
                >
                  {daysData.map((day, idx) => {
                    // Build the props object dynamically to avoid passing `undefined`
                    const taskCardProps: TaskCardProps = {
                      date: day.date,
                      day: day.day,
                      pendingCount: day.pendingCount,
                      tasks: day.tasks,
                    };

                    //
                    if (day.date === "10th May") {
                      taskCardProps.onTaskClick = (task) =>
                        handleViewTask(task);
                    } else {
                      taskCardProps.onClick = () => openDayWiseModal(day.date);
                    }

                    return (
                      <div key={idx} className="snap-start">
                        {/* ✅ Spread the props — no undefined passed anywhere */}
                        <TaskCard key={day.date} {...taskCardProps} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {calenderShow && (
        <Calendar
          setCalenderShow={setCalenderShow}
          calenderShow={calenderShow}
        />
      )}

      <AddTaskModal isOpen={isAddTaskModalOpen} onClose={closeAddTaskModal} />
      {/* View Task Modal */}
      {selectedTask && (
        <ViewTaskModal isOpen={isViewModalOpen} onClose={handleCloseModal} />
      )}

      <DueTodayTaskModal
        isOpen={isDueTodayModalOpen}
        onClose={closeModal}
        onTaskClick={(taskId) => console.log("Task clicked:", taskId)}
      />
      <DayWiseTaskModal
        isOpen={isDayWiseModalOpen}
        onClose={closeDayWiseModal}
      />
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <BookingProvider>
      <DashboardContent />
    </BookingProvider>
  );
};

export default React.memo(Dashboard);
