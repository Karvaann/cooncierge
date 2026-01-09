"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import ConfirmPopupModal from "./popups/BookingPopups/ConfirmPopupModal";
import SuccessPopupModal from "./popups/BookingPopups/SuccessPopupModal";
import ErrorToast from "./ErrorToast";
import { BookingProvider, useBooking } from "@/context/BookingContext";
import { BookingApiService } from "@/services/bookingApi";
import apiClient from "@/services/apiClient";
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
import Button from "./Button";
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
}

type TabType = "general" | "service" | "review";

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
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [formData, setFormData] = useState<any>(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string>("");
  const [apiErrorMessage, setApiErrorMessage] = useState<string>("");
  const [showApiErrorToast, setShowApiErrorToast] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState(false);
  const { isAddCustomerOpen, isAddVendorOpen, isAddTravellerOpen } =
    useBooking();
  const { closeAddCustomer, closeAddVendor } = useBooking();
  const { submitBooking, saveDraft } = useBooking();

  // refs for form data collection
  const generalFormRef = useRef<HTMLFormElement | null>(null);
  const serviceFormRef = useRef<HTMLFormElement | null>(null);
  const addCustomerFormRef = useRef<HTMLFormElement | null>(null);
  const addVendorFormRef = useRef<HTMLFormElement | null>(null);
  const addTravellerFormRef = useRef<HTMLFormElement | null>(null);

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
    setBookingDocuments((prev) => [...prev, ...files]);
  };

  const [customerCode, setCustomerCode] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const initialSnapshotRef = useRef<string>("");
  const quotationId = initialData?._id || initialData?.id;
  const isEditingExisting = mode === "edit" && Boolean(quotationId);

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
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(initialData);
      // Load existing documents from initialData
      if (Array.isArray(initialData.documents)) {
        setExistingBookingDocuments(initialData.documents);
      } else {
        setExistingBookingDocuments([]);
      }
    } else {
      setFormData({});
      setExistingBookingDocuments([]);
    }
    setIsDirty(false);
    setActiveTab("general");
  }, [initialData, isOpen]);
  const isReadOnly = mode === "view";

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
    ],
    []
  );

  function convertToBookingData(
    input: any,
    quotationType: string,
    serviceStatus: string
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
      k.toLowerCase().endsWith("infoform")
    );

    // Extract and flatten the infoform object
    const flatInfoForm =
      infoFormKey && typeof input[infoFormKey] === "object"
        ? { ...input[infoFormKey] }
        : {};

    // Everything except known fields and infoform goes to formFields
    const formFields = Object.fromEntries(
      Object.entries(rest).filter(([key]) => key !== infoFormKey)
    );

    // Merge flattened infoform into formFields
    Object.assign(formFields, flatInfoForm);

    const isValidMongoObjectId = (value: unknown): boolean => {
      if (typeof value !== "string") return false;
      const v = value.trim();
      if (!v) return false;
      if (v.toLowerCase() === "tba") return false;
      return /^[a-f\d]{24}$/i.test(v);
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
      (input as any)?.childTravellerIds ?? infantTravellerIds
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
      isValidMongoObjectId(id)
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
    bookingDataTemp.append("totalAmount", String(flatInfoForm.sellingprice));

    if (flatInfoForm.bookingstatus && flatInfoForm.bookingstatus !== "") {
      bookingDataTemp.append("status", flatInfoForm.bookingstatus);
    }
    bookingDataTemp.append("serviceStatus", serviceStatus);
    bookingDataTemp.append("createdAt", new Date().toISOString());
    bookingDataTemp.append("updatedAt", new Date().toISOString());
    bookingDataTemp.append("primaryOwner", String(primaryOwnerId));
    bookingDataTemp.append(
      "secondaryOwner",
      JSON.stringify(filteredSecondaryOwnerIds)
    );
    bookingDataTemp.append("owner", JSON.stringify(legacyOwnerIds));
    bookingDataTemp.append("travelDate", traveldate || flatInfoForm.traveldate);
    bookingDataTemp.append("customerId", input.customer);
    bookingDataTemp.append("vendorId", input.vendor);
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
        "Please select a service or set a service type before saving a draft"
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // booking type may come from selectedService, initialData or the form values
      const bookingData = convertToBookingData(
        formValues,
        quotationTypeForDraft,
        "draft"
      );

      // Prepare multipart form data
      // const formDataToSend = new FormData();
      // formDataToSend.append("data", JSON.stringify(bookingData));

      // bookingDocuments.forEach((file) => {
      //   formDataToSend.append("documents", file);
      // });

      const response = await BookingApiService.createQuotation(bookingData);

      if (response.success) {
        // custom id if available and build success title
        const respData: any = response.data as any;
        const createdCustomId = respData?.quotation?.customId;
        setSuccessTitle(
          createdCustomId
            ? `Yaay! ${createdCustomId} has been successfully saved to drafts.`
            : "Yaay! The Data has been successfully saved to drafts!"
        );
        setIsSuccessModalOpen(true);

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
          response.errors
        );
        // show existing alert and also display error toast with API message
        alert(
          `Failed to create booking: ${response.message || "Unknown error"}`
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
  }, [selectedService, collectAllFormData, onClose, bookingDocuments]);

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
          "Please select a service or set a service type before submitting"
        );
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
        serviceStatus
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
            : "Yaay! The Data has been successfully saved."
        );
        setIsSuccessModalOpen(true);

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
          response.errors
        );
        alert(
          `Failed to create booking: ${response.message || "Unknown error"}`
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
  ]);

  // Optimized tab click handler
  const handleTabClick = useCallback(
    (tabId: TabType) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab?.isEnabled) {
        setActiveTab(tabId);
      }
    },
    [tabs]
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
          px-4 py-1.5 text-[0.75rem] font-medium transition-colors relative
          ${
            activeTab === tab.id
              ? "text-[#0D4B37]"
              : tab.isEnabled
              ? "text-gray-500 hover:text-gray-700"
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
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-[#0D4B37] z-20"></span>
          )}
        </button>
      )),
    [tabs, activeTab, handleTabClick]
  );

  // Memoized active tab content
  // const activeTabContent = useMemo(() => {
  //   const activeTabConfig = tabs.find((tab) => tab.id === activeTab);
  //   if (!activeTabConfig) return null;

  //   const Component = activeTabConfig.component;

  //   const commonProps = {
  //     formData,
  //     onFormDataUpdate: handleFormDataUpdate,
  //     onSubmit: handleFormSubmit,
  //     selectedService,
  //     isSubmitting,
  //   };

  //   return (
  //     <Component
  //       {...commonProps}
  //       formRef={activeTab === "general" ? generalFormRef : serviceFormRef}
  //     />
  //   );
  // }, [
  //   activeTab,
  //   tabs,
  //   formData,
  //   handleFormDataUpdate,
  //   handleFormSubmit,
  //   selectedService,
  //   isSubmitting,
  // ]);

  // Memoized title (returns JSX to allow styled divider)
  const title = useMemo(() => {
    if (!selectedService) return <span>Booking Form</span>;
    return (
      <div className="flex items-center">
        <span className="text-[16px] font-semibold">
          {selectedService.title}
        </span>
        {bookingCode ? (
          <>
            <span className="mx-2 w-px h-4 bg-gray-200" aria-hidden />
            <span className="font-mono text-[16px] text-black">
              {bookingCode}
            </span>
          </>
        ) : null}
      </div>
    );
  }, [selectedService, bookingCode]);

  // Confirm modal title text
  const confirmModalText =
    "Do you want to save Data - #1234 to drafts before closing?";

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={handleRequestClose}
        onCloseButtonClick={handleRequestClose}
        title={title}
        width="xl"
        zIndex={900}
      >
        <div className="relative h-full">
          <div className="flex flex-col h-full">
            {/* Tabs - Fixed at top */}
            <div
              className="absolute top-0 left-0 right-0 z-10 -ml-1 -mt-1 flex w-full space-x-0 px-4 bg-white"
              role="tablist"
            >
              {tabButtons}
            </div>

            {/* Divider line below tabs */}
            <div className="absolute top-6.5 left-6 right-8 z-10 border-b border-gray-200"></div>

            {/* Tab Content - Scrollable with padding for fixed header and footer */}
            <div className="flex-1 overflow-y-auto pt-7 pb-24" role="tabpanel">
              {/* dont unmount General Info */}
              <div
                style={{ display: activeTab === "general" ? "block" : "none" }}
                className={isReadOnly ? "opacity-90" : ""}
              >
                <GeneralInfoForm
                  initialFormData={initialData || {}}
                  onFormDataUpdate={handleFormDataUpdate}
                  isSubmitting={isSubmitting || isReadOnly}
                  isReadOnly={isReadOnly}
                  formRef={generalFormRef as React.RefObject<HTMLFormElement>}
                />
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
                  initialData={initialData}
                  onFormDataUpdate={handleFormDataUpdate}
                  isSubmitting={isSubmitting || isReadOnly}
                  isReadOnly={isReadOnly}
                  formRef={serviceFormRef}
                  selectedService={
                    selectedService || initialData?.quotationType
                  }
                  onAddDocuments={addBookingDocuments}
                  existingDocuments={existingBookingDocuments}
                />
              </div>
            </div>

            {/* Footer Actions - kept outside the scrollable area so it remains fixed at the bottom */}
            {!isReadOnly && (
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex justify-between">
                  {/* LEFT SIDE BUTTONS */}
                  <div>
                    {activeTab === "service" && (
                      <Button
                        text="Previous"
                        onClick={() => {
                          const currentIndex = tabs.findIndex(
                            (tab) => tab.id === activeTab
                          );
                          const prevTab = tabs[currentIndex - 1];
                          if (prevTab?.isEnabled) setActiveTab(prevTab.id);
                        }}
                        bgColor="bg-white"
                        textColor="text-[#114958]"
                        className="border border-[#114958] hover:bg-[#114958] "
                        disabled={isSubmitting}
                      />
                    )}

                    {/* General tab → Nothing shown */}
                  </div>

                  {/* RIGHT SIDE BUTTONS */}
                  <div className="flex space-x-2">
                      <>
                        {activeTab === "general" && !isEditingExisting &&<Button
                          text="Save As Draft"
                          onClick={handleDraftSubmit}
                          bgColor="bg-white"
                          textColor="text-[#114958]"
                          className="hover:bg-gray-200 border border-[#114958]"
                          disabled={isSubmitting}
                        />}

                        {activeTab === "general" && <Button
                          text="Next"
                          onClick={() => {
                            const currentIndex = tabs.findIndex(
                              (tab) => tab.id === activeTab
                            );
                            const nextTab = tabs[currentIndex + 1];
                            if (nextTab?.isEnabled) setActiveTab(nextTab.id);
                          }}
                          bgColor="bg-[#114958]"
                          textColor="text-white"
                          className="hover:bg-[#0d3a45]"
                          disabled={isSubmitting}
                        />}
                      </>

                    {activeTab === "service" && (
                      <>
                        {!isEditingExisting && (
                          <Button
                            text="Save As Draft"
                            onClick={handleDraftSubmit}
                            bgColor="bg-white border border-[#114958]"
                            textColor="text-[#114958]"
                            disabled={isSubmitting}
                          />
                        )}

                        <Button
                          text="Save"
                          onClick={() => handleSubmit()}
                          icon={<LuSave size={16} />}
                          bgColor="bg-[#0D4B37]"
                          textColor="text-white"
                          width="w-auto"
                          type="button"
                          disabled={
                            isSubmitting || !(selectedService || initialData)
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
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
  props: BookingFormSidesheetProps
) {
  return (
    <BookingProvider>
      <BookingFormSidesheetContent {...props} />
    </BookingProvider>
  );
}
