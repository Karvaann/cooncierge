import React from "react";
import { FaRegCalendarAlt } from "react-icons/fa";
import { FiClock, FiCheckCircle, FiUser } from "react-icons/fi";

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
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 w-[350px] flex-shrink-0 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FaRegCalendarAlt size={16} className="text-gray-400" />
          <div>
            <h3 className="text-gray-800 font-semibold text-sm">{date}</h3>
            <p className="text-gray-400 text-xs">{day}</p>
          </div>
        </div>
        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
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
              className={`absolute right-0 top-0 bottom-0 w-[4px] rounded-r-4xl ${
                task.status === "pending"
                  ? "bg-red-400"
                  : task.status === "upcoming"
                  ? "bg-amber-400"
                  : "bg-green-400"
              } `}
            />

            {/* Task Title */}
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-gray-800 font-bold text-sm">{task.title}</h4>
              <span className="text-xs text-gray-400 font-medium">
                {task.code}
              </span>
            </div>

            <p className="text-gray-600 text-xs mb-2">{task.subtitle}</p>

            {/* Time + Status */}
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FiClock size={12} />
                {task.time}
              </div>
              {task.completed ? (
                <FiCheckCircle size={14} className="text-green-500" />
              ) : (
                <FiUser size={14} className="text-amber-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskCard;
