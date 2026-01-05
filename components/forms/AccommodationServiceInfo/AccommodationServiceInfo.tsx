"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { validateAccommodationInfoForm } from "@/services/bookingApi";
import {
  MdOutlineFileUpload,
  MdKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import HotelLayout from "./HotelLayout";
import { useRef } from "react";
import VillaLayout from "./VillaLayout";
import { CiSearch } from "react-icons/ci";
import DropDown from "@/components/DropDown";
import SingleCalendar from "@/components/SingleCalendar";
import StyledDescription from "@/components/StyledDescription";
import { FaRegFolder } from "react-icons/fa";
import { allowTextAndNumbers } from "@/utils/inputValidators";
// Type definitions
interface AccommodationInfoFormData {
  bookingdate: string;
  traveldate: string; // This can be the main/first travel date
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  checkindate: string;
  checkintime: string;
  checkoutdate: string;
  checkouttime: string;
  checkOutPeriod: "AM" | "PM";
  pax: number | string;
  mealPlan: "EPAI" | "CPAI" | "MAPAI" | "APAI" | string;
  confirmationNumber: number | string;
  accommodationType:
    | "Hotel"
    | "Resort"
    | "Hostel"
    | "Villa"
    | "Apartment"
    | "Homestay"
    | "Experiental Stay"
    | string;
  propertyName: string;
  propertyAddress: string;
  googleMapsLink: string;
  segments: RoomSegment[];
  costprice: number | string;
  sellingprice: number | string;
  remarks: string;
}

interface InputFieldProps {
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  min?: number;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string | undefined;
  isValidating?: boolean;
  isValid?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  type = "text",
  placeholder,
  required,
  className = "",
  min,
  value,
  onChange,
  onBlur,
  disabled = false,
  hasError = false,
  errorMessage,
  isValidating = false,
  isValid = false,
}) => {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        min={min}
        disabled={disabled || isValidating}
        className={`
          w-full border rounded-md px-3 py-2 pr-10 text-[0.75rem]  transition-colors
          ${
            hasError
              ? "border-red-300 focus:ring-red-200"
              : isValid
              ? "border-green-300 focus:ring-green-200"
              : "border-gray-200 focus:ring-blue-200"
          }
          ${disabled || isValidating ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      />

      {/* Validation indicator */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <CiSearch size={18} className="text-gray-400" />
        {isValidating && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        )}
        {!isValidating && isValid && (
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
        {!isValidating && hasError && (
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

      {hasError && errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

interface RoomSegment {
  id?: string | null;
  roomCategory: string;
  bedType: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ExternalFormData {
  formFields?: Partial<AccommodationInfoFormData>;
  accommodationinfoform?: Partial<AccommodationInfoFormData>;
}

interface AccommodationInfoFormProps {
  onSubmit?: (data: AccommodationInfoFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLDivElement | null>;
  onFormDataUpdate: (data: any) => void;
  onAddDocuments?: (files: File[]) => void;
  externalFormData?: ExternalFormData | Record<string, unknown>;
}

const AccommodationServiceInfoForm: React.FC<AccommodationInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
  onAddDocuments,
  externalFormData,
}) => {
  const normalizedExternalData = useMemo(() => {
    const source = externalFormData ?? {};
    const fields =
      (source as ExternalFormData)?.formFields ??
      (source as ExternalFormData)?.accommodationinfoform ??
      source;
    return fields as Partial<AccommodationInfoFormData>;
  }, [externalFormData]);

  // Internal form state
  const [formData, setFormData] = useState<AccommodationInfoFormData>({
    bookingdate: normalizedExternalData?.bookingdate || "",
    traveldate: normalizedExternalData?.traveldate || "",
    bookingstatus: normalizedExternalData?.bookingstatus || "",
    costprice: normalizedExternalData?.costprice || "",
    sellingprice: normalizedExternalData?.sellingprice || "",
    confirmationNumber: normalizedExternalData?.confirmationNumber || "",
    checkindate: normalizedExternalData?.checkindate || "",
    checkintime: normalizedExternalData?.checkintime || "",
    checkoutdate: normalizedExternalData?.checkoutdate || "",
    checkouttime: normalizedExternalData?.checkouttime || "",
    checkOutPeriod: "AM",
    pax: normalizedExternalData?.pax || "",
    mealPlan: normalizedExternalData?.mealPlan || "",
    propertyName: normalizedExternalData?.propertyName || "",
    propertyAddress: normalizedExternalData?.propertyAddress || "",
    googleMapsLink: normalizedExternalData?.googleMapsLink || "",
    segments: [
      {
        id: "room-1",
        roomCategory: "",
        bedType: "",
      },
    ],
    accommodationType: "",

    remarks: normalizedExternalData?.remarks || "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Advanced Pricing State
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Villa type controlled by parent: 'entire' or 'shared'
  const [villaType, setVillaType] = useState<"entire" | "shared">("entire");

  const [vendorBasePrice, setVendorBasePrice] = useState<string>("");
  const [vendorIncentiveReceived, setVendorIncentiveReceived] =
    useState<string>("");
  const [commissionPaid, setCommissionPaid] = useState<string>("");

  const derivedCostPrice = useMemo(() => {
    const a = Number(vendorBasePrice) || 0;
    const b = Number(vendorIncentiveReceived) || 0;
    const c = Number(commissionPaid) || 0;
    return a - b + c;
  }, [commissionPaid, vendorBasePrice, vendorIncentiveReceived]);

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

  const handleCopyGoogleLink = async () => {
    try {
      await navigator.clipboard.writeText(formData.googleMapsLink || "");
      console.log("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSegmentsChange = (updatedSegments: RoomSegment[]) => {
    setFormData((prev) => ({
      ...prev,
      segments: updatedSegments,
    }));
  };

  // Handle total rooms change when Villa is selected and mode is entire
  const handleVillaRoomCountChange = (newCount: number) => {
    if (newCount < 1) return;
    const current = formData.segments || [];

    if (newCount > current.length) {
      const newSegments: RoomSegment[] = [...current];
      for (let i = current.length; i < newCount; i++) {
        const roomId = `room-${i + 1}`;
        newSegments.push({ id: roomId, roomCategory: "", bedType: "" });
      }
      handleSegmentsChange(newSegments);
    } else if (newCount < current.length) {
      handleSegmentsChange(current.slice(0, newCount));
    }
  };

  // Sync with external form data when it changes
  useEffect(() => {
    if (!normalizedExternalData) return;
    setFormData((prev) => ({
      ...prev,
      ...normalizedExternalData,
    }));
  }, [normalizedExternalData]);

  useEffect(() => {
    onFormDataUpdate({ accommodationinfoform: formData });
  }, [formData]);

  const options = [
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
    // { value: "", label: "Booking Status" },
  ];

  const handleBookingStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, bookingstatus: value }));
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
    []
  );

  // Enhanced validation function using API validation
  const validateField = useCallback(
    (name: string, value: any): string => {
      // Use API validation for comprehensive checks
      const apiErrors = validateAccommodationInfoForm({
        bookingdate: "",
        traveldate: "",
        bookingstatus: "",
        costprice: "",
        sellingprice: "",
        confirmationNumber: "",
        checkindate: "",
        checkintime: "",
        checkoutdate: "",
        checkouttime: "",
        checkOutPeriod: "AM",
        pax: "",
        mealPlan: "",
        propertyName: "",
        propertyAddress: "",
        googleMapsLink: "",
        segments: [
          {
            id: "room-1",
            roomCategory: "",
            bedType: "",
          },
        ],
        accommodationType: "",
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
    [validationRules]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof AccommodationInfoFormData]
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const processedValue =
      type === "number" && value !== "" ? Number(value) : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Clear error when user types
    if (errors[name as keyof AccommodationInfoFormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Mark field touched
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Allow only digits and a single decimal point for price fields
  const sanitizeNumeric = (val: string) => {
    const v = String(val || "").replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length <= 1) return parts[0];
    // join remaining parts (remove extra dots) and keep first dot only
    return parts[0] + "." + parts.slice(1).join("");
  };

  const handlePriceChange =
    (field: "costprice" | "sellingprice") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const sanitized = sanitizeNumeric(raw);
      setFormData((prev) => ({ ...prev, [field]: sanitized }));
      if ((errors as any)[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
      setTouched((prev) => ({ ...prev, [field]: true }));
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
    [validateField, showValidation]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (validateForm()) {
        onSubmit?.(formData);
      } else {
        // Mark all fields as touched to show validation errors
        const allTouched = Object.keys(validationRules).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setTouched(allTouched);
      }
    },
    [formData, validateForm, onSubmit, validationRules]
  );

  // Helper to get input field props
  const getInputProps = (
    name: keyof AccommodationInfoFormData,
    options?: {
      value?: string | number;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      skipValidation?: boolean;
    }
  ) => {
    const isValidatingField = name === "bookingdate" && isValidating;

    const fieldValue =
      options?.value !== undefined ? options.value : formData[name];
    const hasError = !!(errors[name] && touched[name]);
    const hasValue = formData[name] && String(formData[name]).trim();
    const isValid =
      !options?.skipValidation && !!hasValue && !hasError && !isValidating;

    return {
      value: fieldValue as string | number,
      onChange: options?.onChange || handleChange,
      onBlur: handleBlur,
      disabled: isSubmitting || isValidating,
      hasError,
      errorMessage: errors[name],
      isValidating,
      isValid,
    };
  };

  return (
    <>
      <div className="space-y-4 p-4 -mt-1" ref={formRef as any}>
        <div className="px-2 py-1">
          {/* Booking and Travel Date */}
          <div className="flex flex-wrap items-end justify-between gap-y-2 mb-3 px-5 -mx-5">
            {/* Left section: Booking + Travel Date */}
            <div className="flex flex-wrap items-end gap-2">
              {/* Booking Date */}
              <SingleCalendar
                label="Booking Date"
                value={formData.bookingdate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, bookingdate: date }))
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

          <div className=" w-[100%] mb-4 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-gray-700">Amount</h3>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="remember"
                  className="hidden"
                  checked={showAdvancedPricing}
                  onChange={() => setShowAdvancedPricing(!showAdvancedPricing)}
                />
                <label
                  htmlFor="remember"
                  className="w-4 h-4 border border-gray-400 rounded-md flex items-center justify-center cursor-pointer peer-checked:bg-green-600"
                >
                  {showAdvancedPricing && (
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
                </label>
                <span className="text-[13px] text-gray-700">
                  Show Advanced Pricing
                </span>
              </label>
            </div>

            <hr className="mb-3 -mt-1 border-t border-gray-200" />

            {!showAdvancedPricing ? (
              <>
                {/* Cost Price */}
                <div className="mb-3">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    Cost Price
                  </label>
                  <div className="flex">
                    <div className="relative">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-l-md bg-gray-50 text-[13px] font-medium text-gray-700 hover:bg-gray-100"
                      >
                        ₹
                      </button>
                    </div>
                    <input
                      type="text"
                      name="costprice"
                      value={formData.costprice}
                      onChange={handlePriceChange("costprice")}
                      placeholder="Enter Cost Price"
                      className="w-[10rem] px-2 py-1.5 text-[13px] border border-l-0 border-gray-300 rounded-r-md hover:border-green-300 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    Selling Price
                  </label>
                  <div className="flex">
                    <div className="relative">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-l-md bg-gray-50 text-[13px] font-medium text-gray-700 hover:bg-gray-100"
                      >
                        ₹
                      </button>
                    </div>
                    <input
                      type="text"
                      name="sellingprice"
                      value={formData.sellingprice}
                      onChange={handlePriceChange("sellingprice")}
                      placeholder="Enter Selling Price"
                      className="w-[10rem] px-2 py-1.5 text-[13px] border border-l-0 border-gray-300 rounded-r-md hover:border-green-300 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                  </div>
                </div>

                <div className="w-fit rounded-lg p-1 mt-1 bg-white">
                  {/* Label on top */}
                  <span className="text-[13px] font-medium text-gray-700 block mb-2">
                    Net
                  </span>

                  {/* Amount + percentage row */}
                  <div className="flex items-center gap-3">
                    {/* Blue pill amount */}
                    <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[13px] font-medium rounded-md">
                      {`INR ${
                        Number(formData.sellingprice) -
                        Number(formData.costprice)
                      }`}
                    </span>

                    {/* Percentage */}
                    <span className="text-[13px] text-gray-700 font-medium">
                      {formData.costprice && formData.sellingprice
                        ? `${(
                            ((Number(formData.sellingprice) -
                              Number(formData.costprice)) /
                              Number(formData.costprice)) *
                            100
                          ).toFixed(2)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Advanced Pricing Component */
              <div className="space-y-3">
                {/* Vendor Payment Summary */}

                <h4 className="text-[13px] font-medium text-gray-700 mb-3">
                  Vendor Payment Summary
                </h4>

                {/* Container */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {[
                    { label: "Vendor Base Price", key: "price" },
                    { label: "Vendor Incentive Received", key: "received" },
                    { label: "Commission Paid", key: "payout" },
                    { label: "Cost Price", key: "cost" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 border-b last:border-b-0 border-gray-200"
                    >
                      <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] text-[0.8rem] text-gray-700 font-medium py-5">
                        {item.label}
                      </div>
                      <div className="col-span-8 flex items-center gap-3 py-3 px-4 bg-white">
                        {item.key !== "cost" && (
                          <div className="text-gray-600 text-[0.85rem] font-medium">
                            ₹
                          </div>
                        )}

                        {item.key !== "cost" ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="^\\d*(?:\\.\\d*)?$"
                            placeholder="Enter Amount"
                            value={
                              item.key === "price"
                                ? vendorBasePrice
                                : item.key === "received"
                                ? vendorIncentiveReceived
                                : commissionPaid
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              const sanitized = sanitizeNumeric(raw);
                              if (item.key === "price")
                                setVendorBasePrice(String(sanitized));
                              else if (item.key === "received")
                                setVendorIncentiveReceived(String(sanitized));
                              else setCommissionPaid(String(sanitized));
                            }}
                            className="w-[12rem] px-3 py-2 border border-gray-300 rounded-lg text-[13px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        ) : (
                          <div className="px-3 py-2 text-blue-600 font-semibold text-[0.9rem]">
                            {`₹ ${derivedCostPrice.toFixed(2)}`}
                          </div>
                        )}

                        {item.key !== "cost" && (
                          <input
                            type="text"
                            placeholder="Enter notes here..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] hover:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Revenue Summary */}
                <h4 className="text-[0.8rem] font-semibold text-gray-700">
                  Customer Revenue Summary
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-12">
                    {/* Label */}
                    <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] text-[0.8rem] text-gray-700 font-medium py-5">
                      Selling Price
                    </div>

                    {/* Inputs */}
                    <div className="col-span-8 flex items-center gap-3 py-3 px-4 bg-white">
                      <div className="text-gray-600 text-[0.85rem] font-medium">
                        ₹
                      </div>

                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="^\\d*(?:\\.\\d*)?$"
                        placeholder="Enter Amount"
                        value={String(formData.sellingprice ?? "")}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sellingprice: String(
                              sanitizeNumeric(e.target.value)
                            ),
                          }))
                        }
                        className="w-[12rem] px-3 py-2 border border-gray-300 rounded-lg text-[13px] hover:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Net */}
                <div className="w-fit rounded-lg p-1 mt-1 bg-white">
                  {/* Label on top */}
                  <span className="text-[13px] font-medium text-gray-700 block mb-2">
                    Net
                  </span>

                  {/* Amount + percentage row */}
                  <div className="flex items-center gap-3">
                    {/* Blue pill amount */}
                    <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[13px] font-medium rounded-md">
                      {`INR ${(
                        (Number(formData.sellingprice) || 0) - derivedCostPrice
                      ).toFixed(2)}`}
                    </span>

                    {/* Percentage */}
                    <span className="text-[13px] text-gray-700 font-medium">
                      {derivedCostPrice > 0 && formData.sellingprice
                        ? `${(
                            (((Number(formData.sellingprice) || 0) -
                              derivedCostPrice) /
                              derivedCostPrice) *
                            100
                          ).toFixed(2)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full border border-gray-200 rounded-[12px] p-3 mt-4">
            <h1 className="text-[13px] font-medium text-gray-700 mb-2">
              Accommodation Info
            </h1>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            {/* Confirmation Number */}
            <div className="mb-3">
              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                Confirmation Number
              </label>
              <input
                type="text"
                name="confirmationNumber"
                value={formData.confirmationNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmationNumber: allowTextAndNumbers(e.target.value),
                  }))
                }
                placeholder="Enter Confirmation Number"
                className="w-[18rem] px-3 py-1.5 border border-gray-300 rounded-md text-[13px] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
              />
            </div>

            {/* Check-in / Check-out Section */}
            <div className="flex items-end justify-between mb-3">
              <div className="flex items-end gap-0">
                {/* Check-In Date */}
                <SingleCalendar
                  label="Check-In Date"
                  value={formData.checkindate}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      checkindate: date,
                    }))
                  }
                  placeholder="DD-MM-YYYY"
                  customWidth="w-[95%]"
                  labelClassName="block text-gray-700 mb-1 text-[0.65rem] font-medium"
                  inputClassName="flex-1 text-[0.65rem] text-gray-700 outline-none bg-transparent"
                  showCalendarIcon={false}
                />

                {/* Check-In Time */}
                <div>
                  <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="text"
                    value={formData.checkintime}
                    onChange={(e) => {
                      // Only allow digits and colon
                      let val = e.target.value.replace(/[^0-9:]/g, "");

                      // Prevent multiple colons
                      const colonCount = (val.match(/:/g) || []).length;
                      if (colonCount > 1) {
                        val = val.replace(/:([^:]*)$/, "$1");
                      }

                      // Auto-insert colon after 2 digits
                      if (
                        val.length === 2 &&
                        !val.includes(":") &&
                        formData.checkintime.length < 2
                      ) {
                        val = val + ":";
                      }

                      // Limit to HH:MM format (5 chars)
                      if (val.length > 5) val = val.slice(0, 5);

                      // Validate hours (0-23) and minutes (0-59)
                      if (val.includes(":")) {
                        const parts = val.split(":");
                        const hours = parts[0] || "";
                        const minutes = parts[1] || "";
                        let validHours = hours;
                        let validMinutes = minutes;

                        // Validate hours
                        if (hours.length > 0) {
                          const hourNum = parseInt(hours, 10);
                          if (hours.length === 2 && hourNum > 23) {
                            validHours = "23";
                          }
                        }

                        // Validate minutes
                        if (validMinutes.length > 0) {
                          const minNum = parseInt(validMinutes, 10);
                          if (validMinutes.length === 2 && minNum > 59) {
                            validMinutes = "59";
                          }
                        }

                        val = validHours + ":" + validMinutes;
                      } else {
                        // Validate hours before colon is added
                        if (val.length === 2) {
                          const hourNum = parseInt(val, 10);
                          if (hourNum > 23) {
                            val = "23";
                          }
                        }
                      }

                      setFormData((prev) => ({
                        ...prev,
                        checkintime: val,
                      }));
                    }}
                    placeholder="HH:MM"
                    maxLength={5}
                    className="w-[60%] px-2 py-1.5 border border-gray-300 rounded-md text-[0.65rem] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                  />
                </div>
              </div>

              {/* Right side: Check-Out Date and Time */}
              <div className="flex items-end gap-0 ml-62">
                {/* Check-Out Date */}
                <SingleCalendar
                  label="Check-Out Date"
                  value={formData.checkoutdate}
                  onChange={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      checkoutdate: date,
                    }))
                  }
                  placeholder="DD-MM-YYYY"
                  minDate={formData.checkindate}
                  customWidth="w-[95%]"
                  labelClassName="block text-gray-700 mb-1 text-[0.65rem] font-medium"
                  inputClassName="flex-1 text-[0.65rem] text-gray-700 outline-none bg-transparent"
                  showCalendarIcon={false}
                />

                {/* Check-Out Time */}
                <div>
                  <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="text"
                    value={formData.checkouttime}
                    onChange={(e) => {
                      // Only allow digits and colon
                      let val = e.target.value.replace(/[^0-9:]/g, "");

                      // Prevent multiple colons
                      const colonCount = (val.match(/:/g) || []).length;
                      if (colonCount > 1) {
                        val = val.replace(/:([^:]*)$/, "$1");
                      }

                      // Auto-insert colon after 2 digits
                      if (
                        val.length === 2 &&
                        !val.includes(":") &&
                        formData.checkouttime.length < 2
                      ) {
                        val = val + ":";
                      }

                      // Limit to HH:MM format (5 chars)
                      if (val.length > 5) val = val.slice(0, 5);

                      // Validate hours (0-23) and minutes (0-59)
                      if (val.includes(":")) {
                        const parts = val.split(":");
                        const hours = parts[0] || "";
                        const minutes = parts[1] || "";
                        let validHours = hours;
                        let validMinutes = minutes;

                        // Validate hours
                        if (hours.length > 0) {
                          const hourNum = parseInt(hours, 10);
                          if (hours.length === 2 && hourNum > 23) {
                            validHours = "23";
                          }
                        }

                        // Validate minutes
                        if (validMinutes.length > 0) {
                          const minNum = parseInt(validMinutes, 10);
                          if (validMinutes.length === 2 && minNum > 59) {
                            validMinutes = "59";
                          }
                        }

                        val = validHours + ":" + validMinutes;
                      } else {
                        // Validate hours before colon is added
                        if (val.length === 2) {
                          const hourNum = parseInt(val, 10);
                          if (hourNum > 23) {
                            val = "23";
                          }
                        }
                      }

                      setFormData((prev) => ({
                        ...prev,
                        checkouttime: val,
                      }));
                    }}
                    placeholder="HH:MM"
                    maxLength={5}
                    className="w-[60%] px-2 py-1.5 border border-gray-300 rounded-md text-[0.65rem] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                  />
                </div>
              </div>
            </div>

            {/* Pax & Meal Plan */}
            <div className="flex items-end gap-3 mb-3">
              <div>
                <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">
                  Pax
                </label>
                <input
                  type="number"
                  value={formData.pax}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pax: e.target.value }))
                  }
                  placeholder="0"
                  className="w-[8rem] px-2 py-1.5 border border-gray-300 rounded-md text-[0.65rem] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] font-medium text-gray-700 mb-1">
                  Meal Plan
                </label>
                <DropDown
                  options={[
                    { value: "EPAI", label: "EPAI" },
                    { value: "CPAI", label: "CPAI" },
                    { value: "MAPAI", label: "MAPAI" },
                    { value: "APAI", label: "APAI" },
                    { value: "Room Only", label: "Room Only" },
                  ]}
                  placeholder="Select Plan"
                  value={formData.mealPlan}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      mealPlan: value,
                    }))
                  }
                  customWidth="w-[9rem]"
                />
              </div>
            </div>

            {/* Accommodation Type Section */}
            <div className="border border-gray-200 rounded-[12px] p-3 mt-3">
              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                Select Accommodation Type
              </label>
              <div className="flex items-center justify-between mb-2">
                <div className="w-[27%]">
                  <DropDown
                    options={[
                      { value: "Hotel", label: "Hotel" },
                      { value: "Resort", label: "Resort" },
                      { value: "Hostel", label: "Hostel" },
                      { value: "Villa", label: "Villa" },
                    ]}
                    placeholder="Select Stay Type"
                    value={formData.accommodationType}
                    onChange={(val) => {
                      setFormData((prev) => ({
                        ...prev,
                        accommodationType: val,
                      }));
                      if (val !== "Villa") setVillaType("entire");
                    }}
                    customWidth="w-full"
                  />
                </div>

                {/* Villa type radio buttons shown only when Villa is selected */}
                {formData.accommodationType === "Villa" ? (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="villaType"
                        value="entire"
                        checked={villaType === "entire"}
                        onChange={() => setVillaType("entire")}
                        className="w-3 h-3 accent-blue-600"
                      />
                      <span className="text-[13px] text-gray-700 font-medium">
                        Entire Villa
                      </span>
                    </label>

                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="villaType"
                        value="shared"
                        checked={villaType === "shared"}
                        onChange={() => setVillaType("shared")}
                        className="w-3 h-3 accent-blue-600"
                      />
                      <span className="text-[13px] text-gray-700 font-medium">
                        Shared Villa
                      </span>
                    </label>
                  </div>
                ) : (
                  <div />
                )}
              </div>

              {formData.accommodationType && (
                <>
                  <div className="flex gap-2 mt-2 items-end">
                    <div className="w-[30%]">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">
                        {formData.accommodationType} Name
                      </label>
                      <input
                        type="text"
                        value={formData.propertyName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            propertyName: e.target.value,
                          }))
                        }
                        placeholder={`Enter ${formData.accommodationType} Name`}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[13px] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      />
                    </div>

                    <div className="w-[70%]">
                      <label className="block text-[13px] font-medium text-gray-700 mb-1">
                        {formData.accommodationType} Address
                      </label>
                      <input
                        type="text"
                        value={formData.propertyAddress}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            propertyAddress: allowTextAndNumbers(
                              e.target.value
                            ),
                          }))
                        }
                        placeholder={`Enter ${formData.accommodationType} Address`}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[13px] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-[13px] font-medium text-gray-700 mb-1">
                      Google Maps Link
                    </label>

                    <div className="flex w-full">
                      <input
                        type="text"
                        value={formData.googleMapsLink}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            googleMapsLink: e.target.value,
                          }))
                        }
                        placeholder="Paste Google Maps Link"
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-l-md text-[13px] hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      />

                      <button
                        type="button"
                        onClick={handleCopyGoogleLink}
                        className="px-4 py-1.5 flex items-center gap-1 bg-[#126ACB] text-white rounded-r-md text-[13px] hover:bg-blue-700 border border-[#126ACB]"
                      >
                        <MdOutlineFileUpload size={16} /> Copy Link
                      </button>
                    </div>

                    {/* Total Rooms counter shown for Entire Villa */}
                    {formData.accommodationType === "Villa" &&
                      villaType === "entire" && (
                        <div className="mt-3">
                          <label className="block text-[13px] font-medium text-gray-700 mb-1">
                            Total Rooms
                          </label>

                          <div className="flex items-center gap-2">
                            <div className="flex border border-gray-300 rounded-md overflow-hidden">
                              <input
                                type="number"
                                value={formData.segments?.length || 0}
                                onChange={(e) =>
                                  handleVillaRoomCountChange(
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                min="1"
                                className="w-[2.2rem] px-1 py-1.5 text-[13px] text-center border-none focus:outline-none bg-white"
                              />

                              <div className="flex flex-col border-l border-black">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVillaRoomCountChange(
                                      (formData.segments?.length || 0) + 1
                                    )
                                  }
                                  className="px-[5px] py-[2px] rounded-tr-md text-[0.65rem] hover:bg-gray-100 border border-black border-b-0"
                                >
                                  <MdOutlineKeyboardArrowUp size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVillaRoomCountChange(
                                      Math.max(
                                        1,
                                        (formData.segments?.length || 1) - 1
                                      )
                                    )
                                  }
                                  className="px-[5px] py-[2px] rounded-br-md text-[0.65rem] hover:bg-gray-100 border border-black"
                                >
                                  <MdKeyboardArrowDown size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </>
              )}

              {/* Layout Components */}
              {formData.accommodationType === "Hotel" && (
                <HotelLayout
                  segments={formData.segments}
                  onSegmentsChange={handleSegmentsChange}
                />
              )}
              {formData.accommodationType === "Resort" && (
                <HotelLayout
                  segments={formData.segments}
                  onSegmentsChange={handleSegmentsChange}
                />
              )}
              {formData.accommodationType === "Hostel" && (
                <HotelLayout
                  segments={formData.segments}
                  onSegmentsChange={handleSegmentsChange}
                />
              )}
              {formData.accommodationType === "Villa" &&
                villaType === "shared" && (
                  <VillaLayout
                    segments={formData.segments}
                    onSegmentsChange={handleSegmentsChange}
                    villaType={villaType}
                  />
                )}
              <div className="-mt-1 space-y-3">
                <StyledDescription label="Add Ons" />
                <StyledDescription label="Special Requests" />
                <StyledDescription label="Important Information" />
                <StyledDescription label="Cancellation Policy" />
              </div>
            </div>
          </div>
        </div>

        {/* ID PROOFS */}
        <div className="w-[98%] ml-2 border border-gray-200 rounded-[12px] p-3">
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

        {/* Remarks Section */}
        <div className="border border-gray-200 w-[98%] ml-2.5 rounded-[12px] p-3 mt-4">
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

export default React.memo(AccommodationServiceInfoForm);
