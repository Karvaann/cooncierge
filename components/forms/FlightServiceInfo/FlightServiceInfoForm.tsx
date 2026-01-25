"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { validateFlightInfoForm } from "@/services/bookingApi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineFileUpload } from "react-icons/md";
import { useRef } from "react";
import { FiTrash2 } from "react-icons/fi";
import OneWayLayout from "./OneWayLayout";
import RoundTripLayout from "./RoundTripLayout";
import MultiCityLayout from "./MultiCityLayout";
import DropDown from "@/components/DropDown";
import DateRangeInput from "@/components/DateRangeInput";
import { FaRegFolder } from "react-icons/fa";
import SingleCalendar from "@/components/SingleCalendar";
import StyledDescription from "@/components/StyledDescription";
import { TbNotes } from "react-icons/tb";
import { allowUppercaseAlphanumeric6 } from "@/utils/inputValidators";
import { isAfterDate } from "@/utils/helper";
import CancellationModal, {
  CancellationModalFormState,
} from "@/components/Modals/CancellationModal";
import AmountSection from "@/components/AmountSection";

// Type definitions
interface FlightInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  costprice: number | string;
  sellingprice: number | string;
  PNR: number | string;
  pnrEnabled: boolean;
  segments: FlightSegment[]; // Array of flight segments
  returnSegments: ReturnFlightSegment[];
  samePNRForAllSegments: boolean;
  flightType: "One Way" | "Round Trip" | "Multi-City";
  remarks: string;
  showAdvancedPricing?: boolean;
  vendorBasePrice?: number | string;
  vendorBaseCurrency?: "USD" | "INR";
  vendorBaseRoe?: string;
  vendorBaseInr?: string;
  vendorBaseNotes?: string;
  vendorIncentiveCurrency?: "USD" | "INR";
  vendorIncentiveRoe?: string;
  vendorIncentiveInr?: string;
  vendorIncentiveNotes?: string;
  vendorIncentiveReceived?: number | string;
  commissionCurrency?: "USD" | "INR";
  commissionRoe?: string;
  commissionInr?: string;
  commissionNotes?: string;
  commissionPaid?: number | string;
  importantinfo?: string;

  // Currency/ROE/INR mapping for amount fields
  costCurrency?: "USD" | "INR";
  costRoe?: string;
  costInr?: string;
  costNotes?: string;

  sellingCurrency?: "USD" | "INR";
  sellingRoe?: string;
  sellingInr?: string;
  sellingNotes?: string;

  // Persist cancellation modal form data with the booking
  cancellationForm?: CancellationModalFormState;
}

interface FlightSegment {
  id?: string | null;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
  pnr?: string;
}

