"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import DateFieldsAndStatus from "@/components/forms/components/DateFieldsAndStatus";
import AmountSection from "@/components/AmountSection";
import type { AmountSectionValue } from "@/components/AmountSection";
import Documents from "@/components/forms/components/Documents";
import RemarksField from "@/components/forms/components/RemarksField";
import { isAfterDate } from "@/utils/helper";
import { getDefaultShowAdvancedPricing } from "@/utils/advancedPricing";

interface PriceInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: string;
  remarks: string;
  costprice: string;
  costCurrency: "INR" | "USD";
  costRoe: string;
  costInr: string;
  costNotes: string;
  sellingprice: string;
  sellingCurrency: "INR" | "USD";
  sellingRoe: string;
  sellingInr: string;
  sellingNotes: string;
  vendorBasePrice: string;
  vendorBaseCurrency: "INR" | "USD";
  vendorBaseRoe: string;
  vendorBaseInr: string;
  vendorBaseNotes: string;
  vendorIncentiveReceived: string;
  vendorIncentiveCurrency: "INR" | "USD";
  vendorIncentiveRoe: string;
  vendorIncentiveInr: string;
  vendorIncentiveNotes: string;
  commissionPaid: string;
  commissionCurrency: "INR" | "USD";
  commissionRoe: string;
  commissionInr: string;
  commissionNotes: string;
  showAdvancedPricing: boolean;
  // Cancellation fields
  cancellationDate: string;
  costRefundAmount: string;
  costRefundCurrency: "INR" | "USD";
  costRefundRoe: string;
  costRefundInr: string;
  costRefundNotes: string;
  sellingRefundAmount: string;
  sellingRefundCurrency: "INR" | "USD";
  sellingRefundRoe: string;
  sellingRefundInr: string;
  sellingRefundNotes: string;
  vendorInvoiceRefundAmount: string;
  vendorInvoiceRefundCurrency: "INR" | "USD";
  vendorInvoiceRefundRoe: string;
  vendorInvoiceRefundInr: string;
  vendorInvoiceRefundNotes: string;
  chargebackAmount: string;
  chargebackCurrency: "INR" | "USD";
  chargebackRoe: string;
  chargebackInr: string;
  chargebackNotes: string;
  commissionRefundAmount: string;
  commissionRefundCurrency: "INR" | "USD";
  commissionRefundRoe: string;
  commissionRefundInr: string;
  commissionRefundNotes: string;
}

interface ExternalFormData {
  formFields?: Partial<PriceInfoFormData>;
}

interface PriceInfoProps {
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  formRef?: React.RefObject<HTMLFormElement | null>;
  onFormDataUpdate: (data: any) => void;
  onAddDocuments?: (files: File[]) => void;
  onRemoveDocuments?: (files: File[]) => void;
  externalFormData?: ExternalFormData | Record<string, unknown>;
  bookingCode?: string;
  existingDocuments?: Array<{
    originalName?: string;
    fileName?: string;
    url?: string;
    key?: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: string | Date;
    _id?: string;
  }>;
  customerCount?: number;
}

