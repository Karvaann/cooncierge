"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import OneWayLayout from "./OneWayLayout";
import RoundTripLayout from "./RoundTripLayout";
import MultiCityLayout from "./MultiCityLayout";
import { allowUppercaseAlphanumeric6 } from "@/utils/inputValidators";
import { CancellationModalFormState } from "@/components/Modals/CancellationModal";
import DateFieldsAndStatus from "@/components/forms/components/DateFieldsAndStatus";
import Documents from "@/components/forms/components/Documents";
import RemarksField from "@/components/forms/components/RemarksField";
import DropDown from "@/components/DropDown";
import { useBookingFieldSync } from "@/context/BookingFieldSyncContext";

// Type definitions
interface FlightInfoFormData {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "confirmed" | "cancelled" | "rescheduled" | string;
  cancellationDate?: string;
  newBookingDate?: string;
  newTravelDate?: string;
  PNR: number | string;
  pnrEnabled: boolean;
  segments: FlightSegment[]; // Array of flight segments
  returnSegments: ReturnFlightSegment[];
  samePNRForAllSegments: boolean;
  flightType: "One Way" | "Round Trip" | "Multi-City";
  remarks: string;
  importantinfo?: string;
  rulesAndConditions?: string;
  rulesTemplate?: string;

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
  onAddDocuments?: (files: File[], category?: string) => void;
  onRemoveDocuments?: (files: File[], category?: string) => void;
  externalFormData?: ExternalFormData | Record<string, unknown>;
  bookingCode?: string;
  generalInfoData?: Record<string, any>;
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

const cabinDefaults = {
  cabinBaggagePcs: 1,
  cabinBaggageWt: "",
  checkInBaggagePcs: 1,
  checkInBaggageWt: "",
};

const createSegment = (id: string, traveldate = "", tripId?: number) => ({
  id,
  flightnumber: "",
  traveldate,
  cabinclass: "",
  ...(typeof tripId === "number" ? { tripId } : {}),
  ...cabinDefaults,
});

const normalizeSegment = (segment: any, fallbackId: string) => ({
  id: segment.id ?? fallbackId,
  ...segment,
  cabinBaggagePcs: segment.cabinBaggagePcs ?? 1,
  cabinBaggageWt: segment.cabinBaggageWt ?? "",
  checkInBaggagePcs: segment.checkInBaggagePcs ?? 1,
  checkInBaggageWt: segment.checkInBaggageWt ?? "",
});

const ensureFlightTypeDefaults = (
  data: Partial<FlightInfoFormData>,
  fallbackTravelDate = "",
) => {
  const flightType =
    (data.flightType as FlightInfoFormData["flightType"]) || "One Way";
  const topTravelDate = String(data.traveldate ?? fallbackTravelDate ?? "");
  const incomingSegments = Array.isArray(data.segments)
    ? data.segments.map((segment, index) =>
        normalizeSegment(segment, `seg-${index + 1}`),
      )
    : [];
  const incomingReturnSegments = Array.isArray(data.returnSegments)
    ? data.returnSegments.map((segment, index) =>
        normalizeSegment(segment, `return-${index + 1}`),
      )
    : [];

  if (flightType === "One Way") {
    return {
      flightType,
      segments:
        incomingSegments.length > 0
          ? incomingSegments.map((segment, index) => ({
              ...segment,
              id: segment.id ?? `seg-${index + 1}`,
              traveldate: String(segment.traveldate ?? topTravelDate),
            }))
          : [createSegment("seg-1", topTravelDate)],
      returnSegments: [],
    };
  }

  if (flightType === "Round Trip") {
    return {
      flightType,
      segments:
        incomingSegments.length > 0
          ? incomingSegments
          : [createSegment("seg-1", topTravelDate)],
      returnSegments:
        incomingReturnSegments.length > 0
          ? incomingReturnSegments
          : [createSegment("return-1", topTravelDate)],
    };
  }

  const multiCitySegments =
    incomingSegments.length >= 2
      ? incomingSegments.map((segment, index) => ({
          ...segment,
          tripId: (segment as any).tripId ?? index + 1,
        }))
      : [
          createSegment("seg-1", topTravelDate, 1),
          createSegment("seg-2", topTravelDate, 2),
        ];

  return {
    flightType,
    segments: multiCitySegments,
    returnSegments: [],
  };
};

const sanitizeFlightNumber = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);