interface ReturnFlightSegment {
  id?: string | null;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
  pnr?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ExternalFormData {
  formFields?: {
    bookingdate?: string;
    traveldate?: string;
    bookingstatus?: string;
    costprice?: string;
    sellingprice?: string;
    PNR?: string;
    remarks?: string;
    importantinfo?: string;
    // Add other fields as needed
  };
}

interface FlightInfoFormProps {
  onSubmit?: (data: FlightInfoFormData) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onFormDataUpdate: (data: any) => void;
  onAddDocuments?: (files: File[]) => void;
  externalFormData?: ExternalFormData | Record<string, unknown>;
  bookingCode?: string;
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

const FlightServiceInfoForm: React.FC<FlightInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  isReadOnly = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
  onAddDocuments,
  externalFormData,
  bookingCode,
  existingDocuments = [],
}) => {
  // Normalize incoming data so we can hydrate the form from either
  // `externalFormData`, `externalFormData.formFields`, `externalFormData.flightinfoform`,
  // or the raw `formData` passed from BookingFormSideSheet when editing.
  const normalizedExternalData = useMemo(() => {
    const source = externalFormData ?? {};
    const fields =
      (source as ExternalFormData)?.formFields ??
      (source as any)?.flightinfoform ??
      source;
    return fields as Partial<FlightInfoFormData>;
  }, [externalFormData]);

  // Internal form state
  const [formData, setFormData] = useState<FlightInfoFormData>(() => ({
    bookingdate: normalizedExternalData?.bookingdate || "",
    traveldate: normalizedExternalData?.traveldate || "",
    bookingstatus: normalizedExternalData?.bookingstatus || "",
    costprice: normalizedExternalData?.costprice || "",
    sellingprice: normalizedExternalData?.sellingprice || "",
    costCurrency:
      (normalizedExternalData?.costCurrency as "USD" | "INR") || "INR",
    costRoe: String(normalizedExternalData?.costRoe ?? ""),
    costInr: String(normalizedExternalData?.costInr ?? ""),
    costNotes: normalizedExternalData?.costNotes || "",
    sellingCurrency:
      (normalizedExternalData?.sellingCurrency as "USD" | "INR") || "INR",
    sellingRoe: String(normalizedExternalData?.sellingRoe ?? ""),
    sellingInr: String(normalizedExternalData?.sellingInr ?? ""),
    sellingNotes: normalizedExternalData?.sellingNotes || "",
    PNR: normalizedExternalData?.PNR || "",
    segments:
      normalizedExternalData?.segments && normalizedExternalData.segments.length
        ? normalizedExternalData.segments.map((seg, idx) => ({
            id: seg.id ?? `seg-${idx}`,
            ...seg,
          }))
        : [
            {
              id: "1",
              flightnumber: "",
              traveldate: "",
              cabinclass: "",
            },
          ],
    returnSegments:
      normalizedExternalData?.returnSegments &&
      normalizedExternalData.returnSegments.length
        ? normalizedExternalData.returnSegments.map((seg, idx) => ({
            id: seg.id ?? `return-${idx + 1}`,
            ...seg,
          }))
        : [
            {
              id: "return-1",
              flightnumber: "",
              traveldate: "",
              cabinclass: "",
            },
          ],
    pnrEnabled:
      normalizedExternalData?.pnrEnabled !== undefined
        ? Boolean(normalizedExternalData.pnrEnabled)
        : true,
    samePNRForAllSegments:
      normalizedExternalData?.samePNRForAllSegments ?? false,
    flightType:
      (normalizedExternalData?.flightType as FlightInfoFormData["flightType"]) ||
      "One Way",
    remarks: normalizedExternalData?.remarks || "",
    showAdvancedPricing: Boolean(normalizedExternalData?.showAdvancedPricing),
    vendorBasePrice: String(normalizedExternalData?.vendorBasePrice ?? ""),
    vendorIncentiveReceived: String(
      normalizedExternalData?.vendorIncentiveReceived ?? "",
    ),
    commissionPaid: String(normalizedExternalData?.commissionPaid ?? ""),
    importantinfo: normalizedExternalData?.importantinfo || "",

    cancellationForm: (normalizedExternalData as any)?.cancellationForm,
  }));

  const [isCancellationModalOpen, setIsCancellationModalOpen] =
    useState<boolean>(false);
  const [pendingPrevBookingStatus, setPendingPrevBookingStatus] =
    useState<string>("");

  const [errors, setErrors] = useState<ValidationErrors>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Advanced Pricing State
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(
    Boolean(normalizedExternalData?.showAdvancedPricing),
  );
  // Vendor payment summary fields
  const [vendorBasePrice, setVendorBasePrice] = useState<string>(
    String(normalizedExternalData?.vendorBasePrice ?? ""),
  );
  const [vendorIncentiveReceived, setVendorIncentiveReceived] =
    useState<string>(
      String(normalizedExternalData?.vendorIncentiveReceived ?? ""),
    );
  const [commissionPaid, setCommissionPaid] = useState<string>(
    String(normalizedExternalData?.commissionPaid ?? ""),
  );

  // Vendor advanced-pricing detailed state (currency, roe, computed INR, notes)
  const [vendorBaseCurrency, setVendorBaseCurrency] = useState<"INR" | "USD">(
    (normalizedExternalData?.vendorBaseCurrency as "INR" | "USD") || "INR",
  );
  const [vendorBaseRoe, setVendorBaseRoe] = useState<string>(
    String(normalizedExternalData?.vendorBaseRoe ?? ""),
  );
  const [vendorBaseInr, setVendorBaseInr] = useState<string>(
    String(normalizedExternalData?.vendorBaseInr ?? ""),
  );
  const [vendorBaseNotes, setVendorBaseNotes] = useState<string>(
    String(normalizedExternalData?.vendorBaseNotes ?? ""),
  );

  const [vendorIncentiveCurrency, setVendorIncentiveCurrency] = useState<
    "INR" | "USD"
  >(
    (normalizedExternalData?.vendorIncentiveCurrency as "INR" | "USD") || "INR",
  );
  const [vendorIncentiveRoe, setVendorIncentiveRoe] = useState<string>(
    String(normalizedExternalData?.vendorIncentiveRoe ?? ""),
  );
  const [vendorIncentiveInr, setVendorIncentiveInr] = useState<string>(
    String(normalizedExternalData?.vendorIncentiveInr ?? ""),
  );
  const [vendorIncentiveNotes, setVendorIncentiveNotes] = useState<string>(
    String(normalizedExternalData?.vendorIncentiveNotes ?? ""),
  );
  const [showVendorIncentiveNotesFlag, setShowVendorIncentiveNotesFlag] =
    useState<boolean>(false);

  const [commissionCurrency, setCommissionCurrency] = useState<"INR" | "USD">(
    (normalizedExternalData?.commissionCurrency as "INR" | "USD") || "INR",
  );
  const [commissionRoeState, setCommissionRoeState] = useState<string>(
    String(normalizedExternalData?.commissionRoe ?? ""),
  );
  const [commissionInr, setCommissionInr] = useState<string>(
    String(normalizedExternalData?.commissionInr ?? ""),
  );
  const [commissionNotes, setCommissionNotes] = useState<string>(
    String(normalizedExternalData?.commissionNotes ?? ""),
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

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

  // Sync with external/initial form data when it changes (edit mode)
  useEffect(() => {
    if (!externalFormData || Object.keys(externalFormData).length === 0) return;

    setFormData((prev) => ({
      ...prev,
      ...normalizedExternalData,
      segments:
        normalizedExternalData.segments &&
        normalizedExternalData.segments.length
          ? normalizedExternalData.segments.map((seg, idx) => ({
              id: seg.id ?? `seg-${idx}`,
              ...seg,
            }))
          : prev.segments,
      returnSegments:
        normalizedExternalData.returnSegments &&
        normalizedExternalData.returnSegments.length
          ? normalizedExternalData.returnSegments.map((seg, idx) => ({
              id: seg.id ?? `return-${idx + 1}`,
              ...seg,
            }))
          : prev.returnSegments,
      pnrEnabled: normalizedExternalData.pnrEnabled ?? prev.pnrEnabled ?? true,
      samePNRForAllSegments:
        normalizedExternalData.samePNRForAllSegments ??
        prev.samePNRForAllSegments ??
        false,
      flightType:
        (normalizedExternalData.flightType as
          | "One Way"
          | "Round Trip"
          | "Multi-City") ?? prev.flightType,
    }));
  }, [externalFormData, normalizedExternalData]);

  useEffect(() => {
    onFormDataUpdate({ flightinfoform: formData });
  }, [formData]);

  // Hard-coded exchange rate for demonstration
  // const exchangeRate = 88.05;

  // const handleCurrencyChange = (
  //   type: "cost" | "selling",
  //   currency: "INR" | "USD"
  // ) => {
  //   if (type === "cost") {
  //     setCostPriceCurrency(currency);
  //     setShowCostDropdown(false);
  //     setRoeVisibleFor(currency === "USD" ? "cost" : null);
  //   } else {
  //     setSellingPriceCurrency(currency);
  //     setShowSellingDropdown(false);
  //     setRoeVisibleFor(currency === "USD" ? "selling" : null);
  //   }
  // };

  const options = [
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
    // { value: "", label: "Booking Status" },
  ];

  const handleBookingStatusChange = (value: string) => {
    const next = String(value || "");
    const nextLower = next.toLowerCase();
    const shouldOpenCancellation =
      nextLower === "cancelled" || nextLower === "canceled";

    if (shouldOpenCancellation) {
      setPendingPrevBookingStatus(String(formData.bookingstatus || ""));
      setIsCancellationModalOpen(true);
    }

    setFormData((prev) => ({ ...prev, bookingstatus: next }));
  };

  type FieldRule = {
    required: boolean;
    message: string;
    minLength?: number;
    pattern?: RegExp;
  };

  // Validation rules
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
      // Use API validation for comprehensive checks
      const apiErrors = validateFlightInfoForm({
        bookingdate: "",
        traveldate: "",
        bookingstatus: "",
        costprice: "",
        sellingprice: "",
        PNR: "",
        segments: [
          {
            id: "1",
            flightnumber: "",
            traveldate: "",
            cabinclass: "",
          },
        ], // Start with one segment
        returnSegments: [
          {
            id: "return-1",
            flightnumber: "",
            traveldate: "",
            cabinclass: "",
          },
        ],
        pnrEnabled: false,
        samePNRForAllSegments: false,
        flightType: "One Way",

        remarks: "",
      });
      if (apiErrors[name]) return apiErrors[name];

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
        formData[fieldName as keyof FlightInfoFormData],
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
    const processedValue =
      type === "number" && value !== "" ? Number(value) : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Clear error when user types
    if (errors[name as keyof FlightInfoFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Mark field touched
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Enhanced blur handler with API validation
  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (showValidation) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }

      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [validateField, showValidation],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (validateForm()) {
        onSubmit?.(formData);
      } else {
        // Mark all fields as touched to show validation errors
        const allTouched = Object.keys(validationRules).reduce(
          (acc, key) => {
            acc[key] = true;
            return acc;
          },
          {} as Record<string, boolean>,
        );
        setTouched(allTouched);
      }
    },
    [formData, validateForm, onSubmit, validationRules],
  );

  // Enhanced input field component with validation indicators
  const InputField: React.FC<{
    name: keyof FlightInfoFormData;
    id?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    min?: number;
  }> = ({
    name,
    type = "text",
    placeholder,
    required,
    className = "",
    min,
  }) => {
    const isValidatingField = name === "bookingdate" && isValidating; // Example for one field, can be extended
    const hasError = errors[name] && touched[name];
    const hasValue = formData[name] && String(formData[name]).trim();
    const isValid = hasValue && !hasError && !isValidatingField;

    return (
      <div className="relative">
        <input
          type={type}
          name={name}
          value={type === "file" ? undefined : String(formData[name] ?? "")}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          min={min}
          disabled={isSubmitting || isValidatingField}
          className={`
            w-full border rounded-md px-3 py-2 pr-10 text-sm transition-colors
            ${
              hasError
                ? "border-red-300 focus:ring-red-200"
                : isValid && touched[name]
                  ? "border-green-300 focus:ring-green-200"
                  : "border-gray-200 focus:ring-green-200"
            }
            ${
              isSubmitting || isValidatingField
                ? "opacity-50 cursor-not-allowed"
                : ""
            }
            ${className}
          `}
        />

        {/* Validation indicator */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isValidatingField && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          )}
          {!isValidatingField && isValid && touched[name] && (
            <svg
              className="h-4 w-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {!isValidatingField && hasError && (
            <svg
              className="h-4 w-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        {hasError && (
          <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
        )}
      </div>
    );
  };

  const today = new Date().toISOString().split("T")[0];

  const cancellationModalInitialValues: Partial<CancellationModalFormState> = {
    // Seed from current sidesheet state so opening the modal mirrors filled data
    vendorBasePrice,
    vendorBaseCurrency,
    vendorBaseRoe,
    vendorBaseInr,
    vendorBaseNotes,

    vendorIncentiveReceived,
    vendorIncentiveCurrency,
    vendorIncentiveRoe,
    vendorIncentiveInr,
    vendorIncentiveNotes,

    commissionPaid,
    commissionCurrency,
    commissionRoe: commissionRoeState,
    commissionInr,
    commissionNotes,

    costprice: String(formData.costprice ?? ""),
    costCurrency: (formData.costCurrency as "INR" | "USD") || "INR",
    costRoe: String(formData.costRoe ?? ""),
    costInr: String(formData.costInr ?? ""),
    costNotes: String(formData.costNotes ?? ""),

    sellingprice: String(formData.sellingprice ?? ""),
    sellingCurrency: (formData.sellingCurrency as "INR" | "USD") || "INR",
    sellingRoe: String(formData.sellingRoe ?? ""),
    sellingInr: String(formData.sellingInr ?? ""),
    sellingNotes: String(formData.sellingNotes ?? ""),

    // Preserve any already-entered cancellation/refund details
    ...(formData.bookingstatus === "cancelled"
      ? (formData.cancellationForm ?? {})
      : {}),
  };

  return (
    <>
      <CancellationModal
        isOpen={isCancellationModalOpen}
        onClose={() => {
          setIsCancellationModalOpen(false);
          setFormData((prev) => ({
            ...prev,
            bookingstatus: "confirmed",
          }));
          setPendingPrevBookingStatus("");
        }}
        onSave={(data) => {
          // Keep sidesheet state in sync with modal edits
          setVendorBasePrice(String(data.vendorBasePrice ?? ""));
          setVendorBaseCurrency((data.vendorBaseCurrency as any) || "INR");
          setVendorBaseRoe(String(data.vendorBaseRoe ?? ""));
          setVendorBaseInr(String(data.vendorBaseInr ?? ""));
          setVendorBaseNotes(String(data.vendorBaseNotes ?? ""));

          setVendorIncentiveReceived(
            String(data.vendorIncentiveReceived ?? ""),
          );
          setVendorIncentiveCurrency(
            (data.vendorIncentiveCurrency as any) || "INR",
          );
          setVendorIncentiveRoe(String(data.vendorIncentiveRoe ?? ""));
          setVendorIncentiveInr(String(data.vendorIncentiveInr ?? ""));
          setVendorIncentiveNotes(String(data.vendorIncentiveNotes ?? ""));

          setCommissionPaid(String(data.commissionPaid ?? ""));
          setCommissionCurrency((data.commissionCurrency as any) || "INR");
          setCommissionRoeState(String(data.commissionRoe ?? ""));
          setCommissionInr(String(data.commissionInr ?? ""));
          setCommissionNotes(String(data.commissionNotes ?? ""));

          setFormData((prev) => ({
            ...prev,
            bookingstatus: "cancelled",
            cancellationForm: data,
          }));

          setIsCancellationModalOpen(false);
          setPendingPrevBookingStatus("");
        }}
        recordLabel={bookingCode || ""}
        statusLabel="Cancelled"
        linkedShowAdvancedPricing={showAdvancedPricing}
        onLinkedShowAdvancedPricingChange={setShowAdvancedPricing}
        initialValues={cancellationModalInitialValues}
      />

      <form
        className={`space-y-4 p-4 -mt-1 ${
          isReadOnly
            ? "[&_input]:!bg-gray-200 [&_textarea]:!bg-gray-200 [&_select]:!bg-gray-200"
            : ""
        }`}
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
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
                    traveldate:
                      prev.traveldate && isAfterDate(date, prev.traveldate)
                        ? ""
                        : prev.traveldate,
                  }))
                }
                placeholder="DD-MM-YYYY"
                customWidth="w-[10rem]"
              />

              {/* Travel Date */}
              <SingleCalendar
                label="Travel Date"
                value={formData.traveldate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, traveldate: date }))
                }
                placeholder="DD-MM-YYYY"
                minDate={formData.bookingdate}
                readOnly={!formData.bookingdate}
                customWidth="w-[10rem]"
              />

              {/* ✅ Cancellation Date (READ ONLY) */}
              {formData.bookingstatus?.toLowerCase() === "cancelled" &&
                formData.cancellationForm?.cancellationDate && (
                  <SingleCalendar
                    label="Cancellation Date"
                    value={formData.cancellationForm.cancellationDate}
                    onChange={() => {}}
                    readOnly
                    customWidth="w-[10rem]"
                  />
                )}
            </div>

            {/* Right section: Booking Status */}
            <div>
              <DropDown
                options={options}
                placeholder="Booking Status"
                value={formData.bookingstatus}
                onChange={handleBookingStatusChange}
              />
            </div>
          </div>

          {/* Amount Section */}

          <AmountSection
            value={formData as any}
            onChange={(updated) =>
              setFormData((prev) => ({ ...prev, ...updated }))
            }
            bookingStatus={formData.bookingstatus}
            cancellationForm={formData.cancellationForm}
            showAdvancedPricing={showAdvancedPricing}
            onToggleAdvancedPricing={setShowAdvancedPricing}
            isReadOnly={isReadOnly}
            isSubmitting={isSubmitting}
          />

          {/* Flight Info */}
          <div className="mb-4 w-[48vw] border border-gray-200 rounded-md p-3 mt-4 ml-0.5 -mx-4">
            <h2 className="text-[13px] font-medium text-gray-700 mb-2">
              Flight Info
            </h2>

            <hr className="-mt-1 mb-2 border-t border-gray-200" />

            {/* PNR and Toggle */}
            <div className="flex items-end gap-8 mb-3 ml-2">
              <div>
                <label className="block text-[0.7rem] font-medium text-gray-700 mb-1">
                  PNR
                </label>
                <input
                  type="text"
                  value={formData.PNR}
                  onChange={(e) => {
                    const sanitizedValue = allowUppercaseAlphanumeric6(
                      e.target.value,
                    )
                      .replace(/[^a-zA-Z0-9]/g, "") // allow only alphanumeric
                      .toUpperCase(); // convert to uppercase

                    setFormData((prev) => ({ ...prev, PNR: sanitizedValue }));
                  }}
                  placeholder="Enter PNR"
                  className="w-[12rem] px-2 py-1.5 border border-gray-300 rounded-md text-[13px]
                    focus:outline-none focus:ring-1 focus:ring-green-400 hover:border-green-400 focus:border-transparent"
                />
              </div>

              {formData.flightType !== "One Way" && (
                <div className="flex items-center gap-1 pb-1">
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        pnrEnabled: !prev.pnrEnabled,
                      }))
                    }
                    className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
                      formData.pnrEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.pnrEnabled
                          ? "translate-x-3.5"
                          : "translate-x-1.5"
                      }`}
                    />
                  </button>

                  <span className="text-[0.7rem] text-gray-700">
                    Same PNR for all Segments
                  </span>
                </div>
              )}
            </div>

            {/* Flight Type Tabs */}
            <div className="inline-flex mb-3 ml-2 rounded-lg border border-gray-200">
              {(["One Way", "Round Trip", "Multi-City"] as const).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, flightType: type }))
                    }
                    className={`px-3 py-1.5 text-[0.7rem] font-medium transition-colors rounded-lg
        ${
          formData.flightType === type
            ? "bg-[#E8F9F7] text-green-700 font-semibold border border-green-700"
            : "bg-transparent text-gray-700"
        }`}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>

            {/* Layouts */}
            {formData.flightType === "One Way" && (
              <OneWayLayout formData={formData} setFormData={setFormData} />
            )}

            {formData.flightType === "Round Trip" && (
              <RoundTripLayout formData={formData} setFormData={setFormData} />
            )}

            {formData.flightType === "Multi-City" && (
              <MultiCityLayout formData={formData} setFormData={setFormData} />
            )}
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
            Note: Maximum of 3 files can be uploaded
          </div>
        </div>

        <div className="-mt-1 space-y-3 w-[48vw] ml-2.5">
          <StyledDescription
            label="Important Info"
            value={String(formData.importantinfo ?? "")}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, importantinfo: val }))
            }
            readOnly={isReadOnly}
            // disabled={isSubmitting}
          />
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
            className={`w-full border border-gray-200 rounded-md px-2 py-1.5 text-[13px] mt-1 transition-colors hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>

        {/* Submit Button
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-1.5 bg-[#114958] text-[0.8rem] text-white rounded-md hover:bg-[#0d3a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div> */}
      </form>
    </>
  );
};

export default React.memo(FlightServiceInfoForm);
