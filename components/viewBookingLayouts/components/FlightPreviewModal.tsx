"use client";

import React from "react";
import Modal from "@/components/Modal";
import { FiEdit2 } from "react-icons/fi";
import { LuSave } from "react-icons/lu";

export interface SegmentPreview {
  airline?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  departureTimeRaw?: string;
  arrivalTimeRaw?: string;
  arrivalTime?: string;
  flightNumber?: string;
  duration?: string;
}

interface FlightPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  preview?: SegmentPreview;
  travelDate?: string;
  defaultFlightNumber?: string | number;
  onSave?: (preview: SegmentPreview) => void;
}

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
  if (m2) {
    return `${String(parseInt(m2[1]!, 10)).padStart(2, "0")}:${m2[2] ?? "00"}`;
  }

  return "";
};

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

const truncateIfLong = (val?: string, limit = 20) => {
  if (!val) return "";
  return val.length > limit ? `${val.slice(0, limit)}...` : val;
};

const computeDurationFromTimes = (date: string, dep: string, arr: string) => {
  try {
    const depISO = `${date}T${dep}`;
    const arrISO = `${date}T${arr}`;
    const t1 = new Date(depISO);
    const t2 = new Date(arrISO);
    if (isNaN(t1.getTime()) || isNaN(t2.getTime())) return "";
    let diffMin = Math.round((t2.getTime() - t1.getTime()) / 1000 / 60);
    if (diffMin < 0) diffMin += 24 * 60;
    const h = Math.floor(diffMin / 60);
    const m = Math.abs(diffMin % 60);
    return `${h}h ${m}m`;
  } catch {
    return "";
  }
};

