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
import generateCustomId from "@/utils/helper";

type CustomerData = {
  _id?: string;
  name?: string;
  firstname: string;
  lastname: string;
  alias: string;
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
};

const AddCustomerSideSheet: React.FC<AddCustomerSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
  formRef,
}) => {
  const { updateGeneralInfo, setLastAddedCustomer } = useBooking();
  const readOnly = mode === "view";
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const [tier, setTier] = useState<string>("");

  const [formData, setFormData] = useState<CustomerData>({
    name: "",
    firstname: "",
    lastname: "",
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
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidField, setInvalidField] = useState<
    "firstname" | "lastname" | null
  >(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [customerCode, setCustomerCode] = useState("");

  useEffect(() => {
    if (mode === "create") {
      setCustomerCode(generateCustomId("customer"));
    } else {
      setCustomerCode(data?._id || "");
    }
  }, [mode, data]);

  // Mounted flag to ensure portal renders client-side only
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear invalid state when user types into required fields
    if (name === "firstname" && value.trim() && invalidField === "firstname") {
      setInvalidField(null);
    }
    if (name === "lastname" && value.trim() && invalidField === "lastname") {
      setInvalidField(null);
    }
  };

  // Handle selecting multiple files
  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);

    setAttachedFiles((prev) => [...prev, ...selected]);

    // Reset so selecting the same file again is possible
    if (fileRef.current) fileRef.current.value = "";
  };

  // Remove one file
  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (data) {
      // Split full name safely
      const [firstname = "", lastname = ""] = data.name?.split(" ") || [];

      setFormData({
        firstname,
        lastname,
        alias: data.alias || "",
        phone: data.phone || "",
        email: data.email || "",
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : "",
        gstin: data.gstin || "",
        companyName: data.companyName || "",
        address: data.address || "",
        remarks: data.remarks || "",
        tier: data.tier || "",
      });
      setTier(data.tier || "");
      setBalanceAmount(data.openingBalance ? String(data.openingBalance) : "");
      setBalanceType(data.balanceType || "debit");
    } else {
      setFormData({
        firstname: "",
        lastname: "",
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
      setTier("");
      setBalanceAmount("");
      setBalanceType("debit");
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields: if missing, show toast and focus the field
    if (!formData.firstname || String(formData.firstname).trim() === "") {
      setErrorMessage("Please enter first name to proceed");
      setInvalidField("firstname");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        firstNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        firstNameRef.current?.focus();
      }, 100);
      return;
    }
    if (!formData.lastname || String(formData.lastname).trim() === "") {
      setErrorMessage("Please enter last name to proceed");
      setInvalidField("lastname");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        lastNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        lastNameRef.current?.focus();
      }, 100);
      return;
    }
    const user = getAuthUser() as any;
    const ownerId = user?._id;
    const businessId = user?.businessId;

    try {
      // Build FormData
      const formDataToSend = new FormData();

      // APPEND every customer field
      formDataToSend.append(
        "name",
        `${formData.firstname} ${formData.lastname}`.trim()
      );
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
      // Include generated custom customer code so backend stores it in `customId`
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
      }

      onCancel();
    } catch (error: any) {
      console.error("Error creating customer:", error.message || error);
    }
  };

  const handleUpdateCustomer = async () => {
    // Validate required fields before update
    if (!formData.firstname || String(formData.firstname).trim() === "") {
      setErrorMessage("Please enter first name to proceed");
      setInvalidField("firstname");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        firstNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        firstNameRef.current?.focus();
      }, 100);
      return;
    }
    if (!formData.lastname || String(formData.lastname).trim() === "") {
      setErrorMessage("Please enter last name to proceed");
      setInvalidField("lastname");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        lastNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        lastNameRef.current?.focus();
      }, 100);
      return;
    }
    try {
      // data.customerID is actually the _id from your backend
      const customerId = data?._id;

      if (!customerId) {
        console.error("No customer ID found");
        return;
      }

      const updatePayload = {
        name: `${formData.firstname} ${formData.lastname}`.trim(),
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
      };

      const updated = await updateCustomer(customerId, updatePayload);
      console.log("Customer updated:", updated);
      onCancel(); // close sheet
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={onCancel}
        title={`${
          mode === "view"
            ? "Customer Details"
            : mode === "edit"
            ? "Edit Customer"
            : "Add Customer"
        }${customerCode ? " | " + customerCode : ""}`}
        width="xl"
        position="right"
        showLinkButton={true}
      >
        <form
          className="space-y-6 p-4"
          onSubmit={handleSubmit}
          ref={formRef as any}
          noValidate
        >
          {/* Error Alert Popup (reuse login style) */}
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

            {/* Row 1: First + Last */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstNameRef}
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Enter First Name"
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[0.75rem] focus:outline-none hover:border-green-400 focus:ring-green-400 focus:ring-1 disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "firstname"
                      ? "border border-red-300 focus:ring-red-200"
                      : "border border-gray-300 "
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={lastNameRef}
                  name="lastname"
                  type="text"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Enter Last Name"
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[0.75rem] focus:outline-none hover:border-green-400 focus:ring-green-400 focus:ring-1 disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "lastname"
                      ? "border border-red-300 focus:ring-red-200"
                      : "border border-gray-300 focus:ring-green-400"
                  }`}
                />
              </div>
            </div>

            {/* Row 2: Alias + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Nickname/Alias
                </label>
                <input
                  name="alias"
                  type="text"
                  value={formData.alias}
                  onChange={handleChange}
                  placeholder="Enter Nickname/Alias"
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number
                </label>
                <div className="relative">
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
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
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter Contact Number"
                    disabled={readOnly}
                    className="w-full pl-17 border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Email + DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Email ID
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email ID"
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
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
          </div>

          {/* ================= COMPANY DETAILS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">
              Company Details (Optional)
            </h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            <div className="flex gap-6">
              {/* GSTIN */}
              <div className="flex flex-col w-[18rem] relative">
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  GSTIN
                </label>
                <input
                  name="gstin"
                  type="text"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="Please Provide Your GST No."
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] pr-16 focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>

              {/* Company Name */}
              <div className="flex flex-col w-[20rem]">
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter Company Name"
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* ================= DOCUMENTS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Documents</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            <input
              type="file"
              ref={fileRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
              multiple
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
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
              Note: Maximum of 3 files can be uploaded
            </div>
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
              className="w-full border border-gray-300 hover:border-green-400 focus:ring-green-400 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
            />
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
                  className="flex-1 outline-none text-gray-700 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
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
              onChange={handleChange}
              placeholder="Enter Your Remarks Here"
              disabled={readOnly}
              className={`
            w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem]  mt-2 transition-colors
            focus:ring hover:border-green-400 focus:ring-green-400
            disabled:bg-gray-100 disabled:text-gray-700
          `}
            />
          </div>

          {/* ================= ACTION BUTTONS ================ */}
          <div className="flex justify-end gap-2 pt-2">
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
        </form>
      </SideSheet>
    </>
  );
};

export default AddCustomerSideSheet;
