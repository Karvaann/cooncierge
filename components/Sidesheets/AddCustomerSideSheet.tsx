"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SideSheet from "../SideSheet";
import SingleCalendar from "../SingleCalendar";
import { createCustomer } from "@/services/customerApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { updateCustomer } from "@/services/customerApi";
import { useBooking } from "@/context/BookingContext";
import { FaRegFolder } from "react-icons/fa";
import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { LuSave } from "react-icons/lu";
import Button from "../Button";
import DropDown from "../DropDown";
import PhoneCodeSelect from "../PhoneCodeSelect";
import generateCustomId from "@/utils/helper";
import ErrorToast from "../ErrorToast";
import ConfirmationModal from "../popups/ConfirmationModal";
import {
  allowOnlyText,
  allowOnlyNumbers,
  allowOnlyDigitsWithMax,
  allowTextAndNumbers,
} from "@/utils/inputValidators";
import { isValidEmail } from "@/utils/inputValidators";
import {
  getPhoneNumberMaxLength,
  splitPhoneWithDialCode,
} from "@/utils/phoneUtils";

type CustomerData = {
  customId?: string;
  _id?: string;
  name?: string;
  documents?: Array<{
    originalName: string;
    fileName: string;
    url: string;
    key: string;
    size: number;
    mimeType: string;
    uploadedAt: string | Date;
  }>;
  alias: string;
  firstname?: string;
  lastname?: string;
  phone: string | "";
  email: string;
  dateOfBirth: "" | string;
  gstin: number | "";
  companyName: string;
  address: string | number;
  remarks: string;
  tier?: string;
  openingBalance?: string;
  balanceType?: "credit" | "debit";
};

type AddCustomerSideSheetProps = {
  data?: CustomerData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit" | "view";
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
  customerCode?: string;
};

