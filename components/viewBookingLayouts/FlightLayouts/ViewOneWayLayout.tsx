"use client";

import React, { useState, useEffect } from "react";

import { CiCirclePlus } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdAirplanemodeActive } from "react-icons/md";
import { FiMinusCircle } from "react-icons/fi";
import { MdOutlineEdit } from "react-icons/md";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import { LuSave } from "react-icons/lu";

interface FlightInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  costprice: number | string;
  sellingprice: number | string;
  PNR: number | string;
  pnrEnabled: boolean;
  segments: FlightSegment[]; // Array of flight segments
  returnSegments: ReturnFlightSegment[];
  samePNRForAllSegments: boolean;
  flightType: "One Way" | "Round Trip" | "Multi-City";

  remarks: string;
}

interface FlightSegment {
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
}

interface ReturnFlightSegment {
  id?: string | null;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
}

interface AviationAirportInfo {
  airport?: string;
  iata?: string;
  scheduled?: string;
}

interface AviationAirlineInfo {
  airline_name?: string;
  name?: string;
}

interface AviationFlightInfo {
  iata?: string;
  number?: string;
}

interface AviationAPIResponse {
  data: {
    departure?: AviationAirportInfo;
    arrival?: AviationAirportInfo;
    airline?: AviationAirlineInfo;
    flight?: AviationFlightInfo;
  }[];
}

interface SegmentPreview {
  airline?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  departureTimeRaw?: string; // ADD
  arrivalTimeRaw?: string;
  arrivalTime?: string;
  flightNumber?: string;
  duration?: string;
}

