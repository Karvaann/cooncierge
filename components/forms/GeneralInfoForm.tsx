"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { LuEye } from "react-icons/lu";
import { GoPlusCircle } from "react-icons/go";
import { BsPlusSquareFill } from "react-icons/bs";
import { CiSearch } from "react-icons/ci";
import { FiMinus } from "react-icons/fi";
import { GoPlus } from "react-icons/go";
import { validateGeneralInfo } from "@/services/bookingApi";
import { useBooking } from "@/context/BookingContext";
import Fuse from "fuse.js";
import { getCustomers } from "@/services/customerApi";
import { getVendors } from "@/services/vendorApi";
import { getUsers } from "@/services/userApi";

// Type definitions
interface GeneralInfoFormData {
  customer: string;
  vendor: string;
  adults: number;
  children: number;
  infants: number;
  adultTravellers: string[];
  infantTravellers: string[];
  bookingOwner: string;
  remarks: string;
}

// InputField component moved OUTSIDE of GeneralInfoForm to prevent re-creation on each render
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
          ${
            disabled || isValidating
              ? "opacity-50 cursor-not-allowed"
              : ""
          }
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

interface ValidationErrors {
  [key: string]: string;
}

interface GeneralInfoFormProps {
  formData?: Partial<GeneralInfoFormData>;
  onFormDataUpdate?: (data: Partial<GeneralInfoFormData>) => void;
  onSubmit?: (data: GeneralInfoFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
}

const GeneralInfoForm: React.FC<GeneralInfoFormProps> = ({
  formData: externalFormData = {},
  onFormDataUpdate,
  onSubmit,
  isSubmitting = false,
  showValidation = true,
}) => {
  // Internal form state
  const [formData, setFormData] = useState<GeneralInfoFormData>({
    customer: "",
    vendor: "",
    adults: 1,
    children: 0,
    infants: 1,
    adultTravellers: [""], // Adult 1 (Lead Pax)
    infantTravellers: [""],
    bookingOwner: "",
    remarks: "",
    ...externalFormData,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validatingCustomer, setValidatingCustomer] = useState<boolean>(false);
  const [validatingVendor, setValidatingVendor] = useState<boolean>(false);
  const { openAddCustomer, openAddVendor, openAddTraveller } = useBooking();
  const [customerList, setCustomerList] = useState<string[]>([""]);

  // Search data states
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allVendors, setAllVendors] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);

  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [vendorResults, setVendorResults] = useState<any[]>([]);
  const [teamResults, setTeamResults] = useState<any[]>([]);

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  // Fetch all customers, vendors, teams on mount
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [cRes, vRes, tRes] = await Promise.all([
          getCustomers(),
          getVendors(),
          getUsers(),
        ]);

