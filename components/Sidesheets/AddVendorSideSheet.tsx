"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { createVendor } from "@/services/vendorApi";
import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";

type VendorData = {
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
};

type AddVendorSideSheetProps = {
  data?: VendorData | null;
  onCancel: () => void;
  isOpen: boolean;
};

const AddVendorSideSheet: React.FC<AddVendorSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
}) => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const [phone, setPhone] = useState<string>("");
  const [company, setcompany] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");

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

  const [formData, setFormData] = useState<VendorData>({
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
  });

  useEffect(() => {
    if (data) {
      setFormData({
        firstname: data.firstname || "",
        lastname: data.lastname || "",
        nickname: data.nickname || "",
        contactnumber: data.contactnumber || "",
        emailId: data.emailId || "",
        dateofbirth: data.dateofbirth || "",
        companyemail: data.companyemail || "",
        document: data.document || "",
        gstin: data.gstin || "",
        companyname: data.companyname || "",
        billingaddress: data.billingaddress || "",
      });
    } else {
      // Reset on unmount or data clear
      setFormData({
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
      });
    }
  }, [data]);

  const handleSubmit = async () => {
    try {
      const vendorData = {
        name,
        email,
        phone: `${phoneCode}${phone}`,
        company,
      };

      const response = await createVendor(vendorData);
      console.log("Customer created successfully:", response);

      // close the sidesheet after success
      onCancel();

      // trigger refresh or toast notification
    } catch (error: any) {
      console.error("Error creating customer:", error.message || error);
    }
  };

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={onCancel}
        title="Add Vendor"
        width="xl"
        position="right"
      >
        <form className="space-y-6 p-4" onSubmit={handleSubmit}>
          {/* ================= BASIC DETAILS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Basic Details</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            {/* First row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="companyname"
                  placeholder="Enter Company Name"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Company Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="companyemail"
                  placeholder="Enter Email ID"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="contactnumber"
                  placeholder="Enter Contact Number"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* GSTIN row */}
            <div className="flex flex-col gap-1 mt-2">
              <label className="block text-[0.75rem] font-medium text-gray-700">
                GSTIN
              </label>
              <div className="flex gap-2">
                <input
                  name="gstin"
                  placeholder="Please Provide Your GST No."
                  className="w-[20rem] border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 bg-[#126ACB] text-white text-[0.75rem] rounded-md hover:bg-blue-800"
                >
                  Fetch
                </button>
              </div>
            </div>
          </div>

          {/* ================= POC DETAILS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">
              POC Details (Optional)
            </h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            {/* First row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstname"
                  placeholder="Enter First Name"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="lastname"
                  placeholder="Enter Last Name"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Nickname/Alias <span className="text-red-500">*</span>
                </label>
                <input
                  name="nickname"
                  placeholder="Enter Nickname/Alias"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Second row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="contactnumber"
                  placeholder="Enter Contact Number"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="emailId"
                  placeholder="Enter Email ID"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  name="dateofbirth"
                  placeholder="DD-MM-YYYY"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
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

              {attachedFile && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 w-fit">
                  <span className="text-gray-700 text-[0.7rem] font-medium truncate">
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
              <div className="absolute right-3 top-2 text-[0.7rem] font-medium">
                {balanceType === "debit" ? (
                  <span className="text-red-500">
                    Customer pays you ₹{balanceAmount || ""}
                  </span>
                ) : (
                  <span className="text-green-500">
                    You pay the customer ₹{balanceAmount || ""}
                  </span>
                )}
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
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-[#114958] text-white text-[0.75rem] hover:bg-[#0f3d44]"
            >
              Add New Vendor
            </button>
          </div>
        </form>
      </SideSheet>
    </>
  );
};

export default AddVendorSideSheet;
