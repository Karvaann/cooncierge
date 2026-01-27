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
import { getCustomers } from "@/services/customerApi";

export type CustomerDataType = {
  _id: string;
  id?: string | undefined;
  customId?: string | undefined;
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  tier?: string | number | undefined;
  alias?: string | undefined;
  nickname?: string | undefined;
};

type CustomerDropDownProps = {
  isOpen: boolean;
  selectedCustomer: CustomerDataType | null;
  onSelectCustomer: (customer: CustomerDataType | null) => void;
  locked?: boolean;
  label?: string;
  placeholder?: string;
};

const CustomerDropDown: React.FC<CustomerDropDownProps> = ({
  isOpen,
  selectedCustomer,
  onSelectCustomer,
  locked = false,
  label = "Search by Customer Name/ID",
  placeholder = "Search by Customer Name/ID",
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customerList, setCustomerList] = useState<CustomerDataType[]>([]);
  const [customerResults, setCustomerResults] = useState<CustomerDataType[]>(
    [],
  );
  const [showCustomerDropdown, setShowCustomerDropdown] =
    useState<boolean>(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);

  const lastPrefillCustomerIdRef = useRef<string | null>(null);

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

  const fetchCustomers = useCallback(async (term: string = "") => {
    setIsLoadingCustomers(true);
    try {
      const params: any = { isDeleted: false };
      if (term.trim()) params.search = term;
      const customers = await getCustomers(params);
      setCustomerList(customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomerList([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  // Initial fetch when sidesheet opens
  useEffect(() => {
    if (!isOpen) return;
    fetchCustomers("");
  }, [isOpen, fetchCustomers]);

  // Keep the visible text in sync when parent preselects a customer
  useEffect(() => {
    if (!isOpen) return;

    if (
      selectedCustomer &&
      selectedCustomer._id !== lastPrefillCustomerIdRef.current
    ) {
      lastPrefillCustomerIdRef.current = selectedCustomer._id;
      setSearchTerm(selectedCustomer.name || selectedCustomer.customId || "");
      setShowCustomerDropdown(false);
      setCustomerResults([]);
    }

    if (!selectedCustomer) {
      lastPrefillCustomerIdRef.current = null;
    }
  }, [isOpen, selectedCustomer]);

  // Reset internal dropdown state when the parent sidesheet closes
  useEffect(() => {
    if (isOpen) return;
    setSearchTerm("");
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setCustomerList([]);
    lastPrefillCustomerIdRef.current = null;
  }, [isOpen]);

  // Debounced API search when dropdown is open
  useEffect(() => {
    if (!isOpen) return;
    if (!showCustomerDropdown) return;
    const timer = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, showCustomerDropdown, searchTerm, fetchCustomers]);

  // Recompute fuzzy results when list changes while user is typing
  useEffect(() => {
    if (!isOpen) return;
    if (!showCustomerDropdown) return;
    if (!searchTerm.trim()) return;

    const results = runFuzzySearch(customerList, searchTerm, [
      "name",
      "customId",
      "tier",
      "phone",
    ]);
    setCustomerResults(results);
  }, [isOpen, showCustomerDropdown, customerList, searchTerm, runFuzzySearch]);

  const resetCustomerSelection = () => {
    onSelectCustomer(null);
    setSearchTerm("");
    setCustomerResults(customerList);
    setShowCustomerDropdown(true);
  };

  const handleCustomerSelect = (customer: CustomerDataType) => {
    onSelectCustomer(customer);
    setSearchTerm(customer.name || customer.customId || "");
    setCustomerResults([]);
    setShowCustomerDropdown(false);
  };

  const displayOverlay = useMemo(() => {
    if (!selectedCustomer) return null;
    const rating = getTierRating((selectedCustomer as any).tier) ?? 4;
    const alias = getAlias(selectedCustomer) || "-";
    return { rating, alias };
  }, [selectedCustomer]);

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
            if (selectedCustomer) {
              resetCustomerSelection();
            }
          }}
          onChange={(e) => {
            if (locked) return;

            const value = allowTextAndNumbers(e.target.value);
            // typing resets previously selected customer
            if (selectedCustomer) onSelectCustomer(null);
            setSearchTerm(value);

            if (value.trim() === "") {
              setCustomerResults([]);
              setShowCustomerDropdown(false);
              return;
            }

            const results = runFuzzySearch(customerList, value, [
              "name",
              "customId",
              "tier",
              "phone",
            ]);

            setCustomerResults(results);
            setShowCustomerDropdown(results.length > 0);
          }}
          onFocus={() => {
            if (locked) return;
            if (searchTerm.trim() !== "" && customerResults.length > 0)
              setShowCustomerDropdown(true);
          }}
          placeholder={placeholder}
          readOnly={locked}
          className={`w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 ${
            selectedCustomer ? "text-transparent caret-transparent" : ""
          }`}
        />

        {selectedCustomer && displayOverlay && (
          <div className="absolute inset-y-0 left-0 right-10 flex items-center px-4 pointer-events-none">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1 min-w-0">
                <p className="font-medium text-[13px] text-gray-900 truncate">
                  {selectedCustomer.name}
                </p>
                <span className="text-gray-300">|</span>
                <p className="text-[13px] text-gray-600 truncate">
                  {displayOverlay.alias}
                </p>
                <span className="text-gray-300">|</span>
                <p className="text-[13px] text-gray-600 truncate">
                  {selectedCustomer.customId || "-"}
                </p>
              </div>

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

      {isLoadingCustomers && showCustomerDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-[12px] text-gray-600">
          Loading...
        </div>
      )}

      {/* Customer Dropdown */}
      {showCustomerDropdown && customerResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {customerResults.map((customer) => {
            let rating = getTierRating((customer as any).tier) ?? 4;
            rating = Math.min(Math.max(rating || 4, 1), 5);
            const alias = getAlias(customer) || "-";
            return (
              <div
                key={customer._id}
                onClick={() => handleCustomerSelect(customer)}
                className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 min-w-0">
                    <p className="font-medium text-[13px] text-gray-900 truncate">
                      {customer.name}
                    </p>
                    <span className="text-gray-300">|</span>
                    <p className="text-[13px] text-gray-600 truncate">
                      {alias || "-"}
                    </p>
                    <span className="text-gray-300">|</span>
                    <p className="text-[13px] text-gray-600 truncate">
                      {customer.customId || "-"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <img
                      src={`/icons/tier-${rating}.png`}
                      alt={`Tier ${rating}`}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-[13px] font-semibold text-gray-700">
                      {rating}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showCustomerDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCustomerDropdown(false)}
        />
      )}
    </div>
  );
};

export default CustomerDropDown;
