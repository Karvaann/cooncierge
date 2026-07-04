"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import SingleCalendar from "@/components/SingleCalendar";
import SideSheet from "@/components/SideSheet";
import { useBooking } from "@/context/BookingContext";
import { createTraveller, updateTraveller } from "@/services/travellerApi";
import { getAuthUser } from "@/services/storage/authStorage";
import generateCustomId from "@/utils/helper";
import PhoneCodeSelect from "@/components/PhoneCodeSelect";
import DropDown from "@/components/DropDown";
import ActionMenu from "@/components/Menus/ActionMenu";
import RemarksField from "@/components/forms/components/RemarksField";
import DirectoryFormFooter from "@/components/directory/DirectoryFormFooter";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import LinkProfilesModal, {
  type LinkProfileSource,
} from "@/components/Modals/LinkProfilesModal";
import {
  MODAL_FIELD_INPUT_CLASS,
  MODAL_FIELD_INPUT_GROUP_CLASS,
  MODAL_FIELD_INPUT_GROUP_INNER_CLASS,
} from "@/components/atoms/modalFieldStyles";
import { FaRegFolder } from "react-icons/fa";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { HiOutlineInformationCircle } from "react-icons/hi";
import {
  mapApiSourceToUiDropdown,
  mapUiSourceToApi,
  mapTierToNumber,
} from "@/utils/directoryApiMappers";
import {
  allowOnlyDigitsWithMax,
  allowOnlyText,
  isValidEmail,
} from "@/utils/inputValidators";
import {
  getPhoneNumberMaxLength,
  splitPhoneWithDialCode,
} from "@/utils/phoneUtils";
import { countryDialCodes } from "@/utils/countryDialCodes";

interface TravellerFormData {
  name: string;
  alias: string;
  phone: string;
  alternatePhone: string;
  email: string;
  dateOfBirth: string;
  address: string;
  city: string;
  pinCode: string;
  country: string;
  remarks: string;
}

interface AddNewTravellerFormProps {
  onSubmit?: (data: TravellerFormData) => void;
  isSubmitting?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: "create" | "edit" | "view";
  data?: any;
  travellerCode?: string;
}

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

const inputClassName = MODAL_FIELD_INPUT_CLASS;

const emptyFormData = (): TravellerFormData => ({
  name: "",
  alias: "",
  phone: "",
  alternatePhone: "",
  email: "",
  dateOfBirth: "",
  address: "",
  city: "",
  pinCode: "",
  country: "",
  remarks: "",
});

