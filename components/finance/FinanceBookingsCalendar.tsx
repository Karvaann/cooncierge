"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import { CiFilter } from "react-icons/ci";
import { FaRegClock } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  IoChevronBack,
  IoChevronForward,
  IoEllipsisVertical,
} from "react-icons/io5";
import {
  PiArrowCircleDownLeft,
  PiArrowCircleUpRight,
} from "react-icons/pi";
import { TbArrowsExchange, TbClockPlay } from "react-icons/tb";
import { FINANCE_CALENDAR_MOCK } from "@/mock-data/finance";
import type {
  FinanceCalendarBooking,
  FinanceCalendarBookingStatus,
} from "@/mock-data/finance/calendar-types";

const DEMO_TODAY = parseISO("2025-03-06");
const DEMO_NOW_MINUTES = 13 * 60 + 30;
const HOUR_START = 8;
const HOUR_END = 17;
const ROW_HEIGHT = 96;
const VISIBLE_DAYS = 5;
const RANGE_TOTAL_DAYS = 10;

const STATUS_META: Record<
  FinanceCalendarBookingStatus,
  { label: string; color: string }
> = {
  completed: { label: "Completed", color: "#3FAE49" },
  on_trip: { label: "On Trip", color: "#F59E0B" },
  upcoming: { label: "Upcoming", color: "#3B82F6" },
  cancelled: { label: "Cancelled", color: "#A3A3A3" },
};

const CALENDAR_MENU_ACTIONS = [
  {
    id: "you_got",
    label: "You Got",
    icon: PiArrowCircleDownLeft,
    iconClassName: "text-[#4CA640]",
  },
  {
    id: "you_gave",
    label: "You Gave",
    icon: PiArrowCircleUpRight,
    iconClassName: "text-[#EB382B]",
  },
  {
    id: "reschedule",
    label: "Reschedule",
    icon: TbClockPlay,
    iconClassName: "text-[#8A8A8A]",
  },
  {
    id: "change_status",
    label: "Change Status",
    icon: TbArrowsExchange,
    iconClassName: "text-[#8A8A8A]",
  },
  {
    id: "edit",
    label: "Edit",
    icon: FiEdit2,
    iconClassName: "text-[#3B82F6]",
    labelClassName: "text-[#3B82F6]",
  },
  {
    id: "delete",
    label: "Delete",
    icon: FiTrash2,
    iconClassName: "text-[#EB382B]",
    labelClassName: "text-[#EB382B]",
  },
] as const;

const getServiceIcon = (quotationType: string) => {
  const normalized = quotationType.toLowerCase().trim();
  const map: Record<string, string> = {
    flight: "/icons/service-icons/flight.svg",
    accommodation: "/icons/service-icons/accommodation.svg",
    activity: "/icons/service-icons/activity.svg",
    transportation: "/icons/service-icons/transport.svg",
    ticket: "/icons/service-icons/ticket.svg",
  };
  return map[normalized] || "/icons/service-icons/others.svg";
};

