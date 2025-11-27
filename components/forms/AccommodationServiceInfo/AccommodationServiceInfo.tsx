"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { validateAccommodationInfoForm } from "@/services/bookingApi";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import HotelLayout from "./HotelLayout";
import { useRef } from "react";
import VillaLayout from "./VillaLayout";
import { CiSearch } from "react-icons/ci";
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

interface AccommodationInfoFormProps {
  onSubmit?: (data: AccommodationInfoFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLDivElement | null>;
  onFormDataUpdate: (data: any) => void;
}

const AccommodationServiceInfoForm: React.FC<AccommodationInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
}) => {
  // Internal form state
  const [formData, setFormData] = useState<AccommodationInfoFormData>({
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

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Advanced Pricing State
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  const [vendorCurrency, setVendorCurrency] = useState("USD");
  const [vendorAmount, setVendorAmount] = useState("");
  const [vendorROE, setVendorROE] = useState("88.05");
  const [vendorINR, setVendorINR] = useState("0");
  const [bankChargesCurrency, setBankChargesCurrency] = useState("INR");
  const [bankChargesAmount, setBankChargesAmount] = useState("");
  const [cashbackCurrency, setCashbackCurrency] = useState("INR");
  const [cashbackAmount, setCashbackAmount] = useState("");
  const [cashbackMethod, setCashbackMethod] = useState("Wallet");
  const [customerSellingCurrency, setCustomerSellingCurrency] = useState("INR");
  const [customerSellingAmount, setCustomerSellingAmount] = useState("");
  const [commissionCurrency, setCommissionCurrency] = useState("INR");
  const [commissionAmount, setCommissionAmount] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filesAdded, setFilesAdded] = useState({
    document: false,
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleSegmentsChange = (updatedSegments: RoomSegment[]) => {
    setFormData((prev) => ({
      ...prev,
      segments: updatedSegments,
    }));
  };

  useEffect(() => {
    onFormDataUpdate({ accommodationinfoform: formData });
  }, [formData]);

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   setAttachedFile(file);

  //   setFilesAdded((prev) => ({
  //     ...prev,
  //     document: true,
  //   }));
  // };

  // Handle file removal
  // const handleDeleteFile = () => {
  //   setAttachedFile(null);
  //   if (fileInputRef.current) fileInputRef.current.value = "";
  // };

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
          <div className="flex flex-wrap items-end justify-between mb-3 px-5 -mx-5">
            {/* Left section: Booking + Travel Date */}
            <div className="flex items-end gap-2">
              {/* Booking Date */}
              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Booking Date
                </label>
                <input
                  type="date"
                  name="bookingdate"
                  value={formData.bookingdate}
                  onChange={handleChange}
                  placeholder="DD-MM-YYYY"
                  className="w-[12rem] px-2 py-1.5 text-[0.75rem] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Travel Date */}
              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Travel Date
                </label>
                <input
                  type="date"
                  name="traveldate"
                  value={formData.traveldate}
                  onChange={handleChange}
                  className="w-[12rem] px-2 py-1.5 text-[0.75rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right section: Booking Status */}
            <div>
              <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                Booking Status
              </label>
              <div className="relative">
                <select
                  name="bookingstatus"
                  className="w-[12rem] px-2 py-1.5 text-[0.75rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                >
                  <option>Select Status</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                </select>
                <MdKeyboardArrowDown className="absolute right-2 top-2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Amount Section */}

          <div className="mb-4 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[0.75rem] font-medium text-gray-700">
                Amount
              </h3>

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
                  className="w-5 h-5 border border-gray-400 rounded-md flex items-center justify-center cursor-pointer peer-checked:bg-green-600"
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
                <span className="text-[0.75rem] text-gray-700">
                  Show Advanced Pricing
                </span>
              </label>
            </div>

            <hr className="mb-3 -mt-1 border-t border-gray-200" />

            {!showAdvancedPricing ? (
              <>
                {/* Cost Price */}
                <div className="mb-3">
                  <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                    Cost Price
                  </label>
                  <div className="flex">
                    <div className="relative">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-l-md bg-gray-50 text-[0.75rem] font-medium text-gray-700 hover:bg-gray-100"
                      >
                        ₹
                      </button>
                    </div>
                    <input
                      type="text"
                      name="costprice"
                      value={formData.costprice}
                      onChange={handleChange}
                      placeholder="Enter Cost Price"
                      className="w-[20rem] px-2 py-1.5 text-[0.75rem] border border-l-0 border-gray-300 rounded-r-md focus:outline-none"
                    />
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                    Selling Price
                  </label>
                  <div className="flex">
                    <div className="relative">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-l-md bg-gray-50 text-[0.75rem] font-medium text-gray-700 hover:bg-gray-100"
                      >
                        ₹
                      </button>
                    </div>
                    <input
                      type="text"
                      name="sellingprice"
                      value={formData.sellingprice}
                      onChange={handleChange}
                      placeholder="Enter Selling Price"
                      className="w-[20rem] px-2 py-1.5 text-[0.75rem] border border-l-0 border-gray-300 rounded-r-md focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 w-[9rem] rounded-lg mt-4 p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.75rem] font-medium text-gray-700">
                      Net
                    </span>
                    <div className="flex gap-4 items-center">
                      <span className="text-[0.75rem] text-gray-700">
                        INR 0
                      </span>
                      <span className="text-[0.75rem] text-gray-700 font-medium">
                        23%
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Advanced Pricing Component */
              <div className="space-y-3">
                {/* Vendor Payment Summary */}

                <h4 className="text-[0.75rem] font-medium text-gray-700 mb-3">
                  Vendor Payment Summary
                </h4>

                {/* Container */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {/* Row */}
                  {[
                    "Vendor Invoice (Base)",
                    "Supplier Incentive Received",
                    "Partner Payout",
                    "Cost Price",
                  ].map((label, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 border-b last:border-b-0 border-gray-200"
                    >
                      {/* Left label */}
                      <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] text-[0.8rem] text-gray-700 font-medium py-5">
                        {label}
                      </div>

                      {/* Right inputs */}
                      <div className="col-span-8 flex items-center gap-3 py-3 px-4 bg-white">
                        {/* Rupee icon */}
                        <div className="text-gray-600 text-[0.85rem] font-medium">
                          ₹
                        </div>

                        {/* Amount Input */}
                        <input
                          type="text"
                          placeholder="Enter Amount"
                          className="w-[12rem] px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />

                        {/* Notes Input (only for rows that have it in screenshot) */}
                        {label !== "Cost Price" && (
                          <input
                            type="text"
                            placeholder="Enter notes here..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        )}

                        {/* Cost Price Blue Value */}
                        {label === "Cost Price" && (
                          <div className="px-3 py-2 text-blue-600 font-semibold text-[0.9rem]">
                            ₹ 0.00
                          </div>
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
                        placeholder="Enter Amount"
                        className="w-[12rem] px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Net */}
                <div className="border border-gray-200 w-[9rem] rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.75rem] font-medium text-gray-700">
                      Net
                    </span>
                    <div className="flex gap-4 items-center">
                      <span className="text-[0.75rem] text-gray-700">
                        INR 0
                      </span>
                      <span className="text-[0.75rem] text-gray-700 font-medium">
                        23%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-[48vw] border border-gray-200 rounded-[12px] p-3 mt-4">
            <h1 className="text-[0.75rem] font-medium text-gray-700 mb-2">
              Accommodation Info
            </h1>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            {/* Confirmation Number */}
            <div className="mb-3">
              <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                Confirmation Number
              </label>
              <input
                type="text"
                placeholder="Enter Confirmation Number"
                className="w-[18rem] px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Check-in / Check-out Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {/* Check-In Date */}
              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Check-In Date
                </label>
                <input
                  type="text"
                  value={formData.checkindate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      checkindate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Check-In Time */}
              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Check-In Time
                </label>
                <div className="flex items-center gap-1 border border-gray-300 rounded-md px-2 py-1 w-fit">
                  <input
                    type="text"
                    value={formData.checkintime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        checkintime: e.target.value,
                      }))
                    }
                    placeholder="12:00"
                    className="w-16 text-center border-none bg-transparent text-[0.75rem] focus:outline-none"
                  />
                  <select
                    value={formData.checkOutPeriod}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        checkOutPeriod: e.target.value as "AM" | "PM",
                      }))
                    }
                    className="border-none bg-transparent text-center text-[0.75rem] focus:outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Check-Out Date */}
              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Check-Out Date
                </label>
                <input
                  type="text"
                  value={formData.checkoutdate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      checkoutdate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Check-Out Time */}
              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Check-Out Time
                </label>
                <div className="flex items-center gap-1 border border-gray-300 rounded-md px-2 py-1 w-fit">
                  <input
                    type="text"
                    value={formData.checkouttime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        checkouttime: e.target.value,
                      }))
                    }
                    placeholder="11:00"
                    className="w-16 text-center border-none bg-transparent text-[0.75rem] focus:outline-none"
                  />
                  <select
                    value={formData.checkOutPeriod}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        checkOutPeriod: e.target.value as "AM" | "PM",
                      }))
                    }
                    className="border-none bg-transparent text-center text-[0.75rem] focus:outline-none"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pax & Meal Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Pax
                </label>
                <input
                  type="text"
                  value={formData.pax}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pax: e.target.value }))
                  }
                  className="w-[10rem] px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Select Meal Plan
                </label>
                <select
                  value={formData.mealPlan}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mealPlan: e.target.value,
                    }))
                  }
                  className="w-[14rem] px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                  }}
                >
                  <option value="EPAI">EPAI</option>
                </select>
              </div>
            </div>

            {/* Accommodation Type Section */}
            <div className="border border-gray-200 rounded-[12px] p-3 mt-3">
              <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                Select Accommodation Type
              </label>
              <div className="relative w-[14rem] mb-2">
                <select
                  defaultValue=""
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accommodationType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 pr-10 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                >
                  <option value="" disabled>
                    Select Stay Type
                  </option>
                  <option>Hotel</option>
                  <option>Resort</option>
                  <option>Hostel</option>
                  <option>Villa</option>
                </select>
                <MdKeyboardArrowDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {formData.accommodationType && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                      {formData.accommodationType} Address
                    </label>
                    <input
                      type="text"
                      value={formData.propertyAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          propertyAddress: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${formData.accommodationType} Address`}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                      Google Maps Link
                    </label>
                    <div className="flex gap-2">
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
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        className="px-3 py-1.5 flex items-center gap-1 bg-[#126ACB] text-white rounded-md text-[0.75rem] hover:bg-blue-700"
                      >
                        <MdOutlineFileUpload size={16} /> Copy Link
                      </button>
                    </div>
                  </div>
                </div>
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
              {formData.accommodationType === "Villa" && (
                <VillaLayout
                  segments={formData.segments}
                  onSegmentsChange={handleSegmentsChange}
                />
              )}
            </div>
          </div>
        </div>

        {/* ID PROOFS */}
        {/* <div className="border border-gray-200  w-[48vw] ml-2.5 -mt-3 rounded-[12px] p-3">
          <h2 className="text-[0.75rem] font-medium mb-2">Documents</h2>
          <hr className="mt-1 mb-2 border-t border-gray-200" />

          <div className="flex flex-col gap-4">
            <div className="flex gap-5"> */}
        {/* Documents */}
        {/* <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-3 items-start">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-white text-[#126ACB] border border-[#126ACB]  text-[0.725rem] mt-2 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  >
                    <MdOutlineFileUpload size={16} /> Attach Files
                  </button>

                  {attachedFile && (
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 w-[8rem]">
                      <span className="text-gray-700 text-[0.65rem] font-medium truncate">
                        📎 {attachedFile.name}
                      </span>
                      <button
                        onClick={handleDeleteFile}
                        className="ml-auto text-red-500 hover:text-red-700 transition-all"
                        title="Remove file"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  )}

                  <div className="text-red-600 -mt-1 text-[0.65rem]">
                    Note: Maximum of 3 files can be uploaded
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Remarks Section */}
        <div className="border border-gray-200 w-[48vw] ml-2.5 rounded-[12px] p-3 mt-4">
          <label className="block text-[0.75rem] font-medium text-gray-700">
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
            className={`w-full border border-gray-200 rounded-md px-2 py-1.5 text-[0.75rem] mt-1 transition-colors focus:ring focus:ring-blue-200 ${
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
