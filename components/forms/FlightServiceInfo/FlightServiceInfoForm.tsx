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
import SingleCalendar from "@/components/SingleCalendar";
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

interface FlightInfoFormProps {
  onSubmit?: (data: FlightInfoFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onFormDataUpdate: (data: any) => void;
}

const FlightServiceInfoForm: React.FC<FlightInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
}) => {
  // Internal form state
  const [formData, setFormData] = useState<FlightInfoFormData>({
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
    pnrEnabled: true,
    samePNRForAllSegments: false,
    flightType: "One Way",
    remarks: "",
  });

  // Sync initial form state to parent on mount
  useEffect(() => {
    onFormDataUpdate({ flightinfoform: formData });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const [errors, setErrors] = useState<ValidationErrors>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);
  // const [costPriceCurrency, setCostPriceCurrency] = useState("INR");
  // const [sellingPriceCurrency, setSellingPriceCurrency] = useState("INR");
  // const [showCostDropdown, setShowCostDropdown] = useState(false);
  // const [showSellingDropdown, setShowSellingDropdown] = useState(false);
  // const [roeVisibleFor, setRoeVisibleFor] = useState<null | "cost" | "selling">(
  //   null
  // );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filesAdded, setFilesAdded] = useState({
    document: false,
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Advanced Pricing State
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  // const [vendorCurrency, setVendorCurrency] = useState("USD");
  // const [vendorAmount, setVendorAmount] = useState("");
  // const [vendorROE, setVendorROE] = useState("88.05");
  // const [vendorINR, setVendorINR] = useState("0");
  // const [bankChargesCurrency, setBankChargesCurrency] = useState("INR");
  // const [bankChargesAmount, setBankChargesAmount] = useState("");
  // const [cashbackCurrency, setCashbackCurrency] = useState("INR");
  // const [cashbackAmount, setCashbackAmount] = useState("");
  // const [cashbackMethod, setCashbackMethod] = useState("Wallet");
  // const [customerSellingCurrency, setCustomerSellingCurrency] = useState("INR");
  // const [customerSellingAmount, setCustomerSellingAmount] = useState("");
  // const [commissionCurrency, setCommissionCurrency] = useState("INR");
  // const [commissionAmount, setCommissionAmount] = useState("");
  // Vendor payment summary fields
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);

    setFilesAdded((prev) => ({
      ...prev,
      document: true,
    }));
  };

  // Handle file removal
  const handleDeleteFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
    [validationRules]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof FlightInfoFormData]
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

  return (
    <>
      <form
        className="space-y-4 p-4 -mt-1"
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
                  setFormData((prev) => ({ ...prev, bookingdate: date }))
                }
                placeholder="DD-MM-YYYY"
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

          <div className="mb-4 border border-gray-200 rounded-lg w-[48vw] p-3">
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
                  className="w-4 h-4 -mt-1 border border-gray-300 rounded-sm flex items-center justify-center cursor-pointer peer-checked:bg-green-600"
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
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-l-md text-[0.75rem] font-medium text-gray-700 hover:bg-gray-100"
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
                      className="w-[10rem] px-2 py-1.5 text-[0.75rem] border border-l-0 border-gray-300 rounded-r-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
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
                        className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-l-md text-[0.75rem] font-medium text-gray-700 hover:bg-gray-100"
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
                      className="w-[10rem] px-2 py-1.5 text-[0.75rem] border border-l-0 border-gray-300 rounded-r-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                  </div>
                </div>

                {/* NET */}

                <div className="w-[9rem] rounded-lg p-1 mt-1 bg-white">
                  {/* Label on top */}
                  <span className="text-[0.75rem] font-medium text-gray-700 block mb-2">
                    Net
                  </span>

                  {/* Amount and percentage row */}
                  <div className="flex items-center gap-3">
                    {/* pill amount */}
                    <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[0.75rem] font-medium rounded-md">
                      {`INR ${
                        Number(formData.sellingprice) -
                        Number(formData.costprice)
                      }`}
                    </span>

                    {/* Percentage */}
                    <span className="text-[0.75rem] text-gray-700 font-medium">
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

                <h4 className="text-[0.75rem] font-medium text-gray-700 mb-3">
                  Vendor Payment Summary
                </h4>

                {/* Container */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {[
                    { label: "Vendor Base Price", key: "price" },
                    { label: "Vendor Incentive Received", key: "received" },
                    { label: "Commission Paid", key: "paid" },
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
                            placeholder="Enter Amount"
                            value={
                              item.key === "price"
                                ? vendorBasePrice
                                : item.key === "received"
                                ? vendorIncentiveReceived
                                : commissionPaid
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (item.key === "price") setVendorBasePrice(val);
                              else if (item.key === "received")
                                setVendorIncentiveReceived(val);
                              else setCommissionPaid(val);
                            }}
                            className="w-[12rem] px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] hover:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
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
                        placeholder="Enter Amount"
                        value={String(formData.sellingprice ?? "")}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sellingprice: e.target.value,
                          }))
                        }
                        className="w-[12rem] px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] hover:border-green-400 focus:ring-1 focus:ring-green-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Net */}
                <div className="w-[12rem] rounded-lg p-1 mt-1 bg-white">
                  {/* Label on top */}
                  <span className="text-[0.75rem] font-medium text-gray-700 block mb-2">
                    Net
                  </span>

                  {/* Amount + percentage row */}
                  <div className="flex items-center gap-3">
                    {/* Blue pill amount */}
                    <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[0.75rem] font-medium rounded-md">
                      {`INR ${(
                        (Number(formData.sellingprice) || 0) - derivedCostPrice
                      ).toFixed(2)}`}
                    </span>

                    {/* Percentage */}
                    <span className="text-[0.75rem] text-gray-700 font-medium">
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

          {/* Flight Info */}
          <div className="mb-4 w-[48vw] border border-gray-200 rounded-md p-3 mt-4 ml-0.5 -mx-4">
            <h2 className="text-[0.75rem] font-medium text-gray-700 mb-2">
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
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, PNR: e.target.value }))
                  }
                  placeholder="Enter PNR"
                  className="w-[12rem] px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]
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
            ? "bg-green-100 text-green-700 font-semibold border border-green-700"
            : "bg-transparent text-gray-700"
        }`}
                  >
                    {type}
                  </button>
                )
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

        {/* ================= ID PROOFS ================ */}
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
            className={`w-full border border-gray-200 rounded-md px-2 py-1.5 text-[0.75rem] mt-1 transition-colors hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 ${
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
