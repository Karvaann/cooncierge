"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import ConfirmPopupModal from "./popups/BookingPopups/ConfirmPopupModal";
import SuccessPopupModal from "./popups/BookingPopups/SuccessPopupModal";
import ErrorToast from "./ErrorToast";
import { BookingProvider, useBooking } from "@/context/BookingContext";
import { useLimitlessDraft } from "@/context/LimitlessDraftContext";
import { BookingApiService } from "@/services/bookingApi";
import SideSheet from "@/components/SideSheet";
import GeneralInfoForm from "./forms/GeneralInfoForm";
import AddCustomerSideSheet from "./Sidesheets/AddCustomerSideSheet";
import AddVendorSideSheet from "./Sidesheets/AddVendorSideSheet";
import AddNewTravellerForm from "./forms/AddNewForms/AddNewTravellerForm";
import FlightServiceInfoForm from "./forms/FlightServiceInfo/FlightServiceInfoForm";
import AccommodationServiceInfo from "./forms/AccommodationServiceInfo/AccommodationServiceInfo";
import LandTransportServiceInfoForm from "./forms/LandTransportServiceInfoForm";
import MaritimeTransportServiceInfoForm from "./forms/MaritimeTransportServiceInfoForm";
import TicketsServiceInfoForm from "./forms/TicketsServiceInfoForm";
import ActivityServiceInfoForm from "./forms/ActivityServiceInfoForm";
import InsuranceServiceInfoForm from "./forms/InsuranceServiceInfoForm";
import VisasServiceInfoForm from "./forms/VisasServiceInfoForm";
import OthersServiceInfoForm from "./forms/OthersServiceInfoForm";
import LimitlessServiceInfoForm from "./forms/LimitlessServiceInfoForm";
import PriceInfoForm from "./forms/PriceInfo";
import Button from "./Button";
import DropDown from "./DropDown";
import { LuSave } from "react-icons/lu";

import { getAuthUser } from "@/services/storage/authStorage";

// Type definitions
interface Service {
  id: string;
  title: string;
  image: string;
  category:
    | "travel"
    | "accommodation"
    | "transport-land"
    | "activity"
    | "transport-maritime"
    | "tickets"
    | "travel insurance"
    | "visas"
    | "others";
  description?: string;
}

interface BookingFormSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: Service | null | undefined;
  onFormSubmit?: (formData: any) => void;
  initialData?: any;
  mode?: "view" | "edit";
  bookingCode?: string;
  customerCode?: string;
  vendorCode?: string;
  onRequestEdit?: () => void;
  onBookingSaved?: (updatedBooking: any) => void;
  hideVendor?: boolean;
}

type TabType = "general" | "service" | "price" | "review";

interface TabConfig {
  id: TabType;
  label: string;
  component: React.ComponentType<any>;
  isEnabled: boolean;
}

const stableStringify = (value: any): string =>
  JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce<Record<string, any>>((acc, key) => {
          acc[key] = (val as Record<string, any>)[key];
          return acc;
        }, {});
    }
    return val;
  });