const PriceInfoForm: React.FC<PriceInfoProps> = ({
  isSubmitting = false,
  isReadOnly = false,
  formRef,
  onFormDataUpdate,
  onAddDocuments,
  onRemoveDocuments,
  externalFormData,
  bookingCode,
  existingDocuments = [],
  customerCount = 1,
}) => {
  const normalizedExternalData = useMemo(() => {
    const source = externalFormData ?? {};
    const fields =
      (source as ExternalFormData)?.formFields ??
      (source as any)?.priceinfoform ??
      source;
    return fields as Partial<PriceInfoFormData>;
  }, [externalFormData]);

  const defaultShowAdvancedPricing = useMemo(
    () => getDefaultShowAdvancedPricing(normalizedExternalData, isReadOnly),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [formData, setFormData] = useState<PriceInfoFormData>(() => ({
    bookingdate: normalizedExternalData?.bookingdate || "",
    traveldate: normalizedExternalData?.traveldate || "",
    bookingstatus: normalizedExternalData?.bookingstatus || "",
    remarks: normalizedExternalData?.remarks || "",

    costprice: String(normalizedExternalData?.costprice ?? ""),
    costCurrency: normalizedExternalData?.costCurrency || "INR",
    costRoe: String(normalizedExternalData?.costRoe ?? ""),
    costInr: String(normalizedExternalData?.costInr ?? ""),
    costNotes: String(normalizedExternalData?.costNotes ?? ""),
    sellingprice: String(normalizedExternalData?.sellingprice ?? ""),
    sellingCurrency: normalizedExternalData?.sellingCurrency || "INR",
    sellingRoe: String(normalizedExternalData?.sellingRoe ?? ""),
    sellingInr: String(normalizedExternalData?.sellingInr ?? ""),
    sellingNotes: String(normalizedExternalData?.sellingNotes ?? ""),
    vendorBasePrice: String(normalizedExternalData?.vendorBasePrice ?? ""),
    vendorBaseCurrency: normalizedExternalData?.vendorBaseCurrency || "INR",
    vendorBaseRoe: String(normalizedExternalData?.vendorBaseRoe ?? ""),
    vendorBaseInr: String(normalizedExternalData?.vendorBaseInr ?? ""),
    vendorBaseNotes: String(normalizedExternalData?.vendorBaseNotes ?? ""),
    vendorIncentiveReceived: String(
      normalizedExternalData?.vendorIncentiveReceived ?? "",
    ),
    vendorIncentiveCurrency:
      normalizedExternalData?.vendorIncentiveCurrency || "INR",
    vendorIncentiveRoe: String(
      normalizedExternalData?.vendorIncentiveRoe ?? "",
    ),
    vendorIncentiveInr: String(
      normalizedExternalData?.vendorIncentiveInr ?? "",
    ),
    vendorIncentiveNotes: String(
      normalizedExternalData?.vendorIncentiveNotes ?? "",
    ),
    commissionPaid: String(normalizedExternalData?.commissionPaid ?? ""),
    commissionCurrency: normalizedExternalData?.commissionCurrency || "INR",
    commissionRoe: String(normalizedExternalData?.commissionRoe ?? ""),
    commissionInr: String(normalizedExternalData?.commissionInr ?? ""),
    commissionNotes: String(normalizedExternalData?.commissionNotes ?? ""),
    showAdvancedPricing: defaultShowAdvancedPricing,
    // Cancellation fields
    cancellationDate: String(
      (normalizedExternalData as any)?.cancellationDate ?? "",
    ),
    costRefundAmount: String(
      (normalizedExternalData as any)?.costRefundAmount ?? "",
    ),
    costRefundCurrency:
      (normalizedExternalData as any)?.costRefundCurrency || "INR",
    costRefundRoe: String((normalizedExternalData as any)?.costRefundRoe ?? ""),
    costRefundInr: String((normalizedExternalData as any)?.costRefundInr ?? ""),
    costRefundNotes: String(
      (normalizedExternalData as any)?.costRefundNotes ?? "",
    ),
    sellingRefundAmount: String(
      (normalizedExternalData as any)?.sellingRefundAmount ?? "",
    ),
    sellingRefundCurrency:
      (normalizedExternalData as any)?.sellingRefundCurrency || "INR",
    sellingRefundRoe: String(
      (normalizedExternalData as any)?.sellingRefundRoe ?? "",
    ),
    sellingRefundInr: String(
      (normalizedExternalData as any)?.sellingRefundInr ?? "",
    ),
    sellingRefundNotes: String(
      (normalizedExternalData as any)?.sellingRefundNotes ?? "",
    ),
    vendorInvoiceRefundAmount: String(
      (normalizedExternalData as any)?.vendorInvoiceRefundAmount ?? "",
    ),
    vendorInvoiceRefundCurrency:
      (normalizedExternalData as any)?.vendorInvoiceRefundCurrency || "INR",
    vendorInvoiceRefundRoe: String(
      (normalizedExternalData as any)?.vendorInvoiceRefundRoe ?? "",
    ),
    vendorInvoiceRefundInr: String(
      (normalizedExternalData as any)?.vendorInvoiceRefundInr ?? "",
    ),
    vendorInvoiceRefundNotes: String(
      (normalizedExternalData as any)?.vendorInvoiceRefundNotes ?? "",
    ),
    chargebackAmount: String(
      (normalizedExternalData as any)?.chargebackAmount ?? "",
    ),
    chargebackCurrency:
      (normalizedExternalData as any)?.chargebackCurrency || "INR",
    chargebackRoe: String((normalizedExternalData as any)?.chargebackRoe ?? ""),
    chargebackInr: String((normalizedExternalData as any)?.chargebackInr ?? ""),
    chargebackNotes: String(
      (normalizedExternalData as any)?.chargebackNotes ?? "",
    ),
    commissionRefundAmount: String(
      (normalizedExternalData as any)?.commissionRefundAmount ?? "",
    ),
    commissionRefundCurrency:
      (normalizedExternalData as any)?.commissionRefundCurrency || "INR",
    commissionRefundRoe: String(
      (normalizedExternalData as any)?.commissionRefundRoe ?? "",
    ),
    commissionRefundInr: String(
      (normalizedExternalData as any)?.commissionRefundInr ?? "",
    ),
    commissionRefundNotes: String(
      (normalizedExternalData as any)?.commissionRefundNotes ?? "",
    ),
  }));

  const [showAdvancedPricing, setShowAdvancedPricing] = useState(
    defaultShowAdvancedPricing,
  );

  const lastSyncedExternalRef = useRef<string>("");
  const lastPushedRef = useRef<string>("");

  // Sync with external/initial form data when it changes (edit mode)
  useEffect(() => {
    if (!externalFormData || Object.keys(externalFormData).length === 0) return;

    const serialized = JSON.stringify(normalizedExternalData);
    if (serialized === lastSyncedExternalRef.current) return;
    lastSyncedExternalRef.current = serialized;

    const nextShowAdvancedPricing = getDefaultShowAdvancedPricing(
      normalizedExternalData,
      isReadOnly,
    );

    setFormData((prev) => ({
      ...prev,
      ...normalizedExternalData,
      showAdvancedPricing: nextShowAdvancedPricing,
    }));
    setShowAdvancedPricing(nextShowAdvancedPricing);
  }, [externalFormData, isReadOnly, normalizedExternalData]);

  // Push form data up whenever it changes
  useEffect(() => {
    const serialized = JSON.stringify(formData);
    if (serialized === lastPushedRef.current) return;
    lastPushedRef.current = serialized;
    onFormDataUpdate({ priceinfoform: formData });
  }, [formData]);

  const handleAmountChange = useCallback((updated: AmountSectionValue) => {
    setFormData((prev) => ({ ...prev, ...updated }));
  }, []);

  return (
    <form
      className={`space-y-4 py-4 px-2.5 -mt-1 overflow-x-hidden ${
        isReadOnly
          ? "[&_input]:!bg-gray-200 [&_textarea]:!bg-gray-300 [&_select]:!bg-gray-200"
          : ""
      }`}
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="px-0 py-1.5">
        {/* Booking Date, Travel Date & Booking Status */}
        <DateFieldsAndStatus
          bookingdate={formData.bookingdate}
          traveldate={formData.traveldate}
          bookingstatus={formData.bookingstatus}
          cancellationDate={formData.cancellationDate}
          onBookingDateChange={(date) =>
            setFormData((prev) => ({
              ...prev,
              bookingdate: date,
              traveldate:
                prev.traveldate && isAfterDate(date, prev.traveldate)
                  ? ""
                  : prev.traveldate,
            }))
          }
          onTravelDateChange={(date) =>
            setFormData((prev) => ({ ...prev, traveldate: date }))
          }
          onBookingStatusChange={(status) =>
            setFormData((prev) => ({ ...prev, bookingstatus: status }))
          }
          onCancellationDateChange={(date) =>
            setFormData((prev) => ({ ...prev, cancellationDate: date }))
          }
        />

        {/* Amount Section */}
        <AmountSection
          value={formData as any}
          onChange={handleAmountChange}
          bookingStatus={formData.bookingstatus}
          showAdvancedPricing={showAdvancedPricing}
          onToggleAdvancedPricing={setShowAdvancedPricing}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          customerCount={customerCount}
        />

        {/* Remarks */}
        <RemarksField
          value={formData.remarks}
          onChange={(val) => setFormData((prev) => ({ ...prev, remarks: val }))}
          readOnly={isReadOnly}
          isSubmitting={isSubmitting}
        />
      </div>
    </form>
  );
};

export default PriceInfoForm;
