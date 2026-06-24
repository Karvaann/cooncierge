"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Modal from "../../Modal";
import FilterInputShell from "@/components/FilterInputShell";
import { IoClose } from "react-icons/io5";

interface AddServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (services: string[]) => void;
  defaultValue?: string | string[];
}

const SERVICE_OPTIONS = [
  { value: "visa", label: "Visa" },
  { value: "insurance", label: "Insurance" },
];

const AddServicesModal: React.FC<AddServicesModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultValue = [],
}) => {
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(defaultValue)
      ? defaultValue
      : defaultValue
        ? [defaultValue]
        : [],
  );
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownPortalRef = useRef<HTMLDivElement | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const arraysEqual = (a?: string[], b?: string[]) => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  useEffect(() => {
    const next = Array.isArray(defaultValue)
      ? defaultValue
      : defaultValue
        ? [defaultValue]
        : [];
    setSelected((prev) => (arraysEqual(prev, next) ? prev : next));

    if (!isOpen) {
      setDropdownOpen(false);
      setQuery("");
    }
  }, [defaultValue, isOpen]);

  const recalcDropdownPos = useCallback(() => {
    const rect = dropdownRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDropdownPos({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
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
    if (typeof ResizeObserver !== "undefined" && dropdownRef.current) {
      ro = new ResizeObserver(() => recalcDropdownPos());
      try {
        ro.observe(dropdownRef.current);
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

  const handleToggle = (val: string) => {
    setSelected((prev) =>
      prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val],
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selected || selected.length === 0) return;
    onAdd?.(selected);
    onClose();
  };

  const options = useMemo(() => SERVICE_OPTIONS, []);
  const filtered = useMemo(() => {
    const q = String(query || "")
      .toLowerCase()
      .trim();
    if (!q) return options;
    return options.filter((o) =>
      String(o.label || o.value)
        .toLowerCase()
        .includes(q),
    );
  }, [options, query]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Services"
      size="md"
      customWidth="w-[550px]"
    >
      <form onSubmit={handleSubmit} className="px-4 py-3">
        <div className="mb-4 -mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Service
          </label>

          <div className="relative max-w-lg w-full" ref={dropdownRef}>
            <FilterInputShell
              placeholder="Search / Select Services"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                recalcDropdownPos();
                setDropdownOpen((prev) => !prev);
              }}
            >
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[10rem]">
                {selected.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-black pl-2 pr-3 py-1 rounded-full text-[14px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(s);
                      }}
                      className="text-[#818181]"
                      aria-label={`Remove ${s}`}
                    >
                      <IoClose size={16} />
                    </button>
                    {SERVICE_OPTIONS.find((o) => o.value === s)?.label ?? s}
                  </span>
                ))}

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!dropdownOpen) {
                      recalcDropdownPos();
                      setDropdownOpen(true);
                    }
                  }}
                  placeholder={
                    selected.length ? "" : "Search / Select Services"
                  }
                  className="flex-1 min-w-[10rem] bg-transparent outline-none text-[14px] font-normal text-black placeholder:text-[#9CA3AF]"
                />
              </div>
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
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500 text-[0.85rem]">
                      No services found
                    </div>
                  ) : (
                    filtered.map((opt) => {
                      const checked = selected.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(opt.value);
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
                            {opt.label}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>,
                typeof document !== "undefined" ? document.body : (null as any),
              )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#0D4B37]  mt-2 text-white px-4 py-1.5 rounded-md hover:cursor-pointer transition"
          >
            Add Service
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddServicesModal;
