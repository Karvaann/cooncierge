"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import DropDown from "@/components/DropDown";
import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";

export interface RoomSegmentModalValue {
  roomName?: string;
  bedType?: string;
  meals?: string;
  adults?: number | string;
  children?: number | string;
}

interface RoomSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  value: RoomSegmentModalValue;
  onSave: (next: RoomSegmentModalValue) => void;
  onDelete?: () => void;
  disableDelete?: boolean;
}

const RoomSegmentModal: React.FC<RoomSegmentModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  onSave,
  onDelete,
  disableDelete,
}) => {
  const initial = useMemo<RoomSegmentModalValue>(
    () => ({
      roomName: value?.roomName ?? "",
      bedType: value?.bedType ?? "",
      meals: value?.meals ?? "",
      adults: value?.adults ?? 2,
      children: value?.children ?? 0,
    }),
    [value],
  );

  const [formData, setFormData] = useState<RoomSegmentModalValue>(initial);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initial);
  }, [initial, isOpen]);

  const toNum = (v: any) => {
    const n = Number(String(v ?? "").trim());
    return isFinite(n) ? n : 0;
  };

  const updatePax = (key: "adults" | "children", delta: number, min = 0) => {
    setFormData((prev) => ({
      ...prev,
      [key]: Math.max(min, toNum((prev as any)[key]) + delta),
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Room"}
      size="sm"
      showCloseButton={true}
      customWidth="w-[450px]"
    >
      <div className="space-y-4">
        {/* ROOM CATEGORY */}
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Room Category
          </label>
          <input
            value={String(formData.roomName ?? "")}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, roomName: e.target.value }))
            }
            placeholder="Deluxe Room"
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-[0.75rem] bg-white"
          />
        </div>

        {/* BED TYPE */}
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Bed Type
          </label>
          <DropDown
            options={[
              { value: "Twin Bed", label: "Twin Bed" },
              { value: "King Bed", label: "King Bed" },
              { value: "Queen Bed", label: "Queen Bed" },
              { value: "Double Bed", label: "Double Bed" },
              { value: "Single Bed", label: "Single Bed" },
            ]}
            placeholder="Select Bed"
            value={String(formData.bedType ?? "")}
            onChange={(v) => setFormData((prev) => ({ ...prev, bedType: v }))}
            customWidth="w-full"
          />
        </div>

        {/* MEAL PLAN */}
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Meals
          </label>
          <DropDown
            options={[
              { value: "EPAI", label: "EPAI" },
              { value: "CPAI", label: "CPAI" },
              { value: "MAPAI", label: "MAPAI" },
              { value: "APAI", label: "APAI" },
            ]}
            placeholder="Select Meals"
            value={String(formData.meals ?? "")}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, meals: value }))
            }
            customWidth="w-full"
          />
        </div>

        {/* PAX */}
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-2">
            Pax
          </label>

          <div className="flex gap-6">
            {/* ADULTS */}
            <div>
              <p className="text-[0.7rem] text-gray-600 mb-1">Adults</p>
              <div className="flex items-center gap-2 border rounded-md px-2 py-1">
                <button
                  onClick={() => updatePax("adults", -1, 1)}
                  className="text-gray-600"
                  type="button"
                >
                  <FiMinus size={14} />
                </button>
                <span className="text-[0.75rem] w-4 text-center">
                  {formData.adults}
                </span>
                <button
                  onClick={() => updatePax("adults", 1)}
                  className="text-gray-600"
                  type="button"
                >
                  <FiPlus size={14} />
                </button>
              </div>
            </div>

            {/* CHILDREN */}
            <div>
              <p className="text-[0.7rem] text-gray-600 mb-1">Children</p>
              <div className="flex items-center gap-2 border rounded-md px-2 py-1">
                <button
                  onClick={() => updatePax("children", -1)}
                  className="text-gray-600"
                  type="button"
                >
                  <FiMinus size={14} />
                </button>
                <span className="text-[0.75rem] w-4 text-center">
                  {formData.children}
                </span>
                <button
                  onClick={() => updatePax("children", 1)}
                  className="text-gray-600"
                  type="button"
                >
                  <FiPlus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={onDelete}
            type="button"
            disabled={Boolean(disableDelete) || !onDelete}
            className={
              "flex items-center gap-2 text-white text-[0.75rem] px-4 py-2 rounded-md " +
              (Boolean(disableDelete) || !onDelete
                ? "bg-red-200 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600")
            }
          >
            <FiTrash2 size={14} />
            Delete Room
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSave({
                  roomName: String(formData.roomName ?? ""),
                  bedType: String(formData.bedType ?? ""),
                  meals: String(formData.meals ?? ""),
                  adults: Math.max(1, toNum(formData.adults)),
                  children: Math.max(0, toNum(formData.children)),
                });
                onClose();
              }}
              type="button"
              className="border border-green-700 text-green-700 text-[0.75rem] px-5 py-2 rounded-md hover:bg-green-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RoomSegmentModal;
