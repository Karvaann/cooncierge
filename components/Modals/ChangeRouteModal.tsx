"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { FiPlus, FiSearch, FiMinus } from "react-icons/fi";
import { IoLocationSharp, IoCalendarClearOutline } from "react-icons/io5";
import { GoPerson } from "react-icons/go";
import Modal from "@/components/Modal";
import DropDown from "@/components/DropDown";

type Place = { id: string; name: string };

type CityRow = {
  id: string;
  city: string;
  nights: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ChangeRouteModal = ({ isOpen, onClose }: Props) => {
  const allPlaces = useMemo<Place[]>(
    () => [
      { id: "bur-dubai", name: "Bur Dubai" },
      { id: "al-barsha", name: "Al Barsha" },
      { id: "al-garhoud", name: "Al Garhoud" },
      { id: "al-nahda", name: "Al Nahda" },
      { id: "al-quoz", name: "Al Quoz" },
      { id: "deira", name: "Deira" },
      { id: "discovery-gardens", name: "Discovery Gardens" },
      { id: "downtown-dubai", name: "Downtown Dubai" },
      { id: "dubai-marina", name: "Dubai Marina" },
      { id: "emirates-hills", name: "Emirates Hills" },
    ],
    [],
  );

  const [selectedSearchPlaces, setSelectedSearchPlaces] = useState<Place[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownPanelRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState("");
  const selectedRouteName = useMemo(
    () => allPlaces.find((p) => p.id === selectedRouteId)?.name ?? "",
    [allPlaces, selectedRouteId],
  );

  const [itinerary, setItinerary] = useState({
    name: "ITINERARY ABC",
    startDate: "05-05-2025",
    endDate: "12-05-2025",
    nightsLabel: "7N",
    travellersCount: 3,
  });

  const cityOptions = useMemo(
    () => ["City 1", "City 2", "City 3", "City 4"],
    [],
  );

  const [cities, setCities] = useState<CityRow[]>([
    { id: "city-1", city: "City 1", nights: 0 },
  ]);

  const resetState = () => {
    setSelectedSearchPlaces([{ id: "", name: "" }]);
    setSelectedRouteId("");
    setItinerary({
      name: "ITINERARY ABC",
      startDate: "05-05-2025",
      endDate: "12-05-2025",
      nightsLabel: "7N",
      travellersCount: 3,
    });
    setCities([{ id: "city-1", city: "City 1", nights: 0 }]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const togglePlace = (place: Place) => {
    setSelectedSearchPlaces((prev) => {
      const exists = prev.some((p) => p.id === place.id);
      return exists ? prev.filter((p) => p.id !== place.id) : [...prev, place];
    });
  };

  const updateDropdownPos = () => {
    const el = dropdownRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  const openDropdown = () => {
    updateDropdownPos();
  };

  const closeDropdown = () => {
    setDropdownPos(null);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    if (!isDropdownOpen) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInAnchor = dropdownRef.current?.contains(target);
      const clickedInPanel = dropdownPanelRef.current?.contains(target);
      if (!clickedInAnchor && !clickedInPanel) closeDropdown();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDropdown();
    };

    const onReposition = () => updateDropdownPos();

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [isDropdownOpen]);

  const addCity = () => {
    setCities((prev) => {
      const nextIndex = prev.length + 1;
      const nextCity =
        cityOptions[Math.min(nextIndex - 1, cityOptions.length - 1)] ??
        `City ${nextIndex}`;
      return [
        ...prev,
        {
          id: `city-${nextIndex}`,
          city: nextCity,
          nights: 1,
        },
      ];
    });
  };

  const removeCity = (id: string) => {
    setCities((prev) => prev.filter((c, idx) => idx === 0 || c.id !== id));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      headerLeft={
        <div className="text-[16px] font-medium text-[#020202]">
          Change Route
        </div>
      }
      customWidth="max-w-[1200px] w-[95vw]"
      customeHeight="h-[86vh]"
      className="rounded-[12px]"
    >
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* LEFT */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1" ref={dropdownRef}>
              <div
                className="w-full min-h-[40px] border border-gray-200 rounded-[8px] px-3 py-2 flex items-center flex-wrap gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen((v) => {
                    const next = !v;
                    if (next) openDropdown();
                    else closeDropdown();
                    return next;
                  });
                }}
              >
                {selectedSearchPlaces.length > 0 ? (
                  selectedSearchPlaces.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1 bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full text-[12px]"
                    >
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          togglePlace(p);
                        }}
                        className="py-1"
                        aria-label={`Remove ${p.name}`}
                      >
                        <IoClose size={16} className="text-[#818181]" />
                      </button>
                      {p.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[#9CA3AF] text-[13px] flex-1">
                    Search Routes
                  </span>
                )}

                <span className="ml-auto text-gray-400 text-[12px]">▾</span>
              </div>

              {isDropdownOpen &&
                dropdownPos &&
                createPortal(
                  <div
                    ref={dropdownPanelRef}
                    style={{
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      width: dropdownPos.width,
                    }}
                    className="absolute bg-white border border-gray-200 rounded-[10px] shadow-xl max-h-60 overflow-y-auto z-[9999]"
                  >
                    {allPlaces.map((place) => {
                      const checked = selectedSearchPlaces.some(
                        (p) => p.id === place.id,
                      );
                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlace(place);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 border-b border-gray-100 hover:bg-gray-50"
                        >
                          <div className="w-4 h-4 border border-gray-300 rounded-md flex items-center justify-center">
                            {checked && (
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
                          </div>
                          <span className="text-[14px] text-[#020202]">
                            {place.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>,
                  document.body,
                )}
            </div>

            <button
              type="button"
              className="h-[40px] px-3.5 rounded-[8px] border border-blue-600 text-[#126ACB] font-medium hover:bg-blue-50"
            >
              Search
            </button>
          </div>

          {/* Selected Route Bar */}
          <div className="mt-4 rounded-[10px] bg-[#FFF7EA] border border-gray-200 px-4 py-3 flex items-center gap-2">
            <span className="text-[13px] text-gray-500 font-medium">
              Selected Route :
            </span>
            <IoLocationSharp className="text-[#DC6601]" />
            <span className="text-[13px] font-medium text-[#DC6601] uppercase">
              {selectedRouteName}
            </span>
          </div>

          <div className="mt-4 text-[13px] font-medium text-[#020202]">
            Recommended Routes
          </div>

          <div className="mt-2 rounded-[12px] border border-gray-200 bg-white overflow-hidden">
            {allPlaces.map((route) => {
              const active = route.id === selectedRouteId;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRouteId(route.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-b border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <IoLocationSharp className="text-[#DC6601]" />
                    <span className="text-[14px] text-[#020202]">
                      {route.name}
                    </span>
                  </div>

                  <div className="w-4 h-4 rounded-full border border-blue-300 flex items-center justify-center">
                    {active && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          {/* Itinerary summary */}
          <div className="rounded-[12px] border border-gray-200 bg-[#F8F8F8] p-4">
            <div className="inline-flex items-center px-3 py-1 rounded-[8px] bg-[#0D4B37] text-white text-[12px] font-medium">
              {itinerary.name}
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-[14px] text-[#020202] font-medium">
                <div className="w-8 h-8 rounded-[10px] bg-[#EAF3FF] flex items-center justify-center">
                  <IoCalendarClearOutline className="text-blue-600" />
                </div>
                <span>{itinerary.startDate}</span>
                <span className="text-gray-400 font-medium">→</span>
                <span>{itinerary.endDate}</span>
                <span className="text-gray-400 font-medium">|</span>
                <span>{itinerary.nightsLabel}</span>
              </div>

              <div className="flex items-center gap-2 text-[14px] text-gray-600">
                <div className="w-8 h-8 rounded-[10px] bg-[#F3E8FF] flex items-center justify-center">
                  <GoPerson size={16} className="text-[#7C3AED]" />
                </div>
                <span className="font-medium text-[#020202]">
                  {itinerary.travellersCount}
                </span>
                <span>Travellers</span>
              </div>
            </div>
          </div>

          {/* Selected Route form */}
          <div className="mt-4 rounded-[12px] border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 text-[13px] font-medium text-[#020202]">
              Selected Route
            </div>

            <div className="p-4 space-y-4">
              {cities.map((row, idx) => (
                <div key={row.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-[12px] font-medium text-gray-700">
                        City {idx + 1}
                      </div>
                      {idx > 0 && (
                        <button
                          type="button"
                          aria-label={`Remove City ${idx + 1}`}
                          onClick={() => removeCity(row.id)}
                          className="w-5 h-5 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                        >
                          <FiMinus size={12} />
                        </button>
                      )}
                    </div>

                    <div className="text-[12px] font-medium text-gray-700">
                      Number of Nights
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <DropDown
                        options={cityOptions.map((opt) => ({
                          value: opt,
                          label: opt,
                        }))}
                        value={row.city}
                        onChange={(val) =>
                          setCities((prev) =>
                            prev.map((c) =>
                              c.id === row.id ? { ...c, city: val } : c,
                            ),
                          )
                        }
                        className="w-full"
                        customWidth="w-full"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <input
                        type="number"
                        value={row.nights}
                        min={0}
                        onChange={(e) => {
                          const val = Number(e.target.value || 0);
                          setCities((prev) =>
                            prev.map((c) =>
                              c.id === row.id ? { ...c, nights: val } : c,
                            ),
                          );
                        }}
                        className="w-full border border-gray-200 rounded-[8px] px-3 py-2 text-[13px] text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addCity}
                className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-800"
              >
                <FiPlus />
                Add City
              </button>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  className="px-3.5 py-2 text-[13px] rounded-[8px] bg-[#0D4B37] text-white font-medium hover:bg-[#0B3E2E]"
                  onClick={() => {
                    // placeholder: later wire to API
                    handleClose();
                  }}
                >
                  Update Route
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChangeRouteModal;
