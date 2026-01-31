"use client";

import React, { useMemo } from "react";
import { GoPerson } from "react-icons/go";
import { FaRegCalendar, FaRegClock, FaRegTrashAlt } from "react-icons/fa";
import { TbSquareToggle } from "react-icons/tb";
import { CiCirclePlus } from "react-icons/ci";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { MdOutlineCancel, MdOutlineDrafts } from "react-icons/md";
import { combineClasses } from "@/utils/helper";

export type LogsUIItem = {
  // Booking-style
  title?: string;
  meta?: string;
  by?: string;
  at?: string; // e.g. "10 Oct 2025 • 11:12 AM"
  comment?: string;

  // Task-log-style (from task.logs[])
  heading?: string;
  description?: string;
  logBy?: string;
  logDate?: string | Date;

  // Generic fallbacks
  dateTime?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  id?: string;
  _id?: string;
};

type NormalizedLog = {
  key: string;
  title: string;
  message?: string;
  comment?: string;
  by: string;
  dateText: string;
  timeText: string;
  kind:
    | "deleted"
    | "modified"
    | "rejected"
    | "approved"
    | "draft"
    | "created"
    | "info";
};

type LogsUIProps = {
  logs: LogsUIItem[];
  title?: string;
  subtitle?: string;
  emptyText?: string;
  wrapInCard?: boolean;
  sort?: "newest" | "oldest" | "none";
  entityLabel?: string; // e.g. "Booking"
  entityId?: string; // e.g. "OS-ABC19"
  className?: string;
};

const safeString = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v == null) return "";
  try {
    return String(v);
  } catch {
    return "";
  }
};

