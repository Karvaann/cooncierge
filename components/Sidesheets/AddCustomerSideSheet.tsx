"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { createCustomer } from "@/services/customerApi";
import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";

type CustomerData = {
  firstname: string;
  lastname: string;
  nickname: string;
  contactnumber: string | "";
  emailId: string;
  dateofbirth: number | "";
  gstin: number | "";
  companyname: string;
  adhaarnumber: number | "";
  pan: number | string;
  passport: number | string;
  billingaddress: string | number;
  remarks: string;
};

type AddCustomerSideSheetProps = {
  data?: CustomerData | null;
  onCancel: () => void;
  isOpen: boolean;
};

const AddCustomerSideSheet: React.FC<AddCustomerSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
}) => {
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const adhaarRef = useRef<HTMLInputElement | null>(null);
  const panref = useRef<HTMLInputElement | null>(null);
  const passportref = useRef<HTMLInputElement | null>(null);
  const [filesAdded, setFilesAdded] = useState({
    adhaar: false,
    pan: false,
    passport: false,
  });

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");

  const [formData, setFormData] = useState<CustomerData>({
    firstname: "",
    lastname: "",
    nickname: "",
    contactnumber: "",
    emailId: "",
    dateofbirth: "",
    gstin: "",
    companyname: "",
    adhaarnumber: "",
    pan: "",
    passport: "",
    billingaddress: "",
    remarks: "",
  });

  const handleFileChange = (field: "adhaar" | "pan" | "passport") => {
    let ref: React.RefObject<HTMLInputElement | null>;
    if (field === "adhaar") ref = adhaarRef;
    else if (field === "pan") ref = panref;
    else ref = passportref;

    const file = ref.current?.files?.[0];
    setFilesAdded((prev) => ({
      ...prev,
      [field]: !!file,
    }));
  };

  useEffect(() => {
    if (data) {
      setFormData({
        firstname: data.firstname || "",
        lastname: data.lastname || "",
        nickname: data.nickname || "",
        contactnumber: data.contactnumber || "",
        emailId: data.emailId || "",
        dateofbirth: data.dateofbirth || "",
        gstin: data.gstin || "",
        companyname: data.companyname || "",
        adhaarnumber: data.adhaarnumber || "",
        pan: data.pan || "",
        passport: data.passport || "",
        billingaddress: data.billingaddress || "",
        remarks: data.remarks || "",
      });
    } else {
      // reset on unmount or data clear
      setFormData({
        firstname: "",
        lastname: "",
        nickname: "",
        contactnumber: "",
        emailId: "",
        dateofbirth: "",
        gstin: "",
        companyname: "",
        adhaarnumber: "",
        pan: "",
        passport: "",
        billingaddress: "",
        remarks: "",
      });
    }
  }, [data]);

  const handleSubmit = async () => {
    try {
      // Combine form data with derived/fixed fields
      const customerData = {
        ...formData,
        contactnumber: `${phoneCode}${formData.contactnumber}`, // prepend phone code
        ownerId: "507f1f77bcf86cd799439012", // Replace with actual ownerId
      };

      const response = await createCustomer(customerData);
      console.log("Customer created successfully:", response);

      onCancel();
    } catch (error: any) {
      console.error("Error creating customer:", error.message || error);
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
        <form className="space-y-6 p-6" onSubmit={handleSubmit}>
          {/* Customer Section */}
          <div className="border border-gray-200 rounded-[12px] p-4">
            <h2>Basic Details</h2>
            <hr className="mt-1 mb-4 border-t border-gray-200" />

            {/* First row: 3 fields side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstname"
                  placeholder="Enter First Name"
                  required
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="lastname"
                  placeholder="Enter Last Name"
                  required
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700">
                  Nickname/Alias <span className="text-red-500">*</span>
                </label>
                <input
                  name="nickname"
                  placeholder="Enter Nickname/Alias"
                  required
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Second row: next 3 fields side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
                </label>

                <input
                  name="contactnumber"
                  placeholder="Enter Contact Number"
                  required
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="emailId"
                  placeholder="Enter Email ID"
                  required
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  name="dateofbirth"
                  placeholder="DD-MM-YYYY"
                  required
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Company Section */}
          <div className="border border-gray-200 rounded-[12px] p-4">
            <h2>Company Details (Optional)</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />
            <label className="block text-sm font-medium text-gray-700 mt-2">
              GSTIN
            </label>

            <div className="flex items-center mt-1">
              <div className="flex ">
                <div className="w-[300px]">
                  <input
                    name="gstin"
                    placeholder="Please Provide Your GST No."
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  className="px-1 py-1 w-25 bg-[#126ACB] text-white rounded-md text-sm hover:bg-blue-800 relative z-10 "
                >
                  Fetch
                </button>
              </div>
            </div>

            <div className=" ml-115 mt-[-70px]">
              <label className="block text-sm font-medium text-gray-700 mt-2 mb-[-5px]">
                Company Name
              </label>

              <div className="flex items-center gap-2 mt-2 w-full">
                <div className="w-[300px]">
                  <input
                    name="companyname"
                    placeholder="Enter Company Name"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* ID Proofs Section */}
          <div className="border border-gray-200 rounded-[12px] p-4">
            <h2>ID Proofs</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            <div className="flex flex-col gap-6 mt-3">
              <div className="flex gap-5">
                <div className="flex flex-col gap-1 w-full">
                  <label className="block text-xs text-gray-500 mt-2">
                    ADHAAR <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <div className="w-[300px]">
                      <input
                        id="adhaaruploader"
                        name="adhaarnumber"
                        type="text"
                        placeholder="Enter ADHAAR Number"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                      />
                    </div>
                    <input
                      type="file"
                      ref={adhaarRef}
                      className="hidden"
                      onChange={() => handleFileChange("adhaar")}
                    />
                    <button
                      type="button"
                      onClick={() => adhaarRef.current?.click()}
                      className="px-3 py-2 flex gap-1 bg-[#126ACB] text-white rounded-md text-sm hover:bg-blue-800"
                    >
                      <MdOutlineFileUpload size={20} /> Upload
                    </button>
                    {filesAdded.adhaar && (
                      <div className="text-sm text-green-600 mt-1">
                        {" "}
                        File has been added{" "}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full">
                  <label className="block text-xs text-gray-500 mt-2">
                    PAN CARD <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <div className="w-[300px]">
                      <input
                        name="pan"
                        placeholder="Enter PAN Number"
                        required
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                      />
                    </div>
                    <input
                      type="file"
                      ref={panref}
                      className="hidden"
                      onChange={() => handleFileChange("pan")}
                    />
                    <button
                      type="button"
                      onClick={() => panref.current?.click()}
                      className="px-3 py-2 flex gap-1 bg-[#126ACB] text-white rounded-md text-sm hover:bg-blue-800"
                    >
                      <MdOutlineFileUpload size={20} /> Upload
                    </button>
                    {filesAdded.pan && (
                      <div className="text-sm text-green-600 mt-1">
                        {" "}
                        File has been added{" "}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-xs text-gray-500">
                  Passport <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center w-full">
                  <div className="w-[300px]">
                    <input
                      name="passport"
                      placeholder="Enter Passport Number"
                      required
                      type="number"
                      className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none"
                    />
                  </div>
                  <input
                    type="file"
                    ref={passportref}
                    className="hidden"
                    onChange={() => handleFileChange("passport")}
                  />
                  <button
                    type="button"
                    onClick={() => passportref.current?.click()}
                    className="px-3 py-2 flex gap-1 bg-[#126ACB] text-white rounded-md text-sm hover:bg-blue-800"
                  >
                    <MdOutlineFileUpload size={20} /> Upload
                  </button>
                  {filesAdded.passport && (
                    <div className="text-sm text-green-600 mt-1">
                      {" "}
                      File has been added{" "}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-[12px] p-4">
            <label className="block text-sm font-medium text-gray-700">
              Billing Address
            </label>
            <hr className="mt-1 mb-2 border-t border-gray-200" />
            <button
              type="button"
              className="px-3 flex gap-1 py-2 mt-2 bg-[#126ACB] text-white rounded-md text-sm hover:bg-blue-800"
            >
              {" "}
              <CiCirclePlus size={20} /> Billing Address{" "}
            </button>
          </div>

          {/* Opening Balance Section */}

          <div className="border border-gray-200 rounded-[12px] p-4">
            <h2>Opening Balance</h2>
            <hr className="mt-1 mb-4 border-t border-gray-200" />

            <div className="flex items-center gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="balanceType"
                  value="debit"
                  checked={balanceType === "debit"}
                  onChange={() => setBalanceType("debit")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">Debit</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="balanceType"
                  value="credit"
                  checked={balanceType === "credit"}
                  onChange={() => setBalanceType("credit")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Credit
                </span>
              </label>
            </div>

            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
                <span className="text-gray-500 mr-2">₹</span>
                <input
                  type="text"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder={
                    balanceType === "debit"
                      ? "Enter Debit Amount"
                      : "Enter Credit Amount"
                  }
                  className="flex-1 outline-none text-gray-700"
                />
              </div>
              <div className="absolute right-3 top-2 text-sm font-medium">
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded-md bg-[#114958] text-white hover:bg-[#0f3d44]"
              onClick={handleSubmit}
            >
              Add New Customer
            </button>
          </div>
        </form>
      </SideSheet>
    </>
  );
};

export default AddCustomerSideSheet;
