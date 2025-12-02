"use client";

import React from "react";
import { TbLuggage, TbArticle } from "react-icons/tb";
import AvatarTooltip from "./AvatarToolTip";
import { MdKeyboardArrowRight } from "react-icons/md";

export interface Assignee {
  short: string;
  full: string;
  color: string;
}

export interface PriorityTaskCardProps {
  priority: "high" | "medium" | "low" | "completed";
  taskId: string;
  date: string;
  title: string;
  description: string;

  assignedBy: string;
  assignees: Assignee[];
  onClick?: () => void;
  borderColor?: string;
}

const PriorityTaskCard: React.FC<PriorityTaskCardProps> = ({
  priority,
  taskId,
  date,
  title,

  description,

  assignedBy,
  assignees,
  onClick,
  borderColor,
}) => {
  /* ================= BADGE ================= */
  const getBadge = () => {
    switch (priority) {
      case "high":
        return {
          text: "Overdue",
          bg: "bg-red-200",
          dot: "bg-[#EB382B]",
          textColor: "text-[#EB382B]",
        };
      case "completed":
        return {
          text: "Done",
          bg: "bg-green-100",
          dot: "bg-[#4CA640]",
          textColor: "text-[#4CA640]",
        };
      default:
        return null;
    }
  };

  const badge = getBadge();

  return (
    <div
      className={`border ${borderColor} w-full overflow-hidden rounded-lg p-3 bg-white cursor-pointer`}
      onClick={onClick}
    >
      {/* TOP BAR */}
      <div className="flex items-center gap-2 mb-2">
        {badge && (
          <div
            className={`flex items-center gap-1 ${badge.bg} px-2 py-0.5 
            rounded-lg text-[0.65rem] ${badge.textColor}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></div>
            {badge.text}
          </div>
        )}

        <div className="flex-1 text-center text-xs text-gray-600">
          Task ID: <span className="font-semibold">{taskId}</span>
        </div>

        <div className="text-xs text-gray-500">{date}</div>
      </div>

      {/* HEADER BLOCK */}
      <div className="flex w-[25rem] items-center justify-between bg-gray-100 p-2 rounded-md mb-2">
        <div className="flex items-center gap-2">
          <div>
            <div className="font-semibold text-xs">{title}</div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION + ARROW */}
      <div className="flex items-center justify-between w-full mt-2 mb-2">
        <p className="text-xs text-gray-700 mb-2">{description}</p>

        <MdKeyboardArrowRight className="text-gray-500 w-5 h-5 ml-3 flex-shrink-0" />
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Assigned By:{" "}
          <span className="font-semibold text-gray-700">{assignedBy}</span>
        </div>

        <div className="flex items-center mt-1 mr-2">
          <span className="text-xs text-gray-500 mr-3">Assigned To:</span>
          {assignees.map((a, i) => (
            <AvatarTooltip
              key={i}
              short={a.short}
              full={a.full}
              color={a.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriorityTaskCard;
