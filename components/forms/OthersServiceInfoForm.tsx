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
}

interface ValidationErrors {
  [key: string]: string;
}

interface ExternalFormData {
  formFields: OtherServiceInfoFormData;
}

interface OtherInfoFormProps {
  onSubmit?: (data: OtherServiceInfoFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLDivElement | null>;
  onFormDataUpdate: (data: any) => void;
  onAddDocuments?: (files: File[]) => void;
  externalFormData?: ExternalFormData;
}

const OthersServiceInfoForm: React.FC<OtherInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
  onAddDocuments,
  externalFormData,
}) => {
  // Internal form state
  const [formData, setFormData] = useState<OtherServiceInfoFormData>({
    bookingdate: externalFormData?.formFields?.bookingdate || "",
    traveldate: externalFormData?.formFields?.traveldate || "",
    bookingstatus: externalFormData?.formFields?.bookingstatus || "",
    costprice: externalFormData?.formFields?.costprice || "",
    sellingprice: externalFormData?.formFields?.sellingprice || "",
    confirmationNumber: externalFormData?.formFields?.confirmationNumber || "",
    title: externalFormData?.formFields?.title || "",
    description: externalFormData?.formFields?.description || "",
    documents: "",
    remarks: externalFormData?.formFields?.remarks || "",
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

  const options = [
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
    // { value: "", label: "Booking Status" },
  ];

  const handleBookingStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, bookingstatus: value }));
  };

  // Sync with external form data when it changes
  useEffect(() => {
    if (externalFormData?.formFields) {
      setFormData((prev) => ({
        ...prev,
        ...externalFormData.formFields,
      }));
    }
  }, [externalFormData]);

  // Notify parent of form data changes
  useEffect(() => {
    onFormDataUpdate({ othersinfoform: formData });
  }, [formData, onFormDataUpdate]);

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
    []
  );

  // Enhanced validation function using API validation
  const validateField = useCallback(
    (name: string, value: unknown): string => {
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
    [validationRules]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof OtherServiceInfoFormData]
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
                : "border-gray-200 focus:ring-blue-200"
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
    <>
      <div
        className="space-y-4 p-4 -mt-1"
        ref={formRef as React.RefObject<HTMLDivElement>}
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

          <div className="mb-4 w-[48vw] border border-gray-200 rounded-lg p-3">
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
                      className="w-[10rem] px-2 py-1.5 text-[0.75rem] border border-l-0 border-gray-300 rounded-r-md focus:outline-none"
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
                      className="w-[10rem] px-2 py-1.5 text-[0.75rem] border border-l-0 border-gray-300 rounded-r-md focus:outline-none"
                    />
                  </div>
                </div>

                <div className="w-[9rem] rounded-lg p-1 mt-1 bg-white">
                  {/* Label on top */}
                  <span className="text-[0.75rem] font-medium text-gray-700 block mb-2">
                    Net
                  </span>

                  {/* Amount + percentage row */}
                  <div className="flex items-center gap-3">
                    {/* Blue pill amount */}
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
                <h4 className="text-[0.75rem] font-medium text-gray-700 mb-3">
                  Vendor Payment Summary
                </h4>
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
                          <div className="px-3 py-2 text-blue-600 font-semibold text-[0.9rem]">{`₹ ${derivedCostPrice.toFixed(
                            2
                          )}`}</div>
                        )}
                        {item.key !== "cost" && (
                          <input
                            type="text"
                            placeholder="Enter notes here..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <h4 className="text-[0.8rem] font-semibold text-gray-700">
                  Customer Revenue Summary
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-12">
                    <div className="col-span-4 flex items-center justify-center bg-[#F8F8F8] text-[0.8rem] text-gray-700 font-medium py-5">
                      Selling Price
                    </div>
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
                        className="w-[12rem] px-3 py-2 border border-gray-300 rounded-lg text-[0.75rem] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="w-[12rem] rounded-lg p-1 mt-1 bg-white">
                  <span className="text-[0.75rem] font-medium text-gray-700 block mb-2">
                    Net
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-500 text-[0.75rem] font-medium rounded-md">
                      {`INR ${(
                        (Number(formData.sellingprice) || 0) - derivedCostPrice
                      ).toFixed(2)}`}
                    </span>
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

          {/* ================= Others INFO ================ */}
          <div className="w-[48vw] border border-gray-200 rounded-[12px] p-3 mt-4">
            <h1 className="text-[0.85rem] font-medium text-gray-800 mb-2">
              Others Info
            </h1>

            <hr className="mt-1 mb-3 border-t border-gray-200" />

            {/* Confirmation number + Title (stacked) */}
            <div className="flex flex-col gap-3 w-full mb-4">
              {/* Confirmation number */}
              <div className="flex flex-col w-full">
                <label className="text-[0.75rem] font-medium text-gray-700 mb-1">
                  Confirmation number
                </label>
                <input
                  type="text"
                  name="confirmationNumber"
                  value={formData.confirmationNumber}
                  onChange={handleChange}
                  placeholder="Abc12345"
                  className="w-[30%] px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Title */}
              <div className="flex flex-col w-full">
                <label className="text-[0.75rem] font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Title …"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description */}

            <StyledDescription />
          </div>
        </div>

        {/* ID PROOFS */}
        <div className=" w-[98%] ml-2 border border-gray-200 rounded-[12px] p-3">
          <h2 className="text-[0.75rem] font-medium mb-2">Documents</h2>
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
                                                                                       border-[#126ACB] rounded-md text-[0.75rem] hover:bg-gray-200"
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
                <span className="text-blue-700 border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[0.75rem] truncate flex items-center gap-2">
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

export default React.memo(OthersServiceInfoForm);
