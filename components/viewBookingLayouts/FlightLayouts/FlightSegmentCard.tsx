"use client";

import React from "react";
import { FiMinusCircle } from "react-icons/fi";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import VendorDropDown, {
  type VendorDataType,
} from "@/components/dropdowns/VendorDropDown";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import AdvancedPricingModal from "@/components/viewBookingLayouts/components/AdvancedPricingModal";
import { requiresRoe } from "@/utils/currencyUtil";

export interface SegmentPreview {
  airline?: string;
  origin?: string;
  destination?: string;
  departureTime?: string;
  departureTimeRaw?: string;
  arrivalTimeRaw?: string;
  arrivalTime?: string;
  flightNumber?: string;
  duration?: string;
}

export interface FlightSegment {
  id?: string | null;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
  preview?: SegmentPreview;
  vendor?: VendorDataType | null;

  allTravellersTakingThisFlight?: boolean;
  cabinPcs?: number;
  cabinWeightKg?: string;
  checkInPcs?: number;
  checkInWeightKg?: string;
}

interface FlightSegmentCardProps {
  segment: FlightSegment;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove?: () => void;
  canRemove: boolean;

  // Pricing toggles (shared across flights)
  totalCostForAllFlights?: boolean | undefined;
  onTotalCostForAllFlightsToggle?: (checked: boolean) => void;
  showAdvancedPricing?: boolean | undefined;
  onShowAdvancedPricingToggle?: (checked: boolean) => void;

  // Form data
  PNR: number | string;
  onPNRChange: (pnr: string) => void;
  bookingDate: string;
  onBookingDateChange: (date: string) => void;
  travelDate: string;
  onTravelDateChange: (date: string) => void;

  // Segment updates
  onSegmentChange: (updatedSegment: Partial<FlightSegment>) => void;
  onVendorChange: (vendor: VendorDataType | null) => void;

  // Cost price
  costPrice: number | string;
  costCurrency: "INR" | "USD";
  costRoe?: string | undefined;
  costInr?: string | undefined;
  costNotes?: string | undefined;
  onCostPriceChange: (price: string) => void;
  onCostCurrencyChange: (currency: "INR" | "USD") => void;
  onCostRoeChange: (roe: string) => void;
  onCostNotesChange: (notes: string) => void;

  // Preview data
  preview?: SegmentPreview | undefined;
  onPreviewChange?: (preview: SegmentPreview) => void;

  // Vendor settings
  sameVendorForAllFlights?: boolean | undefined;
  onSameVendorToggle?: (checked: boolean) => void;

  // Amount flags
  showCostNotes: boolean;
  onToggleCostNotes: () => void;

  // Business currency
  businessCurrency: string;

  // Clear preview callback
  onClearPreview?: () => void;
}

