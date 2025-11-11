/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { validateVendorForm } from "@/services/bookingApi";
import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import SideSheet from "@/components/SideSheet";
import { useBooking } from "@/context/BookingContext";
import { FiTrash2 } from "react-icons/fi";
import { useRef } from "react";
// Type definitions
interface VendorFormData {
  companyname: string;
  companyemail: string;
  contactnumber: number | "";
  gstin: number | "";
  firstname: string;
  lastname: string;
  nickname: string;
  emailId: string;
  dateofbirth: number | "";
  document: number | "";
  billingaddress: string | number;
  remarks: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface AddNewVendorFormProps {
  onSubmit?: (data: VendorFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
}

const AddNewVendorForm: React.FC<AddNewVendorFormProps> = ({
  onSubmit,
  isSubmitting = false,
  showValidation = true,
}) => {
  // Internal form state
  const [formData, setFormData] = useState<VendorFormData>({
    firstname: "",
    lastname: "",
    nickname: "",
    contactnumber: "",
    emailId: "",
    dateofbirth: "",
    companyemail: "",
    document: "",
    gstin: "",
    companyname: "",
    billingaddress: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const { isAddVendorOpen, closeAddVendor } = useBooking();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filesAdded, setFilesAdded] = useState({
    document: false,
  });

  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");

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
      companyemail: {
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
      const apiErrors = validateVendorForm({
        [name]: value,
        firstname: "",
        lastname: "",
        nickname: "",
        contactnumber: 0,
        emailId: "",
        dateofbirth: 0,
        companyemail: "",
        document: "",
        gstin: 0,
        companyname: "",
        billingaddress: "",
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
        formData[fieldName as keyof VendorFormData]
      );
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField, validationRules]);

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const processedValue =
        type === "number" && value !== "" ? Number(value) : value;

      setFormData((prev) => {
        const newData = { ...prev, [name]: processedValue };
        return newData;
      });

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      // Mark field as touched
      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [errors]
  );

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
    name: keyof VendorFormData;
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
    const isValidatingField = name === "firstname" && isValidating; // Example for one field, can be extended
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
    <SideSheet
      isOpen={isAddVendorOpen}
      onClose={closeAddVendor}
      title={"Add Vendor"}
      width="xl"
    >
      <form className="space-y-6 p-4" onSubmit={handleSubmit}>
        {/* ================= BASIC DETAILS ================ */}
        <div className="border border-gray-200 rounded-[12px] p-3">
          <h2 className="text-[0.75rem] font-medium mb-2">Basic Details</h2>
          <hr className="mt-1 mb-2 border-t border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {/* Company Name */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Company Name <span className="text-red-500">*</span>
              </label>
              <InputField
                name="companyname"
                placeholder="Enter Company Name"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>

            {/* Company Email */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Company Email ID <span className="text-red-500">*</span>
              </label>
              <InputField
                name="companyemail"
                placeholder="Enter Email ID"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Number */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <InputField
                name="contactnumber"
                placeholder="Enter Contact Number"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>

            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                GSTIN
              </label>

              <div className="relative">
                <InputField
                  name="gstin"
                  placeholder="Please Provide Your GST No."
                  className="w-full text-[0.75rem] py-2 pr-20"
                />

                <button
                  type="button"
                  className="
              absolute right-1 top-1/2 -translate-y-1/2
              px-3 py-1.5 bg-blue-700 text-white rounded-md
              text-[0.75rem] hover:bg-blue-800
            "
                >
                  Fetch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= POC DETAILS ================ */}
        <div className="border border-gray-200 rounded-[12px] p-3">
          <h2 className="text-[0.75rem] font-medium mb-2">
            POC Details (Optional)
          </h2>
          <hr className="mt-1 mb-2 border-t border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <InputField
                name="firstname"
                placeholder="Enter First Name"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <InputField
                name="lastname"
                placeholder="Enter Last Name"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            {/* Nickname */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Nickname/Alias <span className="text-red-500">*</span>
              </label>
              <InputField
                name="nickname"
                placeholder="Enter Nickname/Alias"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>

            {/* Contact Number */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <InputField
                name="contactnumber"
                placeholder="Enter Contact Number"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email ID */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Email ID <span className="text-red-500">*</span>
              </label>
              <InputField
                name="emailId"
                placeholder="Enter Email ID"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>

            {/* DOB */}
            <div className="flex flex-col gap-1 w-[22rem]">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <InputField
                name="dateofbirth"
                placeholder="DD-MM-YYYY"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="border border-gray-200 rounded-[12px] p-3">
          <h2 className="text-[0.75rem] font-medium mb-2">Documents</h2>
          <hr className="mt-1 mb-2 border-t border-gray-200" />

          <div className="flex flex-col gap-4">
            <div className="flex gap-5">
              {/* Documents */}
              <div className="flex flex-col gap-1">
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
                    className="px-3 py-1 bg-white text-[#126ACB] border border-[#126ACB]  text-[0.75rem] mt-2 rounded-md hover:bg-gray-200 flex items-center gap-1"
                  >
                    <MdOutlineFileUpload size={18} /> Attach Files
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

                  <div className="text-red-600 text-[0.65rem]">
                    Note: Maximum of 3 files can be uploaded
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="border border-gray-200 rounded-[12px] p-3">
          <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
            Billing Address
          </label>
          <hr className="mt-1 mb-2 border-t border-gray-200" />

          <button
            type="button"
            className="px-3 py-2 bg-blue-700 text-white text-[0.75rem] rounded-md hover:bg-blue-800 flex items-center gap-1"
          >
            <CiCirclePlus size={14} /> Billing Address
          </button>
        </div>

        {/* Opening Balance Section */}

        <div className="border border-gray-200 rounded-[12px] p-3">
          <h2 className="text-[0.75rem] font-medium mb-2">Opening Balance</h2>
          <hr className="mt-1 mb-4 border-t border-gray-200" />

          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="balanceType"
                value="debit"
                checked={balanceType === "debit"}
                onChange={() => setBalanceType("debit")}
                className="w-3 h-3 text-red-600"
              />
              <span className="text-[0.75rem] font-medium text-gray-700">
                Debit
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="balanceType"
                value="credit"
                checked={balanceType === "credit"}
                onChange={() => setBalanceType("credit")}
                className="w-3 h-3 text-red-600"
              />
              <span className="text-[0.75rem] font-medium text-gray-700">
                Credit
              </span>
            </label>
          </div>

          <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
              <span className="text-gray-500 mr-2 text-[0.75rem]">₹</span>
              <input
                type="text"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder={
                  balanceType === "debit"
                    ? "Enter Debit Amount"
                    : "Enter Credit Amount"
                }
                className="flex-1 outline-none text-gray-700 w-full px-0 text-[0.75rem]"
              />
            </div>
            <div className="absolute right-3 top-2 text-sm font-medium">
              {balanceType === "debit" ? (
                <span className="text-red-500 text-[0.75rem]">
                  Customer pays you ₹{balanceAmount || ""}
                </span>
              ) : (
                <span className="text-green-500 text-[0.75rem]">
                  You pay the customer ₹{balanceAmount || ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="border border-gray-200 rounded-[12px] p-3">
          <label className="block text-[0.75rem] font-medium text-gray-700">
            Remarks
          </label>
          <hr className="mt-1 mb-2 border-t border-gray-200" />

          <textarea
            name="remarks"
            rows={5}
            value={formData.remarks}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter Your Remarks Here"
            disabled={isSubmitting}
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem] mt-2 transition-colors focus:ring focus:ring-blue-200 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#114958] text-white text-[0.75rem] rounded-lg hover:bg-[#0d3a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </SideSheet>
  );
};

export default React.memo(AddNewVendorForm);