function formatBookingTime(booking: FinanceCalendarBooking) {
  const minute = booking.startMinute ?? 0;
  return `${String(booking.startHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatHourLabel(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function CalendarBookingCard({
  booking,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  stackIndex = 0,
  stackTotal = 1,
}: {
  booking: FinanceCalendarBooking;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  stackIndex?: number;
  stackTotal?: number;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isFaded = booking.faded || booking.status === "cancelled";
  const statusColor = isFaded ? "#C9C9C9" : STATUS_META[booking.status].color;
  const gap = 4;
  const inset = 6;
  const availableHeight = ROW_HEIGHT - inset * 2;
  const cardHeight =
    stackTotal > 1
      ? (availableHeight - gap * (stackTotal - 1)) / stackTotal
      : availableHeight;
  const cardTop = inset + stackIndex * (cardHeight + gap);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onCloseMenu();
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isMenuOpen, onCloseMenu]);

  return (
    <div
      className={`pointer-events-auto absolute inset-x-1.5 z-10 overflow-visible rounded-[12px] border border-[#E8E8E8] bg-white px-2.5 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
        isFaded ? "opacity-60" : ""
      } ${isMenuOpen ? "z-30" : ""}`}
      style={{ top: cardTop, height: cardHeight }}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span className="truncate text-[12px] font-[600] text-[#020202] underline underline-offset-2">
            {booking.customId}
          </span>
          <Image
            src={getServiceIcon(booking.quotationType)}
            alt={booking.serviceLabel}
            width={14}
            height={14}
            className="shrink-0 object-contain"
          />
          <span className="truncate text-[12px] font-[500] text-[#414141]">
            {booking.serviceLabel}
          </span>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu();
            }}
            className="flex h-6 w-5 items-center justify-center text-[#8A8A8A] transition-colors hover:text-[#414141]"
            aria-label="Booking actions"
            aria-expanded={isMenuOpen}
          >
            <IoEllipsisVertical className="h-4 w-4" />
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[168px] overflow-hidden rounded-[12px] border border-[#E2E1E1] bg-white py-1 shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
              {CALENDAR_MENU_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCloseMenu();
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#FAFAFA]"
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${action.iconClassName}`}
                    />
                    <span
                      className={`text-[13px] font-[400] ${
                        action.labelClassName || "text-[#414141]"
                      }`}
                    >
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[#8A8A8A]">
          <FaRegClock className="h-3 w-3" />
          <span className="text-[11px] font-[500]">
            {formatBookingTime(booking)}
          </span>
        </div>

        {booking.detail ? (
          booking.detailDisplay === "plain" ? (
            <span className="truncate text-[11px] font-[500] text-[#6B6B6B]">
              {booking.detail}
            </span>
          ) : (
            <span className="max-w-[58%] truncate rounded-full bg-[#F3F3F3] px-2 py-0.5 text-[10px] font-[500] text-[#414141]">
              {booking.detail}
            </span>
          )
        ) : null}
      </div>
    </div>
  );
}

