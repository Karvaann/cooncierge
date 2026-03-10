"use client";

import React from "react";
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
  preview?: SegmentPreview;
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
  preview?: SegmentPreview;
  cabinBaggagePcs?: number | string;
  cabinBaggageWt?: number | string;
  checkInBaggagePcs?: number | string;
  checkInBaggageWt?: number | string;
}

export default function RoundTripLayout({
  formData,
  setFormData,
}: {
  formData: FlightInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<FlightInfoFormData>>;
}) {
  // Onwards segment handlers
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
        segments: formData.segments.filter((s) => s.id !== id),
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

  // Return segment handlers
  const addReturnSegment = () => {
    const newSegment: ReturnFlightSegment = {
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
    if (formData.returnSegments.length > 1) {
      setFormData({
        ...formData,
        returnSegments: formData.returnSegments.filter((s) => s.id !== id),
      });
    }
  };

  const handleReturnSegmentChange = (
    segmentId: string,
    patch: Partial<FlightSegmentData>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      returnSegments: prev.returnSegments.map((s) =>
        s.id === segmentId ? { ...s, ...patch } : s,
      ),
    }));
  };

  const handleReturnPreviewChange = (
    segmentId: string,
    preview: SegmentPreview,
  ) => {
    setFormData((prev) => ({
      ...prev,
      returnSegments: prev.returnSegments.map((s) =>
        s.id === segmentId ? { ...s, preview } : s,
      ),
    }));
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

  // Calculate total duration from segment previews
  const getTotalDuration = (
    segments: (FlightSegment | ReturnFlightSegment)[],
  ) => {
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

  const addSegmentButton = (onClick: () => void) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 mt-3 bg-[#7135AD] text-white text-[0.75rem] rounded-[10px] hover:cursor-pointer transition"
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
      {/* Onwards Section */}
      <div>
        <div className="mb-3">
          <span className="font-[500] text-[#414141] text-[13px]">
            Onwards ({getTotalDuration(formData.segments)})
          </span>
        </div>

        <div className="bg-[#F9F9F9] p-4 rounded-[15px] w-full">
          <div className="space-y-4">
            {formData.segments.map((segment, index) => (
              <div
                key={segment.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                <FlightSegmentCard
                  segment={segment}
                  index={index}
                  canRemove={formData.segments.length > 1}
                  onRemove={removeSegment}
                  onSegmentChange={handleSegmentChange}
                  preview={segment.preview}
                  onPreviewChange={handlePreviewChange}
                  traveldate={segment.traveldate}
                  bookingdate={formData.bookingdate}
                  onTraveldateChange={(date) =>
                    handleSegmentChange(segment.id!, { traveldate: date })
                  }
                  showPnr={!formData.pnrEnabled}
                  onPnrChange={(val) =>
                    handleSegmentPnr(index, val, "segments")
                  }
                />
              </div>
            ))}

            {addSegmentButton(addSegment)}
          </div>

          {/* Return Section */}
          <div>
            <div className="mb-3 mt-3">
              <span className="font-[500] text-gray-600">
                Return ({getTotalDuration(formData.returnSegments)})
              </span>
            </div>

            <div className="space-y-4">
              {formData.returnSegments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                >
                  <FlightSegmentCard
                    segment={segment}
                    index={index}
                    canRemove={formData.returnSegments.length > 1}
                    onRemove={removeReturnSegment}
                    onSegmentChange={handleReturnSegmentChange}
                    preview={segment.preview}
                    onPreviewChange={handleReturnPreviewChange}
                    traveldate={segment.traveldate}
                    bookingdate={formData.bookingdate}
                    onTraveldateChange={(date) =>
                      handleReturnSegmentChange(segment.id!, {
                        traveldate: date,
                      })
                    }
                    showPnr={!formData.pnrEnabled}
                    onPnrChange={(val) =>
                      handleSegmentPnr(index, val, "returnSegments")
                    }
                  />
                </div>
              ))}
            </div>

            {addSegmentButton(addReturnSegment)}
          </div>
        </div>
      </div>
    </div>
  );
}
