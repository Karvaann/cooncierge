"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SideSheet from "../SideSheet";
import ConfirmationModal from "../popups/ConfirmationModal";
import TransferDataModal from "../Modals/TransferDataModal";
import { createTeam, updateTeam } from "@/services/teamsApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { LuSave } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import Button from "../Button";
import SingleCalendar from "../SingleCalendar";
import DropDown from "../DropDown";
import { FaRegFolder } from "react-icons/fa";
import generateCustomId from "@/utils/helper";

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
  status?: "Current" | "Former";
};

type AddTeamSideSheetProps = {
  data?: TeamData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit" | "view";
};

const AddTeamSideSheet: React.FC<AddTeamSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode = "create",
}) => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Validation helpers / UI state for required fields (firstname, lastname, workEmailId)
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const workEmailRef = useRef<HTMLInputElement | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidField, setInvalidField] = useState<
    "firstname" | "lastname" | "workEmail" | null
  >(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [teamCode, setTeamCode] = useState("");

  useEffect(() => {
    if (mode === "create") {
      setTeamCode(generateCustomId("team"));
    } else {
      setTeamCode(data?._id || "");
    }
  }, [mode, data]);

  // Mounted flag to ensure portal renders client-side only
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const readOnly = mode === "view";

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
    status: "Current",
  });

  const handleConfirmModalOpen = () => {
    setIsConfirmationModalOpen(true);
  };

  const handleTransferModalOpen = () => {
    setIsTransferModalOpen(true);
  };

  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);

    // Enforce max 3 files
    const total = attachedFiles.length + selected.length;
    if (total > 3) {
      alert("Maximum 3 files can be uploaded");
      return;
    }

    setAttachedFiles((prev) => [...prev, ...selected]);

    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (data) {
      const [firstname = "", lastname = ""] = data.name?.split(" ") || [];
      setFormData({
        firstname,
        lastname,
        alias: data.alias || "",
        gender: data.gender || "",
        emergencyContactNumber:
          (data as any).emergencyContactNumber ||
          (data as any).emergencyContact ||
          "",
        countryCode: data.countryCode || "+91",
        workContactNumber:
          (data as any).workContactNumber || (data as any).phone || "",
        workEmailId: (data as any).workEmailId || (data as any).email || "",
        dateOfBirth: data.dateOfBirth || "",
        designation: data.designation || "",
        dateOfJoining: data.dateOfJoining || "",
        dateOfLeaving: data.dateOfLeaving || "",
        address: data.address || "",
        remarks: (data as any).remarks || "",
        status: data.status || "Current",
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
        status: "Current",
      });
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields: firstname, lastname, work email id
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
    if (!formData.workEmailId || String(formData.workEmailId).trim() === "") {
      setErrorMessage("Please enter work email to proceed");
      setInvalidField("workEmail");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        workEmailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        workEmailRef.current?.focus();
      }, 100);
      return;
    }
    const user = getAuthUser() as any;
    const roleId = user?.roleId;

    const businessId = user?.businessId;
    try {
      const formToSend = new FormData();

      // Text fields
      formToSend.append(
        "name",
        `${formData.firstname} ${formData.lastname}`.trim()
      );
      formToSend.append("email", formData.workEmailId);
      formToSend.append("phone", formData.workContactNumber);
      formToSend.append("gender", formData.gender || "");
      formToSend.append("designation", formData.designation || "");
      formToSend.append("alias", formData.alias || "");
      formToSend.append(
        "emergencyContact",
        formData.emergencyContactNumber || ""
      );
      formToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formToSend.append("dateOfJoining", formData.dateOfJoining || "");
      formToSend.append("dateOfLeaving", formData.dateOfLeaving || "");
      formToSend.append("address", formData.address || "");
      formToSend.append("remarks", formData.remarks || "");
      formToSend.append("status", formData.status || "Current");
      formToSend.append("customId", teamCode || "");

      // Required by backend
      formToSend.append("businessId", businessId);
      formToSend.append("roleId", roleId);

      // Documents
      attachedFiles.forEach((file) => {
        formToSend.append("documents", file);
      });

      const response = await createTeam(formToSend);
      if (response?._id) {
        console.log("Team created successfully", response);
        onCancel();
      } else {
        console.error("Failed to create team", response);
      }
    } catch (err: any) {
      console.error("Unexpected error:", err.message || err);
    }
  };

  const handleUpdateUser = async () => {
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
    if (!formData.workEmailId || String(formData.workEmailId).trim() === "") {
      setErrorMessage("Please enter work email to proceed");
      setInvalidField("workEmail");
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 4000);
      setTimeout(() => {
        workEmailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        workEmailRef.current?.focus();
      }, 100);
      return;
    }
    try {
      const teamId = data?._id;

      if (!teamId) {
        console.error("No team ID found");
        return;
      }

      const user = getAuthUser() as any;
      const roleId = user?.roleId;
      const businessId = user?.businessId;

      const payload = {
        name: `${formData.firstname} ${formData.lastname}`.trim(),
        email: formData.workEmailId,
        phone: formData.workContactNumber,
        gender: formData.gender || undefined,
        designation: formData.designation,
        alias: formData.alias || undefined,
        emergencyContact: formData.emergencyContactNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        dateOfJoining: formData.dateOfJoining || undefined,
        dateOfLeaving: formData.dateOfLeaving || undefined,
        address: formData.address || undefined,
        businessId: businessId,
        roleId: roleId,
      };

      console.log("UPDATING TEAM WITH PAYLOAD:", payload);

      const response = await updateTeam(teamId, payload);

      if (response?._id) {
        console.log("Team member updated successfully", response);
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
        title={`${
          mode === "view"
            ? "Team Member Details"
            : mode === "edit"
            ? "Edit Team Member"
            : "Add Team Member"
        }${teamCode ? " | " + teamCode : ""}`}
        width="xl"
        position="right"
        showLinkButton={true}
      >
        <form
          className="space-y-6 p-4"
          onSubmit={
            mode === "create" ? handleSubmit : (e) => e.preventDefault()
          }
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

          {/* ================= STATUS DROPDOWN ================ */}
          <div className="flex flex-col gap-1">
            <select
              name="status"
              required
              disabled={readOnly}
              onChange={(e) => {
                if (e.target.value === "former") {
                  // handleTransferModalOpen();
                }
                setFormData({
                  ...formData,
                  status: e.target.value === "current" ? "Current" : "Former",
                });
              }}
              className="w-[13rem] border border-gray-300 rounded-md px-3 py-1.5 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 hover:border-green-400 focus:ring-green-400"
            >
              <option value="disabled">Select Status</option>
              <option value="current">Current</option>
              <option value="former">Former</option>
            </select>
          </div>

          {/* ================= BASIC DETAILS ================ */}
          <div className="border border-gray-200 rounded-[12px] p-3">
            <h2 className="text-[0.75rem] font-medium mb-2">Personal Info</h2>
            <hr className="mt-1 mb-2 border-t border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={firstNameRef}
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, firstname: v });
                    if (invalidField === "firstname" && String(v).trim())
                      setInvalidField(null);
                  }}
                  placeholder="Enter First Name"
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[0.75rem] hover:border-green-400 text-gray-700 disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "firstname"
                      ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                      : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-400"
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
                  placeholder="Enter Last Name"
                  value={formData.lastname}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, lastname: v });
                    if (invalidField === "lastname" && String(v).trim())
                      setInvalidField(null);
                  }}
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[0.75rem] text-gray-700 hover:border-green-400 disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "lastname"
                      ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                      : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-400"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <SingleCalendar
                  label="Date of Birth"
                  value={formData.dateOfBirth || ""}
                  onChange={(iso) =>
                    setFormData((prev) => ({ ...prev, dateOfBirth: iso }))
                  }
                  placeholder="DD-MM-YYYY"
                  customWidth="w-full mt-1.5 py-2"
                  readOnly={readOnly}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Gender
                </label>
                {!readOnly ? (
                  <DropDown
                    options={[
                      { value: "", label: "Select Gender" },
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                    value={formData.gender}
                    onChange={(v) => setFormData({ ...formData, gender: v })}
                    customWidth="w-full mt-0 py-2"
                    className=""
                  />
                ) : (
                  <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 bg-gray-100 cursor-default">
                    {(() => {
                      const opt = [
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ].find((o) => o.value === formData.gender);
                      return opt ? opt.label : "Select Gender";
                    })()}
                  </div>
                )}
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
                    className="absolute left-0 top-0 h-full pl-2 pr-2 py-2 border border-gray-300 rounded-l-md bg-white text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400  focus:ring-green-400 cursor-pointer"
                    style={{ width: "58px" }}
                    disabled={readOnly}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    name="emergencyContactNumber"
                    type="text"
                    value={formData.emergencyContactNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactNumber: e.target.value,
                      })
                    }
                    placeholder="Enter Contact Number"
                    required
                    disabled={readOnly}
                    className="w-[22.3rem] border border-gray-300 rounded-md pl-20 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 hover:border-green-400  focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
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
                  type="text"
                  value={formData.alias}
                  onChange={(e) =>
                    setFormData({ ...formData, alias: e.target.value })
                  }
                  placeholder="Enter Alias"
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 hover:border-green-400  focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
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
                    className="absolute left-0 top-0 h-full pl-2 pr-2 py-2 border border-gray-300 rounded-l-md bg-white text-[0.75rem] focus:outline-none focus:ring-1 hover:border-green-400  focus:ring-green-400 cursor-pointer"
                    style={{ width: "58px" }}
                    disabled={readOnly}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    name="workContactNumber"
                    type="text"
                    value={formData.workContactNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workContactNumber: e.target.value,
                      })
                    }
                    placeholder="Enter Contact Number"
                    required
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md pl-20 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 hover:border-green-400  focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Work Email ID
                </label>
                <input
                  ref={workEmailRef}
                  name="workEmailId"
                  type="email"
                  value={formData.workEmailId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData({ ...formData, workEmailId: v });
                    if (invalidField === "workEmail" && String(v).trim())
                      setInvalidField(null);
                  }}
                  placeholder="Enter Email ID"
                  disabled={readOnly}
                  className={`w-full rounded-md px-3 py-2 text-[0.75rem] text-gray-700 hover:border-green-400  focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "workEmail"
                      ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                      : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-400"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Designation
                </label>
                <input
                  name="designation"
                  type="text"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="Enter Designation"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 hover:border-green-400  focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>

              <div className="flex flex-col gap-1">
                <SingleCalendar
                  label="Date Of Joining"
                  value={formData.dateOfJoining || ""}
                  onChange={(iso) =>
                    setFormData((prev) => ({ ...prev, dateOfJoining: iso }))
                  }
                  placeholder="DD-MM-YYYY"
                  customWidth="w-full"
                  readOnly={readOnly}
                />
              </div>

              <div className="flex flex-col gap-1">
                <SingleCalendar
                  label="Date Of Leaving"
                  value={formData.dateOfLeaving || ""}
                  onChange={(iso) =>
                    setFormData((prev) => ({ ...prev, dateOfLeaving: iso }))
                  }
                  placeholder="DD-MM-YYYY"
                  customWidth="w-full"
                  minDate={formData.dateOfJoining}
                  readOnly={readOnly}
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
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                multiple
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 mt-1 flex gap-1 bg-white text-[#126ACB] border border-[#126ACB] 
                 rounded-md text-[0.75rem] hover:bg-gray-200"
              >
                Attach Files
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

              <div className="text-red-600 text-[0.65rem] -mt-2">
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
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              rows={5}
              placeholder="Enter Your Remarks Here"
              disabled={readOnly}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem] mt-2 transition-colors focus:ring hover:border-green-400  focus:ring-green-400 disabled:bg-gray-100 disabled:text-gray-700"
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
            ) : mode === "edit" ? (
              <>
                <Button
                  text="Cancel"
                  onClick={onCancel}
                  bgColor="bg-white"
                  textColor="text-gray-700"
                  className="border border-gray-300 hover:bg-gray-100"
                />
                <Button
                  text="Update Team Member"
                  onClick={handleUpdateUser}
                  bgColor="bg-[#0D4B37]"
                  textColor="text-white"
                  className="hover:bg-green-900"
                />
              </>
            ) : (
              <>
                <Button
                  text="Cancel"
                  onClick={onCancel}
                  bgColor="bg-white"
                  textColor="text-gray-700"
                  className="border border-gray-300 hover:bg-gray-100"
                />
                <Button
                  text="Save"
                  onClick={() => handleSubmit}
                  icon={<LuSave size={16} />}
                  bgColor="bg-[#0D4B37]"
                  textColor="text-white"
                  className="hover:bg-[#0f3d44]"
                />
              </>
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
