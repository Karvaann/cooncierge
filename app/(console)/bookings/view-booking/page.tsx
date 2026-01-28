"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoHomeOutline } from "react-icons/io5";
import { TbClipboardText } from "react-icons/tb";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FiChevronDown, FiMail, FiPhoneCall, FiUser } from "react-icons/fi";
import AvatarTooltip from "@/components/AvatarToolTip";
import { getOwnerAvatarColorClass } from "@/utils/helper";

type BookingOwner = {
  full: string;
  short: string;
  color: string;
};

const computeInitials = (name: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase();
};

const ViewBookingPage = () => {
  const tabOptions = useMemo(() => ["Booking Info", "Booking Log"], []);
  const [activeTab, setActiveTab] =
    useState<(typeof tabOptions)[number]>("Booking Info");

  const profileTabs = useMemo(
    () => ["Traveller", "Customer", "Vendor"] as const,
    [],
  );
  type ProfileTab = (typeof profileTabs)[number];
  const [activeProfileTab, setActiveProfileTab] =
    useState<ProfileTab>("Traveller");
  const [isTravellersExpanded, setIsTravellersExpanded] = useState(false);
  const [remarks, setRemarks] = useState("");

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  const booking = useMemo(
    () => ({
      id: "OS-ABC12",
      service: "Flight",
      route: "DEL - BOM",
      status: "Booking Confirmed",
      bookingDate: "September 09th, 2025",
      travelDate: "October 10th, 2025",
      pnr: "JK5678",
      flightInfo: {
        airline: "IndiGo Airlines",
        aircraft: "A320",
        departCity: "New Delhi",
        departCode: "DEL",
        departTime: "08:10 AM",
        arriveCity: "Mumbai",
        arriveCode: "BOM",
        arriveTime: "10:05 AM",
        duration: "1h 55m",
        stops: "0 Stops",
      },
    }),
    [],
  );

  const owners: BookingOwner[] = useMemo(() => {
    const names = ["Aastha Sharma", "Akash Kumar", "Saurav Raj", "Varun Gupta"];

    return names.map((full) => ({
      full,
      short: computeInitials(full),
      color: getOwnerAvatarColorClass(full),
    }));
  }, []);

  const bookingLog = useMemo(
    () => [
      {
        title: "Booking confirmed",
        meta: "Status updated to Booking Confirmed",
        by: "Akash Kumar",
        at: "10 Oct 2025 • 11:12 AM",
      },
      {
        title: "PNR added",
        meta: "PNR set to JK5678",
        by: "Aastha Sharma",
        at: "09 Sep 2025 • 06:40 PM",
      },
      {
        title: "Flight details updated",
        meta: "Departure time updated to 08:10 AM",
        by: "Saurav Raj",
        at: "09 Sep 2025 • 04:05 PM",
      },
      {
        title: "Booking created",
        meta: "Draft booking created for customer",
        by: "Varun Gupta",
        at: "09 Sep 2025 • 12:20 PM",
      },
    ],
    [],
  );

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = tabOptions.indexOf(activeTab);
      const activeEl = tabRefs.current[activeIndex];
      const container = tabsContainerRef.current;
      if (!activeEl || !container) return;

      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        width: activeRect.width,
        left: activeRect.left - containerRect.left,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabOptions]);

  const travellerData = useMemo(
    () => ({
      lead: {
        name: "Mr. Vijay Shekhawat",
        phone: "+91-9878987657",
        email: "vijay.s@gmail.com",
      },
      others: [
        {
          name: "Ms. Riya Sharma",
          phone: "+91-9878901234",
          email: "riya.s@gmail.com",
        },
        {
          name: "Mr. Aditya Verma",
          phone: "+91-9899912345",
          email: "aditya.v@gmail.com",
        },
      ],
    }),
    [],
  );

  const customerData = useMemo(
    () => ({
      name: "Cooncierge Demo Customer",
      phone: "+91-9000000001",
      email: "customer@demo.com",
    }),
    [],
  );

  const vendorData = useMemo(
    () => ({
      name: "Skyline Travels (Vendor)",
      phone: "+91-9000000002",
      email: "vendor@demo.com",
    }),
    [],
  );

  const renderProfileCard = (
    label: string,
    name: string,
    phone: string,
    email: string,
  ) => {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-[12px] border border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E8F9F7] border border-green-700 flex items-center justify-center">
            <FiUser className="text-green-700" size={16} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[14px] font-semibold text-[#020202]">
              {name}
            </div>
            <div className="text-[12px] text-gray-500">({label})</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-gray-700">
          <div className="flex items-center gap-2 text-[13px]">
            <FiPhoneCall className="text-gray-500" />
            <span className="text-gray-700">{phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <FiMail className="text-gray-500" />
            <span className="text-gray-700">{email}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* OUTER CARD */}
      <div className="bg-white rounded-[8px] shadow px-[18px] py-[18px] mb-5 w-full border border-gray-100">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[18px] font-semibold text-[#020202]">
                View Booking <span className="font-semibold">|</span>{" "}
                <span className="font-semibold">{booking.id}</span>
              </h1>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">
              View and track booking details here
            </p>
          </div>

          <button
            type="button"
            className="w-9 h-9 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50"
            aria-label="More actions"
          >
            <HiOutlineDotsHorizontal size={18} />
          </button>
        </div>

        <div className="border-t border-gray-200 my-4" />

        {/* TABS + ACTIONS ROW */}
        <div className="flex items-center justify-between gap-4">
          {/* Tabs */}
          <div
            className="flex items-center bg-[#F3F3F3] gap-[20px] rounded-[10px] relative p-1"
            ref={tabsContainerRef}
          >
            <div
              className="absolute h-[calc(100%-0.60rem)] bg-[#0D4B37] rounded-[8px]
							 shadow-sm transition-all duration-300 ease-in-out
							 top-1/2 -translate-y-1/2"
              style={{
                width:
                  indicatorStyle.width > 0
                    ? `${indicatorStyle.width}px`
                    : `calc((100% - 1.25rem) / ${tabOptions.length})`,
                left: `${indicatorStyle.left}px`,
              }}
            />

            {tabOptions.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 px-[14px] py-[6px] rounded-[8px] text-[14px] font-medium transition-colors duration-300 flex-1 whitespace-nowrap ${
                  activeTab === tab
                    ? "text-white"
                    : "text-[#818181] hover:text-gray-900"
                }`}
                ref={(el) => {
                  tabRefs.current[idx] = el;
                }}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-700 tracking-wide">
                BOOKING OWNERS :
              </span>
              <div className="flex items-center">
                {owners.map((o) => (
                  <AvatarTooltip
                    key={o.full}
                    short={o.short}
                    full={o.full}
                    color={o.color}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="relative w-11 h-10 rounded-[8px] border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
              aria-label="Tasks"
            >
              <TbClipboardText size={20} className="text-[#0D4B37]" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center">
                1
              </span>
            </button>

            <button
              type="button"
              className="flex items-center text-[14px] cursor-pointer gap-[8px] px-[16px] py-[9px] rounded-[8px] bg-[#0D4B37] text-white font-[500] hover:bg-[#0B3E2E]"
            >
              + Task
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "Booking Info" ? (
            <div className="space-y-4">
              {/* SERVICE SUMMARY CARD */}
              <div className="rounded-[10px] border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-[#0D4B37] to-[#2A7C5A] px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-white text-[18px] font-semibold">
                      {booking.service}
                    </h2>
                    <span className="text-white/85">|</span>
                    <span className="text-white text-[16px] font-semibold">
                      {booking.route}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 bg-white/10 text-white text-[12px] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    {booking.status}
                  </span>
                </div>

                <div className="bg-white px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
                      BOOKING DATE
                    </div>
                    <div className="text-[18px] text-[#2B2B2B] font-semibold">
                      {booking.bookingDate}
                    </div>
                  </div>
                  <div className="md:text-center">
                    <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
                      TRAVEL DATE
                    </div>
                    <div className="text-[18px] text-[#2B2B2B] font-semibold">
                      {booking.travelDate}
                    </div>
                  </div>
                  <div className="md:text-right">
                    <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
                      CONFIRMATION NO. (PNR)
                    </div>
                    <div className="text-[18px] text-[#2B2B2B] font-semibold">
                      {booking.pnr}
                    </div>
                  </div>
                </div>
              </div>

              {/* FLIGHT INFO */}
              <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between">
                  <h3 className="text-[16px] font-semibold text-[#020202]">
                    Flight Info
                  </h3>
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-[8px]"
                  >
                    View More Details →
                  </button>
                </div>
                <div className="border-t border-gray-200" />

                <div className="px-5 py-5 grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  <div className="lg:col-span-1">
                    <div className="text-[12px] text-gray-400 font-semibold tracking-wide mb-1">
                      FLIGHT
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[#F3F3F3] border border-gray-200 flex items-center justify-center">
                        <Image
                          src="/icons/service-icons/flight.svg"
                          width={18}
                          height={18}
                          alt="flight"
                        />
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-[#020202]">
                          {booking.flightInfo.airline}
                        </div>
                        <div className="text-[13px] text-gray-500">
                          {booking.flightInfo.aircraft}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="text-[12px] text-gray-400 font-semibold tracking-wide mb-1">
                      DEPART
                    </div>
                    <div className="text-[14px] font-semibold text-[#020202]">
                      {booking.flightInfo.departCity} (
                      {booking.flightInfo.departCode})
                    </div>
                    <div className="text-[13px] text-gray-600 mt-1">
                      {booking.flightInfo.departTime}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <div className="text-[12px] text-gray-400 font-semibold tracking-wide mb-1">
                      ARRIVE
                    </div>
                    <div className="text-[14px] font-semibold text-[#020202]">
                      {booking.flightInfo.arriveCity} (
                      {booking.flightInfo.arriveCode})
                    </div>
                    <div className="text-[13px] text-gray-600 mt-1">
                      {booking.flightInfo.arriveTime}
                    </div>
                  </div>

                  <div className="lg:col-span-1 lg:text-right">
                    <div className="text-[12px] text-gray-400 font-semibold tracking-wide mb-1">
                      DURATION/STOPS
                    </div>
                    <div className="text-[14px] font-semibold text-[#020202]">
                      {booking.flightInfo.duration}
                      <span className="text-gray-300 mx-2">|</span>
                      {booking.flightInfo.stops}
                    </div>
                  </div>
                </div>
              </div>

              {/* TRAVELLER / CUSTOMER / VENDOR */}
              <div className="rounded-[12px] border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-4">
                  {/* Tabs (same UI as FlightServiceInfoForm) */}
                  <div className="inline-flex mb-3 rounded-lg border border-gray-200">
                    {profileTabs.map((type) => (
                      <button
                        key={type}
                        onClick={() => setActiveProfileTab(type)}
                        className={`px-3 py-1.5 text-[0.7rem] font-medium transition-colors rounded-lg
        ${
          activeProfileTab === type
            ? "bg-[#E8F9F7] text-green-700 font-semibold border border-green-700"
            : "bg-transparent text-gray-700"
        }`}
                        type="button"
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Content */}
                  {activeProfileTab === "Traveller" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {renderProfileCard(
                          "Lead Pax",
                          travellerData.lead.name,
                          travellerData.lead.phone,
                          travellerData.lead.email,
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-[14px] font-semibold text-[#020202]">
                          All Travellers ({1 + travellerData.others.length})
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsTravellersExpanded((p) => !p)}
                          className="w-9 h-9 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                          aria-label="Toggle travellers"
                        >
                          <FiChevronDown
                            className={`transition-transform ${
                              isTravellersExpanded ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>
                      </div>

                      {isTravellersExpanded && (
                        <div className="space-y-2">
                          {[travellerData.lead, ...travellerData.others].map(
                            (t, idx) => (
                              <div key={`${t.email}-${idx}`}>
                                {renderProfileCard(
                                  idx === 0
                                    ? "Lead Pax"
                                    : `Traveller ${idx + 1}`,
                                  t.name,
                                  t.phone,
                                  t.email,
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeProfileTab === "Customer" && (
                    <div className="space-y-3">
                      {renderProfileCard(
                        "Primary Contact",
                        customerData.name,
                        customerData.phone,
                        customerData.email,
                      )}
                    </div>
                  )}

                  {activeProfileTab === "Vendor" && (
                    <div className="space-y-3">
                      {renderProfileCard(
                        "Primary Contact",
                        vendorData.name,
                        vendorData.phone,
                        vendorData.email,
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* REMARKS */}
              <div className="rounded-[12px] border border-gray-200 bg-white overflow-hidden">
                <div className="px-5 py-4">
                  <h3 className="text-[16px] font-semibold text-[#020202]">
                    Remarks
                  </h3>
                </div>
                <div className="border-t border-gray-200" />
                <div className="p-5">
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter Remarks"
                    className="w-full min-h-[120px] text-[13px] py-3 px-4 rounded-[10px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900 text-gray-700 bg-white"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#020202]">
                  Booking Log
                </h3>
                <div className="text-[13px] text-gray-500">
                  Latest updates for this booking
                </div>
              </div>
              <div className="border-t border-gray-200" />

              <div className="p-5">
                <div className="space-y-3">
                  {bookingLog.map((item, idx) => (
                    <div
                      key={`${item.title}-${idx}`}
                      className="flex gap-4 rounded-[10px] border border-gray-200 bg-white px-4 py-3"
                    >
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0D4B37]" />
                        <div className="w-px flex-1 bg-gray-200 mt-2" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[14px] font-semibold text-[#020202]">
                              {item.title}
                            </div>
                            <div className="text-[13px] text-gray-600 mt-0.5">
                              {item.meta}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[12px] text-gray-500">
                              {item.at}
                            </div>
                            <div className="text-[12px] text-gray-700 font-semibold">
                              {item.by}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewBookingPage;
