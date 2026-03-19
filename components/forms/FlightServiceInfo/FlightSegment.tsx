"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiMinusCircle } from "react-icons/fi";
import { MdOutlineEdit } from "react-icons/md";
import { LuSave } from "react-icons/lu";
import Modal from "@/components/Modal";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import BaggageCounters from "./BaggageCounters";

// Exported Types

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
  pnr?: string;
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
  preview?: SegmentPreview | undefined;
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
  onPreviewChange: (segmentId: string, preview?: SegmentPreview) => void;
  traveldate: string;
  bookingdate: string;
  onTraveldateChange: (date: string) => void;
  /** Show a per-segment PNR field */
  showPnr?: boolean;
  onPnrChange?: (value: string) => void;
  isReadOnly?: boolean;
}

// Helper Functions

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

const parseDurationParts = (duration?: string) => {
  const match = String(duration ?? "").match(
    /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i,
  );
  return {
    hours: match?.[1] ?? "",
    minutes: match?.[2] ?? "",
  };
};

const buildDurationValue = (hours?: string, minutes?: string) => {
  const safeHours = String(hours ?? "").trim();
  const safeMinutes = String(minutes ?? "").trim();

  if (!safeHours && !safeMinutes) return "";

  const normalizedHours = safeHours === "" ? "0" : safeHours;
  const normalizedMinutes = safeMinutes === "" ? "0" : safeMinutes;

  return `${normalizedHours}h ${normalizedMinutes}m`;
};

const sanitizeFlightNumber = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);

const sanitizePNR = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

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