const sanitizePNR = (value: string) => allowUppercaseAlphanumeric6(value);

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

const ruleTemplateOptions = [
  { value: "standard-fare-rules", label: "Standard Fare Rules" },
  { value: "refund-policy", label: "Refund Policy" },
  { value: "reschedule-policy", label: "Reschedule Policy" },
];

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
  generalInfoData,
  existingDocuments = [],
}) => {
  const sync = useBookingFieldSync();
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
    newBookingDate: (normalizedExternalData as any)?.newBookingDate || "",
    newTravelDate: (normalizedExternalData as any)?.newTravelDate || "",
    PNR: normalizedExternalData?.PNR || "",
    ...ensureFlightTypeDefaults(normalizedExternalData),
    pnrEnabled:
      normalizedExternalData?.pnrEnabled !== undefined
        ? Boolean(normalizedExternalData.pnrEnabled)
        : Boolean(normalizedExternalData?.samePNRForAllSegments ?? true),
    samePNRForAllSegments:
      normalizedExternalData?.samePNRForAllSegments ?? true,
    flightType: ensureFlightTypeDefaults(normalizedExternalData).flightType,
    remarks: normalizedExternalData?.remarks || "",
    importantinfo: normalizedExternalData?.importantinfo || "",
    rulesAndConditions:
      (normalizedExternalData as any)?.rulesAndConditions || "",
    rulesTemplate: (normalizedExternalData as any)?.rulesTemplate || "",

    cancellationForm: (normalizedExternalData as any)?.cancellationForm,
  }));

  // Sync with external/initial form data when it changes (edit mode)
  useEffect(() => {
    if (!externalFormData || Object.keys(externalFormData).length === 0) return;

    setFormData((prev) => ({
      ...prev,
      ...normalizedExternalData,
      ...ensureFlightTypeDefaults(
        normalizedExternalData,
        String(normalizedExternalData.traveldate ?? prev.traveldate ?? ""),
      ),
      pnrEnabled:
        normalizedExternalData.pnrEnabled ??
        normalizedExternalData.samePNRForAllSegments ??
        prev.pnrEnabled ??
        true,
      samePNRForAllSegments:
        normalizedExternalData.samePNRForAllSegments ??
        prev.samePNRForAllSegments ??
        true,
      cancellationDate:
        (normalizedExternalData as any)?.cancellationDate ??
        prev.cancellationDate,
      newBookingDate:
        (normalizedExternalData as any)?.newBookingDate ?? prev.newBookingDate,
      newTravelDate:
        (normalizedExternalData as any)?.newTravelDate ?? prev.newTravelDate,
    }));
  }, [externalFormData, isReadOnly, normalizedExternalData]);

  useEffect(() => {
    onFormDataUpdate({ flightinfoform: formData });
  }, [formData]);

  useEffect(() => {
    if ((sync?.internalNotes ?? "") === String(formData.remarks ?? "")) return;
    sync?.setInternalNotes(String(formData.remarks ?? ""));
  }, [formData.remarks, sync]);

  useEffect(() => {
    if (!sync?.internalNotes) return;
    setFormData((prev) =>
      prev.remarks === sync.internalNotes
        ? prev
        : { ...prev, remarks: sync.internalNotes },
    );
  }, [sync?.internalNotes]);

  useEffect(() => {
    if (!formData.samePNRForAllSegments) return;

    const mainPnr = sanitizePNR(String(formData.PNR ?? ""));
    setFormData((prev) => {
      const segments = prev.segments.map((segment) => ({
        ...segment,
        pnr: mainPnr,
      }));
      const returnSegments = prev.returnSegments.map((segment) => ({
        ...segment,
        pnr: mainPnr,
      }));
      const hasDiff =
        segments.some(
          (segment, index) => segment.pnr !== prev.segments[index]?.pnr,
        ) ||
        returnSegments.some(
          (segment, index) => segment.pnr !== prev.returnSegments[index]?.pnr,
        );
      return hasDiff ? { ...prev, segments, returnSegments } : prev;
    });
  }, [formData.PNR, formData.samePNRForAllSegments]);

  const userNickname = useMemo(
    () =>
      getUserNickname(
        generalInfoData,
        externalFormData as Record<string, any> | undefined,
      ),
    [externalFormData, generalInfoData],
  );

  // Smooth pill indicator for flight type tabs
  const flightTabContainerRef = useRef<HTMLDivElement | null>(null);
  const [flightTabIndicator, setFlightTabIndicator] = useState({
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    const container = flightTabContainerRef.current;
    const update = () => {
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
    // Re-measure when the container is resized (covers late layout/paint)
    let ro: ResizeObserver | undefined;
    if (container) {
      ro = new ResizeObserver(update);
      ro.observe(container);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
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
        <div className="px-0 py-1.5">
          {/* Booking Date, Travel Date & Booking Status */}
          <DateFieldsAndStatus
            bookingdate={formData.bookingdate}
            traveldate={formData.traveldate}
            bookingstatus={formData.bookingstatus}
            cancellationDate={formData.cancellationDate ?? ""}
            fieldOwner="flight-service-info"
            userNickname={String(userNickname || "")}
            onBookingDateChange={(date) =>
              setFormData((prev) => ({
                ...prev,
                bookingdate: date,
              }))
            }
            onTravelDateChange={(date) =>
              setFormData((prev) => ({
                ...prev,
                traveldate: date,
                segments:
                  prev.flightType === "One Way"
                    ? prev.segments.map((segment) => ({
                        ...segment,
                        traveldate: date,
                      }))
                    : prev.segments,
              }))
            }
            onBookingStatusChange={(status) =>
              setFormData((prev) => ({ ...prev, bookingstatus: status }))
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
                    const sanitizedValue = sanitizePNR(e.target.value);
                    setFormData((prev) => ({ ...prev, PNR: sanitizedValue }));
                  }}
                  placeholder="Enter PNR"
                  className="w-[12rem] px-2.5 py-1.5 border border-gray-300 rounded-[15px] text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#C6AEDE] hover:border-[#C6AEDE] focus:border-transparent"
                />
              </div>

              {formData.flightType !== "One Way" && (
                <div className="flex items-center gap-1 pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        samePNRForAllSegments: !prev.samePNRForAllSegments,
                        pnrEnabled: !prev.samePNRForAllSegments,
                      }))
                    }
                    className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors ${
                      formData.samePNRForAllSegments
                        ? "bg-[#7135AD]"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.samePNRForAllSegments
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
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        ...ensureFlightTypeDefaults(
                          {
                            ...prev,
                            flightType: type,
                          },
                          prev.traveldate,
                        ),
                      }))
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
                onMainTravelDateChange={(date: string) =>
                  setFormData((prev) => ({
                    ...prev,
                    traveldate: date,
                    segments: prev.segments.map((segment) => ({
                      ...segment,
                      traveldate: date,
                    })),
                  }))
                }
              />
            )}

            {formData.flightType === "Round Trip" && (
              <RoundTripLayout
                formData={formData as any}
                setFormData={setFormData as any}
                sharedPnrEnabled={formData.samePNRForAllSegments}
                onMainTravelDateChange={(date: string) =>
                  setFormData((prev) => ({ ...prev, traveldate: date }))
                }
              />
            )}

            {formData.flightType === "Multi-City" && (
              <MultiCityLayout
                formData={formData as any}
                setFormData={setFormData as any}
                sharedPnrEnabled={formData.samePNRForAllSegments}
                onMainTravelDateChange={(date: string) =>
                  setFormData((prev) => ({ ...prev, traveldate: date }))
                }
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

          <RemarksField
            label="Rules and Conditions"
            headerRight={
              <div className="min-w-[12rem]">
                <DropDown
                  options={ruleTemplateOptions}
                  placeholder="Choose Template"
                  value={String(formData.rulesTemplate ?? "")}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      rulesTemplate: String(value ?? ""),
                    }))
                  }
                  buttonClassName="px-3 py-1.5 hover:border-[#C6AEDE] rounded-[15px]"
                  noButtonRadius
                />
              </div>
            }
            value={String(formData.rulesAndConditions ?? "")}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, rulesAndConditions: val }))
            }
            readOnly={isReadOnly}
            isSubmitting={isSubmitting}
          />

          <RemarksField
            label="Internal Notes"
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
