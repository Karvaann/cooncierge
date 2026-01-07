"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { RiRefreshLine } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import DateRangeInput from "./DateRangeInput";
import Button from "./Button";
import { CiSearch } from "react-icons/ci";
import FilterInputShell from "./FilterInputShell";
import SelectBookingOwnerModal from "./Modals/SelectBookingOwnerModal";

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
  owner: string | string[];
  bookingType: string;
  search: string;
  bookingStartDate: string;
  bookingEndDate: string;
  tripStartDate: string;
  tripEndDate: string;
}

interface FilterProps {
  onFilterChange?: (filters: FilterState) => void;
  onSearchChange?: (value: string) => void;
  serviceTypes?: FilterOption[];
  statuses?: FilterOption[];
  owners?: FilterOption[];
  initialFilters?: Partial<FilterState>;
  createOpen?: boolean;
  setCreateOpen?: (open: boolean) => void;
  onCreateClick?: () => void;
  showBookingType?: boolean;
  searchWidth?: string;
}

const Filter: React.FC<FilterProps> = ({
  onFilterChange,
  serviceTypes = [],
  statuses = [],
  owners = [],
  initialFilters = {},
  createOpen = false,
  setCreateOpen,
  onSearchChange,
  onCreateClick,
  showBookingType = false,
  searchWidth,
}) => {
  const initialSearch = initialFilters.search || "";
  const initialEffectiveSearch = initialSearch.length >= 3 ? initialSearch : "";

  const [filters, setFilters] = useState<FilterState>({
    serviceType: initialFilters.serviceType || "",
    status: initialFilters.status || "",
    owner: initialFilters.owner || "",
    bookingType: (initialFilters as any).bookingType || "",
    search: initialFilters.search || "",
    bookingStartDate: initialFilters.bookingStartDate || "",
    bookingEndDate: initialFilters.bookingEndDate || "",
    tripStartDate: initialFilters.tripStartDate || "",
    tripEndDate: initialFilters.tripEndDate || "",
  });

  // Only propagate search to parent when empty or >= 3 chars
  const [effectiveSearch, setEffectiveSearch] = useState<string>(
    initialEffectiveSearch
  );

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

  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  // Booking Type dropdown (owner-style)
  const bookingTypeRef = useRef<HTMLDivElement>(null);
  const bookingTypePortalRef = useRef<HTMLDivElement | null>(null);
  const [bookingTypeOpen, setBookingTypeOpen] = useState(false);
  const [bookingTypePos, setBookingTypePos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Outside click for booking type
  useEffect(() => {
    if (!bookingTypeOpen) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (bookingTypeRef.current && bookingTypeRef.current.contains(target))
        return;
      if (
        bookingTypePortalRef.current &&
        bookingTypePortalRef.current.contains(target)
      )
        return;
      setBookingTypeOpen(false);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [bookingTypeOpen]);

  // Recalculate booking type dropdown position when open or on resize/scroll
  useEffect(() => {
    if (!bookingTypeOpen) return;

    const recalc = () => {
      const rect = bookingTypeRef.current?.getBoundingClientRect();
      if (rect) {
        setBookingTypePos({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [bookingTypeOpen]);

  // Keep UI pills in sync with initial owner filter (when provided)
  useEffect(() => {
    const initialOwner = (initialFilters as any)?.owner;
    const next = Array.isArray(initialOwner)
      ? initialOwner
      : typeof initialOwner === "string" && initialOwner
      ? [initialOwner]
      : [];
    setSelectedOwners(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string | string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const removeOwner = useCallback(
    (name: string) => {
      setSelectedOwners((prev) => {
        const next = prev.filter((p) => p !== name);
        updateFilter("owner", next);
        return next;
      });
    },
    [updateFilter]
  );

  // Decide search input width: explicit prop > compact when booking type shown > default
  const searchInputWidth =
    searchWidth ?? (showBookingType ? "w-[18rem]" : "w-98");

  const handleReset = useCallback(() => {
    const resetFilters: FilterState = {
      serviceType: "",
      status: "",
      owner: "",
      bookingType: "",
      search: "",
      bookingStartDate: "",
      bookingEndDate: "",
      tripStartDate: "",
      tripEndDate: "",
    };
    setFilters(resetFilters);
    setSelectedOwners([]); // Reset owner pills
    setEffectiveSearch("");
    onSearchChange?.("");
  }, [onSearchChange]);

  const handleApply = useCallback(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const callbackFilters = useMemo(
    () => ({ ...filters, search: effectiveSearch }),
    [filters, effectiveSearch]
  );

  // Forward filter changes to parent AFTER render commit to avoid nested render updates
  useEffect(() => {
    onFilterChange?.(callbackFilters);
  }, [callbackFilters, onFilterChange]);

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
    <div className="bg-white rounded-xl shadow pt-4.5 pb-4.5 px-4 w-full relative">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-[1rem] font-semibold text-[#1F2937]">Filters</h2>
        <Button
          text="+ Create"
          onClick={() => {
            if (onCreateClick) onCreateClick();
            else setCreateOpen?.(true);
          }}
          bgColor="bg-[#0D4B37]"
          textColor="text-white"
          className="border border-[#0D4B37] hover:bg-[#125E45] px-3.5 cursor-pointer"
        />
      </div>

      <hr className="mb-2 mt-2 border-t-1 border-[#e4dfdb]" />

      <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
        <div className="flex items-end gap-4 flex-wrap max-w-full">
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

          <div className="flex-shrink-0">
            <label className="block text-[#414141] font-medium mb-1.5 text-[14px]">
              Booking Owner
            </label>

            <div className="relative">
              <FilterInputShell
                placeholder="Select Owner"
                onClick={(e) => {
                  e.stopPropagation();
                  setOwnerModalOpen(true);
                }}
              >
                {selectedOwners.length > 0 ? (
                  <>
                    <span
                      key={selectedOwners[0]}
                      className="flex items-center gap-1 bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full text-[12px]"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedOwners[0]) removeOwner(selectedOwners[0]);
                        }}
                        className="py-1"
                      >
                        <IoClose size={16} className="text-[#818181]" />
                      </button>
                      {selectedOwners[0]}
                    </span>

                    {selectedOwners.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOwnerModalOpen(true);
                        }}
                        className="text-[#114958] underline text-[14px] ml-2"
                        aria-label="Show more owners"
                      >
                        + {selectedOwners.length - 1}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[#9CA3AF] text-[14px] flex items-center flex-1">
                    Select Owner
                  </span>
                )}
              </FilterInputShell>

              <SelectBookingOwnerModal
                isOpen={ownerModalOpen}
                onClose={() => setOwnerModalOpen(false)}
                owners={owners}
                initialSelectedOwners={selectedOwners}
                onApply={(next) => {
                  setSelectedOwners(next);
                  updateFilter("owner", next);
                }}
              />
            </div>
          </div>

          {showBookingType && (
            <div className="flex-shrink-0">
              <label className="block text-[#414141] font-medium mb-1.5 text-[14px]">
                Booking Type
              </label>

              <div className="relative" ref={bookingTypeRef}>
                <FilterInputShell
                  value={
                    (filters as any).bookingType === "os"
                      ? "OS"
                      : (filters as any).bookingType === "limitless"
                      ? "Limitless"
                      : ""
                  }
                  placeholder="Select Booking Type"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect =
                      bookingTypeRef.current?.getBoundingClientRect();
                    if (rect) {
                      setBookingTypePos({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                      });
                    }
                    setBookingTypeOpen((prev) => !prev);
                  }}
                />

                {bookingTypeOpen &&
                  bookingTypePos &&
                  createPortal(
                    <div
                      ref={bookingTypePortalRef}
                      style={{
                        position: "fixed",
                        left: bookingTypePos.left,
                        top: bookingTypePos.top + bookingTypePos.height + 6,
                        width: bookingTypePos.width,
                        zIndex: 9999,
                        minHeight: 32,
                      }}
                      className="bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-y-auto"
                    >
                      {[
                        { value: "os", label: "OS" },
                        { value: "limitless", label: "Limitless" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFilter("bookingType" as any, opt.value);
                            setBookingTypeOpen(false);
                          }}
                        >
                          <span className="text-black text-[14px]">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>,
                    typeof document !== "undefined"
                      ? document.body
                      : (null as any)
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Right Group: Owner + Search + Buttons */}
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

          <div className="flex items-end gap-3 flex-shrink-0 ml-auto">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by Booking ID / Lead Pax"
                value={filters.search}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilter("search", value);

                  if (value.length === 0) {
                    setEffectiveSearch("");
                    onSearchChange?.("");
                  } else if (value.length >= 3) {
                    setEffectiveSearch(value);
                    onSearchChange?.(value);
                  }
                }}
                className={`${searchInputWidth} border border-gray-300 hover:border-green-300 text-[14px] font-normal rounded-md pl-3 pr-9 py-2.5`}
              />
              <CiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800"
                size={18}
              />
            </div>

            {/* Reset */}
            <Button
              text="Reset"
              onClick={handleReset}
              icon={<RiRefreshLine size={18} />}
              bgColor="bg-white"
              textColor="text-[#414141]"
              className="border border-[#414141] hover:bg-gray-200 font-semibold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Filter);
