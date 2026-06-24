"use client";

import React, { useState } from "react";
import { FiMinusCircle } from "react-icons/fi";
import FlightSegmentCard, {
  type SegmentPreview,
  type FlightSegmentData,
} from "./FlightSegment";

interface FlightInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  costprice: number | string;
  sellingprice: number | string;
  PNR: number | string;
  pnrEnabled: boolean;
  segments: FlightSegment[];
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
  preview?: SegmentPreview | undefined;
  tripId?: number;
  cabinBaggagePcs?: number | string;
  cabinBaggageWt?: number | string;
  checkInBaggagePcs?: number | string;
  checkInBaggageWt?: number | string;
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
  preview?: SegmentPreview | undefined;
}

export default function MultiCityLayout({
  formData,
  setFormData,
  sharedPnrEnabled,
  onMainTravelDateChange,
  isReadOnly,
}: {
  formData: FlightInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<FlightInfoFormData>>;
  sharedPnrEnabled: boolean;
  onMainTravelDateChange: (date: string) => void;
  isReadOnly?: boolean;
}) {
  const [trips, setTrips] = useState<number[]>([1, 2]);

  React.useEffect(() => {
    const nextTrips = Array.from(
      new Set(
        formData.segments
          .map((segment) => Number(segment.tripId))
          .filter((tripId) => Number.isFinite(tripId) && tripId > 0),
      ),
    ).sort((a, b) => a - b);

    if (nextTrips.length > 0) {
      setTrips(nextTrips);
    }
  }, [formData.segments]);

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
      traveldate: formData.traveldate,
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
    if (formData.segments[tripIndex]) return [formData.segments[tripIndex]];
    return [] as FlightSegment[];
  };

  const removeSegment = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.filter((segment) => segment.id !== id),
    }));
  };

  const handleSegmentChange = (
    segmentId: string,
    patch: Partial<FlightSegmentData>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.map((s) =>
        s.id === segmentId ? { ...s, ...patch } : s,
      ),
    }));
  };

  const handlePreviewChange = (segmentId: string, preview?: SegmentPreview) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.map((s) =>
        s.id === segmentId ? { ...s, preview } : s,
      ),
    }));
  };

  const handleSegmentPnr = (segmentId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.map((s) =>
        s.id === segmentId ? { ...s, pnr: value } : s,
      ),
    }));
  };

  const getTotalDuration = (segments: FlightSegment[]) => {
    let totalMinutes = 0;
    segments.forEach((s) => {
      const duration = s.preview?.duration;
      if (duration && duration !== "--") {
        const match = duration.match(/(\d+)h\s*(\d+)m/);
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

  const addSegmentButton = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7135AD] font-[500] text-white rounded-[10px] text-[0.75rem] hover:cursor-pointer transition"
    >
      <div className="border rounded-full border-[#fff] px-0.5 py-0.5 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M6.59672 2.74805V10.4415M2.75 6.59477H10.4434"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      Add Segment
    </button>
  );

  return (
    <div className="space-y-6 text-[0.75rem] text-gray-700">
      {trips.map((tripId, tripIndex) => {
        const segs = getSegmentsForTrip(tripIndex, tripId);
        return (
          <div key={`flight_trip_${tripIndex}`}>
            <div
              key={tripId}
              className="bg-white border border-gray-200 rounded-[15px] p-3 w-full"
            >
              {/* Trip Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-[500] text-[#414141]">
                  Trip {tripIndex + 1} ({getTotalDuration(segs)})
                </h3>
                {trips.length > 1 && (
                  <button
                    onClick={() => removeTrip(tripId)}
                    className="text-gray-400 hover:cursor-pointer"
                  >
                    <FiMinusCircle size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-4 bg-[#F9F9F9] rounded-[15px] p-3 w-full">
                {segs.map((segment, segIdx) => (
                  <div
                    key={segment.id}
                    className="grid grid-cols-1 lg:grid-cols-1 gap-4"
                  >
                    <FlightSegmentCard
                      segment={segment}
                      index={segIdx}
                      canRemove={segs.length > 1}
                      onRemove={removeSegment}
                      onSegmentChange={handleSegmentChange}
                      preview={segment.preview}
                      onPreviewChange={handlePreviewChange}
                      traveldate={segment.traveldate}
                      bookingdate={formData.bookingdate}
                      onTraveldateChange={(date) => {
                        handleSegmentChange(segment.id!, { traveldate: date });
                        onMainTravelDateChange(date);
                      }}
                      showPnr={!sharedPnrEnabled}
                      onPnrChange={(val) => handleSegmentPnr(segment.id!, val)}
                      isReadOnly={isReadOnly || false}
                    />
                  </div>
                ))}

                {addSegmentButton(() => addSegment(tripId))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add Trip Button */}
      <button
        type="button"
        onClick={addTrip}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7135AD] text-white text-[0.75rem] font-[500] rounded-[10px] hover:cursor-pointer transition"
      >
        <div className="border rounded-full border-[#fff] px-0.5 py-0.5 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M6.59672 2.74805V10.4415M2.75 6.59477H10.4434"
              stroke="white"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        Add Trip
      </button>
    </div>
  );
}
