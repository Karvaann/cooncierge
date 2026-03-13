"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiMinusCircle } from "react-icons/fi";
import { MdOutlineEdit } from "react-icons/md";
import { LuSave } from "react-icons/lu";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import BaggageCounters from "./BaggageCounters";
import TimeInput from "../components/TimeInput";
import { getAirlineIconUrl } from "@/utils/helper";

// --- Exported Types ---

export interface SegmentPreview {
  airline?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  departureTimeRaw?: string;
  arrivalTimeRaw?: string;
  arrivalTime?: string;
  flightNumber?: string;
  duration?: string;
}

export interface FlightSegmentData {
  id?: string | null;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
  preview?: SegmentPreview;
  pnr?: string;
  cabinBaggagePcs?: number | string;
  cabinBaggageWt?: number | string;
  checkInBaggagePcs?: number | string;
  checkInBaggageWt?: number | string;
}

export interface FlightSegmentCardProps {
  segment: FlightSegmentData;
  index: number;
  canRemove: boolean;
  onRemove: (id: string) => void;
  onSegmentChange: (
    segmentId: string,
    patch: Partial<FlightSegmentData>,
  ) => void;
  preview: SegmentPreview | undefined;
  onPreviewChange: (segmentId: string, preview: SegmentPreview) => void;
  traveldate: string;
  bookingdate: string;
  onTraveldateChange: (date: string) => void;
  /** Show a per-segment PNR field */
  showPnr?: boolean;
  onPnrChange?: (value: string) => void;
}

// --- Helper Functions ---