function ServiceInfoFormSwitcher(props: any) {
  const { selectedService, onAddDocuments, initialData, existingDocuments } =
    props;
  const rawServiceValue =
    (selectedService &&
      typeof selectedService === "object" &&
      selectedService.category) ||
    (typeof selectedService === "string" ? selectedService : undefined) ||
    initialData?.quotationType;

  if (!rawServiceValue) return null;

  const normalizeService = (val: string) => {
    const v = String(val).toLowerCase().trim();
    const map: Record<string, string> = {
      // flights / travel -> flight form mapped to 'travel'
      flight: "travel",
      flights: "travel",
      travel: "travel",

      // hotels / accommodation
      hotel: "accommodation",
      hotels: "accommodation",
      accommodation: "accommodation",

      // land transport
      car: "transport-land",
      "transport-land": "transport-land",
      "land-transport": "transport-land",
      land: "transport-land",
      transportation: "transport-land",

      // maritime
      maritime: "transport-maritime",
      "transport-maritime": "transport-maritime",
      "maritime-transportation": "transport-maritime",

      // tickets
      ticket: "tickets",
      tickets: "tickets",

      // activity
      activity: "activity",
      activities: "activity",

      // insurance
      insurance: "travel insurance",
      "travel insurance": "travel insurance",

      // visa
      visa: "visas",
      visas: "visas",

      // others
      others: "others",
      package: "others",

      // limitless
      limitless: "limitless",
    };

    return map[v] || v;
  };

  const service = normalizeService(rawServiceValue);

  switch (service) {
    case "travel":
      return (
        <FlightServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "accommodation":
      return (
        <AccommodationServiceInfo
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "transport-land":
      return (
        <LandTransportServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "transport-maritime":
      return (
        <MaritimeTransportServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );
    case "tickets":
      return (
        <TicketsServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "activity":
      return (
        <ActivityServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "travel insurance":
      return (
        <InsuranceServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "visas":
      return (
        <VisasServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "others":
      return (
        <OthersServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    case "limitless":
      return (
        <LimitlessServiceInfoForm
          {...props}
          externalFormData={initialData}
          onAddDocuments={onAddDocuments}
          existingDocuments={existingDocuments}
        />
      );

    // you can keep adding cases for "transport" or "activity" later
    default:
      return (
        <div className="p-4 text-gray-500">
          No service info form available for this category.
        </div>
      );
  }
}

const BookingFormSidesheetContent: React.FC<BookingFormSidesheetProps> = ({
  isOpen,
  onClose,
  selectedService,
  onFormSubmit,
  initialData,
  mode = "edit",
  bookingCode: bookingCodeProp,
  customerCode: customerCodeProp,
  vendorCode: vendorCodeProp,
  onRequestEdit,
  onBookingSaved,
  hideVendor = false,
}) => {
  const router = useRouter();
  const { setDraft: setLimitlessDraft } = useLimitlessDraft();

  // Bump this whenever the sidesheet is (re)opened so child forms remount
  const [formInstanceId, setFormInstanceId] = useState(0);

  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [serviceOverride, setServiceOverride] = useState<string>("");
  const [formData, setFormData] = useState<any>(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string>("");
  const [apiErrorMessage, setApiErrorMessage] = useState<string>("");
  const [showApiErrorToast, setShowApiErrorToast] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState(false);
  const { isAddCustomerOpen, isAddVendorOpen } = useBooking();
  const { closeAddCustomer, closeAddVendor } = useBooking();

  // refs for form data collection
  const generalFormRef = useRef<HTMLFormElement | null>(null);
  const serviceFormRef = useRef<HTMLFormElement | null>(null);
  const addCustomerFormRef = useRef<HTMLFormElement | null>(null);
  const priceFormRef = useRef<HTMLFormElement | null>(null);
  const addVendorFormRef = useRef<HTMLFormElement | null>(null);
  const addTravellerFormRef = useRef<HTMLFormElement | null>(null);

  const resetManagedForms = useCallback(() => {
    const refs = [
      generalFormRef,
      serviceFormRef,
      priceFormRef,
      addCustomerFormRef,
      addVendorFormRef,
      addTravellerFormRef,
    ];
    refs.forEach((ref) => {
      try {
        ref.current?.reset?.();
      } catch {
        // no-op
      }
    });
  }, []);

  // Collect all documents from all forms
  const [bookingDocuments, setBookingDocuments] = useState<File[]>([]);
  const [existingBookingDocuments, setExistingBookingDocuments] = useState<
    Array<{
      originalName: string;
      fileName: string;
      url: string;
      key: string;
      size: number;
      mimeType: string;
      uploadedAt: string | Date;
      _id?: string;
    }>
  >([]);

  const addBookingDocuments = (files: File[]) => {
    const MAX_DOCS = 3;
    setBookingDocuments((prev) => {
      const existingCount = Array.isArray(existingBookingDocuments)
        ? existingBookingDocuments.length
        : 0;
      const remainingSlots = MAX_DOCS - existingCount - prev.length;
      if (remainingSlots <= 0) return prev;
      return [
        ...prev,
        ...(Array.isArray(files) ? files.slice(0, remainingSlots) : []),
      ];
    });
  };

  const removeBookingDocuments = (filesToRemove: File[]) => {
    if (!Array.isArray(filesToRemove) || filesToRemove.length === 0) return;
    const toRemove = new Set(filesToRemove);
    setBookingDocuments((prev) => prev.filter((file) => !toRemove.has(file)));
  };

  const [customerCode, setCustomerCode] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const initialSnapshotRef = useRef<string>("");
  const quotationId = initialData?._id || initialData?.id;
  const isEditingExisting = Boolean(quotationId);

  const isLimitlessBooking = useMemo(() => {
    const rawServiceValue =
      typeof selectedService === "string"
        ? selectedService
        : (selectedService as any)?.category;
    const normalized = String(
      rawServiceValue || initialData?.quotationType || "",
    )
      .toLowerCase()
      .trim();
    return normalized === "limitless";
  }, [initialData?.quotationType, selectedService]);

  const handleProceedToBookingSummary = useCallback(() => {
    // Persist current Limitless form + docs so the view page can submit it.
    try {
      setLimitlessDraft({
        bookingCode: bookingCode || formData?.customId || "",
        formData: formData || {},
        documents: bookingDocuments,
      });
    } catch (_) {
      /* ignore */
    }

    // Close sidesheet (best-effort) and open booking summary page.
    try {
      onClose();
    } catch (_) {
      /* ignore */
    }
    router.push("/bookings/limitless/view-booking");
  }, [
    bookingCode,
    bookingDocuments,
    formData,
    onClose,
    router,
    setLimitlessDraft,
  ]);

  // In "view" modestart read-only, but allow the user to toggle into edit.
  const [readOnlyOverride, setReadOnlyOverride] = useState<boolean | null>(
    null,
  );
  const isReadOnly = readOnlyOverride ?? mode === "view";

  //  show the Save button while keeping fields read-only
  const isDuplicateView =
    mode === "view" && !quotationId && Boolean(bookingCode || bookingCodeProp);

  // Each time the sidesheet opens, increment the instance id so
  // GeneralInfoForm / ServiceInfoForm (and nested modals) get a fresh mount.
  useEffect(() => {
    if (isOpen) {
      setFormInstanceId((prev) => prev + 1);
    }
  }, [isOpen]);

  // Accept bookingCode from parent
  useEffect(() => {
    if (bookingCodeProp) {
      setBookingCode(bookingCodeProp);
    }
  }, [bookingCodeProp]);

  useEffect(() => {
    if (customerCodeProp) {
      setCustomerCode(customerCodeProp);
    }
  }, [customerCodeProp]);

  useEffect(() => {
    if (vendorCodeProp) {
      setVendorCode(vendorCodeProp);
    }
  }, [vendorCodeProp]);

  // Reset form state when opening or when initialData changes
  useEffect(() => {
    if (!isOpen) return;

    // Reset DOM form values (if forms use native <form> refs)
    resetManagedForms();

    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
      // Load existing documents from initialData
      if (Array.isArray(initialData.documents)) {
        setExistingBookingDocuments(initialData.documents);
      } else {
        setExistingBookingDocuments([]);
      }
      // clear any pending new uploads from previous interactions
      setBookingDocuments([]);
    } else {
      setFormData({});
      setExistingBookingDocuments([]);
      setBookingDocuments([]);
    }

    setIsDirty(false);
    setActiveTab("general");
    setReadOnlyOverride(null);
    setServiceOverride("");

    // snapshot initial state for dirty-checking
    initialSnapshotRef.current = stableStringify(initialData ?? {});
  }, [initialData, isOpen, resetManagedForms]);

  // Cleanup when sidesheet is closed to ensure no stale data persists
  useEffect(() => {
    if (isOpen) return;
    setFormData({});
    setExistingBookingDocuments([]);
    setBookingDocuments([]);
    setIsDirty(false);
    initialSnapshotRef.current = "";
    setCustomerCode("");
    setBookingCode("");
    setVendorCode("");
    setServiceOverride("");
    resetManagedForms();
  }, [isOpen, resetManagedForms]);

  useEffect(() => {
    if (!isOpen || isDirty) return;
    initialSnapshotRef.current = stableStringify(formData ?? {});
  }, [formData, isDirty, isOpen]);

  // Ref to always have access to latest formData in callbacks
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Update collectAllFormData
  const collectAllFormData = useCallback(() => {
    const allFormData: Record<string, any> = {};

    // Get data from General Info form
    if (generalFormRef.current instanceof HTMLFormElement) {
      const generalData = new FormData(generalFormRef.current);
      generalData.forEach((value, key) => {
        allFormData[key] = value;
      });
    }

    // Get data from Price Info form
    if (priceFormRef.current instanceof HTMLFormElement) {
      const priceData = new FormData(priceFormRef.current);
      priceData.forEach((value, key) => {
        allFormData[key] = value;
      });
    }

    // Get data from Service Info form
    if (serviceFormRef.current instanceof HTMLFormElement) {
      const serviceData = new FormData(serviceFormRef.current as any);

      serviceData.forEach((value, key) => {
        allFormData[key] = value;
      });
    }

    return allFormData;
  }, []);

  // Memoized tab configuration
  const tabs: TabConfig[] = useMemo(
    () => [
      {
        id: "general",
        label: "General Info",
        component: GeneralInfoForm,
        isEnabled: true,
      },
      {
        id: "service",
        label: "Service Info",
        component: ServiceInfoFormSwitcher,
        isEnabled: true,
      },
      {
        id: "price",
        label: "Price Info",
        component: PriceInfoForm,
        isEnabled: true,
      },
    ],
    [],
  );

  function convertToBookingData(
    input: any,
    quotationType: string,
    serviceStatus: string,
  ) {
    const user = getAuthUser() as any;
    const businessId = user?.businessId;

    const {
      customer,
      vendor,
      adults,
      children,
      infants,
      childAges,
      remarks,
      traveldate,
      adultTravellerIds,
      infantTravellerIds,
      bookingOwner,
      secondaryBookingOwner,
      secondaryBookingOwners,
      ...rest
    } = input;

    // Detect ANY key that ends with "infoform"
    const infoFormKey = Object.keys(input).find((k) =>
      k.toLowerCase().endsWith("infoform"),
    );

    // Extract and flatten the infoform object
    const flatInfoForm =
      infoFormKey && typeof input[infoFormKey] === "object"
        ? { ...input[infoFormKey] }
        : {};

    // Everything except known fields and infoform goes to formFields
    const formFields = Object.fromEntries(
      Object.entries(rest).filter(([key]) => key !== infoFormKey),
    );

    // Merge flattened infoform into formFields
    Object.assign(formFields, flatInfoForm);

    // Ensure cancellation modal payload is stored inside formFields.cancellationForm
    const cancellationFormCandidate =
      (flatInfoForm as any)?.cancellationForm ??
      (input as any)?.cancellationForm ??
      (formFields as any)?.cancellationForm;
    if (cancellationFormCandidate) {
      (formFields as any).cancellationForm = cancellationFormCandidate;
    }

    const isValidMongoObjectId = (value: unknown): boolean => {
      if (typeof value !== "string") return false;
      const v = value.trim();
      if (!v) return false;
      if (v.toLowerCase() === "tba") return false;
      return /^[a-f\d]{24}$/i.test(v);
    };

    const resolveMongoObjectId = (...candidates: unknown[]): string => {
      for (const candidate of candidates) {
        if (!candidate) continue;
        if (typeof candidate === "string") {
          const v = candidate.trim();
          if (isValidMongoObjectId(v)) return v;
          continue;
        }
        if (typeof candidate === "object") {
          const maybeId = (candidate as any)?._id ?? (candidate as any)?.id;
          if (typeof maybeId === "string") {
            const v = maybeId.trim();
            if (isValidMongoObjectId(v)) return v;
          }
        }
      }
      return "";
    };

    const sanitizeObjectIdList = (ids: unknown): string[] => {
      if (!Array.isArray(ids)) return [];
      return (ids as unknown[])
        .filter((id) => typeof id === "string")
        .map((id) => (id as string).trim())
        .filter((id) => isValidMongoObjectId(id));
    };

    // New schema, split adults vs children travellers.
    // current UI stores "child" travellers under infantTravellerIds/infants/childAges.
    const adultTravelers = sanitizeObjectIdList(adultTravellerIds);
    const childTravelerIds = sanitizeObjectIdList(
      (input as any)?.childTravellerIds ?? infantTravellerIds,
    );
    const childAgesList: Array<number | null> = Array.isArray(childAges)
      ? (childAges as Array<number | null>)
      : [];
    const childTravelers = childTravelerIds.map((id, index) => {
      const ageCandidate = childAgesList[index];
      const age = typeof ageCandidate === "number" ? ageCandidate : undefined;
      return age !== undefined ? { id, age } : { id };
    });

    const authUserId =
      (user as any)?._id || (user as any)?.id || (user as any)?.userId;

    const primaryOwnerCandidate = String(bookingOwner || "").trim();
    const authUserCandidate = String(authUserId || "").trim();
    const primaryOwnerId = isValidMongoObjectId(primaryOwnerCandidate)
      ? primaryOwnerCandidate
      : isValidMongoObjectId(authUserCandidate)
        ? authUserCandidate
        : "";

    const rawSecondaryOwnerIds: string[] = Array.isArray(secondaryBookingOwners)
      ? (secondaryBookingOwners as unknown[])
          .map((v) => String(v).trim())
          .filter(Boolean)
      : secondaryBookingOwner
        ? [String(secondaryBookingOwner).trim()].filter(Boolean)
        : [];

    const secondaryOwnerIds: string[] = rawSecondaryOwnerIds.filter((id) =>
      isValidMongoObjectId(id),
    );

    const filteredSecondaryOwnerIds = secondaryOwnerIds
      .filter((id) => id !== String(primaryOwnerId || "").trim())
      .filter((v, i, a) => a.indexOf(v) === i);

    const legacyOwnerIds: string[] = [
      primaryOwnerId,
      ...filteredSecondaryOwnerIds,
    ]
      .map((v) => String(v || "").trim())
      .filter((v) => isValidMongoObjectId(v))
      .filter((v, i, a) => a.indexOf(v) === i);

    // Build final object

    const bookingDataTemp = new FormData();

    // Map frontend category to backend enum when needed.
    const mappedQuotationType =
      quotationType === "accommodation" ? "hotel" : quotationType;
    bookingDataTemp.append("quotationType", mappedQuotationType);
    bookingDataTemp.append("channel", "B2C");
    bookingDataTemp.append("businessId", businessId._id);
    bookingDataTemp.append("formFields", JSON.stringify(formFields));

    // Ensure totalAmount is a valid number (selling price from form)
    const totalAmountValue = Number(flatInfoForm.sellingprice) || 0;
    bookingDataTemp.append("totalAmount", String(totalAmountValue));

    if (flatInfoForm.bookingstatus && flatInfoForm.bookingstatus !== "") {
      bookingDataTemp.append("status", flatInfoForm.bookingstatus);
    }
    bookingDataTemp.append("serviceStatus", serviceStatus);
    bookingDataTemp.append("createdAt", new Date().toISOString());
    bookingDataTemp.append("updatedAt", new Date().toISOString());
    bookingDataTemp.append("primaryOwner", String(primaryOwnerId));
    bookingDataTemp.append(
      "secondaryOwner",
      JSON.stringify(filteredSecondaryOwnerIds),
    );
    bookingDataTemp.append("owner", JSON.stringify(legacyOwnerIds));
    bookingDataTemp.append("travelDate", traveldate || flatInfoForm.traveldate);
    const resolvedCustomerId = resolveMongoObjectId(
      input.customer,
      (input as any)?.customerId,
      (input as any)?.customerId?._id,
    );
    const resolvedVendorId = resolveMongoObjectId(
      input.vendor,
      (input as any)?.vendorId,
      (input as any)?.vendorId?._id,
    );

    // Only send valid ids; never send empty string (breaks backend casting)
    if (resolvedCustomerId)
      bookingDataTemp.append("customerId", resolvedCustomerId);
    if (resolvedVendorId) bookingDataTemp.append("vendorId", resolvedVendorId);
    bookingDataTemp.append("adultTravelers", JSON.stringify(adultTravelers));
    bookingDataTemp.append("childTravelers", JSON.stringify(childTravelers));
    bookingDataTemp.append("adultNumber", String(adults ?? 0));
    // Always send from infants only
    bookingDataTemp.append("childNumber", String(infants ?? 0));
    bookingDataTemp.append("remarks", remarks ?? "");
    bookingDocuments.map((file) => {
      bookingDataTemp.append("documents", file);
    });
    bookingDataTemp.append("customId", bookingCodeProp || "");

    return bookingDataTemp;
  }

  /**
   * Validate advanced-pricing fields when the checkbox is on.
   */
  const validateAdvancedPricing = useCallback(
    (formValues: Record<string, any>): string => {
      // Find the *infoform key (flightinfoform, accommodationinfoform, etc.)
      const infoFormKey = Object.keys(formValues).find((k) =>
        k.toLowerCase().endsWith("infoform"),
      );
      const infoForm = infoFormKey ? formValues[infoFormKey] : null;
      if (!infoForm || typeof infoForm !== "object") return "";
      if (!infoForm.showAdvancedPricing) return "";

      const isEmpty = (v: unknown) =>
        v === undefined || v === null || String(v).trim() === "";

      if (isEmpty(infoForm.vendorBasePrice))
        return "Vendor Base Price is required when Advanced Pricing is enabled";
      if (isEmpty(infoForm.vendorIncentiveReceived))
        return "Vendor Incentive Received is required when Advanced Pricing is enabled";
      if (isEmpty(infoForm.commissionPaid))
        return "Commission Paid is required when Advanced Pricing is enabled";

      return "";
    },
    [],
  );

  const handleDraftSubmit = useCallback(async () => {
    setIsSubmitting(true);

    // Allow saving drafts even when selectedService is not provided
    // by falling back to initialData or collected form values.
    const currentFormData = formDataRef.current;
    const formValues = {
      ...collectAllFormData(),
      ...currentFormData,
    };

    const selectedServiceValue =
      typeof selectedService === "string"
        ? selectedService
        : (selectedService as any)?.category;

    const quotationTypeForDraft =
      selectedServiceValue ||
      initialData?.quotationType ||
      formValues.quotationType;

    if (!quotationTypeForDraft) {
      console.error("No service selected or detected for draft");
      alert(
        "Please select a service or set a service type before saving a draft",
      );
      setIsSubmitting(false);
      return;
    }

    // Validate advanced pricing fields before saving draft
    const advPricingError = validateAdvancedPricing(formValues);
    if (advPricingError) {
      setApiErrorMessage(advPricingError);
      setShowApiErrorToast(true);
      setIsSubmitting(false);
      return;
    }

    try {
      // booking type may come from selectedService, initialData or the form values
      const bookingData = convertToBookingData(
        formValues,
        quotationTypeForDraft,
        "draft",
      );

      const response = await BookingApiService.createQuotation(bookingData);

      if (response.success) {
        // custom id if available and build success title
        const respData: any = response.data as any;
        const createdCustomId = respData?.quotation?.customId;
        setSuccessTitle(
          createdCustomId
            ? `Yaay! ${createdCustomId} has been successfully saved to drafts.`
            : "Yaay! The Data has been successfully saved to drafts!",
        );
        setIsSuccessModalOpen(true);

        try {
          const updated = respData?.quotation || respData || null;
          if (updated) {
            try {
              onBookingSaved?.(updated);
            } catch (e) {
              /* swallow */
            }
          }
        } catch (e) {
          /* ignore */
        }

        // Reset all forms
        generalFormRef.current?.reset();

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error(
          "Failed to create booking:",
          response.message,
          response.errors,
        );
        // show existing alert and also display error toast with API message
        alert(
          `Failed to create booking: ${response.message || "Unknown error"}`,
        );
        setApiErrorMessage(response.message || "Failed to create booking");
        setShowApiErrorToast(true);
      }
    } catch (err: any) {
      console.error("Unexpected error creating booking:", err.message || err);
      alert(`Error creating booking: ${err.message || "Please try again"}`);
      setApiErrorMessage(err.message || "Error creating booking");
      setShowApiErrorToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedService,
    collectAllFormData,
    onClose,
    bookingDocuments,
    onBookingSaved,
    validateAdvancedPricing,
  ]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // Use ref to get latest formData to avoid stale closure issues
      const currentFormData = formDataRef.current;
      const formValues = {
        ...collectAllFormData(),
        ...currentFormData,
      };
      const selectedServiceValue =
        typeof selectedService === "string"
          ? selectedService
          : (selectedService as any)?.category;

      const quotationTypeForSubmit =
        selectedServiceValue ||
        initialData?.quotationType ||
        formValues.quotationType;

      if (!quotationTypeForSubmit) {
        console.error("No service selected or detected for submit");
        alert(
          "Please select a service or set a service type before submitting",
        );
        setIsSubmitting(false);
        return;
      }

      // Validate advanced pricing fields before submitting
      const advPricingError = validateAdvancedPricing(formValues);
      if (advPricingError) {
        setApiErrorMessage(advPricingError);
        setShowApiErrorToast(true);
        setIsSubmitting(false);
        return;
      }

      const user = getAuthUser() as any;
      const isBookingMaker =
        user?.isBookingMaker === true || user?.isBookingMaker === "true";
      const serviceStatus = isBookingMaker ? "pending" : "approved";

      const bookingData = convertToBookingData(
        formValues,
        quotationTypeForSubmit,
        serviceStatus,
      );

      const response = isEditingExisting
        ? await BookingApiService.updateQuotation(quotationId, bookingData)
        : await BookingApiService.createQuotation(bookingData);

      if (response.success) {
        // custom id if available and build success title
        const respData: any = response.data as any;
        const createdCustomId = respData?.quotation?.customId;
        setSuccessTitle(
          createdCustomId
            ? `Yaay! ${createdCustomId} has been successfully saved.`
            : isEditingExisting
              ? "Yaay! The Data has been successfully updated."
              : "Yaay! The Data has been successfully saved.",
        );
        setIsSuccessModalOpen(true);

        // Notify parent (e.g. BookingHistoryModal) so it can refresh history.
        try {
          const updated = respData?.quotation || respData || null;
          if (updated) {
            try {
              onBookingSaved?.(updated);
            } catch (e) {
              /* swallow */
            }
          }
        } catch (e) {
          /* ignore */
        }

        // Reset all forms
        generalFormRef.current?.reset();

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error(
          "Failed to create booking:",
          response.message,
          response.errors,
        );
        alert(
          `Failed to create booking: ${response.message || "Unknown error"}`,
        );
        setApiErrorMessage(response.message || "Failed to create booking");
        setShowApiErrorToast(true);
      }
    } catch (err: any) {
      console.error("Unexpected error creating booking:", err.message || err);
      alert(`Error creating booking: ${err.message || "Please try again"}`);
      setApiErrorMessage(err.message || "Error creating booking");
      setShowApiErrorToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedService,
    collectAllFormData,
    onClose,
    convertToBookingData,
    isEditingExisting,
    quotationId,
    onBookingSaved,
    validateAdvancedPricing,
  ]);

  // Optimized tab click handler
  const handleTabClick = useCallback(
    (tabId: TabType) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab?.isEnabled) {
        setActiveTab(tabId);
      }
    },
    [tabs],
  );

  // Form data update handler
  const handleFormDataUpdate = useCallback((newData: any) => {
    setFormData((prev: any) => {
      const merged = { ...prev, ...newData };
      const snapshot = stableStringify(merged ?? {});
      setIsDirty(snapshot !== initialSnapshotRef.current);
      return merged;
    });
  }, []);
  const handleRequestClose = useCallback(() => {
    if (isReadOnly || !isDirty) {
      onClose();
      return;
    }
    setIsConfirmModalOpen(true);
  }, [isDirty, isReadOnly, onClose]);

  // Memoized tab buttons
  const tabButtons = useMemo(
    () =>
      tabs.map((tab) => (
        <button
          key={tab.id}
          className={`
          px-4 py-1.5 text-[12px] font-[500] transition-colors relative
          ${
            activeTab === tab.id
              ? "text-[#7135AD]"
              : tab.isEnabled
                ? "text-[#818181] hover:cursor-pointer"
                : "text-gray-300 cursor-not-allowed"
          }
        `}
          onClick={() => handleTabClick(tab.id)}
          disabled={!tab.isEnabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.label}
          {/* Green underline for active tab */}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-[#7135AD] z-20"></span>
          )}
        </button>
      )),
    [tabs, activeTab, handleTabClick],
  );

  // Memoized title (returns JSX to allow styled divider)
  const title = useMemo(() => {
    if (!selectedService) return <span>Booking Form</span>;
    return (
      <div className="flex items-center">
        <span className="text-[16px] text-[#020202] font-[600]">
          {selectedService.title}
        </span>
        {bookingCode ? (
          <>
            <span className="mx-[7px] w-px h-4 bg-gray-200" aria-hidden />
            <span className="font-mono text-[16px] font-[600] text-[#020202]">
              {bookingCode}
            </span>
          </>
        ) : null}
      </div>
    );
  }, [selectedService, bookingCode]);

  // Service dropdown options for switching the service info form
  const serviceDropdownOptions = useMemo(
    () => [
      { value: "travel", label: "Flights" },
      { value: "accommodation", label: "Accommodation" },
      { value: "transport-land", label: "Transportation" },
      { value: "tickets", label: "Ticket (Attraction)" },
      { value: "activity", label: "Activity" },
      { value: "travel insurance", label: "Travel Insurance" },
      { value: "visas", label: "Visa" },
      { value: "others", label: "Others" },
    ],
    [],
  );

  // Resolve the effective service category for ServiceInfoFormSwitcher
  const effectiveServiceCategory =
    serviceOverride ||
    (typeof selectedService === "string"
      ? selectedService
      : selectedService?.category) ||
    initialData?.quotationType ||
    "travel";

  const effectiveSelectedService = useMemo(() => {
    if (!serviceOverride) return selectedService;
    const label =
      serviceDropdownOptions.find((o) => o.value === serviceOverride)?.label ||
      "";
    return {
      id: selectedService?.id || "",
      title: label,
      image: selectedService?.image || "",
      category: serviceOverride as Service["category"],
      description: selectedService?.description || "",
    };
  }, [serviceOverride, selectedService, serviceDropdownOptions]);

  // Dropdown shown in the SideSheet header, only on the service tab
  const headerRight = useMemo(() => {
    if (activeTab !== "service" || isReadOnly) return undefined;
    return (
      <div className="flex items-center">
        <DropDown
          options={serviceDropdownOptions}
          value={effectiveServiceCategory}
          onChange={setServiceOverride}
          placeholder="Select Service"
          customWidth="w-[11rem]"
          customHeight="py-1"
          optionClassName="rounded-[15px]"
          buttonClassName="px-3 py-1.5 hover:border-[#C6AEDE] rounded-[15px]"
          noButtonRadius
        />
      </div>
    );
  }, [activeTab, isReadOnly, serviceDropdownOptions, effectiveServiceCategory]);

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={handleRequestClose}
        onCloseButtonClick={handleRequestClose}
        title={title}
        headerRight={headerRight}
        width="xl"
        zIndex={900}
      >
        <div className="relative h-full">
          <div className="flex flex-col h-full">
            {/* Tabs - Fixed at top */}
            <div
              className="absolute top-0 left-0 right-0 z-10 pt-[16px] mb-[16px] flex w-full space-x-0 bg-white"
              role="tablist"
            >
              {tabButtons}
            </div>

            {/* Divider line below tabs */}
            <div className="absolute top-11.5 left-3 right-7 z-10 border-b border-gray-200"></div>

            {/* Tab Content - Scrollable with padding for fixed header and footer */}
            <div
              className="overflow-y-auto mt-[18px] pt-7 pb-8"
              role="tabpanel"
            >
              {/* dont unmount General Info */}
              <div
                style={{ display: activeTab === "general" ? "block" : "none" }}
                className={isReadOnly ? "opacity-90" : ""}
              >
                {isOpen && (
                  <GeneralInfoForm
                    key={`general-${quotationId || "new"}-${formInstanceId}`}
                    initialFormData={initialData || {}}
                    onFormDataUpdate={handleFormDataUpdate}
                    isSubmitting={isSubmitting || isReadOnly}
                    isReadOnly={isReadOnly}
                    formRef={generalFormRef as React.RefObject<HTMLFormElement>}
                    hideVendor={hideVendor}
                  />
                )}
              </div>

              {/* Always mount Service Info */}
              <div
                style={{ display: activeTab === "service" ? "block" : "none" }}
                className={
                  isReadOnly
                    ? "opacity-90 [&_input]:pointer-events-none [&_textarea]:pointer-events-none [&_select]:pointer-events-none [&_button]:pointer-events-none"
                    : ""
                }
              >
                <ServiceInfoFormSwitcher
                  key={`service-${quotationId || "new"}-${formInstanceId}-${effectiveServiceCategory}`}
                  initialData={initialData}
                  onFormDataUpdate={handleFormDataUpdate}
                  isSubmitting={isSubmitting || isReadOnly}
                  isReadOnly={isReadOnly}
                  formRef={serviceFormRef}
                  bookingCode={bookingCode}
                  selectedService={
                    effectiveSelectedService || initialData?.quotationType
                  }
                  onAddDocuments={addBookingDocuments}
                  onRemoveDocuments={removeBookingDocuments}
                  existingDocuments={existingBookingDocuments}
                  generalInfoData={formData}
                />
              </div>

              {/* Always mount Price Info */}
              <div
                style={{ display: activeTab === "price" ? "block" : "none" }}
                className={
                  isReadOnly
                    ? "opacity-90 [&_input]:pointer-events-none [&_textarea]:pointer-events-none [&_select]:pointer-events-none [&_button]:pointer-events-none"
                    : ""
                }
              >
                <PriceInfoForm
                  key={`price-${quotationId || "new"}-${formInstanceId}`}
                  externalFormData={initialData}
                  onFormDataUpdate={handleFormDataUpdate}
                  isSubmitting={isSubmitting || isReadOnly}
                  isReadOnly={isReadOnly}
                  formRef={priceFormRef}
                  bookingCode={bookingCode}
                  onAddDocuments={addBookingDocuments}
                  onRemoveDocuments={removeBookingDocuments}
                  existingDocuments={existingBookingDocuments}
                />
              </div>
            </div>

            {/* Footer Actions - kept outside the scrollable area so it remains fixed at the bottom */}
            <div className="border-t border-gray-200 px-4 py-2 bg-white">
              <div className="flex justify-between mt-1 -ml-2 -mb-1">
                {/* LEFT SIDE BUTTONS */}
                <div>
                  {(activeTab === "service" || activeTab === "price") && (
                    <Button
                      text="Previous"
                      onClick={() => {
                        const currentIndex = tabs.findIndex(
                          (tab) => tab.id === activeTab,
                        );
                        const prevTab = tabs[currentIndex - 1];
                        if (prevTab?.isEnabled) setActiveTab(prevTab.id);
                      }}
                      bgColor="bg-white"
                      textColor="text-[#7135AD]"
                      className="border border-[#7135AD] hover:cursror-pointer rounded-[15px] px-2 py-2"
                      disabled={isSubmitting}
                    />
                  )}
                </div>

                {/* RIGHT SIDE BUTTONS */}
                <div className="flex space-x-2">
                  {/* EDIT MODE */}
                  {mode !== "view" && (
                    <>
                      {(activeTab === "general" ||
                        (activeTab == "service" && !isEditingExisting)) && (
                        <Button
                          text="Save As Draft"
                          onClick={handleDraftSubmit}
                          bgColor="bg-white"
                          textColor="text-[#7135AD] font-[600]"
                          className="hover:cursor-pointer px-2 py-2 border border-[#7135AD] rounded-[15px]"
                          disabled={isSubmitting}
                        />
                      )}

                      {(activeTab === "general" || activeTab === "service") && (
                        <Button
                          text="Next"
                          icon={
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="8"
                              viewBox="0 0 12 8"
                              fill="none"
                            >
                              <path
                                d="M0.75 3.75H11.25M11.25 3.75L8.25 6.75M11.25 3.75L8.25 0.75"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                          iconPosition="right"
                          onClick={() => {
                            const currentIndex = tabs.findIndex(
                              (tab) => tab.id === activeTab,
                            );
                            const nextTab = tabs[currentIndex + 1];
                            if (nextTab?.isEnabled) setActiveTab(nextTab.id);
                          }}
                          bgColor="bg-[#7135AD]"
                          textColor="text-white font-[600]"
                          className="hover:cursor-pointer px-2.5 py-2 rounded-[15px] gap-2"
                          disabled={isSubmitting}
                        />
                      )}

                      {activeTab === "price" && (
                        <>
                          {!isEditingExisting && (
                            <Button
                              text="Save as Draft"
                              onClick={handleDraftSubmit}
                              bgColor="bg-white border border-[#7135AD]"
                              textColor="text-[#7135AD]"
                              disabled={isSubmitting}
                              className="rounded-[15px] px-2 py-2"
                            />
                          )}

                          <Button
                            text={
                              isLimitlessBooking
                                ? "Proceed to booking summary"
                                : "Save Details"
                            }
                            onClick={() =>
                              isLimitlessBooking
                                ? handleProceedToBookingSummary()
                                : handleSubmit()
                            }
                            bgColor="bg-[#7135AD]"
                            textColor="text-white"
                            className="hover:cursor-pointer px-2 py-2 rounded-[15px]"
                            width="w-auto"
                            type="button"
                            disabled={
                              isSubmitting || !(selectedService || initialData)
                            }
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* VIEW MODE */}
                  {mode === "view" && (
                    <>
                      {(activeTab === "general" || activeTab === "service") && (
                        <Button
                          text="Next"
                          onClick={() => {
                            const currentIndex = tabs.findIndex(
                              (tab) => tab.id === activeTab,
                            );
                            const nextTab = tabs[currentIndex + 1];
                            if (nextTab?.isEnabled) setActiveTab(nextTab.id);
                          }}
                          icon={
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="8"
                              viewBox="0 0 12 8"
                              fill="none"
                            >
                              <path
                                d="M0.75 3.75H11.25M11.25 3.75L8.25 6.75M11.25 3.75L8.25 0.75"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                          iconPosition="right"
                          bgColor="bg-[#7135AD]"
                          textColor="text-white font-[600]"
                          className="hover:cursor-pointer px-2 py-2 rounded-[15px] gap-2"
                          disabled={isSubmitting}
                        />
                      )}

                      {activeTab === "price" && isDuplicateView ? (
                        <Button
                          text={"Save"}
                          onClick={() => handleSubmit()}
                          icon={<LuSave size={16} />}
                          bgColor="bg-[#7135AD]"
                          textColor="text-white"
                          width="w-auto"
                          type="button"
                          className="mr-4 rounded-[15px] px-2 py-2"
                          disabled={
                            isSubmitting || !(bookingCode || bookingCodeProp)
                          }
                        />
                      ) : activeTab === "price" && isReadOnly ? (
                        <Button
                          text="Edit"
                          onClick={() => {
                            setReadOnlyOverride(false);
                            try {
                              onRequestEdit?.();
                            } catch (e) {
                              /* ignore */
                            }
                          }}
                          bgColor="bg-white"
                          textColor="text-[#7135AD]"
                          className="hover:cursor-pointer px-2 py-2 rounded-[15px] border border-[#7135AD]"
                          disabled={isSubmitting || !quotationId}
                        />
                      ) : activeTab === "price" ? (
                        <Button
                          text={
                            isLimitlessBooking ? "Proceed to Summary" : "Save"
                          }
                          onClick={() =>
                            isLimitlessBooking
                              ? handleProceedToBookingSummary()
                              : handleSubmit()
                          }
                          icon={
                            isLimitlessBooking ? undefined : (
                              <LuSave size={16} />
                            )
                          }
                          bgColor="bg-[#7135AD]"
                          textColor="text-white"
                          width="w-auto"
                          type="button"
                          className="mr-4 rounded-[15px] px-2 py-2"
                          disabled={
                            isSubmitting || (!quotationId && !bookingCode)
                          }
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ErrorToast
          message={apiErrorMessage}
          visible={showApiErrorToast}
          onClose={() => setShowApiErrorToast(false)}
        />
      </SideSheet>

      {/* Confirm Popup Modal */}
      <ConfirmPopupModal
        isOpen={isConfirmModalOpen}
        title="Do you confirm to save the changes?"
        onClose={() => setIsConfirmModalOpen(false)}
        onCancel={onClose}
        onConfirm={() => {
          handleSubmit();
        }}
        confirmText="Yes"
        cancelText="No"
      />

      {/* Success Popup Modal */}
      <SuccessPopupModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setIsConfirmModalOpen(false);
          onClose();
        }}
        title={
          successTitle ||
          "Yaay! The Data - #1234 has been successfully saved to drafts!"
        }
      />

      <AddCustomerSideSheet
        isOpen={isAddCustomerOpen}
        onCancel={closeAddCustomer}
        mode="create"
        data={null}
        formRef={addCustomerFormRef}
        customerCode={customerCode}
      />

      <AddVendorSideSheet
        isOpen={isAddVendorOpen}
        onCancel={closeAddVendor}
        mode="create"
        data={null}
        formRef={addVendorFormRef}
        vendorCode={vendorCode}
      />

      <AddNewTravellerForm formRef={addTravellerFormRef} />
    </>
  );
};

export default function BookingFormSidesheetWrapper(
  props: BookingFormSidesheetProps,
) {
  return (
    <BookingProvider>
      <BookingFormSidesheetContent {...props} />
    </BookingProvider>
  );
}