        setAllCustomers(cRes || []);
        setAllVendors(vRes || []);
        setAllTeams(tRes || []);
      } catch (err) {
        console.error("Failed loading lists", err);
      }
    };

    fetchLists();
  }, []);

  // Fuzzy search helper
  const runFuzzySearch = (list: any[], term: string, keys: string[]) => {
    if (!term.trim()) return [];

    const fuse = new Fuse(list, {
      threshold: 0.3,
      keys: keys,
    });

    return fuse.search(term).map((r) => r.item);
  };

  // when adults change
  useEffect(() => {
    setFormData((prev) => {
      let adults = [...prev.adultTravellers];

      // always at least 1 adult input
      if (adults.length === 0) adults.push("");

      while (adults.length < prev.adults) adults.push("");
      while (adults.length > prev.adults && adults.length > 1) adults.pop();

      return { ...prev, adultTravellers: adults };
    });
  }, [formData.adults]);

  useEffect(() => {
    setFormData((prev) => {
      let infants = [...prev.infantTravellers];

      // always at least one infant input
      if (infants.length === 0) infants.push("");

      while (infants.length < prev.infants) infants.push("");
      while (infants.length > prev.infants && infants.length > 1) infants.pop();

      return { ...prev, infantTravellers: infants };
    });
  }, [formData.infants]);

  const addCustomerField = () => {
    setCustomerList([...customerList, ""]);
  };

  const removeCustomerField = (index: number) => {
    setCustomerList(customerList.filter((_, i) => i !== index));
  };

  // update customer field from customer array
  const updateCustomerField = (index: number, value: string) => {
    const updated = [...customerList];
    updated[index] = value;
    setCustomerList(updated);
    if (index === 0) {
      setFormData({ ...formData, customer: value });
    }
  };

  // update traveller field from traveller array
  const updateTraveller = (
    type: "adultTravellers" | "infantTravellers",
    index: number,
    value: string
  ) => {
    const updated = [...formData[type]];
    updated[index] = value;

    setFormData((prev) => ({ ...prev, [type]: updated }));
  };

  const clearField = (fieldName: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setTouched((prev) => ({ ...prev, [fieldName]: false }));
  };

  const getFieldValue = (fieldName: string, overrideValue?: string) => {
    if (overrideValue !== undefined) return overrideValue;
    return formData[fieldName as keyof GeneralInfoFormData] ?? "";
  };

  // clearInput() helper
  const clearInput = (
    fieldName: string,
    overrideHandler?: (value: string) => void
  ) => {
    if (overrideHandler) {
      overrideHandler("");
    } else {
      clearField(fieldName);
    }
  };

  const RightSideIcons: React.FC<{
    fieldName: string;
    value?: string | undefined; // override value
    overrideSetter?: (val: string) => void;
    onClickPlus?: () => void; // for add customer/vendor modal
  }> = ({ fieldName, value, overrideSetter, onClickPlus }) => {
    const actualValue = getFieldValue(fieldName, value);
    const valueString = String(actualValue ?? "");
    const isEmpty = valueString.trim() === "";

    return (
      <div className="flex items-center gap-2 ml-auto">
        {isEmpty && (
          <button
            type="button"
            onClick={onClickPlus}
            className="w-9 h-9 flex items-center justify-center rounded-md transition-colors"
          >
            <BsPlusSquareFill size={22} className="" />
          </button>
        )}

        {/* EYE and MINUS when value exists */}
        {!isEmpty && (
          <>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <LuEye size={20} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => clearInput(fieldName, overrideSetter)}
              className="w-6.5 h-6.5 flex items-center justify-center bg-[#414141] rounded-md cursor-pointer transition-colors"
            >
              <FiMinus size={16} className="text-white" />
            </button>
          </>
        )}
      </div>
    );
  };

  // Get validation functions from booking context
  const { validateCustomer, validateVendor } = useBooking();

  // Validation rules
  const validationRules = useMemo(
    () => ({
      customer: {
        required: true,
        minLength: 2,
        message: "Customer name is required (minimum 2 characters)",
      },
      vendor: {
        required: true,
        minLength: 2,
        message: "Vendor name is required (minimum 2 characters)",
      },
      adults: {
        required: true,
        minLength: 1,
        message: "At least 1 adult is required",
      },
      traveller1: {
        required: true,
        minLength: 2,
        message: "Lead passenger name is required",
      },
      bookingOwner: {
        required: true,
        minLength: 2,
        message: "Booking owner is required",
      },
    }),
    []
  );

  // Enhanced validation function using API validation
  const validateField = useCallback(
    (name: string, value: any): string => {
      // Use API validation for comprehensive checks
      if (name === "customer" || name === "vendor") {
        const apiErrors = validateGeneralInfo({ [name]: value });
        return apiErrors[name] || "";
      }

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

      if (
        rule.minLength &&
        typeof value === "number" &&
        value < rule.minLength
      ) {
        return rule.message;
      }

      return "";
    },
    [validationRules]
  );

  // Customer validation handler
  const handleCustomerValidation = useCallback(
    async (customerId: string) => {
      if (!customerId.trim()) return;

      setValidatingCustomer(true);
      try {
        const isValid = await validateCustomer(customerId);
        if (!isValid) {
          setErrors((prev) => ({
            ...prev,
            customer: "Customer not found or invalid",
          }));
        } else {
          setErrors((prev) => ({ ...prev, customer: "" }));
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          customer: "Error validating customer",
        }));
      } finally {
        setValidatingCustomer(false);
      }
    },
    [validateCustomer]
  );

  // Vendor validation handler
  const handleVendorValidation = useCallback(
    async (vendorId: string) => {
      if (!vendorId.trim()) return;

      setValidatingVendor(true);
      try {
        const isValid = await validateVendor(vendorId);
        if (!isValid) {
          setErrors((prev) => ({
            ...prev,
            vendor: "Vendor not found or invalid",
          }));
        } else {
          setErrors((prev) => ({ ...prev, vendor: "" }));
        }
      } catch (error) {
        setErrors((prev) => ({ ...prev, vendor: "Error validating vendor" }));
      } finally {
        setValidatingVendor(false);
      }
    },
    [validateVendor]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof GeneralInfoFormData]
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
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const processedValue = type === "number" ? value : value;

    // build next state from current formData
    const next = { ...formData, [name]: processedValue };
    setFormData(next);

    onFormDataUpdate?.(next);

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Enhanced blur handler with API validation
  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (showValidation) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));

        // Trigger API validation for customer and vendor
        if (name === "customer" && value.trim()) {
          await handleCustomerValidation(value.trim());
        } else if (name === "vendor" && value.trim()) {
          await handleVendorValidation(value.trim());
        }
      }

      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [
      validateField,
      showValidation,
      handleCustomerValidation,
      handleVendorValidation,
    ]
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

  // Sync with external form data
  useEffect(() => {
    if (externalFormData && Object.keys(externalFormData).length > 0) {
      setFormData((prev) => ({ ...prev, ...externalFormData }));
    }
  }, [externalFormData]);

  // Memoized traveller count
  const totalTravellers = useMemo(
    () => formData.adults + formData.children + formData.infants,
    [formData.adults, formData.children, formData.infants]
  );

  // Helper to get input field props
  const getInputProps = (
    name: keyof GeneralInfoFormData,
    options?: {
      value?: string | number;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      skipValidation?: boolean;
    }
  ) => {
    const isValidating =
      (name === "customer" && validatingCustomer) ||
      (name === "vendor" && validatingVendor);

    const fieldValue = options?.value !== undefined ? options.value : formData[name];
    const hasError = !!(errors[name] && touched[name]);
    const hasValue = formData[name] && String(formData[name]).trim();
    const isValid = !options?.skipValidation && !!hasValue && !hasError && !isValidating;

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
    <form className="space-y-4 p-4" onSubmit={handleSubmit}>
      {/* Customer Section */}
      <div className="border border-gray-200 rounded-[12px] p-3">
        <h2 className="text-[0.75rem] font-medium mb-2">Billed To</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />

        {customerList.map((customer, index) => (
          <div key={index} className="mb-4">
            <div className="flex items-center gap-2 mt-3">
              <label className="text-[0.75rem] font-medium text-gray-700">
                <span className="text-red-500">*</span> Customer {index + 1}
              </label>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeCustomerField(index)}
                  className="w-4 h-4 mb-1 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <FiMinus size={14} className="text-black" />
                </button>
              )}
            </div>

            <div className="flex items-center mt-1 w-full">
              <div className="w-[30rem]">
                <InputField
                  name="customer"
                  placeholder="Search by Customer Name/ID"
                  required
                  className="w-full text-[0.75rem] py-2"
                  type="text"
                  {...getInputProps("customer", {
                    value: customerList[index] || "",
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      updateCustomerField(index, value);

                      const results = runFuzzySearch(allCustomers, value, [
                        "name",
                        "email",
                        "phone",
                      ]);
                      setCustomerResults(results);
                      setShowCustomerDropdown(true);
                    },
                  })}
                />

                {/* {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute bg-white border rounded-md w-[30rem] max-h-60 mt-1 overflow-y-auto shadow-md z-50">
                    {customerResults.map((cust: any) => (
                      <div
                        key={cust._id}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          updateCustomerField(index, cust.name);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <p className="font-medium">{cust.name}</p>
                        <p className="text-xs text-gray-500">{cust.email}</p>
                      </div>
                    ))}
                  </div>
                )} */}
              </div>

              <RightSideIcons
                fieldName="customer"
                value={customerList[index]}
                overrideSetter={(val: string) =>
                  updateCustomerField(index, val)
                }
                onClickPlus={openAddCustomer}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addCustomerField}
          className="-mt-1 flex gap-1 text-[#818181] text-[0.65rem] hover:text-gray-800 transition-colors"
        >
          <GoPlusCircle size={17} />
          <p className="mt-0.5"> Add Another Customer </p>
        </button>
      </div>

      {/* Vendor Section */}
      <div className="border border-gray-200 rounded-[12px] p-3">
        <h2 className="text-[0.75rem]  font-medium mb-2">Vendors</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />

        <label className="block text-[0.75rem] mt-3 font-medium text-gray-700 mb-1">
          <span className="text-red-500">*</span> Vendor
        </label>

        <div className="flex items-center gap-2">
          <div className="w-[30rem]">
            <InputField
              name="vendor"
              placeholder="Search by Vendor Name/ID"
              required
              className="w-full text-[0.75rem]  py-2"
              {...getInputProps("vendor", {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  handleChange(e);
                  const results = runFuzzySearch(allVendors, e.target.value, [
                    "name",
                    "email",
                  ]);
                  setVendorResults(results);
                  setShowVendorDropdown(true);
                },
              })}
            />

            {/* {showVendorDropdown && vendorResults.length > 0 && (
              <div className="absolute bg-white border rounded-md w-[30rem] mt-1 max-h-60 overflow-y-auto shadow-md z-50">
                {vendorResults.map((v: any) => (
                  <div
                    key={v._id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, vendor: v.name }));
                      setShowVendorDropdown(false);
                    }}
                  >
                    <p className="font-medium">{v.name}</p>
                    <p className="text-xs text-gray-500">{v.email}</p>
                  </div>
                ))}
              </div>
            )} */}
          </div>
          <RightSideIcons fieldName="vendor" onClickPlus={openAddVendor} />
        </div>
      </div>

      {/* Travellers Counter Section */}
      <div className="border border-gray-200 rounded-xl p-3">
        <h2 className="text-[0.75rem]  font-medium mb-1">Travellers</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />

        <div className="flex gap-6 mb-4 mt-3 ">
          <div className="flex flex-col items-center">
            <label className="block text-xs text-black mb-1">Adults</label>
            <div className="flex items-center border border-black rounded-lg px-2 py-1">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    adults: Math.max(1, formData.adults - 1),
                  })
                }
                className="px-1 text-lg font-semibold"
              >
                <FiMinus size={12} />
              </button>
              <span className="px-2 text-[0.75rem] ">{formData.adults}</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, adults: formData.adults + 1 })
                }
                className="px-1 text-lg font-semibold"
              >
                <GoPlus size={12} />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <label className="block text-xs text-black mb-1">Children</label>
            <div className="flex items-center border border-black rounded-lg px-1 py-1">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    infants: Math.max(0, formData.infants - 1),
                  })
                }
                className="px-1 text-[0.75rem] "
              >
                <FiMinus size={12} />
              </button>
              <span className="px-2 text-[0.75rem] ">{formData.infants}</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, infants: formData.infants + 1 })
                }
                className="px-2 text-[0.75rem] "
              >
                <GoPlus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Traveller Details */}
        <div className="mt-4 space-y-4">
          <label className="block text-[0.75rem] mt-3 font-medium text-gray-700 mb-1">
            <span className="text-red-500">*</span> Adult
          </label>

          {formData.adultTravellers.map((trav, index) => (
            <div key={index} className="flex items-center gap-2 my-2">
              <div className="w-[30rem]">
                <InputField
                  name="adultTravellers"
                  placeholder={`Adult ${index + 1}`}
                  required={index === 0}
                  {...getInputProps("adultTravellers", {
                    value: trav,
                    onChange: (e) =>
                      updateTraveller("adultTravellers", index, e.target.value),
                    skipValidation: true,
                  })}
                />
              </div>

              <RightSideIcons
                fieldName="adultTravellers"
                value={trav}
                overrideSetter={(val) =>
                  updateTraveller("adultTravellers", index, val)
                }
                onClickPlus={openAddTraveller}
              />
            </div>
          ))}

          <label className="block text-[0.75rem] mt-3 font-medium text-gray-700 mb-1">
            <span className="text-red-500">*</span> Children
          </label>

          {formData.infantTravellers.map((trav, index) => (
            <div key={index} className="flex items-center gap-2 my-2">
              <div className="w-[30rem]">
                <InputField
                  name="infantTravellers"
                  placeholder={`Child ${index + 1}`}
                  required={index === 0}
                  {...getInputProps("infantTravellers", {
                    value: trav,
                    onChange: (e) =>
                      updateTraveller("infantTravellers", index, e.target.value),
                    skipValidation: true,
                  })}
                />
              </div>

              <RightSideIcons
                fieldName="infantTravellers"
                value={trav}
                overrideSetter={(val) =>
                  updateTraveller("infantTravellers", index, val)
                }
                onClickPlus={openAddTraveller}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Booking Owner */}
      <div className="border border-gray-200 rounded-xl p-3">
        <h2 className="text-[0.75rem]  font-medium mb-2">Booking Owner</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />
        <label className="block text-[0.75rem]  font-medium text-gray-700 mb-1">
          <span className="text-red-500">*</span> User
        </label>

        <div className="w-[66%]">
          <InputField
            name="bookingOwner"
            placeholder="Search by Name/Username/ID"
            required
            className="mt-1 text-[0.75rem]  py-2"
            {...getInputProps("bookingOwner", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                handleChange(e);
                const results = runFuzzySearch(allTeams, e.target.value, [
                  "name",
                  "email",
                  "username",
                ]);
                setTeamResults(results);
                setShowTeamDropdown(true);
              },
            })}
          />

          {/* {showTeamDropdown && teamResults.length > 0 && (
            <div className="absolute bg-white border rounded-md w-[30rem] mt-1 max-h-60 overflow-y-auto shadow-md z-50">
              {teamResults.map((t: any) => (
                <div
                  key={t._id}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, bookingOwner: t.name }));
                    setShowTeamDropdown(false);
                  }}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.email}</p>
                </div>
              ))}
            </div>
          )} */}
        </div>
      </div>

      {/* Remarks */}
      <div className="border border-gray-200 rounded-xl p-3">
        <label className="block text-[0.75rem]  font-medium text-gray-700">
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
          className={`
            w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem]  mt-2 transition-colors
            focus:ring focus:ring-blue-200
            ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      </div>

      {/* Submit Button (if standalone) */}
      {/* {onSubmit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#114958] text-white text-[0.75rem] rounded-lg hover:bg-[#0d3a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save General Info"}
          </button>
        </div>
      )} */}
    </form>
  );
};

export default React.memo(GeneralInfoForm);
