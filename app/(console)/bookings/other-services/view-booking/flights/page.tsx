"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TbClipboardText } from "react-icons/tb";
import LogsUI from "@/components/LogsUI";
import dynamic from "next/dynamic";
import { FiArrowRight } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import AvatarTooltip from "@/components/AvatarToolTip";
import { formatServiceType, getOwnerAvatarColorClass } from "@/utils/helper";
import BookingPeopleAndRemarks from "@/components/BookingPeopleAndRemarks";
import ActionMenu from "@/components/Menus/ActionMenu";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import { BookingApiService } from "@/services/bookingApi";
import SidesheetSkeleton from "@/components/skeletons/SidesheetSkeleton";

const BookingFormSidesheet = dynamic(
  () => import("@/components/BookingFormSidesheet"),
  {
    loading: () => <SidesheetSkeleton />,
    ssr: false,
  },
);

type BookingOwner = {
  full: string;
  short: string;
  color: string;
};

type Party = {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  contactPerson?: string;
};

type Quotation = {
  _id: string;
  customId?: string;
  quotationType?: string;
  createdAt?: string;
  travelDate?: string;
  status?: string;
  serviceStatus?: string;
  remarks?: string;
  formFields?: Record<string, any>;
  customerId?: Party;
  vendorId?: Party;
  primaryOwner?: Party;
  secondaryOwner?: Party[];
  adultTravelers?: Array<{ name?: string; email?: string; phone?: string }>;
  childTravelers?: Array<{ name?: string; email?: string; phone?: string }>;
};

const computeInitials = (name: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (first + last).toUpperCase();
};

const toTitleCase = (value: string) =>
  (value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const formatOrdinalDay = (day: number) => {
  const mod10 = day % 10;
  const mod100 = day % 100;
  if (mod10 === 1 && mod100 !== 11) return `${day}st`;
  if (mod10 === 2 && mod100 !== 12) return `${day}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${day}rd`;
  return `${day}th`;
};

const formatLongDate = (value?: string) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  const month = d.toLocaleString("en-US", { month: "long" });
  const day = formatOrdinalDay(d.getDate());
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
};

const pickFirst = (...values: Array<unknown>) => {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return "";
};

const inferRoute = (formFields?: Record<string, any>) => {
  const from = pickFirst(
    formFields?.from,
    formFields?.origin,
    formFields?.departure,
    formFields?.departureCity,
    formFields?.fromCity,
    formFields?.source,
  );
  const to = pickFirst(
    formFields?.to,
    formFields?.destination,
    formFields?.arrival,
    formFields?.arrivalCity,
    formFields?.toCity,
    formFields?.dest,
  );

  if (from && to) return `${from} – ${to}`;
  return pickFirst(formFields?.route, formFields?.sector, "--");
};

const inferBookingStatus = (q?: Quotation) => {
  const ff: any = q?.formFields;
  const normalized = pickFirst(ff?.bookingstatus, q?.status, q?.serviceStatus)
    .toLowerCase()
    .trim();
  if (normalized === "confirmed") return "Booking Confirmed";
  if (normalized === "cancelled" || normalized === "canceled")
    return "Booking Cancelled";
  if (normalized === "draft") return "Draft";
  if (normalized) return toTitleCase(normalized);
  return "--";
};

const FlightSummaryCard = ({
  service,
  route,
  status,
  bookingDate,
  travelDate,
  pnr,
}: {
  service: string;
  route: string;
  status: string;
  bookingDate: string;
  travelDate: string;
  pnr: string;
}) => {
  return (
    <div className="rounded-[10px] border border-gray-200 overflow-hidden bg-white">
      <div className="bg-gradient-to-r from-[#0D4B37] to-[#2A7C5A] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-white text-[18px] font-semibold">{service}</h2>
          <span className="text-white/85">|</span>
          <span className="text-white text-[16px] font-semibold">{route}</span>
        </div>

        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/40 bg-white/10 text-white text-[12px] font-semibold">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.415l-7.2 7.2a1 1 0 01-1.415 0l-3.2-3.2a1 1 0 011.415-1.415l2.493 2.493 6.493-6.493a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {status}
        </span>
      </div>

      <div className="bg-white px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
            BOOKING DATE
          </div>
          <div className="text-[18px] text-[#2B2B2B] font-semibold">
            {bookingDate}
          </div>
        </div>
        <div className="md:text-center">
          <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
            TRAVEL DATE
          </div>
          <div className="text-[18px] text-[#2B2B2B] font-semibold">
            {travelDate}
          </div>
        </div>
        <div className="md:text-right">
          <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
            CONFIRMATION NO. (PNR)
          </div>
          <div className="text-[18px] text-[#2B2B2B] font-semibold">{pnr}</div>
        </div>
      </div>
    </div>
  );
};