export default function FlightPreviewModal({
  isOpen,
  onClose,
  preview,
  travelDate,
  defaultFlightNumber,
  onSave,
}: FlightPreviewModalProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingData, setEditingData] = React.useState<Partial<SegmentPreview>>(
    {},
  );

  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditingData({});
    }
  }, [isOpen]);

  const currentPreview: SegmentPreview | undefined = preview;

  const headerLeft = (
    <div className="flex items-center justify-between w-full pr-10">
      <h2 className="text-black text-[1rem] md:text-[1.15rem] font-semibold leading-snug m-0">
        Preview
      </h2>

      {!isEditing && (
        <button
          type="button"
          onClick={() => {
            setIsEditing(true);
            const pv = currentPreview;
            setEditingData({
              airline: pv?.airline ?? "",
              flightNumber:
                pv?.flightNumber ?? String(defaultFlightNumber ?? ""),
              origin: pv?.origin ?? "",
              destination: pv?.destination ?? "",
              departureTime: toTimeInput(
                pv?.departureTimeRaw ?? pv?.departureTime,
              ),
              arrivalTime: toTimeInput(pv?.arrivalTimeRaw ?? pv?.arrivalTime),
              duration: pv?.duration ?? "",
            });
          }}
          className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
          aria-label="Edit preview"
        >
          <FiEdit2 size={16} className="text-blue-600" />
        </button>
      )}
    </div>
  );

  const valueOrNA = (v?: string) => (v && String(v).trim() ? v : "NA");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerLeft={headerLeft}
      size="md"
      className="!rounded-xl"
    >
      <div className="bg-white rounded-md">
        {isEditing ? (
          <div className="h-full">
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="text-gray-500 text-[0.6rem] mb-1 block">
                  Airline Name
                </label>
                <input
                  type="text"
                  value={editingData.airline ?? ""}
                  onChange={(e) =>
                    setEditingData((prev) => ({
                      ...prev,
                      airline: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 text-[0.6rem] mb-1 block">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    value={
                      editingData.flightNumber ??
                      currentPreview?.flightNumber ??
                      String(defaultFlightNumber ?? "")
                    }
                    onChange={(e) =>
                      setEditingData((prev) => ({
                        ...prev,
                        flightNumber: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-500 text-[0.6rem] mb-1 block">
                    Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1h 55m"
                    value={
                      editingData.duration ?? currentPreview?.duration ?? ""
                    }
                    onChange={(e) =>
                      setEditingData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 text-[0.6rem] mb-1 block">
                    Origin
                  </label>
                  <input
                    type="text"
                    value={editingData.origin ?? currentPreview?.origin ?? ""}
                    onChange={(e) =>
                      setEditingData((prev) => ({
                        ...prev,
                        origin: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-500 text-[0.6rem] mb-1 block">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={
                      editingData.destination ??
                      currentPreview?.destination ??
                      ""
                    }
                    onChange={(e) =>
                      setEditingData((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 items-end">
                <div>
                  <label className="text-gray-500 text-[0.6rem] mb-1 block">
                    ETD
                  </label>
                  <input
                    type="time"
                    value={(editingData.departureTime ?? "") as string}
                    onChange={(e) =>
                      setEditingData((prev) => ({
                        ...prev,
                        departureTime: capTimeInput(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                  />
                </div>

                <div>
                  <label className="text-gray-500 text-[0.6rem] mb-1 block">
                    ETA
                  </label>
                  <input
                    type="time"
                    value={(editingData.arrivalTime ?? "") as string}
                    onChange={(e) =>
                      setEditingData((prev) => ({
                        ...prev,
                        arrivalTime: capTimeInput(e.target.value),
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded-md text-[0.7rem] bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingData({});
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[0.75rem] text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const dep = String(editingData.departureTime ?? "");
                  const arr = String(editingData.arrivalTime ?? "");

                  let durationVal = String(editingData.duration ?? "");
                  if (!durationVal && dep && arr && travelDate) {
                    durationVal = computeDurationFromTimes(
                      travelDate,
                      dep,
                      arr,
                    );
                  }

                  const newPreview: SegmentPreview = {
                    airline:
                      editingData.airline ?? currentPreview?.airline ?? "",
                    origin: editingData.origin ?? currentPreview?.origin ?? "",
                    destination:
                      editingData.destination ??
                      currentPreview?.destination ??
                      "",
                    departureTime: dep || currentPreview?.departureTime || "",
                    arrivalTime: arr || currentPreview?.arrivalTime || "",
                    departureTimeRaw:
                      dep && travelDate
                        ? `${travelDate}T${dep}`
                        : (currentPreview?.departureTimeRaw ?? ""),
                    arrivalTimeRaw:
                      arr && travelDate
                        ? `${travelDate}T${arr}`
                        : (currentPreview?.arrivalTimeRaw ?? ""),
                    flightNumber:
                      editingData.flightNumber ??
                      currentPreview?.flightNumber ??
                      String(defaultFlightNumber ?? ""),
                    duration: durationVal || currentPreview?.duration || "",
                  };

                  onSave?.(newPreview);
                  setIsEditing(false);
                  setEditingData({});
                }}
                className="px-3 py-1.5 flex items-center gap-1 bg-[#0D4B37] text-white rounded-md text-[0.75rem] hover:bg-green-700"
              >
                <LuSave size={16} />
                Save
              </button>
            </div>
          </div>
        ) : currentPreview ? (
          <>
            <div className="border border-dotted border-gray-200 rounded-lg p-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-3 flex items-center gap-2">
                <span className="font-medium text-gray-800">
                  {valueOrNA(currentPreview.airline)}
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                      Origin
                    </div>
                    <div className="font-semibold text-gray-900">
                      {valueOrNA(truncateIfLong(currentPreview.origin))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                      STD
                    </div>
                    <div className="font-semibold text-gray-900">
                      {valueOrNA(currentPreview.departureTime)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                      Flight Number
                    </div>
                    <div className="font-semibold text-gray-900">
                      {valueOrNA(
                        currentPreview.flightNumber ??
                          String(defaultFlightNumber ?? ""),
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-gray-500 text-[0.6rem]">
                    <div className="w-[1px] h-8 border-l-2 border-dotted border-gray-300 mb-1" />
                    <div className="text-[0.75rem] font-medium text-gray-700">
                      ✈
                    </div>
                    <div className="w-[0.0625rem] h-8 border-l-2 border-dotted border-gray-300 mt-1" />
                  </div>

                  <div className="text-right">
                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                      Duration
                    </div>
                    <div className="font-semibold text-gray-900">
                      {valueOrNA(currentPreview.duration)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                      Destination
                    </div>
                    <div className="font-semibold text-gray-900">
                      {valueOrNA(truncateIfLong(currentPreview.destination))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 text-[0.6rem] mb-0.5">
                      STA
                    </div>
                    <div className="font-semibold text-gray-900">
                      {valueOrNA(currentPreview.arrivalTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0D4B37] text-white rounded-md text-[0.8rem] hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="border border-dotted border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-md text-gray-500 min-h-[160px]">
              <p>Preview data will appear here</p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0D4B37] text-white rounded-md text-[0.8rem] hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
