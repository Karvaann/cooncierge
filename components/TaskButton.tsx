"use client";
import React, { useEffect, useState } from "react";
import { TbClipboardText } from "react-icons/tb";
import DayWiseTaskModal from "./Modals/TaskModals/DayWiseTaskModal";
import { getLogsByBookingId } from "@/services/logsApi";

interface TaskButtonProps {
  count?: number; // optional override fallback
  bookingId?: string | null;
}

const TaskButton = ({ count, bookingId }: TaskButtonProps) => {
  const [isDayWiseModalOpen, setIsDayWiseModalOpen] = useState(false);
  const [tasksCount, setTasksCount] = useState<number>(count ?? 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isObjectId = (v: unknown) =>
      typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);
    if (!bookingId || !isObjectId(bookingId)) {
      // fallback to provided count or zero
      setTasksCount(count ?? 0);
      return;
    }

    let cancelled = false;
    // const fetch = async () => {
    //   try {
    //     setLoading(true);
    //     const resp = await getLogsByBookingId(bookingId);
    //     const logs = Array.isArray(resp?.logs) ? resp.logs : [];
    //     // Only treat logs with recognized priority as tasks
    //     const taskLogs = logs.filter((l: any) =>
    //       ["High", "Medium", "Low"].includes(l?.priority)
    //     );
    //     if (!cancelled) setTasksCount(taskLogs.length);
    //   } catch (e) {
    //     if (!cancelled) setTasksCount(0);
    //   } finally {
    //     if (!cancelled) setLoading(false);
    //   }
    // };
    // fetch();
    return () => {
      cancelled = true;
    };
  }, [bookingId, count]);

  const handleOpenModal = () => {
    setIsDayWiseModalOpen(true);
  };

  return (
    <div className="group relative flex items-center justify-center">
      <button
        onClick={handleOpenModal}
        className="p-1.5 border border-gray-300 rounded-sm bg-white hover:bg-gray-100 transition-colors"
        type="button"
      >
        <TbClipboardText className="w-4 h-4 text-[#854D0E]" />
      </button>
      <span className="absolute -top-2 -right-2 bg-[#FFF] text-[#7135AD] transition-all duration-300 ease-in-out group-hover:bg-[#7135AD] group-hover:text-white text-[8px] font-semibold rounded-full w-[18px] h-[18px] flex items-center justify-center shadow">
        {loading ? "" : tasksCount}
      </span>
      <DayWiseTaskModal
        isOpen={isDayWiseModalOpen}
        onClose={() => setIsDayWiseModalOpen(false)}
        {...(bookingId ? { bookingId } : {})}
      />
    </div>
  );
};

export default TaskButton;
