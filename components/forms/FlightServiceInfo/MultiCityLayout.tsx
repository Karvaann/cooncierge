"use client";

import React, { useState, useEffect } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineEdit } from "react-icons/md";
import { FiMinusCircle } from "react-icons/fi";
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
  pnr?: string;
  preview?: SegmentPreview;
  tripId?: number;
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
  pnr?: string;
  preview?: SegmentPreview;
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
  departureTimeRaw?: string;
  arrivalTime?: string;
  arrivalTimeRaw?: string;
  flightNumber?: string;
  duration?: string;
}

export default function MultiCityLayout({
  formData,
  setFormData,
}: {
  formData: FlightInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<FlightInfoFormData>>;
}) {
  const [trips, setTrips] = useState<number[]>([1]);
  const [segmentPreview, setSegmentPreview] = useState<
    Record<string, SegmentPreview>
  >({});
  const [returnSegmentPreview, setReturnSegmentPreview] = useState<
    Record<string, SegmentPreview>
  >({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [editingData, setEditingData] = useState<
    Record<string, Partial<SegmentPreview>>
  >({});
  const lastFetchedRef = React.useRef<Record<string, string>>({});
  const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY ?? "";

  // Format time like 08:15 AM
  const formatTime = (datetime: any) => {
    if (!datetime) return "--";
    return new Date(datetime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
  const getFlightEndpoint = (flightNumber: string, API_KEY: string): string => {
    return `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flightNumber}`;
  };

  const fetchFlightData = async (
    segment: FlightSegment | ReturnFlightSegment,
    isReturn: boolean = false,
  ) => {
    try {
      if (!segment.flightnumber) return;
      if (!API_KEY) {
        console.error("Missing NEXT_PUBLIC_AVIATIONSTACK_KEY");
        return;
      }

      const endpoint = getFlightEndpoint(String(segment.flightnumber), API_KEY);

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
        origin: `${f.departure?.airport ?? "--"} (${
          f.departure?.iata ?? "--"
        })`,
        destination: `${f.arrival?.airport ?? "--"} (${
          f.arrival?.iata ?? "--"
        })`,
        departureTime: formatTime(f.departure?.scheduled),
        departureTimeRaw: f.departure?.scheduled,
        arrivalTime: formatTime(f.arrival?.scheduled),
        arrivalTimeRaw: f.arrival?.scheduled,
        flightNumber:
          f.flight?.iata || f.flight?.number || String(segment.flightnumber),
        duration: getDuration(f.departure?.scheduled, f.arrival?.scheduled),
      };

      if (isReturn) {
        setReturnSegmentPreview((prev) => ({
          ...prev,
          [segment.id!]: preview,
        }));
        setFormData((prev) => ({
          ...prev,
          returnSegments: prev.returnSegments.map((s) =>
            s.id === segment.id ? { ...s, preview } : s,
          ),
        }));
        lastFetchedRef.current[segment.id!] = String(
          segment.flightnumber ?? "",
        );
      } else {
        setSegmentPreview((prev) => ({
          ...prev,
          [segment.id!]: preview,
        }));
        setFormData((prev) => ({
          ...prev,
          segments: prev.segments.map((s) =>
            s.id === segment.id ? { ...s, preview } : s,
          ),
        }));
        lastFetchedRef.current[segment.id!] = String(
          segment.flightnumber ?? "",
        );
      }
    } catch (error) {
      console.error("Flight fetch error:", error);
    }
  };

  // Store timeout refs for each segment to properly debounce
  const timeoutRefs = React.useRef<Record<string, NodeJS.Timeout>>({});
  const returnTimeoutRefs = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Debounced fetch for onwards segments
  useEffect(() => {
    formData.segments.forEach((segment) => {
      const fn = String(segment.flightnumber || "");
      const segmentId = segment.id!;

      // Clear any existing timeout for this segment
      if (timeoutRefs.current[segmentId]) {
        clearTimeout(timeoutRefs.current[segmentId]);
        delete timeoutRefs.current[segmentId];
      }

      // Clear preview data if flight number is empty or less than 3 characters
      const hasManualPreview = !!(segment as FlightSegment).preview;
      if (fn.length < 3 && !hasManualPreview && !segmentPreview[segmentId]) {
        setSegmentPreview((prev) => {
          const updated = { ...prev };
          delete updated[segmentId];
          return updated;
        });
        return;
      }

      // Skip scheduling if the same flight number was already fetched
      if (lastFetchedRef.current[segmentId] === fn) return;

      timeoutRefs.current[segmentId] = setTimeout(() => {
        fetchFlightData(segment, false)
          .then(() => {
            lastFetchedRef.current[segmentId] = String(
              segment.flightnumber || "",
            );
          })
          .catch(() => {})
          .finally(() => {
            delete timeoutRefs.current[segmentId];
          });
      }, 3000);
    });

    // Cleanup all timeouts on unmount
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      timeoutRefs.current = {};
    };
  }, [formData.segments]);

  // Debounced fetch for return segments
  useEffect(() => {
    formData.returnSegments.forEach((segment) => {
      const fn = String(segment.flightnumber || "");
      const segmentId = segment.id!;

      // Clear any existing timeout for this segment
      if (returnTimeoutRefs.current[segmentId]) {
        clearTimeout(returnTimeoutRefs.current[segmentId]);
        delete returnTimeoutRefs.current[segmentId];
      }

      // Clear preview data if flight number is empty or less than 3 characters
      const hasManualPreview = !!(segment as ReturnFlightSegment).preview;
      if (
        fn.length < 3 &&
        !hasManualPreview &&
        !returnSegmentPreview[segmentId]
      ) {
        setReturnSegmentPreview((prev) => {
          const updated = { ...prev };
          delete updated[segmentId];
          return updated;
        });
        return;
      }

      if (lastFetchedRef.current[segmentId] === fn) return;

      returnTimeoutRefs.current[segmentId] = setTimeout(() => {
        fetchFlightData(segment, true)
          .then(() => {
            lastFetchedRef.current[segmentId] = String(
              segment.flightnumber || "",
            );
          })
          .catch(() => {})
          .finally(() => {
            delete returnTimeoutRefs.current[segmentId];
          });
      }, 3000);
    });

    // Cleanup all timeouts on unmount
    return () => {
      Object.values(returnTimeoutRefs.current).forEach(clearTimeout);
      returnTimeoutRefs.current = {};
    };
  }, [formData.returnSegments]);

  const addTrip = () => {
    setTrips((prev) => [...prev, (prev[prev.length - 1] ?? 0) + 1]);
  };

  const removeTrip = (id: number) => {
    setTrips((prev) => prev.filter((tripId) => tripId !== id));
  };

  const addSegment = (tripId?: number) => {
    const newSegmentBase = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      flightnumber: "",
      traveldate: "",
      cabinclass: "",
    } as FlightSegment;
    const newSegment: FlightSegment =
      typeof tripId !== "undefined"
        ? { ...newSegmentBase, tripId }
        : newSegmentBase;
    setFormData((prev) => ({
      ...prev,
      segments: [...prev.segments, newSegment],
    }));
  };

  const getSegmentsForTrip = (tripIndex: number, tripId: number) => {
    const byTrip = formData.segments.filter((s) => s.tripId === tripId);
    if (byTrip.length > 0) return byTrip;
    // fallback for existing segments without tripId: return the segment at same index if present
    if (formData.segments[tripIndex]) return [formData.segments[tripIndex]];
    return [] as FlightSegment[];
  };

  const getPreviewsForTrip = (tripIndex: number, tripId: number) => {
    const segs = getSegmentsForTrip(tripIndex, tripId);
    const previews: Record<string, SegmentPreview> = {};
    segs.forEach((s) => {
      const pv = s.preview ?? (s.id ? segmentPreview[s.id] : undefined);
      if (pv && s.id) previews[s.id] = pv;
    });
    return previews;
  };

  const removeSegment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.filter((segment) => segment.id !== id),
    }));
  };

  // const addReturnSegment = () => {
  //   const newSegment: FlightSegment = {
  //     id: `return-${Date.now()}`,
  //     flightnumber: "",
  //     traveldate: "",
  //     cabinclass: "",
  //   };
  //   setFormData({
  //     ...formData,
  //     returnSegments: [...formData.returnSegments, newSegment],
  //   });
  // };

  // const removeReturnSegment = (id: string) => {
  //   if (formData.returnSegments.length > 0) {
  //     setFormData({
  //       ...formData,
  //       returnSegments: formData.returnSegments.filter(
  //         (segment) => segment.id !== id
  //       ),
  //     });
  //   }
  // };

  const handleSegmentPnr = (
    segmentId: string,
    value: string,
    type: "segments" | "returnSegments",
  ) => {
    setFormData((prev) => {
      const updated = [...prev[type]];
      const idx = updated.findIndex((s) => s.id === segmentId);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], pnr: value } as FlightSegment;

      return { ...prev, [type]: updated };
    });
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
    if (totalMinutes === 0) return "-";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 text-[0.75rem] text-gray-700">
      {trips.map((tripId, tripIndex) => (
        <div key={tripId} className="border border-gray-200 rounded-lg p-3">
          {/* Trip Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[0.85rem] gap-1 font-semibold text-gray-800">
              Trip {tripIndex + 1} (
              {getTotalDuration(getPreviewsForTrip(tripIndex, tripId))})
            </h3>
            {trips.length > 1 && (
              <button
                onClick={() => removeTrip(tripId)}
                className="text-gray-400 hover:text-red-600"
              >
                <FiMinusCircle size={18} />
              </button>
            )}
          </div>

          {/* Onwards Section */}
          {/* <div className="mb-4">
            <span className="font-medium text-gray-600">
              Onwards ({getTotalDuration(segmentPreview)})
            </span>
          </div> */}

          <div className="space-y-4">
            {(() => {
              const segs = getSegmentsForTrip(tripIndex, tripId);
              return segs.map((segment, segIdx) => (
                <div
                  key={segment.id}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-3"
                >
                  {/* Flight Segment */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[0.8rem] font-semibold text-gray-800">
                        Flight Segment {segIdx + 1}
                      </h4>
                      {segs.length > 1 && (
                        <button
                          onClick={() => removeSegment(segment.id!)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FiMinusCircle size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {/* Flight Number */}
                      <div>
                        <label className="block mb-1 font-medium text-gray-600">
                          Flight Number
                        </label>
                        <input
                          type="text"
                          placeholder="A320"
                          value={segment.flightnumber}
                          onChange={(e) => {
                            const updatedSegments = formData.segments.map(
                              (s) =>
                                s.id === segment.id
                                  ? { ...s, flightnumber: e.target.value }
                                  : s,
                            );
                            setFormData({
                              ...formData,
                              segments: updatedSegments,
                            });
                            if (segment.id) {
                              delete lastFetchedRef.current[segment.id];
                            }
                          }}
                          className="w-[75%] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                        />
                      </div>

                      {/* Show PNR when toggle OFF */}
                      {!formData.pnrEnabled && (
                        <div>
                          <label className="block mb-1 font-medium text-gray-600">
                            PNR
                          </label>
                          <input
                            type="text"
                            placeholder="Enter PNR"
                            value={segment.pnr || ""}
                            onChange={(e) =>
                              handleSegmentPnr(
                                segment.id!,
                                e.target.value,
                                "segments",
                              )
                            }
                            className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                          />
                        </div>
                      )}

                      {/* Travel Date */}
                      <div>
                        <SingleCalendar
                          label="Travel Date"
                          value={segment.traveldate}
                          onChange={(date) => {
                            const updatedSegments = formData.segments.map(
                              (s) =>
                                s.id === segment.id
                                  ? { ...s, traveldate: date }
                                  : s,
                            );
                            setFormData({
                              ...formData,
                              segments: updatedSegments,
                            });
                          }}
                          placeholder="DD-MM-YYYY"
                          minDate={formData.bookingdate}
                          customWidth="w-[75%]"
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
                            {
                              value: "Premium Economy",
                              label: "Premium Economy",
                            },
                            { value: "Business", label: "Business" },
                            { value: "First Class", label: "First Class" },
                          ]}
                          placeholder="Cabin Class"
                          value={segment.cabinclass}
                          onChange={(val: string) => {
                            const updatedSegments = formData.segments.map(
                              (s) =>
                                s.id === segment.id
                                  ? { ...s, cabinclass: val }
                                  : s,
                            );
                            setFormData({
                              ...formData,
                              segments: updatedSegments,
                            });
                          }}
                          customWidth="w-[75%]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="border border-dotted border-gray-200 rounded-lg p-3">
                    {/* Heading and edit icon */}
                    {!editing[segment.id!] && (
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[0.8rem] font-semibold text-gray-800">
                          Preview
                        </h4>
                        <button
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
                        >
                          <MdOutlineEdit size={16} />
                        </button>
                      </div>
                    )}

                    {!editing[segment.id!] && (
                      <hr className="mb-3 border-t border-gray-200" />
                    )}

                    <div className="bg-white rounded-md p-3 min-h-[180px]">
                      {(() => {
                        const isEditing = !!editing[segment.id!];
                        const preview =
                          segment.preview ?? segmentPreview[segment.id!];
                        if (isEditing) {
                          const data = editingData[segment.id!] || {};
                          return (
                            <div className="h-full">
                              <div className="grid grid-cols-1 gap-2 text-[0.75rem]">
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
                                      value={
                                        data.origin ?? preview?.origin ?? ""
                                      }
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
                                        (editingData[segment.id!]
                                          ?.departureTime ??
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
                                        (editingData[segment.id!]
                                          ?.arrivalTime ??
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

                              {/* Buttons */}
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
                                      d.departureTime ??
                                      d.departureTimeRaw ??
                                      "";
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
                                          const m = Math.abs(
                                            Math.floor(diff % 60),
                                          );
                                          durationVal = `${h}h ${m}m`;
                                        }
                                      } catch (e) {
                                        // ignore
                                      }
                                    }

                                    const newPreview: SegmentPreview = {
                                      airline:
                                        d.airline ?? preview?.airline ?? "",
                                      origin: d.origin ?? preview?.origin ?? "",
                                      destination:
                                        d.destination ??
                                        preview?.destination ??
                                        "",
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
                            <>
                              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                                <span className="font-medium text-gray-800">
                                  {preview.airline}
                                </span>
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                      Origin
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                      {truncateIfLong(preview.origin)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                      STD
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                      {preview.departureTime}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                      Flight Number
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                      {preview.flightNumber}
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-center text-gray-500 text-[0.6rem]">
                                    <div className="w-[1px] h-8 border-l-2 border-dotted border-gray-300 mb-1"></div>
                                    <div className="text-[0.75rem] font-medium text-gray-700">
                                      ✈
                                    </div>
                                    <div className="w-[0.0625rem] h-8 border-l-2 border-dotted border-gray-300 mt-1"></div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                      Duration
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                      {preview.duration}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                      Destination
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                      {truncateIfLong(preview.destination)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                      STA
                                    </div>
                                    <div className="font-semibold text-gray-900">
                                      {preview.arrivalTime}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        }

                        return (
                          <div className="flex items-center justify-center h-full bg-gray-50 rounded-md text-gray-500 min-h-[160px]">
                            <p>Preview data will appear here</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ));
            })()}

            {/* Add Segment */}
            <button
              onClick={() => addSegment(tripId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#126ACB] text-white rounded-md text-[0.75rem] hover:bg-blue-700 transition"
            >
              <CiCirclePlus size={16} />
              Add Segment
            </button>
          </div>
        </div>
      ))}

      {/* Add Trip Button */}
      <button
        onClick={addTrip}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#126ACB] text-white text-[0.75rem] font-medium rounded-md hover:bg-blue-700 transition"
      >
        <CiCirclePlus size={16} />
        Add Trip
      </button>
    </div>
  );
}