export default function OneWayLayout({
  formData,
  setFormData,
}: {
  formData: FlightInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<FlightInfoFormData>>;
}) {
  const previewData: SegmentPreview = {
    airline: "IndiGo Airlines",
    origin: "Delhi (DEL)",
    destination: "Mumbai (BOM)",
    departureTime: "08:10 AM",
    arrivalTime: "10:05 AM",
    flightNumber: "A320",
    duration: "1h 55m",
  };

  const [segmentPreview, setSegmentPreview] = useState<
    Record<string, SegmentPreview>
  >({});
  // Editing state for manual input when API data is unavailable
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [editingData, setEditingData] = useState<
    Record<string, Partial<SegmentPreview>>
  >({});
  const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY ?? "";

  const toTimeInput = (val?: string) => {
    if (!val) return "";
    // If val is ISO datetime, parse and return HH:MM
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
    // Last resort: pick first HH:MM
    const m2 = String(val).match(/(\d{1,2}):(\d{2})/);
    if (m2)
      return `${String(parseInt(m2[1]!, 10)).padStart(2, "0")}:${
        m2[2] ?? "00"
      }`;
    return "";
  };

  // Truncate long place names for display
  const truncateIfLong = (val?: string, limit = 20) => {
    if (!val) return val ?? "";
    return val.length > limit ? `${val.slice(0, limit)}...` : val;
  };

  // Normalize/cap time input HH:MM so hours <=23 and minutes <=59
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

  // Format time
  const formatTime = (datetime: any) => {
    if (!datetime) return "--";
    return new Date(datetime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Utility: calculate layover between two DateTime strings
  const calculateLayover = (
    arrival: string | undefined,
    nextDeparture: string | undefined,
  ) => {
    if (!arrival || !nextDeparture) return null;

    const a = new Date(arrival);
    const d = new Date(nextDeparture);

    const diffMin = Math.floor((d.getTime() - a.getTime()) / 1000 / 60);
    if (diffMin <= 0) return null; // no layover or overlapping

    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;

    return `${h}h ${m}m`;
  };

  // Duration calculator
  const getDuration = (dep: any, arr: any) => {
    if (!dep || !arr) return "--";
    const d1: any = new Date(dep);
    const d2: any = new Date(arr);

    const diff = (d2 - d1) / 1000 / 60; // minutes
    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return `${h}h ${m}m`;
  };

  // Get flight endpoint
  const getFlightEndpoint = (
    flightNumber: string,
    date: string,
    API_KEY: string,
  ): string => {
    // Free tier
    return `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flightNumber}`;
  };

  const fetchFlightData = async (segment: FlightSegment) => {
    try {
      if (!segment.flightnumber) return;
      if (!API_KEY) {
        console.error("Missing NEXT_PUBLIC_AVIATIONSTACK_KEY");
        return;
      }

      const endpoint = getFlightEndpoint(
        String(segment.flightnumber),
        segment.traveldate,
        API_KEY,
      );

      const res = await fetch(endpoint);
      const data: AviationAPIResponse & {
        error?: { code: number; type: string };
      } = await res.json();

      // Handle API errors
      if (data?.error) {
        console.warn("AviationStack API error:", data.error);
        return;
      }

      if (!data?.data?.length) return;

      const f: any = data.data[0];

      const preview: SegmentPreview = {
        airline: f.airline?.name || f.airline?.airline_name || "--",
        origin: `${f.departure?.iata_code ?? "--"} (${
          f.departure?.iata ?? "--"
        })`,
        destination: `${f.arrival?.iata_code ?? "--"} (${
          f.arrival?.iata ?? "--"
        })`,
        departureTime: formatTime(f.departure?.scheduled),
        arrivalTime: formatTime(f.arrival?.scheduled),
        departureTimeRaw: f.departure?.scheduled,
        arrivalTimeRaw: f.arrival?.scheduled,
        flightNumber:
          f.flight?.iata || f.flight?.number || String(segment.flightnumber),
        duration: getDuration(f.departure?.scheduled, f.arrival?.scheduled),
      };

      setSegmentPreview((prev) => ({
        ...prev,
        [segment.id!]: preview,
      }));
      // also persist fetched preview into formData so it stays with the segment
      setFormData((prev) => ({
        ...prev,
        segments: prev.segments.map((s) =>
          s.id === segment.id ? { ...s, preview } : s,
        ),
      }));
      // mark that this flight number has been fetched for this segment
      lastFetchedRef.current[segment.id!] = String(segment.flightnumber ?? "");
    } catch (error) {
      console.error("Flight fetch error:", error);
    }
  };

  // Store timeout refs for each segment to properly debounce
  const timeoutRefs = React.useRef<Record<string, NodeJS.Timeout>>({});
  // Keep track of last fetched flight number per segment to avoid refetching same number
  const lastFetchedRef = React.useRef<Record<string, string>>({});

  useEffect(() => {
    // Ensure every segment has a stable id so previews are keyed correctly
    const missingIds = formData.segments.some((s) => !s.id);
    if (missingIds) {
      setFormData((prev) => ({
        ...prev,
        segments: prev.segments.map((s) =>
          s.id
            ? s
            : {
                ...s,
                id: Date.now().toString() + Math.random().toString(36).slice(2),
              },
        ),
      }));
      return; // wait for re-render with ids
    }

    formData.segments.forEach((segment) => {
      const fn = String(segment.flightnumber || "");
      const segmentId = segment.id!;

      // Clear any existing timeout for this segment
      if (timeoutRefs.current[segmentId]) {
        clearTimeout(timeoutRefs.current[segmentId]);
        delete timeoutRefs.current[segmentId];
      }

      // Clear preview data if flight number is empty or less than 3 characters
      // but preserve any manual preview stored on the segment itself
      const hasManualPreview = !!segment.preview;
      if (fn.length < 3 && !hasManualPreview && !segmentPreview[segmentId]) {
        setSegmentPreview((prev) => {
          const updated = { ...prev };
          delete updated[segmentId];
          return updated;
        });
        return;
      }
      // if (!segment.traveldate) return;

      // If already fetched this exact flight number for this segment, skip scheduling
      if (lastFetchedRef.current[segmentId] === fn) return;

      timeoutRefs.current[segmentId] = setTimeout(() => {
        fetchFlightData(segment)
          .then(() => {
            // mark that fetched this flight number (if still present)
            lastFetchedRef.current[segmentId] = String(
              segment.flightnumber || "",
            );
          })
          .catch(() => {
            // ignore failures; do not mark as fetched so retries can occur
          })
          .finally(() => {
            delete timeoutRefs.current[segmentId];
          });
      }, 3000);
    });

    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      timeoutRefs.current = {};
    };
  }, [formData.segments]);

  const addSegment = () => {
    const newSegment: FlightSegment = {
      id: Date.now().toString(),
      flightnumber: "",
      traveldate: "",
      cabinclass: "",
    };
    setFormData({
      ...formData,
      segments: [...formData.segments, newSegment],
    });
  };

  const removeSegment = (id: string) => {
    if (formData.segments.length > 1) {
      setFormData({
        ...formData,
        segments: formData.segments.filter((segment) => segment.id !== id),
      });
    }
  };

  // Calculate total duration from all segment previews
  const getTotalDuration = (previews: Record<string, SegmentPreview>) => {
    let totalMinutes = 0;
    Object.values(previews).forEach((preview) => {
      if (preview.duration && preview.duration !== "--") {
        const match = preview.duration.match(/(\d+)h\s*(\d+)m/);
        if (match && match[1] && match[2]) {
          totalMinutes += parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        }
      }
    });
    if (totalMinutes === 0) return "--";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="text-[0.75rem] ml-2.5 text-gray-700">
      {/* Onwards label */}
      <div className="mb-3">
        <span className="font-medium text-gray-600">
          Onwards ({getTotalDuration(segmentPreview)})
        </span>
      </div>

      {/* Flight Segments + Preview */}
      <div className="border border-gray-200 w-[1000px] -ml-2 rounded-lg p-3 space-y-4">
        {formData.segments.map((segment, index) => (
          <React.Fragment key={segment.id ?? String(index)}>
            {/* Flight Segment Card */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[0.85rem] font-semibold text-gray-800">
                  Flight Segment {index + 1}
                </h4>
                {formData.segments.length > 1 && (
                  <button
                    onClick={() => removeSegment(segment.id!)}
                    className="text-gray-400 hover:text-red-500"
                    type="button"
                  >
                    <FiMinusCircle size={18} />
                  </button>
                )}
              </div>

              <hr className="mb-4 -mt-1 border-t border-gray-200" />

              {/* Details row (match screenshot) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Flight Number */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Flight Number"
                    value={segment.flightnumber}
                    onChange={(e) => {
                      const updatedSegments = formData.segments.map((s) =>
                        s.id === segment.id
                          ? { ...s, flightnumber: e.target.value }
                          : s,
                      );
                      setFormData({ ...formData, segments: updatedSegments });
                      if (segment.id) {
                        delete lastFetchedRef.current[segment.id];
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                </div>

                {/* Travel Date */}
                <div>
                  <SingleCalendar
                    label="Travel Date"
                    value={formData.traveldate}
                    onChange={(date) =>
                      setFormData((prev) => ({ ...prev, traveldate: date }))
                    }
                    placeholder="DD-MM-YYYY"
                    minDate={formData.bookingdate}
                    customWidth="w-full"
                    showCalendarIcon={false}
                  />
                </div>

                {/* Cabin Class */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Cabin Class
                  </label>
                  <DropDown
                    options={[
                      { value: "Economy", label: "Economy" },
                      { value: "Premium Economy", label: "Premium Economy" },
                      { value: "Business", label: "Business" },
                      { value: "First Class", label: "First Class" },
                    ]}
                    placeholder="Choose Cabin Class"
                    value={segment.cabinclass}
                    onChange={(val: string) => {
                      const updated = formData.segments.map((s) =>
                        s.id === segment.id ? { ...s, cabinclass: val } : s,
                      );
                      setFormData({ ...formData, segments: updated });
                    }}
                    customWidth="w-full"
                    className="mt-1"
                  />
                </div>

                {/* Cost Price (new) */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Cost Price
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                    <div className="relative">
                      <select
                        className="h-[38px] pl-3 pr-8 text-[12px] font-medium text-gray-700 bg-white border-r border-gray-200 focus:outline-none"
                        defaultValue="INR"
                        onChange={() => {}}
                      >
                        <option value="INR">INR</option>
                      </select>
                      <MdKeyboardArrowDown
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                        size={18}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Amount"
                      value={formData.costprice}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const cleaned = String(raw).replace(/[^0-9.]/g, "");
                        const firstDot = cleaned.indexOf(".");
                        const sanitized =
                          firstDot === -1
                            ? cleaned
                            : cleaned.slice(0, firstDot + 1) +
                              cleaned.slice(firstDot + 1).replace(/\./g, "");
                        setFormData((prev) => ({
                          ...prev,
                          costprice: sanitized,
                        }));
                      }}
                      className="flex-1 px-3 py-2 text-[13px] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Box (under details) */}
              <div className="mt-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-between px-4 py-3">
                  <h4 className="text-[0.85rem] font-semibold text-gray-800">
                    Preview
                  </h4>

                  {!editing[segment.id!] && (
                    <button
                      type="button"
                      onClick={() => {
                        const segId = segment.id!;
                        setEditing((prev) => ({ ...prev, [segId]: true }));
                        const pv = segment.preview ?? segmentPreview[segId];
                        setEditingData((prev) => ({
                          ...prev,
                          [segId]: {
                            airline: pv?.airline ?? "",
                            flightNumber:
                              pv?.flightNumber ??
                              String(segment.flightnumber ?? ""),
                            origin: pv?.origin ?? "",
                            destination: pv?.destination ?? "",
                            departureTime: toTimeInput(
                              pv?.departureTimeRaw ?? pv?.departureTime,
                            ),
                            arrivalTime: toTimeInput(
                              pv?.arrivalTimeRaw ?? pv?.arrivalTime,
                            ),
                            duration: pv?.duration ?? "",
                          },
                        }));
                      }}
                      className="text-blue-600 hover:text-blue-700"
                      aria-label="Edit preview"
                    >
                      <MdOutlineEdit size={16} />
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-200" />

                <div className="p-4">
                  {(() => {
                    const isEditing = !!editing[segment.id!];
                    const preview =
                      segment.preview ?? segmentPreview[segment.id!];

                    if (isEditing) {
                      const data = editingData[segment.id!] || {};
                      return (
                        <div className="h-full">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <label className="text-gray-500 text-[0.6rem] mb-1 block">
                                Airline Name
                              </label>
                              <input
                                type="text"
                                value={data.airline ?? ""}
                                onChange={(e) =>
                                  setEditingData((prev) => ({
                                    ...prev,
                                    [segment.id!]: {
                                      ...prev[segment.id!],
                                      airline: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-gray-500 text-[0.6rem] mb-1 block">
                                  Flight Number
                                </label>
                                <input
                                  type="text"
                                  value={
                                    data.flightNumber ??
                                    preview?.flightNumber ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    setEditingData((prev) => ({
                                      ...prev,
                                      [segment.id!]: {
                                        ...prev[segment.id!],
                                        flightNumber: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                                />
                              </div>

                              <div>
                                <label className="text-gray-500 text-[0.6rem] mb-1 block">
                                  Duration
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 1h 55m"
                                  value={
                                    data.duration ?? preview?.duration ?? ""
                                  }
                                  onChange={(e) =>
                                    setEditingData((prev) => ({
                                      ...prev,
                                      [segment.id!]: {
                                        ...prev[segment.id!],
                                        duration: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-gray-500 text-[0.6rem] mb-1 block">
                                  Origin
                                </label>
                                <input
                                  type="text"
                                  value={data.origin ?? preview?.origin ?? ""}
                                  onChange={(e) =>
                                    setEditingData((prev) => ({
                                      ...prev,
                                      [segment.id!]: {
                                        ...prev[segment.id!],
                                        origin: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                                />
                              </div>

                              <div>
                                <label className="text-gray-500 text-[0.6rem] mb-1 block">
                                  Destination
                                </label>
                                <input
                                  type="text"
                                  value={
                                    data.destination ??
                                    preview?.destination ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    setEditingData((prev) => ({
                                      ...prev,
                                      [segment.id!]: {
                                        ...prev[segment.id!],
                                        destination: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 items-end">
                              <div>
                                <label className="text-gray-500 text-[0.6rem] mb-1 block">
                                  ETD
                                </label>
                                <input
                                  type="time"
                                  value={
                                    (editingData[segment.id!]?.departureTime ??
                                      preview?.departureTime) as string
                                  }
                                  onChange={(e) =>
                                    setEditingData((prev) => ({
                                      ...prev,
                                      [segment.id!]: {
                                        ...prev[segment.id!],
                                        departureTime: capTimeInput(
                                          e.target.value,
                                        ),
                                      },
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                                />
                              </div>

                              <div>
                                <label className="text-gray-500 text-[0.6rem] mb-1 block">
                                  ETA
                                </label>
                                <input
                                  type="time"
                                  value={
                                    (editingData[segment.id!]?.arrivalTime ??
                                      preview?.arrivalTime) as string
                                  }
                                  onChange={(e) =>
                                    setEditingData((prev) => ({
                                      ...prev,
                                      [segment.id!]: {
                                        ...prev[segment.id!],
                                        arrivalTime: capTimeInput(
                                          e.target.value,
                                        ),
                                      },
                                    }))
                                  }
                                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing((prev) => ({
                                  ...prev,
                                  [segment.id!]: false,
                                }));
                                setEditingData((prev) => {
                                  const copy = { ...prev };
                                  delete copy[segment.id!];
                                  return copy;
                                });
                              }}
                              className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[0.75rem] text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const d = editingData[segment.id!] || {};
                                const dep =
                                  d.departureTime ?? d.departureTimeRaw ?? "";
                                const arr =
                                  d.arrivalTime ?? d.arrivalTimeRaw ?? "";

                                let durationVal = d.duration ?? "";
                                if (
                                  (!durationVal || durationVal === "") &&
                                  dep &&
                                  arr
                                ) {
                                  try {
                                    const depISO = `${segment.traveldate}T${dep}`;
                                    const arrISO = `${segment.traveldate}T${arr}`;
                                    const t1 = new Date(depISO);
                                    const t2 = new Date(arrISO);
                                    if (
                                      !isNaN(t1.getTime()) &&
                                      !isNaN(t2.getTime())
                                    ) {
                                      const diff =
                                        (t2.getTime() - t1.getTime()) /
                                        1000 /
                                        60;
                                      const h = Math.floor(diff / 60);
                                      const m = Math.abs(Math.floor(diff % 60));
                                      durationVal = `${h}h ${m}m`;
                                    }
                                  } catch (e) {}
                                }

                                const newPreview: SegmentPreview = {
                                  airline: d.airline ?? preview?.airline ?? "",
                                  origin: d.origin ?? preview?.origin ?? "",
                                  destination:
                                    d.destination ?? preview?.destination ?? "",
                                  departureTime:
                                    dep ?? preview?.departureTime ?? "",
                                  arrivalTime:
                                    arr ?? preview?.arrivalTime ?? "",
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
                                  duration:
                                    durationVal || preview?.duration || "",
                                };

                                setSegmentPreview((prev) => ({
                                  ...prev,
                                  [segment.id!]: newPreview,
                                }));
                                setFormData((prev) => ({
                                  ...prev,
                                  segments: prev.segments.map((s) =>
                                    s.id === segment.id
                                      ? { ...s, preview: newPreview }
                                      : s,
                                  ),
                                }));
                                lastFetchedRef.current[segment.id!] =
                                  newPreview.flightNumber ??
                                  String(segment.flightnumber ?? "");
                                setEditing((prev) => ({
                                  ...prev,
                                  [segment.id!]: false,
                                }));
                                setEditingData((prev) => {
                                  const copy = { ...prev };
                                  delete copy[segment.id!];
                                  return copy;
                                });
                              }}
                              className="px-3 py-1.5 flex items-center gap-1 bg-[#0D4B37] text-white rounded-md text-[0.75rem] hover:bg-green-700"
                            >
                              <LuSave size={16} />
                              Save
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (preview) {
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                          <div>
                            <div className="text-gray-400 text-[0.7rem] font-semibold tracking-wide">
                              FLIGHT
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="w-7 h-7 rounded bg-gray-50 border border-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                                ✈
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900">
                                  {preview.airline}
                                </span>
                                <span className="text-gray-600">
                                  {preview.flightNumber}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-400 text-[0.7rem] font-semibold tracking-wide">
                              DEPART
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="font-semibold text-gray-900">
                                {truncateIfLong(preview.origin)}
                              </span>
                              <span className="text-gray-500">|</span>
                              <span className="font-semibold text-gray-900">
                                {preview.departureTime}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-400 text-[0.7rem] font-semibold tracking-wide">
                              ARRIVE
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="font-semibold text-gray-900">
                                {truncateIfLong(preview.destination)}
                              </span>
                              <span className="text-gray-500">|</span>
                              <span className="font-semibold text-gray-900">
                                {preview.arrivalTime}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="text-gray-400 text-[0.7rem] font-semibold tracking-wide">
                              DURATION/STOPS
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="font-semibold text-gray-900">
                                {preview.duration}
                              </span>
                              <span className="text-gray-500">|</span>
                              <span className="font-semibold text-gray-900">
                                0 Stops
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-md text-gray-500 min-h-[120px]">
                        <p>Preview data will appear here</p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Layover UI Between Segment N and N+1 */}
            {index < formData.segments.length - 1 &&
              (() => {
                const current = segment.preview ?? segmentPreview[segment.id!];
                const nextSegment = formData.segments[index + 1];
                const next =
                  nextSegment?.preview ??
                  (nextSegment?.id
                    ? segmentPreview[nextSegment.id]
                    : undefined);

                const layover = calculateLayover(
                  current?.arrivalTimeRaw,
                  next?.departureTimeRaw,
                );

                if (!layover) return null;

                return (
                  <div className="flex items-center justify-center gap-2 py-2 text-gray-700 font-medium">
                    <div className="flex items-center gap-2">
                      <MdAirplanemodeActive
                        className="text-blue-500"
                        size={16}
                      />
                    </div>

                    <span className="text-[0.8rem]">
                      Layover between Segment {index + 1} &amp; Segment{" "}
                      {index + 2} :
                    </span>

                    <span className="font-semibold text-gray-900">
                      {layover}
                    </span>
                  </div>
                );
              })()}
          </React.Fragment>
        ))}

        {/* Add Segment Button */}
        <button
          onClick={addSegment}
          className="flex items-center gap-1.5 px-3 py-1.5 mt-3 bg-[#126ACB] text-white text-[0.75rem] font-medium rounded-md hover:bg-blue-700 transition"
        >
          <CiCirclePlus size={16} />
          Add Segment
        </button>
      </div>
    </div>
  );
}
