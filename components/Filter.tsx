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
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import Button from "./Button";
import { CiSearch } from "react-icons/ci";
import FilterInputShell from "./FilterInputShell";
import SelectBookingOwnerModal from "./Modals/SelectBookingOwnerModal";
import DateRangeInputBeta from "./DateRangeInputBeta";

export interface FilterOption {
  id?: string;
  _id?: string;
  value?: string;
  name?: string;
  label?: string;
}

export interface FilterState {
  serviceType: string;
  status: string;
  owner: string | string[];
  bookingType: string;
  category?: string;
  search: string;
  searchBy: string;
  bookingStartDate: string;
  bookingEndDate: string;
  tripStartDate: string;
  tripEndDate: string;
  primaryOwner?: string | string[];
  secondaryOwners?: string[];
}

export interface SearchOption {
  value: string;
  label: string;
  placeholder?: string;
  minChars?: number;
}

export interface FilterProps {
  onFilterChange?: (filters: FilterState) => void;
  onSearchChange?: (value: string) => void;
  serviceTypes?: FilterOption[];
  statuses?: FilterOption[];
  owners?: FilterOption[];
  categories?: FilterOption[];
  initialFilters?: Partial<FilterState>;
  createOpen?: boolean;
  setCreateOpen?: (open: boolean) => void;
  onCreateClick?: () => void;
  showCreateButton?: boolean;
  createButtonText?: string;
  totalCount?: number;
  showBookingType?: boolean;
  searchWidth?: string;
  searchPlaceholder?: string;
  showOwners?: boolean;
  showBookingDateFilter?: boolean;
  bookingDateLabel?: string;
  showTravelDateFilter?: boolean;
  travelDateLabel?: string;
  showCategory?: boolean;
  allowAdvanceOwnerSearch?: boolean;
  searchOptions?: SearchOption[];
}

const DEFAULT_SEARCH_OPTIONS: SearchOption[] = [{ value: "all", label: "All" }];

