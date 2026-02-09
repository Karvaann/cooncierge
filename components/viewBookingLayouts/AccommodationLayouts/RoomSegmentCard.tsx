"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiMinusCircle, FiPlusCircle } from "react-icons/fi";
import { MdKingBed, MdRestaurant, MdPeople } from "react-icons/md";
import RoomSegmentModal from "@/components/viewBookingLayouts/components/RoomSegmentModal";

export interface RoomSegment {
  id?: string | null;
  roomName?: string;
  adults?: number | string;
  children?: number | string;
  bedType?: string;
  meals?: string;
}

const genId = () => Date.now().toString() + Math.random().toString(36).slice(2);

const toNum = (v: any) => {
  const n = Number(String(v ?? "").trim());
  return isFinite(n) ? n : 0;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Stat({
  icon,
  label,
  value,
  iconWrapClassName,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  iconWrapClassName: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={
          "w-9 h-9 rounded-md flex items-center justify-center flex-none " +
          iconWrapClassName
        }
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[0.75rem] tracking-wide text-gray-500">
          {label}
        </div>
        <div
          className={
            "text-[0.95rem] font-medium text-gray-800 truncate " +
            (valueClassName || "")
          }
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export default function RoomSegmentCard({
  rooms,
  onRoomsChange,
  className,
}: {
  rooms?: RoomSegment[];
  onRoomsChange: (rooms: RoomSegment[]) => void;
  className?: string;
}) {
  const normalizedRooms = useMemo(() => {
    return Array.isArray(rooms) ? rooms : [];
  }, [rooms]);

  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const needsIds = normalizedRooms.some((r) => !r?.id);
    if (!needsIds) return;
    onRoomsChange(
      normalizedRooms.map((r) => (r?.id ? r : { ...r, id: genId() })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedRooms]);

  const addRoom = () => {
    const id = genId();
    const next: RoomSegment = {
      id,
      roomName: "",
      adults: 2,
      children: 0,
      bedType: "",
      meals: "",
    };
    onRoomsChange([...(normalizedRooms || []), next]);
    setActiveRoomId(String(id));
    setIsModalOpen(true);
  };

  const removeRoom = (roomId: string) => {
    const next = (normalizedRooms || []).filter((r) => String(r.id) !== roomId);
    onRoomsChange(next);
    if (activeRoomId === roomId) {
      setActiveRoomId(null);
      setIsModalOpen(false);
    }
  };

  const patchRoom = (roomId: string, patch: Partial<RoomSegment>) => {
    onRoomsChange(
      (normalizedRooms || []).map((r) =>
        String(r.id) === roomId ? ({ ...r, ...patch } as RoomSegment) : r,
      ),
    );
  };

  const totalRooms = normalizedRooms.length;

  const activeRoom = useMemo(() => {
    if (!activeRoomId) return null;
    return (
      (normalizedRooms || []).find((r) => String(r.id) === activeRoomId) || null
    );
  }, [activeRoomId, normalizedRooms]);

  return (
    <div
      className={
        "border border-gray-200 rounded-lg p-4 bg-white " + (className || "")
      }
    >
      <RoomSegmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          activeRoomId
            ? `Room ${
                (normalizedRooms || []).findIndex(
                  (r) => String(r.id) === activeRoomId,
                ) + 1
              }`
            : "Room"
        }
        value={{
          roomName: activeRoom?.roomName ?? "",
          bedType: activeRoom?.bedType ?? "",
          meals: activeRoom?.meals ?? "",
          adults: activeRoom?.adults ?? 2,
          children: activeRoom?.children ?? 0,
        }}
        onSave={(next) => {
          if (!activeRoomId) return;
          patchRoom(activeRoomId, {
            roomName: next.roomName ?? "",
            bedType: next.bedType ?? "",
            meals: next.meals ?? "",
            adults: next.adults ?? 2,
            children: next.children ?? 0,
          });
        }}
        disableDelete={normalizedRooms.length <= 1}
        {...(activeRoomId
          ? {
              onDelete: () => {
                if (normalizedRooms.length <= 1) return;
                removeRoom(activeRoomId);
              },
            }
          : {})}
      />

      <div className="text-[1rem] font-semibold text-gray-900">
        {totalRooms} Room{totalRooms === 1 ? "" : "s"}
      </div>

      <div className="mt-3 space-y-3">
        {normalizedRooms.map((room, idx) => {
          const id = String(room.id ?? idx);

          const adults = toNum(room.adults);
          const children = toNum(room.children);
          const guestsText = `${plural(adults, "Adult")}, ${plural(
            children,
            "Children",
          )}`;

          return (
            <div
              key={id}
              className="border border-gray-200 rounded-lg bg-[#F9F9F9] overflow-hidden"
            >
              <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#0D4B37] text-white text-[0.75rem] font-medium">
                      Room {idx + 1}: {room.roomName || "Room"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {normalizedRooms.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRoom(id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Remove room"
                      >
                        <FiMinusCircle size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setActiveRoomId(id);
                        setIsModalOpen(true);
                      }}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-[#126ACB] hover:bg-blue-50"
                      aria-label="Edit room"
                    >
                      <FiEdit2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Stat
                    icon={<MdPeople size={18} className="text-[#C86B00]" />}
                    label="GUESTS"
                    value={guestsText}
                    iconWrapClassName="bg-orange-100"
                  />
                  <Stat
                    icon={<MdKingBed size={18} className="text-[#7C3AED]" />}
                    label="BED TYPE"
                    value={room.bedType || "NA"}
                    iconWrapClassName="bg-purple-100"
                  />
                  <Stat
                    icon={<MdRestaurant size={18} className="text-[#1A9B3D]" />}
                    label="MEALS"
                    value={room.meals || "NA"}
                    valueClassName={room.meals ? "text-[#1A9B3D]" : ""}
                    iconWrapClassName="bg-green-100"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addRoom}
        className="mt-4 inline-flex items-center gap-2 px-3 py-2 border border-[#126ACB] text-[#126ACB] text-[0.85rem] font-medium rounded-md hover:bg-blue-50 transition"
        type="button"
      >
        <FiPlusCircle size={18} />
        Add Another Room
      </button>
    </div>
  );
}
