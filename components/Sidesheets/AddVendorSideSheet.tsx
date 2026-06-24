"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import SideSheet from "../SideSheet";
import {
  createVendor,
  updateVendor,
} from "@/services/vendorApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { useBooking } from "@/context/BookingContext";
import DropDown from "../DropDown";
import PhoneCodeSelect from "../PhoneCodeSelect";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { HiOutlineInformationCircle } from "react-icons/hi";
import Button from "../Button";
import ActionMenu from "../Menus/ActionMenu";
import RemarksField from "../forms/components/RemarksField";
import { FaRegFolder } from "react-icons/fa";
import ErrorToast from "../ErrorToast";
import ConfirmationModal from "../popups/ConfirmationModal";
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
import { getStoredCurrencySymbol } from "@/utils/helper";

type VendorData = {
  _id?: string;
  customId?: string;
  name?: string;
  contactPerson?: string;
  alias: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  companyName?: string;
  openingBalance?: string;
  balanceType?: "credit" | "debit";
  remarks?: string;
  tier?: string;
  vendorType?: string;
  source?: string;
  countryCode?: string;
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

const VENDOR_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "corporate", label: "Corporate" },
  { value: "agent", label: "Agent" },
  { value: "service-provider", label: "Service Provider" },
];

const SOURCE_OPTIONS = [
  {
    value: "meta",
    label: "Meta (Organic)",
    icon: "/icons/source-icons/meta.svg",
  },
  {
    value: "google",
    label: "Google (Organic)",
    icon: "/icons/source-icons/google-organic.svg",
  },
  {
    value: "seo",
    label: "SEO (Paid)",
    icon: "/icons/source-icons/seo.svg",
  },
  {
    value: "word-of-mouth",
    label: "Word of Mouth",
    icon: "/icons/source-icons/word-of-mouth.svg",
  },
  {
    value: "referral",
    label: "Referral",
    icon: "/icons/source-icons/referal.svg",
  },
];

const TIER_OPTIONS = [
  {
    value: "tier1",
    label: (
      <div className="flex items-center gap-2">
        <img src="/icons/tier-1.svg" alt="Tier 1" className="h-5 w-5" />
        <span className="text-[13px] font-medium">Tier I</span>
      </div>
    ),
  },
  {
    value: "tier2",
    label: (
      <div className="flex items-center gap-2">
        <img src="/icons/tier-2.svg" alt="Tier 2" className="h-5 w-5" />
        <span className="text-[13px] font-medium">Tier II</span>
      </div>
    ),
  },
  {
    value: "tier3",
    label: (
      <div className="flex items-center gap-2">
        <img src="/icons/tier-3.svg" alt="Tier 3" className="h-5 w-5" />
        <span className="text-[13px] font-medium">Tier III</span>
      </div>
    ),
  },
];