const AddNewTravellerForm: React.FC<AddNewTravellerFormProps> = ({
  isSubmitting = false,
  formRef,
  isOpen,
  onClose,
  mode = "create",
  data,
  travellerCode: travellerCodeProp,
}) => {
  const [formData, setFormData] = useState<TravellerFormData>(emptyFormData());
  const [phoneCode, setPhoneCode] = useState<string>("+91");
  const [alternatePhoneCode, setAlternatePhoneCode] = useState<string>("+91");
  const [source, setSource] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [travellerCode, setTravellerCode] = useState("");
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isDeleteLinkageOpen, setIsDeleteLinkageOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const { isAddTravellerOpen, closeAddTraveller, setLastAddedTraveller } =
    useBooking();
  const readOnly = mode === "view";
  const open = typeof isOpen === "boolean" ? isOpen : isAddTravellerOpen;
  const handleClose = onClose || closeAddTraveller;

  const phoneMaxLength = getPhoneNumberMaxLength(phoneCode);
  const alternatePhoneMaxLength = getPhoneNumberMaxLength(alternatePhoneCode);

  useEffect(() => {
    if (mode === "create") {
      setTravellerCode(travellerCodeProp || generateCustomId("traveller"));
    } else {
      setTravellerCode(data?.customId || data?.travellerID || data?._id || "");
    }
  }, [mode, data, travellerCodeProp]);

  useEffect(() => {
    if (!data) return;

    const parsedPhone = splitPhoneWithDialCode(
      String(data.phone || data.contactnumber || ""),
      "+91",
    );
    const parsedAlternatePhone = splitPhoneWithDialCode(
      String(data.alternatePhone || ""),
      "+91",
    );

    setFormData({
      name: data.name || "",
      alias: data.alias || data.nickname || "",
      phone: allowOnlyDigitsWithMax(
        parsedPhone.number || "",
        getPhoneNumberMaxLength(parsedPhone.dialCode),
      ),
      alternatePhone: allowOnlyDigitsWithMax(
        parsedAlternatePhone.number || "",
        getPhoneNumberMaxLength(parsedAlternatePhone.dialCode),
      ),
      email: data.email || data.emailId || "",
      dateOfBirth: data.dateOfBirth || data.dateofbirth || "",
      address: data.address || "",
      city: data.city || "",
      pinCode: data.pinCode || data.pincode || "",
      country: data.country || "",
      remarks: data.remarks || "",
    });
    setPhoneCode(parsedPhone.dialCode || "+91");
    setAlternatePhoneCode(parsedAlternatePhone.dialCode || "+91");
    setTier(data.tier || "");
    setSource(
      mapApiSourceToUiDropdown(
        typeof data.source === "string"
          ? data.source
          : data.source?.type || "",
      ),
    );
  }, [data]);

  const resetForm = useCallback(() => {
    setFormData(emptyFormData());
    setPhoneCode("+91");
    setAlternatePhoneCode("+91");
    setSource("");
    setTier("");
    setAttachedFiles([]);
    if (mode === "create") {
      setTravellerCode(generateCustomId("traveller"));
    }
  }, [mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "name" || name === "alias" || name === "city") {
      nextValue = allowOnlyText(value);
    } else if (name === "phone") {
      nextValue = allowOnlyDigitsWithMax(value, phoneMaxLength);
    } else if (name === "alternatePhone") {
      nextValue = allowOnlyDigitsWithMax(value, alternatePhoneMaxLength);
    } else if (name === "pinCode") {
      nextValue = allowOnlyDigitsWithMax(value, 6);
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachedFiles((prev) => [...prev, ...files].slice(0, 3));
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPayload = (isDraft = false) => {
    const storedUser = getAuthUser<any>();
    const ownerId = storedUser?.id || storedUser?._id;

    const phonePayload = formData.phone
      ? `${phoneCode}${formData.phone}`
      : undefined;
    const alternatePhonePayload = formData.alternatePhone
      ? `${alternatePhoneCode}${formData.alternatePhone}`
      : undefined;

    return {
      name: String(formData.name || "").trim(),
      alias: formData.alias || undefined,
      email: String(formData.email || "").trim() || undefined,
      phone: phonePayload,
      alternatePhone: alternatePhonePayload,
      dateOfBirth: formData.dateOfBirth || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      pinCode: formData.pinCode || undefined,
      country: formData.country || undefined,
      tier: tier || undefined,
      source: mapUiSourceToApi(
        source,
        SOURCE_OPTIONS.find((option) => option.value === source)?.label,
      ) || undefined,
      remarks: formData.remarks || undefined,
      ownerId,
      customId: travellerCode,
      ...(isDraft ? { isDraft: true } : {}),
    };
  };

  const validateBeforeSubmit = (requireFullValidation = true) => {
    if (requireFullValidation && !formData.name.trim()) {
      nameRef.current?.focus();
      return false;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      return false;
    }
    return true;
  };

  const submitTraveller = async ({
    requireFullValidation = true,
    isDraft = false,
  }: {
    requireFullValidation?: boolean;
    isDraft?: boolean;
  } = {}) => {
    if (!validateBeforeSubmit(requireFullValidation)) return;

    try {
      setSubmitting(true);
      const payload = buildPayload(isDraft);
      const created = await createTraveller(payload);
      const id: string = created?._id || created?.id || "";
      const displayName = created?.name || payload.name;
      setLastAddedTraveller({ id, name: displayName });
      handleClose();
      resetForm();
    } catch (err: any) {
      console.error(
        "[AddNewTravellerForm] Error creating traveller:",
        err?.response?.data?.message || err?.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      await submitTraveller({ requireFullValidation: true });
    },
    [formData, phoneCode, alternatePhoneCode, source, tier, travellerCode],
  );

  const handleSaveAsDraft = async () => {
    await submitTraveller({ requireFullValidation: false, isDraft: true });
  };

  const handleUpdate = async () => {
    if (!validateBeforeSubmit(true)) return;

    try {
      setSubmitting(true);
      const id = data?._id || data?.id;
      if (!id) throw new Error("Missing traveller id");
      const updated = await updateTraveller(String(id), buildPayload());
      setLastAddedTraveller({
        id: updated?._id || id,
        name: updated?.name || formData.name,
      });
      handleClose();
    } catch (err: any) {
      console.error(
        "[AddNewTravellerForm] Error updating traveller:",
        err?.response?.data?.message || err?.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestClose = () => {
    if (readOnly) {
      handleClose();
      return;
    }
    if (mode === "create") {
      setIsCloseConfirmOpen(true);
      return;
    }
    handleClose();
  };

  const sheetTitle = useMemo(() => {
    const label =
      mode === "view"
        ? "Traveller Details"
        : mode === "edit"
          ? "Edit Traveller"
          : "Add New Traveller";

    if (!travellerCode) return label;

    return (
      <span className="flex items-center gap-2">
        <span>{label}</span>
        <span className="font-normal text-[#D1D5DB]">|</span>
        <span className="font-semibold text-[#1F2937]">{travellerCode}</span>
      </span>
    );
  }, [mode, travellerCode]);

  const linkSourceProfile = useMemo((): LinkProfileSource => {
    return {
      profileType: "Traveller",
      id: travellerCode || "—",
      name: formData.name || "New Traveller",
      ...(formData.alias ? { nickname: formData.alias } : {}),
      tier: mapTierToNumber(tier),
    };
  }, [formData.alias, formData.name, tier, travellerCode]);

  const openLinkTravellerModal = useCallback(() => {
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
          className="flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1 text-[12px] font-medium text-[#7135AD] transition-colors hover:bg-[#7135AD0D]"
        >
          <Image
            src="/icons/link-icon.svg"
            alt=""
            width={12}
            height={12}
            className="object-contain"
          />
          Customer 0
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
          Vendor 1
        </button>
        <ActionMenu
          width="w-[10.5rem]"
          right="right-0"
          placement="below"
          actions={[
            {
              label: "Link Traveller",
              icon: linkMenuIcon,
              color: "text-[#126ACB]",
              onClick: openLinkTravellerModal,
              showDividerAfter: true,
            },
            {
              label: "Delete Linkage",
              icon: <FiTrash2 size={14} />,
              color: "text-red-500",
              onClick: () => setIsDeleteLinkageOpen(true),
            },
          ]}
        />
      </div>
    ),
    [openLinkTravellerModal],
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

  const countryDropdownOptions = useMemo(
    () =>
      countryDialCodes.map((country) => ({
        value: country.name,
        label: <span className="text-[13px]">{country.name}</span>,
        searchLabel: country.name,
      })),
    [],
  );

  return (
    <>
      <SideSheet
        isOpen={open}
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
          ref={formRef as React.RefObject<HTMLFormElement>}
          onSubmit={handleSubmit}
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
                    className={inputClassName}
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
                  <div className={MODAL_FIELD_INPUT_GROUP_CLASS}>
                    <PhoneCodeSelect
                      value={phoneCode}
                      onChange={setPhoneCode}
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
                      onChange={setAlternatePhoneCode}
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="flex flex-col gap-1">
                  <SingleCalendar
                    label="Date of Birth"
                    value={formData.dateOfBirth || ""}
                    onChange={(iso) =>
                      setFormData((prev) => ({ ...prev, dateOfBirth: iso }))
                    }
                    placeholder="Select Date"
                    customWidth="w-full mt-1.5"
                    inputStyleClass={`${MODAL_FIELD_INPUT_CLASS} px-3 py-2 pr-8 text-[13px]`}
                    showCalendarIcon
                    readOnly={readOnly}
                    maxDate={new Date().toISOString()}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="rounded-[12px] border border-gray-200 p-3">
              <h2 className="mb-2 text-[13px] font-medium">Address</h2>
              <hr className="mb-3 mt-1 border-t border-gray-200" />

              <div className="mb-3 flex flex-col gap-1">
                <label className="block text-[13px] font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter Address"
                  rows={3}
                  disabled={readOnly}
                  className={inputClassName}
                />
              </div>

              <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    City
                  </label>
                  <input
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter City"
                    disabled={readOnly}
                    className={inputClassName}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-[13px] font-medium text-gray-700">
                    PIN Code
                  </label>
                  <input
                    name="pinCode"
                    type="text"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="Enter PIN Code"
                    maxLength={6}
                    disabled={readOnly}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[13px] font-medium text-gray-700">
                  Country
                </label>
                <DropDown
                  options={countryDropdownOptions}
                  value={formData.country}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, country: value }))
                  }
                  placeholder="Select Country"
                  disabled={readOnly}
                  searchable
                  searchPlaceholder="Search country..."
                  customWidth="w-full"
                  menuWidth="w-full"
                  focusRingClass="focus:ring-1 focus:ring-[#7135AD]"
                />
              </div>
            </div>

            {/* Source & Tier */}
            <div className="rounded-[12px] border border-gray-200 p-3">
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
                {attachedFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 transition hover:bg-gray-50"
                  >
                    <span className="-ml-2 flex items-center gap-2 truncate rounded-md border border-gray-200 bg-gray-100 p-1 text-[13px] text-[#7135AD]">
                      <FaRegFolder className="h-3 w-3 text-[#7135AD]" />
                      {file.name}
                    </span>
                    {!readOnly ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
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
              value={formData.remarks}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, remarks: val }))
              }
              readOnly={readOnly}
              placeholder="Enter your internal notes here..."
              className="mt-0 mb-[200px]"
            />
          </div>

          <DirectoryFormFooter
            mode={mode}
            onClose={handleRequestClose}
            onUpdate={handleUpdate}
            updateLabel="Update Traveller"
            isSubmitting={isSubmitting || submitting}
            submittingLabel={mode === "edit" ? "Updating..." : "Saving..."}
          />
        </form>
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
            handleClose();
          }}
        />
      )}
      {isLinkModalOpen && (
        <LinkProfilesModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          sourceProfile={linkSourceProfile}
        />
      )}
      {isDeleteLinkageOpen && (
        <ConfirmationModal
          isOpen={isDeleteLinkageOpen}
          onClose={() => setIsDeleteLinkageOpen(false)}
          title="Are you sure you want to delete this linkage?"
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
          onConfirm={() => {
            setIsDeleteLinkageOpen(false);
          }}
        />
      )}
    </>
  );
};

export default React.memo(AddNewTravellerForm);
