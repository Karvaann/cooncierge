"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TbClipboardText } from "react-icons/tb";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import LogsUI from "@/components/LogsUI";
import { FiEdit2 } from "react-icons/fi";
import { IoCalendarClearOutline, IoLocationSharp } from "react-icons/io5";
import AvatarTooltip from "@/components/AvatarToolTip";
import { getOwnerAvatarColorClass } from "@/utils/helper";
import ViewItineraryDetailsAccordian from "@/components/accordians/ViewItineraryDetailsAccordian";
import SelectedPackageCard from "@/components/SelectedPackageCard";
import PickupDropCard from "@/components/PickupDropCard";
import ViewBookingLayoutTabs from "@/components/viewBookingLayouts/ViewBookingLayoutTabs";
import ModifySearchModal from "@/components/Modals/ModifySearchModal";

type BookingOwner = {
  full: string;
  short: string;
  color: string;
};

const computeInitials = (name: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase();
};

const computeNightsDaysDisplay = (start?: string, end?: string) => {
  const parseToUTC = (s?: string) => {
    if (!s || typeof s !== "string") return null;

    if (s.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return null;
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const parts = s.includes("-") ? s.split("-") : s.split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    const day = Number(dd);
    const monthIndex = Number(mm) - 1;
    const year = Number(yyyy);
    if (Number.isNaN(day) || Number.isNaN(monthIndex) || Number.isNaN(year))
      return null;
    return Date.UTC(year, monthIndex, day);
  };

  const startUtc = parseToUTC(start);
  const endUtc = parseToUTC(end);
  if (startUtc === null || endUtc === null) {
    return {
      nights: null as number | null,
      days: null as number | null,
      display: "",
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((endUtc - startUtc) / msPerDay);
  const nights = Math.max(0, diffDays);
  const days = nights + 1;
  return { nights, days, display: `${nights}N/${days}D` };
};

const formatToDDMMYYYY = (value?: string) => {
  if (!value) return "";

  // If it's ISO (SingleCalendar) or YYYY-MM-DD, format with Date
  if (value.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return value;
};

const TravelDatesSummaryCard = ({
  destination,
  startDate,
  endDate,
  nightsDaysDisplay,
  onEdit,
}: {
  destination: string;
  startDate: string;
  endDate: string;
  nightsDaysDisplay: string;
  onEdit?: () => void;
}) => {
  return (
    <div className="rounded-[12px] border border-gray-200 bg-[#FFF7E8] px-5 py-4 flex items-center justify-between shadow-sm w-full">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFEAD1] flex items-center justify-center">
            <IoLocationSharp className="text-[#D97706]" size={16} />
          </div>
          <div className="text-[18px] font-semibold text-[#B45309]">
            {destination}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[16px] text-[#020202] font-semibold">
            <IoCalendarClearOutline className="text-[#020202]" size={18} />
            <span>{startDate}</span>
            <span className="text-gray-400 font-medium">→</span>
            <span>{endDate}</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-300" />
          <div className="text-[16px] text-[#020202] font-semibold">
            {nightsDaysDisplay}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="w-10 h-10 rounded-[10px] border border-blue-200 bg-white flex items-center justify-center hover:bg-blue-50"
        aria-label="Edit travel dates"
        onClick={onEdit}
      >
        <FiEdit2 className="text-blue-600" size={18} />
      </button>
    </div>
  );
};

const ViewBookingPage = () => {
  const tabOptions = useMemo(() => ["Booking Info", "Booking Log"], []);
  const [activeTab, setActiveTab] =
    useState<(typeof tabOptions)[number]>("Booking Info");

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  const bookingId = useMemo(() => "OS-ABC12", []);

  // These should come from the user's selected dates (wired to dummy for now)
  const [travelStartDate, setTravelStartDate] = useState<string>(() =>
    new Date(2025, 4, 5).toISOString(),
  );
  const [travelEndDate, setTravelEndDate] = useState<string>(() =>
    new Date(2025, 4, 12).toISOString(),
  );

  const [isModifySearchOpen, setIsModifySearchOpen] = useState(false);

  const destination = useMemo(() => "Dubai", []);
  const { nights, display: nightsDaysDisplay } = useMemo(
    () => computeNightsDaysDisplay(travelStartDate, travelEndDate),
    [travelStartDate, travelEndDate],
  );

  const travelStartDateDisplay = useMemo(
    () => formatToDDMMYYYY(travelStartDate),
    [travelStartDate],
  );
  const travelEndDateDisplay = useMemo(
    () => formatToDDMMYYYY(travelEndDate),
    [travelEndDate],
  );

  const owners: BookingOwner[] = useMemo(() => {
    const names = ["Aastha Sharma", "Akash Kumar", "Saurav Raj", "Varun Gupta"];

    return names.map((full) => ({
      full,
      short: computeInitials(full),
      color: getOwnerAvatarColorClass(full),
    }));
  }, []);

  const bookingLog = useMemo(
    () => [
      {
        title: "Booking confirmed",
        meta: "Status updated to Booking Confirmed",
        by: "Akash Kumar",
        at: "10 Oct 2025 • 11:12 AM",
      },
      {
        title: "PNR added",
        meta: "PNR set to JK5678",
        by: "Aastha Sharma",
        at: "09 Sep 2025 • 06:40 PM",
      },
      {
        title: "Flight details updated",
        meta: "Departure time updated to 08:10 AM",
        by: "Saurav Raj",
        at: "09 Sep 2025 • 04:05 PM",
      },
      {
        title: "Booking created",
        meta: "Draft booking created for customer",
        by: "Varun Gupta",
        at: "09 Sep 2025 • 12:20 PM",
      },
    ],
    [],
  );

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = tabOptions.indexOf(activeTab);
      const activeEl = tabRefs.current[activeIndex];
      const container = tabsContainerRef.current;
      if (!activeEl || !container) return;

      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        width: activeRect.width,
        left: activeRect.left - containerRect.left,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabOptions]);

  return (
    <div className="w-full">
      {/* OUTER CARD */}
      <div className="bg-white rounded-[8px] shadow px-[18px] py-[18px] mb-5 w-full border border-gray-100">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[18px] font-semibold text-[#020202]">
                View Booking <span className="font-semibold">|</span>{" "}
                <span className="font-semibold">{bookingId}</span>
              </h1>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">
              View and track booking details here
            </p>
          </div>

          <button
            type="button"
            className="w-9 h-9 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
            aria-label="More actions"
          >
            <HiOutlineDotsHorizontal size={18} />
          </button>
        </div>

        <div className="border-t border-gray-200 my-4" />

        {/* TABS + ACTIONS ROW */}
        <div className="flex items-center justify-between gap-4">
          {/* Tabs */}
          <div
            className="flex items-center bg-[#F3F3F3] gap-[20px] rounded-[10px] relative p-1"
            ref={tabsContainerRef}
          >
            <div
              className="absolute h-[calc(100%-0.60rem)] bg-[#0D4B37] rounded-[8px]
							 shadow-sm transition-all duration-300 ease-in-out
							 top-1/2 -translate-y-1/2"
              style={{
                width:
                  indicatorStyle.width > 0
                    ? `${indicatorStyle.width}px`
                    : `calc((100% - 1.25rem) / ${tabOptions.length})`,
                left: `${indicatorStyle.left}px`,
              }}
            />

            {tabOptions.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 px-[14px] py-[6px] rounded-[8px] text-[14px] font-medium transition-colors duration-300 flex-1 whitespace-nowrap ${
                  activeTab === tab
                    ? "text-white"
                    : "text-[#818181] hover:text-gray-900"
                }`}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-700 tracking-wide">
                BOOKING OWNERS :
              </span>
              <div className="flex items-center">
                {owners.map((o) => (
                  <AvatarTooltip
                    key={o.full}
                    short={o.short}
                    full={o.full}
                    color={o.color}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="relative w-11 h-10 rounded-[8px] border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
              aria-label="Tasks"
            >
              <TbClipboardText size={20} className="text-[#0D4B37]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
                1
              </span>
            </button>

            <button
              type="button"
              className="flex items-center text-[14px] cursor-pointer gap-[8px] px-[16px] py-[9px] rounded-[8px] bg-[#0D4B37] text-white font-[500] hover:bg-[#0B3E2E]"
            >
              + Task
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "Booking Info" ? (
            <div className="flex flex-col 2xl:flex-row gap-4 items-start">
              <div
                className="flex flex-col gap-4"
                style={{ width: "1050px", maxWidth: "100%" }}
              >
                <ViewItineraryDetailsAccordian
                  owners={owners}
                  width={1050}
                  itinerary={{
                    destination,
                    startDate: travelStartDateDisplay,
                    endDate: travelEndDateDisplay,
                    nightsLabel: typeof nights === "number" ? `${nights}N` : "",
                  }}
                />

                <div>
                  <PickupDropCard
                    city="DEIRA"
                    pickupPoint="Dubai International Airport"
                    dropPoint="Dubai International Airport"
                    onChangeRoute={() => {
                      // placeholder: open route change modal later
                      console.log("Change Route clicked");
                    }}
                  />
                  <div className="mt-3">
                    <ViewBookingLayoutTabs />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-[280px] w-full space-y-4">
                <TravelDatesSummaryCard
                  destination={destination}
                  startDate={travelStartDateDisplay}
                  endDate={travelEndDateDisplay}
                  nightsDaysDisplay={nightsDaysDisplay}
                  onEdit={() => setIsModifySearchOpen(true)}
                />

                <SelectedPackageCard
                  itineraryName="ITINERARY ABC"
                  destination={destination}
                  startDate={travelStartDateDisplay}
                  endDate={travelEndDateDisplay}
                  nightsLabel={typeof nights === "number" ? `${nights}N` : "7N"}
                  totalNetPrice={12500}
                />
              </div>
            </div>
          ) : (
            <LogsUI
              logs={bookingLog}
              title="Booking Log"
              subtitle="Latest updates for this booking"
              entityLabel="Booking"
              entityId={bookingId}
            />
          )}
        </div>
      </div>

      <ModifySearchModal
        isOpen={isModifySearchOpen}
        onClose={() => setIsModifySearchOpen(false)}
        initialStartDate={travelStartDate}
        initialEndDate={travelEndDate}
        onApply={({ startDate, endDate }) => {
          setTravelStartDate(startDate);
          setTravelEndDate(endDate);
        }}
      />
    </div>
  );
};

export default ViewBookingPage;
