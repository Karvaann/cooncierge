"use client";

import React, { useState, useEffect, useRef } from "react";
import SideSheet from "../SideSheet";
import { createVendor, updateVendor } from "@/services/vendorApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { useBooking } from "@/context/BookingContext";
import TierDropDown from "../dropdowns/TierDropDown";
import PhoneCodeSelect from "../PhoneCodeSelect";
import SingleCalendar from "../SingleCalendar";
import { LuSave } from "react-icons/lu";
import Button from "../Button";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import ErrorToast from "../ErrorToast";
import Documents from "@/components/forms/components/Documents";
import RemarksField from "@/components/forms/components/RemarksField";
import {
  allowOnlyText,
  allowOnlyDigitsWithMax,
  allowTextAndNumbers,
  isValidEmail,
} from "@/utils/inputValidators";
import {
  getPhoneNumberMaxLength,
  splitPhoneWithDialCode,
} from "@/utils/phoneUtils";
import OpeningBalance from "../OpeningBalance";
import ConfirmationModal from "../popups/ConfirmationModal";

type VendorData = {
  _id?: string;
  customId?: string;
  contactPerson?: string;
  alias: string;
  firstname?: string;
  lastname?: string;
  email: string;
  phone: string;
  countryCode: string;
  dateOfBirth: string;

  companyName: string;
  address: string;
  openingBalance: string;
  balanceType: "credit" | "debit";
  remarks: string;
  tier?: string;
  documents?: Array<{
    originalName: string;
    fileName: string;
    url: string;
    key: string;
    size: number;
    mimeType: string;
    uploadedAt: string | Date;
  }>;
};

type AddVendorSideSheetProps = {
  data?: VendorData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit" | "view";
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
  vendorCode?: string;
};

