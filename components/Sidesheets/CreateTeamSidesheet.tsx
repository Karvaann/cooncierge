"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import SideSheet from "../SideSheet";
import Button from "../Button";

interface CreateTeamSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (data: any) => void;
}

export default function CreateTeamSidesheet({
  isOpen,
  onClose,
  onCreate,
}: CreateTeamSidesheetProps) {
  const [teamName, setTeamName] = useState("");
  const [teamStatus, setTeamStatus] = useState("");
  const [bookingsOs, setBookingsOs] = useState(false);
  const [bookingsLimitless, setBookingsLimitless] = useState(false);

  // Dummy contacts
  const contacts = useMemo(
    () => [
      { id: "1", name: "Alice Johnson" },
      { id: "2", name: "Bob Smith" },
      { id: "3", name: "Carla Gomez" },
      { id: "4", name: "Daniel Lee" },
    ],
    []
  );

  // Checkers dropdown state
  const [checkersDropdownOpen, setCheckersDropdownOpen] = useState(false);
  const [selectedCheckers, setSelectedCheckers] = useState<string[]>([]);
  const checkersRef = useRef<HTMLDivElement | null>(null);
  const checkersPortalRef = useRef<HTMLDivElement | null>(null);
  const [checkersPos, setCheckersPos] = useState<null | {
    left: number;
    top: number;
    width: number;
    height: number;
  }>(null);

  // Makers dropdown state
  const [makersDropdownOpen, setMakersDropdownOpen] = useState(false);
  const [selectedMakers, setSelectedMakers] = useState<string[]>([]);
  const makersRef = useRef<HTMLDivElement | null>(null);
  const makersPortalRef = useRef<HTMLDivElement | null>(null);
  const [makersPos, setMakersPos] = useState<null | {
    left: number;
    top: number;
    width: number;
    height: number;
  }>(null);

  const toggleChecker = (name: string) => {
    setSelectedCheckers((prev) => {
      const next = prev.includes(name)
        ? prev.filter((p) => p !== name)
        : [...prev, name];
      return next;
    });
  };

  const toggleMaker = (name: string) => {
    setSelectedMakers((prev) => {
      const next = prev.includes(name)
        ? prev.filter((p) => p !== name)
        : [...prev, name];
      return next;
    });
  };

  // Outside click handlers for both dropdowns
  useEffect(() => {
    if (!checkersDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (checkersRef.current && checkersRef.current.contains(target)) return;
      if (
        checkersPortalRef.current &&
        checkersPortalRef.current.contains(target)
      )
        return;
      setCheckersDropdownOpen(false);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [checkersDropdownOpen]);

  useEffect(() => {
    if (!makersDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (makersRef.current && makersRef.current.contains(target)) return;
      if (makersPortalRef.current && makersPortalRef.current.contains(target))
        return;
      setMakersDropdownOpen(false);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [makersDropdownOpen]);

  // Recalculate portal positions
  useEffect(() => {
    if (checkersDropdownOpen) {
      const rect = checkersRef.current?.getBoundingClientRect();
      if (rect)
        setCheckersPos({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
    }
  }, [checkersDropdownOpen, selectedCheckers]);

  useEffect(() => {
    if (makersDropdownOpen) {
      const rect = makersRef.current?.getBoundingClientRect();
      if (rect)
        setMakersPos({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
    }
  }, [makersDropdownOpen, selectedMakers]);

  const handleCreate = () => {
    const payload = {
      teamName,
      teamStatus,
      bookingsOs,
      bookingsLimitless,
    };
    if (onCreate) onCreate(payload);
    onClose();
  };

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={"Create Booking Approvals Team"}
      width="lg"
    >
      <div className="p-4 text-[13px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div className="border border-gray-200 rounded-lg p-4 -mt-3">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  *Team Name
                </label>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter Team Name"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  Checkers (Users)
                </label>
                <div className="relative" ref={checkersRef}>
                  <div
                    className="mt-1 w-full min-h-[2.2rem] border border-gray-300 rounded-md px-2.5 py-2 flex items-center flex-wrap gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = checkersRef.current?.getBoundingClientRect();
                      if (rect)
                        setCheckersPos({
                          left: rect.left,
                          top: rect.top,
                          width: rect.width,
                          height: rect.height,
                        });
                      setCheckersDropdownOpen((p) => !p);
                    }}
                  >
                    {selectedCheckers.length > 0 ? (
                      selectedCheckers.map((o) => (
                        <span
                          key={o}
                          className="flex items-center gap-1 bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full text-[12px]"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleChecker(o);
                            }}
                            className="py-1"
                          >
                            <IoClose size={14} className="text-[#818181]" />
                          </button>
                          {o}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-[15px] flex items-center w-full">
                        Select Checkers
                        <MdOutlineKeyboardArrowDown className="ml-auto text-gray-400 pointer-events-none" />
                      </span>
                    )}
                  </div>

                  {checkersDropdownOpen &&
                    checkersPos &&
                    createPortal(
                      <div
                        ref={checkersPortalRef}
                        style={{
                          position: "fixed",
                          left: checkersPos.left,
                          top: checkersPos.top + checkersPos.height + 6,
                          width: checkersPos.width,
                          zIndex: 9999,
                        }}
                        className="bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-y-auto"
                      >
                        {contacts.map((c) => {
                          const checked = selectedCheckers.includes(c.name);
                          return (
                            <label
                              key={c.id}
                              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChecker(c.name);
                              }}
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
                              <span className="text-black text-[14px]">
                                {c.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>,
                      typeof document !== "undefined"
                        ? document.body
                        : (null as any)
                    )}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  Makers (Users)
                </label>
                <div className="relative" ref={makersRef}>
                  <div
                    className="mt-1 w-full min-h-[2.2rem] border border-gray-300 rounded-md px-2.5 py-2 flex items-center flex-wrap gap-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = makersRef.current?.getBoundingClientRect();
                      if (rect)
                        setMakersPos({
                          left: rect.left,
                          top: rect.top,
                          width: rect.width,
                          height: rect.height,
                        });
                      setMakersDropdownOpen((p) => !p);
                    }}
                  >
                    {selectedMakers.length > 0 ? (
                      selectedMakers.map((o) => (
                        <span
                          key={o}
                          className="flex items-center gap-1 bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full text-[12px]"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMaker(o);
                            }}
                            className="py-1"
                          >
                            <IoClose size={14} className="text-[#818181]" />
                          </button>
                          {o}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-[15px] flex items-center w-full">
                        Select Makers
                        <MdOutlineKeyboardArrowDown className="ml-auto text-gray-400 pointer-events-none" />
                      </span>
                    )}
                  </div>

                  {makersDropdownOpen &&
                    makersPos &&
                    createPortal(
                      <div
                        ref={makersPortalRef}
                        style={{
                          position: "fixed",
                          left: makersPos.left,
                          top: makersPos.top + makersPos.height + 6,
                          width: makersPos.width,
                          zIndex: 9999,
                        }}
                        className="bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-y-auto"
                      >
                        {contacts.map((c) => {
                          const checked = selectedMakers.includes(c.name);
                          return (
                            <label
                              key={c.id}
                              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMaker(c.name);
                              }}
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
                              <span className="text-black text-[14px]">
                                {c.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>,
                      typeof document !== "undefined"
                        ? document.body
                        : (null as any)
                    )}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  Team Status
                </label>
                <div className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500">
                  Select User Status
                </div>
              </div>

              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#414141]">
                    Bookings - OS
                  </span>
                  <input
                    type="checkbox"
                    id={`bookingsOsToggle`}
                    className="hidden"
                    checked={bookingsOs}
                    onChange={() => setBookingsOs((s) => !s)}
                  />
                  <label
                    htmlFor={`bookingsOsToggle`}
                    className={`w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition ${
                      bookingsOs
                        ? "bg-[#126ACB] border-[#126ACB]"
                        : "border-[#0D4B37] bg-white"
                    }`}
                  >
                    {bookingsOs && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="10"
                        viewBox="0 0 11 10"
                        fill="none"
                      >
                        <path
                          d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#414141]">
                    Bookings - Limitless
                  </span>
                  <input
                    type="checkbox"
                    id={`bookingsLimitlessToggle`}
                    className="hidden"
                    checked={bookingsLimitless}
                    onChange={() => setBookingsLimitless((s) => !s)}
                  />
                  <label
                    htmlFor={`bookingsLimitlessToggle`}
                    className={`w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition ${
                      bookingsLimitless
                        ? "bg-[#126ACB] border-[#126ACB]"
                        : "border-[#0D4B37] bg-white"
                    }`}
                  >
                    {bookingsLimitless && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="10"
                        viewBox="0 0 11 10"
                        fill="none"
                      >
                        <path
                          d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              text="Create Team"
              type="submit"
              bgColor="bg-[#0D4B37]"
              textColor="text-white text-[13px] py-2"
            />
          </div>
        </form>
      </div>
    </SideSheet>
  );
}