export default function FinanceBookingsCalendar() {
  const { totalCount, statusSummary, bookings } = FINANCE_CALENDAR_MOCK;
  const [rangeStart, setRangeStart] = useState(() =>
    startOfDay(parseISO("2025-03-05")),
  );
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const [openMenuBookingId, setOpenMenuBookingId] = useState<string | null>(
    null,
  );

  const rangeDays = useMemo(
    () =>
      Array.from({ length: RANGE_TOTAL_DAYS }, (_, index) =>
        addDays(rangeStart, index),
      ),
    [rangeStart],
  );

  const visibleDays = useMemo(
    () =>
      rangeDays.slice(visibleStartIndex, visibleStartIndex + VISIBLE_DAYS),
    [rangeDays, visibleStartIndex],
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: HOUR_END - HOUR_START + 1 },
        (_, index) => HOUR_START + index,
      ),
    [],
  );

  const dayBuckets = useMemo(() => {
    return visibleDays.map((day) => {
      const dayBookings = bookings.filter((booking) =>
        isSameDay(parseISO(booking.date), day),
      );
      const osCount = dayBookings.filter(
        (booking) => booking.bookingSource === "os",
      ).length;
      const limitlessCount = dayBookings.filter(
        (booking) => booking.bookingSource === "limitless",
      ).length;

      return {
        date: day,
        osCount,
        limitlessCount,
        bookings: dayBookings,
      };
    });
  }, [bookings, visibleDays]);

  const nowMinutes = DEMO_NOW_MINUTES;
  const gridStartMinutes = HOUR_START * 60;
  const gridEndMinutes = (HOUR_END + 1) * 60;
  const showNowLine =
    nowMinutes >= gridStartMinutes && nowMinutes <= gridEndMinutes;
  const nowLineTop =
    ((nowMinutes - gridStartMinutes) / 60) * ROW_HEIGHT + ROW_HEIGHT / 2;

  const rangeLabel = `${format(rangeDays[0]!, "d MMM ''yy")} - ${format(
    rangeDays[rangeDays.length - 1]!,
    "d MMM ''yy",
  )}`;

  const shiftRange = (direction: -1 | 1) => {
    setRangeStart((prev) => addDays(prev, direction * VISIBLE_DAYS));
    setVisibleStartIndex(0);
  };

  const shiftVisible = (direction: -1 | 1) => {
    setVisibleStartIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return 0;
      if (next > RANGE_TOTAL_DAYS - VISIBLE_DAYS) {
        return RANGE_TOTAL_DAYS - VISIBLE_DAYS;
      }
      return next;
    });
  };

  return (
    <div className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-3">
        <h2 className="text-[15px] font-[600] text-[#020202]">
          Bookings Timeline
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                shiftVisible(-1);
                if (visibleStartIndex === 0) shiftRange(-1);
              }}
              className="rounded-full p-2 text-[#7A7A7A] transition-colors hover:bg-[#F3F3F3]"
              aria-label="Previous dates"
            >
              <IoChevronBack className="h-3.5 w-3.5" />
            </button>
            <div className="rounded-full bg-[#F9F9F9] px-3 py-1.5 text-[13px] font-[500] text-[#020202]">
              {rangeLabel}
            </div>
            <button
              type="button"
              onClick={() => {
                shiftVisible(1);
                if (visibleStartIndex >= RANGE_TOTAL_DAYS - VISIBLE_DAYS) {
                  shiftRange(1);
                }
              }}
              className="rounded-full p-2 text-[#7A7A7A] transition-colors hover:bg-[#F3F3F3]"
              aria-label="Next dates"
            >
              <IoChevronForward className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="rounded-full border border-[#F5E6C3] bg-[#FFF1C2] px-3 py-1.5 text-[12px] font-[500] text-[#414141]">
            Total <span className="font-[600]">{totalCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {(Object.keys(STATUS_META) as FinanceCalendarBookingStatus[]).map(
            (status) => (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS_META[status].color }}
                />
                <span className="text-[12px] text-[#414141]">
                  {STATUS_META[status].label}
                </span>
                <span className="text-[12px] font-[600] text-[#020202]">
                  {statusSummary[status]}
                </span>
              </div>
            ),
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E2E1E1] bg-white px-3 py-1.5 text-[12px] font-[500] text-[#414141] transition-colors hover:bg-[#FAFAFA]"
          >
            <CiFilter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="min-w-[980px]">
          <div
            className="grid border-b border-[#E5E7EB] bg-[#FAFAFA]"
            style={{
              gridTemplateColumns: `72px repeat(${VISIBLE_DAYS}, minmax(0, 1fr))`,
            }}
          >
            <div className="border-r border-[#E5E7EB]" />
            {dayBuckets.map((bucket) => {
              const isToday = isSameDay(bucket.date, DEMO_TODAY);
              return (
                <div
                  key={bucket.date.toISOString()}
                  className={`border-r border-[#E5E7EB] px-3 py-2.5 last:border-r-0 ${
                    isToday ? "border-t-2 border-t-[#3B82F6]" : ""
                  }`}
                >
                  <div className="text-[13px] font-[600] text-[#020202]">
                    {format(bucket.date, "EEE")}, {format(bucket.date, "dd MMM")}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[#7135AD]">
                    <span>OS {bucket.osCount}</span>
                    <span className="text-[#D1D5DB]">|</span>
                    <span>Limitless {bucket.limitlessCount}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `72px repeat(${VISIBLE_DAYS}, minmax(0, 1fr))`,
            }}
          >
            <div className="border-r border-[#E5E7EB] bg-white">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex items-start justify-end border-b border-[#F0F0F0] pr-3 pt-2 text-[12px] text-[#8A8A8A]"
                  style={{ height: ROW_HEIGHT }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {dayBuckets.map((bucket) => (
              <div
                key={`grid-${bucket.date.toISOString()}`}
                className="relative border-r border-[#E5E7EB] last:border-r-0"
              >
                {hours.map((hour) => (
                  <div
                    key={`${bucket.date.toISOString()}-${hour}`}
                    className="relative border-b border-[#F0F0F0] bg-white"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {(() => {
                      const hourBookings = bucket.bookings
                        .filter((booking) => booking.startHour === hour)
                        .sort(
                          (a, b) =>
                            (a.startMinute ?? 0) - (b.startMinute ?? 0),
                        );
                      return hourBookings.map((booking, index) => (
                        <CalendarBookingCard
                          key={booking.id}
                          booking={booking}
                          stackIndex={index}
                          stackTotal={hourBookings.length}
                          isMenuOpen={openMenuBookingId === booking.id}
                          onToggleMenu={() =>
                            setOpenMenuBookingId((prev) =>
                              prev === booking.id ? null : booking.id,
                            )
                          }
                          onCloseMenu={() => setOpenMenuBookingId(null)}
                        />
                      ));
                    })()}
                  </div>
                ))}
              </div>
            ))}

            {showNowLine ? (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: nowLineTop,
                  left: 72,
                  right: 0,
                }}
              >
                <div className="relative flex items-center">
                  <span className="absolute -left-[72px] flex w-[72px] justify-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
                  </span>
                  <div className="h-[2px] w-full bg-[#3B82F6]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