const tryParseDate = (input: unknown): Date | null => {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  const s = safeString(input);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (d: Date | null): string => {
  if (!d) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
};

const formatTime = (d: Date | null): string => {
  if (!d) return "-";
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const inferKind = (
  titleOrHeading: string,
  message: string,
): NormalizedLog["kind"] => {
  const text = `${titleOrHeading} ${message}`.toLowerCase();
  if (/(delete|deleted|removed)/i.test(text)) return "deleted";
  if (/(reject|rejected|cancel|cancelled|failed)/i.test(text))
    return "rejected";
  if (/(approve|approved|confirm|confirmed|complete|completed)/i.test(text))
    return "approved";
  if (/(draft|saved as draft)/i.test(text)) return "draft";
  if (/(create|created|added)/i.test(text)) return "created";
  if (/(modify|modified|update|updated|change|changed|edited)/i.test(text))
    return "modified";
  return "info";
};

const kindStyles = (kind: NormalizedLog["kind"]) => {
  switch (kind) {
    case "deleted":
      return {
        badgeBg: "bg-gray-200",
        cardBg: "bg-gray-50",
        titleColor: "text-gray-800",
        Icon: FaRegTrashAlt,
        iconColor: "text-gray-700",
      };
    case "modified":
      return {
        badgeBg: "bg-orange-100",
        cardBg: "bg-orange-50",
        titleColor: "text-orange-600",
        Icon: TbSquareToggle,
        iconColor: "text-orange-600",
      };
    case "rejected":
      return {
        badgeBg: "bg-red-100",
        cardBg: "bg-red-50",
        titleColor: "text-red-600",
        Icon: MdOutlineCancel,
        iconColor: "text-red-600",
      };
    case "approved":
      return {
        badgeBg: "bg-green-100",
        cardBg: "bg-green-50",
        titleColor: "text-green-600",
        Icon: IoCheckmarkCircleOutline,
        iconColor: "text-green-600",
      };
    case "draft":
      return {
        badgeBg: "bg-blue-100",
        cardBg: "bg-blue-50",
        titleColor: "text-blue-600",
        Icon: MdOutlineDrafts,
        iconColor: "text-blue-600",
      };
    case "created":
      return {
        badgeBg: "bg-blue-100",
        cardBg: "bg-blue-50",
        titleColor: "text-blue-600",
        Icon: CiCirclePlus,
        iconColor: "text-blue-600",
      };
    default:
      return {
        badgeBg: "bg-slate-100",
        cardBg: "bg-slate-50",
        titleColor: "text-slate-700",
        Icon: CiCirclePlus,
        iconColor: "text-slate-700",
      };
  }
};

const normalize = (
  item: LogsUIItem,
  idx: number,
  entityLabel?: string,
  entityId?: string,
): NormalizedLog => {
  const title = safeString(item.title || item.heading) || "Update";
  const message =
    safeString(item.meta || item.description) ||
    (entityLabel && entityId
      ? `${entityLabel} (${entityId}) was updated.`
      : "Activity updated.");
  const by = safeString(item.by || item.logBy) || "-";

  // Date/time: support both parseable ISO and pre-formatted "DD Mon YYYY • HH:MM AM".
  const rawAt = safeString(item.at);
  const rawDate =
    item.logDate ?? item.dateTime ?? item.updatedAt ?? item.createdAt ?? rawAt;
  const parsed = tryParseDate(rawDate);

  let dateText = "-";
  let timeText = "-";

  if (parsed) {
    dateText = formatDate(parsed);
    timeText = formatTime(parsed);
  } else if (rawAt.includes("•")) {
    const [d, t] = rawAt.split("•").map((s) => s.trim());
    dateText = d || "-";
    timeText = t || "-";
  } else if (rawAt) {
    dateText = rawAt;
    timeText = "";
  }

  const comment = safeString(item.comment);
  const kind = inferKind(title, message);
  const key = safeString(item.id || item._id) || `${title}-${idx}-${rawAt}`;

  const base: NormalizedLog = {
    key,
    title,
    message,
    by,
    dateText,
    timeText,
    kind,
  };

  if (comment) base.comment = comment;
  return base;
};

const getSortKey = (item: LogsUIItem): number => {
  const d =
    tryParseDate(item.logDate) ||
    tryParseDate(item.dateTime) ||
    tryParseDate(item.updatedAt) ||
    tryParseDate(item.createdAt);
  return d ? d.getTime() : 0;
};

const LogsUI: React.FC<LogsUIProps> = ({
  logs,
  title = "Booking Log",
  subtitle = "Latest updates for this booking",
  emptyText = "No activity yet",
  wrapInCard = true,
  sort = "newest",
  entityLabel,
  entityId,
  className,
}) => {
  const normalized = useMemo(() => {
    const list = Array.isArray(logs) ? logs.slice() : [];
    if (sort !== "none") {
      list.sort((a, b) => {
        const diff = getSortKey(a) - getSortKey(b);
        return sort === "newest" ? -diff : diff;
      });
    }
    return list.map((l, idx) => normalize(l, idx, entityLabel, entityId));
  }, [logs, sort, entityLabel, entityId]);

  const body = (
    <div className={combineClasses("py-2 ml-6", className)}>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-gray-200" />

        {normalized.length === 0 && (
          <div className="text-center text-[0.8rem] text-gray-500 py-6">
            {emptyText}
          </div>
        )}

        {normalized.map((entry) => {
          const { badgeBg, cardBg, titleColor, Icon, iconColor } = kindStyles(
            entry.kind,
          );

          return (
            <div className="relative flex gap-3 mb-6" key={entry.key}>
              <div
                className={combineClasses(
                  "w-10 h-10 rounded-full flex items-center justify-center z-10",
                  badgeBg,
                )}
              >
                <Icon size={18} className={iconColor} />
              </div>

              <div
                className={combineClasses(
                  "rounded-md p-4 w-full",
                  "border border-gray-200",
                  cardBg,
                )}
              >
                <div className="text-left">
                  <h3
                    className={combineClasses(
                      titleColor,
                      "font-semibold text-[0.85rem] mb-1",
                    )}
                  >
                    {entry.title}
                  </h3>
                  <hr className="mb-2 mt-1 border-t border-gray-200" />

                  {entry.message && (
                    <p className="text-[0.78rem] text-gray-700 mb-2">
                      {entry.message}
                    </p>
                  )}

                  {entry.comment && (
                    <div className="inline-block rounded-md bg-white/60 border border-gray-200 px-3 py-2 text-[0.75rem] text-gray-700 mb-2">
                      <span className="font-semibold">Comment :</span>{" "}
                      {entry.comment}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[0.7rem] text-gray-500">
                  <div className="flex items-center gap-1">
                    <GoPerson className="w-3 h-3" />
                    <span>{entry.by}</span>
                  </div>

                  <div className="flex gap-3">
                    {entry.dateText && (
                      <div className="flex items-center gap-1">
                        <FaRegCalendar className="w-3 h-3" />
                        <span>{entry.dateText}</span>
                      </div>
                    )}
                    {entry.timeText ? (
                      <div className="flex items-center gap-1">
                        <FaRegClock className="w-3 h-3" />
                        <span>{entry.timeText}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!wrapInCard) return body;

  return (
    <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-[#020202]">{title}</h3>
        <div className="text-[13px] text-gray-500">{subtitle}</div>
      </div>
      <div className="border-t border-gray-200" />
      <div className="p-4">{body}</div>
    </div>
  );
};

export default React.memo(LogsUI);
