"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import SideSheet from "../SideSheet";
import SingleCalendar from "../SingleCalendar";
import { createCustomer } from "@/services/customerApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { updateCustomer } from "@/services/customerApi";
import { useBooking } from "@/context/BookingContext";
import { LuSave } from "react-icons/lu";
import Button from "../Button";
import PhoneCodeSelect from "../PhoneCodeSelect";
import generateCustomId from "@/utils/helper";
import TierDropDown from "../dropdowns/TierDropDown";
import OpeningBalance from "../OpeningBalance";
import ErrorToast from "../ErrorToast";
import Documents from "@/components/forms/components/Documents";
import RemarksField from "@/components/forms/components/RemarksField";
import ConfirmationModal from "../popups/ConfirmationModal";
import {
  allowOnlyText,
  allowOnlyNumbers,
  allowOnlyDigitsWithMax,
  allowTextAndNumbers,
} from "@/utils/inputValidators";
import { isValidEmail } from "@/utils/inputValidators";
import {
  getPhoneNumberMaxLength,
  splitPhoneWithDialCode,
} from "@/utils/phoneUtils";
import { getUsers } from "@/services/userApi";

type CustomerData = {
  customId?: string;
  _id?: string;
  name?: string;
  documents?: Array<{
    originalName: string;
    fileName: string;
    url: string;
    key: string;
    size: number;
    mimeType: string;
    uploadedAt: string | Date;
  }>;
  alias: string;
  firstname?: string;
  lastname?: string;
  phone: string | "";
  ownerId?: string;
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
  onSuccess?: () => void;
  customerCode?: string;
};

type UserOption = {
  _id: string;
  name?: string;
  email?: string;
};

