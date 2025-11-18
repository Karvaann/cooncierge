"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { CiCirclePlus } from "react-icons/ci";
import { FiTrash2 } from "react-icons/fi";
import { MdOutlineFileUpload } from "react-icons/md";
import ConfirmationModal from "../popups/ConfirmationModal";

type TeamData = {
  firstname: string;
  lastname: string;
  gender: string;
  alias: string;
  status: string;
  emergencyContactNumber: string | "";
  countryCode: string | "+91";
  workContactNumber: string | "";
  workEmailId: string;
  dateOfBirth: number | "";
  designation: string | "";
  dateOfJoining: number | "";
  dateOfLeaving: number | "";
  document: number | "";
  remarks: string;
};

type AddTeamSideSheetProps = {
  data?: TeamData | null;
  onCancel: () => void;
  isOpen: boolean;
};

const AddTeamSideSheet: React.FC<AddTeamSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
}) => {
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const [formData, setFormData] = useState<TeamData>({
    firstname: "",
    lastname: "",
    alias: "",
    status: "",
    emergencyContactNumber: "",
    countryCode: "+91",
    workContactNumber: "",
    workEmailId: "",
    dateOfBirth: "",
    gender: "",
    dateOfJoining: "",
    dateOfLeaving: "",
    document: "",
    designation: "",
    remarks: "",
  });

  const handleConfirmModalOpen = () => {
    setIsConfirmationModalOpen(true);
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
      setFormData({
        firstname: data.firstname || "",
        lastname: data.lastname || "",
        gender: data.gender || "",
        alias: data.alias || "",
        status: data.status || "",
        emergencyContactNumber: data.emergencyContactNumber || "",
        countryCode: data.countryCode || "+91",
        workContactNumber: data.workContactNumber || "",
        workEmailId: data.workEmailId || "",
        dateOfBirth: data.dateOfBirth || "",
        dateOfLeaving: data.dateOfLeaving || "",
        designation: data.designation || "",
        dateOfJoining: data.dateOfJoining || "",
        document: data.document || "",
        remarks: data.remarks || "",
      });
    } else {
      // reset on unmount or data clear
      setFormData({
        firstname: "",
        lastname: "",
        gender: "",
        alias: "",
        status: "",
        emergencyContactNumber: "",
        countryCode: "+91",
        workContactNumber: "",
        workEmailId: "",
        dateOfBirth: "",
        dateOfLeaving: "",
        designation: "",
        dateOfJoining: "",
        document: "",
        remarks: "",
      });
    }
  }, [data]);

  //   const handleSubmit = async () => {
  //     try {
  //       // Combine form data with derived/fixed fields
  //       const customerData = {
  //         ...formData,
  //         contactnumber: `${phoneCode}${formData.contactnumber}`, // prepend phone code
  //         ownerId: "507f1f77bcf86cd799439012", // Replace with actual ownerId
  //       };

  //       const response = await createCustomer(customerData);
  //       console.log("Customer created successfully:", response);

  //       onCancel();
  //     } catch (error: any) {
  //       console.error("Error creating customer:", error.message || error);
  //     }
  //   };

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={onCancel}
        title="Add Team Member"
        width="xl"
        position="right"
      >
        <form className="space-y-6 p-4">
          {/* ================= STATUS DROPDOWN ================ */}
          <div className="flex flex-col gap-1">
            <select
              name="status"
              required
              onChange={(e) => {
                if (e.target.value === "former") {
                  handleConfirmModalOpen();
                }
                setFormData({ ...formData, status: e.target.value });
              }}
              className="w-[250px] border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="disabled">Select Status</option>
              <option value="current">Current</option>
              <option value="former">Former</option>
            </select>
          </div>

          {/* ================= BASIC DETAILS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Basic Details</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstname"
                  placeholder="Enter First Name"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  name="dateofbirth"
                  placeholder="DD-MM-YYYY"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="disabled">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Emergency Contact */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Emergency Contact Number
                </label>
                <div className="relative">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value })
                    }
                    className="absolute left-0 top-0 h-full px-3 py-2 border border-gray-300 rounded-l-md bg-white text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    style={{ width: "70px" }}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactNumber: e.target.value,
                      })
                    }
                    placeholder="Enter Contact Number"
                    required
                    className="w-[22.3rem] border border-gray-300 rounded-md pl-20 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= WORK INFO ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Work Info</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Alias
                </label>
                <input
                  name="alias"
                  placeholder="Enter Alias"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Work Contact Number
                </label>
                <div className="relative">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value })
                    }
                    className="absolute left-0 top-0 h-full px-3 py-2 border border-gray-300 rounded-l-md bg-white text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    style={{ width: "70px" }}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    name="workContactNumber"
                    placeholder="Enter Contact Number"
                    required
                    className="w-full border border-gray-300 rounded-md pl-20 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Work Email ID
                </label>
                <input
                  name="workEmailId"
                  placeholder="Enter Email ID"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Designation
                </label>
                <input
                  name="designation"
                  placeholder="Enter Designation"
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Date Of Joining
                </label>
                <input
                  name="dateOfJoining"
                  placeholder="DD-MM-YYYY"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Date Of Leaving
                </label>
                <input
                  name="dateOfLeaving"
                  placeholder="DD-MM-YYYY"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

          {/* ================= REMARKS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <label className="block text-[0.75rem] font-medium text-gray-700">
              Remarks
            </label>
            <hr className="mt-1 mb-2 border-t border-gray-200" />
            <textarea
              name="remarks"
              rows={5}
              placeholder="Enter Your Remarks Here"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem] mt-2 transition-colors focus:ring focus:ring-blue-200"
            />
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
              type="button"
              className="px-4 py-1.5 rounded-md bg-[#114958] text-white text-[0.75rem] hover:bg-[#0f3d44]"
            >
              Add New Team Member
            </button>
          </div>
        </form>

        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          title="Are you sure Arun Srivastava is no longer part of Company ABC?"
          cancelText="No"
          confirmText="Yes"
          onConfirm={() => console.log("Confirm clicked")}
          confirmButtonColor="bg-green-600"
        />
      </SideSheet>
    </>
  );
};

export default AddTeamSideSheet;
