"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { validateOtherServiceInfoForm } from "@/services/bookingApi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { useRef } from "react";
import StyledDescription from "../StyledDescription";
import DropDown from "@/components/DropDown";
import SingleCalendar from "@/components/SingleCalendar";
import { FaRegFolder } from "react-icons/fa";
import { allowUppercaseAlphanumeric6 } from "@/utils/inputValidators";
import CancellationModal, {
  CancellationModalFormState,
} from "@/components/Modals/CancellationModal";
import AmountSection from "@/components/AmountSection";
import { getDefaultShowAdvancedPricing } from "@/utils/advancedPricing";

// Type definitions
interface OtherServiceInfoFormData {
  bookingdate: string;
  traveldate: string; // This can be the main/first travel date
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  costprice: number | string;
  sellingprice: number | string;
  confirmationNumber: number | string;
  title: string;
  description: string;
  documents?: string | File;
  remarks: string;
  showAdvancedPricing?: boolean;
  vendorBasePrice?: number | string;
  vendorIncentiveReceived?: number | string;
  commissionPaid?: number | string;

  // Currency/ROE/INR fields for multi-currency support
  vendorBaseCurrency?: "USD" | "INR";
  vendorBaseRoe?: string;
  vendorBaseInr?: string;
  vendorBaseNotes?: string;

  vendorIncentiveCurrency?: "USD" | "INR";
  vendorIncentiveRoe?: string;
  vendorIncentiveInr?: string;
  vendorIncentiveNotes?: string;

