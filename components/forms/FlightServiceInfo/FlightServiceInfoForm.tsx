"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import OneWayLayout from "./OneWayLayout";
import RoundTripLayout from "./RoundTripLayout";
import MultiCityLayout from "./MultiCityLayout";
import { allowUppercaseAlphanumeric6 } from "@/utils/inputValidators";
import { isAfterDate } from "@/utils/helper";
import { CancellationModalFormState } from "@/components/Modals/CancellationModal";
import DateFieldsAndStatus from "@/components/forms/components/DateFieldsAndStatus";
import Documents from "@/components/forms/components/Documents";
import RemarksField from "@/components/forms/components/RemarksField";

// Type definitions
interface FlightInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  cancellationDate?: string;
  PNR: number | string;
  pnrEnabled: boolean;
  segments: FlightSegment[]; // Array of flight segments
  returnSegments: ReturnFlightSegment[];
  samePNRForAllSegments: boolean;
  flightType: "One Way" | "Round Trip" | "Multi-City";
  remarks: string;
  importantinfo?: string;

  // Persist cancellation modal form data with the booking
  cancellationForm?: CancellationModalFormState;
}

interface FlightSegment {
  id?: string | null;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
  pnr?: string;

  cabinBaggagePcs?: number | string;
  cabinBaggageWt?: number | string;
  checkInBaggagePcs?: number | string;
  checkInBaggageWt?: number | string;
}

interface ReturnFlightSegment {
  id?: string | null;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
  pnr?: string;

  cabinBaggagePcs?: number | string;
  cabinBaggageWt?: number | string;
  checkInBaggagePcs?: number | string;
  checkInBaggageWt?: number | string;
}

interface ExternalFormData {
  formFields?: {
    bookingdate?: string;
    traveldate?: string;
    bookingstatus?: string;
    PNR?: string;
    remarks?: string;
    importantinfo?: string;
    // Add other fields as needed
  };
}

interface FlightInfoFormProps {
  onSubmit?: (data: FlightInfoFormData) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  showValidation?: boolean;
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
}

