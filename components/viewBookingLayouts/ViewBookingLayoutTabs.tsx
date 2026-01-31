"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import OneWayLayout from "./FlightLayouts/ViewOneWayLayout";

const defaultTabs = [
  "At a Glance",
  "Itinerary",
  "Flights",
  "Accommodations",
  "Visas",
];

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

const clampToFive = (tabs: string[]) => tabs.slice(0, 5);

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

  const stepTabs = useMemo(() => clampToFive(tabs), [tabs]);
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

  // Local flight form state used to render the OneWayLayout inside the Flights tab.
  // This keeps the tab self-contained; the parent page can later pass shared state if desired.
  const [flightFormData, setFlightFormData] = useState<any>({
    bookingdate: "",
    traveldate: "",
    bookingstatus: "Confirmed",
    costprice: "",
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
    flightType: "One Way",
    remarks: "",
  });

  useEffect(() => {
    setActive(defaultActive);
    setVisitedTabs(new Set([defaultActive].filter(Boolean)));
    setCompletedTabs(new Set());
  }, [defaultActive]);

  useEffect(() => {
    setNotRequired(Boolean(notRequiredDefault));
  }, [notRequiredDefault]);

  const totalSteps = stepTabs.length || 5;

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
      {/* Tabs Row */}
      <div className="flex w-full">
        {stepTabs.map((t, idx) => {
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
            <button
              key={t}
              type="button"
              onClick={() => handleTabClick(t)}
              className={
                "flex-1 px-4 py-4 text-[16px] font-medium border-b-2 transition-colors flex items-center justify-center gap-3 min-w-0 " +
                (isCurrent
                  ? "border-orange-500"
                  : "border-transparent hover:text-gray-900")
              }
              aria-current={isCurrent ? "page" : undefined}
              title={t}
            >
              <span
                className={
                  "w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold flex-none " +
                  badgeClass
                }
              >
                {idx + 1}
              </span>
              <span className={"truncate " + textClass}>{t}</span>
            </button>
          );
        })}
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
                onClick={onLinkClick}
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
          <OneWayLayout
            formData={flightFormData}
            setFormData={setFlightFormData}
          />
        ) : (
          <div className="text-gray-600 py-4">
            {/* Other tab content can be added here */}
          </div>
        )}
      </div>
    </div>
  );
}
