"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Fuse from "fuse.js";
import { allowTextAndNumbers } from "@/utils/inputValidators";
import { getVendors } from "@/services/vendorApi";

export type VendorDataType = {
  _id: string;
  customId?: string | undefined;
  name: string;
  alias?: string | undefined;
  companyName?: string | undefined;
  contactPerson?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  tier?: string | number | undefined;
  nickname?: string | undefined;
};

type VendorDropDownProps = {
  isOpen: boolean;
  selectedVendor: VendorDataType | null;
  onSelectVendor: (vendor: VendorDataType | null) => void;
  locked?: boolean;
  label?: string;
  placeholder?: string;
};

const VendorDropDown: React.FC<VendorDropDownProps> = ({
  isOpen,
  selectedVendor,
  onSelectVendor,
  locked = false,
  label = "Search by Vendor Name/ID",
  placeholder = "Search by Vendor Name/ID",
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [vendorList, setVendorList] = useState<VendorDataType[]>([]);
  const [vendorResults, setVendorResults] = useState<VendorDataType[]>([]);
  const [showVendorDropdown, setShowVendorDropdown] = useState<boolean>(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(false);

  const lastPrefillVendorIdRef = useRef<string | null>(null);

  const getTierRating = (tier: unknown): number | null => {
    try {
      if (!tier) return null;
      if (typeof tier === "number") return Math.round(tier);
      if (typeof tier === "string") {
        const num = Number(tier);
        if (!Number.isFinite(num)) return null;
        return Math.round(num);
      }
      return null;
    } catch {
      return null;
    }
  };

  const getAlias = (obj: unknown): string => {
    const anyObj = obj as any;
    return (anyObj?.alias || anyObj?.nickname || "") as string;
  };

  const runFuzzySearch = useCallback(
    <T,>(list: T[], term: string, keys: (keyof T)[]): T[] => {
      if (!term.trim()) return [];

      const fuse = new Fuse(list, {
        threshold: 0.3,
        keys: keys as string[],
      });

      return fuse.search(term).map((r) => r.item);
    },
    [],
  );

  const fetchVendors = useCallback(async (term: string = "") => {
    setIsLoadingVendors(true);
    try {
      const params: any = { isDeleted: false };
      if (term.trim()) params.search = term;
      const vendors = await getVendors(params);
      setVendorList(vendors || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendorList([]);
    } finally {
      setIsLoadingVendors(false);
    }
  }, []);

  // Initial fetch when sidesheet opens
  useEffect(() => {
    if (!isOpen) return;
    fetchVendors("");
  }, [isOpen, fetchVendors]);

  // Keep the visible text in sync when parent preselects a vendor
  useEffect(() => {
    if (!isOpen) return;

    if (
      selectedVendor &&
      selectedVendor._id !== lastPrefillVendorIdRef.current
    ) {
      lastPrefillVendorIdRef.current = selectedVendor._id;
      const primary =
        selectedVendor.companyName ||
        selectedVendor.contactPerson ||
        selectedVendor.customId ||
        "";
      setSearchTerm(primary);
      setShowVendorDropdown(false);
      setVendorResults([]);
    }

    if (!selectedVendor) {
      lastPrefillVendorIdRef.current = null;
    }
  }, [isOpen, selectedVendor]);

  // Reset internal dropdown state when the parent sidesheet closes
  useEffect(() => {
    if (isOpen) return;
    setSearchTerm("");
    setVendorResults([]);
    setShowVendorDropdown(false);
    setVendorList([]);
    lastPrefillVendorIdRef.current = null;
  }, [isOpen]);

  // Debounced API search when dropdown is open
  useEffect(() => {
    if (!isOpen) return;
    if (!showVendorDropdown) return;
    const timer = setTimeout(() => {
      fetchVendors(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, showVendorDropdown, searchTerm, fetchVendors]);

  // Recompute fuzzy results when list changes while user is typing
  useEffect(() => {
    if (!isOpen) return;
    if (!showVendorDropdown) return;
    if (!searchTerm.trim()) return;

    const results = runFuzzySearch(vendorList, searchTerm, [
      "companyName",
      "contactPerson",
      "alias",
      "tier",
      "customId",
    ]);
    setVendorResults(results);
  }, [isOpen, showVendorDropdown, vendorList, searchTerm, runFuzzySearch]);

  const resetVendorSelection = () => {
    onSelectVendor(null);
    setSearchTerm("");
    setVendorResults(vendorList);
    setShowVendorDropdown(true);
  };

  const handleVendorSelect = (vendor: VendorDataType) => {
    onSelectVendor(vendor);
    const primary =
      vendor.companyName || vendor.contactPerson || vendor.customId || "";
    setSearchTerm(primary);
    setVendorResults([]);
    setShowVendorDropdown(false);
  };

  const displayOverlay = useMemo(() => {
    if (!selectedVendor) return null;
    const rating = getTierRating((selectedVendor as any).tier);
    const alias = getAlias(selectedVendor) || "-";
    const primary =
      selectedVendor.companyName || selectedVendor.contactPerson || "";
    return { rating, alias, primary };
  }, [selectedVendor]);

  return (
    <div className="relative">
      <label className="block text-[13px] font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onClick={() => {
            if (locked) return;
            if (selectedVendor) {
              resetVendorSelection();
            }
          }}
          onChange={(e) => {
            if (locked) return;

            const value = allowTextAndNumbers(e.target.value);
            if (selectedVendor) onSelectVendor(null);
            setSearchTerm(value);

            if (value.trim() === "") {
              setVendorResults([]);
              setShowVendorDropdown(false);
              return;
            }

            const results = runFuzzySearch(vendorList, value, [
              "companyName",
              "contactPerson",
              "alias",
              "tier",
              "customId",
            ]);

            setVendorResults(results);
            setShowVendorDropdown(results.length > 0);
          }}
          onFocus={() => {
            if (locked) return;
            if (searchTerm.trim() !== "" && vendorResults.length > 0)
              setShowVendorDropdown(true);
          }}
          placeholder={placeholder}
          readOnly={locked}
          className={`w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 ${
            selectedVendor ? "text-transparent caret-transparent" : ""
          }`}
        />

        {selectedVendor && displayOverlay && (
          <div className="absolute inset-y-0 left-0 right-10 flex items-center px-4 pointer-events-none">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1 min-w-0">
                <p className="font-normal text-[13px] text-gray-900 truncate">
                  {displayOverlay.primary}
                </p>
                <span className="text-gray-300">|</span>
                <p className="text-[13px] text-gray-600 truncate">
                  {displayOverlay.alias}
                </p>
                <span className="text-gray-300">|</span>
                <p className="text-[13px] text-gray-600 truncate">
                  {selectedVendor.customId || "-"}
                </p>
              </div>

              {displayOverlay.rating !== null ? (
                <div className="flex items-center gap-1 shrink-0">
                  <img
                    src={`/icons/tier-${displayOverlay.rating}.png`}
                    alt={`Tier ${displayOverlay.rating}`}
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-[13px] font-semibold text-gray-700">
                    {displayOverlay.rating}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <svg
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isLoadingVendors && showVendorDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-[12px] text-gray-600">
          Loading...
        </div>
      )}

      {/* Vendor Dropdown */}
      {showVendorDropdown && vendorResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {vendorResults.map((vendor) => {
            let rating: number | null = getTierRating((vendor as any).tier);
            if (rating !== null) rating = Math.min(Math.max(rating, 1), 5);
            const alias = getAlias(vendor) || "-";
            const primary = vendor.companyName || vendor.contactPerson || "";
            return (
              <div
                key={vendor._id}
                onClick={() => handleVendorSelect(vendor)}
                className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="font-normal text-[13px] text-gray-900 truncate">
                      {primary}
                    </p>
                    <span className="text-gray-300">|</span>
                    <p className="text-[13px] text-gray-600 truncate">
                      {alias || "-"}
                    </p>
                    <span className="text-gray-300">|</span>
                    <p className="text-[13px] text-gray-600 truncate">
                      {vendor.customId || "-"}
                    </p>
                  </div>

                  {rating !== null ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <img
                        src={`/icons/tier-${rating}.png`}
                        alt={`Tier ${rating}`}
                        className="w-4 h-4 object-contain"
                      />
                      <span className="text-[0.75rem] font-semibold text-gray-700">
                        {rating}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showVendorDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowVendorDropdown(false)}
        />
      )}
    </div>
  );
};

export default VendorDropDown;