const FlightServiceInfoForm: React.FC<FlightInfoFormProps> = ({
  onSubmit,
  isSubmitting = false,
  isReadOnly = false,
  showValidation = true,
  formRef,
  onFormDataUpdate,
  onAddDocuments,
  onRemoveDocuments,
  externalFormData,
  bookingCode,
  existingDocuments = [],
}) => {
  // Normalize incoming data so we can hydrate the form from either
  // `externalFormData`, `externalFormData.formFields`, `externalFormData.flightinfoform`,
  // passed from BookingFormSideSheet when editing.
  const normalizedExternalData = useMemo(() => {
    const source = externalFormData ?? {};
    const fields =
      (source as ExternalFormData)?.formFields ??
      (source as any)?.flightinfoform ??
      source;
    return fields as Partial<FlightInfoFormData>;
  }, [externalFormData]);

  // Internal form state
  const [formData, setFormData] = useState<FlightInfoFormData>(() => ({
    bookingdate: normalizedExternalData?.bookingdate || "",
    traveldate: normalizedExternalData?.traveldate || "",
    bookingstatus: normalizedExternalData?.bookingstatus || "",
    cancellationDate: (normalizedExternalData as any)?.cancellationDate || "",
    PNR: normalizedExternalData?.PNR || "",
    segments:
      normalizedExternalData?.segments && normalizedExternalData.segments.length
        ? normalizedExternalData.segments.map((seg, idx) => ({
            id: seg.id ?? `seg-${idx}`,
            ...seg,
            cabinBaggagePcs: (seg as any).cabinBaggagePcs ?? 1,
            cabinBaggageWt: (seg as any).cabinBaggageWt ?? "",
            checkInBaggagePcs: (seg as any).checkInBaggagePcs ?? 1,
            checkInBaggageWt: (seg as any).checkInBaggageWt ?? "",
          }))
        : [
            {
              id: "1",
              flightnumber: "",
              traveldate: "",
              cabinclass: "",
              cabinBaggagePcs: 1,
              cabinBaggageWt: "",
              checkInBaggagePcs: 1,
              checkInBaggageWt: "",
            },
          ],
    returnSegments:
      normalizedExternalData?.returnSegments &&
      normalizedExternalData.returnSegments.length
        ? normalizedExternalData.returnSegments.map((seg, idx) => ({
            id: seg.id ?? `return-${idx + 1}`,
            ...seg,
            cabinBaggagePcs: (seg as any).cabinBaggagePcs ?? 1,
            cabinBaggageWt: (seg as any).cabinBaggageWt ?? "",
            checkInBaggagePcs: (seg as any).checkInBaggagePcs ?? 1,
            checkInBaggageWt: (seg as any).checkInBaggageWt ?? "",
          }))
        : [
            {
              id: "return-1",
              flightnumber: "",
              traveldate: "",
              cabinclass: "",
              cabinBaggagePcs: 1,
              cabinBaggageWt: "",
              checkInBaggagePcs: 1,
              checkInBaggageWt: "",
            },
          ],
    pnrEnabled:
      normalizedExternalData?.pnrEnabled !== undefined
        ? Boolean(normalizedExternalData.pnrEnabled)
        : true,
    samePNRForAllSegments:
      normalizedExternalData?.samePNRForAllSegments ?? false,
    flightType:
      (normalizedExternalData?.flightType as FlightInfoFormData["flightType"]) ||
      "One Way",
    remarks: normalizedExternalData?.remarks || "",
    importantinfo: normalizedExternalData?.importantinfo || "",

    cancellationForm: (normalizedExternalData as any)?.cancellationForm,
  }));

  // Sync with external/initial form data when it changes (edit mode)
  useEffect(() => {
    if (!externalFormData || Object.keys(externalFormData).length === 0) return;

    setFormData((prev) => ({
      ...prev,
      ...normalizedExternalData,
      segments:
        normalizedExternalData.segments &&
        normalizedExternalData.segments.length
          ? normalizedExternalData.segments.map((seg, idx) => ({
              id: seg.id ?? `seg-${idx}`,
              ...seg,
              cabinBaggagePcs: (seg as any).cabinBaggagePcs ?? 1,
              cabinBaggageWt: (seg as any).cabinBaggageWt ?? "",
              checkInBaggagePcs: (seg as any).checkInBaggagePcs ?? 1,
              checkInBaggageWt: (seg as any).checkInBaggageWt ?? "",
            }))
          : prev.segments,
      returnSegments:
        normalizedExternalData.returnSegments &&
        normalizedExternalData.returnSegments.length
          ? normalizedExternalData.returnSegments.map((seg, idx) => ({
              id: seg.id ?? `return-${idx + 1}`,
              ...seg,
              cabinBaggagePcs: (seg as any).cabinBaggagePcs ?? 1,
              cabinBaggageWt: (seg as any).cabinBaggageWt ?? "",
              checkInBaggagePcs: (seg as any).checkInBaggagePcs ?? 1,
              checkInBaggageWt: (seg as any).checkInBaggageWt ?? "",
            }))
          : prev.returnSegments,
      pnrEnabled: normalizedExternalData.pnrEnabled ?? prev.pnrEnabled ?? true,
      samePNRForAllSegments:
        normalizedExternalData.samePNRForAllSegments ??
        prev.samePNRForAllSegments ??
        false,
      flightType:
        (normalizedExternalData.flightType as
          | "One Way"
          | "Round Trip"
          | "Multi-City") ?? prev.flightType,
      cancellationDate:
        (normalizedExternalData as any)?.cancellationDate ??
        prev.cancellationDate,
    }));
  }, [externalFormData, isReadOnly, normalizedExternalData]);

  useEffect(() => {
    onFormDataUpdate({ flightinfoform: formData });
  }, [formData]);

  // Smooth pill indicator for flight type tabs
  const flightTabContainerRef = useRef<HTMLDivElement | null>(null);
  const [flightTabIndicator, setFlightTabIndicator] = useState({
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    const update = () => {
      const container = flightTabContainerRef.current;
      if (!container) return;
      const activeBtn = container.querySelector(
        `[data-tab="${formData.flightType}"]`,
      ) as HTMLElement | null;
      if (!activeBtn) return;
      setFlightTabIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [formData.flightType]);

  return (
    <>
      <form
        className={`space-y-4 py-4 px-2.5 -mt-1 overflow-x-hidden ${
          isReadOnly
            ? "[&_input]:!bg-gray-200 [&_textarea]:!bg-gray-300 [&_select]:!bg-gray-200"
            : ""
        }`}
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="px-0 py-1">
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

          {/* Amount Section removed per request */}

          {/* Flight Info */}
          <div className="mb-4 w-full border border-[#E2E1E1] rounded-[15px] p-3.5 mt-4">
            <h2 className="text-[13px] font-[500] text-[#020202] mb-2">
              Flight Info
            </h2>

            <hr className="-mt-1 mb-2 border-t border-[#E2E1E1]" />

            {/* PNR and Toggle */}
            <div className="flex items-end gap-8 mb-3">
              <div>
                <label className="block text-[0.7rem] font-[500] text-gray-700 mb-1">
                  PNR
                </label>
                <input
                  type="text"
                  value={formData.PNR}
                  onChange={(e) => {
                    const sanitizedValue = allowUppercaseAlphanumeric6(
                      e.target.value,
                    )
                      .replace(/[^a-zA-Z0-9]/g, "") // allow only alphanumeric
                      .toUpperCase(); // convert to uppercase

                    setFormData((prev) => ({ ...prev, PNR: sanitizedValue }));
                  }}
                  placeholder="Enter PNR"
                  className="w-[12rem] px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE] hover:border-[#C6AEDE] focus:border-transparent"
                />
              </div>

              {formData.flightType !== "One Way" && (
                <div className="flex items-center gap-1 pb-1">
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        pnrEnabled: !prev.pnrEnabled,
                      }))
                    }
                    className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
                      formData.pnrEnabled ? "bg-[#7135AD]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.pnrEnabled
                          ? "translate-x-3.5"
                          : "translate-x-0.5"
                      }`}
                    />
                  </button>

                  <span className="text-[0.7rem] text-gray-700">
                    Same PNR for all Segments
                  </span>
                </div>
              )}
            </div>

            {/* Flight Type Tabs */}
            <div
              ref={flightTabContainerRef}
              className="inline-flex mb-3 mt-2 rounded-[15px] border border-[#E2E1E1] shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] relative"
            >
              {/* Sliding indicator */}
              <div
                className="absolute top-0 h-full rounded-[15px] bg-[#F7EFFF] border-[0.8px] border-[#7135AD66] transition-all duration-300 ease-in-out"
                style={{
                  left: `${flightTabIndicator.left}px`,
                  width: `${flightTabIndicator.width}px`,
                }}
              />

              {(["One Way", "Round Trip", "Multi-City"] as const).map(
                (type) => (
                  <button
                    key={type}
                    data-tab={type}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, flightType: type }))
                    }
                    className={`relative z-10 px-3.5 py-1.5 text-[0.7rem] font-[500] transition-colors duration-300 rounded-[15px]
        ${
          formData.flightType === type
            ? "text-[#7135AD] font-[500] text-[12px]"
            : "bg-transparent text-[#414141] font-[400]"
        }`}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>

            {/* Layouts */}
            {formData.flightType === "One Way" && (
              <OneWayLayout
                formData={formData as any}
                setFormData={setFormData as any}
              />
            )}

            {formData.flightType === "Round Trip" && (
              <RoundTripLayout
                formData={formData as any}
                setFormData={setFormData as any}
              />
            )}

            {formData.flightType === "Multi-City" && (
              <MultiCityLayout
                formData={formData as any}
                setFormData={setFormData as any}
              />
            )}
          </div>

          {/* Documents */}
          <Documents
            existingDocuments={existingDocuments}
            onAddDocuments={onAddDocuments}
            onRemoveDocuments={onRemoveDocuments}
            isReadOnly={isReadOnly}
          />

          {/* Remarks Section */}
          <RemarksField
            value={String(formData.remarks ?? "")}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, remarks: val }))
            }
            readOnly={isReadOnly}
            isSubmitting={isSubmitting}
          />
        </div>
      </form>
    </>
  );
};

export default React.memo(FlightServiceInfoForm);
