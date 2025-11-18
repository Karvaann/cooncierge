"use client";

import React, { useState } from "react";

import { CiCirclePlus } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdAirplanemodeActive } from "react-icons/md";
import { FiMinusCircle } from "react-icons/fi";
import { MdOutlineEdit } from "react-icons/md";

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

interface PreviewData {
  airline?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
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
  const previewData: PreviewData = {
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
  return (
    <div className="text-[0.75rem] ml-2.5 text-gray-700">
      {/* Onwards label */}
      <div className="mb-3">
        <span className="font-medium text-gray-600">Onwards (1h 55m)</span>
      </div>

      {/* Flight Segments + Preview */}
      <div className="border border-gray-200 w-[46vw] -ml-2 rounded-lg p-3 space-y-4">
        {formData.segments.map((segment, index) => (
          <div
            key={segment.id}
            className="grid grid-cols-1 lg:grid-cols-2 gap-1"
          >
            {/* Flight Segment */}
            <div className="border border-gray-200 rounded-lg w-[22.5rem] p-3">
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
                    className="w-[14rem] px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

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
                      setFormData({ ...formData, segments: updatedSegments });
                    }}
                    className="w-[14rem] px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Cabin Class */}
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Cabin Class
                  </label>
                  <div className="relative w-[14rem]">
                    <select
                      value={segment.cabinclass}
                      onChange={(e) => {
                        const updatedSegments = formData.segments.map((s) =>
                          s.id === segment.id
                            ? { ...s, cabinclass: e.target.value }
                            : s
                        );
                        setFormData({ ...formData, segments: updatedSegments });
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Choose Cabin Class</option>
                      <option value="Economy">Economy</option>
                      <option value="Premium Economy">Premium Economy</option>
                      <option value="Business">Business</option>
                      <option value="First Class">First Class</option>
                    </select>
                    <MdKeyboardArrowDown className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="border border-dotted border-gray-200 w-[23.5rem] rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[0.85rem] font-semibold text-gray-800">
                  Preview
                </h4>
                <button className="text-blue-600 hover:text-blue-700">
                  <MdOutlineEdit size={16} />
                </button>
              </div>

              <div className="bg-white h-[15.3rem] border border-gray-200 rounded-md p-3">
                {index === 0 ? (
                  <>
                    {/* Airline Header */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-sm"></div>
                      <span className="font-medium text-gray-800">
                        {previewData.airline}
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
                            {previewData.origin}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500 text-[0.6rem] mb-0.5">
                            STD
                          </div>
                          <div className="font-semibold text-gray-900">
                            {previewData.departureTime}
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
                            {previewData.flightNumber}
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
                            {previewData.duration}
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
                            {previewData.destination}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500 text-[0.6rem] mb-0.5">
                            STA
                          </div>
                          <div className="font-semibold text-gray-900">
                            {previewData.arrivalTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
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