const Filter: React.FC<FilterProps> = ({
  onFilterChange,
  serviceTypes = [],
  statuses = [],
  owners = [],
  categories = [],
  initialFilters = {},
  createOpen = false,
  setCreateOpen,
  onSearchChange,
  onCreateClick,
  showCreateButton = true,
  createButtonText = "+ Create",
  totalCount,
  showBookingType = false,
  searchWidth,
  searchPlaceholder = "Search by Booking ID / Lead Pax",
  showOwners = true,
  showBookingDateFilter = true,
  bookingDateLabel = "Booking Date",
  showTravelDateFilter = true,
  travelDateLabel = "Travel Date",
  showCategory = false,
  allowAdvanceOwnerSearch = false,
  searchOptions = DEFAULT_SEARCH_OPTIONS,
}) => {
  const normalizedSearchOptions = useMemo(
    () => (searchOptions.length > 0 ? searchOptions : DEFAULT_SEARCH_OPTIONS),
    [searchOptions],
  );
  const defaultSearchBy =
    (initialFilters as Partial<FilterState>).searchBy ||
    normalizedSearchOptions[0]?.value ||
    "all";
  const getMinCharsForSearchBy = useCallback(
    (searchBy: string) =>
      normalizedSearchOptions.find((option) => option.value === searchBy)
        ?.minChars ?? 3,
    [normalizedSearchOptions],
  );
  const initialSearch = initialFilters.search || "";
  const initialEffectiveSearch =
    initialSearch.length >= getMinCharsForSearchBy(defaultSearchBy)
      ? initialSearch
      : "";

  const [filters, setFilters] = useState<FilterState>({
    serviceType: initialFilters.serviceType || "",
    status: initialFilters.status || "",
    owner: initialFilters.owner || "",
    bookingType: (initialFilters as any).bookingType || "",
    category: (initialFilters as any).category || "",
    search: initialFilters.search || "",
    searchBy: defaultSearchBy,
    bookingStartDate: initialFilters.bookingStartDate || "",
    bookingEndDate: initialFilters.bookingEndDate || "",
    tripStartDate: initialFilters.tripStartDate || "",
    tripEndDate: initialFilters.tripEndDate || "",
    primaryOwner: (initialFilters as any).primaryOwner || "",
    secondaryOwners: (initialFilters as any).secondaryOwners || [],
  });

  // Only propagate search to parent when empty or >= 3 chars
  const [effectiveSearch, setEffectiveSearch] = useState<string>(
    initialEffectiveSearch,
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
  const searchByRef = useRef<HTMLButtonElement>(null);
  const searchByPortalRef = useRef<HTMLDivElement | null>(null);
  const [searchByOpen, setSearchByOpen] = useState(false);
  const [searchByPos, setSearchByPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

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
    const rawPrimary = (initialFilters as any)?.primaryOwner;
    const initialPrimaryOwners: string[] = Array.isArray(rawPrimary)
      ? rawPrimary
      : typeof rawPrimary === "string" && rawPrimary
        ? [rawPrimary]
        : [];
    const initialSecondaryOwners: string[] =
      (initialFilters as any)?.secondaryOwners || [];

    const hasAdvanced =
      initialPrimaryOwners.length > 0 || initialSecondaryOwners.length > 0;

    if (hasAdvanced) {
      const combined = [
        ...new Set([...initialPrimaryOwners, ...initialSecondaryOwners]),
      ];
      setSelectedOwners(combined);
    } else {
      const initialOwner = (initialFilters as any)?.owner;
      const next = Array.isArray(initialOwner)
        ? initialOwner
        : typeof initialOwner === "string" && initialOwner
          ? [initialOwner]
          : [];
      setSelectedOwners(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchByOpen) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchByRef.current && searchByRef.current.contains(target)) return;
      if (
        searchByPortalRef.current &&
        searchByPortalRef.current.contains(target)
      )
        return;
      setSearchByOpen(false);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [searchByOpen]);

  useEffect(() => {
    if (!searchByOpen) return;

    const recalc = () => {
      const rect = searchByRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSearchByPos({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    };

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [searchByOpen]);

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string | string[]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  useEffect(() => {
    if (
      normalizedSearchOptions.some(
        (option) => option.value === filters.searchBy,
      )
    ) {
      return;
    }

    updateFilter("searchBy", defaultSearchBy);
  }, [
    defaultSearchBy,
    filters.searchBy,
    normalizedSearchOptions,
    updateFilter,
  ]);

  useEffect(() => {
    const value = filters.search || "";
    const minChars = getMinCharsForSearchBy(filters.searchBy);

    if (value.length === 0) {
      if (effectiveSearch !== "") {
        setEffectiveSearch("");
        onSearchChange?.("");
      }
      return;
    }

    if (value.length >= minChars) {
      if (effectiveSearch !== value) {
        setEffectiveSearch(value);
        onSearchChange?.(value);
      }
      return;
    }

    if (effectiveSearch !== "") {
      setEffectiveSearch("");
      onSearchChange?.("");
    }
  }, [
    effectiveSearch,
    filters.search,
    filters.searchBy,
    getMinCharsForSearchBy,
    onSearchChange,
  ]);

  const removeOwner = useCallback(
    (name: string) => {
      const currentPrimary: string[] = Array.isArray(filters.primaryOwner)
        ? filters.primaryOwner
        : typeof filters.primaryOwner === "string" && filters.primaryOwner
          ? [filters.primaryOwner]
          : [];
      const currentSecondary: string[] = filters.secondaryOwners || [];
      const isAdvancedActive =
        currentPrimary.length > 0 || currentSecondary.length > 0;

      if (isAdvancedActive) {
        const nextPrimary = currentPrimary.filter((p) => p !== name);
        const nextSecondary = currentSecondary.filter((s) => s !== name);
        const combined = [...new Set([...nextPrimary, ...nextSecondary])];

        setSelectedOwners(combined);
        updateFilter("owner", "");
        updateFilter(
          "primaryOwner",
          nextPrimary.length === 0
            ? ""
            : nextPrimary.length === 1
              ? (nextPrimary[0] ?? "")
              : nextPrimary,
        );
        updateFilter("secondaryOwners", nextSecondary);
        return;
      }

      setSelectedOwners((prev) => {
        const next = prev.filter((p) => p !== name);
        updateFilter("owner", next.length ? next : "");
        return next;
      });
    },
    [filters.primaryOwner, filters.secondaryOwners, updateFilter],
  );

  // Decide search input width: explicit prop > use w-full to fill flex container
  const searchInputWidth = searchWidth ?? "w-full";
  const selectedSearchOption =
    normalizedSearchOptions.find(
      (option) => option.value === filters.searchBy,
    ) || normalizedSearchOptions[0];
  const resolvedSearchPlaceholder =
    selectedSearchOption?.placeholder ||
    (selectedSearchOption?.value === "all" ? searchPlaceholder : "") ||
    `Search by ${selectedSearchOption?.label || searchPlaceholder}`;
  const bookingTypeValue = (filters as any).bookingType;
  const bookingTypeLabel =
    bookingTypeValue === "os"
      ? "Bookings - OS"
      : bookingTypeValue === "limitless"
        ? "Bookings - Limitless"
        : "All Bookings";

  const handleReset = useCallback(() => {
    const resetFilters: FilterState = {
      serviceType: "",
      status: "",
      owner: "",
      bookingType: "",
      category: "",
      search: "",
      searchBy: defaultSearchBy,
      bookingStartDate: "",
      bookingEndDate: "",
      tripStartDate: "",
      tripEndDate: "",
      primaryOwner: "",
      secondaryOwners: [],
    };
    setFilters(resetFilters);
    setSelectedOwners([]); // Reset owner pills
    setEffectiveSearch("");
    onSearchChange?.("");
    setSearchByOpen(false);
  }, [defaultSearchBy, onSearchChange]);

  const callbackFilters = useMemo(
    () => ({ ...filters, search: effectiveSearch }),
    [filters, effectiveSearch],
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
    [],
  );

  const categoryOptions = useMemo(
    () => renderOptions(categories),
    [categories, renderOptions],
  );
  const fieldLabelClassName =
    "block text-[#414141] mb-1.5 text-[14px] font-[400]";
  const fieldControlClassName =
    "h-[44px] w-full rounded-[14px] border border-[#E2E1E1] bg-white px-3 text-[14px] font-normal text-gray-700 hover:border-green-200";

  return (
    <div className="bg-white rounded-[14px] shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] p-[20px] w-full relative">
      {/* <div className="flex justify-between items-center mb-1">
        <h2 className="text-[16px] font-[500] text-[#1F2937]">Filters</h2>
        {showCreateButton ? (
          <Button
            text={createButtonText}
            onClick={() => {
              if (onCreateClick) onCreateClick();
              else setCreateOpen?.(true);
            }}
            bgColor="bg-[#0D4B37]"
            textColor="text-white"
            className="border border-[#0D4B37] hover:bg-[#125E45] px-3.5 cursor-pointer"
          />
        ) : typeof totalCount === "number" ? (
          <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
            <span className="text-gray-600 text-[14px] font-medium">Total</span>
            <span className="bg-gray-100 text-black font-semibold text-[14px] px-2 mr-1 rounded-lg shadow-sm">
              {totalCount}
            </span>
          </div>
        ) : null}
      </div> */}

      {/* <hr className="mb-2 mt-2 border-t-1 border-[#e4dfdb]" /> */}

      <div className="flex justify-between items-end w-full gap-3">
        <div className="grid grid-cols-4 w-4/6 items-start gap-2">
          {showBookingDateFilter && (
            <div className="w-full min-w-0">
              <DateRangeInputBeta
                label={bookingDateLabel}
                startDate={filters.bookingStartDate}
                endDate={filters.bookingEndDate}
                onChange={(start, end) => {
                  updateFilter("bookingStartDate", start);
                  updateFilter("bookingEndDate", end);
                }}
              />
            </div>
          )}

          {showTravelDateFilter && (
            <div className="w-full min-w-0">
              <DateRangeInputBeta
                label={travelDateLabel}
                startDate={filters.tripStartDate}
                endDate={filters.tripEndDate}
                onChange={(start, end) => {
                  updateFilter("tripStartDate", start);
                  updateFilter("tripEndDate", end);
                }}
              />
            </div>
          )}

          {showCategory && (
            <div className="w-full  min-w-0">
              <label className={fieldLabelClassName}>Category</label>
              <div className="relative">
                <select
                  value={filters.category || ""}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className={fieldControlClassName}
                >
                  <option value="">Select Category</option>
                  {categoryOptions}
                </select>
              </div>
            </div>
          )}

          {showOwners && (
            <div className="w-full  min-w-0">
              <label className={fieldLabelClassName}>Booking Owner</label>

              <div className="relative">
                <FilterInputShell
                  placeholder="Search / Select Owner"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOwnerModalOpen(true);
                  }}
                />
              </div>
            </div>
          )}

          {showBookingType && (
            <div className="w-full min-w-0">
              <label className={fieldLabelClassName}>Booking Type</label>

              <div className="relative" ref={bookingTypeRef}>
                <FilterInputShell
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
                >
                  {bookingTypeLabel ? (
                    <span className="text-black text-[14px]">
                      {bookingTypeLabel}
                    </span>
                  ) : (
                    <span className="text-[#9CA3AF] text-[14px] flex items-center flex-1">
                      Select Booking Type
                    </span>
                  )}
                </FilterInputShell>

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
                        { value: "", label: "All Bookings" },
                        { value: "os", label: "Bookings - OS" },
                        { value: "limitless", label: "Bookings - Limitless" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 px-2 py-2  hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFilter("bookingType" as any, "");
                            setBookingTypeOpen(false);
                          }}
                          aria-label="Clear booking type"
                        >
                          <span
                            className={`${bookingTypeLabel === opt.label ? "text-[#7135AD]" : "text-[#020202]"} font-[400] text-[13px]`}
                          >
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>,
                    typeof document !== "undefined"
                      ? document.body
                      : (null as any),
                  )}
              </div>
            </div>
          )}

          <div className="flex w-2/7 items-center gap-3">
            {/* Search */}
            <div className="w-full min-w-0">
              <div
                className={`${searchInputWidth} flex h-[44px] items-stretch overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white hover:border-green-200`}
              >
                <button
                  ref={searchByRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = searchByRef.current?.getBoundingClientRect();
                    if (rect) {
                      setSearchByPos({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                      });
                    }
                    setSearchByOpen((prev) => !prev);
                  }}
                  className="flex h-full shrink-0 items-center gap-2 whitespace-nowrap px-3 text-[12px] font-[400] text-[#020202]"
                >
                  <span>{selectedSearchOption?.label || "Search"}</span>
                  <MdOutlineKeyboardArrowDown className="text-[20px] text-[#7A7A7A]" />
                </button>

                <div className="flex min-w-0 flex-1 items-center border-l border-[#D9D9D9]">
                  <input
                    type="text"
                    placeholder={resolvedSearchPlaceholder}
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
                    className="h-full min-w-0 flex-1 bg-transparent pl-3 pr-3 text-[12px] font-normal text-[#111111] outline-none placeholder:text-[#A0A9BA]"
                  />
                  <CiSearch
                    className="mr-6 shrink-0 text-[#808080]"
                    size={24}
                  />
                </div>
              </div>

              {searchByOpen &&
                searchByPos &&
                createPortal(
                  <div
                    ref={searchByPortalRef}
                    style={{
                      position: "fixed",
                      left: searchByPos.left,
                      top: searchByPos.top + searchByPos.height + 4,
                      minWidth: searchByPos.width,
                      zIndex: 9999,
                    }}
                    className="overflow-hidden rounded-[16px] border border-[#D9D9D9] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.10)]"
                  >
                    {normalizedSearchOptions.map((option, index) => {
                      const isActive = option.value === filters.searchBy;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            updateFilter("searchBy", option.value);
                            setSearchByOpen(false);
                          }}
                          className={`block w-full whitespace-nowrap px-2 py-2 text-left text-[12px] ${
                            isActive ? "text-[#7C3AED]" : "text-[#444444]"
                          } ${index < normalizedSearchOptions.length - 1 ? "border-b border-[#D9D9D9]" : ""}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>,
                  typeof document !== "undefined"
                    ? document.body
                    : (null as any),
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Filter);
