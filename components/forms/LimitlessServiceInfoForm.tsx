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
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import { FaRegFolder } from "react-icons/fa";
import { allowUppercaseAlphanumeric6 } from "@/utils/inputValidators";
import type { CancellationModalFormState } from "@/components/Modals/CancellationModal";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";

// Type definitions
interface LimitlessServiceInfoFormData {
  bookingdate: string;
  traveldatestart: string;
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
    return fields as Partial<LimitlessServiceInfoFormData>;
  }, [externalFormData]);

  // Internal form state
  const [formData, setFormData] = useState<LimitlessServiceInfoFormData>({
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const businessCurrency = useMemo(() => getBusinessCurrency(user), [user]);
  const [showSellingNotes, setShowSellingNotes] = useState<boolean>(
    Boolean(formData.sellingNotes),
  );

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

  useEffect(() => {
    onFormDataUpdate({ limitlessinfoform: formData });
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
    name: keyof LimitlessServiceInfoFormData;
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
