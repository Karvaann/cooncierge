"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TbClipboardText } from "react-icons/tb";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import LogsUI from "@/components/LogsUI";
import { FiEdit2, FiUser } from "react-icons/fi";
import { IoCalendarClearOutline, IoLocationSharp } from "react-icons/io5";
import AvatarTooltip from "@/components/AvatarToolTip";
import { getOwnerAvatarColorClass } from "@/utils/helper";
import ViewItineraryDetailsAccordian from "@/components/accordians/ViewItineraryDetailsAccordian";
import SelectedPackageCard from "@/components/SelectedPackageCard";
import RouteCard from "@/components/RouteCard";
import ViewBookingLayoutTabs from "@/components/viewBookingLayouts/ViewBookingLayoutTabs";
import ModifySearchModal from "@/components/Modals/ModifySearchModal";
import Button from "@/components/Button";
import ErrorToast from "@/components/ErrorToast";
import { useLimitlessDraft } from "@/context/LimitlessDraftContext";
import LimitlessApi from "@/services/limitlessApi";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { TbEdit } from "react-icons/tb";

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

const computeNightsDaysDisplay = (start?: string, end?: string) => {
  const parseToUTC = (s?: string) => {
    if (!s || typeof s !== "string") return null;

    if (s.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return null;
      return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const parts = s.includes("-") ? s.split("-") : s.split("/");
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    const day = Number(dd);
    const monthIndex = Number(mm) - 1;
    const year = Number(yyyy);
    if (Number.isNaN(day) || Number.isNaN(monthIndex) || Number.isNaN(year))
      return null;
    return Date.UTC(year, monthIndex, day);
  };

  const startUtc = parseToUTC(start);
  const endUtc = parseToUTC(end);
  if (startUtc === null || endUtc === null) {
    return {
      nights: null as number | null,
      days: null as number | null,
      display: "",
    };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((endUtc - startUtc) / msPerDay);
  const nights = Math.max(0, diffDays);
  const days = nights + 1;
  return { nights, days, display: `${nights}N/${days}D` };
};

const formatToDDMMYYYY = (value?: string) => {
  if (!value) return "";

  // If it's ISO (SingleCalendar) or YYYY-MM-DD, format with Date
  if (value.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return value;
};

const TravelDatesSummaryCard = ({
  destination,
  startDate,
  endDate,
  nightsLabel,
  travellersCount,
  onEdit,
}: {
  destination: string;
  startDate: string;
  endDate: string;
  nightsLabel: string;
  travellersCount?: number;
  onEdit?: () => void;
}) => {
  return (
    <div
      className="rounded-[12px] border border-gray-200 px-5 py-4 shadow-sm w-full"
      style={{ background: "linear-gradient(90deg, #FFF8E5 0%, #FFFCF5 100%)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-5">
          <div className="flex items-center -mt-1 gap-2 -ml-1">
            <div className="w-8 h-8 rounded-full bg-[#FFEAD1] flex items-center justify-center">
              <IoLocationSharp className="text-[#DC6601]" size={16} />
            </div>
            <div className="text-[16px] font-semibold text-[#DC6601] truncate">
              {destination}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[15px] text-[#020202] font-medium">
              <IoCalendarClearOutline className="text-[#020202]" size={18} />
              <span>{startDate}</span>
              <span className="text-gray-400 font-medium">→</span>
              <span>{endDate}</span>
            </div>

            <div className="hidden sm:block w-px h-6 bg-gray-300" />

            <div className="text-[15px] text-[#020202] font-medium">
              {nightsLabel}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <button
            type="button"
            className="w-9 h-9 rounded-[10px] border border-gray-200 bg-[#F3F4F6] flex items-center justify-center hover:bg-gray-200"
            aria-label="Edit travel dates"
            onClick={onEdit}
          >
            <TbEdit className="text-blue-600" size={19} />
          </button>

          {typeof travellersCount === "number" && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#F3E8FF] flex items-center justify-center">
                <FiUser className="text-[#7C3AED]" size={18} />
              </div>
              <div className="text-[14px] text-gray-600">
                <span className="font-semibold text-[#020202]">
                  {travellersCount}
                </span>{" "}
                Travellers
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ViewBookingPage = () => {
  const { user } = useAuth();
  const { draft, clearDraft } = useLimitlessDraft();
  const tabOptions = useMemo(() => ["Booking Info", "Booking Log"], []);
  const [activeTab, setActiveTab] =
    useState<(typeof tabOptions)[number]>("Booking Info");

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  const router = useRouter();

  const bookingId = useMemo(
    () => draft?.bookingCode || "OS-ABC12",
    [draft?.bookingCode],
  );

  // These should come from the user's selected dates (fallback to dummy)
  const [travelStartDate, setTravelStartDate] = useState<string>(() =>
    new Date(2025, 4, 5).toISOString(),
  );
  const [travelEndDate, setTravelEndDate] = useState<string>(() =>
    new Date(2025, 4, 12).toISOString(),
  );

  const [isModifySearchOpen, setIsModifySearchOpen] = useState(false);

  const destination = useMemo(() => {
    const info = (draft?.formData as any)?.limitlessinfoform;
    const destinations = info?.limitlessDestinations;
    if (Array.isArray(destinations) && destinations.length) {
      return String(destinations[0] ?? "Dubai") || "Dubai";
    }
    return "Dubai";
  }, [draft]);

  useEffect(() => {
    const info = (draft?.formData as any)?.limitlessinfoform;
    if (!info) return;

    if (info.traveldatestart) setTravelStartDate(String(info.traveldatestart));
    if (info.traveldateend) setTravelEndDate(String(info.traveldateend));
  }, [draft]);
  const { nights, display: nightsDaysDisplay } = useMemo(
    () => computeNightsDaysDisplay(travelStartDate, travelEndDate),
    [travelStartDate, travelEndDate],
  );

  const [isSaving, setIsSaving] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastBgClass, setToastBgClass] = useState("bg-red-50");
  const [toastMessageColor, setToastMessageColor] = useState("text-red-600");
  const [toastBorderClass, setToastBorderClass] = useState("border-red-200");
  const [toastCloseBtnClass, setToastCloseBtnClass] = useState(
    "text-red-400 hover:text-red-600",
  );
  const [toastShowLabel, setToastShowLabel] = useState(true);

  const showError = (msg: string) => {
    setToastMessage(String(msg));
    setToastBgClass("bg-red-50");
    setToastMessageColor("text-red-600");
    setToastBorderClass("border-red-200");
    setToastCloseBtnClass("text-red-400 hover:text-red-600");
    setToastShowLabel(true);
    setToastVisible(true);
  };

  const showSuccess = (msg: string) => {
    setToastMessage(String(msg));
    setToastBgClass("bg-green-50");
    setToastMessageColor("text-green-800");
    setToastBorderClass("border-green-200");
    setToastCloseBtnClass("text-green-600 hover:text-green-800");
    setToastShowLabel(false);
    setToastVisible(true);
  };

  const handleSaveAndUpdate = async () => {
    if (!draft) {
      showError(
        "No Limitless draft data found. Please fill the Limitless form first.",
      );
      return;
    }

    try {
      setIsSaving(true);

      const isValidObjectId = (value: unknown): boolean => {
        if (typeof value !== "string") return false;
        const v = value.trim();
        return /^[a-f\d]{24}$/i.test(v);
      };

      const extractObjectId = (value: unknown): string | null => {
        if (!value) return null;
        if (typeof value === "string") {
          const v = value.trim();
          return isValidObjectId(v) ? v : null;
        }
        if (typeof value === "object") {
          const maybeId = (value as any)?._id ?? (value as any)?.id;
          if (typeof maybeId === "string") {
            const v = maybeId.trim();
            return isValidObjectId(v) ? v : null;
          }
        }
        return null;
      };

      const appendIfPresent = (fd: FormData, key: string, value: unknown) => {
        if (value === undefined || value === null) return;
        const str = String(value);
        if (!str.trim()) return;
        fd.append(key, str);
      };

      const sanitizeObjectIdList = (ids: unknown): string[] => {
        if (!Array.isArray(ids)) return [];
        return (ids as unknown[])
          .map((id) => extractObjectId(id))
          .filter((id): id is string => Boolean(id));
      };

      const info = (draft.formData as any)?.limitlessinfoform || {};

      const formDataPayload = new FormData();

      // Required identifiers
      appendIfPresent(
        formDataPayload,
        "customId",
        draft.bookingCode || info.customId || (draft.formData as any)?.customId,
      );

      // Service status
      const isBookingMaker = Boolean((user as any)?.isBookingMaker);
      formDataPayload.append(
        "serviceStatus",
        isBookingMaker ? "pending" : "approved",
      );

      // Required fields when serviceStatus !== 'draft'
      appendIfPresent(formDataPayload, "totalAmount", info.sellingprice);
      appendIfPresent(formDataPayload, "travelDate", info.traveldatestart);

      // Optional fields
      appendIfPresent(formDataPayload, "bookingDate", info.bookingdate);
      appendIfPresent(formDataPayload, "roe", info.sellingRoe);
      appendIfPresent(formDataPayload, "currency", info.sellingCurrency);
      appendIfPresent(formDataPayload, "limitlessTitle", info.itineraryname);
      appendIfPresent(formDataPayload, "description", info.description);
      appendIfPresent(formDataPayload, "remarks", info.remarks);

      // Customer + owners (IDs)
      const customerId = extractObjectId((draft.formData as any)?.customer);
      if (customerId)
        appendIfPresent(formDataPayload, "customerId", customerId);

      const primaryOwner = extractObjectId(
        (draft.formData as any)?.bookingOwner,
      );
      if (primaryOwner)
        appendIfPresent(formDataPayload, "primaryOwner", primaryOwner);

      const secondaryOwnersRaw =
        (draft.formData as any)?.secondaryBookingOwners ??
        (draft.formData as any)?.secondaryBookingOwner;
      const secondaryOwners = Array.isArray(secondaryOwnersRaw)
        ? sanitizeObjectIdList(secondaryOwnersRaw)
        : extractObjectId(secondaryOwnersRaw)
          ? [extractObjectId(secondaryOwnersRaw)!]
          : [];
      if (secondaryOwners.length) {
        formDataPayload.append(
          "secondaryOwner",
          JSON.stringify(secondaryOwners),
        );
      }

      // Travellers
      const adultsCountRaw = (draft.formData as any)?.adults;
      const childrenCountRaw = (draft.formData as any)?.children;
      const infantsCountRaw = (draft.formData as any)?.infants;

      const adultsCount = Number(adultsCountRaw || 0);
      const childrenCount = Number(childrenCountRaw || 0);
      const infantsCount = Number(infantsCountRaw || 0);

      if (!Number.isNaN(adultsCount)) {
        appendIfPresent(formDataPayload, "adultNumber", adultsCount);
      }
      const childNumber = childrenCount + infantsCount;
      appendIfPresent(formDataPayload, "childNumber", childNumber);

      const adultTravellerIds = sanitizeObjectIdList(
        (draft.formData as any)?.adultTravellerIds,
      );
      if (adultTravellerIds.length) {
        formDataPayload.append(
          "adultTravelers",
          JSON.stringify(adultTravellerIds),
        );
      }

      const childTravellerIds = sanitizeObjectIdList(
        (draft.formData as any)?.childTravellerIds ??
          (draft.formData as any)?.infantTravellerIds,
      );
      const childAges = Array.isArray((draft.formData as any)?.childAges)
        ? ((draft.formData as any)?.childAges as Array<number | null>)
        : [];
      if (childTravellerIds.length) {
        const childTravelers = childTravellerIds.map((id, idx) => {
          const ageCandidate = childAges[idx];
          const age =
            typeof ageCandidate === "number" ? ageCandidate : undefined;
          return age !== undefined ? { id, age } : { id };
        });
        formDataPayload.append(
          "childTravelers",
          JSON.stringify(childTravelers),
        );
      }

      // Destinations
      const destinations = Array.isArray(info?.limitlessDestinations)
        ? info.limitlessDestinations
        : Array.isArray((draft.formData as any)?.limitlessDestinations)
          ? (draft.formData as any)?.limitlessDestinations
          : [];
      if (destinations.length) {
        formDataPayload.append(
          "limitlessDestinations",
          JSON.stringify(destinations.map((d: any) => String(d))),
        );
      }

      // Documents (max 3)
      (draft.documents || []).slice(0, 3).forEach((file) => {
        formDataPayload.append("documents", file);
      });

      const response: any = await LimitlessApi.createLimitless(formDataPayload);

      if (response?.success) {
        const createdId =
          response?.limitless?.customId || response?.data?.customId;
        showSuccess(
          createdId
            ? `Saved Limitless booking: ${createdId}`
            : "Saved Limitless booking",
        );
        router.replace("/bookings/limitless");
        clearDraft();
        return;
      }

      showError(response?.message || "Failed to save Limitless booking");
    } catch (err) {
      console.error("Failed to save limitless booking:", err);
      showError(
        err instanceof Error ? err.message : "Failed to save Limitless booking",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const nightsLabel = useMemo(
    () => (typeof nights === "number" ? `${nights}N` : ""),
    [nights],
  );

  const travellersCount = useMemo(() => {
    if (!draft) return undefined;
    const adults = Number((draft.formData as any)?.adults || 0);
    const children = Number((draft.formData as any)?.children || 0);
    const infants = Number((draft.formData as any)?.infants || 0);
    const total =
      (Number.isNaN(adults) ? 0 : adults) +
      (Number.isNaN(children) ? 0 : children) +
      (Number.isNaN(infants) ? 0 : infants);
    return total > 0 ? total : undefined;
  }, [draft]);

  const travelStartDateDisplay = useMemo(
    () => formatToDDMMYYYY(travelStartDate),
    [travelStartDate],
  );
  const travelEndDateDisplay = useMemo(
    () => formatToDDMMYYYY(travelEndDate),
    [travelEndDate],
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

  return (
    <div className="w-full">
      <ErrorToast
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        bgColorClass={toastBgClass}
        messageColorClass={toastMessageColor}
        borderColorClass={toastBorderClass}
        closeButtonClass={toastCloseBtnClass}
        showLabel={toastShowLabel}
      />
      {/* OUTER CARD */}
      <div className="bg-white rounded-[8px] shadow px-[18px] py-[18px] mb-5 w-full border border-gray-100">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[16px] font-semibold text-[#020202]">
                View Booking <span className="font-semibold">|</span>{" "}
                <span className="font-semibold">{bookingId}</span>
              </h1>
            </div>
            <p className="text-[13px] text-gray-500 mt-1">
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
            <div className="flex flex-col 2xl:flex-row gap-4 items-start">
              <div
                className="flex flex-col gap-4"
                style={{ width: "1050px", maxWidth: "100%" }}
              >
                <ViewItineraryDetailsAccordian
                  owners={owners}
                  width={1050}
                  itinerary={{
                    destination,
                    startDate: travelStartDateDisplay,
                    endDate: travelEndDateDisplay,
                    nightsLabel: typeof nights === "number" ? `${nights}N` : "",
                  }}
                />

                <div>
                  <RouteCard
                    city="DEIRA"
                    onChangeRoute={() => {
                      // placeholder: open route change modal later
                      console.log("Change Route clicked");
                    }}
                  />
                  <div className="mt-3">
                    <ViewBookingLayoutTabs />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-[280px] w-full space-y-4">
                <TravelDatesSummaryCard
                  destination={destination}
                  startDate={travelStartDateDisplay}
                  endDate={travelEndDateDisplay}
                  nightsLabel={nightsLabel}
                  {...(typeof travellersCount === "number"
                    ? { travellersCount }
                    : {})}
                  onEdit={() => setIsModifySearchOpen(true)}
                />

                <SelectedPackageCard
                  itineraryName={
                    (draft?.formData as any)?.limitlessinfoform
                      ?.itineraryname || "ITINERARY ABC"
                  }
                  destination={destination}
                  startDate={travelStartDateDisplay}
                  endDate={travelEndDateDisplay}
                  nightsLabel={typeof nights === "number" ? `${nights}N` : "7N"}
                  totalNetPrice={Number(
                    (draft?.formData as any)?.limitlessinfoform?.sellingprice ||
                      12500,
                  )}
                />

                <div className="w-full">
                  <Button
                    text={isSaving ? "Saving..." : "Save & Update"}
                    bgColor="bg-[#0D4B37]"
                    width="w-full"
                    disabled={isSaving || !draft}
                    onClick={handleSaveAndUpdate}
                  />
                </div>
              </div>
            </div>
          ) : (
            <LogsUI
              logs={bookingLog}
              title="Booking Log"
              subtitle="Latest updates for this booking"
              entityLabel="Booking"
              entityId={bookingId}
            />
          )}
        </div>
      </div>

      <ModifySearchModal
        isOpen={isModifySearchOpen}
        onClose={() => setIsModifySearchOpen(false)}
        initialStartDate={travelStartDate}
        initialEndDate={travelEndDate}
        onApply={({ startDate, endDate }) => {
          setTravelStartDate(startDate);
          setTravelEndDate(endDate);
        }}
      />
    </div>
  );
};

export default ViewBookingPage;
