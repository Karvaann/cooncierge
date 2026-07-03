"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import SideSheet from "../SideSheet";
import SingleCalendar from "../SingleCalendar";
import { createCustomer } from "@/services/customerApi";
import { getAuthUser } from "@/services/storage/authStorage";
import { updateCustomer } from "@/services/customerApi";
import { useBooking } from "@/context/BookingContext";
import { FaRegFolder } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { HiOutlineInformationCircle } from "react-icons/hi";
import Button from "../Button";
import DropDown from "../DropDown";
import PhoneCodeSelect from "../PhoneCodeSelect";
import ActionMenu from "../Menus/ActionMenu";
import RemarksField from "../forms/components/RemarksField";
import generateCustomId, { getStoredCurrencySymbol } from "@/utils/helper";
import ErrorToast from "../ErrorToast";
import ConfirmationModal from "../popups/ConfirmationModal";
import LinkProfilesModal, {
  type LinkProfileSource,
} from "../Modals/LinkProfilesModal";
import {
  MODAL_FIELD_INPUT_CLASS,
  MODAL_FIELD_INPUT_GROUP_CLASS,
  MODAL_FIELD_INPUT_GROUP_INNER_CLASS,
  MODAL_FIELD_INPUT_GROUP_INNER_PLAIN_CLASS,
  MODAL_FIELD_DROPDOWN_BUTTON_CLASS,
} from "../atoms/modalFieldStyles";
import {
  allowOnlyText,
  allowOnlyNumbers,
  allowOnlyDigitsWithMax,
  allowTextAndNumbers,
} from "@/utils/inputValidators";
import { isValidEmail } from "@/utils/inputValidators";
import {
  mapApiSourceToUiDropdown,
  mapUiSourceToApi,
  mapTierToNumber,
} from "@/utils/directoryApiMappers";
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
  alternatePhone?: string;
  customerType?: string;
  source?: string;
};

const CUSTOMER_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "corporate", label: "Corporate" },
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
        <img src="/icons/tier-1.svg" alt="Tier 1" className="w-5 h-5" />
        <span className="text-[13px] font-medium">1</span>
      </div>
    ),
  },
  {
    value: "tier2",
    label: (
      <div className="flex items-center gap-2">
        <img src="/icons/tier-2.svg" alt="Tier 2" className="w-5 h-5" />
        <span className="text-[13px] font-medium">2</span>
      </div>
    ),
  },
  {
    value: "tier3",
    label: (
      <div className="flex items-center gap-2">
        <img src="/icons/tier-3.svg" alt="Tier 3" className="w-5 h-5" />
        <span className="text-[13px] font-medium">3</span>
      </div>
    ),
  },
  {
    value: "tier4",
    label: (
      <div className="flex items-center gap-2">
        <img src="/icons/tier-4.svg" alt="Tier 4" className="w-5 h-5" />
        <span className="text-[13px] font-medium">4</span>
      </div>
    ),
  },
  {
    value: "tier5",
    label: (
      <div className="flex items-center gap-2">
        <img src="/icons/tier-5.svg" alt="Tier 5" className="w-5 h-5" />
        <span className="text-[13px] font-medium">5</span>
      </div>
    ),
  },
];

type AddCustomerSideSheetProps = {
  data?: CustomerData | null;
  onCancel: () => void;
  isOpen: boolean;
  mode?: "create" | "edit" | "view";
  formRef?: React.RefObject<HTMLFormElement | null>;
  onSuccess?: () => void;
  customerCode?: string;
};

