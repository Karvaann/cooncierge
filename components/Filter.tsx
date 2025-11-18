"use client";

import React, { useState, useCallback, useMemo } from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { RiRefreshLine } from "react-icons/ri";
import { FaRegCalendar } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import DateRangeInput from "./DateRangeInput";

interface FilterOption {
  id?: string;
  _id?: string;
  value?: string;
  name?: string;
  label?: string;
}

interface FilterState {
  serviceType: string;
  status: string;
  owner: string;
  search: string;
  bookingStartDate: string;
  bookingEndDate: string;
  tripStartDate: string;
  tripEndDate: string;
}

interface FilterProps {
  onFilterChange?: (filters: FilterState) => void;
  serviceTypes?: FilterOption[];
  statuses?: FilterOption[];
  owners?: FilterOption[];
  initialFilters?: Partial<FilterState>;
  createOpen?: boolean;
  setCreateOpen?: (open: boolean) => void;
}

const Filter: React.FC<FilterProps> = ({
  onFilterChange,
  serviceTypes = [],
  statuses = [],
  owners = [],
  initialFilters = {},
  createOpen = false,
  setCreateOpen,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    serviceType: initialFilters.serviceType || "",
    status: initialFilters.status || "",
    owner: initialFilters.owner || "",
    search: initialFilters.search || "",
    bookingStartDate: initialFilters.bookingStartDate || "",
    bookingEndDate: initialFilters.bookingEndDate || "",
    tripStartDate: initialFilters.tripStartDate || "",
    tripEndDate: initialFilters.tripEndDate || "",
  });

  {
    /* Booking Time Period (with placeholder working) */
  }
  const [showBookingStartAsDate, setShowBookingStartAsDate] = useState(false);
  const [showBookingEndAsDate, setShowBookingEndAsDate] = useState(false);

  {
    /* Trip Time Period (with placeholder working) */
  }
  const [showTripStartAsDate, setShowTripStartAsDate] = useState(false);
  const [showTripEndAsDate, setShowTripEndAsDate] = useState(false);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value };
        onFilterChange?.(newFilters);
        return newFilters;
      });
    },
    [onFilterChange]
  );

  const handleReset = useCallback(() => {
    const resetFilters: FilterState = {
      serviceType: "",
      status: "",
      owner: "",
      search: "",
      bookingStartDate: "",
      bookingEndDate: "",
      tripStartDate: "",
      tripEndDate: "",
    };
    setFilters(resetFilters);
    onFilterChange?.(resetFilters);
  }, [onFilterChange]);

  const handleApply = useCallback(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const renderOptions = useCallback(
    (options: FilterOption[]) =>
      options.map((option) => (
        <option
          key={option.id || option._id || option.value || option.name}
          value={option.value || option.name || String(option)}
        >
          {option.label || option.name || String(option)}
        </option>
      )),
    []
  );

  const serviceTypeOptions = useMemo(
    () => renderOptions(serviceTypes),
    [serviceTypes, renderOptions]
  );
  const statusOptions = useMemo(
    () => renderOptions(statuses),
    [statuses, renderOptions]
  );
  const ownerOptions = useMemo(
    () => renderOptions(owners),
    [owners, renderOptions]
  );

  return (
    <div className="bg-white rounded-2xl shadow pt-4 pb-3 px-3 w-full relative">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[0.85rem] font-semibold text-[#1F2937]">Filters</h2>
        <button
          onClick={() => setCreateOpen?.(true)}
          className="border border-[#0D4B37] text-white bg-[#0D4B37] text-[0.75rem] px-3 py-1.5 rounded-md font-medium hover:bg-green-800 transition"
          type="button"
        >
          + Create
        </button>
      </div>

      <hr className="mb-2 mt-2 border-t-1 border-[#e4dfdb]" />

      <div className="flex flex-wrap items-end justify-between">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Service Type */}
          {/* <div>
                <label className="block text-gray-700 mb-1 text-[0.75rem]">Service Type</label>
                <div className="relative">
                  <select
                    value={filters.serviceType}
                    onChange={(e) => updateFilter("serviceType", e.target.value)}
                    className="w-[12.75rem] border border-gray-300  text-[0.75rem] rounded-lg px-3 py-2 text-gray-600 focus:ring-2 focus:ring-[#0D4B37] pr-8"
                  >
                    <option value="">Service Type</option>
                    {serviceTypeOptions}
                  </select>
                </div>
              </div> */}

          {/* Status */}

          {/* Booking Time Period (combined box) */}
          <DateRangeInput
            label="Booking Date"
            startDate={filters.bookingStartDate}
            endDate={filters.bookingEndDate}
            onChange={(start, end) => {
              updateFilter("bookingStartDate", start);
              updateFilter("bookingEndDate", end);
            }}
          />

          <DateRangeInput
            label="Travel Date"
            startDate={filters.tripStartDate}
            endDate={filters.tripEndDate}
            onChange={(start, end) => {
              updateFilter("tripStartDate", start);
              updateFilter("tripEndDate", end);
            }}
          />

          {/* Booking Owner */}

          <div>
            <label className="block text-gray-700 mb-1 text-[0.75rem]">
              Booking Owner
            </label>
            <div className="relative">
              <select
                value={filters.owner}
                onChange={(e) => updateFilter("owner", e.target.value)}
                className="w-[14.75rem] text-[0.75rem] border border-gray-300 rounded-md px-2 py-2 text-gray-600 focus:ring-2 focus:ring-[#0D4B37] pr-8"
              >
                <option value="">Select Owner</option>
                {ownerOptions}
              </select>
            </div>
          </div>
        </div>

        {/* Second Row: Owner + Search + Buttons */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          {/* Owner */}
          {/* <div>
              <label className="block text-gray-700 mb-1">Select Owner</label>
              <div className="relative">
                <select
                  value={filters.owner}
                  onChange={(e) => updateFilter("owner", e.target.value)}
                  className="w-56 border border-gray-300 rounded-lg px-3 py-2 text-gray-600 focus:ring-2 focus:ring-[#0D4B37] appearance-none pr-8"
                >
                  <option value="">Select Owner</option>
                  {ownerOptions}
                </select>
                <MdOutlineKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div> */}

          <div className="flex items-end gap-3 w-[100%]">
            {/* Search */}

            <div>
              <label className="block text-gray-700 mb-1 text-[0.75rem]">
                Search Booking / Lead Pax
              </label>
              <input
                type="text"
                placeholder="Search by Booking ID / Lead Pax"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="w-80 border border-gray-300 text-[0.75rem] rounded-lg px-3 py-2 text-gray-600 focus:ring-2 focus:ring-[#0D4B37]"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              {/* <button
                  onClick={handleReset}
                  className="flex items-center justify-center bg-gray-100 text-[#0D4B37] px-3 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  
                </button> */}
              <button
                onClick={handleApply}
                className="bg-white flex items-center text-[0.75rem] font-semibold gap-1 justify-center text-[#0D4B37] border border-[#0D4B37] px-3 py-2 rounded-lg hover:bg-gray-200 transition"
              >
                <RiRefreshLine size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Filter);
