"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { RiRefreshLine } from "react-icons/ri";

import Modal from "@/components/Modal";
import Button from "@/components/Button";
import FilterInputShell from "@/components/FilterInputShell";

export interface BookingOwnerOption {
  id?: string;
  _id?: string;
  value?: string;
  name?: string;
  label?: string;
}

interface SelectBookingOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  owners: BookingOwnerOption[];
  initialSelectedOwners?: string[];
  onApply: (selectedOwners: string[]) => void;
  onApplyAdvanced?: (primary: string[], secondary: string[]) => void;
  initialPrimaryOwners?: string[];
  initialSecondaryOwners?: string[];
  showAdvanceSearch?: boolean;
}

const SelectBookingOwnerModal: React.FC<SelectBookingOwnerModalProps> = ({
  isOpen,
  onClose,
  owners,
  initialSelectedOwners = [],
  onApply,
  onApplyAdvanced,
  initialPrimaryOwners = [],
  initialSecondaryOwners = [],
  showAdvanceSearch = false,
}) => {
  const [isAdvanceSearchEnabled, setIsAdvanceSearchEnabled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [ownerSearch, setOwnerSearch] = useState("");

  // Advance search states
  const [primaryOwners, setPrimaryOwners] = useState<string[]>(
    initialPrimaryOwners || [],
  );
  const [secondaryOwners, setSecondaryOwners] = useState<string[]>(
    initialSecondaryOwners || [],
  );
  const [primarySearch, setPrimarySearch] = useState("");
  const [secondarySearch, setSecondarySearch] = useState("");
  const [primaryDropdownOpen, setPrimaryDropdownOpen] = useState(false);
  const [secondaryDropdownOpen, setSecondaryDropdownOpen] = useState(false);

  const ownerDropdownRef = useRef<HTMLDivElement>(null);
  const primaryDropdownRef = useRef<HTMLDivElement>(null);
  const secondaryDropdownRef = useRef<HTMLDivElement>(null);

  const dropdownPortalRef = useRef<HTMLDivElement | null>(null);
  const primaryPortalRef = useRef<HTMLDivElement | null>(null);
  const secondaryPortalRef = useRef<HTMLDivElement | null>(null);

  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const [primaryDropdownPos, setPrimaryDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const [secondaryDropdownPos, setSecondaryDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const ownersList = useMemo(
    () =>
      (owners || []).map(
        (o: any) => o.label || o.name || o.value || String(o),
      ) as string[],
    [owners],
  );

  const filteredOwnersList = useMemo(
    () =>
      ownersList.filter((o) =>
        o.toLowerCase().includes(ownerSearch.toLowerCase()),
      ),
    [ownersList, ownerSearch],
  );

  const filteredPrimaryList = useMemo(
    () =>
      ownersList.filter((o) =>
        o.toLowerCase().includes(primarySearch.toLowerCase()),
      ),
    [ownersList, primarySearch],
  );

  const filteredSecondaryList = useMemo(
    () =>
      ownersList.filter((o) =>
        o.toLowerCase().includes(secondarySearch.toLowerCase()),
      ),
    [ownersList, secondarySearch],
  );

  const recalcDropdownPos = useCallback(() => {
    const rect = ownerDropdownRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownPos({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  const recalcPrimaryPos = useCallback(() => {
    const rect = primaryDropdownRef.current?.getBoundingClientRect();
    if (rect) {
      setPrimaryDropdownPos({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  const recalcSecondaryPos = useCallback(() => {
    const rect = secondaryDropdownRef.current?.getBoundingClientRect();
    if (rect) {
      setSecondaryDropdownPos({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      });
    }
  }, []);

  const arraysEqual = (a?: string[], b?: string[]) => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  const toggleOwner = useCallback((name: string) => {
    setSelectedOwners((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  }, []);

  const togglePrimaryOwner = useCallback((name: string) => {
    setPrimaryOwners((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  }, []);

  const toggleSecondaryOwner = useCallback((name: string) => {
    setSecondaryOwners((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    );
  }, []);

  const handleReset = useCallback(() => {
    setSelectedOwners([]);
    setOwnerSearch("");
    setPrimaryOwners([]);
    setSecondaryOwners([]);
    setPrimarySearch("");
    setSecondarySearch("");
    setDropdownOpen(false);
    setPrimaryDropdownOpen(false);
    setSecondaryDropdownOpen(false);
    setIsAdvanceSearchEnabled(false);
  }, []);

  const handleApply = useCallback(() => {
    if (isAdvanceSearchEnabled) {
      if (onApplyAdvanced) {
        onApplyAdvanced(primaryOwners, secondaryOwners);
      } else {
        // Fallback: combine for backward compatibility
        const combined = [
          ...new Set([...primaryOwners, ...secondaryOwners].filter(Boolean)),
        ];
        onApply(combined);
      }
    } else {
      onApply(selectedOwners);
    }
    onClose();
  }, [
    onApply,
    onApplyAdvanced,
    onClose,
    selectedOwners,
    isAdvanceSearchEnabled,
    primaryOwners,
    secondaryOwners,
  ]);

  // Sync initial selection on open
  useEffect(() => {
    if (!isOpen) return;

    if (!arraysEqual(selectedOwners, initialSelectedOwners)) {
      setSelectedOwners(initialSelectedOwners);
    }

    setOwnerSearch("");
    if (dropdownOpen) setDropdownOpen(false);

    // Auto-enable advance search if we have primary/secondary owner values
    const hasAdvanceSearchValues =
      (initialPrimaryOwners && initialPrimaryOwners.length > 0) ||
      (initialSecondaryOwners && initialSecondaryOwners.length > 0);
    if (isAdvanceSearchEnabled !== hasAdvanceSearchValues) {
      setIsAdvanceSearchEnabled(hasAdvanceSearchValues);
    }

    if (!arraysEqual(primaryOwners, initialPrimaryOwners)) {
      setPrimaryOwners(initialPrimaryOwners || []);
    }
    if (!arraysEqual(secondaryOwners, initialSecondaryOwners)) {
      setSecondaryOwners(initialSecondaryOwners || []);
    }

    setPrimarySearch("");
    setSecondarySearch("");
    if (primaryDropdownOpen) setPrimaryDropdownOpen(false);
    if (secondaryDropdownOpen) setSecondaryDropdownOpen(false);
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ownerDropdownRef.current && ownerDropdownRef.current.contains(target))
        return;
      if (
        dropdownPortalRef.current &&
        dropdownPortalRef.current.contains(target)
      )
        return;
      setDropdownOpen(false);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [dropdownOpen]);

  // Recalculate dropdown position when open or on resize/scroll
  useEffect(() => {
    if (!dropdownOpen) return;

    recalcDropdownPos();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && ownerDropdownRef.current) {
      ro = new ResizeObserver(() => recalcDropdownPos());
      try {
        ro.observe(ownerDropdownRef.current);
      } catch {
        // ignore
      }
    }

    window.addEventListener("resize", recalcDropdownPos);
    window.addEventListener("scroll", recalcDropdownPos, true);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", recalcDropdownPos);
      window.removeEventListener("scroll", recalcDropdownPos, true);
    };
  }, [dropdownOpen, recalcDropdownPos]);

  // Primary dropdown positioning
  useEffect(() => {
    if (!primaryDropdownOpen) return;

    recalcPrimaryPos();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && primaryDropdownRef.current) {
      ro = new ResizeObserver(() => recalcPrimaryPos());
      try {
        ro.observe(primaryDropdownRef.current);
      } catch {
        // ignore
      }
    }

    window.addEventListener("resize", recalcPrimaryPos);
    window.addEventListener("scroll", recalcPrimaryPos, true);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", recalcPrimaryPos);
      window.removeEventListener("scroll", recalcPrimaryPos, true);
    };
  }, [primaryDropdownOpen, recalcPrimaryPos]);

  // Secondary dropdown positioning
  useEffect(() => {
    if (!secondaryDropdownOpen) return;

    recalcSecondaryPos();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && secondaryDropdownRef.current) {
      ro = new ResizeObserver(() => recalcSecondaryPos());
      try {
        ro.observe(secondaryDropdownRef.current);
      } catch {
        // ignore
      }
    }

    window.addEventListener("resize", recalcSecondaryPos);
    window.addEventListener("scroll", recalcSecondaryPos, true);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", recalcSecondaryPos);
      window.removeEventListener("scroll", recalcSecondaryPos, true);
    };
  }, [secondaryDropdownOpen, recalcSecondaryPos]);

  // Close primary dropdown on outside click
  useEffect(() => {
    if (!primaryDropdownOpen) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        primaryDropdownRef.current &&
        primaryDropdownRef.current.contains(target)
      )
        return;
      if (primaryPortalRef.current && primaryPortalRef.current.contains(target))
        return;
      setPrimaryDropdownOpen(false);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [primaryDropdownOpen]);

  // Close secondary dropdown on outside click
  useEffect(() => {
    if (!secondaryDropdownOpen) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        secondaryDropdownRef.current &&
        secondaryDropdownRef.current.contains(target)
      )
        return;
      if (
        secondaryPortalRef.current &&
        secondaryPortalRef.current.contains(target)
      )
        return;
      setSecondaryDropdownOpen(false);
    };

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [secondaryDropdownOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      headerLeft={
        <div className="relative w-full">
          <h2 className="text-black text-[1rem] md:text-[1.15rem] font-semibold leading-snug m-0">
            Select Booking Owners
          </h2>
          <div className="absolute top-8 left-[-8] right-[-570] z-10 border-b border-gray-300" />
        </div>
      }
      customWidth="max-w-4xl"
      className="w-[52rem]"
    >
      <div className="w-full">
        {/* Advance Search Checkbox */}
        {showAdvanceSearch && (
          <div className="mb-4 flex items-center justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="w-4 h-4 border border-gray-300 rounded-md flex items-center justify-center cursor-pointer"
                onClick={() => setIsAdvanceSearchEnabled((prev) => !prev)}
              >
                {isAdvanceSearchEnabled && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="11"
                    viewBox="0 0 12 11"
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
              </div>
              <span className="text-[14px] text-[#414141] font-medium">
                Advance Search
              </span>
            </label>
          </div>
        )}

        {!isAdvanceSearchEnabled ? (
          <>
            {/* Single Owner Selection */}
            <div className="relative" ref={ownerDropdownRef}>
              <FilterInputShell
                placeholder="Search / Select Owners"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  recalcDropdownPos();
                  setDropdownOpen((prev) => !prev);
                }}
              >
                <input
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!dropdownOpen) {
                      recalcDropdownPos();
                      setDropdownOpen(true);
                    }
                  }}
                  placeholder="Search / Select Owners"
                  className="flex-1 min-w-[10rem] bg-transparent outline-none text-[14px] font-normal text-black placeholder:text-[#9CA3AF]"
                />
              </FilterInputShell>

              {dropdownOpen &&
                dropdownPos &&
                createPortal(
                  <div
                    ref={dropdownPortalRef}
                    style={{
                      position: "fixed",
                      left: dropdownPos.left,
                      top: dropdownPos.top + dropdownPos.height + 6,
                      width: dropdownPos.width,
                      zIndex: 9999,
                      minHeight: 32,
                    }}
                    className="bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto"
                  >
                    {filteredOwnersList.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500 text-[0.85rem]">
                        No owners found
                      </div>
                    ) : (
                      filteredOwnersList.map((owner) => {
                        const checked = selectedOwners.includes(owner);

                        return (
                          <label
                            key={owner}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOwner(owner);
                            }}
                          >
                            <div className="w-4 h-4 border border-gray-300 rounded-md flex items-center justify-center">
                              {checked && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="11"
                                  viewBox="0 0 12 11"
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
                            </div>
                            <span className="text-black text-[14px]">
                              {owner}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>,
                  typeof document !== "undefined"
                    ? document.body
                    : (null as any),
                )}
            </div>

            {/* Pills under input */}
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedOwners.map((o) => (
                <span
                  key={o}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-black pl-2 pr-3 py-1 rounded-full text-[14px]"
                >
                  <button
                    type="button"
                    onClick={() => toggleOwner(o)}
                    className="text-[#818181]"
                    aria-label={`Remove ${o}`}
                  >
                    <IoClose size={18} />
                  </button>
                  {o}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Advance Search: Two Columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Primary Owner(s) */}
              <div>
                <h3 className="text-[16px] font-medium text-[#1F2937] mb-3">
                  Primary Owner(s)
                </h3>
                <div className="relative" ref={primaryDropdownRef}>
                  <FilterInputShell
                    placeholder="Search / Select Owners"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      recalcPrimaryPos();
                      setPrimaryDropdownOpen((prev) => !prev);
                    }}
                  >
                    <input
                      value={primarySearch}
                      onChange={(e) => setPrimarySearch(e.target.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!primaryDropdownOpen) {
                          recalcPrimaryPos();
                          setPrimaryDropdownOpen(true);
                        }
                      }}
                      placeholder="Search / Select Owners"
                      className="flex-1 min-w-[10rem] bg-transparent outline-none text-[14px] font-normal text-black placeholder:text-[#9CA3AF]"
                    />
                  </FilterInputShell>

                  {primaryDropdownOpen &&
                    primaryDropdownPos &&
                    createPortal(
                      <div
                        ref={primaryPortalRef}
                        style={{
                          position: "fixed",
                          left: primaryDropdownPos.left,
                          top:
                            primaryDropdownPos.top +
                            primaryDropdownPos.height +
                            6,
                          width: primaryDropdownPos.width,
                          zIndex: 9999,
                          minHeight: 32,
                        }}
                        className="bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto"
                      >
                        {filteredPrimaryList.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-[0.85rem]">
                            No owners found
                          </div>
                        ) : (
                          filteredPrimaryList.map((owner) => {
                            const checked = primaryOwners.includes(owner);

                            return (
                              <label
                                key={owner}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePrimaryOwner(owner);
                                }}
                              >
                                <div className="w-4 h-4 border border-gray-300 rounded-md flex items-center justify-center">
                                  {checked && (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="11"
                                      viewBox="0 0 12 11"
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
                                </div>
                                <span className="text-black text-[14px]">
                                  {owner}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>,
                      typeof document !== "undefined"
                        ? document.body
                        : (null as any),
                    )}
                </div>

                {/* Primary Pills */}
                <div className="mt-3 flex flex-wrap gap-2 min-h-[2rem]">
                  {primaryOwners.map((o) => (
                    <span
                      key={o}
                      className="flex items-center gap-2 bg-white border border-gray-200 text-black pl-2 pr-3 py-1 rounded-full text-[14px]"
                    >
                      <button
                        type="button"
                        onClick={() => togglePrimaryOwner(o)}
                        className="text-[#818181]"
                        aria-label={`Remove ${o}`}
                      >
                        <IoClose size={18} />
                      </button>
                      {o}
                    </span>
                  ))}
                </div>

                {/* Primary Count */}
                <div className="mt-3 text-[14px] text-[#6B7280]">
                  ({primaryOwners.length}) Owner Selected
                </div>
              </div>

              {/* Secondary Owner(s) */}
              <div>
                <h3 className="text-[16px] font-medium text-[#1F2937] mb-3">
                  Secondary Owner(s)
                </h3>
                <div className="relative" ref={secondaryDropdownRef}>
                  <FilterInputShell
                    placeholder="Search / Select Owners"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      recalcSecondaryPos();
                      setSecondaryDropdownOpen((prev) => !prev);
                    }}
                  >
                    <input
                      value={secondarySearch}
                      onChange={(e) => setSecondarySearch(e.target.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!secondaryDropdownOpen) {
                          recalcSecondaryPos();
                          setSecondaryDropdownOpen(true);
                        }
                      }}
                      placeholder="Search / Select Owners"
                      className="flex-1 min-w-[10rem] bg-transparent outline-none text-[14px] font-normal text-black placeholder:text-[#9CA3AF]"
                    />
                  </FilterInputShell>

                  {secondaryDropdownOpen &&
                    secondaryDropdownPos &&
                    createPortal(
                      <div
                        ref={secondaryPortalRef}
                        style={{
                          position: "fixed",
                          left: secondaryDropdownPos.left,
                          top:
                            secondaryDropdownPos.top +
                            secondaryDropdownPos.height +
                            6,
                          width: secondaryDropdownPos.width,
                          zIndex: 9999,
                          minHeight: 32,
                        }}
                        className="bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto"
                      >
                        {filteredSecondaryList.length === 0 ? (
                          <div className="px-3 py-2 text-gray-500 text-[0.85rem]">
                            No owners found
                          </div>
                        ) : (
                          filteredSecondaryList.map((owner) => {
                            const checked = secondaryOwners.includes(owner);

                            return (
                              <label
                                key={owner}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSecondaryOwner(owner);
                                }}
                              >
                                <div className="w-4 h-4 border border-gray-300 rounded-md flex items-center justify-center">
                                  {checked && (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="11"
                                      viewBox="0 0 12 11"
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
                                </div>
                                <span className="text-black text-[14px]">
                                  {owner}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>,
                      typeof document !== "undefined"
                        ? document.body
                        : (null as any),
                    )}
                </div>

                {/* Secondary Pills */}
                <div className="mt-3 flex flex-wrap gap-2 min-h-[2rem]">
                  {secondaryOwners.map((o) => (
                    <span
                      key={o}
                      className="flex items-center gap-2 bg-white border border-gray-200 text-black pl-2 pr-3 py-1 rounded-full text-[14px]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSecondaryOwner(o)}
                        className="text-[#818181]"
                        aria-label={`Remove ${o}`}
                      >
                        <IoClose size={18} />
                      </button>
                      {o}
                    </span>
                  ))}
                </div>

                {/* Secondary Count */}
                <div className="mt-3 text-[14px] text-[#6B7280]">
                  ({secondaryOwners.length}) Owners Selected
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom bar */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-[14px] text-[#6B7280] font-medium">
            {!isAdvanceSearchEnabled
              ? `(${selectedOwners.length}) Owners Selected`
              : `(${primaryOwners.length + secondaryOwners.length}) Owners Selected`}
          </div>

          <div className="flex items-center gap-3">
            <Button
              text="Reset"
              onClick={handleReset}
              icon={<RiRefreshLine size={18} />}
              bgColor="bg-white"
              textColor="text-[#414141]"
              className="border border-[#414141] hover:bg-gray-200 font-semibold px-4 py-1.5"
            />
            <Button
              text="Apply"
              onClick={handleApply}
              bgColor="bg-[#0D4B37]"
              textColor="text-white"
              className="border border-[#0D4B37] hover:bg-[#125E45] font-semibold px-4 py-1.5"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(SelectBookingOwnerModal);
