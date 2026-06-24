"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import ViewOneWayLayout from "./FlightLayouts/ViewOneWayLayout";
import ViewRoundTripLayout from "./FlightLayouts/ViewRoundTripLayout";
import ViewMultiCityLayout from "./FlightLayouts/ViewMultiCityLayout";
import AccommodationSegmentCard from "./AccommodationLayouts/AccommodationSegmentCard";
import AddServicesModal from "./components/AddServicesModal";
import LinkBookingModal from "./components/LinkBookingModal";
import OtherServiceLayoutUI from "./OtherServiceLayouts/OtherServiceLayoutUI";
import { FiSave } from "react-icons/fi";

import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowLeft } from "react-icons/md";

const defaultTabs = ["At a Glance", "Itinerary", "Flights", "Accommodations"];

type Props = {
  tabs?: string[];
  initial?: string;
  onChange?: (tab: string) => void;

  notRequiredDefault?: boolean;
  onNotRequiredChange?: (v: boolean) => void;

  linkLabel?: string;
  linkHref?: string;
  onLinkClick?: () => void;
};

const dedupe = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

const ProgressRing = ({ percent }: { percent: number }) => {
  const size = 44;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative w-[44px] h-[44px]">
      <svg width={size} height={size} className="block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F59E0B"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-[#0F172A]">
        {clamped}%
      </div>
    </div>
  );
};

const hasAnyFlightData = (formData: any) => {
  if (!formData) return false;

  const simpleFields = [
    "bookingdate",
    "traveldate",
    "costprice",
    "sellingprice",
    "PNR",
    "remarks",
  ];

  for (const field of simpleFields) {
    const value = (formData as any)[field];
    if (typeof value === "string" && value.trim() !== "") return true;
  }

  const segments = Array.isArray(formData.segments) ? formData.segments : [];
  const returnSegments = Array.isArray(formData.returnSegments)
    ? formData.returnSegments
    : [];

  const allSegments = [...segments, ...returnSegments];
  return allSegments.some((s) =>
    [s?.flightnumber, s?.traveldate, s?.cabinclass].some(
      (v) => typeof v === "string" && v.trim() !== "",
    ),
  );
};