export default function FlightSegmentCard({
  segment,
  index,
  isExpanded,
  onToggleExpand,
  onRemove,
  canRemove,
  PNR,
  onPNRChange,
  bookingDate,
  onBookingDateChange,
  travelDate,
  onTravelDateChange,
  onSegmentChange,
  onVendorChange,
  costPrice,
  costCurrency,
  costRoe,
  costInr,
  costNotes,
  onCostPriceChange,
  onCostCurrencyChange,
  onCostRoeChange,
  onCostNotesChange,
  preview,
  onPreviewChange,
  sameVendorForAllFlights,
  onSameVendorToggle,
  showCostNotes,
  onToggleCostNotes,
  businessCurrency,
  onClearPreview,

  totalCostForAllFlights,
  onTotalCostForAllFlightsToggle,
  showAdvancedPricing,
  onShowAdvancedPricingToggle,
}: FlightSegmentCardProps) {
  const checkboxBaseId = React.useId();
  const [openAdvancedModal, setOpenAdvancedModal] = React.useState(false);
  const [advancedValue, setAdvancedValue] = React.useState<any>(() => ({
    vendorBaseCurrency: costCurrency,
    vendorBasePrice: String(costPrice ?? ""),
    vendorBaseRoe: String(costRoe ?? ""),
    vendorBaseInr: String(costInr ?? ""),
    vendorBaseNotes: String(costNotes ?? ""),
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

  const safeInt = (value: unknown, fallback: number) => {
    const n = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const sanitizeWeight = (val: string) => {
    const v = String(val || "").replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length <= 1) return parts[0] ?? "";
    return (parts[0] ?? "") + "." + parts.slice(1).join("");
  };

  const updatePcs = (field: "cabinPcs" | "checkInPcs", delta: number) => {
    const current = safeInt(segment[field], 1);
    const next = Math.max(0, current + delta);
    onSegmentChange({ [field]: next } as Partial<FlightSegment>);
  };

  const CustomCheckbox = ({
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
  }) => {
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
  };

  const header = (
    <div className="px-4 py-3 bg-[#F9F9F9]">
      <div className="grid grid-cols-1 lg:grid-cols-[90px_1.4fr_1fr_1fr_0.9fr_auto] gap-4 items-center">
        <div className="text-[0.85rem] font-medium text-gray-800">
          Flight {index + 1}
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 truncate">
                {preview?.airline || "Airline"}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-700 truncate">
                {preview?.flightNumber || segment.flightnumber || "Flight No."}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-gray-900 truncate">
            {preview?.origin || "-"}
          </span>
          <span className="text-gray-400">|</span>
          <span className="font-medium text-gray-900">
            {preview?.departureTime || "--"}
          </span>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-gray-900 truncate">
            {preview?.destination || "-"}
          </span>
          <span className="text-gray-400">|</span>
          <span className="font-medium text-gray-900">
            {preview?.arrivalTime || "--"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">
            {preview?.duration || "--"}
          </span>
          <span className="text-gray-400">|</span>
          <span className="font-medium text-gray-900">0 Stops</span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <CustomCheckbox
            id={`${checkboxBaseId}-all-travellers`}
            checked={Boolean(segment.allTravellersTakingThisFlight)}
            onCheckedChange={(checked) =>
              onSegmentChange({ allTravellersTakingThisFlight: checked })
            }
            label={
              <span className="whitespace-nowrap">
                All Travellers are taking this Flight
              </span>
            }
            stopPropagation
          />

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
      <AdvancedPricingModal
        isOpen={openAdvancedModal}
        value={advancedValue}
        onChange={(next: any) => setAdvancedValue(next)}
        showTotal={Boolean(totalCostForAllFlights)}
        onToggleTotal={(v: boolean) =>
          onTotalCostForAllFlightsToggle && onTotalCostForAllFlightsToggle(v)
        }
        onClose={() => setOpenAdvancedModal(false)}
        onSave={(val: any) => {
          const parseNum = (s?: any) =>
            Number(String(s ?? "").replace(/,/g, "")) || 0;
          const base =
            String(val.vendorBaseCurrency) === "USD"
              ? parseNum(val.vendorBaseInr) ||
                parseNum(val.vendorBasePrice) * parseNum(val.vendorBaseRoe)
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
            const hasFraction = Math.abs(result - Math.round(result)) > 1e-9;
            resStr = hasFraction
              ? result.toFixed(2)
              : String(Math.round(result));
          }
          onCostPriceChange(String(resStr));
          onCostCurrencyChange(val.vendorBaseCurrency ?? costCurrency);
          onCostRoeChange(val.vendorBaseRoe ?? "");
          setOpenAdvancedModal(false);
        }}
      />
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

          {/* Service Info Fields */}
          <div className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* PNR */}
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  PNR
                </label>
                <input
                  type="text"
                  placeholder="Enter PNR"
                  value={String(PNR ?? "")}
                  onChange={(e) => onPNRChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>

              {/* Flight Number */}
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Flight Number
                </label>
                <input
                  type="text"
                  placeholder="Enter Flight Number"
                  value={segment.flightnumber}
                  onChange={(e) => {
                    onSegmentChange({ flightnumber: e.target.value });
                    if (onClearPreview) {
                      onClearPreview();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>

              {/* Cabin Class */}
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Cabin Class
                </label>
                <DropDown
                  options={[
                    { value: "Economy", label: "Economy" },
                    { value: "Premium Economy", label: "Premium Economy" },
                    { value: "Business", label: "Business" },
                    { value: "First Class", label: "First Class" },
                  ]}
                  placeholder="Choose Cabin Class"
                  value={segment.cabinclass}
                  onChange={(val: string) => {
                    onSegmentChange({ cabinclass: val });
                  }}
                  customWidth="w-full"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5">
              {/* Booking Date */}
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

              {/* Travel Date */}
              <div>
                <SingleCalendar
                  label="Travel Date"
                  value={travelDate}
                  onChange={onTravelDateChange}
                  placeholder="DD-MM-YYYY"
                  minDate={bookingDate}
                  customWidth="w-full"
                  showCalendarIcon={false}
                />
              </div>

              {/* Cabin */}
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Cabin
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1 h-[34px]">
                    <input
                      type="text"
                      value={String(safeInt(segment.cabinPcs, 1))}
                      readOnly
                      className="w-5 text-center text-[0.75rem] bg-transparent outline-none"
                    />
                    <div className="flex flex-col border border-black rounded-sm overflow-hidden h-full">
                      <button
                        type="button"
                        onClick={() => updatePcs("cabinPcs", 1)}
                        className="flex-1 p-0.5 border-b border-black"
                      >
                        <MdKeyboardArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePcs("cabinPcs", -1)}
                        className="flex-1 p-0.5"
                      >
                        <MdKeyboardArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  <span className="text-gray-600 text-[0.75rem]">Pcs</span>

                  <input
                    type="text"
                    placeholder="Wt."
                    value={String(segment.cabinWeightKg ?? "")}
                    onChange={(e) =>
                      onSegmentChange({
                        cabinWeightKg: sanitizeWeight(e.target.value),
                      })
                    }
                    className="w-16 h-[34px] px-2 py-1 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                  <span className="text-gray-600 text-[0.75rem]">Kgs</span>
                </div>
              </div>

              {/* Check-In */}
              <div>
                <label className="block mb-1 font-medium text-gray-600">
                  Check-In
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1 h-[34px]">
                    <input
                      type="text"
                      value={String(safeInt(segment.checkInPcs, 1))}
                      readOnly
                      className="w-5 text-center text-[0.75rem] bg-transparent outline-none"
                    />
                    <div className="flex flex-col border border-black rounded-sm overflow-hidden h-full">
                      <button
                        type="button"
                        onClick={() => updatePcs("checkInPcs", 1)}
                        className="flex-1 p-0.5 border-b border-black"
                      >
                        <MdKeyboardArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePcs("checkInPcs", -1)}
                        className="flex-1 p-0.5"
                      >
                        <MdKeyboardArrowDown size={14} />
                      </button>
                    </div>
                  </div>

                  <span className="text-gray-600 text-[0.75rem]">Pcs</span>

                  <input
                    type="text"
                    placeholder="Wt."
                    value={String(segment.checkInWeightKg ?? "")}
                    onChange={(e) =>
                      onSegmentChange({
                        checkInWeightKg: sanitizeWeight(e.target.value),
                      })
                    }
                    className="w-16 h-[34px] px-2 py-1 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                  <span className="text-gray-600 text-[0.75rem]">Kgs</span>
                </div>
              </div>
            </div>

            {/* Vendor */}
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
                    checked={Boolean(sameVendorForAllFlights)}
                    onCheckedChange={(checked) => onSameVendorToggle(checked)}
                    label={<span>Same Vendor for all Flights</span>}
                  />
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="mt-5 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-gray-700">
                  Amount
                </h3>

                <div className="flex items-center gap-5">
                  {typeof totalCostForAllFlights === "boolean" &&
                    onTotalCostForAllFlightsToggle && (
                      <CustomCheckbox
                        id={`${checkboxBaseId}-total-cost`}
                        checked={Boolean(totalCostForAllFlights)}
                        onCheckedChange={onTotalCostForAllFlightsToggle}
                        label={
                          <span className="text-[13px] text-gray-700">
                            Total Cost for all Flights
                          </span>
                        }
                        labelClassName="text-[13px] text-gray-700"
                      />
                    )}

                  {typeof showAdvancedPricing === "boolean" &&
                    onShowAdvancedPricingToggle && (
                      <CustomCheckbox
                        id={`${checkboxBaseId}-advanced-pricing`}
                        checked={Boolean(showAdvancedPricing)}
                        onCheckedChange={() => {
                          // open modal instead of directly toggling
                          setAdvancedValue((prev: any) => ({
                            ...prev,
                            vendorBaseCurrency: costCurrency,
                            vendorBasePrice: String(costPrice ?? ""),
                            vendorBaseRoe: String(costRoe ?? ""),
                            vendorBaseInr: String(costInr ?? ""),
                            vendorBaseNotes: String(costNotes ?? ""),
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
                    )}
                </div>
              </div>
              <hr className="mb-3 -mt-1 border-t border-gray-200" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1 font-medium text-gray-600">
                    Cost Price
                  </label>
                  <MultiCurrencyInput
                    currency={costCurrency}
                    onCurrencyChange={onCostCurrencyChange}
                    amount={String(costPrice ?? "")}
                    onAmountChange={onCostPriceChange}
                    roe={String(costRoe ?? "")}
                    onRoeChange={onCostRoeChange}
                    inr={String(costInr ?? "")}
                    notes={String(costNotes ?? "")}
                    onNotesChange={onCostNotesChange}
                    showNotes={showCostNotes}
                    onToggleNotes={onToggleCostNotes}
                    businessCurrency={businessCurrency}
                    requiresRoe={requiresRoe}
                    useWhiteDropdown={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