  commissionCurrency?: "USD" | "INR";
  commissionRoe?: string;
  commissionInr?: string;
  commissionNotes?: string;

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

interface ValidationErrors {
  [key: string]: string;
}

interface ExternalFormData {
  formFields?: Partial<OtherServiceInfoFormData>;
  insuranceinfoform?: Partial<OtherServiceInfoFormData>;
}

interface OtherInfoFormProps {
  onSubmit?: (data: OtherServiceInfoFormData) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLDivElement | null>;
  onFormDataUpdate: (data: any) => void;
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

const InsuranceServiceInfoForm: React.FC<OtherInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  isReadOnly = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
  onAddDocuments,
  externalFormData,
  existingDocuments = [],
}) => {
  const normalizedExternalData = useMemo(() => {
    const source = externalFormData ?? {};
    const fields =
      (source as ExternalFormData)?.formFields ??
      (source as ExternalFormData)?.insuranceinfoform ??
      source;
    return fields as Partial<OtherServiceInfoFormData>;
  }, [externalFormData]);

  const defaultShowAdvancedPricing = useMemo(
    () => getDefaultShowAdvancedPricing(normalizedExternalData, isReadOnly),
    [isReadOnly, normalizedExternalData],
  );

  // Internal form state
  const [formData, setFormData] = useState<OtherServiceInfoFormData>({
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
    confirmationNumber: normalizedExternalData?.confirmationNumber || "",
    title: normalizedExternalData?.title || "",
    description: normalizedExternalData?.description || "",
    documents: "",
    remarks: normalizedExternalData?.remarks || "",
    showAdvancedPricing: defaultShowAdvancedPricing,
    vendorBasePrice: String(normalizedExternalData?.vendorBasePrice ?? ""),
    vendorBaseCurrency:
      (normalizedExternalData?.vendorBaseCurrency as "USD" | "INR") || "INR",
    vendorBaseRoe: String(normalizedExternalData?.vendorBaseRoe ?? ""),
    vendorBaseInr: String(normalizedExternalData?.vendorBaseInr ?? ""),
    vendorBaseNotes: normalizedExternalData?.vendorBaseNotes || "",
    vendorIncentiveReceived: String(
      normalizedExternalData?.vendorIncentiveReceived ?? "",
    ),
    vendorIncentiveCurrency:
      (normalizedExternalData?.vendorIncentiveCurrency as "USD" | "INR") ||
      "INR",
    vendorIncentiveRoe: String(
      normalizedExternalData?.vendorIncentiveRoe ?? "",
    ),
    vendorIncentiveInr: String(
      normalizedExternalData?.vendorIncentiveInr ?? "",
    ),
    vendorIncentiveNotes: normalizedExternalData?.vendorIncentiveNotes || "",
    commissionPaid: String(normalizedExternalData?.commissionPaid ?? ""),
    commissionCurrency:
      (normalizedExternalData?.commissionCurrency as "USD" | "INR") || "INR",
    commissionRoe: String(normalizedExternalData?.commissionRoe ?? ""),
    commissionInr: String(normalizedExternalData?.commissionInr ?? ""),
    commissionNotes: normalizedExternalData?.commissionNotes || "",

    cancellationForm: (normalizedExternalData as any)?.cancellationForm,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Advanced Pricing State
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(
    defaultShowAdvancedPricing,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [isCancellationModalOpen, setIsCancellationModalOpen] =
    useState<boolean>(false);
  const [pendingPrevBookingStatus, setPendingPrevBookingStatus] =
    useState<string>("");

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

  // Sync with external form data when it changes
  useEffect(() => {
    if (!externalFormData || Object.keys(externalFormData).length === 0) return;

    const nextShowAdvancedPricing = getDefaultShowAdvancedPricing(
      normalizedExternalData,
      isReadOnly,
    );

    setFormData((prev) => ({
      ...prev,
      ...normalizedExternalData,
      showAdvancedPricing: nextShowAdvancedPricing,
    }));
    setShowAdvancedPricing(nextShowAdvancedPricing);
  }, [externalFormData, isReadOnly, normalizedExternalData]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, showAdvancedPricing }));
  }, [showAdvancedPricing]);

  useEffect(() => {
    onFormDataUpdate({ insuranceinfoform: formData });
  }, [formData]);

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
        formData[fieldName as keyof OtherServiceInfoFormData],
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
    if (errors[name as keyof OtherServiceInfoFormData]) {
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
    name: keyof OtherServiceInfoFormData;
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
    const isValidatingField = name === "bookingdate" && isValidating;
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
                  : "border-gray-200 hover:border-green-400 focus:ring-green-300"
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

  const cancellationModalInitialValues: Partial<CancellationModalFormState> = {
    vendorBasePrice: String(formData.vendorBasePrice ?? ""),
    vendorBaseCurrency: (formData.vendorBaseCurrency as "INR" | "USD") || "INR",
    vendorBaseRoe: String(formData.vendorBaseRoe ?? ""),
    vendorBaseInr: String(formData.vendorBaseInr ?? ""),
    vendorBaseNotes: String(formData.vendorBaseNotes ?? ""),

    vendorIncentiveReceived: String(formData.vendorIncentiveReceived ?? ""),
    vendorIncentiveCurrency:
      (formData.vendorIncentiveCurrency as "INR" | "USD") || "INR",
    vendorIncentiveRoe: String(formData.vendorIncentiveRoe ?? ""),
    vendorIncentiveInr: String(formData.vendorIncentiveInr ?? ""),
    vendorIncentiveNotes: String(formData.vendorIncentiveNotes ?? ""),

    commissionPaid: String(formData.commissionPaid ?? ""),
    commissionCurrency: (formData.commissionCurrency as "INR" | "USD") || "INR",
    commissionRoe: String(formData.commissionRoe ?? ""),
    commissionInr: String(formData.commissionInr ?? ""),
    commissionNotes: String(formData.commissionNotes ?? ""),

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

    ...(formData.bookingstatus === "cancelled"
      ? (formData.cancellationForm ?? {})
      : {}),
  };

  const today = new Date().toISOString().split("T")[0];
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
          setFormData((prev) => ({
            ...prev,
            bookingstatus: "cancelled",
            costprice: String(data.costprice ?? prev.costprice ?? ""),
            costCurrency:
              (data.costCurrency as "INR" | "USD") ||
              (prev.costCurrency as "INR" | "USD") ||
              "INR",
            costRoe: String(data.costRoe ?? prev.costRoe ?? ""),
            costInr: String(data.costInr ?? prev.costInr ?? ""),
            costNotes: String(data.costNotes ?? prev.costNotes ?? ""),

            sellingprice: String(data.sellingprice ?? prev.sellingprice ?? ""),
            sellingCurrency:
              (data.sellingCurrency as "INR" | "USD") ||
              (prev.sellingCurrency as "INR" | "USD") ||
              "INR",
            sellingRoe: String(data.sellingRoe ?? prev.sellingRoe ?? ""),
            sellingInr: String(data.sellingInr ?? prev.sellingInr ?? ""),
            sellingNotes: String(data.sellingNotes ?? prev.sellingNotes ?? ""),

            vendorBasePrice: String(
              data.vendorBasePrice ?? prev.vendorBasePrice ?? "",
            ),
            vendorBaseCurrency:
              (data.vendorBaseCurrency as "INR" | "USD") ||
              (prev.vendorBaseCurrency as "INR" | "USD") ||
              "INR",
            vendorBaseRoe: String(
              data.vendorBaseRoe ?? prev.vendorBaseRoe ?? "",
            ),
            vendorBaseInr: String(
              data.vendorBaseInr ?? prev.vendorBaseInr ?? "",
            ),
            vendorBaseNotes: String(
              data.vendorBaseNotes ?? prev.vendorBaseNotes ?? "",
            ),

            vendorIncentiveReceived: String(
              data.vendorIncentiveReceived ??
                prev.vendorIncentiveReceived ??
                "",
            ),
            vendorIncentiveCurrency:
              (data.vendorIncentiveCurrency as "INR" | "USD") ||
              (prev.vendorIncentiveCurrency as "INR" | "USD") ||
              "INR",
            vendorIncentiveRoe: String(
              data.vendorIncentiveRoe ?? prev.vendorIncentiveRoe ?? "",
            ),
            vendorIncentiveInr: String(
              data.vendorIncentiveInr ?? prev.vendorIncentiveInr ?? "",
            ),
            vendorIncentiveNotes: String(
              data.vendorIncentiveNotes ?? prev.vendorIncentiveNotes ?? "",
            ),

            commissionPaid: String(
              data.commissionPaid ?? prev.commissionPaid ?? "",
            ),
            commissionCurrency:
              (data.commissionCurrency as "INR" | "USD") ||
              (prev.commissionCurrency as "INR" | "USD") ||
              "INR",
            commissionRoe: String(
              data.commissionRoe ?? prev.commissionRoe ?? "",
            ),
            commissionInr: String(
              data.commissionInr ?? prev.commissionInr ?? "",
            ),
            commissionNotes: String(
              data.commissionNotes ?? prev.commissionNotes ?? "",
            ),

            cancellationForm: data,
          }));
          setIsCancellationModalOpen(false);
          setPendingPrevBookingStatus("");
        }}
        statusLabel="Cancelled"
        linkedShowAdvancedPricing={showAdvancedPricing}
        onLinkedShowAdvancedPricingChange={setShowAdvancedPricing}
        initialValues={cancellationModalInitialValues}
      />
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
                      prev.bookingdate !== date ? "" : prev.traveldate,
                  }))
                }
                placeholder="DD-MM-YYYY"
                showCalendarIcon={false}
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
                showCalendarIcon={false}
                readOnly={!formData.bookingdate}
              />
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

          {/* ================= Travel Insurance INFO ================ */}
          <div className="w-[48vw] border border-gray-200 rounded-[12px] p-3 mt-4">
            <h1 className="text-[0.85rem] font-medium text-gray-800 mb-2">
              Travel Insurance Info
            </h1>

            <hr className="mt-1 mb-3 border-t border-gray-200" />

            {/* Confirmation number + Title (stacked) */}
            <div className="flex flex-col gap-3 w-full mb-4">
              {/* Confirmation number */}
              <div className="flex flex-col w-full">
                <label className="text-[13px] font-medium text-gray-700 mb-1">
                  Confirmation number
                </label>
                <input
                  type="text"
                  name="confirmationNumber"
                  value={formData.confirmationNumber}
                  onChange={handleChange}
                  placeholder="Enter Confirmation Number"
                  className="w-[30%] px-3 py-1.5 border border-gray-300 rounded-md text-[13px] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>

              {/* Title */}
              <div className="flex flex-col w-full">
                <label className="text-[13px] font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Title …"
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

        {/* Submit Button */}
        {/* <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-1.5 bg-[#114958] text-[0.8rem] text-white rounded-md hover:bg-[#0d3a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div> */}
      </div>
    </>
  );
};

export default React.memo(InsuranceServiceInfoForm);
