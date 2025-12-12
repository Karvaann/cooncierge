import React, { useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineKeyboardArrowUp } from "react-icons/md";

interface RoomSegment {
  id?: string | null;
  roomCategory: string;
  bedType: string;
}

interface VillaLayoutProps {
  segments: RoomSegment[];
  onSegmentsChange: (segments: RoomSegment[]) => void;
  villaType?: "entire" | "shared";
}

const VillaLayout: React.FC<VillaLayoutProps> = ({
  segments,
  onSegmentsChange,
  villaType,
}) => {
  const [numRooms, setNumRooms] = useState(segments.length);
  const [roomcount, setRoomcount] = useState(0);
  const [copyToOthers, setCopyToOthers] = useState(false);

  // Internal state for pax information (not stored in context)
  const [paxData, setPaxData] = useState<
    Record<string, { adults: number; children: number }>
  >(() => {
    const initial: Record<string, { adults: number; children: number }> = {};
    segments.forEach((seg, idx) => {
      initial[seg.id || `room-${idx + 1}`] = {
        adults: 1,
        children: 0,
      };
    });
    return initial;
  });

  // Handle room count change
  const handleRoomCountChange = (newCount: number) => {
    if (newCount < 1) return;

    setNumRooms(newCount);

    if (newCount > segments.length) {
      // Add new rooms
      const newSegments: RoomSegment[] = [...segments];
      const newPaxData = { ...paxData };

      for (let i = segments.length; i < newCount; i++) {
        const roomId = `room-${i + 1}`;
        newSegments.push({
          id: roomId,
          roomCategory:
            copyToOthers && segments[0] ? segments[0].roomCategory : "",
          bedType: copyToOthers && segments[0] ? segments[0].bedType : "",
        });

        const basePax =
          copyToOthers && segments[0]
            ? paxData[segments[0].id || "room-1"]
            : undefined;

        newPaxData[roomId] = {
          adults: basePax?.adults ?? 1,
          children: basePax?.children ?? 0,
        };
      }

      setPaxData(newPaxData);
      onSegmentsChange(newSegments);
    } else if (newCount < segments.length) {
      // Remove rooms
      const newSegments = segments.slice(0, newCount);
      const newPaxData = { ...paxData };

      // Remove pax data for deleted rooms
      segments.slice(newCount).forEach((seg) => {
        delete newPaxData[seg.id || ""];
      });

      setPaxData(newPaxData);
      onSegmentsChange(newSegments);
    }
  };

  // Handle segment update
  const updateSegment = (
    index: number,
    field: keyof RoomSegment,
    value: string
  ) => {
    const newSegments: RoomSegment[] = segments.map((seg, idx) => {
      if (idx === index) {
        return {
          ...seg,
          [field]: value,
        };
      }

      // If copy to others is enabled and updating first room
      if (
        copyToOthers &&
        index === 0 &&
        (field === "roomCategory" || field === "bedType")
      ) {
        return {
          ...seg,
          [field]: value,
        };
      }

      return seg;
    });

    onSegmentsChange(newSegments);
  };

  const updatePaxCount = (
    roomId: string,
    field: "adults" | "children",
    increment: boolean
  ) => {
    setPaxData((prev) => {
      const current = prev[roomId] || { adults: 0, children: 0, infant: 0 };
      const newValue = increment
        ? current[field] + 1
        : Math.max(0, current[field] - 1);

      return {
        ...prev,
        [roomId]: {
          adults: field === "adults" ? newValue : current.adults,
          children: field === "children" ? newValue : current.children,
        },
      };
    });
  };

  return (
    <>
      <label className="block text-[0.8rem] font-medium text-gray-700 mb-1 mt-3">
        Total Rooms
      </label>

      {villaType === "shared" && (
        <div className="w-full max-w-6xl mx-auto p-3 mt-2">
          {/* Room Counter */}
          <div className="mb-3">
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
              No. of Rooms
            </label>
            <div className="flex items-center gap-2">
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <input
                  type="number"
                  value={numRooms}
                  onChange={(e) =>
                    handleRoomCountChange(parseInt(e.target.value) || 1)
                  }
                  min="1"
                  className="w-[2.2rem] px-1 py-1.5 text-[0.75rem] text-center 
               border-none focus:outline-none bg-white"
                />

                <div className="flex flex-col border-l border-black">
                  <button
                    type="button"
                    onClick={() => handleRoomCountChange(numRooms + 1)}
                    className="px-[5px] py-[2px] rounded-tr-md text-[0.65rem] 
                 hover:bg-gray-100 border border-black border-b-0"
                  >
                    <MdOutlineKeyboardArrowUp size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoomCountChange(numRooms - 1)}
                    className="px-[5px] py-[2px] rounded-br-md text-[0.65rem] 
                 hover:bg-gray-100 border border-black"
                  >
                    <MdKeyboardArrowDown size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Room Segments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {segments.map((segment, index) => {
              const roomId = segment.id || `room-${index + 1}`;
              const pax = paxData[roomId] || {
                adults: 1,
                children: 0,
                infant: 0,
              };

              return (
                <div
                  key={roomId}
                  className="bg-[#F9F9F9] p-3 rounded-md border border-gray-200"
                >
                  {/* Room Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[0.8rem] font-medium text-gray-800">
                      Room {index + 1}
                    </h3>
                    {index === 0 && (
                      <div className="flex items-center gap-1 text-[0.7rem] text-gray-600">
                        <input
                          type="checkbox"
                          id={`villa-copy-checkbox`}
                          className="hidden peer"
                          checked={copyToOthers}
                          onChange={(e) => setCopyToOthers(e.target.checked)}
                        />

                        <label
                          htmlFor={`villa-copy-checkbox`}
                          className="w-3.5 h-3.5 border border-gray-400 rounded-[4px] 
                 flex items-center justify-center cursor-pointer"
                        >
                          {copyToOthers && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="11"
                              viewBox="0 0 12 11"
                              fill="none"
                            >
                              <path
                                d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                                stroke="#0D4B37"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </label>

                        <span>Copy to Other Rooms</span>
                      </div>
                    )}
                  </div>

                  <div className="border-b border-gray-300 mb-2 -mt-1"></div>

                  {/* Room Category */}
                  <div className="mb-2">
                    <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                      Room Category
                    </label>
                    <input
                      type="text"
                      value={segment.roomCategory}
                      onChange={(e) =>
                        updateSegment(index, "roomCategory", e.target.value)
                      }
                      placeholder="Super Deluxe"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Bed Type */}
                  <div className="mb-2">
                    <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                      Bed Type
                    </label>
                    <input
                      type="text"
                      value={segment.bedType}
                      onChange={(e) =>
                        updateSegment(index, "bedType", e.target.value)
                      }
                      placeholder="King Size Bed"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Pax Section */}
                  <div className="mb-1">
                    <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                      Pax
                    </label>
                    <div className="border-b border-gray-300 mb-2 -mt-1"></div>
                    <div className="grid grid-cols-2 gap-0">
                      {/* Adults */}
                      <div>
                        <label className="block text-[0.65rem] text-black mb-1">
                          Adults
                        </label>

                        <div className="flex items-center border border-black rounded-lg px-1 py-1 w-[72px]">
                          <button
                            type="button"
                            onClick={() =>
                              setPaxData((prev) => {
                                const cur = prev[roomId] ?? {
                                  adults: 1,
                                  children: 0,
                                };

                                return {
                                  ...prev,
                                  [roomId]: {
                                    ...cur,
                                    adults: Math.max(1, cur.adults - 1),
                                  },
                                };
                              })
                            }
                            className="px-2"
                          >
                            −
                          </button>

                          <span className="px-1 text-[0.75rem]">
                            {pax.adults}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setPaxData((prev) => {
                                const cur = prev[roomId] ?? {
                                  adults: 1,
                                  children: 0,
                                };

                                return {
                                  ...prev,
                                  [roomId]: {
                                    ...cur,
                                    adults: Math.min(2, cur.adults + 1),
                                  },
                                };
                              })
                            }
                            className="px-2"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="p-0 -ml-[4px]">
                        <label className="block text-[0.65rem] text-black mb-1">
                          Children
                        </label>

                        <div className="flex items-center border border-black rounded-lg px-1 py-1 w-[72px]">
                          <button
                            type="button"
                            onClick={() =>
                              setPaxData((prev) => {
                                const cur = prev[roomId] ?? {
                                  adults: 1,
                                  children: 0,
                                };

                                return {
                                  ...prev,
                                  [roomId]: {
                                    ...cur,
                                    children: Math.max(0, cur.children - 1),
                                  },
                                };
                              })
                            }
                            className="px-2"
                          >
                            −
                          </button>

                          <span className="px-1 text-[0.75rem]">
                            {pax.children}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setPaxData((prev) => {
                                const cur = prev[roomId] ?? {
                                  adults: 1,
                                  children: 0,
                                };

                                return {
                                  ...prev,
                                  [roomId]: {
                                    ...cur,
                                    children: Math.min(1, cur.children + 1),
                                  },
                                };
                              })
                            }
                            className="px-2"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default VillaLayout;
