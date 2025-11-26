"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import ConfirmationModal from "../popups/ConfirmationModal";
import TransferDataModal from "../Modals/TransferDataModal";
import { createOrUpdateUser } from "@/services/userApi";
import { getAuthUser } from "@/services/storage/authStorage";

type TeamData = {
  _id?: string;
  name?: string;
  firstname: string;
  lastname: string;
  alias: string;
  gender: string;
  emergencyContactNumber: string;
  countryCode: string;
  workContactNumber: string;
  workEmailId: string;
  dateOfBirth: string;
  designation: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  address: string;
  remarks: string;
};

type AddTeamSideSheetProps = {
  data?: TeamData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit";
};

const AddTeamSideSheet: React.FC<AddTeamSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [formData, setFormData] = useState<TeamData>({
    firstname: "",
    lastname: "",
    alias: "",
    gender: "",
    emergencyContactNumber: "",
    countryCode: "+91",
    workContactNumber: "",
    workEmailId: "",
    dateOfBirth: "",
    designation: "",
    dateOfJoining: "",
    dateOfLeaving: "",
    address: "",
    remarks: "",
  });

  const handleConfirmModalOpen = () => {
    setIsConfirmationModalOpen(true);
  };

  const handleTransferModalOpen = () => {
    setIsTransferModalOpen(true);
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
      const [firstname = "", lastname = ""] = data.name?.split(" ") || [];
      setFormData({
        firstname,
        lastname,
        alias: data.alias || "",
        gender: data.gender || "",
        emergencyContactNumber: data.emergencyContactNumber || "",
        countryCode: data.countryCode || "+91",
        workContactNumber: data.workContactNumber || "",
        workEmailId: data.workEmailId || "",
        dateOfBirth: data.dateOfBirth || "",
        designation: data.designation || "",
        dateOfJoining: data.dateOfJoining || "",
        dateOfLeaving: data.dateOfLeaving || "",
        address: data.address || "",
        remarks: data.remarks || "",
      });
    } else {
      setFormData({
        firstname: "",
        lastname: "",
        alias: "",
        gender: "",
        emergencyContactNumber: "",
        countryCode: "+91",
        workContactNumber: "",
        workEmailId: "",
        dateOfBirth: "",
        designation: "",
        dateOfJoining: "",
        dateOfLeaving: "",
        address: "",
        remarks: "",
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getAuthUser() as any;
    const roleId = user?.roleId;

    const businessId = user?.businessId;
    try {
      const payload = {
        mobile: formData.workContactNumber,
        phoneCode: Number(formData.countryCode.replace("+", "")),

        email: formData.workEmailId,
        gender: formData.gender,
        designation: formData.designation,

        name: `${formData.firstname} ${formData.lastname}`.trim(),
        alias: formData.alias || undefined,
        emergencyContact: formData.emergencyContactNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        dateOfJoining: formData.dateOfJoining || undefined,
        dateOfLeaving: formData.dateOfLeaving || undefined,
        address: formData.address || undefined,

        businessId: businessId, // ✔ replace with actual
        roleId: roleId, // ✔ assign real role (e.g. Team Member)
      };

      console.log("FINAL USER PAYLOAD:", payload);

      const response = await createOrUpdateUser(payload);

      if (response.success) {
        console.log("Team(user) created successfully", response.data);
        onCancel();
      } else {
        console.error("Failed to create team user", response);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err.message || err);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const userId = data?._id;

      if (!userId) {
        console.error("No user ID found");
        return;
      }

      const user = getAuthUser() as any;
      const roleId = user?.roleId;
      const businessId = user?.businessId;

      const payload = {
        _id: userId, // Include the user ID for update
        mobile: formData.workContactNumber,
        phoneCode: Number(formData.countryCode.replace("+", "")),
        email: formData.workEmailId,
        gender: formData.gender,
        designation: formData.designation,
        name: `${formData.firstname} ${formData.lastname}`.trim(),
        alias: formData.alias || undefined,
        emergencyContact: formData.emergencyContactNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        dateOfJoining: formData.dateOfJoining || undefined,
        dateOfLeaving: formData.dateOfLeaving || undefined,
        address: formData.address || undefined,
        businessId: businessId,
        roleId: roleId,
        // REQUIRED FIELDS
        password: "TempPassword@123",
        userType: "business_user",
      };

      console.log("UPDATING USER WITH PAYLOAD:", payload);

      const response = await createOrUpdateUser(payload);

      if (response.success) {
        console.log("Team member updated successfully", response.data);
        onCancel();
      } else {
        console.error("Failed to update team member", response);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err.message || err);
    }
  };

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
          {/* ================= STATUS DROPDOWN ================
          <div className="flex flex-col gap-1">
            <select
              name="status"
              required
              onChange={(e) => {
                if (e.target.value === "former") {
                  handleTransferModalOpen();
                }
                setFormData({ ...formData, status: e.target.value });
              }}
              className="w-[15rem] border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="disabled">Select Status</option>
              <option value="current">Current</option>
              <option value="former">Former</option>
            </select>
          </div> */}

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
                  value={formData.firstname}
                  onChange={(e) =>
                    setFormData({ ...formData, firstname: e.target.value })
                  }
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
                  value={formData.lastname}
                  onChange={(e) =>
                    setFormData({ ...formData, lastname: e.target.value })
                  }
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
                  name="dateOfBirth"
                  placeholder="DD-MM-YYYY"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
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
                      setFormData({
                        ...formData,
                        countryCode: e.target.value,
                      })
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
                  value={formData.alias}
                  onChange={(e) =>
                    setFormData({ ...formData, alias: e.target.value })
                  }
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
                      setFormData({
                        ...formData,
                        countryCode: e.target.value,
                      })
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
                    value={formData.workContactNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workContactNumber: e.target.value,
                      })
                    }
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
                  value={formData.workEmailId}
                  onChange={(e) =>
                    setFormData({ ...formData, workEmailId: e.target.value })
                  }
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
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
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
                  value={formData.dateOfJoining}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfJoining: e.target.value })
                  }
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
                  value={formData.dateOfLeaving}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfLeaving: e.target.value })
                  }
                  placeholder="DD-MM-YYYY"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ================= DOCUMENTS ================ */}
          {/* <div className="border border-gray-200 rounded-[12px] p-3">
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
          </div> */}

          {/* ================= REMARKS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <label className="block text-[0.75rem] font-medium text-gray-700">
              Remarks
            </label>
            <hr className="mt-1 mb-2 border-t border-gray-200" />
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
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
            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-[#0D4B37] text-white rounded-lg hover:bg-green-900 text-[0.75rem]"
              >
                Update Team Member
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-1.5 rounded-md bg-[#114958] text-white text-[0.75rem] hover:bg-[#0f3d44]"
              >
                Add New Team Member
              </button>
            )}
          </div>
        </form>
      </SideSheet>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        title="Are you sure Arun Srivastava is no longer part of Company ABC?"
        cancelText="No"
        confirmText="Yes"
        onConfirm={() => console.log("Confirm clicked")}
        confirmButtonColor="bg-green-600"
      />

      <TransferDataModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </>
  );
};

export default AddTeamSideSheet;
