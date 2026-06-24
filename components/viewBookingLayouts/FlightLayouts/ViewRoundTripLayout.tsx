"use client";

import React, { useState, useEffect } from "react";

import { CiCirclePlus } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineEdit } from "react-icons/md";
import { FiMinusCircle } from "react-icons/fi";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import { LuSave } from "react-icons/lu";
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

  vendor?: VendorDataType | null;
  allTravellersTakingThisFlight?: boolean;
  cabinPcs?: number;
  cabinWeightKg?: string;
  checkInPcs?: number;
  checkInWeightKg?: string;
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

  vendor?: VendorDataType | null;
  allTravellersTakingThisFlight?: boolean;
  cabinPcs?: number;
  cabinWeightKg?: string;
  checkInPcs?: number;
  checkInWeightKg?: string;
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

export default function ViewRoundTripLayout({
  formData,
  setFormData,
}: {
  formData: FlightInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<FlightInfoFormData>>;
}) {
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

  // Get flight endpoint - using flights API
  // Note: flight_date parameter requires paid plan on AviationStack
  // Free tier only allows real-time flight lookup by flight number
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
      // Clear preview data if flight number is empty or less than 3 characters
      const hasManualPreview = !!segment.preview;
      if (fn.length < 3 && !hasManualPreview && !segmentPreview[segmentId]) {
        setSegmentPreview((prev) => {
          const updated = { ...prev };
          delete updated[segmentId];
          return updated;
        });
        return;
      }

      // Skip scheduling if same flight number was already fetched
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
      const hasManualPreview = !!segment.preview;
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

  const previewData: SegmentPreview = {
    airline: "IndiGo Airlines",
    origin: "Delhi (DEL)",
    destination: "Mumbai (BOM)",
    departureTime: "08:10 AM",
    arrivalTime: "10:05 AM",
    flightNumber: "A320",
    duration: "1h 55m",
  };

  const addSegment = () => {
    const newSegment: FlightSegment = {
      id: Date.now().toString(),
      flightnumber: "",
      traveldate: "",
      cabinclass: "",

      vendor: null,
      allTravellersTakingThisFlight: true,
      cabinPcs: 1,
      cabinWeightKg: "",
      checkInPcs: 1,
      checkInWeightKg: "",
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
    const newSegment: ReturnFlightSegment = {
      id: `return-${Date.now()}`,
      flightnumber: "",
      traveldate: "",
      cabinclass: "",

      vendor: null,
      allTravellersTakingThisFlight: true,
      cabinPcs: 1,
      cabinWeightKg: "",
      checkInPcs: 1,
      checkInWeightKg: "",
    };
    setFormData({
      ...formData,
      returnSegments: [...formData.returnSegments, newSegment],
    });
  };

  const removeReturnSegment = (id: string) => {
    if (formData.returnSegments.length > 1) {
      setFormData({
        ...formData,
        returnSegments: formData.returnSegments.filter(
          (segment) => segment.id !== id,
        ),
      });
    }
  };

  const handleSegmentPnr = (
    idx: number,
    value: string,
    type: "segments" | "returnSegments",
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
      {/* Onwards Section */}
      <div>
        <div className="mb-3">
          <span className="font-medium text-gray-600">
            Onwards ({getTotalDuration(segmentPreview)})
          </span>
        </div>

        <div className="border border-gray-200 p-4 rounded-lg">
          <div className="space-y-4">
            {/* Add Segment */}
            {formData.segments.map((segment, index) => {
              const segId = segment.id!;
              const preview = segment.preview ?? segmentPreview[segId];

              return (
                <FlightSegmentCard
                  key={segId}
                  segment={segment}
                  index={index}
                  isExpanded={true}
                  canRemove={formData.segments.length > 1}
                  onRemove={() => removeSegment(segId)}
                  onToggleExpand={() => {}}
                  totalCostForAllFlights={totalCostForAllFlights}
                  onTotalCostForAllFlightsToggle={setTotalCostForAllFlights}
                  showAdvancedPricing={showAdvancedPricing}
                  onShowAdvancedPricingToggle={setShowAdvancedPricing}
                  /* PNR */
                  PNR={segment.pnr ?? ""}
                  onPNRChange={(pnr) =>
                    handleSegmentPnr(index, pnr, "segments")
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
                  onVendorChange={(vendor) => {
                    setFormData((prev) => {
                      if (sameVendorForAllFlights) {
                        return {
                          ...prev,
                          segments: prev.segments.map((s) => ({
                            ...s,
                            vendor,
                          })),
                          returnSegments: prev.returnSegments.map((s) => ({
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
                  onSameVendorToggle={(checked) => {
                    setSameVendorForAllFlights(checked);
                    if (checked && (segment.vendor ?? null)) {
                      const vendor = segment.vendor ?? null;
                      setFormData((prev) => ({
                        ...prev,
                        segments: prev.segments.map((s) => ({ ...s, vendor })),
                        returnSegments: prev.returnSegments.map((s) => ({
                          ...s,
                          vendor,
                        })),
                      }));
                    }
                  }}
                  /* Amount (noop for now if not used) */
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

            <button
              onClick={addSegment}
              className="flex items-center gap-1.5 px-3 py-1.5 mt-3 bg-[#126ACB] text-white text-[0.75rem] rounded-md hover:bg-blue-700 transition"
            >
              <CiCirclePlus size={16} />
              Add Segment
            </button>
          </div>

          {/* Return Section */}
          <div>
            <div className="mb-3 mt-3">
              <span className="font-medium text-gray-600">
                Return ({getTotalDuration(returnSegmentPreview)})
              </span>
            </div>

            <div className="space-y-4"></div>
            {/* Add Return Segment */}
            {formData.returnSegments.map((segment, index) => {
              const segId = segment.id!;
              const preview = segment.preview ?? returnSegmentPreview[segId];

              return (
                <FlightSegmentCard
                  key={segId}
                  segment={segment}
                  index={index}
                  isExpanded={true}
                  canRemove={formData.returnSegments.length > 1}
                  onRemove={() => removeReturnSegment(segId)}
                  onToggleExpand={() => {}}
                  totalCostForAllFlights={totalCostForAllFlights}
                  onTotalCostForAllFlightsToggle={setTotalCostForAllFlights}
                  showAdvancedPricing={showAdvancedPricing}
                  onShowAdvancedPricingToggle={setShowAdvancedPricing}
                  /* PNR */
                  PNR={segment.pnr ?? ""}
                  onPNRChange={(pnr) =>
                    handleSegmentPnr(index, pnr, "returnSegments")
                  }
                  bookingDate={formData.bookingdate}
                  onBookingDateChange={() => {}}
                  travelDate={segment.traveldate}
                  onTravelDateChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      returnSegments: prev.returnSegments.map((s) =>
                        s.id === segId ? { ...s, traveldate: date } : s,
                      ),
                    }))
                  }
                  onSegmentChange={(patch) =>
                    setFormData((prev) => ({
                      ...prev,
                      returnSegments: prev.returnSegments.map((s) =>
                        s.id === segId ? { ...s, ...patch } : s,
                      ),
                    }))
                  }
                  onVendorChange={(vendor) => {
                    setFormData((prev) => {
                      if (sameVendorForAllFlights) {
                        return {
                          ...prev,
                          segments: prev.segments.map((s) => ({
                            ...s,
                            vendor,
                          })),
                          returnSegments: prev.returnSegments.map((s) => ({
                            ...s,
                            vendor,
                          })),
                        };
                      }

                      return {
                        ...prev,
                        returnSegments: prev.returnSegments.map((s) =>
                          s.id === segId ? { ...s, vendor } : s,
                        ),
                      };
                    });
                  }}
                  preview={preview}
                  onPreviewChange={(pv) => {
                    setReturnSegmentPreview((prev) => ({
                      ...prev,
                      [segId]: pv,
                    }));
                    setFormData((prev) => ({
                      ...prev,
                      returnSegments: prev.returnSegments.map((s) =>
                        s.id === segId ? { ...s, preview: pv } : s,
                      ),
                    }));
                    lastFetchedRef.current[segId] =
                      pv.flightNumber ?? String(segment.flightnumber ?? "");
                  }}
                  onClearPreview={() => {
                    setReturnSegmentPreview((prev) => {
                      const copy = { ...prev };
                      delete copy[segId];
                      return copy;
                    });
                  }}
                  sameVendorForAllFlights={sameVendorForAllFlights}
                  onSameVendorToggle={(checked) => {
                    setSameVendorForAllFlights(checked);
                    if (checked && (segment.vendor ?? null)) {
                      const vendor = segment.vendor ?? null;
                      setFormData((prev) => ({
                        ...prev,
                        segments: prev.segments.map((s) => ({ ...s, vendor })),
                        returnSegments: prev.returnSegments.map((s) => ({
                          ...s,
                          vendor,
                        })),
                      }));
                    }
                  }}
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

            <button
              onClick={addReturnSegment}
              className="flex items-center gap-1.5 px-3 py-1.5 mt-3 bg-[#126ACB] text-white text-[0.75rem] rounded-md hover:bg-blue-700 transition"
            >
              <CiCirclePlus size={16} />
              Add Segment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
