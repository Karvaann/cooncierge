"use client";

import React, { useState } from "react";

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

interface PreviewData {
  airline?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  flightNumber?: string;
  duration?: string;
}

export default function RoundTripLayout({
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
    if (formData.returnSegments.length > 1) {
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
  return (
    <div className="space-y-6 text-[0.75rem] text-gray-700">
      {/* Onwards Section */}
      <div>
        <div className="mb-3">
          <span className="font-medium text-gray-600">Onwards (3h 40m)</span>
        </div>

        <div className="border border-gray-200 p-4 rounded-lg">
          <div className="space-y-4">
            {formData.segments.map((segment, index) => (
              <div
                key={segment.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-3"
              >
                {/* Flight Segment */}
                <div className="border border-gray-200 rounded-lg px-3 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[0.85rem] font-semibold text-gray-800">
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
                        className="w-[16rem] px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* PNR (toggle off) */}
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
                          className="w-[16rem] px-2 py-1.5 border border-gray-300 rounded-md"
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
                        className="w-[16rem] px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Cabin Class */}
                    <div>
                      <label className="block mb-1 font-medium text-gray-600">
                        Cabin Class
                      </label>
                      <div className="relative w-[16rem]">
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
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
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
                    <h4 className="text-[0.85rem] font-semibold text-gray-800">
                      Preview
                    </h4>
                    <button className="text-blue-600 hover:text-blue-700">
                      <MdOutlineEdit size={16} />
                    </button>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-md p-3 min-h-[180px]">
                    <div className="flex items-center justify-center text-gray-500 h-full">
                      <p>Preview data will appear here</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Segment */}
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
              <span className="font-medium text-gray-600">Return (3h 40m)</span>
            </div>

            <div className="space-y-4">
              {formData.returnSegments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-3"
                >
                  {/* Return Segment */}
                  <div className="border border-gray-200 rounded-lg px-3 py-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[0.85rem] font-semibold text-gray-800">
                        Flight Segment {index + 1}
                      </h4>
                      {formData.returnSegments.length > 1 && (
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
                          className="w-[16rem] px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* PNR */}
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
                            className="w-[16rem] px-2 py-1.5 border border-gray-300 rounded-md"
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
                          className="w-[16rem] px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Cabin Class */}
                      <div>
                        <label className="block mb-1 font-medium text-gray-600">
                          Cabin Class
                        </label>
                        <div className="relative w-[16rem]">
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
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
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
                      <h4 className="text-[0.85rem] font-semibold text-gray-800">
                        Preview
                      </h4>
                      <button className="text-blue-600 hover:text-blue-700">
                        <MdOutlineEdit size={16} />
                      </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-md p-3 min-h-[180px]">
                      <div className="flex items-center justify-center text-gray-500 h-full">
                        <p>Return flight preview will appear here</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Add Return Segment */}
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