const getCustomerErrorMessage = (error: unknown): string => {
  const raw =
    (error as { message?: string; error?: string })?.message ||
    (error as { message?: string; error?: string })?.error ||
    "Something went wrong";

  if (raw.includes("E11000") && raw.toLowerCase().includes("email")) {
    return "A customer with this email already exists.";
  }

  return raw;
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
  const [alternatePhoneCode, setAlternatePhoneCode] = useState<string>("+91");
  const [customerType, setCustomerType] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
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
    alternatePhone: "",
    customerType: "",
    source: "",
  });

  const inputClassName = MODAL_FIELD_INPUT_CLASS;

  // Validation helpers / UI state for required fields
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<
    "name" | "customerType" | null
  >(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [customerCode, setCustomerCode] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTargetType, setLinkTargetType] = useState<
    "Vendor" | "Traveller" | ""
  >("");
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
    alternatePhoneCodeValue: string;
    customerTypeValue: string;
    sourceValue: string;
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
        alternatePhone: snapshot.formData.alternatePhone || "",
        customerType: snapshot.formData.customerType || "",
        source: snapshot.formData.source || "",
      },
      phoneCode: snapshot.phoneCodeValue || "",
      alternatePhoneCode: snapshot.alternatePhoneCodeValue || "",
      customerType: snapshot.customerTypeValue || "",
      source: snapshot.sourceValue || "",
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
  const alternatePhoneMaxLength = getPhoneNumberMaxLength(alternatePhoneCode);

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
            : name === "alternatePhone"
              ? allowOnlyDigitsWithMax(value, alternatePhoneMaxLength)
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

  // Handle selecting multiple files
  const handleFileChange = () => {
    const files = fileRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);

    // Respect max 3 files total
    const remaining = 3 - attachedFiles.length;
    if (remaining <= 0) {
      // No more files allowed
      return;
    }

    const toAdd = selected.slice(0, remaining);

    setAttachedFiles((prev) => [...prev, ...toAdd]);

    // simple: just append the allowed files to local state

    // Reset so selecting the same file again is possible
    if (fileRef.current) fileRef.current.value = "";
  };

  // Remove one file
  const handleDeleteFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingDocument = (index: number) => {
    setExistingDocuments((prev) => prev.filter((_, i) => i !== index));
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

      const rawAlternatePhone = String(
        (data as CustomerData).alternatePhone || "",
      );
      const parsedAlternate = splitPhoneWithDialCode(rawAlternatePhone, "+91");
      const alternateDigitsOnly = parsedAlternate.number.replace(/\D/g, "");
      const alternateMaxLen = getPhoneNumberMaxLength(parsedAlternate.dialCode);
      const trimmedAlternate = allowOnlyDigitsWithMax(
        alternateDigitsOnly,
        alternateMaxLen,
      );
      setAlternatePhoneCode(parsedAlternate.dialCode);

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
        alternatePhone: trimmedAlternate || "",
        customerType: data.customerType || "",
        source: mapApiSourceToUiDropdown(data.source || ""),
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
      const nextCustomerType = data.customerType || "";
      const nextSource = mapApiSourceToUiDropdown(data.source || "");
      setTier(nextTier);
      setBalanceAmount(nextBalanceAmount);
      setBalanceType(nextBalanceType);
      setCustomerType(nextCustomerType);
      setSource(nextSource);

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: parsed.dialCode,
        alternatePhoneCodeValue: parsedAlternate.dialCode,
        customerTypeValue: nextCustomerType,
        sourceValue: nextSource,
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
        alternatePhone: "",
        customerType: "",
        source: "",
      };
      setFormData(nextFormData);

      setExistingDocuments([]);
      setAttachedFiles([]);
      const nextPhoneCode = "+91";
      const nextAlternatePhoneCode = "+91";
      const nextTier = "";
      const nextBalanceAmount = "";
      const nextBalanceType: "debit" | "credit" = "debit";
      const nextCustomerType = "";
      const nextSource = "";
      setPhoneCode(nextPhoneCode);
      setAlternatePhoneCode(nextAlternatePhoneCode);
      setTier(nextTier);
      setBalanceAmount(nextBalanceAmount);
      setBalanceType(nextBalanceType);
      setCustomerType(nextCustomerType);
      setSource(nextSource);

      initialSnapshotRef.current = buildSnapshot({
        formData: nextFormData,
        phoneCodeValue: nextPhoneCode,
        alternatePhoneCodeValue: nextAlternatePhoneCode,
        customerTypeValue: nextCustomerType,
        sourceValue: nextSource,
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
      alternatePhoneCodeValue: alternatePhoneCode,
      customerTypeValue: customerType,
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
    customerType,
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

  const submitCustomer = async ({
    requireFullValidation = true,
    isDraft = false,
  }: {
    requireFullValidation?: boolean;
    isDraft?: boolean;
  } = {}) => {
    if (requireFullValidation) {
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

      if (!customerType) {
        showErrorToast("Please select customer type to proceed");
        setInvalidField("customerType");
        return;
      }
    }

    const user = getAuthUser() as any;
    const ownerIdFromAuth = user?._id;
    const businessId = user?.businessId;

    try {
      if (formData.email && !isValidEmail(String(formData.email))) {
        showErrorToast("Email format is invalid");
        return;
      }

      const formDataToSend = new FormData();

      formDataToSend.append("name", String(formData.name || ""));
      formDataToSend.append("email", formData.email || "");
      formDataToSend.append("phone", `${phoneCode}${formData.phone}`);
      if (formData.alternatePhone) {
        formDataToSend.append(
          "alternatePhone",
          `${alternatePhoneCode}${formData.alternatePhone}`,
        );
      }
      formDataToSend.append("alias", formData.alias || "");
      formDataToSend.append("dateOfBirth", formData.dateOfBirth || "");
      formDataToSend.append("gstin", String(formData.gstin || ""));
      formDataToSend.append("companyName", formData.companyName || "");
      formDataToSend.append("address", String(formData.address || ""));
      formDataToSend.append("remarks", formData.remarks || "");
      formDataToSend.append("tier", tier || "");
      formDataToSend.append("customerType", customerType || "");
      formDataToSend.append(
        "source",
        mapUiSourceToApi(
          source,
          SOURCE_OPTIONS.find((option) => option.value === source)?.label,
        ),
      );
      formDataToSend.append(
        "ownerId",
        String(formData.ownerId || ownerId || ownerIdFromAuth || ""),
      );
      formDataToSend.append("businessId", businessId || "");
      formDataToSend.append("customId", customerCode || "");

      if (isDraft) {
        formDataToSend.append("isDraft", "true");
      }

      if (balanceAmount) {
        formDataToSend.append("openingBalance", String(balanceAmount));
        formDataToSend.append("balanceType", balanceType);
      }

      attachedFiles.forEach((file) => {
        formDataToSend.append("documents", file);
      });

      const response = await createCustomer(formDataToSend);
      const created = response?.customer || response;
      console.log("Customer created successfully:", created);

      if (created?._id) {
        updateGeneralInfo({ customer: created._id });
        setLastAddedCustomer({ id: created._id, name: created.name || "" });
        onSuccess?.();
      }

      onCancel();
    } catch (error: unknown) {
      const message = getCustomerErrorMessage(error);
      showErrorToast(message);
      console.error("Error creating customer:", message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCustomer({ requireFullValidation: true });
  };

  const handleSaveAsDraft = async () => {
    await submitCustomer({ requireFullValidation: false, isDraft: true });
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

      if (!customerType) {
        showErrorToast("Please select customer type to proceed");
        setInvalidField("customerType");
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
        alternatePhone: formData.alternatePhone
          ? `${alternatePhoneCode}${formData.alternatePhone}`
          : undefined,
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
        customerType: customerType || undefined,
        source:
          mapUiSourceToApi(
            source,
            SOURCE_OPTIONS.find((option) => option.value === source)?.label,
          ) || undefined,
        remarks: formData.remarks || undefined,
        ownerId: formData.ownerId || ownerId || undefined,

        documents: existingDocuments,
      };

      const updated = await updateCustomer(customerId, updatePayload);
      console.log("Customer updated:", updated);
      onSuccess?.();
      onCancel(); // close sheet
    } catch (error: unknown) {
      const message = getCustomerErrorMessage(error);
      showErrorToast(message);
      console.error("Update error:", message);
    }
  };

  const sheetTitle = useMemo(() => {
    const label =
      mode === "view"
        ? "Customer Details"
        : mode === "edit"
          ? "Edit Customer"
          : "Add New Customer";

    if (!customerCode) return label;

    return (
      <span className="flex items-center gap-2">
        <span>{label}</span>
        <span className="text-[#D1D5DB] font-normal">|</span>
        <span className="font-semibold text-[#1F2937]">{customerCode}</span>
      </span>
    );
  }, [mode, customerCode]);

  const linkSourceProfile = useMemo((): LinkProfileSource => {
    return {
      profileType: "Customer",
      id: customerCode || data?.customId || "—",
      name: formData.name || "New Customer",
      ...(formData.alias ? { nickname: formData.alias } : {}),
      tier: mapTierToNumber(tier),
    };
  }, [customerCode, data?.customId, formData.alias, formData.name, tier]);

  const openLinkModal = useCallback((target: "Vendor" | "Traveller") => {
    setLinkTargetType(target);
    setIsLinkModalOpen(true);
  }, []);

  const linkMenuIcon = (
    <Image
      src="/icons/link-icon.svg"
      alt=""
      width={14}
      height={14}
      className="object-contain"
    />
  );

  const headerRight = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1 text-[12px] font-medium text-[#7135AD] hover:bg-[#7135AD0D] transition-colors"
        >
          <Image
            src="/icons/link-icon.svg"
            alt=""
            width={12}
            height={12}
            className="object-contain"
          />
          Vendor 0
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1 text-[12px] font-medium text-[#7135AD] hover:bg-[#7135AD0D] transition-colors"
        >
          <Image
            src="/icons/link-icon.svg"
            alt=""
            width={12}
            height={12}
            className="object-contain"
          />
          Traveller 0
        </button>
        <ActionMenu
          width="w-[10.5rem]"
          right="right-0"
          placement="below"
          actions={[
            {
              label: "Link Vendor",
              icon: linkMenuIcon,
              color: "text-[#414141]",
              onClick: () => openLinkModal("Vendor"),
              showDividerAfter: true,
            },
            {
              label: "Link Traveller",
              icon: linkMenuIcon,
              color: "text-[#414141]",
              onClick: () => openLinkModal("Traveller"),
            },
          ]}
        />
      </div>
    ),
    [openLinkModal],
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

  const customerTypeDropdownOptions = useMemo(
    () =>
      CUSTOMER_TYPE_OPTIONS.map((option) => ({
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
          onSubmit={handleSubmit}
          ref={formRef as any}
          noValidate
        >
          <div className="sidesheet-scroll-body space-y-6 p-4 pb-6">
            {/* Error Alert Popup (reuse login style) */}
            {/* {mounted &&
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
            )} */}
            {/* ================= BASIC DETAILS ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3 -mt-2">
              <h2 className="text-[13px] font-medium mb-2">Basic Details</h2>
              <hr className="mt-1 mb-3 border-t border-gray-200" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Contact Number
                  </label>
                  <div className={MODAL_FIELD_INPUT_GROUP_CLASS}>
                    <PhoneCodeSelect
                      value={phoneCode}
                      onChange={(v) => setPhoneCode(v)}
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0"
                      customHeight="h-9"
                      noBorder
                      noButtonRadius
                    />
                    <div className="modal-field-input-group__divider" aria-hidden />
                    <input
                      name="phone"
                      type="text"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={phoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className={MODAL_FIELD_INPUT_GROUP_INNER_CLASS}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Alternate Contact Number
                  </label>
                  <div className={MODAL_FIELD_INPUT_GROUP_CLASS}>
                    <PhoneCodeSelect
                      value={alternatePhoneCode}
                      onChange={(v) => setAlternatePhoneCode(v)}
                      disabled={readOnly}
                      customWidth="w-[88px]"
                      menuWidth="w-[18rem]"
                      className="flex-shrink-0"
                      customHeight="h-9"
                      noBorder
                      noButtonRadius
                    />
                    <div className="modal-field-input-group__divider" aria-hidden />
                    <input
                      name="alternatePhone"
                      type="text"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      maxLength={alternatePhoneMaxLength}
                      placeholder="Enter Contact Number"
                      disabled={readOnly}
                      className={MODAL_FIELD_INPUT_GROUP_INNER_CLASS}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex flex-col gap-1 w-full">
                  <SingleCalendar
                    label="Date of Birth"
                    value={formData.dateOfBirth || ""}
                    onChange={(iso) =>
                      setFormData((prev) => ({ ...prev, dateOfBirth: iso }))
                    }
                    placeholder="Select Date"
                    customWidth="w-full mt-1.5 py-2"
                    showCalendarIcon={true}
                    readOnly={readOnly}
                    maxDate={new Date().toISOString()}
                  />
                </div>
              </div>
            </div>

            {/* ================= BUSINESS & IDENTITY ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3">
              <h2 className="text-[13px] font-medium mb-2">
                Business &amp; Identity
              </h2>
              <hr className="mt-1 mb-3 border-t border-gray-200" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Customer Type <span className="text-red-500">*</span>
                  </label>
                  <DropDown
                    options={customerTypeDropdownOptions}
                    value={customerType}
                    onChange={(v) => {
                      setCustomerType(v);
                      if (invalidField === "customerType") {
                        setInvalidField(null);
                      }
                    }}
                    placeholder="Select Customer Type"
                    disabled={readOnly}
                    customWidth="w-full"
                    menuWidth="w-full"
                    className="w-full"
                    buttonClassName={`${MODAL_FIELD_DROPDOWN_BUTTON_CLASS} ${
                      invalidField === "customerType"
                        ? "border-red-300 modal-field-input--error"
                        : ""
                    }`}
                    noButtonRadius
                    noBorder
                    focusRingClass=""
                  />
                </div>
              </div>
            </div>

            {/* ================= OPENING BALANCE ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3">
              <h2 className="text-[13px] font-medium mb-2">Opening Balance</h2>
              <hr className="mt-1 mb-3 border-t border-gray-200" />

              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="debit"
                    checked={balanceType === "debit"}
                    onChange={() => setBalanceType("debit")}
                    className="modal-radio"
                    disabled={readOnly}
                  />
                  <span className="text-[#414141]">Debit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input
                    type="radio"
                    name="balanceType"
                    value="credit"
                    checked={balanceType === "credit"}
                    onChange={() => setBalanceType("credit")}
                    className="modal-radio"
                    disabled={readOnly}
                  />
                  <span className="text-[#414141]">Credit</span>
                </label>
              </div>

              <div className="relative mb-3">
                <div
                  className={`${MODAL_FIELD_INPUT_GROUP_CLASS} items-center py-2 pl-3 pr-44`}
                >
                  <span className="mr-2 shrink-0 text-[13px] text-gray-500">
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
                    className={MODAL_FIELD_INPUT_GROUP_INNER_PLAIN_CLASS}
                  />
                </div>
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] font-medium ${
                    balanceType === "debit" ? "text-[#419836]" : "text-red-500"
                  }`}
                >
                  {balanceType === "debit"
                    ? `Customer pays you ${getStoredCurrencySymbol()}`
                    : `You pay the customer ${getStoredCurrencySymbol()}`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Source
                  </label>
                  <DropDown
                    options={sourceDropdownOptions}
                    value={source}
                    onChange={(v) => setSource(v)}
                    placeholder="Select Source"
                    disabled={readOnly}
                    customWidth="w-full"
                    menuWidth="w-full"
                    className="w-full"
                    buttonClassName={MODAL_FIELD_DROPDOWN_BUTTON_CLASS}
                    noButtonRadius
                    noBorder
                    focusRingClass=""
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    Tier
                  </label>
                  <DropDown
                    options={TIER_OPTIONS}
                    value={tier}
                    onChange={(v) => setTier(v)}
                    placeholder="Select Tier"
                    disabled={readOnly}
                    customWidth="w-full"
                    menuWidth="w-full"
                    className="w-full"
                    buttonClassName={MODAL_FIELD_DROPDOWN_BUTTON_CLASS}
                    noButtonRadius
                    noBorder
                    focusRingClass=""
                  />
                </div>
              </div>
            </div>

            {/* ================= DOCUMENTS ================ */}
            <div className="border border-gray-200 rounded-[12px] p-3">
              <h2 className="text-[13px] font-medium mb-2">Documents</h2>
              <hr className="mt-1 mb-3 border-t border-gray-200" />

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
                className={`px-3 py-1.5 flex items-center gap-1.5 bg-white text-[#7135AD] border border-[#7135AD] rounded-md text-[13px] font-medium hover:bg-[#7135AD0D] transition-colors ${
                  readOnly || attachedFiles.length >= 3
                    ? "opacity-50 cursor-not-allowed hover:bg-white"
                    : ""
                }`}
              >
                <MdOutlineFileUpload size={16} /> Attach Files
              </button>

              <div className="mt-2 flex flex-col gap-2">
                {existingDocuments.map((doc, i) => (
                  <div
                    key={`${doc.key || doc.fileName || doc.originalName}-${i}`}
                    className="flex items-center justify-between w-full bg-white rounded-md px-3 py-2 hover:bg-gray-50 transition"
                  >
                    <button
                      type="button"
                      onClick={() => doc.url && window.open(doc.url, "_blank")}
                      className="text-[#7135AD] border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2 hover:bg-[#7135AD0D] hover:border-[#7135AD33] transition-colors cursor-pointer"
                      title="Click to view document"
                    >
                      <FaRegFolder className="text-[#7135AD] w-3 h-3" />
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
                    className="flex items-center justify-between w-full bg-white rounded-md px-3 py-2 hover:bg-gray-50 transition"
                  >
                    <span className="text-[#7135AD] border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2">
                      <FaRegFolder className="text-[#7135AD] w-3 h-3" />
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

              <div className="flex items-center gap-1 mt-2 text-[11px] text-[#9CA3AF]">
                <HiOutlineInformationCircle size={14} />
                Maximum of 3 files can be uploaded
              </div>
            </div>

            {/* ================= INTERNAL NOTES ================ */}
            <RemarksField
              label="Internal Notes"
              value={formData.remarks}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, remarks: val }))
              }
              readOnly={readOnly}
              placeholder="Enter your internal notes here..."
              className="mt-0"
            />

            {/* ================= ACTION BUTTONS ================ */}
          </div>
          <div className="z-30 shrink-0 border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex justify-end gap-2">
              {mode === "view" ? (
                <Button
                  text="Close"
                  onClick={onCancel}
                  bgColor="bg-white"
                  textColor="text-gray-700"
                  className="border border-gray-300 hover:bg-gray-100 rounded-[15px] px-4 py-2"
                />
              ) : mode === "edit" ? (
                <>
                  <Button
                    text="Cancel"
                    onClick={onCancel}
                    bgColor="bg-white"
                    textColor="text-[#7135AD]"
                    className="border border-[#7135AD] hover:bg-[#7135AD0D] rounded-[15px] px-4 py-2"
                  />
                  <Button
                    text="Update Customer"
                    onClick={handleUpdateCustomer}
                    bgColor="bg-[#7135AD]"
                    textColor="text-white"
                    className="hover:opacity-90 rounded-[15px] px-4 py-2"
                  />
                </>
              ) : (
                <>
                  <Button
                    text="Save as Draft"
                    onClick={handleSaveAsDraft}
                    bgColor="bg-white border border-[#7135AD]"
                    textColor="text-[#7135AD]"
                    className="hover:bg-[#7135AD0D] rounded-[15px] px-4 py-2"
                  />
                  <Button
                    text="Save Details"
                    type="submit"
                    bgColor="bg-[#7135AD]"
                    textColor="text-white"
                    className="hover:opacity-90 rounded-[15px] px-4 py-2"
                  />
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
      {isLinkModalOpen && (
        <LinkProfilesModal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setLinkTargetType("");
          }}
          sourceProfile={linkSourceProfile}
          initialTargetProfileType={
            linkTargetType || undefined
          }
        />
      )}
    </>
  );
};

export default AddCustomerSideSheet;