const AddCustomerSideSheet: React.FC<AddCustomerSideSheetProps> = ({
  data,
  onCancel,
  isOpen,
  mode,
  formRef,
  onSuccess,
  customerCode: customerCodeProp,
}) => {
  const { updateGeneralInfo, setLastAddedCustomer } = useBooking();
  const readOnly = mode === "view";
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    NonNullable<CustomerData["documents"]>
  >([]);

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("debit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const [tier, setTier] = useState<string>("");

  const [formData, setFormData] = useState<CustomerData>({
    name: "",
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
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"name" | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [customerCode, setCustomerCode] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const initialSnapshotRef = useRef<string>("");

  // Users for Owner select
  const [users, setUsers] = useState<UserOption[]>([]);
  const [ownerId, setOwnerId] = useState<string>("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Owner dropdown UI state (replicates primary-owner dropdown from GeneralInfoForm)
  const [ownerListDisplay, setOwnerListDisplay] = useState<
    {
      id: string;
      name: string;
    }[]
  >([{ id: "", name: "" }]);
  const [ownerResults, setOwnerResults] = useState<UserOption[]>([]);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const ownerRef = useRef<HTMLDivElement | null>(null);

  const buildSnapshot = (snapshot: {
    formData: CustomerData;
    phoneCodeValue: string;
    tierValue: string;
    balanceAmountValue: string;
    balanceTypeValue: "debit" | "credit";
    existingDocs: NonNullable<CustomerData["documents"]>;
    attached: File[];
  }) =>
    JSON.stringify({
      formData: {
        name: snapshot.formData.name || "",
        alias: snapshot.formData.alias || "",
        phone: snapshot.formData.phone || "",
        email: snapshot.formData.email || "",
        dateOfBirth: snapshot.formData.dateOfBirth || "",
        gstin: snapshot.formData.gstin || "",
        companyName: snapshot.formData.companyName || "",
        address: snapshot.formData.address || "",
        remarks: snapshot.formData.remarks || "",
      },
      phoneCode: snapshot.phoneCodeValue || "",
      tier: snapshot.tierValue || "",
      balanceAmount: snapshot.balanceAmountValue || "",
      balanceType: snapshot.balanceTypeValue || "debit",
      existingDocuments: snapshot.existingDocs.map(
        (doc) => doc.key || doc.url || doc.fileName || doc.originalName || "",
      ),
      attachedFiles: snapshot.attached.map(
        (file) => `${file.name}:${file.size}:${file.type}`,
      ),
    });

  useEffect(() => {
    if (customerCodeProp) {
      setCustomerCode(customerCodeProp);
    } else if (data?.customId) {
      setCustomerCode(String(data.customId));
    } else if (data?._id) {
      setCustomerCode(String(data._id));
    } else if (mode === "create") {
      setCustomerCode(generateCustomId("customer"));
    } else {
      setCustomerCode("");
    }
  }, [mode, data, customerCodeProp]);

  const phoneMaxLength = getPhoneNumberMaxLength(phoneCode);

  // Mounted flag to ensure portal renders client-side only
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showErrorToast = (message: string) => {
    setError(message);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const newValue =
      name === "name"
        ? allowOnlyText(value)
        : name === "gstin"
          ? allowOnlyNumbers(value)
          : name === "phone"
            ? allowOnlyDigitsWithMax(value, phoneMaxLength)
            : name === "alias"
              ? allowTextAndNumbers(value)
              : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    // Clear invalid state when user types into required fields
    if (name === "name" && value.trim() && invalidField === "name") {
      setInvalidField(null);
    }
  };

  const handleDeleteExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const onAddDocuments = (files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  };

  const onRemoveAttachedDocuments = (files: File[]) => {
    // remove by name+size match
    setAttachedFiles((prev) =>
      prev.filter(
        (p) => !files.some((f) => f.name === p.name && f.size === p.size),
      ),
    );
  };

  useEffect(() => {
    if (data) {
      // Prefer explicit full name if provided; otherwise combine firstname/lastname
      let nameVal = "";
      if (data.name && String(data.name).trim()) {
        nameVal = String(data.name).trim();
      } else if (data.firstname || data.lastname) {
        nameVal = `${data.firstname || ""} ${data.lastname || ""}`.trim();
      }

      // Split country code from phone
      const rawPhone = String(data.phone || "");
      const parsed = splitPhoneWithDialCode(rawPhone, "+91");
      const digitsOnly = parsed.number.replace(/\D/g, "");
      const maxLen = getPhoneNumberMaxLength(parsed.dialCode);
      const trimmed = allowOnlyDigitsWithMax(digitsOnly, maxLen);
      setPhoneCode(parsed.dialCode);

      if (data?.ownerId) {
        // ownerId can be a string id or populated object { _id, name, email }
        let id = "";
        let displayName = "";
        try {
          if (typeof data.ownerId === "string") {
            id = String(data.ownerId);
          } else if (
            typeof data.ownerId === "object" &&
            data.ownerId !== null
          ) {
            id = String((data.ownerId as any)._id || "");
            displayName = (data.ownerId as any).name || "";
          }
        } catch (e) {
          id = String(data.ownerId || "");
        }

        setOwnerId(id);
        setOwnerListDisplay([{ id: id, name: displayName }]);
        setFormData((prev) => ({ ...prev, ownerId: id }));
      } else {
        setOwnerId("");
      }

      const nextFormData: CustomerData = {
        name: nameVal,
        alias: data.alias || "",
        phone: trimmed || "",
        email: data.email || "",
        dateOfBirth: data.dateOfBirth
          ? String(data.dateOfBirth).slice(0, 10)
          : "",
        gstin: data.gstin || "",
        companyName: data.companyName || "",
        address: data.address || "",
        remarks: data.remarks || "",
        tier: data.tier || "",
      };
      setFormData(nextFormData);

      const nextDocuments = Array.isArray(data.documents) ? data.documents : [];
      setExistingDocuments(nextDocuments);
      setAttachedFiles([]);
      const nextTier = data.tier || "";
      const nextBalanceAmount = data.openingBalance
        ? String(data.openingBalance)
        : "";
      const nextBalanceType = data.balanceType || "debit";
      setTier(nextTier);
      setBalanceAmount(nextBalanceAmount);
      setBalanceType(nextBalanceType);

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: parsed.dialCode,
        tierValue: nextTier,
        balanceAmountValue: nextBalanceAmount,
        balanceTypeValue: nextBalanceType,
        existingDocs: nextDocuments,
        attached: [],
      });
    } else {
      const nextFormData: CustomerData = {
        name: "",
        alias: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        gstin: "",
        companyName: "",
        address: "",
        remarks: "",
        tier: "",
      };
      setFormData(nextFormData);

      setExistingDocuments([]);
      setAttachedFiles([]);
      const nextPhoneCode = "+91";
      const nextTier = "";
      const nextBalanceAmount = "";
      const nextBalanceType: "debit" | "credit" = "debit";
      setPhoneCode(nextPhoneCode);
      setTier(nextTier);
      setBalanceAmount(nextBalanceAmount);
      setBalanceType(nextBalanceType);

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: nextPhoneCode,
        tierValue: nextTier,
        balanceAmountValue: nextBalanceAmount,
        balanceTypeValue: nextBalanceType,
        existingDocs: [],
        attached: [],
      });
    }
  }, [data]);

  // Keep owner display name in sync when users list or ownerId changes
  useEffect(() => {
    if (!ownerId) {
      setOwnerListDisplay([{ id: "", name: "" }]);
      return;
    }
    const match = users.find((u) => u._id === ownerId);
    if (match) {
      setOwnerListDisplay([{ id: match._id, name: match.name || "" }]);
    }
  }, [users, ownerId]);

  // Click-outside handler for owner dropdown
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (ownerRef.current && !ownerRef.current.contains(target as Node)) {
        setShowOwnerDropdown(false);
      }
    };
    document.addEventListener("pointerdown", onPointer, { capture: true });
    return () =>
      document.removeEventListener("pointerdown", onPointer, { capture: true });
  }, []);

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

  // Fetch users for Owner select
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await getUsers();

        // backend may return { data } or direct array
        const list = res?.data || res || [];
        setUsers(list);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  // Options for Owner select
  const ownerOptions = useMemo(() => {
    return users.map((user) => ({
      value: user._id,
      label: (
        <div className="flex flex-col">
          <span className="text-[13px] font-medium">
            {user.name || "Unnamed User"}
          </span>
          {user.email && (
            <span className="text-[11px] text-gray-500">{user.email}</span>
          )}
        </div>
      ),
      searchLabel: `${user.name || ""} ${user.email || ""}`,
    }));
  }, [users]);

  const isDirty = React.useMemo(() => {
    if (mode !== "edit") return false;
    const currentSnapshot = buildSnapshot({
      formData,
      phoneCodeValue: phoneCode,
      tierValue: tier,
      balanceAmountValue: balanceAmount,
      balanceTypeValue: balanceType,
      existingDocs: existingDocuments,
      attached: attachedFiles,
    });
    return currentSnapshot !== initialSnapshotRef.current;
  }, [
    mode,
    formData,
    phoneCode,
    tier,
    balanceAmount,
    balanceType,
    existingDocuments,
    attachedFiles,
  ]);

  const handleRequestClose = () => {
    if (readOnly) {
      onCancel();
      return;
    }
    if (mode === "create") {
      setIsCloseConfirmOpen(true);
      return;
    }
    if (mode === "edit" && isDirty) {
      setIsCloseConfirmOpen(true);
      return;
    }
    onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields: if missing, show toast and focus the field
    if (!formData.name || String(formData.name).trim() === "") {
      showErrorToast("Please enter full name to proceed");

      setInvalidField("name");

      setTimeout(() => {
        nameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        nameRef.current?.focus();
      }, 100);
      return;
    }
    const user = getAuthUser() as any;
    const ownerIdFromAuth = user?._id;
    const businessId = user?.businessId;

    try {
      // Validate email format if provided
      if (formData.email && !isValidEmail(String(formData.email))) {
        showErrorToast("Email format is invalid");
        return;
      }
      // Build FormData
      const formDataToSend = new FormData();

      // APPEND every customer field
      formDataToSend.append("name", String(formData.name || ""));
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("phone", `${phoneCode}${formData.phone}`);
      formDataToSend.append("alias", formData.alias || "");
      formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formDataToSend.append("gstin", String(formData.gstin || ""));
      formDataToSend.append("companyName", formData.companyName || "");
      formDataToSend.append("address", String(formData.address || ""));
      formDataToSend.append("remarks", formData.remarks || "");
      formDataToSend.append("tier", tier || "");

      formDataToSend.append(
        "ownerId",
        String(formData.ownerId || ownerId || ownerIdFromAuth || ""),
      );

      formDataToSend.append("businessId", businessId || "");

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
        onSuccess?.();
      }

      onCancel();
    } catch (error: any) {
      console.error("Error creating customer:", error.message || error);
    }
  };

  const handleUpdateCustomer = async () => {
    // Validate required fields before update
    if (!formData.name || String(formData.name).trim() === "") {
      showErrorToast("Please enter full name to proceed");
      setInvalidField("name");

      setTimeout(() => {
        nameRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        nameRef.current?.focus();
      }, 100);
      return;
    }
    try {
      const customerId = data?._id;

      if (!customerId) {
        console.error("No customer ID found");
        return;
      }

      // Validate email format if provided
      if (formData.email && !isValidEmail(String(formData.email))) {
        showErrorToast("Email format is invalid");
        return;
      }

      const updatePayload = {
        name: String(formData.name || ""),
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
        ownerId: formData.ownerId || ownerId || undefined,

        documents: existingDocuments,
      };

      const updated = await updateCustomer(customerId, updatePayload);
      console.log("Customer updated:", updated);
      onSuccess?.();
      onCancel(); // close sheet
    } catch (error) {
      console.error("Update error:", error);
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
            ? "Customer Details"
            : mode === "edit"
              ? "Edit Customer"
              : "Add Customer"
        }${customerCode ? " | " + customerCode : ""}`}
        width="lg2"
        position="right"
        showLinkButton={true}
        zIndex={1000}
      >
        <form
          className="flex flex-col h-full"
          onSubmit={handleSubmit}
          ref={formRef as any}
          noValidate
        >
          <div className="space-y-6 py-6 px-2 overflow-y-auto flex-1 pb-10">
            {/* ================= BASIC DETAILS ================ */}
            <div className="border border-gray-200 rounded-[15px] p-3.5 -mt-2">
              <h2 className="text-[13px] font-[500] mb-2">Basic Details</h2>
              <hr className="mt-1 mb-2 border-t border-gray-200" />

              {/* Row 1: Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter Full Name"
                    disabled={readOnly}
                    className={`w-full rounded-[15px] px-3 py-2 text-[13px] focus:outline-none hover:border-[#C6AEDE] focus:ring-[#C6AEDE] focus:ring-1 disabled:bg-gray-100 disabled:text-[#414141] ${
                      invalidField === "name"
                        ? "border border-red-300 focus:ring-red-200"
                        : "border border-gray-300"
                    }`}
                  />
                </div>
              </div>

              {/* Row 2: Alias + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Nickname/Alias
                  </label>
                  <input
                    name="alias"
                    type="text"
                    value={formData.alias}
                    onChange={handleChange}
                    placeholder="Enter Nickname/Alias"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-[15px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-[#414141]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={phoneCode}
                      onChange={(v) => setPhoneCode(v)}
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0 rounded-[15px]"
                      customHeight="h-9"
                      buttonClassName="px-3 py-1.5 text-[#020202] font-[400] hover:border-[#C6AEDE] rounded-l-[15px]"
                      noButtonRadius
                    />
                    <input
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={phoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className="w-full border border-gray-300 rounded-r-[15px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-[#414141]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Email + DOB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-[500] text-[#414141]">
                    Email ID
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter Email ID"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-[15px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-[#414141]"
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

            {/* ================= COMPANY DETAILS ================ */}
            <div className="border border-gray-200 rounded-[15px] p-3.5">
              <h2 className="text-[13px] font-[500] mb-2">
                Company Details (Optional)
              </h2>
              <hr className="mt-1 mb-2 border-t border-gray-200" />

              <div className="flex gap-4">
                {/* GSTIN */}
                <div className="flex flex-col w-[24rem] relative">
                  <label className="block text-[13px] font-[500] text-[#414141] mb-1">
                    GSTIN
                  </label>
                  <input
                    name="gstin"
                    type="text"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="Please Provide Your GST No."
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-[15px] px-3 py-2 text-[13px] pr-16 focus:outline-none focus:ring-1 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-[#414141]"
                  />
                </div>

                {/* Company Name */}
                <div className="flex flex-col w-[24rem]">
                  <label className="block text-[13px] font-[500] text-[#414141] mb-1">
                    Company Name
                  </label>
                  <input
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter Company Name"
                    disabled={readOnly}
                    className="w-full border border-gray-300 rounded-[15px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-[#414141]"
                  />
                </div>
              </div>
            </div>

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
              <input
                name="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter Billing Address"
                disabled={readOnly}
                className="w-full border border-gray-300 hover:border-[#C6AEDE] focus:ring-[#C6AEDE] rounded-[15px] px-3 py-2 text-[13px] disabled:bg-gray-100 disabled:text-[#414141]"
              />
            </div>
            {/* ================= OPENING BALANCE ================ */}

            <OpeningBalance
              readOnly={readOnly}
              balanceType={balanceType}
              setBalanceType={setBalanceType}
              balanceAmount={balanceAmount}
              setBalanceAmount={setBalanceAmount}
              showAlertOnInvalid={false}
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

            {/* ================= OWNER ================ */}
            <div className="border border-gray-200 rounded-[15px] p-3.5 -mt-2">
              <label className="block text-[13px] font-[500] text-[#414141] mb-1">
                Owner
              </label>

              <div className="w-[99%] relative" ref={ownerRef}>
                <input
                  name="owner"
                  placeholder={
                    loadingUsers ? "Loading users..." : "Search by Name"
                  }
                  className="w-full border border-[#E2E1E1] rounded-[15px] px-3 py-2 text-[13px] focus:outline-none hover:border-[#C6AEDE] focus:ring-[#C6AEDE] disabled:bg-gray-100 disabled:text-[#414141]"
                  value={ownerListDisplay[0]?.name || ""}
                  onChange={(e) => {
                    const value = String(e.target.value || "");
                    setOwnerListDisplay([{ id: "", name: value }]);

                    if (value.trim() === "") {
                      setOwnerResults([]);
                      setShowOwnerDropdown(false);
                      return;
                    }

                    const results = users.filter((u) =>
                      String(u.name || "")
                        .toLowerCase()
                        .includes(value.toLowerCase()),
                    );
                    setOwnerResults(results);
                    setShowOwnerDropdown(results.length > 0);
                  }}
                  disabled={readOnly || loadingUsers}
                />

                {showOwnerDropdown && ownerResults.length > 0 && (
                  <div className="absolute bg-white border border-gray-200 rounded-[15px] w-[22rem] mt-1 max-h-60 overflow-y-auto shadow-md z-50">
                    {ownerResults.map((u) => (
                      <div
                        key={u._id}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setOwnerListDisplay([
                            { id: u._id, name: u.name || "Unnamed User" },
                          ]);
                          setOwnerId(u._id);
                          setFormData((prev) => ({ ...prev, ownerId: u._id }));
                          setOwnerResults([]);
                          setShowOwnerDropdown(false);
                        }}
                      >
                        <p className="font-[500] text-[13px]">
                          {u.name || "Unnamed User"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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
    </>
  );
};

export default AddCustomerSideSheet;