// Component

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
  isReadOnly,
}: FlightSegmentCardProps) {
  const segId = segment.id!;
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<Partial<SegmentPreview>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  // Internal API fetch logic
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
  }, [segment.flightnumber, segment.traveldate, segId]);

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
      flightNumber:
        preview?.flightNumber ??
        sanitizeFlightNumber(String(segment.flightnumber ?? "")),
      origin: preview?.origin ?? "",
      destination: preview?.destination ?? "",
      departureTime: toTimeInput(
        preview?.departureTimeRaw ?? preview?.departureTime,
      ),
      arrivalTime: toTimeInput(preview?.arrivalTimeRaw ?? preview?.arrivalTime),
      duration: preview?.duration ?? "",
      pnr: preview?.pnr ?? sanitizePNR(String(segment.pnr ?? "")),
    });
  };

  const cancelEditing = () => {
    // If all edit fields are empty, clear preview so placeholder shows.
    const allEmpty = isEditingDataEmpty(editingData);
    if (allEmpty) {
      onPreviewChange(segId, undefined);
    }
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

    // If all fields are empty, clear preview and exit.
    if (isEditingDataEmpty(d)) {
      onPreviewChange(segId, undefined);
      setIsEditing(false);
      setEditingData({});
      return;
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
      pnr: d.pnr ?? preview?.pnr ?? String(segment.pnr ?? ""),
    };

    onPreviewChange(segId, newPreview);
    onSegmentChange(segId, {
      flightnumber: sanitizeFlightNumber(String(newPreview.flightNumber ?? "")),
      pnr: sanitizePNR(String(newPreview.pnr ?? "")),
    });
    onPnrChange?.(sanitizePNR(String(newPreview.pnr ?? "")));
    setIsEditing(false);
    setEditingData({});
  };

  const isEditingDataEmpty = (d: Partial<SegmentPreview> | undefined) => {
    if (!d) return true;
    const keys: Array<keyof SegmentPreview> = [
      "airline",
      "flightNumber",
      "origin",
      "destination",
      "departureTime",
      "arrivalTime",
      "duration",
      "pnr",
    ];
    return !keys.some((k) => {
      const v = d[k];
      return typeof v === "string" && v.trim() !== "";
    });
  };

  return (
    <div className="border border-[#E2E1E1] bg-white rounded-[15px] w-full py-[14px] px-[20px] min-w-0 shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]">
      {/* Flight Segment Form Card */}
      <div>
        <div className="flex  items-center justify-between mb-[14px]">
          <h4 className="text-[13px] rounded-[6px] bg-[#F9F9F9] px-[10px] py-[5px] font-[500] text-[#414141]">
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

        <div className="grid grid-cols-5 gap-2">
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
                onSegmentChange(segId, {
                  flightnumber: sanitizeFlightNumber(e.target.value),
                })
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
                onChange={(e) => onPnrChange?.(sanitizePNR(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-[15px] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
              />
            </div>
          )}

          {/* Travel Date */}
          <div>
            <SingleCalendar
              label="Travel Date"
              value={traveldate}
              onChange={(date) => {
                if (traveldate && traveldate !== date) {
                  setPendingDate(date);
                  setConfirmOpen(true);
                  return;
                }
                onTraveldateChange(date);
              }}
              placeholder="DD-MM-YYYY"
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
                { value: "Premium economy", label: "Premium Economy" },
                { value: "Business", label: "Business" },
                { value: "First class", label: "First Class" },
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
              readOnly={isReadOnly || false}
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
      <div className="bg-[linear-gradient(90deg,#F6ECFF_0%,#FDFAFF_100%)] w-full rounded-[15px] mt-2 p-3.5 min-w-0">
        {preview ? (
          <>
            {/* Airline Header */}
            <div className="flex justify-between items-center gap-2">
              {(() => {
                return (
                  <>
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="17"
                        viewBox="0 0 18 17"
                        fill="none"
                      >
                        <path
                          d="M16.3589 6.79992C16.4357 7.08326 16.3997 7.35006 16.2509 7.60034C16.1021 7.85062 15.8837 8.01354 15.5957 8.08909L4.30608 11.0641C4.15248 11.1113 3.99888 11.1019 3.84528 11.0358C3.69168 10.9696 3.57648 10.8658 3.49968 10.7241L1.61328 7.38076L2.65008 7.11159L4.42128 8.83992L8.09328 7.87659L4.85328 2.86159L6.23568 2.49326L11.2469 7.04076L15.0341 6.04909C15.3221 5.96409 15.5957 5.99715 15.8549 6.14826C16.1141 6.29937 16.2821 6.51659 16.3589 6.79992ZM3.42768 13.0899H14.9477V14.5066H3.42768V13.0899Z"
                          fill="#126ACB"
                        />
                      </svg>
                      <div className="font-[500] text-[#126ACB]">
                        {preview.airline}
                      </div>
                      <div>{preview.flightNumber}</div>
                    </div>

                    <button
                      onClick={startEditing}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <MdOutlineEdit size={16} />
                    </button>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center justify-between mt-5 gap-2">
              <div className="font-[500] text-[13px] text-[#414141]">
                {truncateIfLong(preview.origin)}
              </div>

              <div className="rounded-full bg-[#F0E1FF] p-[4px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                >
                  <circle cx="4" cy="4" r="4" fill="#020202" />
                </svg>
              </div>

              <div className="font-[500] text-[13px] text-[#818181]">
                {preview.departureTime}
              </div>
              <div className="border-t border-dashed border-t-[#9CA3AF] h-[2px] w-[20%]" />
              <div className="font-[400] text-[11px] whitespace-nowrap flex-shrink-0 rounded-full border border-[rgba(113,53,173,0.20)] py-[2px] px-[4px] text-[#818181]">
                ~{preview.duration}
              </div>
              <div className="border-t border-dashed border-t-[#9CA3AF] h-[2px] w-[20%]" />
              <div className="font-[500] text-[13px] text-[#818181]">
                {preview.arrivalTime}
              </div>

              <div className="rounded-full bg-[#F0E1FF] p-[4px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                >
                  <circle cx="4" cy="4" r="4" fill="#020202" />
                </svg>
              </div>

              <div className="font-[500] text-[13px] text-[#414141]">
                {truncateIfLong(preview.destination)}
              </div>
            </div>
          </>
        ) : (
          <div className="flex relative items-center justify-center h-full rounded-md text-gray-500 min-h-[80px]">
            <p>Preview data will appear here</p>
            <button
              onClick={startEditing}
              className="absolute top-0 right-2 text-blue-600 hover:text-blue-700"
            >
              <MdOutlineEdit size={16} />
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isEditing}
        onClose={cancelEditing}
        showCloseButton
        customWidth="w-[min(1100px,calc(100vw-32px))]"
        className="rounded-[28px]"
        zIndexClass="z-[99999]"
        headerLeft={
          <div className="flex items-center justify-between px-7 pt-6">
            <h2 className="text-[1.05rem] font-[600] text-[#414141]">
              Edit Preview
            </h2>
          </div>
        }
      >
        <div className="px-7 pb-7 pt-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
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
                className="w-full px-4 py-2.5 border border-[#D9D9D9] rounded-[18px] text-[#020202] text-[0.95rem] outline-none focus:border-[#C6AEDE]"
              />
            </div>

            <div>
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
                Flight Number
              </label>
              <input
                type="text"
                value={editingData.flightNumber ?? ""}
                onChange={(e) =>
                  setEditingData((prev) => ({
                    ...prev,
                    flightNumber: sanitizeFlightNumber(e.target.value),
                  }))
                }
                className="w-full px-4 py-2.5 border border-[#D9D9D9] rounded-[18px] text-[#020202] text-[0.95rem] outline-none focus:border-[#C6AEDE]"
              />
            </div>

            <div>
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
                PNR
              </label>
              <input
                type="text"
                value={editingData.pnr ?? ""}
                onChange={(e) =>
                  setEditingData((prev) => ({
                    ...prev,
                    pnr: sanitizePNR(e.target.value),
                  }))
                }
                className="w-full px-4 py-2.5 border border-[#D9D9D9] rounded-[18px] text-[#020202] text-[0.95rem] outline-none focus:border-[#C6AEDE]"
              />
            </div>

            <div>
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
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
                className="w-full px-4 py-2.5 border border-[#D9D9D9] rounded-[18px] text-[#020202] text-[0.95rem] outline-none focus:border-[#C6AEDE]"
              />
            </div>

            <div>
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
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
                className="w-full px-4 py-2.5 border border-[#D9D9D9] rounded-[18px] text-[#020202] text-[0.95rem] outline-none focus:border-[#C6AEDE]"
              />
            </div>

            <div>
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
                ETD
              </label>
              <input
                type="text"
                value={editingData.departureTime ?? ""}
                onChange={(e) => {
                  const input = e.target.value;
                  setEditingData((prev) => {
                    let val = String(input).replace(/[^0-9:]/g, "");

                    const colonCount = (val.match(/:/g) || []).length;
                    if (colonCount > 1) {
                      val = val.replace(/:([^:]*)$/, "$1");
                    }

                    if (
                      val.length === 2 &&
                      !val.includes(":") &&
                      (prev.departureTime ?? "").length < 2
                    ) {
                      val = val + ":";
                    }

                    if (val.length > 5) val = val.slice(0, 5);

                    if (val.includes(":")) {
                      const parts = val.split(":");
                      const hours = parts[0] || "";
                      const minutes = parts[1] || "";
                      let validHours = hours;
                      let validMinutes = minutes;

                      if (hours.length > 0) {
                        const hourNum = parseInt(hours, 10);
                        if (hours.length === 2 && hourNum > 23) {
                          validHours = "23";
                        }
                      }

                      if (validMinutes.length > 0) {
                        const minNum = parseInt(validMinutes, 10);
                        if (validMinutes.length === 2 && minNum > 59) {
                          validMinutes = "59";
                        }
                      }

                      val = validHours + ":" + validMinutes;
                    } else {
                      if (val.length === 2) {
                        const hourNum = parseInt(val, 10);
                        if (hourNum > 23) {
                          val = "23";
                        }
                      }
                    }

                    return { ...prev, departureTime: val };
                  });
                }}
                placeholder="HH:MM"
                maxLength={5}
                className="w-full px-4 py-2.5 border border-[#D9D9D9] rounded-[18px] text-[#020202] text-[0.95rem]"
              />
            </div>

            <div>
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
                ETA
              </label>
              <input
                type="text"
                value={editingData.arrivalTime ?? ""}
                onChange={(e) => {
                  const input = e.target.value;
                  setEditingData((prev) => {
                    let val = String(input).replace(/[^0-9:]/g, "");

                    const colonCount = (val.match(/:/g) || []).length;
                    if (colonCount > 1) {
                      val = val.replace(/:([^:]*)$/, "$1");
                    }

                    if (
                      val.length === 2 &&
                      !val.includes(":") &&
                      (prev.arrivalTime ?? "").length < 2
                    ) {
                      val = val + ":";
                    }

                    if (val.length > 5) val = val.slice(0, 5);

                    if (val.includes(":")) {
                      const parts = val.split(":");
                      const hours = parts[0] || "";
                      const minutes = parts[1] || "";
                      let validHours = hours;
                      let validMinutes = minutes;

                      if (hours.length > 0) {
                        const hourNum = parseInt(hours, 10);
                        if (hours.length === 2 && hourNum > 23) {
                          validHours = "23";
                        }
                      }

                      if (validMinutes.length > 0) {
                        const minNum = parseInt(validMinutes, 10);
                        if (validMinutes.length === 2 && minNum > 59) {
                          validMinutes = "59";
                        }
                      }

                      val = validHours + ":" + validMinutes;
                    } else {
                      if (val.length === 2) {
                        const hourNum = parseInt(val, 10);
                        if (hourNum > 23) {
                          val = "23";
                        }
                      }
                    }

                    return { ...prev, arrivalTime: val };
                  });
                }}
                placeholder="HH:MM"
                maxLength={5}
                className="w-full px-4 py-2.5 border border-[#D9D9D9] rounded-[18px] text-[#020202] text-[0.95rem]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[#414141] font-[500] text-[12px] mb-1.5 block">
                Duration
              </label>

              <div className="flex w-full items-center gap-3 border border-[#D9D9D9] rounded-[18px] px-4 py-2">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={parseDurationParts(editingData.duration).hours}
                  onChange={(e) => {
                    const durationParts = parseDurationParts(
                      editingData.duration,
                    );
                    setEditingData((prev) => ({
                      ...prev,
                      duration: buildDurationValue(
                        e.target.value,
                        durationParts.minutes,
                      ),
                    }));
                  }}
                  className="w-12 text-[0.95rem] text-[#020202] outline-none bg-transparent"
                />
                <span className="text-[0.95rem] font-[400] border border-[#E2E1E1] rounded-[10px] px-2 py-0.5 bg-[#F9F9F9] text-[#020202]">
                  h
                </span>

                <input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={parseDurationParts(editingData.duration).minutes}
                  onChange={(e) => {
                    const durationParts = parseDurationParts(
                      editingData.duration,
                    );
                    setEditingData((prev) => ({
                      ...prev,
                      duration: buildDurationValue(
                        durationParts.hours,
                        e.target.value,
                      ),
                    }));
                  }}
                  className="w-12 text-[0.95rem] text-[#020202] outline-none bg-transparent"
                />
                <span className="text-[0.95rem] font-[400] border border-[#E2E1E1] rounded-[10px] px-2 py-0.5 bg-[#F9F9F9] text-[#020202]">
                  m
                </span>
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 font-[600] rounded-[14px] border text-[0.85rem]"
              style={{ borderColor: "#7135AD", color: "#7135AD" }}
            >
              Cancel
            </button>

            <button
              onClick={saveEditing}
              className="px-5 py-2 rounded-[14px] text-white text-[0.95rem] flex items-center gap-2"
              style={{ backgroundColor: "#7135AD" }}
            >
              <LuSave size={15} />
              Save Details
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingDate(null);
        }}
        onConfirm={() => {
          // Clear the current travel date so user can pick a new one
          onTraveldateChange("");
          setConfirmOpen(false);
          setPendingDate(null);
        }}
        title={"Are you sure you want to change the date?"}
        confirmText="Yes"
        cancelText="No"
        confirmButtonColor="bg-[#1A7F64]"
      />
    </div>
  );
}
