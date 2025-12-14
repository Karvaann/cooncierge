"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SideSheet from "../SideSheet";
import {
  createVendor,
  updateVendor,
  getVendorBookingHistory,
} from "@/services/vendorApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { useBooking } from "@/context/BookingContext";
import DropDown from "../DropDown";
import SingleCalendar from "../SingleCalendar";
import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { LuSave } from "react-icons/lu";
import Button from "../Button";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { MdHistory } from "react-icons/md";
import { FaRegFolder } from "react-icons/fa";
import generateCustomId from "@/utils/helper";

type VendorData = {
  _id?: string;
  contactPerson?: string;
  firstname: string;
  lastname: string;
  alias: string;
  email: string;
  phone: string;
  countryCode: string;
  dateOfBirth: string;
  GSTIN: string;
  companyName: string;
  address: string;
  openingBalance: string;
  balanceType: "credit" | "debit";
  remarks: string;
  tier?: string;
};

type AddVendorSideSheetProps = {
  data?: VendorData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit" | "view";
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
};

const AddVendorSideSheet: React.FC<AddVendorSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
  formRef,
  onSuccess,
}) => {
  const { updateGeneralInfo, setLastAddedVendor } = useBooking();
  const readOnly = mode === "view";
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const [phone, setPhone] = useState<string>("");
  const [company, setcompany] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Validation helpers / UI state for required fields (company + firstname)
  const companyRef = useRef<HTMLInputElement | null>(null);
  const pocFirstNameRef = useRef<HTMLInputElement | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidField, setInvalidField] = useState<
    "company" | "firstname" | null
  >(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [vendorCode, setVendorCode] = useState("");

  useEffect(() => {
    if (mode === "create") {
      setVendorCode(generateCustomId("vendor"));
    } else {
      setVendorCode(data?._id || "");
    }
  }, [mode, data]);

  // Mounted flag to ensure portal renders client-side only
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

  const formatDMY = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const mapStatusForModal = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Confirmed" as const;
      case "cancelled":
        // Align with BookingHistoryModal expected status union which uses 'Cancelled'
        return "Cancelled" as const;
      case "draft":
      default:
        return "In Progress" as const;
    }
  };

  const openHistoryForVendor = async () => {
    try {
      const vendorId = data?._id;
      if (!vendorId) return;
      const resp = await getVendorBookingHistory(vendorId, {
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        limit: 10,
      });
      const quotations = resp?.quotations || [];
      const mapped = quotations.map((q: any) => ({
        id: q.customId || q._id,
        bookingDate: q.createdAt ? formatDMY(q.createdAt) : "—",
        travelDate: q.travelDate ? String(q.travelDate) : "",
        status: mapStatusForModal(q.status),
        amount: q.totalAmount != null ? String(q.totalAmount) : "0",
      }));
      setHistoryBookings(mapped);
      setIsHistoryOpen(true);
    } catch (e) {
      console.error("Failed to open vendor history:", e);
      setHistoryBookings([]);
      setIsHistoryOpen(true);
    }
  };

  // Handle selecting files
  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);

    setAttachedFiles((prev) => [...prev, ...selected]);

    // Reset input so same file can be selected again
    if (fileRef.current) fileRef.current.value = "";
  };

  // Remove a selected file
  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [formData, setFormData] = useState<VendorData>({
    firstname: "",
    lastname: "",
    alias: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    GSTIN: "",
    companyName: "",
    address: "",
    openingBalance: "",
    balanceType: "debit",
    remarks: "",
    tier: "",
    countryCode: "+91",
  });

  useEffect(() => {
    if (data) {
      const [firstname = "", lastname = ""] =
        data.contactPerson?.split(" ") || [];
      setFormData({
        firstname,
        lastname,
        alias: data.alias || "",
        email: data.email || "",
        phone: data.phone || "",
        dateOfBirth: data.dateOfBirth || "",
        GSTIN: data.GSTIN || "",
        companyName: data.companyName || "",
        address: data.address || "",
        openingBalance: data.openingBalance?.toString() || "",
        balanceType: data.balanceType || "debit",
        remarks: data.remarks || "",
        tier: data.tier || "",
        countryCode: data.countryCode || "+91",
      });
      setTier(data.tier || "");
    } else {
      setFormData({
        firstname: "",
        lastname: "",
        alias: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        GSTIN: "",
        companyName: "",
        address: "",
        openingBalance: "",
        balanceType: "debit",
        remarks: "",
        tier: "",
        countryCode: "+91",
      });
      setTier("");
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate company name and poc first name
    if (!formData.companyName || String(formData.companyName).trim() === "") {
      setErrorMessage("Please enter company name to proceed");
      setInvalidField("company");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        companyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        companyRef.current?.focus();
      }, 100);
      return;
    }
    if (!formData.firstname || String(formData.firstname).trim() === "") {
      setErrorMessage("Please enter first name to proceed");
      setInvalidField("firstname");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        pocFirstNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        pocFirstNameRef.current?.focus();
      }, 100);
      return;
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
        `${formData.firstname} ${formData.lastname}`.trim()
      );
      formDataToSend.append("alias", formData.alias || "");
      formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formDataToSend.append("openingBalance", formData.openingBalance || "");
      formDataToSend.append("balanceType", formData.balanceType);
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("GSTIN", formData.GSTIN || "");
      formDataToSend.append("address", formData.address || "");
      formDataToSend.append("tier", tier || "");
      formDataToSend.append("remarks", formData.remarks || "");
      formDataToSend.append("countryCode", formData.countryCode || "+91");
      formDataToSend.append("customId", vendorCode || "");

      // Backend requires businessId as field
      formDataToSend.append("businessId", businessId);

      // Append up to 3 DOCUMENT FILES
      attachedFiles.forEach((file: File) => {
        formDataToSend.append("documents", file);
      });

      // Ensure phone includes country code (use form value or fallback state)
      const phoneValue = `${formData.countryCode || phoneCode}${
        formData.phone || ""
      }`;
      formDataToSend.set("phone", phoneValue);

      const created = await createVendor(formDataToSend);
      console.log("Vendor created successfully:", created);

      if (created?._id) {
        updateGeneralInfo({ vendor: created._id });
        const displayName =
          created.name || created.companyName || created.contactPerson || "";
        setLastAddedVendor?.({ id: created._id, name: displayName });

        onSuccess?.();
      }

      onCancel();
    } catch (error: any) {
      console.error("Error creating vendor:", error.message || error);
    }
  };

  const handleUpdateVendor = async () => {
    // Validate company name and poc first name before update
    if (!formData.companyName || String(formData.companyName).trim() === "") {
      setErrorMessage("Please enter company name to proceed");
      setInvalidField("company");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        companyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        companyRef.current?.focus();
      }, 100);
      return;
    }
    if (!formData.firstname || String(formData.firstname).trim() === "") {
      setErrorMessage("Please enter first name to proceed");
      setInvalidField("firstname");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        pocFirstNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        pocFirstNameRef.current?.focus();
      }, 100);
      return;
    }
    try {
      const vendorId = data?._id;

      if (!vendorId) {
        console.error("No vendor ID found");
        return;
      }

      const vendorData = {
        companyName: formData.companyName,
        contactPerson: `${formData.firstname} ${formData.lastname}`.trim(),
        alias: formData.alias || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        openingBalance: formData.openingBalance
          ? Number(formData.openingBalance)
          : undefined,
        balanceType: formData.balanceType,
        email: formData.email,
        phone: `${phoneCode}${formData.phone}`,
        GSTIN: formData.GSTIN,
        address: formData.address,
        tier: tier || undefined,
        remarks: formData.remarks || undefined,
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
        width="xl"
        position="right"
        showLinkButton={true}
      >
        <form
          className="space-y-6 p-4"
          onSubmit={
            mode === "create" ? handleSubmit : (e) => e.preventDefault()
          }
          ref={formRef as any}
          noValidate
        >
          {/* Error Alert Popup (reuse customer toast style) */}
          {mounted &&
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
            )}

          {/* ================= BASIC DETAILS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3 -mt-2">
            <h2 className="text-[0.75rem] font-medium mb-2">Basic Details</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={companyRef}
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, companyName: v });
                    if (invalidField === "company" && String(v).trim()) {
                      setInvalidField(null);
                    }
                  }}
                  placeholder="Enter Company Name"
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "company"
                      ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                      : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-400"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Company Email ID
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter Email ID"
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number
                </label>
                <div className="relative">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        countryCode: e.target.value,
                      })
                    }
                    className="absolute left-0 top-0 h-full pl-2 pr-2 py-2 border border-gray-300 rounded-l-md bg-white text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 cursor-pointer"
                    style={{ width: "58px" }}
                    disabled={readOnly}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter Contact Number"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md pl-17 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  GSTIN
                </label>
                <input
                  name="GSTIN"
                  value={formData.GSTIN}
                  onChange={(e) =>
                    setFormData({ ...formData, GSTIN: e.target.value })
                  }
                  placeholder="Please Provide Your GST No."
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>

            {/* Row 3 (reserved for single-width field if needed) */}
            <div className="flex flex-col gap-1 w-[22.3rem]"></div>
          </div>

          {/* ================= POC DETAILS (Optional) ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">
              POC Details (Optional)
            </h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={pocFirstNameRef}
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, firstname: v });
                    if (invalidField === "firstname" && String(v).trim()) {
                      setInvalidField(null);
                    }
                  }}
                  placeholder="Enter First Name"
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "firstname"
                      ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                      : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-400"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  name="lastname"
                  type="text"
                  value={formData.lastname}
                  onChange={(e) =>
                    setFormData({ ...formData, lastname: e.target.value })
                  }
                  placeholder="Enter Last Name"
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Nickname/Alias
                </label>
                <input
                  name="alias"
                  type="text"
                  value={formData.alias}
                  onChange={(e) =>
                    setFormData({ ...formData, alias: e.target.value })
                  }
                  placeholder="Enter Nickname/Alias"
                  disabled={readOnly}
                  className="w-full border border-gray-300 hover:border-green-400 focus:ring-green-400 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number
                </label>
                <div className="relative">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        countryCode: e.target.value,
                      })
                    }
                    className="absolute left-0 top-0 h-full pl-2 pr-2 py-2 border border-gray-300 rounded-l-md bg-white text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 cursor-pointer"
                    style={{ width: "58px" }}
                    disabled={readOnly}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    placeholder="Enter Contact Number"
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md pl-17 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400 hover:border-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Email ID
                </label>
                <input
                  placeholder="Enter Email ID"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
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
                />
              </div>
            </div>

            {/* Row 4 (optional single field placeholder) */}
            <div className="flex flex-col gap-1 w-[22.3rem]"></div>
          </div>

          {/* ================= BILLING ADDRESS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
            />
          </div>

          {/* ================= DOCUMENTS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Documents</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            <div className="flex flex-col gap-3 mt-2 items-start">
              <input
                type="file"
                ref={fileRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 flex gap-1 bg-white text-[#126ACB] border border-[#126ACB] rounded-md text-[0.75rem] hover:bg-gray-200"
              >
                <MdOutlineFileUpload size={16} /> Attach Files
              </button>

              {/* PREVIEW FILES */}
              <div className="-mt-2 flex flex-col gap-2 w-full">
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

              <div className="text-red-600 text-[0.65rem] -mt-4">
                Note: Maximum of 3 files can be uploaded
              </div>
            </div>
          </div>

          {/* ================= OPENING BALANCE ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Opening Balance</h2>
            <hr className="mt-1 mb-3 border-t border-gray-200" />

            <div className="flex items-center gap-6 mb-3">
              <label className="flex items-center gap-2 cursor-pointer text-[0.75rem]">
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

              <label className="flex items-center gap-2 cursor-pointer text-[0.75rem]">
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
                <span className="text-gray-500 mr-2 text-[0.75rem]">₹</span>
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
                        "Please enter only numbers. Letters and special characters are not allowed."
                      );
                    }
                  }}
                  placeholder={
                    balanceType === "debit"
                      ? "Enter Debit Amount"
                      : "Enter Credit Amount"
                  }
                  disabled={readOnly}
                  className="flex-1 outline-none text-gray-700 text-[0.75rem] hover:border-green-400 disabled:bg-gray-100 disabled:text-gray-700"
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

          {/* ================= TIER ================ */}
          <div className=" p-1 -mt-4">
            <h2 className="text-[0.75rem] font-medium mb-2">Rating</h2>

            <div className="flex flex-col">
              <DropDown
                options={[
                  { value: "tier1", label: "Rating 1" },
                  { value: "tier2", label: "Rating 2" },
                  { value: "tier3", label: "Rating 3" },
                  { value: "tier4", label: "Rating 4" },
                  { value: "tier5", label: "Rating 5" },
                ]}
                value={tier}
                onChange={(v) => setTier(v)}
                disabled={readOnly}
                customWidth="w-[10rem]"
                className=""
                // readOnly={readOnly}
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="border border-gray-200 rounded-xl p-3 -mt-2">
            <label className="block text-[0.75rem]  font-medium text-gray-700">
              Remarks
            </label>
            <hr className="mt-1 mb-2 border-t border-gray-200" />
            <textarea
              name="remarks"
              rows={5}
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              placeholder="Enter Your Remarks Here"
              className={`
            w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem]  mt-2 transition-colors
            focus:ring focus:ring-green-400 hover:border-green-400
          `}
              disabled={readOnly}
            />
          </div>

          {/* ================= ACTION BUTTONS ================ */}
          <div className="flex justify-end gap-2 pt-2">
            {mode === "view" ? (
              <Button
                text="Close"
                onClick={onCancel}
                bgColor="bg-gray-200"
                textColor="text-gray-700"
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
        </form>
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
