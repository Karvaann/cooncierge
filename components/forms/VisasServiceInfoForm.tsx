"use client";

import React, { useEffect, useMemo, useState } from "react";
import DateFieldsAndStatus from "@/components/forms/components/DateFieldsAndStatus";
import Documents from "@/components/forms/components/Documents";
import type {
  DocumentCategory,
  ExistingDocument,
} from "@/components/forms/components/Documents";
import RemarksField from "@/components/forms/components/RemarksField";
import DropDown from "@/components/DropDown";
import { IoChevronDown, IoChevronForward } from "react-icons/io5";
import { LuBadgeInfo } from "react-icons/lu";

interface CustomerScopedValue {
  label: string;
  value: string;
}

interface VisaServiceInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "confirmed" | "cancelled" | "rescheduled" | string;
  cancellationDate?: string;
  newBookingDate?: string;
  newTravelDate?: string;
  destination: string;
  nationality: string;
  visaStatus: "drafted" | "applied" | "approved" | "rejected" | string;
  visaType: string;
  description: string;
  applicantNumbers?: CustomerScopedValue[];
  visaNumbers?: CustomerScopedValue[];
  remarks: string;
}

interface ExternalFormData {
  formFields?: Partial<VisaServiceInfoFormData>;
  visainfoform?: Partial<VisaServiceInfoFormData>;
}

interface VisasServiceInfoFormProps {
  onSubmit?: (data: VisaServiceInfoFormData) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLDivElement | HTMLFormElement | null>;
  onFormDataUpdate: (data: any) => void;
  onAddDocuments?: (files: File[], category?: DocumentCategory | string) => void;
  onRemoveDocuments?: (
    files: File[],
    category?: DocumentCategory | string,
  ) => void;
  externalFormData?: ExternalFormData | Record<string, unknown>;
  bookingCode?: string;
  generalInfoData?: Record<string, any>;
  existingDocuments?: ExistingDocument[];
}

const BOOKING_STATUS_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rescheduled", label: "Rescheduled" },
];

const SERVICE_STATUS_OPTIONS = [
  { value: "drafted", label: "Drafted" },
  { value: "applied", label: "Applied" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const DESTINATION_OPTIONS = [
  "Australia",
  "Canada",
  "France",
  "Germany",
  "Japan",
  "New Zealand",
  "Singapore",
  "Thailand",
  "UAE",
  "UK",
  "USA",
].map((value) => ({ value, label: value }));

const NATIONALITY_OPTIONS = [
  "American",
  "Australian",
  "British",
  "Canadian",
  "Emirati",
  "French",
  "German",
  "Indian",
  "Japanese",
  "Singaporean",
  "Thai",
].map((value) => ({ value, label: value }));

const VISA_EXEMPTION_RULES: Record<string, string[]> = {
  uk: ["american", "canadian", "australian", "japanese", "singaporean"],
  singapore: ["american", "british", "canadian", "australian", "japanese"],
  thailand: ["american", "british", "canadian", "australian", "japanese"],
  uae: ["american", "british", "canadian", "australian"],
};

const normalizeBookingStatus = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "canceled") return "cancelled";
  if (
    normalized === "confirmed" ||
    normalized === "cancelled" ||
    normalized === "rescheduled"
  ) {
    return normalized;
  }
  return "";
};

const normalizeServiceStatus = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (
    normalized === "drafted" ||
    normalized === "applied" ||
    normalized === "approved" ||
    normalized === "rejected"
  ) {
    return normalized;
  }
  return "";
};

const getUserNickname = (
  generalInfoData?: Record<string, any>,
  externalFormData?: Record<string, any>,
) => {
  const candidates = [
    generalInfoData?.nickname,
    generalInfoData?.customerNickname,
    generalInfoData?.alias,
    generalInfoData?.customerAlias,
    (externalFormData as any)?.nickname,
    (externalFormData as any)?.customerNickname,
    (externalFormData as any)?.alias,
  ];
  return candidates.find((value) => String(value ?? "").trim()) ?? "";
};

