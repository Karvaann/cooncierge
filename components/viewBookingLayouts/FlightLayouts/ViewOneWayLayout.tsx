"use client";

import React, { useEffect, useState } from "react";

import { CiCirclePlus } from "react-icons/ci";
import { MdAirplanemodeActive } from "react-icons/md";
import { type VendorDataType } from "@/components/dropdowns/VendorDropDown";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency } from "@/utils/currencyUtil";
import FlightSegmentCard, {
  type SegmentPreview,
  type FlightSegment,
} from "./FlightSegmentCard";

interface FlightInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  costprice: number | string;
  costCurrency?: "INR" | "USD";
  costRoe?: string;
  costInr?: string;
  costNotes?: string;
  sellingprice: number | string;
  PNR: number | string;
  pnrEnabled: boolean;
  segments: FlightSegment[]; // Array of flight segments
  returnSegments: ReturnFlightSegment[];
  samePNRForAllSegments: boolean;
  sameVendorForAllFlights?: boolean;
  flightType: "One Way" | "Round Trip" | "Multi-City";

  remarks: string;
}

// FlightSegment type is imported from FlightSegmentCard

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

// SegmentPreview type is imported from FlightSegmentCard

export default function ViewOneWayLayout({
  formData,
  setFormData,
}: {
  formData: FlightInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<FlightInfoFormData>>;
}) {
  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user);

  const [segmentPreview, setSegmentPreview] = useState<
    Record<string, SegmentPreview>
  >({});

  const [showCostNotesFlag, setShowCostNotesFlag] = useState<boolean>(false);

  const [totalCostForAllFlights, setTotalCostForAllFlights] =
    useState<boolean>(false);
  const [showAdvancedPricing, setShowAdvancedPricing] =
    useState<boolean>(false);

  // Collapsible segment UI
  const [expandedSegments, setExpandedSegments] = useState<
    Record<string, boolean>
  >({});
  const API_KEY = process.env.NEXT_PUBLIC_AVIATIONSTACK_KEY ?? "";

  // Allow only digits and a single decimal point for price fields
  const sanitizeNumeric = (val: string) => {
    const v = String(val || "").replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length <= 1) return parts[0];
    return parts[0] + "." + parts.slice(1).join("");
  };

  const computeInr = (
    amountStr?: string | number,
    roeStr?: string | number,
  ) => {
    const a = Number(String(amountStr ?? "").replace(/,/g, ""));
    const r = Number(String(roeStr ?? "").replace(/,/g, ""));
    if (!isFinite(a) || !isFinite(r) || a === 0 || r === 0) return "";
    const product = a * r;
    const hasFraction = Math.abs(product - Math.round(product)) > 1e-9;
    return product.toLocaleString("en-US", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

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
    const newId = Date.now().toString();
    const newSegment: FlightSegment = {
      id: newId,
      flightnumber: "",
      traveldate: "",
      cabinclass: "",
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
    setExpandedSegments((prev) => ({ ...prev, [newId]: true }));
  };

  const removeSegment = (id: string) => {
    if (formData.segments.length > 1) {
      setFormData({
        ...formData,
        segments: formData.segments.filter((segment) => segment.id !== id),
      });
      setExpandedSegments((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const setSegmentVendor = (
    segmentId: string,
    vendor: VendorDataType | null,
  ) => {
    setFormData((prev) => {
      const applyToAll = Boolean(prev.sameVendorForAllFlights);
      return {
        ...prev,
        segments: prev.segments.map((s) => {
          if (applyToAll) return { ...s, vendor };
          return s.id === segmentId ? { ...s, vendor } : s;
        }),
      };
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
    <div className="text-[0.75rem] ml-2.5 text-gray-700">
      {/* Onwards label */}
      <div className="mb-3">
        <span className="font-medium text-gray-600">
          Onwards ({getTotalDuration(segmentPreview)})
        </span>
      </div>

      {/* Flight Segments + Preview */}
      <div className="border border-gray-200 w-[1000px] -ml-2 rounded-lg p-3 space-y-4">
        {formData.segments.map((segment, index) => {
          const segId = segment.id!;
          const isExpanded = expandedSegments[segId] ?? index === 0;
          const preview = segment.preview ?? segmentPreview[segId];

          return (
            <React.Fragment key={segId}>
              <FlightSegmentCard
                segment={segment}
                index={index}
                isExpanded={isExpanded}
                canRemove={formData.segments.length > 1}
                onRemove={() => removeSegment(segId)}
                onToggleExpand={() =>
                  setExpandedSegments((prev) => ({
                    ...prev,
                    [segId]: !isExpanded,
                  }))
                }
                totalCostForAllFlights={totalCostForAllFlights}
                onTotalCostForAllFlightsToggle={setTotalCostForAllFlights}
                showAdvancedPricing={showAdvancedPricing}
                onShowAdvancedPricingToggle={setShowAdvancedPricing}
                /* ---------- FORM DATA ---------- */
                PNR={formData.PNR}
                onPNRChange={(pnr) =>
                  setFormData((prev) => ({ ...prev, PNR: pnr }))
                }
                bookingDate={formData.bookingdate}
                onBookingDateChange={(date) =>
                  setFormData((prev) => ({ ...prev, bookingdate: date }))
                }
                travelDate={formData.traveldate}
                onTravelDateChange={(date) =>
                  setFormData((prev) => ({ ...prev, traveldate: date }))
                }
                /* ---------- SEGMENT UPDATES ---------- */
                onSegmentChange={(patch) =>
                  setFormData((prev) => ({
                    ...prev,
                    segments: prev.segments.map((s) =>
                      s.id === segId ? { ...s, ...patch } : s,
                    ),
                  }))
                }
                onVendorChange={(vendor) => setSegmentVendor(segId, vendor)}
                /* ---------- COST ---------- */
                costPrice={formData.costprice}
                costCurrency={formData.costCurrency ?? "INR"}
                costRoe={formData.costRoe}
                costInr={formData.costInr}
                costNotes={formData.costNotes}
                onCostPriceChange={(price) =>
                  setFormData((prev) => ({ ...prev, costprice: price }))
                }
                onCostCurrencyChange={(currency) =>
                  setFormData((prev) => ({ ...prev, costCurrency: currency }))
                }
                onCostRoeChange={(roe) =>
                  setFormData((prev) => ({ ...prev, costRoe: roe }))
                }
                onCostNotesChange={(notes) =>
                  setFormData((prev) => ({ ...prev, costNotes: notes }))
                }
                /* ---------- PREVIEW ---------- */
                preview={preview}
                onPreviewChange={(pv) => {
                  setSegmentPreview((prev) => ({
                    ...prev,
                    [segId]: pv,
                  }));
                  setFormData((prev) => ({
                    ...prev,
                    segments: prev.segments.map((s) =>
                      s.id === segId ? { ...s, preview: pv } : s,
                    ),
                  }));
                }}
                onClearPreview={() => {
                  setSegmentPreview((prev) => {
                    const copy = { ...prev };
                    delete copy[segId];
                    return copy;
                  });
                }}
                /* ---------- VENDOR FLAGS ---------- */
                sameVendorForAllFlights={formData.sameVendorForAllFlights}
                onSameVendorToggle={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    sameVendorForAllFlights: checked,
                  }))
                }
                /* ---------- MISC ---------- */
                showCostNotes={showCostNotesFlag}
                onToggleCostNotes={() => setShowCostNotesFlag((p) => !p)}
                businessCurrency={businessCurrency ?? "INR"}
              />

              {/* LAYOVER UI stays in main */}
              {index < formData.segments.length - 1 &&
                (() => {
                  const nextSeg = formData.segments[index + 1];
                  if (!nextSeg) return null;
                  const nextPreview =
                    nextSeg.preview ?? segmentPreview[nextSeg.id!];

                  const layover = calculateLayover(
                    preview?.arrivalTimeRaw,
                    nextPreview?.departureTimeRaw,
                  );

                  if (!layover) return null;

                  return (
                    <div className="flex justify-center text-[0.8rem] text-gray-700 font-medium py-2">
                      ✈ Layover:{" "}
                      <span className="ml-1 font-semibold">{layover}</span>
                    </div>
                  );
                })()}
            </React.Fragment>
          );
        })}

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
