"use client";

import React, { useEffect, useState } from "react";
import { FiMinusCircle } from "react-icons/fi";
import { MdKeyboardArrowDown, MdHotel } from "react-icons/md";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import VendorDropDown, {
  type VendorDataType,
} from "@/components/dropdowns/VendorDropDown";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import AdvancedPricingModal from "@/components/viewBookingLayouts/components/AdvancedPricingModal";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import { allowTextAndNumbers } from "@/utils/inputValidators";

export interface AccommodationSegment {
  id?: string | null;

  hotelName?: string;
  vendor?: VendorDataType | null;

  allTravellersCheckingIn?: boolean;

  checkindate: string;
  checkintime: string;
  checkoutdate: string;
  checkouttime: string;

  accommodationType: string;
  confirmationNumber: string;
  pax: number | string;
  mealPlan: string;

  costprice: number | string;
  costCurrency?: "INR" | "USD";
  costRoe?: string;
  costInr?: string;
  costNotes?: string;
}

export interface AccommodationInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  segments: AccommodationSegment[];
  sameVendorForAllHotels?: boolean;
}

const clampNights = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return null;
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  const diffMs = b.getTime() - a.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (!isFinite(days) || days <= 0) return null;
  return days;
};

const formatDDMMYYYY = (iso?: string) => {
  if (!iso) return "--";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
};

const sanitizeTimeInput = (nextRaw: string, prevRaw: string) => {
  // Copied behavior from AccommodationServiceInfoForm
  let val = String(nextRaw || "").replace(/[^0-9:]/g, "");

  // Prevent multiple colons
  const colonCount = (val.match(/:/g) || []).length;
  if (colonCount > 1) {
    val = val.replace(/:([^:]*)$/, "$1");
  }

  // Auto-insert colon after 2 digits
  if (
    val.length === 2 &&
    !val.includes(":") &&
    String(prevRaw || "").length < 2
  ) {
    val = val + ":";
  }

  // Limit to HH:MM format (5 chars)
  if (val.length > 5) val = val.slice(0, 5);

  // Validate hours (0-23) and minutes (0-59)
  if (val.includes(":")) {
    const parts = val.split(":");
    const hours = parts[0] || "";
    const minutes = parts[1] || "";
    let validHours = hours;
    let validMinutes = minutes;

    if (hours.length > 0) {
      const hourNum = parseInt(hours, 10);
      if (hours.length === 2 && hourNum > 23) {
        validHours = "23";
      }
    }

    if (validMinutes.length > 0) {
      const minNum = parseInt(validMinutes, 10);
      if (validMinutes.length === 2 && minNum > 59) {
        validMinutes = "59";
      }
    }

    val = validHours + ":" + validMinutes;
  } else {
    if (val.length === 2) {
      const hourNum = parseInt(val, 10);
      if (hourNum > 23) {
        val = "23";
      }
    }
  }

  return val;
};

function CustomCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  stopPropagation,
  labelClassName,
  wrapperClassName,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  stopPropagation?: boolean;
  labelClassName?: string;
  wrapperClassName?: string;
}) {
  return (
    <div
      className={wrapperClassName || "flex items-center gap-2"}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
    >
      <input
        type="checkbox"
        id={id}
        className="hidden"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <label
        htmlFor={id}
        className="w-4 h-4 border border-[#0D4B37] rounded-sm flex items-center justify-center cursor-pointer"
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="10"
            viewBox="0 0 11 10"
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
      <span
        className={
          labelClassName ||
          "text-[0.75rem] text-gray-600 cursor-pointer select-none"
        }
      >
        {label}
      </span>
    </div>
  );
}

