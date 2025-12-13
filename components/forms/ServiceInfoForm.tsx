"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";

// Type definitions
interface Service {
  id: string;
  title: string;
  category: "travel" | "accommodation" | "transport" | "activity";
}

interface ServiceInfoFormData {
  serviceType: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  budget: number;
  preferences: string;
  specialRequests: string;
  priority: "low" | "medium" | "high";
  flexibility: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ServiceInfoFormProps {
  selectedService?: Service | null;
  formData?: Partial<ServiceInfoFormData>;
  onFormDataUpdate?: (data: Partial<ServiceInfoFormData>) => void;
  onSubmit?: (data: ServiceInfoFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
}

const ServiceInfoForm: React.FC<ServiceInfoFormProps> = ({
  selectedService,
  formData: externalFormData = {},
  onFormDataUpdate,
  onSubmit,
  isSubmitting = false,
  showValidation = true,
}) => {
  // Internal form state
  const [formData, setFormData] = useState<ServiceInfoFormData>({
    serviceType: selectedService?.title || "",
    destination: "",
    departureDate: "",
    returnDate: "",
    budget: 0,
    preferences: "",
    specialRequests: "",
    priority: "medium",
    flexibility: false,
    ...externalFormData,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  interface FieldRule {
    required?: boolean;
    minLength?: number;
    min?: number;
    message: string;
  }

  // Validation rules based on service type
  const validationRules = useMemo(() => {
    const baseRules: Record<string, FieldRule> = {
      destination: {
        required: true,
        minLength: 2,
        message: "Destination is required",
      },
      departureDate: {
        required: true,
        message: "Departure date is required",
      },
      budget: {
        required: true,
        min: 1,
        message: "Budget must be greater than 0",
      },
    };

    // Add service-specific rules
    if (selectedService?.category === "travel") {
      return {
        ...baseRules,
        returnDate: {
          required: true,
          message: "Return date is required for travel services",
        },
      };
    }

    return baseRules;
  }, [selectedService]);

  // Validation function
  const validateField = useCallback(
    (name: string, value: any): string => {
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
        value.length < rule.minLength
      ) {
        return rule.message;
      }

      if (rule.min && typeof value === "number" && value < rule.min) {
        return rule.message;
      }

      // Date validation
      if (name === "returnDate" && formData.departureDate && value) {
        const departureDate = new Date(formData.departureDate);
        const returnDate = new Date(value);
        if (returnDate <= departureDate) {
          return "Return date must be after departure date";
        }
      }

      return "";
    },
    [validationRules, formData.departureDate]
  );

  // Handle input changes
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;
      let processedValue: any = value;

      if (type === "number") {
        processedValue = parseFloat(value) || 0;
      } else if (type === "checkbox") {
        processedValue = (e.target as HTMLInputElement).checked;
      }

      setFormData((prev) => {
        const newData = { ...prev, [name]: processedValue };
        onFormDataUpdate?.(newData);
        return newData;
      });

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      // Mark field as touched
      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [errors, onFormDataUpdate]
  );

  // Handle blur for validation
  const handleBlur = useCallback(
    (
      e: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;

      if (showValidation) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }

      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [validateField, showValidation]
  );

  // Sync with external form data
  useEffect(() => {
    if (externalFormData && Object.keys(externalFormData).length > 0) {
      setFormData((prev) => ({ ...prev, ...externalFormData }));
    }
  }, [externalFormData]);

  // Update service type when selected service changes
  useEffect(() => {
    if (selectedService) {
      setFormData((prev) => ({ ...prev, serviceType: selectedService.title }));
    }
  }, [selectedService]);

  // Input field component with error handling
  const InputField: React.FC<{
    name: keyof ServiceInfoFormData;
    type?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    min?: number;
    step?: string;
  }> = ({
    name,
    type = "text",
    placeholder,
    required,
    className = "",
    min,
    step,
  }) => (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={(formData[name] as string | number | undefined) ?? ""}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        disabled={isSubmitting}
        className={`
          w-full border rounded-md px-3 py-2 text-sm transition-colors
          ${
            errors[name] && touched[name]
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-200 focus:ring-blue-200"
          }
          ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      />
      {errors[name] && touched[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  if (!selectedService) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Please select a service first to configure service details.</p>
      </div>
    );
  }

  return (
    <form className="space-y-6 p-6">
      {/* Service Type (Read-only) */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selected Service
        </label>
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-[#114958]">
            {selectedService.title}
          </span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {selectedService.category}
          </span>
        </div>
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destination <span className="text-red-500">*</span>
        </label>
        <InputField
          name="destination"
          placeholder="Enter destination"
          required
        />
      </div>

      {/* Date fields based on service type */}
      {selectedService.category === "travel" ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date <span className="text-red-500">*</span>
            </label>
            <InputField name="departureDate" type="date" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Return Date <span className="text-red-500">*</span>
            </label>
            <InputField name="returnDate" type="date" required />
          </div>
        </div>
      ) : selectedService.category === "accommodation" ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date <span className="text-red-500">*</span>
            </label>
            <InputField name="departureDate" type="date" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check-out Date
            </label>
            <InputField name="returnDate" type="date" />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Date <span className="text-red-500">*</span>
          </label>
          <InputField name="departureDate" type="date" required />
        </div>
      )}

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget (₹) <span className="text-red-500">*</span>
        </label>
        <InputField
          name="budget"
          type="number"
          placeholder="Enter budget amount"
          min={1}
          step="0.01"
          required
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority Level
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isSubmitting}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring focus:ring-blue-200"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferences
        </label>
        <textarea
          name="preferences"
          rows={3}
          value={formData.preferences}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your preferences (e.g., window seat, vegetarian meals, etc.)"
          disabled={isSubmitting}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring focus:ring-blue-200"
        />
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests
        </label>
        <textarea
          name="specialRequests"
          rows={3}
          value={formData.specialRequests}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Any special requests or requirements"
          disabled={isSubmitting}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring focus:ring-blue-200"
        />
      </div>

      {/* Flexibility */}
      <div className="flex items-center">
        <input
          type="checkbox"
          name="flexibility"
          checked={formData.flexibility}
          onChange={handleChange}
          disabled={isSubmitting}
          className="h-4 w-4 text-[#114958] focus:ring-[#114958] border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-700">
          I am flexible with dates and can adjust if needed
        </label>
      </div>

      {/* Submit Button (if standalone) */}
      {onSubmit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#114958] text-white rounded-lg hover:bg-[#0d3a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Service Info"}
          </button>
        </div>
      )}
    </form>
  );
};

export default React.memo(ServiceInfoForm);
