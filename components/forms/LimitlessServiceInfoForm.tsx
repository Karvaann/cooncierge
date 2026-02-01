"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { validateOtherServiceInfoForm } from "@/services/bookingApi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2, FiSearch } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { useRef } from "react";
import StyledDescription from "../StyledDescription";
import DropDown from "@/components/DropDown";
import SingleCalendar from "@/components/SingleCalendar";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import { FaRegFolder } from "react-icons/fa";
import { allowUppercaseAlphanumeric6 } from "@/utils/inputValidators";
import type { CancellationModalFormState } from "@/components/Modals/CancellationModal";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import LimitlessApi from "@/services/limitlessApi";

// Type definitions
interface LimitlessServiceInfoFormData {
  customId?: string;
  bookingdate: string;
  traveldatestart: string;
  limitlessDestinations?: string[];
  traveldateend: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  sellingprice: number | string;
  confirmationNumber: number | string;
  itineraryname: string;
  description: string;
  documents?: string | File;
  remarks: string;

  sellingCurrency?: "USD" | "INR";
  sellingRoe?: string;
  sellingInr?: string;
  sellingNotes?: string;

  // Persist cancellation modal form data with the booking
  cancellationForm?: CancellationModalFormState;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ExternalFormData {
  formFields?: Partial<LimitlessServiceInfoFormData>;
  limitlessinfoform?: Partial<LimitlessServiceInfoFormData>;
}

interface LimitlessServiceInfoFormProps {
  onSubmit?: (data: LimitlessServiceInfoFormData) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLDivElement | null>;
  onFormDataUpdate: (data: any) => void;
  onRegisterSubmit?: (submit: () => Promise<any>) => void;
  onAddDocuments?: (files: File[]) => void;
  externalFormData?: ExternalFormData | Record<string, unknown>;
  existingDocuments?: Array<{
    originalName?: string;
    fileName?: string;
    url?: string;
    key?: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string | Date;
    _id?: string;
  }>;
}

const LimitlessServiceInfoForm: React.FC<LimitlessServiceInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  isReadOnly = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
  onRegisterSubmit,
  onAddDocuments,
  externalFormData,
  existingDocuments = [],
}) => {
  const normalizedExternalData = useMemo(() => {
    const source = externalFormData ?? {};
    const fields =
      (source as ExternalFormData)?.formFields ??
      (source as ExternalFormData)?.limitlessinfoform ??
      source;

    const raw = (source as any) || {};
    const f = (fields as any) || {};

    const normalizeStatus = (val: any): string => {
      const s = String(val || "").trim();
      if (!s) return "";
      const lower = s.toLowerCase();
      if (lower === "confirmed") return "Confirmed";
      if (lower === "cancelled" || lower === "canceled") return "Canceled";
      if (lower === "in progress" || lower === "in_progress")
        return "In Progress";
      return s;
    };

    // form-like shape (booking screens often store under formFields/limitlessinfoform)
    // backend booking shape
    const merged: Partial<LimitlessServiceInfoFormData> = {
      ...f,
      customId: f.customId ?? raw.customId,
      bookingdate: f.bookingdate ?? raw.bookingDate ?? raw.bookingdate,
      traveldatestart:
        f.traveldatestart ?? raw.travelDate ?? raw.traveldatestart,
      traveldateend: f.traveldateend ?? raw.travelDateEnd ?? raw.traveldateend,
      bookingstatus: normalizeStatus(
        f.bookingstatus ?? raw.status ?? raw.bookingstatus,
      ),

      sellingprice: f.sellingprice ?? raw.totalAmount ?? raw.sellingprice,
      sellingCurrency: (f.sellingCurrency ??
        raw.currency ??
        raw.sellingCurrency) as any,
      sellingRoe: String(f.sellingRoe ?? raw.roe ?? raw.sellingRoe ?? ""),
      sellingInr: String(f.sellingInr ?? raw.sellingInr ?? ""),
      sellingNotes: f.sellingNotes ?? raw.sellingNotes,

      itineraryname: f.itineraryname ?? raw.limitlessTitle ?? raw.itineraryname,
      description: f.description ?? raw.description,
      remarks: f.remarks ?? raw.remarks,
      limitlessDestinations:
        f.limitlessDestinations ?? raw.limitlessDestinations,
    };

    return merged;
  }, [externalFormData]);

  // Internal form state
  const [formData, setFormData] = useState<LimitlessServiceInfoFormData>({
    customId: normalizedExternalData?.customId || "",
    bookingdate: normalizedExternalData?.bookingdate || "",
    traveldatestart: normalizedExternalData?.traveldatestart || "",
    traveldateend: normalizedExternalData?.traveldateend || "",
    bookingstatus: normalizedExternalData?.bookingstatus || "",
    sellingprice: normalizedExternalData?.sellingprice || "",
    sellingCurrency:
      (normalizedExternalData?.sellingCurrency as "USD" | "INR") || "INR",
    sellingRoe: String(normalizedExternalData?.sellingRoe ?? ""),
    sellingInr: String(normalizedExternalData?.sellingInr ?? ""),
    sellingNotes: normalizedExternalData?.sellingNotes || "",
    confirmationNumber: normalizedExternalData?.confirmationNumber || "",
    itineraryname: normalizedExternalData?.itineraryname || "",
    description: normalizedExternalData?.description || "",
    documents: "",
    remarks: normalizedExternalData?.remarks || "",

    cancellationForm: (normalizedExternalData as any)?.cancellationForm,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const businessCurrency = useMemo(() => getBusinessCurrency(user), [user]);
  const [showSellingNotes, setShowSellingNotes] = useState<boolean>(
    Boolean(formData.sellingNotes),
  );

  type Place = { id: string; name: string };

  const demoPlaces = useMemo<Place[]>(
    () => [
      { id: "dest-1", name: "Paris" },
      { id: "dest-2", name: "London" },
      { id: "dest-3", name: "Rome" },
      { id: "dest-4", name: "Dubai" },
      { id: "dest-5", name: "Bangkok" },
    ],
    [],
  );

  const [selectedDestinations, setSelectedDestinations] = useState<Place[]>([
    // optionally preselect one: { id: "dest-1", name: "Paris" }
  ]);

  // Initialize selectedDestinations from external data when provided
  useEffect(() => {
    const vals = normalizedExternalData?.limitlessDestinations;
    if (Array.isArray(vals) && vals.length > 0) {
      const mapped: Place[] = vals.map((name: any, idx: number) => ({
        id: `ext-${idx}`,
        name: String(name),
      }));
      setSelectedDestinations(mapped);
    }
  }, [normalizedExternalData]);
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState(false);
  const destDropdownRef = useRef<HTMLDivElement | null>(null);
  const destPanelRef = useRef<HTMLDivElement | null>(null);
  const [destDropdownPos, setDestDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const toggleDestination = (place: Place) => {
    setSelectedDestinations((prev) => {
      const exists = prev.some((p) => p.id === place.id);
      return exists ? prev.filter((p) => p.id !== place.id) : [...prev, place];
    });
  };

  const updateDestPos = () => {
    const el = destDropdownRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDestDropdownPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  const openDestDropdown = () => {
    updateDestPos();
    setIsDestDropdownOpen(true);
  };

  const closeDestDropdown = () => {
    setDestDropdownPos(null);
    setIsDestDropdownOpen(false);
  };

  // Create Limitless (multipart/form-data)
  const handleSubmit = useCallback(async () => {
    const formDataPayload = new FormData();

    const appendIfPresent = (key: string, value: unknown) => {
      if (value === undefined || value === null) return;
      const str = String(value);
      if (str.trim() === "") return;
      formDataPayload.append(key, str);
    };

    // Required by controller if serviceStatus !== 'draft'
    appendIfPresent("totalAmount", formData.sellingprice);
    appendIfPresent("travelDate", formData.traveldatestart);

    // Optional / mapped fields
    appendIfPresent("bookingDate", formData.bookingdate);
    appendIfPresent("roe", formData.sellingRoe);
    appendIfPresent("currency", formData.sellingCurrency || "INR");
    appendIfPresent("limitlessTitle", formData.itineraryname);
    appendIfPresent("description", formData.description);
    appendIfPresent("remarks", formData.remarks);

    appendIfPresent("customId", (formData as any).customId);

    // Keep as JSON string (backend parses JSON fields when they arrive as strings)
    formDataPayload.append(
      "limitlessDestinations",
      JSON.stringify(selectedDestinations.map((d) => d.name)),
    );

    // Make this explicit so backend validation is predictable
    formDataPayload.append("serviceStatus", "approved");

    // Documents field name must be "documents" (multer middleware expects it)
    attachedFiles.slice(0, 3).forEach((file) => {
      formDataPayload.append("documents", file);
    });

    return LimitlessApi.createLimitless(formDataPayload);
  }, [attachedFiles, formData, selectedDestinations]);

  useEffect(() => {
    onRegisterSubmit?.(handleSubmit);
  }, [handleSubmit, onRegisterSubmit]);

  useEffect(() => {
    if (!isDestDropdownOpen) return;

    const onPointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const rawEvent = event as any;
      const target = (rawEvent.target || null) as Node | null;
      if (!target) return;

      // Prefer composedPath (works with portals / shadow DOM), fallback to event.path or normal contains
      const path: EventTarget[] =
        (rawEvent.composedPath && rawEvent.composedPath()) ||
        rawEvent.path ||
        [];

      const clickedInAnchor = Boolean(
        destDropdownRef.current &&
        (destDropdownRef.current.contains(target) ||
          path.includes(destDropdownRef.current)),
      );

      const clickedInPanel = Boolean(
        destPanelRef.current &&
        (destPanelRef.current.contains(target) ||
          path.includes(destPanelRef.current)),
      );

      if (!clickedInAnchor && !clickedInPanel) closeDestDropdown();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDestDropdown();
    };

    const onReposition = () => updateDestPos();

    // listen to pointerdown/touchstart/mousedown for broader coverage
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [isDestDropdownOpen]);

  // Handle selecting multiple files
  const handleFileChange = () => {
    const files = fileInputRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);

    setAttachedFiles((prev) => [...prev, ...selected]);

    onAddDocuments?.(selected);

    // Reset so selecting the same file again is possible
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Remove one file
  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Sync with external form data when it changes
  useEffect(() => {
    if (!externalFormData || Object.keys(externalFormData).length === 0) return;

    setFormData((prev) => ({
      ...prev,
      ...normalizedExternalData,
    }));
  }, [externalFormData, normalizedExternalData]);

  // Calculate nights and days from travel start/end (expects DD-MM-YYYY or DD/MM/YYYY)
  const nightsDaysDisplay = useMemo(() => {
    const parseToUTC = (s?: string) => {
      if (!s || typeof s !== "string") return null;

      // If it's an ISO string (from SingleCalendar onChange) or YYYY-MM-DD-like, parse via Date
      if (s.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return null;
        return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      }

      // Otherwise expect DD-MM-YYYY or DD/MM/YYYY
      const parts = s.includes("-") ? s.split("-") : s.split("/");
      if (parts.length !== 3) return null;
      const [dd, mm, yyyy] = parts;
      const day = Number(dd);
      const monthIndex = Number(mm) - 1;
      const year = Number(yyyy);
      if (Number.isNaN(day) || Number.isNaN(monthIndex) || Number.isNaN(year))
        return null;
      return Date.UTC(year, monthIndex, day);
    };

    const startUtc = parseToUTC(formData.traveldatestart);
    const endUtc = parseToUTC(formData.traveldateend);
    if (startUtc === null || endUtc === null) return "";

    const msPerDay = 24 * 60 * 60 * 1000;
    // Round to nearest integer number of days to be resilient to DST/local offsets
    const diffDays = Math.round((endUtc - startUtc) / msPerDay);
    const nights = Math.max(0, diffDays);
    const days = nights + 1;

    return `${nights}N/${days}D`;
  }, [formData.traveldatestart, formData.traveldateend]);

  useEffect(() => {
    onFormDataUpdate({
      limitlessinfoform: {
        ...formData,
        limitlessDestinations: selectedDestinations.map((d) => d.name),
      },
    });
  }, [formData, selectedDestinations, onFormDataUpdate]);

  type FieldRule = {
    required: boolean;
    message: string;
    minLength?: number;
    pattern?: RegExp;
  };

  const validationRules: Record<string, FieldRule> = useMemo(
    () => ({
      firstname: {
        required: true,
        minLength: 2,
        message: "First name is required (minimum 2 characters)",
      },
      lastname: {
        required: true,
        minLength: 2,
        message: "Last name is required (minimum 2 characters)",
      },
      contactnumber: {
        required: true,
        pattern: /^\d{10}$/,
        message: "Contact number must be 10 digits",
      },
      emailId: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Invalid email format",
      },
    }),
    [],
  );

  // Enhanced validation function using API validation
  const validateField = useCallback(
    (name: string, value: any): string => {
      // API-level validation only for OtherServiceInfoForm fields
      const apiErrors = validateOtherServiceInfoForm({
        bookingdate: "",
        traveldate: "",
        bookingstatus: "",
        confirmationNumber: "",
        title: "",
        description: "",
        documents: "",
        remarks: "",
      });

      if (apiErrors[name]) return apiErrors[name];

      // Local field-level validation (firstname, lastname, etc.)
      const rule = validationRules[name as keyof typeof validationRules];
      if (!rule) return "";

      if (
        rule.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        return rule.message;
      }

      if (
        rule.minLength &&
        typeof value === "string" &&
        value.trim().length < rule.minLength
      ) {
        return rule.message;
      }

      if (
        rule.pattern &&
        typeof value === "string" &&
        !rule.pattern.test(value)
      ) {
        return rule.message;
      }

      return "";
    },
    [validationRules],
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof LimitlessServiceInfoFormData],
      );
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField, validationRules]);

  // Normal handleChange that only updates local state
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      name === "confirmationNumber"
        ? allowUppercaseAlphanumeric6(value)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user types
    if (errors[name as keyof LimitlessServiceInfoFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Mark field touched
  };

  // Enhanced blur handler with API validation
  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (showValidation) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateField, showValidation],
  );

  return (
    <div
      className={`space-y-4 p-4 -mt-1 ${
        isReadOnly
          ? "[&_input]:!bg-gray-200 [&_textarea]:!bg-gray-200 [&_select]:!bg-gray-200"
          : ""
      }`}
      ref={formRef as any}
    >
      <div className="px-2 py-1">
        {/* Booking and Travel Date */}
        <div className="flex flex-wrap items-end justify-between mb-3 px-5 -mx-5">
          {/* Left section: Booking + Travel Date */}
          <div className="flex items-end flex-wrap gap-2">
            {/* Booking Date */}
            <SingleCalendar
              label="Booking Date"
              value={formData.bookingdate}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  bookingdate: date,
                  traveldatestart:
                    prev.bookingdate !== date ? "" : prev.traveldatestart,
                  traveldateend:
                    prev.bookingdate !== date ? "" : prev.traveldateend,
                }))
              }
              placeholder="DD-MM-YYYY"
              showCalendarIcon={false}
            />

            {/* Travel Date Start */}
            <SingleCalendar
              label="Travel Date Start"
              value={formData.traveldatestart}
              onChange={(date) =>
                setFormData((prev) => ({ ...prev, traveldatestart: date }))
              }
              placeholder="DD-MM-YYYY"
              minDate={formData.bookingdate}
              showCalendarIcon={false}
              readOnly={!formData.bookingdate}
            />

            {/* Travel Date End */}
            <div className="flex items-center gap-2">
              <SingleCalendar
                label="Travel Date End"
                value={formData.traveldateend}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, traveldateend: date }))
                }
                placeholder="DD-MM-YYYY"
                minDate={formData.traveldatestart || formData.bookingdate}
                showCalendarIcon={false}
                readOnly={!formData.traveldatestart}
              />

              {nightsDaysDisplay && (
                <div
                  title="Nights / Days"
                  className="ml-2 mt-4 inline-flex items-center px-3 py-1.5 rounded-md bg-white text-sm font-semibold text-gray-800 border border-gray-200 shadow-sm"
                >
                  {nightsDaysDisplay}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selling Price Section (uses shared MultiCurrencyInput) */}
        <div className="w-[48vw] border border-gray-200 rounded-[12px] p-3 mt-4">
          <h2 className="text-[0.85rem] font-medium text-gray-800 mb-2">
            Selling Price
          </h2>
          <hr className="mt-1 mb-3 border-t border-gray-200" />

          <MultiCurrencyInput
            currency={(formData.sellingCurrency as "INR" | "USD") || "INR"}
            onCurrencyChange={(c) =>
              setFormData((prev) => ({ ...prev, sellingCurrency: c }))
            }
            amount={String(formData.sellingprice ?? "")}
            onAmountChange={(v) =>
              setFormData((prev) => ({ ...prev, sellingprice: v }))
            }
            roe={String(formData.sellingRoe ?? "")}
            onRoeChange={(v) =>
              setFormData((prev) => ({ ...prev, sellingRoe: v }))
            }
            inr={String(formData.sellingInr ?? "")}
            notes={String(formData.sellingNotes ?? "")}
            onNotesChange={(v) =>
              setFormData((prev) => ({ ...prev, sellingNotes: v }))
            }
            showNotes={showSellingNotes}
            onToggleNotes={() => setShowSellingNotes((s) => !s)}
            businessCurrency={businessCurrency}
            requiresRoe={requiresRoe}
            inputClassName="px-3 py-1.5 border border-gray-300 rounded-md text-[13px]"
            useWhiteDropdown={true}
          />
        </div>

        {/* ================= Limitless INFO ================ */}
        <div className="w-[48vw] border border-gray-200 rounded-[12px] p-3 mt-4">
          <h1 className="text-[0.85rem] font-medium text-gray-800 mb-2">
            Limitless Info
          </h1>

          <hr className="mt-1 mb-3 border-t border-gray-200" />

          {/* Confirmation number + Title (stacked) */}
          <div className="flex flex-col gap-3 w-full mb-4">
            {/* Destinations multi-select (replaces confirmation number) */}
            <div className="flex flex-col w-full">
              <label className="text-[13px] font-medium text-gray-700 mb-1">
                Destinations
              </label>
              <div className="relative" ref={destDropdownRef}>
                <div
                  className="w-[30%] min-h-[44px] border border-gray-300 rounded-md px-3 py-2 flex items-center flex-wrap gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDestDropdownOpen((v) => {
                      const next = !v;
                      if (next) openDestDropdown();
                      else closeDestDropdown();
                      return next;
                    });
                  }}
                >
                  <span className="text-gray-400">
                    <FiSearch />
                  </span>

                  {selectedDestinations.length > 0 ? (
                    selectedDestinations.map((p) => (
                      <span
                        key={p.id}
                        className="flex items-center gap-1 bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full text-[12px]"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDestination(p);
                          }}
                          className="py-1"
                          aria-label={`Remove ${p.name}`}
                        >
                          <IoClose size={16} className="text-[#818181]" />
                        </button>
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#9CA3AF] text-[13px]">
                      Select destinations
                    </span>
                  )}

                  <span className="ml-auto text-gray-400 text-[12px]">▾</span>
                </div>

                {isDestDropdownOpen &&
                  destDropdownPos &&
                  createPortal(
                    <div
                      ref={destPanelRef}
                      style={{
                        top: destDropdownPos.top,
                        left: destDropdownPos.left,
                        width: destDropdownPos.width,
                      }}
                      className="absolute bg-white border border-gray-200 rounded-[10px] shadow-xl max-h-52 overflow-y-auto z-[9999]"
                    >
                      {demoPlaces.map((place) => {
                        const checked = selectedDestinations.some(
                          (p) => p.id === place.id,
                        );
                        return (
                          <button
                            key={place.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDestination(place);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 border-b border-gray-100 hover:bg-gray-50"
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
                            <span className="text-[14px] text-[#020202]">
                              {place.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>,
                    document.body,
                  )}
              </div>
            </div>

            {/* Itinerary Name */}
            <div className="flex flex-col w-full">
              <label className="text-[13px] font-medium text-gray-700 mb-1">
                Itinerary Name
              </label>
              <input
                type="text"
                name="itineraryname"
                value={formData.itineraryname}
                onChange={handleChange}
                placeholder="Enter itinerary name…"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[13px] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
              />
            </div>
          </div>

          {/* Description */}

          <StyledDescription
            value={formData.description}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, description: val }))
            }
          />
        </div>
      </div>

      {/* ID PROOFS */}
      <div className=" w-[98%] ml-2 border border-gray-200 rounded-[12px] p-3">
        <h2 className="text-[13px] font-medium mb-2">Documents</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
          multiple
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 flex gap-1 bg-white text-[#126ACB] border 
                                                       border-[#126ACB] rounded-md text-[13px] hover:bg-gray-200"
        >
          <MdOutlineFileUpload size={16} /> Attach Files
        </button>

        {/* PREVIEW FILES */}
        <div className="mt-2 flex flex-col gap-2">
          {Array.isArray(existingDocuments) &&
            existingDocuments.length > 0 &&
            existingDocuments.map((doc, i) => (
              <div
                key={`${doc.key || doc.fileName || doc.originalName}-${i}`}
                className="flex items-center justify-between w-full bg-white rounded-md px-3 py-2 hover:bg-gray-50 transition"
              >
                <button
                  type="button"
                  onClick={() => doc.url && window.open(doc.url, "_blank")}
                  className="text-blue-700 border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                  title="Click to view document"
                >
                  <FaRegFolder className="text-blue-500 w-3 h-3" />
                  {doc.originalName || doc.fileName}
                </button>
              </div>
            ))}

          {attachedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between w-full 
                                               bg-white rounded-md 
                                               px-3 py-2 hover:bg-gray-50 transition"
            >
              {/* File Name */}
              <span className="text-blue-700 border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2">
                <FaRegFolder className="text-blue-500 w-3 h-3" />
                {file.name}
              </span>

              {/* Delete Icon */}
              <button
                type="button"
                onClick={() => handleDeleteFile(i)}
                className="text-red-500 hover:text-red-700"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="text-red-600 text-[0.65rem]">
          Note: A maximum of 3 documents can be uploaded.
        </div>
      </div>

      {/* Remarks Section */}
      <div className="border border-gray-200 w-[48vw] ml-2.5 rounded-[12px] p-3 mt-4">
        <label className="block text-[13px] font-medium text-gray-700">
          Remarks
        </label>
        <hr className="mt-1 mb-2 border-t border-gray-200" />
        <textarea
          name="remarks"
          rows={4}
          value={formData.remarks}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter Your Remarks Here"
          disabled={isSubmitting}
          className={`w-full border border-gray-200 rounded-md px-2 py-1.5 text-[13px] mt-1 transition-colors hover:border-green-400 focus:ring focus:ring-green-300 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
      </div>
    </div>
  );
};

export default React.memo(LimitlessServiceInfoForm);