export default function ViewBookingLayoutTabs({
  tabs = defaultTabs,
  initial,
  onChange,

  notRequiredDefault = false,
  onNotRequiredChange,

  linkLabel = "Link from Bookings - OS",
  linkHref,
  onLinkClick,
}: Props) {
  const id = useId();

  const serviceLabelMap: Record<string, string> = {
    visa: "Visas",
    insurance: "Insurance",
  };

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const hasBothServices = useMemo(
    () => ["visa", "insurance"].every((s) => selectedServices.includes(s)),
    [selectedServices],
  );

  const computedTabs = useMemo(() => {
    const base = tabs?.length ? tabs : defaultTabs;
    const serviceTabs = selectedServices
      .map((v) => serviceLabelMap[v] ?? v)
      .filter(Boolean);
    return dedupe([...base, ...serviceTabs]);
  }, [selectedServices, tabs]);

  const stepTabs = useMemo(() => computedTabs, [computedTabs]);
  const orderedTabs = useMemo(() => {
    // Prefer an order where Accommodations comes before Flights (so Accommodations is center)
    const desired = ["At a Glance", "Itinerary", "Accommodations", "Flights"];
    const present = stepTabs.slice();
    if (present.includes("Accommodations") && present.includes("Flights")) {
      const core = desired.filter((t) => present.includes(t));
      const extras = present.filter((t) => !desired.includes(t));
      return [...core, ...extras];
    }
    return present;
  }, [stepTabs]);
  const defaultActive = useMemo(
    () =>
      initial ??
      (stepTabs.includes("Flights") ? "Flights" : (stepTabs[0] ?? "")),
    [initial, stepTabs],
  );

  const [active, setActive] = useState<string>(defaultActive);
  const [notRequired, setNotRequired] = useState<boolean>(notRequiredDefault);

  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    () => new Set([defaultActive].filter(Boolean)),
  );
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isLinkBookingOpen, setIsLinkBookingOpen] = useState(false);

  // Navigation helpers
  const currentIndex = stepTabs.indexOf(active);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < stepTabs.length - 1;

  const goPrev = () => {
    if (!hasPrev) return;
    const prev = stepTabs[currentIndex - 1];
    if (!prev) return;
    handleTabClick(prev);
  };

  const goNext = () => {
    if (!hasNext) return;
    const next = stepTabs[currentIndex + 1];
    if (!next) return;
    handleTabClick(next);
  };

  const handleAddService = (services: string[]) => {
    const list = Array.isArray(services) ? services : [services as any];
    setSelectedServices((prev) => dedupe([...prev, ...list]));
  };

  // Local flight form state used to render the OneWayLayout inside the Flights tab.
  // This keeps the tab self-contained; the parent page can later pass shared state if desired.
  const [flightFormData, setFlightFormData] = useState<any>({
    bookingdate: "",
    traveldate: "",
    bookingstatus: "Confirmed",
    costprice: "",
    costCurrency: "INR",
    costRoe: "",
    costInr: "",
    costNotes: "",
    sellingprice: "",
    PNR: "",
    pnrEnabled: false,
    segments: [
      {
        id: Date.now().toString(),
        flightnumber: "",
        traveldate: "",
        cabinclass: "",
      },
    ],
    returnSegments: [],
    samePNRForAllSegments: false,
    sameVendorForAllFlights: false,
    flightType: "One Way",
    remarks: "",
  });

  const [accommodationFormData, setAccommodationFormData] = useState<any>({
    bookingdate: "",
    traveldate: "",
    bookingstatus: "Confirmed",
    sameVendorForAllHotels: false,
    segments: [
      {
        id: Date.now().toString(),
        hotelName: "",
        vendor: null,
        allTravellersCheckingIn: true,
        checkindate: "",
        checkintime: "",
        checkoutdate: "",
        checkouttime: "",
        accommodationType: "Hotel",
        confirmationNumber: "",
        pax: "",
        mealPlan: "",
        costprice: "",
        costCurrency: "INR",
        costRoe: "",
        costInr: "",
        costNotes: "",
      },
    ],
  });

  useEffect(() => {
    setActive(defaultActive);
    setVisitedTabs(new Set([defaultActive].filter(Boolean)));
    setCompletedTabs(new Set());
  }, [defaultActive]);

  useEffect(() => {
    setNotRequired(Boolean(notRequiredDefault));
  }, [notRequiredDefault]);

  const totalSteps = stepTabs.length || 1;

  const stepsCompletedCount = useMemo(() => {
    // Only count completions that correspond to visible steps
    let count = 0;
    for (const t of stepTabs) if (completedTabs.has(t)) count += 1;
    return count;
  }, [completedTabs, stepTabs]);

  const completionPercent = useMemo(() => {
    if (!totalSteps) return 0;
    return Math.round((stepsCompletedCount / totalSteps) * 100);
  }, [stepsCompletedCount, totalSteps]);

  const markTabCompleteIfEligible = (tab: string) => {
    if (!tab) return;

    const eligible =
      tab === "Flights"
        ? hasAnyFlightData(flightFormData)
        : visitedTabs.has(tab);

    if (!eligible) return;
    setCompletedTabs((prev) => {
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  };

  const handleTabClick = (nextTab: string) => {
    if (!nextTab || nextTab === active) return;

    // Treat leaving the current step as completing it (when eligible)
    markTabCompleteIfEligible(active);

    setActive(nextTab);
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(nextTab);
      return next;
    });
    onChange?.(nextTab);
  };

  return (
    <div className="w-full rounded-[12px] border border-gray-200 bg-white overflow-hidden">
      {/* Tabs Row: centered tabs with equal spacing; Add Service sits at the far right */}
      <div className="flex w-full items-center">
        <div className="flex flex-1">
          {orderedTabs.map((t, idx) => {
            const isCompleted = completedTabs.has(t);
            const isCurrent = active === t;

            const textClass = isCompleted
              ? "text-green-600"
              : isCurrent
                ? "text-orange-500"
                : "text-gray-400";

            const badgeClass = isCompleted
              ? "bg-green-100 text-green-600"
              : isCurrent
                ? "bg-orange-100 text-orange-500"
                : "bg-gray-100 text-gray-400";

            return (
              <div key={t} className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleTabClick(t)}
                  className={
                    "inline-flex items-center px-4 py-3.5 text-[15px] font-medium border-b-2 transition-colors gap-3 min-w-0 justify-center " +
                    (isCurrent
                      ? "border-orange-500"
                      : "border-transparent hover:text-gray-900")
                  }
                  aria-current={isCurrent ? "page" : undefined}
                  title={t}
                >
                  <span
                    className={
                      "w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-semibold flex-none " +
                      badgeClass
                    }
                  >
                    {idx + 1}
                  </span>
                  <span className={"truncate " + textClass}>{t}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mr-4">
          {!hasBothServices && (
            <button
              type="button"
              className="px-4 py-1.5 rounded-md text-white text-[14px] font-medium shadow"
              style={{ backgroundColor: "#126ACB" }}
              onClick={() => setIsAddServiceOpen(true)}
            >
              + Add Service
            </button>
          )}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        {/* Left: link */}
        <div className="min-w-[220px]">
          {linkLabel ? (
            linkHref ? (
              <a
                href={linkHref}
                className="text-[14px] text-blue-600 underline font-medium"
              >
                {linkLabel}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onLinkClick) {
                    onLinkClick();
                    return;
                  }
                  setIsLinkBookingOpen(true);
                }}
                className="text-[14px] text-blue-600 underline font-medium"
              >
                {linkLabel}
              </button>
            )
          ) : null}
        </div>

        {/* Middle: progress */}
        <div className="flex items-center gap-3 justify-center flex-1">
          <ProgressRing percent={completionPercent} />
          <div className="rounded-[8px] bg-[#FFF3E0] px-3 py-2 text-[14px] font-medium text-[#1F2937]">
            {stepsCompletedCount}/{totalSteps} Steps Completed
          </div>
        </div>

        {/* Right: Not Required */}
        <label className="flex items-center gap-2 cursor-pointer select-none min-w-[220px] justify-end">
          <input
            type="checkbox"
            id={`${id}-not-required`}
            className="hidden"
            checked={notRequired}
            onChange={() => {
              const next = !notRequired;
              setNotRequired(next);
              onNotRequiredChange?.(next);
            }}
          />
          <span
            className={
              "w-5 h-5 border border-gray-300 rounded-sm flex items-center justify-center " +
              (notRequired ? "bg-green-600 border-green-600" : "bg-white")
            }
            aria-hidden
          >
            {notRequired ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="11"
                viewBox="0 0 12 11"
                fill="none"
              >
                <path
                  d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : null}
          </span>
          <span className="text-[14px] text-gray-700">Not Required</span>
        </label>
      </div>

      {/* Tab Panels */}
      <div className="px-6 pb-6">
        {active === "Flights" ? (
          <>
            {/* Flight Type Tabs (match FlightServiceInfoForm) */}
            <div className="inline-flex mb-3 ml-2 rounded-lg border border-gray-200">
              {(["One Way", "Round Trip", "Multi-City"] as const).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      setFlightFormData((prev: any) => ({
                        ...prev,
                        flightType: type,
                        ...(type === "Round Trip" &&
                        (!Array.isArray(prev.returnSegments) ||
                          prev.returnSegments.length === 0)
                          ? {
                              returnSegments: [
                                {
                                  id: `return-${Date.now()}`,
                                  flightnumber: "",
                                  traveldate: "",
                                  cabinclass: "",
                                },
                              ],
                            }
                          : null),
                      }))
                    }
                    className={`px-3 py-1.5 text-[0.7rem] font-medium transition-colors rounded-lg
        ${
          flightFormData.flightType === type
            ? "bg-[#E8F9F7] text-green-700 font-semibold border border-green-700"
            : "bg-transparent text-gray-700"
        }`}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>

            {flightFormData.flightType === "One Way" ? (
              <ViewOneWayLayout
                formData={flightFormData}
                setFormData={setFlightFormData}
              />
            ) : flightFormData.flightType === "Round Trip" ? (
              <ViewRoundTripLayout
                formData={flightFormData}
                setFormData={setFlightFormData}
              />
            ) : flightFormData.flightType === "Multi-City" ? (
              <ViewMultiCityLayout
                formData={flightFormData}
                setFormData={setFlightFormData}
              />
            ) : (
              <div className="ml-2 text-[13px] text-gray-500">
                {flightFormData.flightType} view coming soon.
              </div>
            )}
          </>
        ) : active === "Accommodations" ? (
          <AccommodationSegmentCard
            formData={accommodationFormData}
            setFormData={setAccommodationFormData}
          />
        ) : active === "Visas" ? (
          <div className="ml-2">
            <OtherServiceLayoutUI
              externalFormData={{}}
              onFormDataUpdate={() => {}}
              isReadOnly={false}
            />
          </div>
        ) : active === "Insurance" ? (
          <div className="ml-2">
            <OtherServiceLayoutUI
              externalFormData={{}}
              onFormDataUpdate={() => {}}
              isReadOnly={false}
            />
          </div>
        ) : (
          <div className="text-gray-600 py-4">
            {/* Other tab content can be added here */}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 bg-white">
        {/* Prev / Next arrows */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={!hasPrev}
            className={`w-6 h-6 rounded-full flex items-center justify-center border shadow
        ${
          hasPrev
            ? "border-gray-300 hover:bg-gray-100 text-gray-400"
            : "border-gray-200 text-gray-300 cursor-not-allowed"
        }
      `}
            title="Previous"
          >
            <MdKeyboardArrowLeft size={20} />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!hasNext}
            className={`w-6 h-6 rounded-full flex items-center justify-center border shadow
        ${
          hasNext
            ? "border-gray-300 hover:bg-gray-100 text-gray-400"
            : "border-gray-200 text-gray-300 cursor-not-allowed"
        }
      `}
            title="Next"
          >
            <MdKeyboardArrowRight size={20} />
          </button>
        </div>

        {/* Save actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              console.log("Save as Draft clicked");
              // TODO: draft save logic
            }}
            className="px-3 py-1.5 text-[13px] rounded-md border border-[#0D4B37] text-[#0D4B37] font-medium hover:bg-emerald-50 transition"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => {
              console.log("Save clicked");
              // TODO: final save logic
            }}
            className="px-3 py-1.5 text-[13px] rounded-md bg-[#0D4B37] text-white font-medium hover:bg-emerald-600 transition flex items-center gap-2"
          >
            <FiSave /> Save
          </button>
        </div>
      </div>

      <AddServicesModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        defaultValue={selectedServices}
        onAdd={(svc) => {
          handleAddService(svc);
          setIsAddServiceOpen(false);
        }}
      />

      <LinkBookingModal
        isOpen={isLinkBookingOpen}
        onClose={() => setIsLinkBookingOpen(false)}
        selectedServiceLabel={linkLabel}
        onLink={(ids) => {
          // TODO: replace with actual link API call when available
          console.log("Link bookings:", ids);
          setIsLinkBookingOpen(false);
        }}
      />
    </div>
  );
}