const normalizeCustomerScopedValues = (
  source: unknown,
  customerLabels: string[],
): CustomerScopedValue[] => {
  const incoming = Array.isArray(source) ? source : [];

  return customerLabels.map((label, index) => {
    const existing = incoming[index];

    if (typeof existing === "string") {
      return { label, value: existing };
    }

    if (existing && typeof existing === "object") {
      return {
        label,
        value: String((existing as any).value ?? (existing as any).number ?? ""),
      };
    }

    return { label, value: "" };
  });
};

const areCustomerScopedValuesEqual = (
  left: CustomerScopedValue[] = [],
  right: CustomerScopedValue[] = [],
) =>
  left.length === right.length &&
  left.every(
    (item, index) =>
      item.label === right[index]?.label && item.value === right[index]?.value,
  );

const TravelerValueAccordion = ({
  title,
  placeholder,
  items,
  isOpen,
  onToggle,
  onChange,
  isReadOnly,
  isSubmitting,
}: {
  title: string;
  placeholder: string;
  items: CustomerScopedValue[];
  isOpen: boolean;
  onToggle: () => void;
  onChange: (index: number, value: string) => void;
  isReadOnly: boolean;
  isSubmitting: boolean;
}) => (
  <div className="rounded-[12px] border border-[#E2E1E1] bg-white overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      disabled={isReadOnly || isSubmitting}
      className="w-full flex items-center justify-between px-4 py-3 text-left"
    >
      <span className="text-[13px] font-[400] text-[#020202]">{title}</span>
      <span className="flex items-center gap-3">
        <span className="inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-[#F4ECFF] px-2 text-[12px] font-[600] text-[#7135AD]">
          {items.length}
        </span>
        {isOpen ? (
          <IoChevronDown className="text-[#818181]" size={16} />
        ) : (
          <IoChevronForward className="text-[#818181]" size={16} />
        )}
      </span>
    </button>

    {isOpen ? (
      <div className="border-t border-[#F0F0F0] bg-[#FCFCFC] px-4 py-3">
        <div className="space-y-3">
          {items.map((item, index) => {
            const isLeadPax = index === 0;

            return (
              <div
                key={`${title}-${index}`}
                className="rounded-[12px] bg-white px-3 py-2 shadow-[0_0_0_1px_rgba(226,225,225,1)]"
              >
                <div className="mb-2 flex items-center gap-2 text-[13px] font-[500] text-[#414141]">
                  <LuBadgeInfo size={14} className="text-[#9CA3AF]" />
                  <span>
                    {item.label}
                    {isLeadPax ? (
                      <span className="ml-1 text-[12px] font-[500] text-[#9CA3AF]">
                        (Lead Pax)
                      </span>
                    ) : null}
                  </span>
                </div>

                <input
                  type="text"
                  value={item.value}
                  onChange={(event) => onChange(index, event.target.value)}
                  placeholder={placeholder}
                  disabled={isReadOnly || isSubmitting}
                  className="w-full border border-[#D1D5DB] rounded-[15px] px-3 py-2 text-[13px] outline-none transition-colors hover:border-[#C6AEDE] focus:ring-1 focus:ring-[#C6AEDE] disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            );
          })}
        </div>
      </div>
    ) : null}
  </div>
);

const VisasServiceInfoForm: React.FC<VisasServiceInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  isReadOnly = false,
  formRef,
  onFormDataUpdate,
  onAddDocuments,
  onRemoveDocuments,
  externalFormData,
  generalInfoData,
  existingDocuments = [],
}) => {
  const normalizedExternalData = useMemo(() => {
    const source = (externalFormData ?? {}) as Record<string, any>;

    if (source.visainfoform) {
      return source.visainfoform as Partial<VisaServiceInfoFormData>;
    }

    const rootFormFields =
      (source.formFields as Record<string, any> | undefined) ?? source;
    const formFields =
      (rootFormFields?.visainfoform as Record<string, any> | undefined) ??
      rootFormFields;
    const hasApiSchema =
      source &&
      typeof source === "object" &&
      (source.bookingDate || source.travelDate || source.status);

    if (!hasApiSchema) {
      return formFields as Partial<VisaServiceInfoFormData>;
    }

    return {
      bookingdate: source.bookingDate || formFields.bookingdate || "",
      traveldate: source.travelDate || formFields.traveldate || "",
      bookingstatus:
        formFields.bookingstatus || source.status || formFields.status || "",
      destination:
        formFields.destination ||
        formFields.country ||
        formFields.countryDestination ||
        "",
      nationality: formFields.nationality || "",
      visaStatus:
        formFields.visaStatus ||
        formFields.serviceFormStatus ||
        formFields.serviceStatus ||
        "",
      visaType: formFields.visaType || formFields.title || "",
      description: formFields.description || "",
      remarks: formFields.remarks || formFields.internalNotes || "",
      cancellationDate:
        source.cancellationDate || formFields.cancellationDate || "",
      newBookingDate: source.newBookingDate || formFields.newBookingDate || "",
      newTravelDate: source.newTravelDate || formFields.newTravelDate || "",
      applicantNumbers: Array.isArray(formFields.applicantNumbers)
        ? formFields.applicantNumbers
        : [],
      visaNumbers: Array.isArray(formFields.visaNumbers)
        ? formFields.visaNumbers
        : [],
    } as Partial<VisaServiceInfoFormData>;
  }, [externalFormData]);

  const customerLabels = useMemo(() => {
    const customers = Array.isArray(generalInfoData?.customerNames)
      ? generalInfoData.customerNames
      : Array.isArray((externalFormData as any)?.customerNames)
        ? (externalFormData as any).customerNames
        : [];

    const fallbackCount = Number(
      generalInfoData?.customerCount ?? (externalFormData as any)?.customerCount ?? 1,
    );
    const count = Math.max(customers.length, fallbackCount || 1);

    return Array.from({ length: count }, (_, index) => {
      const name = String(customers[index] ?? "").trim();
      return name ? name : `Customer ${index + 1}`;
    });
  }, [externalFormData, generalInfoData]);

  const [formData, setFormData] = useState<VisaServiceInfoFormData>(() => ({
    bookingdate: String(normalizedExternalData?.bookingdate ?? ""),
    traveldate: String(normalizedExternalData?.traveldate ?? ""),
    bookingstatus:
      normalizeBookingStatus(normalizedExternalData?.bookingstatus) ||
      "confirmed",
    cancellationDate: String(normalizedExternalData?.cancellationDate ?? ""),
    newBookingDate: String(normalizedExternalData?.newBookingDate ?? ""),
    newTravelDate: String(normalizedExternalData?.newTravelDate ?? ""),
    destination: String(normalizedExternalData?.destination ?? ""),
    nationality: String(normalizedExternalData?.nationality ?? ""),
    visaStatus:
      normalizeServiceStatus((normalizedExternalData as any)?.visaStatus) ||
      "drafted",
    visaType: String(normalizedExternalData?.visaType ?? ""),
    description: String(normalizedExternalData?.description ?? ""),
    applicantNumbers: normalizeCustomerScopedValues(
      normalizedExternalData?.applicantNumbers,
      customerLabels,
    ),
    visaNumbers: normalizeCustomerScopedValues(
      normalizedExternalData?.visaNumbers,
      customerLabels,
    ),
    remarks: String(normalizedExternalData?.remarks ?? ""),
  }));
  const [isApplicantAccordionOpen, setIsApplicantAccordionOpen] = useState(true);
  const [isVisaAccordionOpen, setIsVisaAccordionOpen] = useState(false);

  useEffect(() => {
    if (!externalFormData || Object.keys(externalFormData).length === 0) return;

    setFormData((prev) => {
      const nextApplicantNumbers = normalizeCustomerScopedValues(
        normalizedExternalData?.applicantNumbers,
        customerLabels,
      );
      const nextVisaNumbers = normalizeCustomerScopedValues(
        normalizedExternalData?.visaNumbers,
        customerLabels,
      );

      const nextState = {
        ...prev,
        ...normalizedExternalData,
        bookingdate: String(normalizedExternalData?.bookingdate ?? ""),
        traveldate: String(normalizedExternalData?.traveldate ?? ""),
        bookingstatus:
        normalizeBookingStatus(normalizedExternalData?.bookingstatus) ||
        prev.bookingstatus ||
        "confirmed",
        cancellationDate: String(normalizedExternalData?.cancellationDate ?? ""),
        newBookingDate: String(normalizedExternalData?.newBookingDate ?? ""),
        newTravelDate: String(normalizedExternalData?.newTravelDate ?? ""),
        destination: String(normalizedExternalData?.destination ?? ""),
        nationality: String(normalizedExternalData?.nationality ?? ""),
        visaStatus:
        normalizeServiceStatus((normalizedExternalData as any)?.visaStatus) ||
        prev.visaStatus ||
        "drafted",
        visaType: String(normalizedExternalData?.visaType ?? ""),
        description: String(normalizedExternalData?.description ?? ""),
        applicantNumbers: nextApplicantNumbers,
        visaNumbers: nextVisaNumbers,
        remarks: String(normalizedExternalData?.remarks ?? ""),
      };

      const isSame =
        prev.bookingdate === nextState.bookingdate &&
        prev.traveldate === nextState.traveldate &&
        prev.bookingstatus === nextState.bookingstatus &&
        prev.cancellationDate === nextState.cancellationDate &&
        prev.newBookingDate === nextState.newBookingDate &&
        prev.newTravelDate === nextState.newTravelDate &&
        prev.destination === nextState.destination &&
        prev.nationality === nextState.nationality &&
        prev.visaStatus === nextState.visaStatus &&
        prev.visaType === nextState.visaType &&
        prev.description === nextState.description &&
        prev.remarks === nextState.remarks &&
        areCustomerScopedValuesEqual(
          prev.applicantNumbers,
          nextApplicantNumbers,
        ) &&
        areCustomerScopedValuesEqual(prev.visaNumbers, nextVisaNumbers);

      return isSame ? prev : nextState;
    });
  }, [customerLabels, externalFormData, normalizedExternalData]);

  useEffect(() => {
    setFormData((prev) => {
      const nextApplicantNumbers = normalizeCustomerScopedValues(
        prev.applicantNumbers,
        customerLabels,
      );
      const nextVisaNumbers = normalizeCustomerScopedValues(
        prev.visaNumbers,
        customerLabels,
      );

      if (
        areCustomerScopedValuesEqual(prev.applicantNumbers, nextApplicantNumbers) &&
        areCustomerScopedValuesEqual(prev.visaNumbers, nextVisaNumbers)
      ) {
        return prev;
      }

      return {
        ...prev,
        applicantNumbers: nextApplicantNumbers,
        visaNumbers: nextVisaNumbers,
      };
    });
  }, [customerLabels]);

  useEffect(() => {
    onFormDataUpdate({ visainfoform: formData });
  }, [formData, onFormDataUpdate]);

  const userNickname = useMemo(
    () =>
      getUserNickname(
        generalInfoData,
        externalFormData as Record<string, any> | undefined,
      ),
    [externalFormData, generalInfoData],
  );

  const visaRequirementMessage = useMemo(() => {
    const destination = formData.destination.trim().toLowerCase();
    const nationality = formData.nationality.trim().toLowerCase();

    if (!destination || !nationality) return "";

    const exemptNationalities = VISA_EXEMPTION_RULES[destination] ?? [];
    const nationalityLabel = formData.nationality.trim();

    if (exemptNationalities.includes(nationality)) {
      return `Visa is not required for ${nationalityLabel} Citizens for this destination`;
    }

    return `Visa may be required for ${nationalityLabel} Citizens for this destination`;
  }, [formData.destination, formData.nationality]);

  const selectedBookingStatus = useMemo(
    () =>
      BOOKING_STATUS_OPTIONS.find(
        (option) => option.value === formData.bookingstatus,
      )?.label ?? "Confirmed",
    [formData.bookingstatus],
  );

  const selectedServiceStatus = useMemo(
    () =>
      SERVICE_STATUS_OPTIONS.find(
        (option) => option.value === formData.visaStatus,
      )?.label ?? "Drafted",
    [formData.visaStatus],
  );

  const handleDestinationChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      destination: value,
      nationality: "",
      visaType: "",
      description: "",
    }));
  };

  const handleFieldChange =
    (field: keyof VisaServiceInfoFormData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    };

  const handleScopedValueChange = (
    field: "applicantNumbers" | "visaNumbers",
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] ?? []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, value } : item,
      ),
    }));
  };

  const searchableButtonClass =
    "w-full px-3 py-2 hover:border-[#C6AEDE] rounded-[15px] text-[13px]";

  return (
    <form
      className={`space-y-4 py-4 px-2.5 -mt-1 overflow-x-hidden ${
        isReadOnly
          ? "[&_input]:!bg-gray-200 [&_textarea]:!bg-gray-300 [&_select]:!bg-gray-200"
          : ""
      }`}
      ref={formRef as React.RefObject<HTMLFormElement>}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(formData);
      }}
    >
      <div className="px-0 py-1.5">
        <DateFieldsAndStatus
          bookingdate={formData.bookingdate}
          traveldate={formData.traveldate}
          bookingstatus={formData.bookingstatus}
          cancellationDate={formData.cancellationDate ?? ""}
          rescheduledBookingDateLabel="New Booking Date"
          rescheduledTravelDateLabel="New Travel Date"
          fieldOwner="visa-service-info"
          userNickname={String(userNickname || "")}
          onBookingDateChange={(date) =>
            setFormData((prev) => ({ ...prev, bookingdate: date }))
          }
          onTravelDateChange={(date) =>
            setFormData((prev) => ({ ...prev, traveldate: date }))
          }
          onBookingStatusChange={(status) =>
            setFormData((prev) => ({
              ...prev,
              bookingstatus: normalizeBookingStatus(status) || "confirmed",
            }))
          }
          onCancellationDateChange={(date) =>
            setFormData((prev) => ({ ...prev, cancellationDate: date }))
          }
          onNewBookingDateChange={(date) =>
            setFormData((prev) => ({ ...prev, newBookingDate: date }))
          }
          onNewTravelDateChange={(date) =>
            setFormData((prev) => ({ ...prev, newTravelDate: date }))
          }
          isReadOnly={isReadOnly}
        />

        <div className="w-full border border-[#E2E1E1] rounded-[12px] mb-3 p-3">
          <h2 className="text-[15px] font-[400] mb-2">Visa Info</h2>
          <hr className="mt-1 mb-4 border-t border-[#E2E1E1]" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[13px] font-[400] text-[#020202] mb-1">
                Country (Destination)
              </label>
              <DropDown
                options={DESTINATION_OPTIONS}
                placeholder="Choose Country"
                value={formData.destination}
                onChange={handleDestinationChange}
                searchable
                searchPlaceholder="Search destination"
                customWidth="w-full"
                menuClassName="rounded-[14px] px-1.5"
                buttonClassName={searchableButtonClass}
                noButtonRadius
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-[13px] font-[400] text-[#020202] mb-1">
                Nationality
              </label>
              <DropDown
                options={NATIONALITY_OPTIONS}
                placeholder="Choose Nationality"
                value={formData.nationality}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, nationality: value }))
                }
                searchable
                searchPlaceholder="Search nationality"
                customWidth="w-full"
                menuClassName="rounded-[14px] px-1.5"
                buttonClassName={searchableButtonClass}
                noButtonRadius
                readOnly={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-[13px] font-[400] text-[#020202] mb-1">
                Select Service Status
              </label>
              <DropDown
                options={SERVICE_STATUS_OPTIONS}
                placeholder="Select Service Status"
                  value={formData.visaStatus}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    visaStatus: normalizeServiceStatus(value) || "drafted",
                  }))
                }
                customWidth="w-full"
                menuClassName="rounded-[14px] px-1.5"
                buttonClassName={searchableButtonClass}
                noButtonRadius
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {visaRequirementMessage ? (
            <div className="mb-4 rounded-[12px] border border-[#E5D8F6] bg-[#FAF6FF] px-3 py-2 text-[12px] font-[500] text-[#7135AD]">
              {visaRequirementMessage}
            </div>
          ) : null}

          <div className="mb-4">
            <label className="block text-[13px] font-[400] text-[#020202] mb-1">
              Visa Type / Title
            </label>
            <input
              type="text"
              value={formData.visaType}
              onChange={handleFieldChange("visaType")}
              placeholder="Enter Visa Type / Title"
              disabled={isReadOnly || isSubmitting}
              className="w-full border border-[#D1D5DB] rounded-[15px] px-3 py-2 text-[13px] outline-none transition-colors hover:border-[#C6AEDE] focus:ring-1 focus:ring-[#C6AEDE] disabled:cursor-not-allowed"
            />
          </div>

          <div className="mb-2">
            <RemarksField
              label="Description"
              value={formData.description}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, description: value }))
              }
              readOnly={isReadOnly}
              isSubmitting={isSubmitting}
              showBorder={false}
            />
          </div>

          <div className="space-y-3">
            <TravelerValueAccordion
              title="Applicant Number"
              placeholder="Enter Applicant Number"
              items={formData.applicantNumbers ?? []}
              isOpen={isApplicantAccordionOpen}
              onToggle={() =>
                setIsApplicantAccordionOpen((prev) => !prev)
              }
              onChange={(index, value) =>
                handleScopedValueChange("applicantNumbers", index, value)
              }
              isReadOnly={isReadOnly}
              isSubmitting={isSubmitting}
            />

            <TravelerValueAccordion
              title="Visa Number"
              placeholder="Enter Visa Number"
              items={formData.visaNumbers ?? []}
              isOpen={isVisaAccordionOpen}
              onToggle={() => setIsVisaAccordionOpen((prev) => !prev)}
              onChange={(index, value) =>
                handleScopedValueChange("visaNumbers", index, value)
              }
              isReadOnly={isReadOnly}
              isSubmitting={isSubmitting}
            />
          </div>

          {(formData.bookingstatus === "rescheduled" ||
            formData.bookingstatus === "cancelled") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-[12px] border border-[#E2E1E1] bg-[#FCFCFC] p-3">
              <div>
                <div className="text-[12px] text-[#818181] mb-1">
                  Booking Status
                </div>
                <div className="text-[13px] font-[500] text-[#020202]">
                  {selectedBookingStatus}
                </div>
              </div>
              <div>
                <div className="text-[12px] text-[#818181] mb-1">
                  Service Status
                </div>
                <div className="text-[13px] font-[500] text-[#020202]">
                  {selectedServiceStatus}
                </div>
              </div>
            </div>
          )}
        </div>

        <Documents
          existingDocuments={existingDocuments}
          onAddDocuments={(files, category) => onAddDocuments?.(files, category)}
          onRemoveDocuments={(files, category) =>
            onRemoveDocuments?.(files, category)
          }
          isReadOnly={isReadOnly}
        />

        <RemarksField
          label="Internal Notes"
          value={formData.remarks}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, remarks: value }))
          }
          readOnly={isReadOnly}
          isSubmitting={isSubmitting}
        />
      </div>
    </form>
  );
};

export default React.memo(VisasServiceInfoForm);