const AddCustomerSideSheet: React.FC<AddCustomerSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
  formRef,
  onSuccess,
  customerCode: customerCodeProp,
}) => {
  const { updateGeneralInfo, setLastAddedCustomer } = useBooking();
  const readOnly = mode === "view";
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    NonNullable<CustomerData["documents"]>
  >([]);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const [tier, setTier] = useState<string>("");

  const [formData, setFormData] = useState<CustomerData>({
    name: "",
    alias: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gstin: "",
    companyName: "",
    address: "",
    remarks: "",
    tier: "",
  });

  // Validation helpers / UI state for required fields
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"name" | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [customerCode, setCustomerCode] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const initialSnapshotRef = useRef<string>("");

  const buildSnapshot = (snapshot: {
    formData: CustomerData;
    phoneCodeValue: string;
    tierValue: string;
    balanceAmountValue: string;
    balanceTypeValue: "debit" | "credit";
    existingDocs: NonNullable<CustomerData["documents"]>;
    attached: File[];
  }) =>
    JSON.stringify({
      formData: {
        name: snapshot.formData.name || "",
        alias: snapshot.formData.alias || "",
        phone: snapshot.formData.phone || "",
        email: snapshot.formData.email || "",
        dateOfBirth: snapshot.formData.dateOfBirth || "",
        gstin: snapshot.formData.gstin || "",
        companyName: snapshot.formData.companyName || "",
        address: snapshot.formData.address || "",
        remarks: snapshot.formData.remarks || "",
      },
      phoneCode: snapshot.phoneCodeValue || "",
      tier: snapshot.tierValue || "",
      balanceAmount: snapshot.balanceAmountValue || "",
      balanceType: snapshot.balanceTypeValue || "debit",
      existingDocuments: snapshot.existingDocs.map(
        (doc) =>
          doc.key ||
          doc.url ||
          doc.fileName ||
          doc.originalName ||
          ""
      ),
      attachedFiles: snapshot.attached.map(
        (file) => `${file.name}:${file.size}:${file.type}`
      ),
    });

  useEffect(() => {
    if (customerCodeProp) {
      setCustomerCode(customerCodeProp);
    } else if (data?.customId) {
      setCustomerCode(String(data.customId));
    } else if (data?._id) {
      setCustomerCode(String(data._id));
    } else if (mode === "create") {
      setCustomerCode(generateCustomId("customer"));
    } else {
      setCustomerCode("");
    }
  }, [mode, data, customerCodeProp]);

  const phoneMaxLength = getPhoneNumberMaxLength(phoneCode);

  // Mounted flag to ensure portal renders client-side only
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showErrorToast = (message: string) => {
    setError(message);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "name"
        ? allowOnlyText(value)
        : name === "gstin"
        ? allowOnlyNumbers(value)
        : name === "phone"
        ? allowOnlyDigitsWithMax(value, phoneMaxLength)
        : name === "alias"
        ? allowTextAndNumbers(value)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    // Clear invalid state when user types into required fields
    if (name === "name" && value.trim() && invalidField === "name") {
      setInvalidField(null);
    }
  };

  // Handle selecting multiple files
  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);

    // Respect max 3 files total
    const remaining = 3 - attachedFiles.length;
    if (remaining <= 0) {
      // No more files allowed
      return;
    }

    const toAdd = selected.slice(0, remaining);

    setAttachedFiles((prev) => [...prev, ...toAdd]);

    // simple: just append the allowed files to local state

    // Reset so selecting the same file again is possible
    if (fileRef.current) fileRef.current.value = "";
  };

  // Remove one file
  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (data) {
      // Prefer explicit full name if provided; otherwise combine firstname/lastname
      let nameVal = "";
      if (data.name && String(data.name).trim()) {
        nameVal = String(data.name).trim();
      } else if (data.firstname || data.lastname) {
        nameVal = `${data.firstname || ""} ${data.lastname || ""}`.trim();
      }

      // Split country code from phone
      const rawPhone = String(data.phone || "");
      const parsed = splitPhoneWithDialCode(rawPhone, "+91");
      const digitsOnly = parsed.number.replace(/\D/g, "");
      const maxLen = getPhoneNumberMaxLength(parsed.dialCode);
      const trimmed = allowOnlyDigitsWithMax(digitsOnly, maxLen);
      setPhoneCode(parsed.dialCode);

      const nextFormData: CustomerData = {
        name: nameVal,
        alias: data.alias || "",
        phone: trimmed || "",
        email: data.email || "",
        dateOfBirth: data.dateOfBirth
          ? String(data.dateOfBirth).slice(0, 10)
          : "",
        gstin: data.gstin || "",
        companyName: data.companyName || "",
        address: data.address || "",
        remarks: data.remarks || "",
        tier: data.tier || "",
      };
      setFormData(nextFormData);

      const nextDocuments = Array.isArray(data.documents) ? data.documents : [];
      setExistingDocuments(nextDocuments);
      setAttachedFiles([]);
      const nextTier = data.tier || "";
      const nextBalanceAmount = data.openingBalance
        ? String(data.openingBalance)
        : "";
      const nextBalanceType = data.balanceType || "debit";
      setTier(nextTier);
      setBalanceAmount(nextBalanceAmount);
      setBalanceType(nextBalanceType);

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: parsed.dialCode,
        tierValue: nextTier,
        balanceAmountValue: nextBalanceAmount,
        balanceTypeValue: nextBalanceType,
        existingDocs: nextDocuments,
        attached: [],
      });
    } else {
      const nextFormData: CustomerData = {
        name: "",
        alias: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        gstin: "",
        companyName: "",
        address: "",
        remarks: "",
        tier: "",
      };
      setFormData(nextFormData);

      setExistingDocuments([]);
      setAttachedFiles([]);
      const nextPhoneCode = "+91";
      const nextTier = "";
      const nextBalanceAmount = "";
      const nextBalanceType: "debit" | "credit" = "debit";
      setPhoneCode(nextPhoneCode);
      setTier(nextTier);
      setBalanceAmount(nextBalanceAmount);
      setBalanceType(nextBalanceType);

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: nextPhoneCode,
        tierValue: nextTier,
        balanceAmountValue: nextBalanceAmount,
        balanceTypeValue: nextBalanceType,
        existingDocs: [],
        attached: [],
      });
    }
  }, [data]);

  useEffect(() => {
    setFormData((prev) => {
      const trimmed = allowOnlyDigitsWithMax(
        String(prev.phone || ""),
        phoneMaxLength
      );
      if (trimmed === prev.phone) return prev;
      return { ...prev, phone: trimmed };
    });
  }, [phoneMaxLength]);

  const isDirty = React.useMemo(() => {
    if (mode !== "edit") return false;
    const currentSnapshot = buildSnapshot({
      formData,
      phoneCodeValue: phoneCode,
      tierValue: tier,
      balanceAmountValue: balanceAmount,
      balanceTypeValue: balanceType,
      existingDocs: existingDocuments,
      attached: attachedFiles,
    });
    return currentSnapshot !== initialSnapshotRef.current;
  }, [
    mode,
    formData,
    phoneCode,
    tier,
    balanceAmount,
    balanceType,
    existingDocuments,
    attachedFiles,
  ]);

  const handleRequestClose = () => {
    if (readOnly) {
      onCancel();
      return;
    }
    if (mode === "create") {
      setIsCloseConfirmOpen(true);
      return;
    }
    if (mode === "edit" && isDirty) {
      setIsCloseConfirmOpen(true);
      return;
    }
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields: if missing, show toast and focus the field
    if (!formData.name || String(formData.name).trim() === "") {
      showErrorToast("Please enter full name to proceed");

      setInvalidField("name");

      setTimeout(() => {
        nameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        nameRef.current?.focus();
      }, 100);
      return;
    }
    const user = getAuthUser() as any;
    const ownerId = user?._id;
    const businessId = user?.businessId;

    try {
      // Validate email format if provided
      if (formData.email && !isValidEmail(String(formData.email))) {
        showErrorToast("Email format is invalid");
        return;
      }
      // Build FormData
      const formDataToSend = new FormData();

      // APPEND every customer field
      formDataToSend.append("name", String(formData.name || ""));
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("phone", `${phoneCode}${formData.phone}`);
      formDataToSend.append("alias", formData.alias || "");
      formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formDataToSend.append("gstin", String(formData.gstin || ""));
      formDataToSend.append("companyName", formData.companyName || "");
      formDataToSend.append("address", String(formData.address || ""));
      formDataToSend.append("remarks", formData.remarks || "");
      formDataToSend.append("tier", tier || "");
      formDataToSend.append("ownerId", ownerId || "");
      formDataToSend.append("businessId", businessId || "");

      formDataToSend.append("customId", customerCode || "");

      if (balanceAmount) {
        formDataToSend.append("openingBalance", String(balanceAmount));
        formDataToSend.append("balanceType", balanceType);
      }

      // Append selected files
      attachedFiles.forEach((file) => {
        formDataToSend.append("documents", file);
      });

      const response = await createCustomer(formDataToSend);
      const created = response?.customer || response;
      console.log("Customer created successfully:", created);

      if (created?._id) {
        // Update booking general info and notify listeners
        updateGeneralInfo({ customer: created._id });
        setLastAddedCustomer({ id: created._id, name: created.name || "" });
        onSuccess?.();
      }

      onCancel();
    } catch (error: any) {
      console.error("Error creating customer:", error.message || error);
    }
  };

  const handleUpdateCustomer = async () => {
    // Validate required fields before update
    if (!formData.name || String(formData.name).trim() === "") {
      showErrorToast("Please enter full name to proceed");
      setInvalidField("name");

      setTimeout(() => {
        nameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        nameRef.current?.focus();
      }, 100);
      return;
    }
    try {
      const customerId = data?._id;

      if (!customerId) {
        console.error("No customer ID found");
        return;
      }

      // Validate email format if provided
      if (formData.email && !isValidEmail(String(formData.email))) {
        showErrorToast("Email format is invalid");
        return;
      }

      const updatePayload = {
        name: String(formData.name || ""),
        email: formData.email,
        phone: `${phoneCode}${formData.phone}`,
        alias: formData.alias || undefined,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth)
          : undefined,
        gstin: formData.gstin ? String(formData.gstin) : undefined,
        companyName: formData.companyName || undefined,
        address: formData.address || undefined,
        openingBalance: balanceAmount ? Number(balanceAmount) : undefined,
        balanceType: balanceType,
        tier: tier || undefined,
        remarks: formData.remarks || undefined,

        documents: existingDocuments,
      };

      const updated = await updateCustomer(customerId, updatePayload);
      console.log("Customer updated:", updated);
      onSuccess?.();
      onCancel(); // close sheet
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={handleRequestClose}
        onCloseButtonClick={handleRequestClose}
        title={`${
          mode === "view"
            ? "Customer Details"
            : mode === "edit"
            ? "Edit Customer"
            : "Add Customer"
        }${customerCode ? " | " + customerCode : ""}`}
        width="lg2"
        position="right"
        showLinkButton={true}
        zIndex={1000}
      >
        <form
          className="flex flex-col h-full"
          onSubmit={handleSubmit}
          ref={formRef as any}
          noValidate
        >
          <div className="space-y-6 p-4 overflow-y-auto flex-1 pb-16">
            {/* Error Alert Popup (reuse login style) */}
            {/* {mounted &&
            showError &&
            createPortal(
              <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[1100] flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-2 py-1 rounded-full shadow-md max-w-[90vw] text-[0.65rem]">
                <svg
                  className="w-4 h-4 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01"
                  />
                </svg>
                <span className="font-semibold">Error :</span>
                <span className="">{errorMessage}</span>
                <button
                  type="button"
                  className="ml-2 text-red-400 hover:text-red-600 text-lg font-bold"
                  aria-label="Close alert"
                  onClick={() => setShowError(false)}
                >
                  ×
                </button>
              </div>,
              document.body
            )} */}
            {/* ================= BASIC DETAILS ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3 -mt-2">
              <h2 className="text-[13px] font-medium mb-2">Basic Details</h2>
              <hr className="mt-1 mb-2 border-t border-gray-200" />

              {/* Row 1: Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter Full Name"
                    disabled={readOnly}
                    className={`w-full rounded-md px-3 py-2 text-[13px] focus:outline-none hover:border-green-400 focus:ring-green-400 focus:ring-1 disabled:bg-gray-100 disabled:text-gray-700 ${
                      invalidField === "name"
                        ? "border border-red-300 focus:ring-red-200"
                        : "border border-gray-300"
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Alias + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Nickname/Alias
                  </label>
                  <input
                    name="alias"
                    type="text"
                    value={formData.alias}
                    onChange={handleChange}
                    placeholder="Enter Nickname/Alias"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={phoneCode}
                      onChange={(v) => setPhoneCode(v)}
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0 rounded-l-md"
                      customHeight="h-9"
                    />
                    <input
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={phoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Email + DOB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Email ID
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Email ID"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
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
                    customWidth="w-full mt-1.5 py-2"
                    showCalendarIcon={true}
                    readOnly={readOnly}
                    maxDate={new Date().toISOString()}
                  />
                </div>
              </div>
            </div>

            {/* ================= COMPANY DETAILS ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3">
              <h2 className="text-[13px] font-medium mb-2">
                Company Details (Optional)
              </h2>
              <hr className="mt-1 mb-2 border-t border-gray-200" />

              <div className="flex gap-6">
                {/* GSTIN */}
                <div className="flex flex-col w-[18rem] relative">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    name="gstin"
                    type="text"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="Please Provide Your GST No."
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] pr-16 focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>

                {/* Company Name */}
                <div className="flex flex-col w-[20rem]">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter Company Name"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ================= DOCUMENTS ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3">
              <h2 className="text-[13px] font-medium mb-2">Documents</h2>
              <hr className="mt-1 mb-2 border-t border-gray-200" />

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
                className={`px-3 py-1.5 flex gap-1 bg-white text-[#126ACB] border 
               border-[#126ACB] rounded-md text-[13px] hover:bg-gray-200 ${
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
                 px-3 py-2 hover:bg-gray-50 transition"
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

                    {!readOnly && mode === "edit" ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingDocument(i)}
                        className="text-red-500 hover:text-red-700"
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
                    <span className="text-blue-700 border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2">
                      <FaRegFolder className="text-blue-500 w-3 h-3" />
                      {file.name}
                    </span>

                    {/* Delete Icon */}
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="text-red-600 text-[0.65rem]">
                Note: Maximum of 3 files can be uploaded
              </div>
            </div>

            {/* ================= BILLING ADDRESS ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3">
              <label className="block text-[13px] font-medium text-gray-700 mb-1">
                Billing Address
              </label>
              <hr className="mt-1 mb-3 border-t border-gray-200" />
              <input
                name="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter Billing Address"
                disabled={readOnly}
                className="w-full border border-gray-300 hover:border-green-400 focus:ring-green-400 rounded-md px-3 py-2 text-[13px] disabled:bg-gray-100 disabled:text-gray-700"
              />
            </div>
            {/* ================= OPENING BALANCE ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3">
              <h2 className="text-[13px] font-medium mb-2">Opening Balance</h2>
              <hr className="mt-1 mb-3 border-t border-gray-200" />

              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="debit"
                    checked={balanceType === "debit"}
                    onChange={() => setBalanceType("debit")}
                    className="w-3 h-3 text-red-600"
                    disabled={readOnly}
                  />
                  <span className="text-gray-700">Debit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="credit"
                    checked={balanceType === "credit"}
                    onChange={() => setBalanceType("credit")}
                    className="w-3 h-3 text-red-600"
                    disabled={readOnly}
                  />
                  <span className="text-gray-700">Credit</span>
                </label>
              </div>

              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-green-400">
                  <span className="text-gray-500 mr-2 text-[13px]">₹</span>
                  <input
                    type="text"
                    value={balanceAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers and decimal point
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setBalanceAmount(value);
                      } else {
                        // Invalid input, ignore
                      }
                    }}
                    placeholder={
                      balanceType === "debit"
                        ? "Enter Debit Amount"
                        : "Enter Credit Amount"
                    }
                    disabled={readOnly}
                    className="flex-1 outline-none text-gray-700 text-[13px] disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
                <div className="absolute right-3 top-2 text-sm font-medium">
                  {balanceType === "debit" ? (
                    <span className=" text-green-500 text-[13px]">
                      Customer pays you ₹{balanceAmount || ""}
                    </span>
                  ) : (
                    <span className="text-red-500 text-[13px]">
                      You pay the customer ₹{balanceAmount || ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ================= TIER ================ */}
            <div className=" p-1 -mt-4">
              <h2 className="text-[13px] font-medium mb-2">Rating</h2>

              <div className="flex flex-col">
                <DropDown
                  options={[
                    {
                      value: "tier1",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-1.png"
                            alt="Tier 1"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-medium">1</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier2",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-2.png"
                            alt="Tier 2"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-medium">2</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier3",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-3.png"
                            alt="Tier 3"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-medium">3</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier4",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-4.png"
                            alt="Tier 4"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-medium">4</span>
                        </div>
                      ),
                    },
                    {
                      value: "tier5",
                      label: (
                        <div className="flex items-center gap-2">
                          <img
                            src="/icons/tier-5.png"
                            alt="Tier 5"
                            className="w-5 h-5"
                          />
                          <span className="text-[13px] font-medium">5</span>
                        </div>
                      ),
                    },
                  ]}
                  value={tier}
                  onChange={(v) => setTier(v)}
                  disabled={readOnly}
                  customWidth="w-[10rem]"
                  menuWidth="w-[10rem]"
                  className=""
                  // readOnly={readOnly}
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="border border-gray-200 rounded-xl p-3 -mt-2">
              <label className="block text-[13px]  font-medium text-gray-700">
                Remarks
              </label>
              <hr className="mt-1 mb-2 border-t border-gray-200" />
              <textarea
                name="remarks"
                rows={5}
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Enter Your Remarks Here"
                disabled={readOnly}
                className={`
            w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]  mt-2 transition-colors
            focus:ring hover:border-green-400 focus:ring-green-400
            disabled:bg-gray-100 disabled:text-gray-700
          `}
              />
            </div>

            {/* ================= ACTION BUTTONS ================ */}
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 py-2 px-3 z-30">
            <div className="flex justify-end gap-2">
              {mode === "view" ? (
                <Button
                  text="Close"
                  onClick={onCancel}
                  bgColor="bg-white"
                  textColor="text-gray-700"
                  className="border border-gray-300 hover:bg-gray-100"
                />
              ) : (
                <>
                  <Button
                    text="Cancel"
                    onClick={onCancel}
                    bgColor="bg-white"
                    textColor="text-gray-700"
                    className="border border-gray-300 hover:bg-gray-100"
                  />

                  {mode === "edit" ? (
                    <Button
                      text="Update Customer"
                      onClick={handleUpdateCustomer}
                      bgColor="bg-[#0D4B37]"
                      textColor="text-white"
                      className="hover:bg-green-900"
                    />
                  ) : (
                    <Button
                      text="Save"
                      type="submit"
                      icon={<LuSave size={16} />}
                      bgColor="bg-[#0D4B37]"
                      textColor="text-white"
                      className="hover:bg-[#0f3d44]"
                    />
                  )}
                </>
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
      {isCloseConfirmOpen && (
        <ConfirmationModal
          isOpen={isCloseConfirmOpen}
          onClose={() => setIsCloseConfirmOpen(false)}
          title="You have unsaved changes. Are you sure you want to close?"
          confirmText="Yes, Close"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
          onConfirm={() => {
            setIsCloseConfirmOpen(false);
            onCancel();
          }}
        />
      )}
    </>
  );
};

export default AddCustomerSideSheet;