const AddVendorSideSheet: React.FC<AddVendorSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
  formRef,
  onSuccess,
  vendorCode: vendorCodeProp,
}) => {
  const { updateGeneralInfo, setLastAddedVendor } = useBooking();
  const readOnly = mode === "view";
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    NonNullable<VendorData["documents"]>
  >([]);

  // Validation helpers / UI state for required fields (company + contact person)
  const companyRef = useRef<HTMLInputElement | null>(null);
  const contactNameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<
    "company" | "contactPerson" | null
  >(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [vendorCode, setVendorCode] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);

  useEffect(() => {
    if (mode === "create") {
      if (vendorCodeProp) setVendorCode(vendorCodeProp);
    } else {
      setVendorCode(data?.customId || data?._id || "");
    }
  }, [mode, data, vendorCodeProp]);

  // Mounted flag to ensure portal renders client-side only
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showErrorToast = (message: string) => {
    setError(message);
  };

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

  const handleRequestClose = () => {
    if (readOnly) {
      onCancel();
      return;
    }
    if (mode === "create") {
      setIsCloseConfirmOpen(true);
      return;
    }
    if (mode === "edit") {
      setIsCloseConfirmOpen(true);
      return;
    }
    onCancel();
  };

  const handleDeleteExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const onAddDocuments = (files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const onRemoveAttachedDocuments = (files: File[]) => {
    setAttachedFiles((prev) =>
      prev.filter(
        (p) => !files.some((f) => f.name === p.name && f.size === p.size),
      ),
    );
  };

  const [formData, setFormData] = useState<VendorData>({
    contactPerson: "",
    alias: "",
    email: "",
    phone: "",
    dateOfBirth: "",

    companyName: "",
    address: "",
    openingBalance: "",
    balanceType: "debit",
    remarks: "",
    tier: "",
    countryCode: "+91",
  });

  const phoneMaxLength = getPhoneNumberMaxLength(formData.countryCode);

  useEffect(() => {
    if (data) {
      const contactPersonFromData = data.contactPerson
        ? String(data.contactPerson).trim()
        : `${data.firstname || ""} ${data.lastname || ""}`.trim();

      // Split into country code dropdown + national number input.
      const rawPhone = String(data.phone || "");
      const parsed = splitPhoneWithDialCode(
        rawPhone,
        data.countryCode || "+91",
      );
      const digitsOnly = parsed.number.replace(/\D/g, "");
      const maxLen = getPhoneNumberMaxLength(parsed.dialCode);
      const trimmed = allowOnlyDigitsWithMax(digitsOnly, maxLen);

      setFormData({
        contactPerson: contactPersonFromData,
        alias: data.alias || "",
        email: data.email || "",
        phone: trimmed || "",
        dateOfBirth: data.dateOfBirth || "",

        companyName: data.companyName || "",
        address: data.address || "",
        openingBalance: data.openingBalance?.toString() || "",
        balanceType: data.balanceType || "debit",
        remarks: data.remarks || "",
        tier: data.tier || "",
        countryCode: parsed.dialCode || "+91",
      });
      setTier(data.tier || "");
      setExistingDocuments(Array.isArray(data.documents) ? data.documents : []);
      setAttachedFiles([]);
    } else {
      setFormData({
        contactPerson: "",
        alias: "",
        email: "",
        phone: "",
        dateOfBirth: "",

        companyName: "",
        address: "",
        openingBalance: "",
        balanceType: "debit",
        remarks: "",
        tier: "",
        countryCode: "+91",
      });
      setTier("");
      setExistingDocuments([]);
      setAttachedFiles([]);
    }
  }, [data]);

  useEffect(() => {
    setFormData((prev) => {
      const trimmed = allowOnlyDigitsWithMax(
        String(prev.phone || ""),
        phoneMaxLength,
      );
      if (trimmed === prev.phone) return prev;
      return { ...prev, phone: trimmed };
    });
  }, [phoneMaxLength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate company name and poc first name
    if (!formData.companyName || String(formData.companyName).trim() === "") {
      showErrorToast("Please enter company name to proceed");
      setInvalidField("company");

      setTimeout(() => {
        companyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        companyRef.current?.focus();
      }, 100);
      return;
    }
    if (
      !formData.contactPerson ||
      String(formData.contactPerson).trim() === ""
    ) {
      showErrorToast("Please enter contact person name to proceed");
      setInvalidField("contactPerson");

      setTimeout(() => {
        contactNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        contactNameRef.current?.focus();
      }, 100);
      return;
    }
    // Validate email format if provided
    if (formData.email && !isValidEmail(String(formData.email))) {
      showErrorToast("Email format is invalid");
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
        String(formData.contactPerson || ""),
      );
      formDataToSend.append("alias", formData.alias || "");
      formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formDataToSend.append("openingBalance", formData.openingBalance || "");
      formDataToSend.append("balanceType", formData.balanceType);
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("phone", formData.phone);
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

      // Ensure phone includes country code
      const phoneValue = `${formData.countryCode || "+91"}${
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
      showErrorToast("Please enter company name to proceed");
      setInvalidField("company");

      setTimeout(() => {
        companyRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        companyRef.current?.focus();
      }, 100);
      return;
    }
    if (
      !formData.contactPerson ||
      String(formData.contactPerson).trim() === ""
    ) {
      showErrorToast("Please enter contact person name to proceed");
      setInvalidField("contactPerson");

      setTimeout(() => {
        contactNameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        contactNameRef.current?.focus();
      }, 100);
      return;
    }
    try {
      const vendorId = data?._id;

      if (!vendorId) {
        console.error("No vendor ID found");
        return;
      }

      // Validate email format if provided
      if (formData.email && !isValidEmail(String(formData.email))) {
        showErrorToast("Email format is invalid");
        return;
      }

      const vendorData = {
        companyName: formData.companyName,
        contactPerson: String(formData.contactPerson || ""),
        alias: formData.alias || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        openingBalance: formData.openingBalance
          ? Number(formData.openingBalance)
          : undefined,
        balanceType: formData.balanceType,
        email: formData.email,
        phone: `${formData.countryCode || "+91"}${formData.phone}`,

        address: formData.address,
        tier: tier || undefined,
        remarks: formData.remarks || undefined,
        documents: existingDocuments,
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
        onClose={handleRequestClose}
        onCloseButtonClick={handleRequestClose}
        title={`${
          mode === "view"
            ? "Vendor Details"
            : mode === "edit"
              ? "Edit Vendor"
              : "Add Vendor"
        }${vendorCode ? " | " + vendorCode : ""}`}
        width="lg2"
        position="right"
        showLinkButton={true}
        zIndex={1000}
      >
        <form
          className="flex flex-col h-full"
          onSubmit={
            mode === "create" ? handleSubmit : (e) => e.preventDefault()
          }
          ref={formRef as any}
          noValidate
        >
          <div className="space-y-6 px-2 py-6 overflow-y-auto flex-1 pb-16">
            {/* ================= BASIC DETAILS ================ */}
            <div className="border border-gray-200 rounded-[15px] p-3.5 -mt-2">
              <h2 className="text-[13px] font-[500] mb-2">Basic Details</h2>
              <hr className="mt-1 mb-2 border-t border-gray-200" />

              {/* Row 1 */}
              {/* Company Name - FULL WIDTH */}
              <div className="flex flex-col gap-1 mb-3">
                <label className="block text-[13px] font-[500] text-[#414141]">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={companyRef}
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    const v = String(e.target.value);
                    setFormData({ ...formData, companyName: v });
                    if (invalidField === "company" && String(v).trim()) {
                      setInvalidField(null);
                    }
                  }}
                  placeholder="Enter Company Name"
                  disabled={readOnly}
                  className={`w-full rounded-[15px] px-3 py-2 text-[13px] hover:border-[#C6AEDE] disabled:bg-gray-100 disabled:text-gray-700 ${
                    invalidField === "company"
                      ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                      : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
                  }`}
                />
              </div>

              {/* Row 2 */}
              {/* Contact Number + Company Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={formData.countryCode}
                      onChange={(v) =>
                        setFormData({ ...formData, countryCode: v })
                      }
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0"
                      customHeight="h-9"
                      buttonClassName="px-3 py-2 text-[#020202] font-[400] hover:border-[#C6AEDE] rounded-l-[15px]"
                      noButtonRadius
                    />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: allowOnlyDigitsWithMax(
                            e.target.value,
                            phoneMaxLength,
                          ),
                        })
                      }
                      maxLength={phoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className="w-full border border-gray-300 rounded-r-[15px] px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:ring-1 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-gray-700"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
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
                    className="w-full border border-gray-300 rounded-[15px] px-3 py-2 text-[13px] hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
              </div>

              {/* Row 3 (reserved for single-width field if needed) */}
              <div className="flex flex-col gap-1 w-[22.3rem]"></div>
            </div>

            {/* ================= POC DETAILS (Optional) ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3.5">
              <h2 className="text-[13px] font-[500] mb-2">
                POC Details (Optional)
              </h2>
              <hr className="mt-1 mb-2 border-t border-gray-200" />

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={contactNameRef}
                    name="contactPerson"
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => {
                      const v = allowOnlyText(e.target.value);
                      setFormData({ ...formData, contactPerson: v });
                      if (
                        invalidField === "contactPerson" &&
                        String(v).trim()
                      ) {
                        setInvalidField(null);
                      }
                    }}
                    placeholder="Enter Contact Person Name"
                    disabled={readOnly}
                    className={`w-full rounded-[15px] px-3 py-2 text-[13px] hover:border-[#C6AEDE] disabled:bg-gray-100 disabled:text-gray-700 ${
                      invalidField === "contactPerson"
                        ? "border border-red-300 ring-1 ring-red-200 focus:outline-none focus:ring-1 focus:ring-red-200"
                        : "border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
                    }`}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Nickname/Alias
                  </label>
                  <input
                    name="alias"
                    type="text"
                    value={formData.alias}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alias: allowTextAndNumbers(e.target.value),
                      })
                    }
                    placeholder="Enter Nickname/Alias"
                    disabled={readOnly}
                    className="w-full border border-gray-300 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] rounded-[15px] px-3 py-2 text-[13px] disabled:bg-gray-100 disabled:text-gray-700"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={formData.countryCode}
                      onChange={(v) =>
                        setFormData({ ...formData, countryCode: v })
                      }
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0"
                      buttonClassName="px-3 py-2 text-[#020202] font-[400] hover:border-[#C6AEDE] rounded-l-[15px]"
                      noButtonRadius
                    />
                    <input
                      placeholder="Enter Contact Number"
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: allowOnlyDigitsWithMax(
                            e.target.value,
                            phoneMaxLength,
                          ),
                        })
                      }
                      maxLength={phoneMaxLength}
                      disabled={readOnly}
                      className="w-full border border-gray-300 rounded-r-[15px] px-3 py-2 text-[13px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#C6AEDE] hover:border-[#C6AEDE] disabled:bg-gray-100 disabled:text-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
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
                    className="w-full border border-gray-300 rounded-[15px] px-3 py-2 text-[13px] hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-gray-700"
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
                    customWidth="w-full -mt-0.5 py-1"
                    showCalendarIcon={true}
                    readOnly={readOnly}
                    maxDate={new Date().toISOString()}
                    inputStyleClass="px-2.5 py-2 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] hover:border-[#C6AEDE] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE]"
                  />
                </div>
              </div>
            </div>

            {/* ================= DOCUMENTS ================ */}

            <Documents
              existingDocuments={existingDocuments}
              onAddDocuments={onAddDocuments}
              onRemoveDocuments={onRemoveAttachedDocuments}
              onDeleteExistingDocument={handleDeleteExistingDocument}
              isReadOnly={readOnly}
              maxDocuments={3}
            />

            {/* ================= BILLING ADDRESS ================ */}
            <div className="border border-gray-200 rounded-[15px] p-3.5">
              <label className="block text-[13px] font-[500] text-[#414141] mb-1">
                Billing Address
              </label>
              <hr className="mt-1 mb-3 border-t border-gray-200" />
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Enter Billing Address"
                disabled={readOnly}
                className="w-full border border-gray-300 rounded-[15px] px-3 py-2 text-[13px] hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-gray-700 resize-none"
              />
            </div>

            {/* ================= OPENING BALANCE ================ */}
            <OpeningBalance
              readOnly={readOnly}
              balanceType={balanceType}
              setBalanceType={setBalanceType}
              balanceAmount={balanceAmount}
              setBalanceAmount={setBalanceAmount}
              showAlertOnInvalid={true}
            />

            {/* ================= TIER ================ */}
            <div className=" p-1 -mt-4">
              <h2 className="text-[13px] font-[500] mb-2">Rating</h2>

              <div className="flex flex-col">
                <TierDropDown
                  value={tier}
                  onChange={(v) => setTier(v)}
                  disabled={readOnly}
                  customWidth="w-[10rem]"
                  menuWidth="w-[10rem]"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="-mt-2">
              <RemarksField
                value={String(formData.remarks || "")}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, remarks: val }))
                }
                readOnly={readOnly}
              />
            </div>

            {/* ================= ACTION BUTTONS ================ */}
          </div>
          <div className="sticky bottom-0 bg-white border-t border-gray-200 py-2 px-3 z-30">
            <div className="flex justify-end gap-2">
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
          </div>
        </form>
        <ErrorToast
          message={error || ""}
          visible={!!error}
          onClose={() => setError(null)}
        />
      </SideSheet>

      {isCloseConfirmOpen && (
        <ConfirmationModal
          isOpen={isCloseConfirmOpen}
          onClose={() => setIsCloseConfirmOpen(false)}
          title="You have unsaved changes. Are you sure you want to close?"
          confirmText="Yes, Close"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
          onConfirm={() => {
            setIsCloseConfirmOpen(false);
            onCancel();
          }}
        />
      )}
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
