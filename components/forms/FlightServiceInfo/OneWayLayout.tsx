"use client";

import React, { useState, useEffect } from "react";

import { CiCirclePlus } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdAirplanemodeActive } from "react-icons/md";
import { FiMinusCircle } from "react-icons/fi";
import { MdOutlineEdit } from "react-icons/md";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";

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
  const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY ?? "";

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
    nextDeparture: string | undefined
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

  // Get flight endpoint - using flights API
  const getFlightEndpoint = (
    flightNumber: string,
    date: string,
    API_KEY: string
  ): string => {
    // Free tier: only flight_iata parameter supported (returns today's real-time data)
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
        API_KEY
      );

      const res = await fetch(endpoint);
      const data: AviationAPIResponse & {
        error?: { code: number; type: string };
      } = await res.json();

      // Handle API errors (e.g., method_not_supported for free tier)
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
    } catch (error) {
      console.error("Flight fetch error:", error);
    }
  };

  // Store timeout refs for each segment to properly debounce
  const timeoutRefs = React.useRef<Record<string, NodeJS.Timeout>>({});

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
      if (fn.length < 3) {
        setSegmentPreview((prev) => {
          const updated = { ...prev };
          delete updated[segmentId];
          return updated;
        });
        return;
      }
      // if (!segment.traveldate) return;

      timeoutRefs.current[segmentId] = setTimeout(() => {
        fetchFlightData(segment);
        delete timeoutRefs.current[segmentId];
      }, 3000);
    });

    // Cleanup all timeouts on unmount
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
      <div className="border border-gray-200 w-[46vw] -ml-2 rounded-lg p-3 space-y-4">
        {formData.segments.map((segment, index) => (
          <div
            key={segment.id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-1"
          >
            {/* Flight Segment */}
            <div className="border border-gray-200 rounded-lg w-[98%] p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[0.85rem] font-semibold text-gray-800">
                  Flight Segment {index + 1}
                </h4>
                {formData.segments.length > 1 && (
                  <button
                    onClick={() => removeSegment(segment.id!)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <FiMinusCircle size={18} />
                  </button>
                )}
              </div>

              <hr className="mb-2 -mt-1 border-t border-gray-200" />

              <div className="grid grid-cols-1 gap-4">
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
                          : s
                      );
                      setFormData({ ...formData, segments: updatedSegments });
                    }}
                    className="w-[75%] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
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
                      { value: "Premium Economy", label: "Premium Economy" },
                      { value: "Business", label: "Business" },
                      { value: "First Class", label: "First Class" },
                    ]}
                    placeholder="Cabin Class"
                    value={segment.cabinclass}
                    onChange={(val: string) => {
                      const updated = formData.segments.map((s) =>
                        s.id === segment.id ? { ...s, cabinclass: val } : s
                      );
                      setFormData({ ...formData, segments: updated });
                    }}
                    customWidth="w-[75%]"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Layover UI Between Segment N and N+1 */}
            {index < formData.segments.length - 1 &&
              (() => {
                const current = segmentPreview[segment.id!];
                const nextSegment = formData.segments[index + 1];
                const next = nextSegment?.id
                  ? segmentPreview[nextSegment.id]
                  : undefined;

                const layover = calculateLayover(
                  current?.arrivalTimeRaw, // store raw ISO timestamp
                  next?.departureTimeRaw
                );

                if (!layover) return null;

                return (
                  <div className="flex items-center justify-center gap-2 py-2 text-gray-700 font-medium">
                    {/* Airplane + dashed divider */}
                    <div className="flex items-center gap-2">
                      <MdAirplanemodeActive
                        className="text-blue-500"
                        size={16}
                      />
                    </div>

                    {/* Statement */}
                    <span className="text-[0.8rem]">
                      Layover between Segment {index + 1} &amp; Segment{" "}
                      {index + 2} :
                    </span>

                    {/* Duration */}
                    <span className="font-semibold text-gray-900">
                      {layover}
                    </span>
                  </div>
                );
              })()}

            {/* Preview Section */}
            <div className="border border-dotted border-gray-200 w-[98%] rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[0.85rem] font-semibold text-gray-800">
                  Preview
                </h4>
                <button className="text-blue-600 hover:text-blue-700">
                  <MdOutlineEdit size={16} />
                </button>
              </div>

              <div className="bg-white h-[15.3rem] border border-gray-200 rounded-md p-3">
                {segmentPreview[segment.id!] ? (
                  <>
                    {/* Airline Header */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                      {/* <div className="w-6 h-6 bg-blue-600 rounded-sm"></div> */}
                      <span className="font-medium text-gray-800">
                        {segmentPreview[segment.id!]?.airline ?? "Fetching..."}
                      </span>
                    </div>

                    {/* Route Info */}
                    <div className="space-y-0.5">
                      {/* Origin + Departure */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-gray-500 text-[0.6rem] mb-0.5">
                            Origin
                          </div>
                          <div className="font-semibold text-gray-900">
                            {segmentPreview[segment.id!]?.origin}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500 text-[0.6rem] mb-0.5">
                            STD
                          </div>
                          <div className="font-semibold text-gray-900">
                            {segmentPreview[segment.id!]?.departureTime}
                          </div>
                        </div>
                      </div>

                      {/* Flight Number + Duration */}
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-gray-500 text-[0.6rem] mb-0.5">
                            Flight Number
                          </div>
                          <div className="font-semibold text-gray-900">
                            {segmentPreview[segment.id!]?.flightNumber}
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
                            {segmentPreview[segment.id!]?.duration}
                          </div>
                        </div>
                      </div>

                      {/* Destination + Arrival */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-gray-500 text-[0.6rem] mb-0.5">
                            Destination
                          </div>
                          <div className="font-semibold text-gray-900">
                            {segmentPreview[segment.id!]?.destination}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500 text-[0.6rem] mb-0.5">
                            STA
                          </div>
                          <div className="font-semibold text-gray-900">
                            {segmentPreview[segment.id!]?.arrivalTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded-md text-gray-500">
                    <p>Preview data will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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