const toTimeInput = (val?: string) => {
  if (!val) return "";
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const m = String(val).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (m) {
    let hh = parseInt(m[1]!, 10);
    const mm2 = m[2] ?? "00";
    const ampm = (m[3] ?? "AM").toUpperCase();
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${mm2}`;
  }
  const m2 = String(val).match(/(\d{1,2}):(\d{2})/);
  if (m2)
    return `${String(parseInt(m2[1]!, 10)).padStart(2, "0")}:${m2[2] ?? "00"}`;
  return "";
};

const truncateIfLong = (val?: string, limit = 20) => {
  if (!val) return val ?? "";
  return val.length > limit ? `${val.slice(0, limit)}...` : val;
};

const capTimeInput = (val?: string) => {
  if (!val) return "";
  const parts = String(val).split(":");
  let hh = parseInt(parts[0] ?? "0", 10);
  let mm = parseInt(parts[1] ?? "0", 10);
  if (isNaN(hh)) hh = 0;
  if (isNaN(mm)) mm = 0;
  if (hh > 23) hh = 23;
  if (mm > 59) mm = 59;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const formatTime = (datetime: any) => {
  if (!datetime) return "--";
  return new Date(datetime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDuration = (dep: any, arr: any) => {
  if (!dep || !arr) return "--";
  const d1: any = new Date(dep);
  const d2: any = new Date(arr);
  const diff = (d2 - d1) / 1000 / 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h ${m}m`;
};

// --- Component ---

export default function FlightSegmentCard({
  segment,
  index,
  canRemove,
  onRemove,
  onSegmentChange,
  preview,
  onPreviewChange,
  traveldate,
  bookingdate,
  onTraveldateChange,
  showPnr,
  onPnrChange,
}: FlightSegmentCardProps) {
  const segId = segment.id!;
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<Partial<SegmentPreview>>({});

  // --- Internal API fetch logic ---
  const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY ?? "";
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedRef = useRef<string>("");

  useEffect(() => {
    const fn = String(segment.flightnumber || "");

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Don't fetch if too short, unless there's already a manual preview
    if (fn.length < 3 && !segment.preview) return;

    // Skip if same flight number already fetched
    if (lastFetchedRef.current === fn) return;

    if (!API_KEY) return;

    timeoutRef.current = setTimeout(() => {
      const endpoint = `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${fn}`;

      fetch(endpoint)
        .then((res) => res.json())
        .then((data: any) => {
          if (data?.error || !data?.data?.length) return;

          const f: any = data.data[0];
          const fetched: SegmentPreview = {
            airline: f.airline?.name || f.airline?.airline_name || "--",
            origin: `${f.departure?.airport ?? f.departure?.iata_code ?? "--"} (${f.departure?.iata ?? "--"})`,
            destination: `${f.arrival?.airport ?? f.arrival?.iata_code ?? "--"} (${f.arrival?.iata ?? "--"})`,
            departureTime: formatTime(f.departure?.scheduled),
            arrivalTime: formatTime(f.arrival?.scheduled),
            departureTimeRaw: f.departure?.scheduled,
            arrivalTimeRaw: f.arrival?.scheduled,
            flightNumber: f.flight?.iata || f.flight?.number || fn,
            duration: getDuration(f.departure?.scheduled, f.arrival?.scheduled),
          };

          lastFetchedRef.current = fn;
          onPreviewChange(segId, fetched);
        })
        .catch((err) => {
          console.error("Flight fetch error:", err);
        });
    }, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [segment.flightnumber, segId]);

  // Reset lastFetchedRef when flight number is cleared by parent so next input triggers fetch
  useEffect(() => {
    const fn = String(segment.flightnumber || "");
    if (fn.length < 3) {
      lastFetchedRef.current = "";
    }
  }, [segment.flightnumber]);

  const startEditing = () => {
    setIsEditing(true);
    setEditingData({
      airline: preview?.airline ?? "",
      flightNumber: preview?.flightNumber ?? String(segment.flightnumber ?? ""),
      origin: preview?.origin ?? "",
      destination: preview?.destination ?? "",
      departureTime: toTimeInput(
        preview?.departureTimeRaw ?? preview?.departureTime,
      ),
      arrivalTime: toTimeInput(preview?.arrivalTimeRaw ?? preview?.arrivalTime),
      duration: preview?.duration ?? "",
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingData({});
  };

  const saveEditing = () => {
    const d = editingData;
    const dep = d.departureTime ?? d.departureTimeRaw ?? "";
    const arr = d.arrivalTime ?? d.arrivalTimeRaw ?? "";

    let durationVal = d.duration ?? "";
    if ((!durationVal || durationVal === "") && dep && arr) {
      try {
        const depISO = `${segment.traveldate}T${dep}`;
        const arrISO = `${segment.traveldate}T${arr}`;
        const t1 = new Date(depISO);
        const t2 = new Date(arrISO);
        if (!isNaN(t1.getTime()) && !isNaN(t2.getTime())) {
          const diff = (t2.getTime() - t1.getTime()) / 1000 / 60;
          const h = Math.floor(diff / 60);
          const m = Math.abs(Math.floor(diff % 60));
          durationVal = `${h}h ${m}m`;
        }
      } catch {}
    }

    const newPreview: SegmentPreview = {
      airline: d.airline ?? preview?.airline ?? "",
      origin: d.origin ?? preview?.origin ?? "",
      destination: d.destination ?? preview?.destination ?? "",
      departureTime: dep ?? preview?.departureTime ?? "",
      arrivalTime: arr ?? preview?.arrivalTime ?? "",
      departureTimeRaw: dep
        ? `${segment.traveldate}T${dep}`
        : (preview?.departureTimeRaw ?? ""),
      arrivalTimeRaw: arr
        ? `${segment.traveldate}T${arr}`
        : (preview?.arrivalTimeRaw ?? ""),
      flightNumber:
        d.flightNumber ??
        preview?.flightNumber ??
        String(segment.flightnumber ?? ""),
      duration: durationVal || preview?.duration || "",
    };

    onPreviewChange(segId, newPreview);
    setIsEditing(false);
    setEditingData({});
  };

  return (
    <>
      {/* Flight Segment Form Card */}
      <div className="border border-[#E2E1E1] bg-white rounded-[15px] w-full py-[14px] px-[20px] min-w-0 shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[0.85rem] font-[500] text-[#414141]">
            Flight Segment {index + 1}
          </h4>
          {canRemove && (
            <button
              onClick={() => onRemove(segId)}
              className="text-gray-400 hover:cursor-pointer"
            >
              <FiMinusCircle size={18} />
            </button>
          )}
        </div>

        <hr className="mb-2 -mt-1 border-t border-[#E2E1E1]" />

        <div className="grid grid-cols-1 gap-4">
          {/* Flight Number */}
          <div>
            <label className="block mb-1 font-[500] text-[#414141]">
              Flight Number
            </label>
            <input
              type="text"
              placeholder="Enter Flight Number"
              value={segment.flightnumber}
              onChange={(e) =>
                onSegmentChange(segId, { flightnumber: e.target.value })
              }
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-[15px] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
            />
          </div>

          {/* PNR (optional, shown when showPnr is true) */}
          {showPnr && (
            <div>
              <label className="block mb-1 font-[500] text-[#414141]">
                PNR
              </label>
              <input
                type="text"
                placeholder="Enter PNR"
                value={segment.pnr || ""}
                onChange={(e) => onPnrChange?.(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-[15px] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
              />
            </div>
          )}

          {/* Travel Date */}
          <div>
            <SingleCalendar
              label="Travel Date"
              value={traveldate}
              onChange={onTraveldateChange}
              placeholder="DD-MM-YYYY"
              minDate={bookingdate}
              customWidth="w-full"
              showCalendarIcon={false}
              inputStyleClass="px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
            />
          </div>

          {/* Cabin Class */}
          <div>
            <label className="block mb-1 font-[500] text-[#414141]">
              Cabin Class
            </label>
            <DropDown
              options={[
                { value: "Economy", label: "Economy" },
                { value: "Premium Economy", label: "Premium Economy" },
                { value: "Business", label: "Business" },
                { value: "First Class", label: "First Class" },
              ]}
              placeholder="Cabin Class"
              value={segment.cabinclass}
              onChange={(val: string) =>
                onSegmentChange(segId, { cabinclass: val })
              }
              customWidth="w-full"
              buttonClassName="px-3 py-1.5 hover:border-[#C6AEDE] rounded-[15px]"
              noButtonRadius
              className="mt-1"
              optionClassName="font-[400] text-[#020202]"
            />
          </div>

          {/* Baggage Counters */}
          <BaggageCounters
            cabinPcs={segment.cabinBaggagePcs ?? 1}
            cabinWt={segment.cabinBaggageWt}
            checkInPcs={segment.checkInBaggagePcs ?? 1}
            checkInWt={segment.checkInBaggageWt}
            onChange={(patch) => onSegmentChange(segId, patch)}
          />
        </div>
      </div>

      {/* Preview Card */}
      <div className="border border-dotted border-[#E2E1E1] bg-white w-full rounded-[15px] p-3.5 min-w-0">
        {!isEditing && (
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[0.85rem] font-[500] text-[#414141]">
              Preview
            </h4>
            <button
              onClick={startEditing}
              className="text-blue-600 hover:text-blue-700"
            >
              <MdOutlineEdit size={16} />
            </button>
          </div>
        )}

        {!isEditing && <hr className="mb-3 border-t border-[#E2E1E1]" />}

        <div className="bg-white rounded-md p-2">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Airline Name */}
              <div>
                <label className="text-[#414141] font-[500] text-[12px] mb-1 block">
                  Airline Name
                </label>
                <input
                  type="text"
                  value={editingData.airline ?? ""}
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      airline: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-[#E2E1E1] rounded-[15px] text-[#020202] text-[0.75rem]"
                />
              </div>

              {/* Flight Number */}
              <div>
                <label className="text-[#414141] font-[500] text-[12px] mb-1 block">
                  Flight Number
                </label>
                <input
                  type="text"
                  value={editingData.flightNumber ?? ""}
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      flightNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-[#E2E1E1] rounded-[15px] text-[#020202] text-[0.75rem]"
                />
              </div>

              {/* Origin */}
              <div>
                <label className="text-[#414141] font-[500] text-[12px] mb-1 block">
                  Origin
                </label>
                <input
                  type="text"
                  value={editingData.origin ?? ""}
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      origin: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-[#E2E1E1] rounded-[15px] text-[#020202] text-[0.75rem]"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="text-[#414141] font-[500] text-[12px] mb-1 block">
                  Destination
                </label>
                <input
                  type="text"
                  value={editingData.destination ?? ""}
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      destination: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-[#E2E1E1] rounded-[15px] text-[#020202] text-[0.75rem]"
                />
              </div>

              {/* ETD */}
              <div>
                <label className="text-[#414141] font-[500] text-[12px] mb-1 block">
                  ETD
                </label>
                <TimeInput
                  value={editingData.departureTime ?? ""}
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      departureTime: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-[#E2E1E1] rounded-[15px] text-[#020202] text-[0.75rem]"
                />
              </div>

              {/* ETA */}
              <div>
                <label className="text-[#414141] font-[500] text-[12px] mb-1 block">
                  ETA
                </label>
                <TimeInput
                  value={editingData.arrivalTime ?? ""}
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      arrivalTime: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-[#E2E1E1] rounded-[15px] text-[#020202] text-[0.75rem]"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-[#414141] font-[500] text-[12px] mb-1 block">
                  Duration
                </label>

                <div className="flex w-full items-center border border-[#E2E1E1] rounded-[15px] px-3 py-1">
                  <input
                    type="number"
                    placeholder="0"
                    className="w-8 text-[12px] text-[#020202] outline-none bg-transparent"
                  />
                  <span className="text-[12px] font-[400] border border-[#E2E1E1] rounded-[10px] px-1.5 py-0.5 bg-[#F9F9F9] text-[#020202] mr-3">
                    h
                  </span>

                  <input
                    type="number"
                    placeholder="0"
                    className="w-8 text-[12px]  text-[#020202] outline-none bg-transparent"
                  />
                  <span className="text-[12px] font-[400] border border-[#E2E1E1] rounded-[10px] px-1.5 py-0.5 bg-[#F9F9F9] text-[#020202]">
                    m
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex justify-end gap-2 mt-3">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-1.5 font-[600] rounded-[10px] border text-[0.75rem]"
                  style={{ borderColor: "#7135AD", color: "#7135AD" }}
                >
                  Cancel
                </button>

                <button
                  onClick={saveEditing}
                  className="px-4 py-1.5 rounded-[10px] text-white text-[0.75rem] flex items-center gap-1"
                  style={{ backgroundColor: "#7135AD" }}
                >
                  <LuSave size={14} />
                  Save
                </button>
              </div>
            </div>
          ) : preview ? (
            <>
              {/* Airline Header */}
              <div className="border border-[#3A469D] rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                {(() => {
                  const icon = getAirlineIconUrl(preview.airline);
                  return (
                    <>
                      {icon && (
                        <img
                          src={icon}
                          alt={preview.airline || "airline"}
                          className="w-7 h-7 object-contain rounded-sm"
                        />
                      )}
                      <span className="font-[500] text-[#020202]">
                        {preview.airline}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-[1fr_40px_1fr] gap-x-8 gap-y-8 mt-4">
                {/*Origin / STD */}
                <div>
                  <div className="text-[#818181] font-[400] text-[11px] mb-0.5">
                    Origin
                  </div>
                  <div className="font-[500] text-[#020202]">
                    {truncateIfLong(preview.origin)}
                  </div>
                </div>

                <div className="row-span-3 flex flex-col items-center h-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="6"
                    height="6"
                    viewBox="0 0 6 6"
                    fill="none"
                    className="self-center mt-1"
                  >
                    <circle cx="3" cy="3" r="3" fill="#818181" />
                  </svg>

                  <div className="flex-1 w-[1px] border-l-2 border-dotted border-[#818181]"></div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="20"
                    viewBox="0 0 18 20"
                    fill="none"
                    className="my-2"
                  >
                    <path
                      d="M11 14V18C11 18.5304 10.7893 19.0391 10.4142 19.4142C10.0391 19.7893 9.53043 20 9 20C8.46957 20 7.96086 19.7893 7.58579 19.4142C7.21071 19.0391 7 18.5304 7 18L7 14L0 10L0 7L7 9V5L5 3V0L9 2L13 0V3L11 5L11 9L18 7L18 10L11 14Z"
                      fill="#3A469D"
                    />
                  </svg>

                  <div className="flex-1 w-[0.0625rem] border-l-2 border-dotted border-[#818181]"></div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="6"
                    height="6"
                    viewBox="0 0 6 6"
                    fill="none"
                    className="self-center mb-1"
                  >
                    <circle cx="3" cy="3" r="3" fill="#818181" />
                  </svg>
                </div>

                <div className="text-right">
                  <div className="text-[#818181] font-[400] text-[11px] mb-0.5">
                    STD
                  </div>
                  <div className="font-[500] text-[#020202]">
                    {preview.departureTime}
                  </div>
                </div>

                {/* Flight Number / Duration */}
                <div>
                  <div className="text-[#818181] font-[400] text-[11px] mb-0.5">
                    Flight Number
                  </div>
                  <div className="font-[500] text-[#020202]">
                    {preview.flightNumber}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-[400] text-[#414141]">
                    {preview.duration}
                  </div>
                </div>

                {/* Destination / STA */}
                <div>
                  <div className="text-[#818181] font-[400] text-[11px] mb-0.5">
                    Destination
                  </div>
                  <div className="font-[500] text-[#020202]">
                    {truncateIfLong(preview.destination)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[#818181] font-[400] text-[11px] mb-0.5">
                    STA
                  </div>
                  <div className="font-[500] text-[#020202]">
                    {preview.arrivalTime}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-md text-gray-500 min-h-[255px]">
              <p>Preview data will appear here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
