import React from "react";

import { FiClock, FiCheckCircle, FiUser } from "react-icons/fi";
import { LuCalendar1 } from "react-icons/lu";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { TbLuggage } from "react-icons/tb";
import { TbBrandNetbeans } from "react-icons/tb";
import { FaChartLine } from "react-icons/fa6";
import { RiContactsBook3Line } from "react-icons/ri";
import { TbArticle } from "react-icons/tb";
import { PiCurrencyCircleDollar } from "react-icons/pi";

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

const iconMap: Record<string, React.ReactNode> = {
  "Directory - Team": (
    <RiContactsBook3Line className="text-[#AF52DE] w-4 h-4" />
  ),
  "Directory - Vendor": (
    <RiContactsBook3Line className="text-[#AF52DE] w-4 h-4" />
  ),
  "Sales - OS": <FaChartLine className="text-purple-500 w-4 h-4" />,
  "Bookings - OS": <TbLuggage className="text-[#126ACB] w-4 h-4" />,
  "Bookings - Limitless": <TbLuggage className="text-[#126ACB] w-4 h-4" />,
  "Finance - OS": (
    <PiCurrencyCircleDollar className="text-purple-500 w-4 h-4" />
  ),
  "Finance - Reports": (
    <PiCurrencyCircleDollar className="text-purple-500 w-4 h-4" />
  ),
  "Operations - Limitless": (
    <TbBrandNetbeans className="text-green-500 w-4 h-4" />
  ),
  General: <TbArticle className="text-[#A2845E] w-4 h-4" />,
};

const TaskCard: React.FC<TaskCardProps> = ({
  date,
  day,
  pendingCount,
  tasks,
  onTaskClick,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 w-[340px] h-[340px] flex-shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LuCalendar1
            size={30}
            className="text-gray-400 font-bold bg-gray-100 rounded-2xl p-1.5"
          />
          <div>
            <h3 className="text-gray-800 font-semibold text-sm">{date}</h3>
            <p className="text-gray-400 text-xs mt-0.5 mb-1">{day}</p>
          </div>
        </div>
        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-2 mb-1 rounded-full whitespace-nowrap">
          {pendingCount} Pending Task{pendingCount > 1 ? "s" : ""}
        </span>
      </div>

      {/* Tasks List */}
      <div
        className="space-y-4 max-h-[260px] overflow-y-auto pr-1
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {tasks.map((task, index) => (
          <div
            key={index}
            onClick={(e) => {
              //  Only stop propagation if the card has a task click handler (10th May/ today)
              if (onTaskClick) {
                e.stopPropagation();
                onTaskClick(task);
              } else {
                //  For other days, clicking on task will open day-wise modal
                onClick?.();
              }
            }}
            className={`relative rounded-xl p-3 border border-gray-100 shadow-sm transition-all duration-200 ${
              task.status === "pending"
                ? "bg-red-50 border-red-200"
                : task.status === "upcoming"
                ? "bg-amber-50 border-amber-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            {/* colored edge */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-[10px] 
     border-r-[4px] rounded-r-[12px]
    ${
      task.status === "pending"
        ? "border-red-400"
        : task.status === "upcoming"
        ? "border-amber-400"
        : "border-green-400"
    }`}
            ></div>

            {/* Task Title */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5">
                  {iconMap[task.title] || (
                    <TbArticle className="text-[#A2845E] w-4 h-4" />
                  )}
                </span>
                <h4 className="text-gray-800 font-bold text-sm">
                  {task.title}
                </h4>
              </div>
              <span className="text-xs text-gray-400 font-medium mr-5">
                {task.code}
              </span>
            </div>

            <p className="text-gray-600 text-xs ml-7 mb-2 mt-1">
              {task.subtitle}
            </p>
            <MdOutlineKeyboardArrowRight className="w-5 h-5 text-gray-400 absolute top-8 right-3" />

            {/* Time + Status */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <FiClock size={12} />
                {task.time}
              </div>
              {task.completed ? (
                <FiCheckCircle size={14} className="text-green-500 mr-5" />
              ) : (
                <FiUser size={14} className="text-amber-500 mr-5" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskCard;
