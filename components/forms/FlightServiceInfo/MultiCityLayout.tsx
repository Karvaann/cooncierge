"use client";

import React, { useState, useEffect } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineEdit } from "react-icons/md";
import { FiMinusCircle } from "react-icons/fi";

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
  arrivalTime?: string;
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
  const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY ?? "";

  // Format time like 08:15 AM
  const formatTime = (datetime: any) => {
    if (!datetime) return "--";
    return new Date(datetime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
  // Note: flight_date parameter requires paid plan on AviationStack
  // Free tier only allows real-time flight lookup by flight number
  const getFlightEndpoint = (flightNumber: string, API_KEY: string): string => {
    return `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flightNumber}`;
  };

  const fetchFlightData = async (
    segment: FlightSegment | ReturnFlightSegment,
    isReturn: boolean = false
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
        arrivalTime: formatTime(f.arrival?.scheduled),
        flightNumber:
          f.flight?.iata || f.flight?.number || String(segment.flightnumber),
        duration: getDuration(f.departure?.scheduled, f.arrival?.scheduled),
      };

      if (isReturn) {
        setReturnSegmentPreview((prev) => ({
          ...prev,
          [segment.id!]: preview,
        }));
      } else {
        setSegmentPreview((prev) => ({
          ...prev,
          [segment.id!]: preview,
        }));
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
      if (fn.length < 3) {
        setSegmentPreview((prev) => {
          const updated = { ...prev };
          delete updated[segmentId];
          return updated;
        });
        return;
      }

      timeoutRefs.current[segmentId] = setTimeout(() => {
        fetchFlightData(segment, false);
        delete timeoutRefs.current[segmentId];
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
      if (fn.length < 3) {
        setReturnSegmentPreview((prev) => {
          const updated = { ...prev };
          delete updated[segmentId];
          return updated;
        });
        return;
      }

      returnTimeoutRefs.current[segmentId] = setTimeout(() => {
        fetchFlightData(segment, true);
        delete returnTimeoutRefs.current[segmentId];
      }, 3000);
    });

    // Cleanup all timeouts on unmount
    return () => {
      Object.values(returnTimeoutRefs.current).forEach(clearTimeout);
      returnTimeoutRefs.current = {};
    };
  }, [formData.returnSegments]);

  const previewData: SegmentPreview = {
    airline: "IndiGo Airlines",
    origin: "Delhi (DEL)",
    destination: "Mumbai (BOM)",
    departureTime: "08:10 AM",
    arrivalTime: "10:05 AM",
    flightNumber: "A320",
    duration: "1h 55m",
  };

  const addTrip = () => {
    setTrips((prev) => [...prev, (prev[prev.length - 1] ?? 0) + 1]);
  };

  const removeTrip = (id: number) => {
    setTrips((prev) => prev.filter((tripId) => tripId !== id));
  };

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

  const addReturnSegment = () => {
    const newSegment: FlightSegment = {
      id: `return-${Date.now()}`,
      flightnumber: "",
      traveldate: "",
      cabinclass: "",
    };
    setFormData({
      ...formData,
      returnSegments: [...formData.returnSegments, newSegment],
    });
  };

  const removeReturnSegment = (id: string) => {
    if (formData.returnSegments.length > 0) {
      setFormData({
        ...formData,
        returnSegments: formData.returnSegments.filter(
          (segment) => segment.id !== id
        ),
      });
    }
  };

  const handleSegmentPnr = (
    idx: number,
    value: string,
    type: "segments" | "returnSegments"
  ) => {
    setFormData((prev) => {
      const updated = [...prev[type]];
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
    if (totalMinutes === 0) return "--";
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
            <h3 className="text-[0.85rem] font-semibold text-gray-800">
              Trip {tripIndex + 1}
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
          <div className="mb-4">
            <span className="font-medium text-gray-600">
              Onwards ({getTotalDuration(segmentPreview)})
            </span>
          </div>

          <div className="space-y-4">
            {formData.segments.map((segment, index) => (
              <div
                key={segment.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-3"
              >
                {/* Flight Segment */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[0.8rem] font-semibold text-gray-800">
                      Flight Segment {index + 1}
                    </h4>
                    {formData.segments.length > 1 && (
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
                          const updatedSegments = formData.segments.map((s) =>
                            s.id === segment.id
                              ? { ...s, flightnumber: e.target.value }
                              : s
                          );
                          setFormData({
                            ...formData,
                            segments: updatedSegments,
                          });
                        }}
                        className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
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
                            handleSegmentPnr(index, e.target.value, "segments")
                          }
                          className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                        />
                      </div>
                    )}

                    {/* Travel Date */}
                    <div>
                      <label className="block mb-1 font-medium text-gray-600">
                        Travel Date
                      </label>
                      <input
                        type="date"
                        value={segment.traveldate}
                        onChange={(e) => {
                          const updatedSegments = formData.segments.map((s) =>
                            s.id === segment.id
                              ? { ...s, traveldate: e.target.value }
                              : s
                          );
                          setFormData({
                            ...formData,
                            segments: updatedSegments,
                          });
                        }}
                        className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      />
                    </div>

                    {/* Cabin Class */}
                    <div>
                      <label className="block mb-1 font-medium text-gray-600">
                        Cabin Class
                      </label>
                      <div className="relative w-[18rem]">
                        <select
                          value={segment.cabinclass}
                          onChange={(e) => {
                            const updatedSegments = formData.segments.map((s) =>
                              s.id === segment.id
                                ? { ...s, cabinclass: e.target.value }
                                : s
                            );
                            setFormData({
                              ...formData,
                              segments: updatedSegments,
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 appearance-none"
                        >
                          <option value="">Choose Cabin Class</option>
                          <option value="Economy">Economy</option>
                          <option value="Premium Economy">
                            Premium Economy
                          </option>
                          <option value="Business">Business</option>
                          <option value="First Class">First Class</option>
                        </select>
                        <MdKeyboardArrowDown className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="border border-dotted border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[0.8rem] font-semibold text-gray-800">
                      Preview
                    </h4>
                    <button className="text-blue-600 hover:text-blue-700">
                      <MdOutlineEdit size={16} />
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-md p-3 min-h-[180px]">
                    {segmentPreview[segment.id!] ? (
                      <>
                        {/* Airline Header */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {segmentPreview[segment.id!]?.airline ??
                              "Fetching..."}
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
                      <div className="flex items-center justify-center h-full bg-gray-50 rounded-md text-gray-500 min-h-[160px]">
                        <p>Preview data will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Segment */}
            <button
              onClick={addSegment}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#126ACB] text-white rounded-md text-[0.75rem] hover:bg-blue-700 transition"
            >
              <CiCirclePlus size={16} />
              Add Segment
            </button>
          </div>

          {/* Return Section */}
          <div className="mt-5">
            <span className="font-medium text-gray-600">
              Return ({getTotalDuration(returnSegmentPreview)})
            </span>

            <div className="space-y-4 mt-3">
              {formData.returnSegments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-3"
                >
                  {/* Return Segment */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[0.8rem] font-semibold text-gray-800">
                        Flight Segment {index + 1}
                      </h4>
                      {formData.returnSegments.length > 0 && (
                        <button
                          onClick={() => removeReturnSegment(segment.id!)}
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
                            const updated = formData.returnSegments.map((s) =>
                              s.id === segment.id
                                ? { ...s, flightnumber: e.target.value }
                                : s
                            );
                            setFormData({
                              ...formData,
                              returnSegments: updated,
                            });
                          }}
                          className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
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
                                index,
                                e.target.value,
                                "returnSegments"
                              )
                            }
                            className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                          />
                        </div>
                      )}

                      {/* Travel Date */}
                      <div>
                        <label className="block mb-1 font-medium text-gray-600">
                          Travel Date
                        </label>
                        <input
                          type="date"
                          value={segment.traveldate}
                          onChange={(e) => {
                            const updated = formData.returnSegments.map((s) =>
                              s.id === segment.id
                                ? { ...s, traveldate: e.target.value }
                                : s
                            );
                            setFormData({
                              ...formData,
                              returnSegments: updated,
                            });
                          }}
                          className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                        />
                      </div>

                      {/* Cabin Class */}
                      <div>
                        <label className="block mb-1 font-medium text-gray-600">
                          Cabin Class
                        </label>
                        <div className="relative w-[18rem]">
                          <select
                            value={segment.cabinclass}
                            onChange={(e) => {
                              const updated = formData.returnSegments.map((s) =>
                                s.id === segment.id
                                  ? { ...s, cabinclass: e.target.value }
                                  : s
                              );
                              setFormData({
                                ...formData,
                                returnSegments: updated,
                              });
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 appearance-none"
                          >
                            <option value="">Choose Cabin Class</option>
                            <option value="Economy">Economy</option>
                            <option value="Premium Economy">
                              Premium Economy
                            </option>
                            <option value="Business">Business</option>
                            <option value="First Class">First Class</option>
                          </select>
                          <MdKeyboardArrowDown className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Return Preview */}
                  <div className="border border-dotted border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[0.8rem] font-semibold text-gray-800">
                        Preview
                      </h4>
                      <button className="text-blue-600 hover:text-blue-700">
                        <MdOutlineEdit size={16} />
                      </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-md p-3 min-h-[180px]">
                      {returnSegmentPreview[segment.id!] ? (
                        <>
                          {/* Airline Header */}
                          <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                            <span className="font-medium text-gray-800">
                              {returnSegmentPreview[segment.id!]?.airline ??
                                "Fetching..."}
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
                                  {returnSegmentPreview[segment.id!]?.origin}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                  STD
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {
                                    returnSegmentPreview[segment.id!]
                                      ?.departureTime
                                  }
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
                                  {
                                    returnSegmentPreview[segment.id!]
                                      ?.flightNumber
                                  }
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
                                  {returnSegmentPreview[segment.id!]?.duration}
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
                                  {
                                    returnSegmentPreview[segment.id!]
                                      ?.destination
                                  }
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-500 text-[0.6rem] mb-0.5">
                                  STA
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {
                                    returnSegmentPreview[segment.id!]
                                      ?.arrivalTime
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-50 rounded-md text-gray-500 min-h-[160px]">
                          <p>Preview data will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Return Segment */}
              <button
                onClick={addReturnSegment}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#126ACB] text-white rounded-md text-[0.75rem] hover:bg-blue-700 transition"
              >
                <CiCirclePlus size={16} />
                Add Segment
              </button>
            </div>
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