function AccommodationSegmentCardItem({
  segment,
  index,
  isExpanded,
  onToggleExpand,
  onRemove,
  canRemove,
  bookingDate,
  onBookingDateChange,
  travelDate,
  onTravelDateChange,
  onSegmentChange,
  onVendorChange,
  sameVendorForAllHotels,
  onSameVendorToggle,
  showCostNotes,
  onToggleCostNotes,
  businessCurrency,
  totalCostForAllHotels,
  onTotalCostForAllHotelsToggle,
  showAdvancedPricing,
  onShowAdvancedPricingToggle,
}: {
  segment: AccommodationSegment;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove?: () => void;
  canRemove: boolean;

  bookingDate: string;
  onBookingDateChange: (date: string) => void;
  travelDate: string;
  onTravelDateChange: (date: string) => void;

  onSegmentChange: (patch: Partial<AccommodationSegment>) => void;
  onVendorChange: (vendor: VendorDataType | null) => void;

  sameVendorForAllHotels?: boolean | undefined;
  onSameVendorToggle?: (checked: boolean) => void;

  showCostNotes: boolean;
  onToggleCostNotes: () => void;
  businessCurrency: string;

  totalCostForAllHotels: boolean;
  onTotalCostForAllHotelsToggle: (checked: boolean) => void;
  showAdvancedPricing: boolean;
  onShowAdvancedPricingToggle: (checked: boolean) => void;
}) {
  const checkboxBaseId = React.useId();
  const nights = clampNights(segment.checkindate, segment.checkoutdate);

  const [openAdvancedModal, setOpenAdvancedModal] = useState(false);
  const [advancedValue, setAdvancedValue] = useState<any>(() => ({
    vendorBaseCurrency: segment.costCurrency ?? "INR",
    vendorBasePrice: String(segment.costprice ?? ""),
    vendorBaseRoe: String(segment.costRoe ?? ""),
    vendorBaseInr: String(segment.costInr ?? ""),
    vendorBaseNotes: String(segment.costNotes ?? ""),
    vendorIncentiveCurrency: "INR",
    vendorIncentiveReceived: "",
    vendorIncentiveRoe: "",
    vendorIncentiveInr: "",
    vendorIncentiveNotes: "",
    commissionCurrency: "INR",
    commissionPaid: "",
    commissionRoe: "",
    commissionInr: "",
    commissionNotes: "",
  }));

  const header = (
    <div className="px-4 py-3 bg-[#F9F9F9]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="text-[0.85rem] font-medium text-gray-800 flex-none">
            Hotel {index + 1}
          </div>

          <CustomCheckbox
            id={`${checkboxBaseId}-all-travellers`}
            checked={Boolean(segment.allTravellersCheckingIn)}
            onCheckedChange={(checked) =>
              onSegmentChange({ allTravellersCheckingIn: checked })
            }
            label={
              <span className="whitespace-nowrap">
                All Travellers are Checking into this Hotel
              </span>
            }
            stopPropagation
          />
        </div>

        <div className="flex items-center gap-2 flex-none">
          {canRemove && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-gray-400 hover:text-red-500"
              type="button"
              aria-label="Remove segment"
            >
              <FiMinusCircle size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <MdKeyboardArrowDown
              size={18}
              className={
                "text-gray-600 transition-transform " +
                (isExpanded ? "rotate-180" : "")
              }
            />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_auto] gap-3 items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded border border-gray-200 bg-white flex items-center justify-center text-gray-500 text-[11px] font-semibold">
            <MdHotel size={18} className="text-gray-400" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {segment.hotelName || "Hotel Name"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[0.85rem] text-gray-700">
          <span className="font-medium">
            {formatDDMMYYYY(segment.checkindate)}
          </span>
          <span className="text-gray-400">→</span>
          <span className="font-medium">
            {formatDDMMYYYY(segment.checkoutdate)}
          </span>
        </div>

        <div className="justify-self-start lg:justify-self-end">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[0.75rem] font-medium">
            {nights ? `${nights} Night${nights === 1 ? "" : "s"}` : "0 Night"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-green-300"
        aria-expanded={isExpanded}
      >
        {header}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="border-t border-gray-200" />

          <div className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
              <div>
                <SingleCalendar
                  label="Booking Date"
                  value={bookingDate}
                  onChange={onBookingDateChange}
                  placeholder="DD-MM-YYYY"
                  customWidth="w-full"
                  showCalendarIcon={false}
                />
              </div>

              <div>
                <SingleCalendar
                  label="Travel Date"
                  value={travelDate}
                  onChange={onTravelDateChange}
                  placeholder="DD-MM-YYYY"
                  customWidth="w-full"
                  showCalendarIcon={false}
                />
              </div>

              <div>
                <SingleCalendar
                  label="Check-In Date"
                  value={segment.checkindate}
                  onChange={(date) => onSegmentChange({ checkindate: date })}
                  placeholder="DD-MM-YYYY"
                  customWidth="w-full"
                  showCalendarIcon={false}
                  minDate={travelDate}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Check-In Time
                </label>
                <input
                  type="text"
                  value={segment.checkintime}
                  onChange={(e) =>
                    onSegmentChange({
                      checkintime: sanitizeTimeInput(
                        e.target.value,
                        segment.checkintime,
                      ),
                    })
                  }
                  placeholder="HH:MM"
                  maxLength={5}
                  className="w-full h-[34px] px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>

              <div>
                <SingleCalendar
                  label="Check-Out Date"
                  value={segment.checkoutdate}
                  onChange={(date) => onSegmentChange({ checkoutdate: date })}
                  placeholder="DD-MM-YYYY"
                  customWidth="w-full"
                  showCalendarIcon={false}
                  minDate={segment.checkindate}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Check-Out Time
                </label>
                <input
                  type="text"
                  value={segment.checkouttime}
                  onChange={(e) =>
                    onSegmentChange({
                      checkouttime: sanitizeTimeInput(
                        e.target.value,
                        segment.checkouttime,
                      ),
                    })
                  }
                  placeholder="HH:MM"
                  maxLength={5}
                  className="w-full h-[34px] px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>
            </div>
            <AdvancedPricingModal
              isOpen={openAdvancedModal}
              value={advancedValue}
              onChange={(next: any) => setAdvancedValue(next)}
              showTotal={Boolean(totalCostForAllHotels)}
              onToggleTotal={(v: boolean) =>
                onTotalCostForAllHotelsToggle &&
                onTotalCostForAllHotelsToggle(v)
              }
              onClose={() => setOpenAdvancedModal(false)}
              onSave={(val: any) => {
                const parseNum = (s?: any) =>
                  Number(String(s ?? "").replace(/,/g, "")) || 0;
                const base =
                  String(val.vendorBaseCurrency) === "USD"
                    ? parseNum(val.vendorBaseInr) ||
                      parseNum(val.vendorBasePrice) *
                        parseNum(val.vendorBaseRoe)
                    : parseNum(val.vendorBasePrice);
                const inc =
                  String(val.vendorIncentiveCurrency) === "USD"
                    ? parseNum(val.vendorIncentiveInr) ||
                      parseNum(val.vendorIncentiveReceived) *
                        parseNum(val.vendorIncentiveRoe)
                    : parseNum(val.vendorIncentiveReceived);
                const com =
                  String(val.commissionCurrency) === "USD"
                    ? parseNum(val.commissionInr) ||
                      parseNum(val.commissionPaid) * parseNum(val.commissionRoe)
                    : parseNum(val.commissionPaid);
                const result = base - inc + com;
                let resStr = "";
                if (isFinite(result)) {
                  const hasFraction =
                    Math.abs(result - Math.round(result)) > 1e-9;
                  resStr = hasFraction
                    ? result.toFixed(2)
                    : String(Math.round(result));
                }
                onSegmentChange({
                  costprice: resStr,
                  costCurrency: val.vendorBaseCurrency ?? segment.costCurrency,
                  costRoe: val.vendorBaseRoe ?? "",
                  costInr:
                    String(val.vendorBaseCurrency) !== businessCurrency
                      ? String(
                          parseNum(val.vendorBaseInr) ||
                            parseNum(val.vendorBasePrice) *
                              parseNum(val.vendorBaseRoe),
                        )
                      : "",
                });
                setOpenAdvancedModal(false);
              }}
            />

            <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4 items-end">
              <VendorDropDown
                isOpen={true}
                selectedVendor={segment.vendor ?? null}
                onSelectVendor={onVendorChange}
                label="Vendor"
                placeholder="Search by Vendor Name/ID"
              />

              {onSameVendorToggle && (
                <div className="pb-1">
                  <CustomCheckbox
                    id={`${checkboxBaseId}-same-vendor`}
                    checked={Boolean(sameVendorForAllHotels)}
                    onCheckedChange={onSameVendorToggle}
                    label={<span>Same Vendor for all Hotels</span>}
                  />
                </div>
              )}
            </div>

            <div className="mt-5 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-gray-700">
                  Amount
                </h3>

                <div className="flex items-center gap-5">
                  <CustomCheckbox
                    id={`${checkboxBaseId}-total-cost`}
                    checked={Boolean(totalCostForAllHotels)}
                    onCheckedChange={onTotalCostForAllHotelsToggle}
                    label={
                      <span className="text-[13px] text-gray-700">
                        Total Cost for all Hotels
                      </span>
                    }
                    labelClassName="text-[13px] text-gray-700"
                  />

                  <CustomCheckbox
                    id={`${checkboxBaseId}-advanced-pricing`}
                    checked={Boolean(showAdvancedPricing)}
                    onCheckedChange={() => {
                      setAdvancedValue((prev: any) => ({
                        ...prev,
                        vendorBaseCurrency: segment.costCurrency ?? "INR",
                        vendorBasePrice: String(segment.costprice ?? ""),
                        vendorBaseRoe: String(segment.costRoe ?? ""),
                        vendorBaseInr: String(segment.costInr ?? ""),
                        vendorBaseNotes: String(segment.costNotes ?? ""),
                      }));
                      setOpenAdvancedModal(true);
                      onShowAdvancedPricingToggle &&
                        onShowAdvancedPricingToggle(true);
                    }}
                    label={
                      <span className="text-[13px] text-gray-700">
                        Show Advanced Pricing
                      </span>
                    }
                    labelClassName="text-[13px] text-gray-700"
                  />
                </div>
              </div>
              <hr className="mb-3 -mt-1 border-t border-gray-200" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Cost Price
                  </label>
                  <MultiCurrencyInput
                    currency={segment.costCurrency ?? "INR"}
                    onCurrencyChange={(currency) =>
                      onSegmentChange({ costCurrency: currency })
                    }
                    amount={String(segment.costprice ?? "")}
                    onAmountChange={(amount) =>
                      onSegmentChange({ costprice: amount })
                    }
                    roe={String(segment.costRoe ?? "")}
                    onRoeChange={(roe) => onSegmentChange({ costRoe: roe })}
                    inr={String(segment.costInr ?? "")}
                    notes={String(segment.costNotes ?? "")}
                    onNotesChange={(notes) =>
                      onSegmentChange({ costNotes: notes })
                    }
                    showNotes={showCostNotes}
                    onToggleNotes={onToggleCostNotes}
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    useWhiteDropdown={true}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Select Accommodation Type
                </label>
                <DropDown
                  options={[
                    { value: "Hotel", label: "Hotel" },
                    { value: "Resort", label: "Resort" },
                    { value: "Hostel", label: "Hostel" },
                    { value: "Villa", label: "Villa" },
                  ]}
                  placeholder="Select Stay Type"
                  value={segment.accommodationType}
                  onChange={(val: string) =>
                    onSegmentChange({ accommodationType: val })
                  }
                  customWidth="w-full"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Confirmation Number
                </label>
                <input
                  type="text"
                  value={segment.confirmationNumber}
                  onChange={(e) =>
                    onSegmentChange({
                      confirmationNumber: allowTextAndNumbers(e.target.value),
                    })
                  }
                  placeholder="Enter Confirmation No."
                  className="w-full h-[34px] px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Pax
                </label>
                <input
                  type="number"
                  value={String(segment.pax ?? "")}
                  onChange={(e) => onSegmentChange({ pax: e.target.value })}
                  placeholder="0"
                  className="w-full h-[34px] px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Select Meal Plan
                </label>
                <DropDown
                  options={[
                    { value: "EPAI", label: "EPAI" },
                    { value: "CPAI", label: "CPAI" },
                    { value: "MAPAI", label: "MAPAI" },
                    { value: "APAI", label: "APAI" },
                  ]}
                  placeholder="Select Meal Plan"
                  value={segment.mealPlan}
                  onChange={(val: string) => onSegmentChange({ mealPlan: val })}
                  customWidth="w-full"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccommodationSegmentCard({
  formData,
  setFormData,
}: {
  formData: AccommodationInfoFormData;
  setFormData: React.Dispatch<React.SetStateAction<AccommodationInfoFormData>>;
}) {
  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user) ?? "INR";

  const [expandedSegments, setExpandedSegments] = useState<
    Record<string, boolean>
  >({});

  const [showCostNotesFlag, setShowCostNotesFlag] = useState<boolean>(false);
  const [totalCostForAllHotels, setTotalCostForAllHotels] =
    useState<boolean>(false);
  const [showAdvancedPricing, setShowAdvancedPricing] =
    useState<boolean>(false);

  const segments = Array.isArray(formData.segments) ? formData.segments : [];

  useEffect(() => {
    const missingIds = segments.some((s) => !s?.id);
    if (!missingIds) return;
    setFormData((prev) => ({
      ...prev,
      segments: (prev.segments || []).map((s) =>
        s.id
          ? s
          : {
              ...s,
              id: Date.now().toString() + Math.random().toString(36).slice(2),
            },
      ),
    }));
  }, [segments, setFormData]);

  const addSegment = () => {
    const newId = Date.now().toString() + Math.random().toString(36).slice(2);
    const next: AccommodationSegment = {
      id: newId,
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
    };
    setFormData((prev) => ({
      ...prev,
      segments: [...(prev.segments || []), next],
    }));
    setExpandedSegments((prev) => ({ ...prev, [newId]: true }));
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      segments: (prev.segments || []).filter((s) => s.id !== id),
    }));
    setExpandedSegments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setSegmentVendor = (
    segmentId: string,
    vendor: VendorDataType | null,
  ) => {
    setFormData((prev) => {
      const applyToAll = Boolean(prev.sameVendorForAllHotels);
      return {
        ...prev,
        segments: (prev.segments || []).map((s) => {
          if (applyToAll) return { ...s, vendor };
          return s.id === segmentId ? { ...s, vendor } : s;
        }),
      };
    });
  };

  return (
    <div className="text-[0.75rem] ml-2.5 text-gray-700">
      <div className="border border-gray-200 w-[1000px] -ml-2 rounded-lg p-3 space-y-4">
        {segments.map((segment, index) => {
          const segId = segment.id ?? String(index);
          const isExpanded = expandedSegments[segId] ?? index === 0;

          return (
            <AccommodationSegmentCardItem
              key={String(segId)}
              segment={segment as AccommodationSegment}
              index={index}
              isExpanded={isExpanded}
              canRemove={segments.length > 1}
              onRemove={() => removeSegment(String(segId))}
              onToggleExpand={() =>
                setExpandedSegments((prev) => ({
                  ...prev,
                  [segId]: !isExpanded,
                }))
              }
              bookingDate={formData.bookingdate}
              onBookingDateChange={(date) =>
                setFormData((prev) => ({ ...prev, bookingdate: date }))
              }
              travelDate={formData.traveldate}
              onTravelDateChange={(date) =>
                setFormData((prev) => ({ ...prev, traveldate: date }))
              }
              onSegmentChange={(patch) =>
                setFormData((prev) => ({
                  ...prev,
                  segments: (prev.segments || []).map((s) =>
                    s.id === segId
                      ? ({ ...s, ...patch } as AccommodationSegment)
                      : s,
                  ),
                }))
              }
              onVendorChange={(vendor) =>
                setSegmentVendor(String(segId), vendor)
              }
              sameVendorForAllHotels={formData.sameVendorForAllHotels}
              onSameVendorToggle={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  sameVendorForAllHotels: checked,
                }))
              }
              showCostNotes={showCostNotesFlag}
              onToggleCostNotes={() => setShowCostNotesFlag((p) => !p)}
              businessCurrency={businessCurrency}
              totalCostForAllHotels={totalCostForAllHotels}
              onTotalCostForAllHotelsToggle={setTotalCostForAllHotels}
              showAdvancedPricing={showAdvancedPricing}
              onShowAdvancedPricingToggle={setShowAdvancedPricing}
            />
          );
        })}

        <button
          onClick={addSegment}
          className="flex items-center gap-1.5 px-3 py-1.5 mt-3 bg-[#126ACB] text-white text-[0.75rem] font-medium rounded-md hover:bg-blue-700 transition"
          type="button"
        >
          + Add another accommodation
        </button>
      </div>
    </div>
  );
}