const inputClassName =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#7135AD] focus:border-[#7135AD] hover:border-[#7135AD33] disabled:bg-gray-100 disabled:text-gray-700";

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
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const [alternatePhoneCode, setAlternatePhoneCode] = useState<string>("+91");
  const [vendorType, setVendorType] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<
    NonNullable<VendorData["documents"]>
  >([]);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<
    "name" | "vendorType" | null
  >(null);

  const [vendorCode, setVendorCode] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const initialSnapshotRef = useRef<string>("");

  const [balanceType, setBalanceType] = useState<"debit" | "credit">("credit");
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const [tier, setTier] = useState<string>("");

  const [formData, setFormData] = useState<VendorData>({
    name: "",
    alias: "",
    email: "",
    phone: "",
    alternatePhone: "",
    companyName: "",
    remarks: "",
    tier: "",
    vendorType: "",
    source: "",
    countryCode: "+91",
  });

  const phoneMaxLength = getPhoneNumberMaxLength(phoneCode);
  const alternatePhoneMaxLength = getPhoneNumberMaxLength(alternatePhoneCode);

  const buildSnapshot = (snapshot: {
    formData: VendorData;
    phoneCodeValue: string;
    alternatePhoneCodeValue: string;
    vendorTypeValue: string;
    sourceValue: string;
    tierValue: string;
    balanceAmountValue: string;
    balanceTypeValue: "debit" | "credit";
    existingDocs: NonNullable<VendorData["documents"]>;
    attached: File[];
  }) =>
    JSON.stringify({
      formData: {
        name: snapshot.formData.name || "",
        alias: snapshot.formData.alias || "",
        phone: snapshot.formData.phone || "",
        alternatePhone: snapshot.formData.alternatePhone || "",
        email: snapshot.formData.email || "",
        remarks: snapshot.formData.remarks || "",
        vendorType: snapshot.formData.vendorType || "",
        source: snapshot.formData.source || "",
      },
      phoneCode: snapshot.phoneCodeValue,
      alternatePhoneCode: snapshot.alternatePhoneCodeValue,
      vendorType: snapshot.vendorTypeValue,
      source: snapshot.sourceValue,
      tier: snapshot.tierValue,
      balanceAmount: snapshot.balanceAmountValue,
      balanceType: snapshot.balanceTypeValue,
      existingDocuments: snapshot.existingDocs.map(
        (doc) => doc.key || doc.url || doc.fileName || doc.originalName || "",
      ),
      attachedFiles: snapshot.attached.map(
        (file) => `${file.name}:${file.size}:${file.type}`,
      ),
    });

  useEffect(() => {
    if (mode === "create") {
      if (vendorCodeProp) setVendorCode(vendorCodeProp);
    } else {
      setVendorCode(data?.customId || data?._id || "");
    }
  }, [mode, data, vendorCodeProp]);

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
        : name === "phone"
          ? allowOnlyDigitsWithMax(value, phoneMaxLength)
          : name === "alternatePhone"
            ? allowOnlyDigitsWithMax(value, alternatePhoneMaxLength)
            : name === "alias"
              ? allowTextAndNumbers(value)
              : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (name === "name" && value.trim() && invalidField === "name") {
      setInvalidField(null);
    }
  };

  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);
    const remaining = 3 - attachedFiles.length;
    if (remaining <= 0) return;

    setAttachedFiles((prev) => [...prev, ...selected.slice(0, remaining)]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (data) {
      const nameVal = data.name
        ? String(data.name).trim()
        : data.contactPerson
          ? String(data.contactPerson).trim()
          : "";

      const rawPhone = String(data.phone || "");
      const parsed = splitPhoneWithDialCode(
        rawPhone,
        data.countryCode || "+91",
      );
      const trimmed = allowOnlyDigitsWithMax(
        parsed.number.replace(/\D/g, ""),
        getPhoneNumberMaxLength(parsed.dialCode),
      );

      const rawAlternatePhone = String(data.alternatePhone || "");
      const parsedAlternate = splitPhoneWithDialCode(
        rawAlternatePhone,
        "+91",
      );
      const trimmedAlternate = allowOnlyDigitsWithMax(
        parsedAlternate.number.replace(/\D/g, ""),
        getPhoneNumberMaxLength(parsedAlternate.dialCode),
      );

      const nextFormData: VendorData = {
        name: nameVal,
        alias: data.alias || "",
        email: data.email || "",
        phone: trimmed || "",
        alternatePhone: trimmedAlternate || "",
        companyName: data.companyName || "",
        remarks: data.remarks || "",
        tier: data.tier || "",
        vendorType: data.vendorType || "",
        source: data.source || "",
        countryCode: parsed.dialCode || "+91",
      };

      const nextDocuments = Array.isArray(data.documents) ? data.documents : [];
      const nextTier = data.tier || "";
      const nextBalanceAmount = data.openingBalance
        ? String(data.openingBalance)
        : "";
      const nextBalanceType = data.balanceType || "credit";
      const nextVendorType = data.vendorType || "";
      const nextSource = data.source || "";

      setFormData(nextFormData);
      setPhoneCode(parsed.dialCode || "+91");
      setAlternatePhoneCode(parsedAlternate.dialCode || "+91");
      setExistingDocuments(nextDocuments);
      setAttachedFiles([]);
      setTier(nextTier);
      setBalanceAmount(nextBalanceAmount);
      setBalanceType(nextBalanceType);
      setVendorType(nextVendorType);
      setSource(nextSource);

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: parsed.dialCode || "+91",
        alternatePhoneCodeValue: parsedAlternate.dialCode || "+91",
        vendorTypeValue: nextVendorType,
        sourceValue: nextSource,
        tierValue: nextTier,
        balanceAmountValue: nextBalanceAmount,
        balanceTypeValue: nextBalanceType,
        existingDocs: nextDocuments,
        attached: [],
      });
    } else {
      const nextFormData: VendorData = {
        name: "",
        alias: "",
        email: "",
        phone: "",
        alternatePhone: "",
        companyName: "",
        remarks: "",
        tier: "",
        vendorType: "",
        source: "",
        countryCode: "+91",
      };

      setFormData(nextFormData);
      setPhoneCode("+91");
      setAlternatePhoneCode("+91");
      setExistingDocuments([]);
      setAttachedFiles([]);
      setTier("");
      setBalanceAmount("");
      setBalanceType("credit");
      setVendorType("");
      setSource("");

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: "+91",
        alternatePhoneCodeValue: "+91",
        vendorTypeValue: "",
        sourceValue: "",
        tierValue: "",
        balanceAmountValue: "",
        balanceTypeValue: "credit",
        existingDocs: [],
        attached: [],
      });
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

  useEffect(() => {
    setFormData((prev) => {
      const trimmed = allowOnlyDigitsWithMax(
        String(prev.alternatePhone || ""),
        alternatePhoneMaxLength,
      );
      if (trimmed === prev.alternatePhone) return prev;
      return { ...prev, alternatePhone: trimmed };
    });
  }, [alternatePhoneMaxLength]);

  const isDirty = useMemo(() => {
    if (mode !== "edit") return false;
    const currentSnapshot = buildSnapshot({
      formData,
      phoneCodeValue: phoneCode,
      alternatePhoneCodeValue: alternatePhoneCode,
      vendorTypeValue: vendorType,
      sourceValue: source,
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
    alternatePhoneCode,
    vendorType,
    source,
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

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      alias: "",
      email: "",
      phone: "",
      alternatePhone: "",
      companyName: "",
      remarks: "",
      tier: "",
      vendorType: "",
      source: "",
      countryCode: "+91",
    });
    setPhoneCode("+91");
    setAlternatePhoneCode("+91");
    setVendorType("");
    setSource("");
    setTier("");
    setBalanceAmount("");
    setBalanceType("credit");
    setAttachedFiles([]);
    setInvalidField(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || String(formData.name).trim() === "") {
      showErrorToast("Please enter name to proceed");
      setInvalidField("name");
      setTimeout(() => {
        nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        nameRef.current?.focus();
      }, 100);
      return;
    }

    if (!vendorType) {
      showErrorToast("Please select vendor type to proceed");
      setInvalidField("vendorType");
      return;
    }

    if (formData.email && !isValidEmail(String(formData.email))) {
      showErrorToast("Email format is invalid");
      return;
    }

    const user = getAuthUser() as { businessId?: string };
    const businessId = user?.businessId;

    try {
      const formDataToSend = new FormData();
      const contactName = String(formData.name || "").trim();
      const companyName = formData.companyName || contactName;

      formDataToSend.append("companyName", companyName);
      formDataToSend.append("contactPerson", contactName);
      formDataToSend.append("alias", formData.alias || "");
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("phone", `${phoneCode}${formData.phone || ""}`);
      if (formData.alternatePhone) {
        formDataToSend.append(
          "alternatePhone",
          `${alternatePhoneCode}${formData.alternatePhone}`,
        );
      }
      formDataToSend.append("openingBalance", balanceAmount || "");
      formDataToSend.append("balanceType", balanceType);
      formDataToSend.append("tier", tier || "");
      formDataToSend.append("vendorType", vendorType || "");
      formDataToSend.append("source", source || "");
      formDataToSend.append("remarks", formData.remarks || "");
      formDataToSend.append("countryCode", phoneCode || "+91");
      formDataToSend.append("customId", vendorCode || "");
      formDataToSend.append("businessId", businessId || "");

      attachedFiles.forEach((file) => {
        formDataToSend.append("documents", file);
      });

      const created = await createVendor(formDataToSend);

      if (created?._id) {
        updateGeneralInfo({ vendor: created._id });
        const displayName =
          created.name || created.companyName || created.contactPerson || "";
        setLastAddedVendor?.({ id: created._id, name: displayName });
        onSuccess?.();
      }

      onCancel();
    } catch (err: unknown) {
      console.error("Error creating vendor:", err);
    }
  };

  const handleUpdateVendor = async () => {
    if (!formData.name || String(formData.name).trim() === "") {
      showErrorToast("Please enter name to proceed");
      setInvalidField("name");
      return;
    }

    if (!vendorType) {
      showErrorToast("Please select vendor type to proceed");
      setInvalidField("vendorType");
      return;
    }

    const vendorId = data?._id;
    if (!vendorId) {
      console.error("No vendor ID found");
      return;
    }

    if (formData.email && !isValidEmail(String(formData.email))) {
      showErrorToast("Email format is invalid");
      return;
    }

    try {
      const contactName = String(formData.name || "").trim();
      const vendorData = {
        companyName: formData.companyName || contactName,
        contactPerson: contactName,
        alias: formData.alias || undefined,
        openingBalance: balanceAmount ? Number(balanceAmount) : undefined,
        balanceType,
        email: formData.email,
        phone: `${phoneCode}${formData.phone || ""}`,
        alternatePhone: formData.alternatePhone
          ? `${alternatePhoneCode}${formData.alternatePhone}`
          : undefined,
        tier: tier || undefined,
        vendorType: vendorType || undefined,
        source: source || undefined,
        remarks: formData.remarks || undefined,
        documents: existingDocuments,
      };

      await updateVendor(vendorId, vendorData);
      onSuccess?.();
      onCancel();
    } catch (err: unknown) {
      console.error("Error updating vendor:", err);
    }
  };

  const sheetTitle = useMemo(() => {
    const label =
      mode === "view"
        ? "Vendor Details"
        : mode === "edit"
          ? "Edit Vendor"
          : "Add New Vendor";

    if (!vendorCode) return label;

    return (
      <span className="flex items-center gap-2">
        <span>{label}</span>
        <span className="font-normal text-[#D1D5DB]">|</span>
        <span className="font-semibold text-[#1F2937]">{vendorCode}</span>
      </span>
    );
  }, [mode, vendorCode]);

  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1 text-[12px] font-medium text-[#7135AD] transition-colors hover:bg-[#7135AD0D]"
        >
          <Image
            src="/icons/link-icon.svg"
            alt=""
            width={12}
            height={12}
            className="object-contain"
          />
          Customer 1
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1 text-[12px] font-medium text-[#7135AD] transition-colors hover:bg-[#7135AD0D]"
        >
          <Image
            src="/icons/link-icon.svg"
            alt=""
            width={12}
            height={12}
            className="object-contain"
          />
          Traveller 1
        </button>
        <ActionMenu
          width="w-36"
          right="right-0"
          actions={[
            {
              label: "Reset Form",
              onClick: resetForm,
            },
          ]}
        />
      </div>
    ),
    [resetForm],
  );

  const sourceDropdownOptions = useMemo(
    () =>
      SOURCE_OPTIONS.map((option) => ({
        value: option.value,
        label: (
          <div className="flex items-center gap-2">
            <img src={option.icon} alt="" className="h-4 w-4 object-contain" />
            <span className="text-[13px]">{option.label}</span>
          </div>
        ),
        searchLabel: option.label,
      })),
    [],
  );

  const vendorTypeDropdownOptions = useMemo(
    () =>
      VENDOR_TYPE_OPTIONS.map((option) => ({
        value: option.value,
        label: <span className="text-[13px]">{option.label}</span>,
        searchLabel: option.label,
      })),
    [],
  );

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={handleRequestClose}
        onCloseButtonClick={handleRequestClose}
        title={sheetTitle}
        headerRight={headerRight}
        width="lg2"
        position="right"
        zIndex={1000}
      >
        <form
          className="flex h-full min-h-0 flex-col"
          onSubmit={mode === "create" ? handleSubmit : (e) => e.preventDefault()}
          ref={formRef as React.RefObject<HTMLFormElement>}
          noValidate
        >
          <div className="sidesheet-scroll-body space-y-6 p-4 pb-6">
            {/* Basic Details */}
            <div className="-mt-2 rounded-[12px] border border-gray-200 p-3">
              <h2 className="mb-2 text-[13px] font-medium">Basic Details</h2>
              <hr className="mb-3 mt-1 border-t border-gray-200" />

              <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    name="name"
                    type="text"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder="Enter Name"
                    disabled={readOnly}
                    className={`${inputClassName} ${
                      invalidField === "name"
                        ? "border-red-300 focus:ring-red-200"
                        : ""
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Nickname/Alias
                  </label>
                  <input
                    name="alias"
                    type="text"
                    value={formData.alias}
                    onChange={handleChange}
                    placeholder="Enter Nickname/Alias"
                    disabled={readOnly}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={phoneCode}
                      onChange={setPhoneCode}
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0 rounded-l-md"
                      customHeight="h-9"
                    />
                    <input
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={phoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className={`${inputClassName} rounded-l-none`}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Alternate Contact Number
                  </label>
                  <div className="flex items-center">
                    <PhoneCodeSelect
                      value={alternatePhoneCode}
                      onChange={setAlternatePhoneCode}
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0 rounded-l-md"
                      customHeight="h-9"
                    />
                    <input
                      name="alternatePhone"
                      type="text"
                      value={formData.alternatePhone || ""}
                      onChange={handleChange}
                      maxLength={alternatePhoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className={`${inputClassName} rounded-l-none`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[13px] font-medium text-gray-700">
                  Email ID
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter Email ID"
                  disabled={readOnly}
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Business & Identity */}
            <div className="rounded-[12px] border border-gray-200 p-3">
              <h2 className="mb-2 text-[13px] font-medium">
                Business &amp; Identity
              </h2>
              <hr className="mb-3 mt-1 border-t border-gray-200" />

              <div className="flex flex-col gap-1">
                <label className="block text-[13px] font-medium text-gray-700">
                  Vendor Type <span className="text-red-500">*</span>
                </label>
                <DropDown
                  options={vendorTypeDropdownOptions}
                  value={vendorType}
                  onChange={(v) => {
                    setVendorType(v);
                    if (invalidField === "vendorType") {
                      setInvalidField(null);
                    }
                  }}
                  placeholder="Select Vendor Type"
                  disabled={readOnly}
                  customWidth="w-full"
                  menuWidth="w-full"
                  focusRingClass="focus:ring-1 focus:ring-[#7135AD]"
                  className={
                    invalidField === "vendorType"
                      ? "rounded-md border border-red-300"
                      : ""
                  }
                />
              </div>
            </div>

            {/* Opening Balance + Source & Tier */}
            <div className="rounded-[12px] border border-gray-200 p-3">
              <h2 className="mb-2 text-[13px] font-medium">Opening Balance</h2>
              <hr className="mb-3 mt-1 border-t border-gray-200" />

              <div className="mb-3 flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="debit"
                    checked={balanceType === "debit"}
                    onChange={() => setBalanceType("debit")}
                    className="h-4 w-4 border-gray-300 text-[#7135AD] focus:ring-[#7135AD]"
                    disabled={readOnly}
                  />
                  <span className="text-gray-700">Debit</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="credit"
                    checked={balanceType === "credit"}
                    onChange={() => setBalanceType("credit")}
                    className="h-4 w-4 border-gray-300 text-[#7135AD] focus:ring-[#7135AD]"
                    disabled={readOnly}
                  />
                  <span className="text-gray-700">Credit</span>
                </label>
              </div>

              <div className="relative mb-3">
                <div className="flex items-center rounded-lg border border-gray-300 px-3 py-2 focus-within:border-[#7135AD] focus-within:ring-1 focus-within:ring-[#7135AD]">
                  <span className="mr-2 text-[13px] text-gray-500">
                    {getStoredCurrencySymbol()}
                  </span>
                  <input
                    type="text"
                    value={balanceAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setBalanceAmount(value);
                      }
                    }}
                    placeholder={
                      balanceType === "debit"
                        ? "Enter Debit Amount"
                        : "Enter Credit Amount"
                    }
                    disabled={readOnly}
                    className="flex-1 pr-44 text-[13px] text-gray-700 outline-none disabled:bg-gray-100 disabled:text-gray-700"
                  />
                  <span
                    className={`absolute right-3 whitespace-nowrap text-[12px] font-medium ${
                      balanceType === "debit" ? "text-[#419836]" : "text-red-500"
                    }`}
                  >
                    {balanceType === "debit"
                      ? `Customer pays you ${getStoredCurrencySymbol()}`
                      : `You pay the customer ${getStoredCurrencySymbol()}`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Source
                  </label>
                  <DropDown
                    options={sourceDropdownOptions}
                    value={source}
                    onChange={setSource}
                    placeholder="Select Source"
                    disabled={readOnly}
                    customWidth="w-full"
                    menuWidth="w-full"
                    focusRingClass="focus:ring-1 focus:ring-[#7135AD]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Tier
                  </label>
                  <DropDown
                    options={TIER_OPTIONS}
                    value={tier}
                    onChange={setTier}
                    placeholder="Select Tier"
                    disabled={readOnly}
                    customWidth="w-full"
                    menuWidth="w-full"
                    focusRingClass="focus:ring-1 focus:ring-[#7135AD]"
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="rounded-[12px] border border-gray-200 p-3">
              <h2 className="mb-2 text-[13px] font-medium">Documents</h2>
              <hr className="mb-3 mt-1 border-t border-gray-200" />

              <input
                type="file"
                ref={fileRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                multiple
                disabled={readOnly || attachedFiles.length >= 3}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={readOnly || attachedFiles.length >= 3}
                className={`flex items-center gap-1.5 rounded-md border border-[#7135AD] bg-white px-3 py-1.5 text-[13px] font-medium text-[#7135AD] transition-colors hover:bg-[#7135AD0D] ${
                  readOnly || attachedFiles.length >= 3
                    ? "cursor-not-allowed opacity-50 hover:bg-white"
                    : ""
                }`}
              >
                <MdOutlineFileUpload size={16} /> Attach Files
              </button>

              <div className="mt-2 flex flex-col gap-2">
                {existingDocuments.map((doc, i) => (
                  <div
                    key={`${doc.key || doc.fileName || doc.originalName}-${i}`}
                    className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 transition hover:bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() => doc.url && window.open(doc.url, "_blank")}
                      className="-ml-2 flex cursor-pointer items-center gap-2 truncate rounded-md border border-gray-200 bg-gray-100 p-1 text-[13px] text-[#7135AD] transition-colors hover:border-[#7135AD33] hover:bg-[#7135AD0D]"
                      title="Click to view document"
                    >
                      <FaRegFolder className="h-3 w-3 text-[#7135AD]" />
                      {doc.originalName || doc.fileName}
                    </button>

                    {!readOnly && mode === "edit" ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingDocument(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}

                {attachedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 transition hover:bg-gray-50"
                  >
                    <span className="-ml-2 flex items-center gap-2 truncate rounded-md border border-gray-200 bg-gray-100 p-1 text-[13px] text-[#7135AD]">
                      <FaRegFolder className="h-3 w-3 text-[#7135AD]" />
                      {file.name}
                    </span>

                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-1 text-[11px] text-[#9CA3AF]">
                <HiOutlineInformationCircle size={14} />
                Maximum of 3 files can be uploaded
              </div>
            </div>

            <RemarksField
              label="Internal Notes"
              value={formData.remarks || ""}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, remarks: val }))
              }
              readOnly={readOnly}
              placeholder="Enter your internal notes here..."
              className="mt-0"
            />
          </div>

          <div className="z-30 shrink-0 border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex justify-end gap-2">
              {mode === "view" ? (
                <Button
                  text="Close"
                  onClick={onCancel}
                  bgColor="bg-white"
                  textColor="text-gray-700"
                  className="rounded-[15px] border border-gray-300 px-4 py-2 hover:bg-gray-100"
                />
              ) : mode === "edit" ? (
                <>
                  <Button
                    text="Cancel"
                    onClick={onCancel}
                    bgColor="bg-white"
                    textColor="text-[#7135AD]"
                    className="rounded-[15px] border border-[#7135AD] px-4 py-2 hover:bg-[#7135AD0D]"
                  />
                  <Button
                    text="Update Vendor"
                    onClick={handleUpdateVendor}
                    bgColor="bg-[#7135AD]"
                    textColor="text-white"
                    className="rounded-[15px] px-4 py-2 hover:opacity-90"
                  />
                </>
              ) : (
                <Button
                  text="Save Details"
                  type="submit"
                  bgColor="bg-[#7135AD]"
                  textColor="text-white"
                  className="rounded-[15px] px-4 py-2 hover:opacity-90"
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
    </>
  );
};

export default AddVendorSideSheet;
