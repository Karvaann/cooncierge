"use client";

import React, { useState, useCallback, useMemo } from "react";
import { validateTravellerForm } from "@/services/bookingApi";
import SideSheet from "@/components/SideSheet";
import { useBooking } from "@/context/BookingContext";
// Type definitions
interface TravellerFormData {
  firstname: string;
  lastname: string;
  nickname: string;
  contactnumber: number | string;
  emailId: string;
  dateofbirth: number | string;
  remarks: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface AddNewTravellerFormProps {
  onSubmit?: (data: TravellerFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
}

const AddNewTravellerForm: React.FC<AddNewTravellerFormProps> = ({
  onSubmit,
  isSubmitting = false,
  showValidation = true,
  formRef,
}) => {
  // Internal form state
  const [formData, setFormData] = useState<TravellerFormData>({
    firstname: "",
    lastname: "",
    nickname: "",
    contactnumber: "",
    emailId: "",
    dateofbirth: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const { isAddTravellerOpen, closeAddTraveller } = useBooking();

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
      // Prepare an empty traveller object
      const emptyTraveller = {
        firstname: "",
        lastname: "",
        nickname: "",
        contactnumber: "",
        emailId: "",
        dateofbirth: "",
        remarks: "",
      };

      // Insert the current field value into the object
      const testData: TravellerFormData = {
        ...emptyTraveller,
        [name]: value,
      };

      // Run API-level validation
      const apiErrors = validateTravellerForm(testData);
      if (apiErrors[name]) return apiErrors[name];

      // Apply basic validation rules
      const rule = validationRules[name as keyof typeof validationRules];
      if (!rule) return "";

      // Required rule
      if (
        rule.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        return rule.message;
      }

      // Min length rule
      if (
        rule.minLength &&
        typeof value === "string" &&
        value.trim().length < rule.minLength
      ) {
        return rule.message;
      }

      // Pattern rule
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
        formData[fieldName as keyof TravellerFormData]
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
    if (errors[name as keyof TravellerFormData]) {
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
    name: keyof TravellerFormData;
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
      isOpen={isAddTravellerOpen}
      onClose={closeAddTraveller}
      title={"Add Traveller"}
      width="xl"
    >
      <div
        className="space-y-6 p-4"
        ref={formRef as any}
        onSubmit={(e) => e.preventDefault()}
      >
        {/* ================= BASIC DETAILS ================ */}
        <div className="border border-gray-200 rounded-[12px] p-3">
          <h2 className="text-[0.75rem] font-medium mb-2">Basic Details</h2>
          <hr className="mt-1 mb-2 border-t border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div className="flex flex-col gap-1">
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

            <div className="flex flex-col gap-1">
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

            <div className="flex flex-col gap-1">
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
          </div>

          {/* Second row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <InputField
                type="text"
                name="contactnumber"
                placeholder="Enter Contact Number"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>

            <div className="flex flex-col gap-1">
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

            <div className="flex flex-col gap-1">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <InputField
                type="date"
                name="dateofbirth"
                placeholder="DD-MM-YYYY"
                required
                className="w-full text-[0.75rem] py-2"
              />
            </div>
          </div>
        </div>

        {/* ================= REMARKS ================ */}
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

        {/* <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#114958] text-white text-[0.75rem] rounded-lg hover:bg-[#0d3a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div> */}
      </div>
    </SideSheet>
  );
};

export default React.memo(AddNewTravellerForm);
