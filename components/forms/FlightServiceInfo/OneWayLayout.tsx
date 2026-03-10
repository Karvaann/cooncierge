"use client";

import React from "react";
import { MdAirplanemodeActive } from "react-icons/md";
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
  segments: FlightSegmentData[];
  returnSegments: ReturnFlightSegment[];
  samePNRForAllSegments: boolean;
  flightType: "One Way" | "Round Trip" | "Multi-City";
  remarks: string;
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
  cabinBaggagePcs?: number | string;
  cabinBaggageWt?: number | string;
  checkInBaggagePcs?: number | string;
  checkInBaggageWt?: number | string;
}

export default function OneWayLayout({
  formData,
  setFormData,
}: {
  formData: FlightInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<FlightInfoFormData>>;
}) {
  const calculateLayover = (
    arrival: string | undefined,
    nextDeparture: string | undefined,
  ) => {
    if (!arrival || !nextDeparture) return null;
    const a = new Date(arrival);
    const d = new Date(nextDeparture);
    const diffMin = Math.floor((d.getTime() - a.getTime()) / 1000 / 60);
    if (diffMin <= 0) return null;
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    return `${h}h ${m}m`;
  };

  const addSegment = () => {
    const newSegment: FlightSegmentData = {
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

  const handlePreviewChange = (segmentId: string, preview: SegmentPreview) => {
    setFormData((prev) => ({
      ...prev,
      segments: prev.segments.map((s) =>
        s.id === segmentId ? { ...s, preview } : s,
      ),
    }));
  };

  const getTotalDuration = (segments: FlightSegmentData[]) => {
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
    if (totalMinutes === 0) return "--";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="text-[0.75rem] ml-2.5 text-gray-700">
      {/* Onwards label */}
      <div className="mb-3">
        <span className="font-[500] text-[#414141] text-[13px]">
          Onwards ({getTotalDuration(formData.segments)})
        </span>
      </div>

      {/* Flight Segments + Preview */}
      <div className="w-full bg-[#F9F9F9] -ml-2 rounded-[15px] p-4 space-y-4">
        {formData.segments.map((segment, index) => (
          <React.Fragment key={segment.id}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FlightSegmentCard
                segment={segment}
                index={index}
                canRemove={formData.segments.length > 1}
                onRemove={removeSegment}
                onSegmentChange={handleSegmentChange}
                preview={segment.preview}
                onPreviewChange={handlePreviewChange}
                traveldate={formData.traveldate}
                bookingdate={formData.bookingdate}
                onTraveldateChange={(date) =>
                  setFormData((prev) => ({ ...prev, traveldate: date }))
                }
              />
            </div>

            {/* Layover UI Between Segment N and N+1 */}
            {index < formData.segments.length - 1 &&
              (() => {
                const current = segment.preview;
                const nextSegment = formData.segments[index + 1];
                const next = nextSegment?.preview;

                const layover = calculateLayover(
                  current?.arrivalTimeRaw,
                  next?.departureTimeRaw,
                );

                if (!layover) return null;

                return (
                  <div className="flex items-center justify-center gap-2 py-2 text-gray-700 font-[500]">
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
          className="flex items-center gap-1.5 px-3 py-1.5 mt-3 bg-[#7135AD] text-white text-[0.75rem] font-[500] rounded-[10px] hover:cursor-pointer transition"
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
      </div>
    </div>
  );
}
