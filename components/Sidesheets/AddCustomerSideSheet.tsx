"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { createCustomer } from "@/services/customerApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { updateCustomer } from "@/services/customerApi";
import { useBooking } from "@/context/BookingContext";

import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { LuSave } from "react-icons/lu";

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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    // Reset input value to allow re-uploading same file
    if (fileRef.current) fileRef.current.value = "";
  };

  // Handle file removal
  const handleDeleteFile = () => {
    setAttachedFile(null);
    if (fileRef.current) fileRef.current.value = "";
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
    const user = getAuthUser() as any;
    const ownerId = user?._id;
    const businessId = user?.businessId;

    try {
      const customerPayload = {
        name: `${formData.firstname} ${formData.lastname}`.trim(), // full name
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
        balanceType: balanceAmount ? balanceType : undefined,
        businessId: businessId, // put actual business id
        ownerId: ownerId,
        tier: tier || undefined,
        remarks: formData.remarks || undefined,
      };

      const response = await createCustomer(customerPayload);
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
        title={
          mode === "view"
            ? "Customer Details"
            : mode === "edit"
            ? "Edit Customer"
            : "Add Customer"
        }
        width="xl"
        position="right"
        showLinkButton={true}
      >
        <form
          className="space-y-6 p-4"
          onSubmit={handleSubmit}
          ref={formRef as any}
        >
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
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Enter First Name"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="lastname"
                  type="text"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Enter Last Name"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>

            {/* Row 2: Alias + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Nickname/Alias <span className="text-red-500">*</span>
                </label>
                <input
                  name="alias"
                  type="text"
                  value={formData.alias}
                  onChange={handleChange}
                  placeholder="Enter Nickname/Alias"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter Contact Number"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>

            {/* Row 3: Email + DOB */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email ID"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] pr-16 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
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
                  className="w-3 h-3 text-blue-600"
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
                  className="w-3 h-3 text-blue-600"
                  disabled={readOnly}
                />
                <span className="text-gray-700">Credit</span>
              </label>
            </div>

            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-blue-500">
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
            <h2 className="text-[0.75rem] font-medium mb-2">Rank</h2>

            <div className="flex flex-col">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                disabled={readOnly}
                className="w-[10rem] border border-gray-300 rounded-md px-3 py-1.5 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-700"
              >
                <option value="">Select Rank</option>
                <option value="tier1">Rank 1</option>
                <option value="tier2">Rank 2</option>
                <option value="tier3">Rank 3</option>
                <option value="tier4">Rank 4</option>
                <option value="tier5">Rank 5</option>
              </select>
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
            focus:ring focus:ring-blue-200
            disabled:bg-gray-100 disabled:text-gray-700
          `}
            />
          </div>

          {/* ================= ACTION BUTTONS ================ */}
          <div className="flex justify-end gap-2 pt-2">
            {mode === "view" ? (
              <button
                type="button"
                className="px-4 py-1.5 rounded-md border border-gray-300 text-gray-700 text-[0.75rem] hover:bg-gray-100"
                onClick={onCancel}
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-md border border-gray-300 text-gray-700 text-[0.75rem] hover:bg-gray-100"
                  onClick={onCancel}
                >
                  Cancel
                </button>

                {mode === "edit" ? (
                  <button
                    type="button" // Changed from default submit
                    onClick={handleUpdateCustomer}
                    className="px-4 py-2 bg-[#0D4B37] text-white rounded-lg hover:bg-green-900 text-[0.75rem]"
                  >
                    Update Customer
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-1.5 gap-1 rounded-md bg-[#0D4B37] text-white text-[0.75rem] hover:bg-[#0f3d44]"
                  >
                    <LuSave className="mr-1 inline-block" size={16} />
                    Save
                  </button>
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
