"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { createVendor, updateVendor } from "@/services/vendorApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { useBooking } from "@/context/BookingContext";
import DropDown from "../DropDown";
import PhoneCodeSelect from "../PhoneCodeSelect";
import SingleCalendar from "../SingleCalendar";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { LuSave } from "react-icons/lu";
import Button from "../Button";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { FaRegFolder } from "react-icons/fa";
import ErrorToast from "../ErrorToast";
import {
  allowOnlyText,
  allowOnlyDigitsWithMax,
  allowTextAndNumbers,
} from "@/utils/inputValidators";
import { validateFullName, validateEmailFormat } from "@/utils/formValidators";
import {
  getPhoneNumberMaxLength,
  splitPhoneWithDialCode,
} from "@/utils/phoneUtils";
import { getStoredCurrencySymbol } from "@/utils/helper";

type VendorData = {
  _id?: string;
  customId?: string;
  contactPerson?: string;
  alias: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  // Separate fields for company vs POC
  companyPhone?: string;
  companyCountryCode?: string;
  companyEmail?: string;
  pocPhone?: string;
  pocCountryCode?: string;
  pocEmail?: string;
  dateOfBirth: string;

  companyName: string;
  address: string;
  openingBalance: string;
  balanceType: "credit" | "debit";
  remarks: string;
  tier?: string;
  documents?: Array<{
    originalName: string;
    fileName: string;
    url: string;
    key: string;
    size: number;
    mimeType: string;
    uploadedAt: string | Date;
  }>;
};

type AddVendorSideSheetProps = {
  data?: VendorData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit" | "view";
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
  vendorCode?: string;
};

