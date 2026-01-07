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
}

const SelectBookingOwnerModal: React.FC<SelectBookingOwnerModalProps> = ({
  isOpen,
  onClose,
  owners,
  initialSelectedOwners = [],
  onApply,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [ownerSearch, setOwnerSearch] = useState("");

  const ownerDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownPortalRef = useRef<HTMLDivElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const ownersList = useMemo(
    () =>
      (owners || []).map(
        (o: any) => o.label || o.name || o.value || String(o)
      ) as string[],
    [owners]
  );

  const filteredOwnersList = useMemo(
    () =>
      ownersList.filter((o) =>
        o.toLowerCase().includes(ownerSearch.toLowerCase())
      ),
    [ownersList, ownerSearch]
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

  const toggleOwner = useCallback((name: string) => {
    setSelectedOwners((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  }, []);

  const handleReset = useCallback(() => {
    setSelectedOwners([]);
    setOwnerSearch("");
  }, []);

  const handleApply = useCallback(() => {
    onApply(selectedOwners);
    onClose();
  }, [onApply, onClose, selectedOwners]);

  // Sync initial selection on open
  useEffect(() => {
    if (!isOpen) return;
    setSelectedOwners(initialSelectedOwners);
    setOwnerSearch("");
    setDropdownOpen(false);
  }, [isOpen, initialSelectedOwners]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Booking Owners"
      customWidth="max-w-4xl"
      className="w-[52rem]"
    >
      <div className="w-full">
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
                        <span className="text-black text-[14px]">{owner}</span>
                      </label>
                    );
                  })
                )}
              </div>,
              typeof document !== "undefined" ? document.body : (null as any)
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

        {/* Bottom bar */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-[14px] text-[#6B7280] font-medium">
            ({selectedOwners.length}) Owners Selected
          </div>

          <div className="flex items-center gap-3">
            <Button
              text="Reset"
              onClick={handleReset}
              icon={<RiRefreshLine size={18} />}
              bgColor="bg-white"
              textColor="text-[#414141]"
              className="border border-[#414141] hover:bg-gray-200 font-semibold px-6 py-2.5"
            />
            <Button
              text="Apply"
              onClick={handleApply}
              bgColor="bg-[#0D4B37]"
              textColor="text-white"
              className="border border-[#0D4B37] hover:bg-[#125E45] font-semibold px-6 py-2.5"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(SelectBookingOwnerModal);