const FlightInfoCard = ({
  airline,
  aircraft,
  flightType,
  bookingStatus,
  flightNumber,
  cabinClass,
  departCity,
  departTime,
  arriveCity,
  arriveTime,
  duration,
  stops,
}: {
  airline: string;
  aircraft: string;
  flightType: string;
  bookingStatus: string;
  flightNumber: string;
  cabinClass: string;
  departCity: string;
  departTime: string;
  arriveCity: string;
  arriveTime: string;
  duration: string;
  stops: string;
}) => {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-[#020202]">
          Flight Info
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[#EFF6FF] text-[#0B5ED7] text-[13px] font-semibold hover:bg-[#DBEAFE]"
        >
          View More Details <FiArrowRight />
        </button>
      </div>

      <div className="border-t border-gray-200" />

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
              FLIGHT
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] border border-gray-200 bg-white flex items-center justify-center">
                <span className="text-[12px] font-bold text-[#0D4B37]">FL</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-[14px] font-semibold text-[#020202]">
                    {flightType || "--"}
                  </div>
                  <div className="text-[13px] text-gray-500">|</div>
                  <div className="text-[13px] text-gray-700 font-medium">
                    {bookingStatus || "--"}
                  </div>
                </div>
                <div className="mt-0.5 text-[12px] text-gray-600">
                  {flightNumber
                    ? `Flight No: ${flightNumber}`
                    : "Flight No: --"}
                  <span className="text-gray-400"> | </span>
                  {cabinClass ? `Cabin: ${cabinClass}` : "Cabin: --"}
                </div>
                {(airline !== "--" || aircraft !== "--") && (
                  <div className="mt-0.5 text-[12px] text-gray-600">
                    {airline !== "--" ? airline : ""}
                    {airline !== "--" && aircraft !== "--" ? " | " : ""}
                    {aircraft !== "--" ? aircraft : ""}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
              DEPART
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-[14px] font-semibold text-[#020202]">
                {departCity}
              </div>
              <div className="text-[13px] text-gray-500">|</div>
              <div className="text-[14px] font-semibold text-[#020202]">
                {departTime}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
              ARRIVE
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-[14px] font-semibold text-[#020202]">
                {arriveCity}
              </div>
              <div className="text-[13px] text-gray-500">|</div>
              <div className="text-[14px] font-semibold text-[#020202]">
                {arriveTime}
              </div>
            </div>
          </div>

          <div className="md:text-right">
            <div className="text-[12px] text-gray-400 font-semibold tracking-wide">
              DURATION/STOPS
            </div>
            <div className="mt-2 flex items-center md:justify-end gap-3">
              <div className="text-[14px] font-semibold text-[#020202]">
                {duration}
              </div>
              <div className="text-[13px] text-gray-500">|</div>
              <div className="text-[14px] font-semibold text-[#020202]">
                {stops}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FlightsViewBookingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cacheKeyFromUrl = searchParams.get("cacheKey") || "";
  const quotationIdFromUrl =
    searchParams.get("quotationId") || searchParams.get("id") || "";

  const tabOptions = useMemo(() => ["Booking Info", "Booking Log"], []);
  const [activeTab, setActiveTab] =
    useState<(typeof tabOptions)[number]>("Booking Info");

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [quotationError, setQuotationError] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetMode, setSideSheetMode] = useState<"view" | "edit">("edit");
  const [selectedService, setSelectedService] = useState<any>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadFromCache = () => {
      try {
        setIsLoadingQuotation(true);
        setQuotationError(null);

        if (cacheKeyFromUrl) {
          const raw = sessionStorage.getItem(cacheKeyFromUrl);
          if (raw) {
            setQuotation(JSON.parse(raw));
            return;
          }
        }

        if (quotationIdFromUrl) {
          const derivedKey = `os-flight-quotation:${quotationIdFromUrl}`;
          const raw = sessionStorage.getItem(derivedKey);
          if (raw) {
            setQuotation(JSON.parse(raw));
            return;
          }
        }

        setQuotationError(
          "Booking data not found. Please open this page from the bookings table.",
        );
      } catch (e) {
        console.error("Failed to load cached quotation:", e);
        setQuotationError("Failed to load booking data");
      } finally {
        setIsLoadingQuotation(false);
      }
    };

    loadFromCache();
  }, [cacheKeyFromUrl, quotationIdFromUrl]);

  const bookingId = useMemo(
    () => quotation?.customId || "",
    [quotation?.customId],
  );

  const handleEdit = () => {
    if (!quotation?._id) return;

    setSelectedService({
      id: quotation._id,
      title: formatServiceType(quotation.quotationType || "travel"),
      image: "",
      category: "travel",
      description: "",
    });

    setSideSheetMode("edit");
    setIsSideSheetOpen(true);
  };

  const handleDelete = () => {
    if (!quotation?._id) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!quotation?._id) return;
    try {
      setIsDeleting(true);
      await BookingApiService.deleteQuotation(quotation._id);

      try {
        if (cacheKeyFromUrl) sessionStorage.removeItem(cacheKeyFromUrl);
        if (quotationIdFromUrl) {
          sessionStorage.removeItem(
            `os-flight-quotation:${quotationIdFromUrl}`,
          );
        }
        sessionStorage.removeItem(`os-flight-quotation:${quotation._id}`);
      } catch (_) {}

      setIsDeleteModalOpen(false);
      router.push("/bookings/other-services");
    } catch (e) {
      console.error("Failed to delete quotation:", e);
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const owners: BookingOwner[] = useMemo(() => {
    const primary = quotation?.primaryOwner?.name
      ? [quotation.primaryOwner.name]
      : [];
    const secondary = Array.isArray(quotation?.secondaryOwner)
      ? quotation?.secondaryOwner.map((o) => o?.name).filter(Boolean)
      : [];
    const names = [...primary, ...secondary] as string[];

    return names.map((full) => ({
      full,
      short: computeInitials(full),
      color: getOwnerAvatarColorClass(full),
    }));
  }, [quotation]);

  const routeDisplay = useMemo(
    () => inferRoute(quotation?.formFields),
    [quotation?.formFields],
  );

  const statusDisplay = useMemo(
    () => inferBookingStatus(quotation ?? undefined),
    [quotation],
  );

  const bookingDateDisplay = useMemo(
    () =>
      formatLongDate(
        (quotation?.formFields as any)?.bookingdate || quotation?.createdAt,
      ),
    [quotation?.createdAt, quotation?.formFields],
  );
  const travelDateDisplay = useMemo(
    () =>
      formatLongDate(
        quotation?.travelDate || (quotation?.formFields as any)?.traveldate,
      ),
    [quotation?.travelDate, quotation?.formFields],
  );

  const pnr = useMemo(() => {
    const ff = quotation?.formFields;
    return (
      pickFirst(
        (ff as any)?.PNR,
        ff?.pnr,
        ff?.pnrNumber,
        ff?.pnrNo,
        ff?.confirmationNumber,
        ff?.confirmationNo,
      ) || "--"
    );
  }, [quotation?.formFields]);

  const flightInfo = useMemo(() => {
    const ff = quotation?.formFields;
    const firstSeg = Array.isArray((ff as any)?.segments)
      ? (ff as any).segments[0]
      : undefined;

    return {
      airline: pickFirst(ff?.airline, ff?.airlineName, ff?.carrier, "--"),
      aircraft: pickFirst(ff?.aircraft, ff?.aircraftType, ff?.equipment, "--"),
      flightType: pickFirst((ff as any)?.flightType, "--"),
      bookingStatus: pickFirst(
        (ff as any)?.bookingstatus,
        quotation?.status,
        "--",
      ),
      flightNumber: pickFirst(
        firstSeg?.flightnumber,
        (ff as any)?.flightnumber,
        "",
      ),
      cabinClass: pickFirst(firstSeg?.cabinclass, (ff as any)?.cabinclass, ""),
      departCity: pickFirst(
        ff?.departure,
        ff?.origin,
        ff?.from,
        ff?.departureCity,
        ff?.fromCity,
        "--",
      ),
      departTime: pickFirst(
        ff?.departureTime,
        ff?.departTime,
        ff?.fromTime,
        "--",
      ),
      arriveCity: pickFirst(
        ff?.destination,
        ff?.arrival,
        ff?.to,
        ff?.arrivalCity,
        ff?.toCity,
        "--",
      ),
      arriveTime: pickFirst(ff?.arrivalTime, ff?.arriveTime, ff?.toTime, "--"),
      duration: pickFirst(ff?.duration, ff?.flightDuration, "--"),
      stops: pickFirst(
        typeof ff?.stops === "number" ? String(ff.stops) : ff?.stops,
        ff?.stopCount,
        "--",
      ),
    };
  }, [quotation?.formFields]);

  const peopleProps = useMemo(() => {
    const q = quotation;
    const customer = q?.customerId;
    const vendor = q?.vendorId;

    const adultTravellers = Array.isArray(q?.adultTravelers)
      ? q?.adultTravelers
      : [];
    const childTravellers = Array.isArray(q?.childTravelers)
      ? q?.childTravelers
      : [];

    const travellersMerged = [...adultTravellers, ...childTravellers];
    const leadTraveller = travellersMerged[0];
    const otherTravellers = travellersMerged.slice(1);

    const leadFromTravellers = leadTraveller
      ? {
          name: leadTraveller?.name || "--",
          phone: leadTraveller?.phone || "--",
          email: leadTraveller?.email || "--",
        }
      : null;

    const leadName =
      customer?.name ||
      customer?.companyName ||
      customer?.contactPerson ||
      "--";
    const leadPhone = customer?.phone || "--";
    const leadEmail = customer?.email || "--";

    return {
      initialRemarks: q?.remarks || (q?.formFields as any)?.remarks || "",
      travellerData: {
        lead: leadFromTravellers ?? {
          name: leadName,
          phone: leadPhone,
          email: leadEmail,
        },
        others: otherTravellers.map((t) => ({
          name: t?.name || "--",
          phone: t?.phone || "--",
          email: t?.email || "--",
        })),
      },
      customerData: {
        name: customer?.name || customer?.companyName || "--",
        phone: customer?.phone || "--",
        email: customer?.email || "--",
      },
      vendorData: {
        name:
          vendor?.companyName || vendor?.contactPerson || vendor?.name || "--",
        phone: vendor?.phone || "--",
        email: vendor?.email || "--",
      },
    };
  }, [quotation]);

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

  return (
    <div className="w-full">
      <div className="bg-white rounded-[8px] shadow px-[18px] py-[18px] mb-5 w-full border border-gray-100">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[18px] font-semibold text-[#020202]">
                View Booking <span className="font-semibold">|</span>{" "}
                <span className="font-semibold">{bookingId || "--"}</span>
              </h1>
            </div>
            <p className="text-[13px] text-gray-500 mt-0.5">
              View and track booking details here
            </p>
          </div>

          <ActionMenu
            actions={[
              {
                label: "Edit",
                icon: <MdOutlineEdit />,
                color: "text-blue-600",
                onClick: handleEdit,
              },
              {
                label: "Delete",
                icon: <FaRegTrashAlt />,
                color: "text-red-600",
                onClick: handleDelete,
              },
            ]}
            width="w-32"
            right="right-0"
          />
        </div>

        <div className="border-t border-gray-200 my-4" />

        {/* TABS + ACTIONS ROW */}
        <div className="flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-gray-700 tracking-wide">
                BOOKING OWNERS :
              </span>
              <div className="flex items-center">
                {owners.length ? (
                  owners.map((o) => (
                    <AvatarTooltip
                      key={o.full}
                      short={o.short}
                      full={o.full}
                      color={o.color}
                    />
                  ))
                ) : (
                  <span className="text-[12px] text-gray-400">--</span>
                )}
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
          {isLoadingQuotation && (
            <div className="rounded-[10px] border border-gray-200 bg-white px-5 py-4 text-[13px] text-gray-600">
              Loading booking...
            </div>
          )}
          {!isLoadingQuotation && quotationError && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 px-5 py-4 text-[13px] text-red-700">
              {quotationError}
            </div>
          )}

          {activeTab === "Booking Info" ? (
            <div className="space-y-4">
              <FlightSummaryCard
                service="Flight"
                route={routeDisplay}
                status={statusDisplay}
                bookingDate={bookingDateDisplay}
                travelDate={travelDateDisplay}
                pnr={pnr}
              />

              <FlightInfoCard
                airline={flightInfo.airline}
                aircraft={flightInfo.aircraft}
                flightType={flightInfo.flightType}
                bookingStatus={flightInfo.bookingStatus}
                flightNumber={flightInfo.flightNumber}
                cabinClass={flightInfo.cabinClass}
                departCity={flightInfo.departCity}
                departTime={flightInfo.departTime}
                arriveCity={flightInfo.arriveCity}
                arriveTime={flightInfo.arriveTime}
                duration={flightInfo.duration}
                stops={
                  flightInfo.stops === "--" ? "--" : `${flightInfo.stops} Stops`
                }
              />

              <BookingPeopleAndRemarks
                initialRemarks={peopleProps.initialRemarks}
                travellerData={peopleProps.travellerData}
                customerData={peopleProps.customerData}
                vendorData={peopleProps.vendorData}
              />
            </div>
          ) : (
            <LogsUI
              logs={bookingLog}
              title="Booking Log"
              subtitle="Latest updates for this booking"
              entityLabel="Booking"
              entityId={bookingId || ""}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false);
        }}
        title="Do you want to delete this quotation?"
        confirmText={isDeleting ? "Deleting..." : "Yes, Delete"}
        cancelText="Cancel"
        confirmButtonColor="bg-red-600"
        onConfirm={confirmDelete}
      />

      <BookingFormSidesheet
        key={quotation?._id || "edit"}
        isOpen={isSideSheetOpen}
        onClose={() => setIsSideSheetOpen(false)}
        selectedService={selectedService}
        initialData={quotation}
        mode={sideSheetMode}
        bookingCode={quotation?.customId ?? ""}
      />
    </div>
  );
};

export default FlightsViewBookingPage;