const AddVendorSideSheet: React.FC<AddVendorSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
  formRef,
  onSuccess,
  vendorCode: vendorCodeProp,
}) => {
  const { updateGeneralInfo, setLastAddedVendor } = useBooking();
  const readOnly = mode === "view";
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    NonNullable<VendorData["documents"]>
  >([]);

  // Validation helpers / UI state for required fields (company + contact person)
  const companyRef = useRef<HTMLInputElement | null>(null);
  const contactNameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<
    "company" | "contactPerson" | null
  >(null);

  const [vendorCode, setVendorCode] = useState("");

  useEffect(() => {
    if (mode === "create") {
      if (vendorCodeProp) setVendorCode(vendorCodeProp);
    } else {
      setVendorCode(data?.customId || data?._id || "");
    }
  }, [mode, data, vendorCodeProp]);

  // Mounted flag to ensure portal renders client-side only
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showErrorToast = (message: string) => {
    setError(message);
  };

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");

  const [tier, setTier] = useState<string>("");

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyBookings, setHistoryBookings] = useState<
    {
      id: string;
      bookingDate: string;
      travelDate: string;
      status: "Confirmed" | "On Hold" | "In Progress" | "Failed";
      amount: string;
    }[]
  >([]);

  // Handle selecting files
  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);

    // simple enforcement: only add up to remaining slots (max 3)
    const remaining = 3 - attachedFiles.length;
    if (remaining <= 0) return;

    const toAdd = selected.slice(0, remaining);
    setAttachedFiles((prev) => [...prev, ...toAdd]);

    // Reset input so same file can be selected again
    if (fileRef.current) fileRef.current.value = "";
  };

  // Remove a selected file
  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const [formData, setFormData] = useState<VendorData>({
    contactPerson: "",
    alias: "",
    // company-level
    companyEmail: "",
    companyPhone: "",
    companyCountryCode: "+91",
    // poc-level
    pocEmail: "",
    pocPhone: "",
    pocCountryCode: "+91",
    dateOfBirth: "",

    companyName: "",
    address: "",
    openingBalance: "",
    balanceType: "debit",
    remarks: "",
    tier: "",
  });

  const companyPhoneMaxLength = getPhoneNumberMaxLength(
    formData.companyCountryCode || "+91",
  );
  const pocPhoneMaxLength = getPhoneNumberMaxLength(
    formData.pocCountryCode || "+91",
  );

  useEffect(() => {
    if (data) {
      const contactPersonFromData = data.contactPerson
        ? String(data.contactPerson).trim()
        : `${data.firstname || ""} ${data.lastname || ""}`.trim();

      // Split into country code dropdown & national number input
      const rawCompanyPhone = String(data.companyPhone || data.phone || "");
      const parsedCompany = splitPhoneWithDialCode(
        rawCompanyPhone,
        data.companyCountryCode || data.countryCode || "+91",
      );
      const companyDigits = parsedCompany.number.replace(/\D/g, "");
      const companyTrimmed = allowOnlyDigitsWithMax(
        companyDigits,
        getPhoneNumberMaxLength(parsedCompany.dialCode),
      );

      // POC phone/email
      const rawPocPhone = String(data.pocPhone || "");
      const parsedPoc = splitPhoneWithDialCode(
        rawPocPhone,
        data.pocCountryCode || "+91",
      );
      const pocDigits = parsedPoc.number.replace(/\D/g, "");
      const pocTrimmed = allowOnlyDigitsWithMax(
        pocDigits,
        getPhoneNumberMaxLength(parsedPoc.dialCode),
      );

      setFormData({
        contactPerson: contactPersonFromData,
        alias: data.alias || "",
        companyEmail: data.companyEmail || data.email || "",
        companyPhone: companyTrimmed || "",
        companyCountryCode: parsedCompany.dialCode || "+91",
        pocEmail: data.pocEmail || "",
        pocPhone: pocTrimmed || "",
        pocCountryCode: parsedPoc.dialCode || "+91",
        dateOfBirth: data.dateOfBirth || "",

        companyName: data.companyName || "",
        address: data.address || "",
        openingBalance: data.openingBalance?.toString() || "",
        balanceType: data.balanceType || "debit",
        remarks: data.remarks || "",
        tier: data.tier || "",
      });
      setTier(data.tier || "");
      setExistingDocuments(Array.isArray(data.documents) ? data.documents : []);
      setAttachedFiles([]);
    } else {
      setFormData({
        contactPerson: "",
        alias: "",
        companyEmail: "",
        companyPhone: "",
        companyCountryCode: "+91",
        pocEmail: "",
        pocPhone: "",
        pocCountryCode: "+91",
        dateOfBirth: "",

        companyName: "",
        address: "",
        openingBalance: "",
        balanceType: "debit",
        remarks: "",
        tier: "",
        countryCode: "+91",
      });
      setTier("");
      setExistingDocuments([]);
      setAttachedFiles([]);
    }
  }, [data]);

  useEffect(() => {
    setFormData((prev) => {
      const trimmed = allowOnlyDigitsWithMax(
        String(prev.companyPhone || ""),
        companyPhoneMaxLength,
      );
      if (trimmed === prev.companyPhone) return prev;
      return { ...prev, companyPhone: trimmed };
    });
  }, [companyPhoneMaxLength]);

  useEffect(() => {
    setFormData((prev) => {
      const trimmed = allowOnlyDigitsWithMax(
        String(prev.pocPhone || ""),
        pocPhoneMaxLength,
      );
      if (trimmed === prev.pocPhone) return prev;
      return { ...prev, pocPhone: trimmed };
    });
  }, [pocPhoneMaxLength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate company name and contact person
    if (!formData.companyName || String(formData.companyName).trim() === "") {
      showErrorToast("Please enter company name to proceed");
      setInvalidField("company");

      setTimeout(() => {
        companyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        companyRef.current?.focus();
      }, 100);
      return;
    }

    const contactErr = validateFullName(formData.contactPerson);
    if (contactErr) {
      showErrorToast(contactErr);
      setInvalidField("contactPerson");
      setTimeout(() => {
        contactNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        contactNameRef.current?.focus();
      }, 100);
      return;
    }
    // Validate company email format if provided
    const companyEmailErr = validateEmailFormat(formData.companyEmail);
    if (companyEmailErr) {
      showErrorToast(companyEmailErr);
      return;
    }
    // Validate POC email if provided
    if (formData.pocEmail) {
      const pocEmailErr = validateEmailFormat(formData.pocEmail);
      if (pocEmailErr) {
        showErrorToast(pocEmailErr);
        return;
      }
    }
    const user = getAuthUser() as any;
    const businessId = user?.businessId;

    try {
      // FormData to send files + fields together
      const formDataToSend = new FormData();

      // Append ALL vendor fields (must match backend schema)
      formDataToSend.append("companyName", formData.companyName);
      formDataToSend.append(
        "contactPerson",
        String(formData.contactPerson || ""),
      );
      formDataToSend.append("alias", formData.alias || "");
      formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formDataToSend.append("openingBalance", formData.openingBalance || "");
      formDataToSend.append("balanceType", formData.balanceType);
      // company-level contact
      formDataToSend.append(
        "companyEmail",
        String(formData.companyEmail || ""),
      );
      formDataToSend.append(
        "companyCountryCode",
        formData.companyCountryCode || "+91",
      );
      formDataToSend.append("companyPhone", formData.companyPhone || "");
      // poc-level contact
      formDataToSend.append("pocEmail", String(formData.pocEmail || ""));
      formDataToSend.append("pocCountryCode", formData.pocCountryCode || "+91");
      formDataToSend.append("pocPhone", formData.pocPhone || "");
      formDataToSend.append("address", formData.address || "");
      formDataToSend.append("tier", tier || "");
      formDataToSend.append("remarks", formData.remarks || "");
      formDataToSend.append("customId", vendorCode || "");

      // Backend requires businessId as field
      formDataToSend.append("businessId", businessId);

      // Append up to 3 DOCUMENT FILES
      attachedFiles.forEach((file: File) => {
        formDataToSend.append("documents", file);
      });

      const created = await createVendor(formDataToSend);
      console.log("Vendor created successfully:", created);

      if (created?._id) {
        updateGeneralInfo({ vendor: created._id });
        const displayName =
          created.name || created.companyName || created.contactPerson || "";
        setLastAddedVendor?.({
          id: created._id,
          name: displayName,
          alias: created.alias || "",
          customId: created.customId || vendorCode || "",
          tier: created.tier || tier || "",
          companyName: created.companyName || formData.companyName || "",
          contactPerson:
            created.contactPerson || String(formData.contactPerson || ""),
        });
        onSuccess?.();
      }

      onCancel();
    } catch (error: any) {
      console.error("Error creating vendor:", error.message || error);
    }
  };

  const handleUpdateVendor = async () => {
    // Validate company name and contact person before update
    if (!formData.companyName || String(formData.companyName).trim() === "") {
      showErrorToast("Please enter company name to proceed");
      setInvalidField("company");

      setTimeout(() => {
        companyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        companyRef.current?.focus();
      }, 100);
      return;
    }

    const contactErr2 = validateFullName(formData.contactPerson);
    if (contactErr2) {
      showErrorToast(contactErr2);
      setInvalidField("contactPerson");
      setTimeout(() => {
        contactNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        contactNameRef.current?.focus();
      }, 100);
      return;
    }
    try {
      const vendorId = data?._id;

      if (!vendorId) {
        console.error("No vendor ID found");
        return;
      }

      // Validate company email format if provided
      const companyEmailErr2 = validateEmailFormat(formData.companyEmail);
      if (companyEmailErr2) {
        showErrorToast(companyEmailErr2);
        return;
      }
      // Validate POC email if provided
      if (formData.pocEmail) {
        const pocEmailErr2 = validateEmailFormat(formData.pocEmail);
        if (pocEmailErr2) {
          showErrorToast(pocEmailErr2);
          return;
        }
      }

      const vendorData: any = {
        companyName: formData.companyName,
        contactPerson: String(formData.contactPerson || ""),
        alias: formData.alias || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        openingBalance: formData.openingBalance
          ? Number(formData.openingBalance)
          : undefined,
        balanceType: formData.balanceType,
        // company-level contact
        companyEmail: formData.companyEmail || undefined,
        companyPhone: formData.companyPhone
          ? `${formData.companyCountryCode || "+91"}${formData.companyPhone}`
          : undefined,
        companyCountryCode: formData.companyCountryCode || undefined,
        // poc-level contact
        pocEmail: formData.pocEmail || undefined,
        pocPhone: formData.pocPhone
          ? `${formData.pocCountryCode || "+91"}${formData.pocPhone}`
          : undefined,
        pocCountryCode: formData.pocCountryCode || undefined,

        address: formData.address,
        tier: tier || undefined,
        remarks: formData.remarks || undefined,
        documents: existingDocuments,
      };

      const response = await updateVendor(vendorId, vendorData);
      console.log("Vendor updated successfully:", response);

      onSuccess?.();
      onCancel(); // close sheet
    } catch (error: any) {
      console.error("Error updating vendor:", error.message || error);
    }
  };

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={onCancel}
        title={`${
          mode === "view"
            ? "Vendor Details"
            : mode === "edit"
              ? "Edit Vendor"
              : "Add Vendor"
        }${vendorCode ? " | " + vendorCode : ""}`}
        width="lg2"
        position="right"
        showLinkButton={true}
        zIndex={1000}
      >
        <form
          className="flex flex-col h-full"
          onSubmit={
            mode === "create" ? handleSubmit : (e) => e.preventDefault()
          }
          ref={formRef as any}
          noValidate
        >
          <div className="space-y-6 p-4 overflow-y-auto flex-1 pb-16">
            {/* ================= BASIC DETAILS ================ */}
            <div className="border border-[#E2E1E1] rounded-[12px] p-3 -mt-2">
              <h2 className="text-[13px] font-[500] mb-2">Basic Details</h2>
              <hr className="mt-1 mb-2 border-t border-[#E2E1E1]" />

              {/* Row 1 */}
              {/* Company Name - FULL WIDTH */}
              <div className="flex flex-col gap-1 mb-3">
                <label className="block text-[13px] font-[500] text-[#414141]">
                  Company Name <span className="text-[#FF3B30]">*</span>
                </label>
                <input
                  ref={companyRef}
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    const v = String(e.target.value);
                    setFormData({ ...formData, companyName: v });
                    if (invalidField === "company" && String(v).trim()) {
                      setInvalidField(null);
                    }
                  }}
                  placeholder="Enter Company Name"
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202] ${
                    invalidField === "company"
                      ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                      : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
                  }`}
                />
              </div>

              {/* Row 2 */}
              {/* Contact Number + Company Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={formData.companyCountryCode}
                      onChange={(v) =>
                        setFormData({ ...formData, companyCountryCode: v })
                      }
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0"
                      customHeight="h-9"
                    />
                    <input
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyPhone: allowOnlyDigitsWithMax(
                            e.target.value,
                            companyPhoneMaxLength,
                          ),
                        })
                      }
                      maxLength={companyPhoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] text-[#414141] focus:outline-none focus:ring-1 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Company Email ID
                  </label>
                  <input
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, companyEmail: e.target.value })
                    }
                    placeholder="Enter Email ID"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202]"
                  />
                </div>
              </div>

              {/* Row 3 (reserved for single-width field if needed) */}
              <div className="flex flex-col gap-1 w-[22.3rem]"></div>
            </div>

            {/* ================= POC DETAILS (Optional) ================ */}
            <div className="border border-[#E2E1E1] rounded-[12px] p-3">
              <h2 className="text-[13px] font-[500] mb-2">
                POC Details (Optional)
              </h2>
              <hr className="mt-1 mb-2 border-t border-[#E2E1E1]" />

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Contact Person <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    ref={contactNameRef}
                    name="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => {
                      const v = allowOnlyText(e.target.value);
                      setFormData({ ...formData, contactPerson: v });
                      if (
                        invalidField === "contactPerson" &&
                        String(v).trim()
                      ) {
                        setInvalidField(null);
                      }
                    }}
                    placeholder="Enter Contact Person Name"
                    disabled={readOnly}
                    className={`w-full rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202] ${
                      invalidField === "contactPerson"
                        ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                        : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
                    }`}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Nickname/Alias
                  </label>
                  <input
                    name="alias"
                    type="text"
                    value={formData.alias}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alias: allowTextAndNumbers(e.target.value),
                      })
                    }
                    placeholder="Enter Nickname/Alias"
                    disabled={readOnly}
                    className="w-full border border-gray-300 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] disabled:bg-gray-200 disabled:text-[#020202]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={formData.pocCountryCode}
                      onChange={(v) =>
                        setFormData({ ...formData, pocCountryCode: v })
                      }
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0"
                    />
                    <input
                      placeholder="Enter Contact Number"
                      type="text"
                      value={formData.pocPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pocPhone: allowOnlyDigitsWithMax(
                            e.target.value,
                            pocPhoneMaxLength,
                          ),
                        })
                      }
                      maxLength={pocPhoneMaxLength}
                      disabled={readOnly}
                      className="w-full h-[2rem] border border-gray-300 rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] text-[#414141] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE] hover:border-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Email ID
                  </label>
                  <input
                    placeholder="Enter Email ID"
                    type="email"
                    value={formData.pocEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, pocEmail: e.target.value })
                    }
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202]"
                  />
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <SingleCalendar
                    label="Date of Birth"
                    value={formData.dateOfBirth || ""}
                    onChange={(iso) =>
                      setFormData((prev) => ({ ...prev, dateOfBirth: iso }))
                    }
                    placeholder="DD-MM-YYYY"
                    customWidth="w-full mt-0.5 py-2"
                    showCalendarIcon={true}
                    readOnly={readOnly}
                    maxDate={new Date().toISOString()}
                  />
                </div>
              </div>

              {/* Row 4 (optional single field placeholder) */}
              <div className="flex flex-col gap-1 w-[22.3rem]"></div>
            </div>

            {/* ================= DOCUMENTS ================ */}
            <div className="border border-[#E2E1E1] rounded-[12px] p-3">
              <h2 className="text-[13px] font-[500] mb-2">Documents</h2>
              <hr className="mt-1 mb-2 border-t border-[#E2E1E1]" />

              <input
                type="file"
                ref={fileRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                multiple
                disabled={readOnly || attachedFiles.length >= 3}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={readOnly || attachedFiles.length >= 3}
                className={`px-3 py-1 flex gap-1 bg-white text-[#126ACB] border 
                           border-[#126ACB] rounded-md font-[600] text-[13px] hover:cursor-pointer ${
                             readOnly || attachedFiles.length >= 3
                               ? "opacity-50 cursor-not-allowed hover:bg-white"
                               : ""
                           }`}
              >
                <MdOutlineFileUpload size={16} /> Attach Files
              </button>

              {/* PREVIEW FILES */}
              <div className="mt-2 flex flex-col gap-2">
                {existingDocuments.map((doc, i) => (
                  <div
                    key={`${doc.key || doc.fileName || doc.originalName}-${i}`}
                    className="flex items-center justify-between w-full 
                             bg-white rounded-md 
                             px-3 py-2 hover:cursor-pointer transition"
                  >
                    <button
                      type="button"
                      onClick={() => doc.url && window.open(doc.url, "_blank")}
                      className="text-[#126ACB]  p-1.5 -ml-2 rounded-md bg-[#126ACB0D]  text-[13px] truncate flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                      title="Click to view document"
                    >
                      <FaRegFolder className="text-[#126ACB] w-3 h-3" />
                      {doc.originalName || doc.fileName}
                    </button>

                    {!readOnly && mode === "edit" ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingDocument(i)}
                        className="text-[#FF3B30] hover:cursor-pointer"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    ) : null}
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
                    <span className="text-[#126ACB]  p-1.5 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2">
                      <FaRegFolder className="text-[#126ACB] w-3 h-3" />
                      {file.name}
                    </span>

                    {/* Delete Icon */}
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(i)}
                        className="text-[#EB382B] hover:cursor-pointer"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="text-[#EB382B] font-[500] text-[0.65rem]">
                Note: Maximum of 3 files can be uploaded
              </div>
            </div>

            {/* ================= BILLING ADDRESS ================ */}
            <div className="border border-[#E2E1E1] rounded-[12px] p-3">
              <label className="block text-[13px] font-[500] text-[#414141] mb-1">
                Billing Address
              </label>
              <hr className="mt-1 mb-3 border-t border-[#E2E1E1]" />
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Enter Billing Address"
                disabled={readOnly}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202] resize-none"
              />
            </div>

            {/* ================= OPENING BALANCE ================ */}
            <div className="border border-[#E2E1E1] rounded-[12px] p-3">
              <h2 className="text-[13px] font-[500] mb-2">Opening Balance</h2>
              <hr className="mt-1 mb-3 border-t border-[#E2E1E1]" />

              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="debit"
                    checked={balanceType === "debit"}
                    onChange={() => setBalanceType("debit")}
                    className="w-3 h-3 text-[#126ACB]"
                    disabled={readOnly}
                  />
                  <span className="text-[#414141]">Debit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="credit"
                    checked={balanceType === "credit"}
                    onChange={() => setBalanceType("credit")}
                    className="w-3 h-3 text-[#126ACB]"
                    disabled={readOnly}
                  />
                  <span className="text-[#414141]">Credit</span>
                </label>
              </div>

              <div className="relative">
                <div
                  className={`flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-[#C6AEDE] ${
                    readOnly ? "bg-gray-200" : "bg-white"
                  }`}
                >
                  <span className="text-gray-500 mr-2 text-[13px]">
                    {getStoredCurrencySymbol()}
                  </span>
                  <input
                    type="text"
                    value={balanceAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers and decimal point
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setBalanceAmount(value);
                      } else {
                        alert(
                          "Please enter only numbers. Letters and special characters are not allowed.",
                        );
                      }
                    }}
                    placeholder={
                      balanceType === "debit"
                        ? "Enter Debit Amount"
                        : "Enter Credit Amount"
                    }
                    disabled={readOnly}
                    className="flex-1 outline-none text-[#414141] text-[13px] hover:border-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202]"
                  />
                </div>
                <div className="absolute right-3 top-2 font-[500]">
                  {balanceType === "debit" ? (
                    <span className=" text-green-500 text-[13px]">
                      Customer pays you {getStoredCurrencySymbol()}{" "}
                      {balanceAmount || ""}
                    </span>
                  ) : (
                    <span className=" text-[#FF3B30] text-[13px]">
                      You pay the customer {getStoredCurrencySymbol()}{" "}
                      {balanceAmount || ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ================= TIER ================ */}
            <div className=" p-1 -mt-4">
              <h2 className="text-[13px] font-[500] mb-2">Rating</h2>

              <div className="flex flex-col">
                <DropDown
                  options={[
                    {
                      value: "tier1",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-icons/tier-1.svg"
                            alt="Tier 1"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-[500]">1</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier2",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-icons/tier-2.svg"
                            alt="Tier 2"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-[500]">2</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier3",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-icons/tier-3.svg"
                            alt="Tier 3"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-[500]">3</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier4",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-icons/tier-4.svg"
                            alt="Tier 4"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-[500]">4</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier5",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-icons/tier-5.svg"
                            alt="Tier 5"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-[500]">5</span>
                        </div>
                      ),
                    },
                  ]}
                  value={tier}
                  onChange={(v) => setTier(v)}
                  disabled={readOnly}
                  customWidth="w-[10rem]"
                  menuWidth="w-[10rem]"
                  placeholder="Select Rating"
                  className=""
                  readOnly={readOnly}
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="border border-[#E2E1E1] rounded-xl p-3 -mt-2">
              <label className="block text-[13px]  font-[500] text-[#020202]">
                Remarks
              </label>
              <hr className="mt-1 mb-2 border-t border-[#E2E1E1]" />
              <textarea
                name="remarks"
                rows={5}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Enter Your Remarks Here"
                className={`
            w-full border border-[#E2E1E1] rounded-md px-3 py-2 text-[13px] placeholder:text-[#9CA3AF] mt-2 transition-colors
            focus:ring focus:ring-[#C6AEDE] hover:border-[#C6AEDE] disabled:bg-gray-200 disabled:text-[#020202]
          `}
                disabled={readOnly}
              />
            </div>

            {/* ================= ACTION BUTTONS ================ */}
          </div>
          <div className="sticky bottom-0 bg-white border-t border-[#E2E1E1] py-2 px-3 z-30">
            <div className="flex justify-end gap-2">
              {mode === "view" ? (
                <Button
                  text="Close"
                  onClick={onCancel}
                  bgColor="bg-white border border-[#E2E1E1]"
                  textColor="text-[#414141]"
                />
              ) : mode === "edit" ? (
                <Button
                  text="Update Vendor"
                  type="submit"
                  onClick={handleUpdateVendor}
                  bgColor="bg-[#0D4B37]"
                  textColor="text-white"
                />
              ) : (
                <Button
                  text="Save"
                  type="submit"
                  icon={<LuSave size={16} />}
                  bgColor="bg-[#114958]"
                  textColor="text-white"
                />
              )}
            </div>
          </div>
        </form>
        <ErrorToast
          message={error || ""}
          visible={!!error}
          onClose={() => setError(null)}
        />
      </SideSheet>
      {isHistoryOpen && (
        <BookingHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          bookings={historyBookings}
        />
      )}
    </>
  );
};

export default AddVendorSideSheet;
