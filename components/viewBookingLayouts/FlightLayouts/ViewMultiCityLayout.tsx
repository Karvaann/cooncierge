"use client";

import React, { useState, useEffect } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { FiMinusCircle } from "react-icons/fi";
import FlightSegmentCard from "./FlightSegmentCard";
import type { VendorDataType } from "@/components/dropdowns/VendorDropDown";

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
  const lastFetchedRef = React.useRef<Record<string, string>>({});
  const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY ?? "";

  const [sameVendorForAllFlights, setSameVendorForAllFlights] =
    useState<boolean>(false);

  const [totalCostForAllFlights, setTotalCostForAllFlights] =
    useState<boolean>(false);

  const [showAdvancedPricing, setShowAdvancedPricing] =
    useState<boolean>(false);

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
      {trips.map((tripId, tripIndex) => {
        const segments = getSegmentsForTrip(tripIndex, tripId);
        const previews = getPreviewsForTrip(tripIndex, tripId);

        return (
          <div key={tripId} className="border border-gray-200 rounded-lg p-4">
            {/* Trip Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[0.85rem] font-semibold text-gray-800">
                Trip {tripIndex + 1} ({getTotalDuration(previews)})
              </h3>

              {trips.length > 1 && (
                <button
                  onClick={() => removeTrip(tripId)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <FiMinusCircle size={18} />
                </button>
              )}
            </div>

            {/* Segments */}
            <div className="space-y-4">
              {segments.map((segment, index) => {
                const segId = segment.id!;
                const preview = segment.preview ?? segmentPreview[segId];

                return (
                  <FlightSegmentCard
                    key={segId}
                    segment={segment}
                    index={index}
                    isExpanded={true}
                    canRemove={segments.length > 1}
                    onRemove={() => removeSegment(segId)}
                    onToggleExpand={() => {}}
                    /* PNR */
                    PNR={segment.pnr ?? ""}
                    onPNRChange={(pnr) =>
                      handleSegmentPnr(segId, pnr, "segments")
                    }
                    /* Dates */
                    bookingDate={formData.bookingdate}
                    onBookingDateChange={(date) =>
                      setFormData((prev) => ({ ...prev, bookingdate: date }))
                    }
                    travelDate={segment.traveldate}
                    onTravelDateChange={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        segments: prev.segments.map((s) =>
                          s.id === segId ? { ...s, traveldate: date } : s,
                        ),
                      }))
                    }
                    /* Segment updates */
                    onSegmentChange={(patch) =>
                      setFormData((prev) => ({
                        ...prev,
                        segments: prev.segments.map((s) =>
                          s.id === segId ? { ...s, ...patch } : s,
                        ),
                      }))
                    }
                    /* Vendor */
                    onVendorChange={(vendor) => {
                      setFormData((prev) => {
                        if (sameVendorForAllFlights) {
                          return {
                            ...prev,
                            segments: prev.segments.map((s) => ({
                              ...s,
                              vendor,
                            })),
                          };
                        }
                        return {
                          ...prev,
                          segments: prev.segments.map((s) =>
                            s.id === segId ? { ...s, vendor } : s,
                          ),
                        };
                      });
                    }}
                    /* Preview */
                    preview={preview}
                    onPreviewChange={(pv) => {
                      setSegmentPreview((prev) => ({ ...prev, [segId]: pv }));
                      setFormData((prev) => ({
                        ...prev,
                        segments: prev.segments.map((s) =>
                          s.id === segId ? { ...s, preview: pv } : s,
                        ),
                      }));
                      lastFetchedRef.current[segId] =
                        pv.flightNumber ?? String(segment.flightnumber ?? "");
                    }}
                    onClearPreview={() => {
                      setSegmentPreview((prev) => {
                        const copy = { ...prev };
                        delete copy[segId];
                        return copy;
                      });
                    }}
                    sameVendorForAllFlights={sameVendorForAllFlights}
                    onSameVendorToggle={setSameVendorForAllFlights}
                    totalCostForAllFlights={totalCostForAllFlights}
                    onTotalCostForAllFlightsToggle={setTotalCostForAllFlights}
                    showAdvancedPricing={showAdvancedPricing}
                    onShowAdvancedPricingToggle={setShowAdvancedPricing}
                    /* Amount */
                    costPrice={formData.costprice}
                    costCurrency="INR"
                    onCostPriceChange={() => {}}
                    onCostCurrencyChange={() => {}}
                    onCostRoeChange={() => {}}
                    onCostNotesChange={() => {}}
                    showCostNotes={false}
                    onToggleCostNotes={() => {}}
                    businessCurrency="INR"
                  />
                );
              })}

              {/* Add Segment */}
              <button
                onClick={() => addSegment(tripId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#126ACB] text-white rounded-md text-[0.75rem]"
              >
                <CiCirclePlus size={16} />
                Add Segment
              </button>
            </div>
          </div>
        );
      })}

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
