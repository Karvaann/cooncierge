"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import {
  createVendor,
  updateVendor,
  getVendorBookingHistory,
} from "@/services/vendorApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { useBooking } from "@/context/BookingContext";

import { CiCirclePlus } from "react-icons/ci";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { LuSave } from "react-icons/lu";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { MdHistory } from "react-icons/md";

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
};

const AddVendorSideSheet: React.FC<AddVendorSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
  formRef,
}) => {
  const { updateGeneralInfo, setLastAddedVendor } = useBooking();
  const readOnly = mode === "view";
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const [phone, setPhone] = useState<string>("");
  const [company, setcompany] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");

  const [tier, setTier] = useState<string>("");

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyBookings, setHistoryBookings] = useState<
    {
      id: string;
      bookingDate: string;
      travelDate: string;
      status: "Successful" | "On Hold" | "In Progress" | "Cancelled";
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
        return "Successful" as const;
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
    const user = getAuthUser() as any;
    const businessId = user?.businessId;

    try {
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
        phone: `${formData.phone}`,
        GSTIN: formData.GSTIN,
        address: formData.address,
        businessId: businessId,
        tier: tier || undefined,
        remarks: formData.remarks || undefined,
      };

      const created = await createVendor(vendorData);
      console.log("Vendor created successfully:", created);

      if (created?._id) {
        updateGeneralInfo({ vendor: created._id });
        const displayName =
          created.name || created.companyName || created.contactPerson || "";
        setLastAddedVendor?.({ id: created._id, name: displayName });
      }

      onCancel();
    } catch (error: any) {
      console.error("Error creating vendor:", error.message || error);
    }
  };

  const handleUpdateVendor = async () => {
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
        title={
          mode === "view"
            ? "Vendor Details"
            : mode === "edit"
            ? "Edit Vendor"
            : "Add Vendor"
        }
        width="xl"
        position="right"
        showLinkButton={true}
      >
        <form
          className="space-y-6 p-4"
          onSubmit={mode === "create" ? handleSubmit : (e) => e.preventDefault()}
          ref={formRef as any}
        >
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
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Enter Company Name"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Company Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter Email ID"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
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
                    required
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md pl-20 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
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
                  name="firstname"
                  type="text"
                  value={formData.firstname}
                  onChange={(e) =>
                    setFormData({ ...formData, firstname: e.target.value })
                  }
                  placeholder="Enter First Name"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
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
                  onChange={(e) =>
                    setFormData({ ...formData, lastname: e.target.value })
                  }
                  placeholder="Enter Last Name"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Nickname/Alias <span className="text-red-500">*</span>
                </label>
                <input
                  name="alias"
                  type="text"
                  value={formData.alias}
                  onChange={(e) =>
                    setFormData({ ...formData, alias: e.target.value })
                  }
                  placeholder="Enter Nickname/Alias"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Contact Number <span className="text-red-500">*</span>
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
                    disabled={readOnly}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    placeholder="Enter Contact Number"
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-md pl-20 pr-3 py-2 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Enter Email ID"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[0.75rem] font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  placeholder="DD-MM-YYYY"
                  required
                  disabled={readOnly}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-[0.75rem] disabled:bg-gray-100 disabled:text-gray-700"
            />
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
            <h2 className="text-[0.75rem] font-medium mb-2">Tier</h2>

            <div className="flex flex-col">
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                disabled={readOnly}
                className="w-[10rem] border border-gray-300 rounded-md px-3 py-1.5 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-700"
              >
                <option value="">Select Tier</option>
                <option value="tier1">Tier 1</option>
                <option value="tier2">Tier 2</option>
                <option value="tier3">Tier 3</option>
                <option value="tier4">Tier 4</option>
                <option value="tier5">Tier 5</option>
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
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              placeholder="Enter Your Remarks Here"
              className={`
            w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem]  mt-2 transition-colors
            focus:ring focus:ring-blue-200
          `}
              disabled={readOnly}
            />
          </div>

          {/* ================= ACTION BUTTONS ================ */}
          <div className="flex justify-end gap-2 pt-2">
            {mode === "view" ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-[0.75rem]"
              >
                Close
              </button>
            ) : mode === "edit" ? (
              <button
                type="submit"
                onClick={handleUpdateVendor}
                className="px-4 py-2 bg-[#0D4B37] text-white rounded-lg text-[0.75rem]"
              >
                Update Vendor
              </button>
            ) : (
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-[#114958] text-white text-[0.75rem]"
              >
                <LuSave className="mr-1 inline-block" size={16} />
                Save
              </button>
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
