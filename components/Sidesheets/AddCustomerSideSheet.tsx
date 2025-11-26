"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { createCustomer } from "@/services/customerApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { updateCustomer } from "@/services/customerApi";

import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";

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
};

type AddCustomerSideSheetProps = {
  data?: CustomerData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit";
};

const AddCustomerSideSheet: React.FC<AddCustomerSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
}) => {
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");

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
      });
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
      });
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
        tier: undefined,
      };

      const response = await createCustomer(customerPayload);
      console.log("Customer created successfully:", response);

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
        title="Add Customer"
        width="xl"
        position="right"
      >
        <form className="space-y-6 p-4" onSubmit={handleSubmit}>
          {/* ================= BASIC DETAILS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Basic Details</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              {/* First Name */}
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Enter First Name"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Last Name */}
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Enter Last Name"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Alias */}
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Nickname/Alias <span className="text-red-500">*</span>
                </label>
                <input
                  name="alias"
                  value={formData.alias}
                  onChange={handleChange}
                  placeholder="Enter Nickname/Alias"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact Number */}
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter Contact Number"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Email ID */}
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email ID"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  placeholder="DD-MM-YYYY"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="Please Provide Your GST No."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] pr-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Company Name */}
              <div className="flex flex-col w-[20rem]">
                <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter Company Name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            <button
              type="button"
              className="px-2 py-2 bg-[#126ACB] text-white text-[0.75rem] rounded-md hover:bg-blue-800 flex items-center gap-1"
            >
              <CiCirclePlus size={14} /> Billing Address
            </button>
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
                  className="flex-1 outline-none text-gray-700 text-[0.75rem]"
                />
              </div>
            </div>
          </div>

          {/* ================= ACTION BUTTONS ================ */}
          <div className="flex justify-end gap-2 pt-2">
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
                className="px-4 py-1.5 rounded-md bg-[#114958] text-white text-[0.75rem] hover:bg-[#0f3d44]"
              >
                Add New Customer
              </button>
            )}
          </div>
        </form>
      </SideSheet>
    </>
  );
};

export default AddCustomerSideSheet;
