"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import ConfirmPopupModal from "./popups/BookingPopups/ConfirmPopupModal";
import SuccessPopupModal from "./popups/BookingPopups/SuccessPopupModal";
import { BookingProvider, useBooking } from "@/context/BookingContext";
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

import { getAuthUser } from '@/services/storage/authStorage';

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
}

type TabType = "general" | "service" | "review";

interface TabConfig {
  id: TabType;
  label: string;
  component: React.ComponentType<any>;
  isEnabled: boolean;
}

function ServiceInfoFormSwitcher(props: any) {
  const { selectedService } = props;
  console.log("CATEGORY:", selectedService?.category);

  if (!selectedService) return null;

  switch (selectedService.category) {
    case "travel":
      return <FlightServiceInfoForm {...props} />;

    case "accommodation":
      return <AccommodationServiceInfo {...props} />;

    case "transport-land":
      return <LandTransportServiceInfoForm {...props} />;

    case "transport-maritime":
      return <MaritimeTransportServiceInfoForm {...props} />;
    case "tickets":
      return <TicketsServiceInfoForm {...props} />;

    case "activity":
      return <ActivityServiceInfoForm {...props} />;

    case "travel insurance":
      return <InsuranceServiceInfoForm {...props} />;

    case "visas":
      return <VisasServiceInfoForm {...props} />;

    case "others":
      return <OthersServiceInfoForm {...props} />;

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
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [formData, setFormData] = useState<any>(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
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

  // Ref to always have access to latest formData in callbacks
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Update collectAllFormData
  const collectAllFormData = useCallback(() => {
    const allFormData: Record<string, any> = {};

    // Get data from General Info form
    if (generalFormRef.current instanceof HTMLFormElement) {
      const generalData = new FormData(generalFormRef.current);
      console.log("General Data:", generalData);
      generalData.forEach((value, key) => {
        allFormData[key] = value;
      });
    }

    // Get data from Service Info form
    console.log("Service Form Ref:", serviceFormRef.current);
    if (serviceFormRef.current instanceof HTMLFormElement) {
      console.log("Service Form Ref:", serviceFormRef.current);
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
        isEnabled: !!selectedService,
      },
    ],
    [selectedService]
  );

  function convertToBookingData(input: any, quotationType: string, serviceStatus: string) {

    const user = getAuthUser() as any;
    const businessId = user?.businessId;

    const {
      customer,
      vendor,
      adults,
      children,
      remarks,
      traveldate,
      adultTravellerIds,
      infantTravellerIds,
      ...rest
    } = input;

    // Detect ANY key that ends with "infoform"
    const infoFormKey = Object.keys(input).find(k => k.toLowerCase().endsWith("infoform"));

    // Extract and flatten the infoform object
    const flatInfoForm = infoFormKey && typeof input[infoFormKey] === "object"
      ? { ...input[infoFormKey] }
      : {};

    // Everything except known fields and infoform goes to formFields
    const formFields = Object.fromEntries(
      Object.entries(rest).filter(([key]) => key !== infoFormKey)
    );

    // Merge flattened infoform into formFields
    Object.assign(formFields, flatInfoForm);

    // Combine adult and infant traveller IDs, filter out empty strings
    const travelers = [
      ...(adultTravellerIds || []),
      ...(infantTravellerIds || []),
    ].filter((id: string) => id && id.trim() !== "");

    // Build final object
    const bookingData = {
      quotationType, // replace if needed
      channel: "B2C",
      businessId: businessId._id,

      formFields,

      totalAmount: Number(flatInfoForm.sellingprice ?? flatInfoForm.costprice ?? 0),
      status: flatInfoForm.bookingstatus || "confirmed",

      createdAt: new Date(),
      updatedAt: new Date(),

      owner: [input.bookingOwner],

      travelDate: traveldate || flatInfoForm.traveldate ? new Date(flatInfoForm.traveldate) : null,

      customerId: input.customer,
      vendorId: input.vendor,

      travelers,

      adultTravlers: adults ?? 0,
      childTravlers: children ?? 0,
      serviceStatus,

      remarks: remarks ?? "",
    };

    return bookingData;
  }

  const handleDraftSubmit = useCallback(async () => {
    setIsSubmitting(true);

    if (!selectedService) {
      console.error("No service selected");
      alert("Please select a service");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use ref to get latest formData to avoid stale closure issues
      const currentFormData = formDataRef.current;

      console.log("COLLECTING ALL FORM DATA");
      console.log("COLLECTED FORM DATA:", collectAllFormData());
      console.log("FORM DATA (from ref):", currentFormData);

      const formValues = {
        ...collectAllFormData(),
        ...currentFormData,
      };

      
      console.log("Form Values:", formValues);


      const bookingData = convertToBookingData(formValues, selectedService.category, 'draft');

      console.log("Submitting Booking Data:", bookingData);

      const response = await BookingApiService.createQuotation(bookingData);

      if (response.success) {
        console.log("Booking created successfully!", response.data);
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
      }
    } catch (err: any) {
      console.error("Unexpected error creating booking:", err.message || err);
      alert(`Error creating booking: ${err.message || "Please try again"}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedService, collectAllFormData, onClose]);


  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    if (!selectedService) {
      console.error("No service selected");
      alert("Please select a service");
      setIsSubmitting(false);
      return;
    }

    try {
      // Use ref to get latest formData to avoid stale closure issues
      const currentFormData = formDataRef.current;

      console.log("COLLECTING ALL FORM DATA");
      console.log("COLLECTED FORM DATA:", collectAllFormData());
      console.log("FORM DATA (from ref):", currentFormData);

      const formValues = {
        ...collectAllFormData(),
        ...currentFormData,
      };

      
      console.log("Form Values:", formValues);


      const bookingData = convertToBookingData(formValues, selectedService.category, 'approved');

      console.log("Submitting Booking Data:", bookingData);

      const response = await BookingApiService.createQuotation(bookingData);

      if (response.success) {
        console.log("Booking created successfully!", response.data);
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
      }
    } catch (err: any) {
      console.error("Unexpected error creating booking:", err.message || err);
      alert(`Error creating booking: ${err.message || "Please try again"}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedService, collectAllFormData, onClose]);

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
    console.log("handleFormDataUpdate called with:", newData);
    setFormData((prev: any) => {
      const merged = { ...prev, ...newData };
      console.log("Merged formData:", merged);
      return merged;
    });
  }, []);

  // Form submission handler
  const handleFormSubmit = useCallback(
    async (data: any) => {
      if (!selectedService) return;

      setIsSubmitting(true);
      try {
        const completeFormData = {
          ...formData,
          ...data,
          service: selectedService,
        };

        // Use BookingContext to submit the booking
        await submitBooking();

        // Also call the optional onFormSubmit prop for backward compatibility
        await onFormSubmit?.(completeFormData);

        onClose();
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, selectedService, submitBooking, onFormSubmit, onClose]
  );

  // Memoized tab buttons
  const tabButtons = useMemo(
    () =>
      tabs.map((tab) => (
        <button
          key={tab.id}
          className={`
          px-4 py-1.5 text-[0.75rem] font-medium border-b-2 transition-colors
          ${
            activeTab === tab.id
              ? "border-[#0D4B37] text-[#0D4B37]"
              : tab.isEnabled
              ? "border-transparent  text-gray-500 hover:text-gray-700"
              : "border-transparent  text-gray-300 cursor-not-allowed"
          }
        `}
          onClick={() => handleTabClick(tab.id)}
          disabled={!tab.isEnabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          {tab.label}
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

  // Memoized title
  const title = useMemo(() => {
    if (!selectedService) return "Booking Form";
    return `${selectedService.title} - Booking Form`;
  }, [selectedService]);

  // Confirm modal title text
  const confirmModalText =
    "Do you want to save Data - #1234 to drafts before closing?";

  return (
    <>
      <SideSheet
        isOpen={isOpen}
        onClose={onClose}
        onCloseButtonClick={() => setIsConfirmModalOpen(true)}
        title={title}
        width="xl"
      >
        <div>
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div
              className="flex w-full border-b border-gray-200 space-x-0 px-6 -mt-2 -ml-2"
              role="tablist"
            >
              {tabButtons}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto" role="tabpanel">
              {/* dont unmount General Info */}
              <div
                style={{ display: activeTab === "general" ? "block" : "none" }}
              >
                <GeneralInfoForm
                  formData={formData}
                  onFormDataUpdate={handleFormDataUpdate}
                  isSubmitting={isSubmitting}
                  formRef={generalFormRef as React.RefObject<HTMLFormElement>}
                />
              </div>

              {/* Always mount Service Info */}
              <div
                style={{ display: activeTab === "service" ? "block" : "none" }}
              >
                <ServiceInfoFormSwitcher
                  formData={formData}
                  onFormDataUpdate={handleFormDataUpdate}
                  isSubmitting={isSubmitting}
                  formRef={serviceFormRef}
                  selectedService={selectedService}
                />
              </div>
            </div>

            {/* Footer Actions */}

            <div className="border-t border-gray-200 p-4 mt-4">
              <div className="flex justify-between">
                {activeTab === "general" ? (
                  // Cancel Button (General Tab)
                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="px-3 py-1 text-[0.85rem] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                ) : (
                  // Previous Button (Service Tab)
                  <button
                    onClick={() => {
                      const currentIndex = tabs.findIndex(
                        (tab) => tab.id === activeTab
                      );
                      const prevTab = tabs[currentIndex - 1];
                      if (prevTab?.isEnabled) setActiveTab(prevTab.id);
                    }}
                    className="px-3 py-1 text-[#114958] text-[0.85rem] border border-[#114958] rounded-lg hover:bg-[#114958] hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    Previous
                  </button>
                )}

                {/* RIGHT SIDE BUTTONS */}
                <div className="flex space-x-2">
                  {/* GENERAL TAB BUTTONS */}
                  {activeTab === "general" && (
                    <>
                      {/* Save Draft */}
                      <button
                        onClick={async () => {
                          try {
                            const formValues = {
                              ...collectAllFormData(),
                              ...formDataRef.current,
                            };
                            const draftName = `${
                              selectedService?.title || "Booking"
                            } - ${formValues.customer || "Draft"}`;
                            await saveDraft(formValues, draftName);
                            onClose();
                          } catch (error) {
                            console.error("Error saving draft:", error);
                          }
                        }}
                        className="px-3 py-2 text-[0.75rem] bg-[#114958] text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        Save As Draft
                      </button>

                      {/* Next */}
                      <button
                        onClick={() => {
                          const currentIndex = tabs.findIndex(
                            (tab) => tab.id === activeTab
                          );
                          const nextTab = tabs[currentIndex + 1];
                          if (nextTab?.isEnabled) setActiveTab(nextTab.id);
                        }}
                        className="px-3 bg-[#114958] text-[0.85rem] text-white rounded-lg hover:bg-[#0d3a45] transition-colors"
                        disabled={isSubmitting}
                      >
                        Next
                      </button>
                    </>
                  )}

                  {/* SERVICE TAB BUTTONS */}
                  {activeTab === "service" && (
                    <>
                      {/* Save Draft */}
                      <button
                        onClick={async () => {
                          try {
                            const formValues = {
                              ...collectAllFormData(),
                              ...formData,
                            };
                            const draftName = `${
                              selectedService?.title || "Booking"
                            } - ${formValues.customer || "Draft"}`;
                            await saveDraft(formValues, draftName);
                            onClose();
                          } catch (error) {
                            console.error("Error saving draft:", error);
                          }
                        }}
                        className="px-3 py-2 text-[0.75rem] bg-[#cce2e9] text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        Save As Draft
                      </button>

                      {/* Create Booking */}
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-[#114958] text-[0.75rem] text-white rounded-lg hover:cursor-pointer transition-colors disabled:opacity-50"
                        disabled={isSubmitting || !selectedService}
                      >
                        {isSubmitting
                          ? "Creating Booking..."
                          : "Create Booking"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SideSheet>

      {/* Confirm Popup Modal */}
      <ConfirmPopupModal
        isOpen={isConfirmModalOpen}
        title="Do you want to save the data to drafts before closing?"
        onClose={() => setIsConfirmModalOpen(false)}
        onDontSave={() => {
          setIsConfirmModalOpen(false);
          onClose();
        }}
        onSaveAsDrafts={async () => {
          try {
            handleDraftSubmit();
            setIsSuccessModalOpen(true);
          } catch (error) {
            console.error("Error saving draft:", error);
          }
        }}
      />

      {/* Success Popup Modal */}
      <SuccessPopupModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setIsConfirmModalOpen(false);
          onClose();
        }}
        title="Yaay! The Data - #1234 has been successfully saved to drafts!"
      />

      {isAddCustomerOpen && (
        <AddCustomerSideSheet
          isOpen={isAddCustomerOpen}
          onCancel={closeAddCustomer}
          mode="create"
          data={null}
          formRef={addCustomerFormRef}
        />
      )}
      {isAddVendorOpen && (
        <AddVendorSideSheet
          isOpen={isAddVendorOpen}
          onCancel={closeAddVendor}
          mode="create"
          data={null}
          formRef={addVendorFormRef}
        />
      )}
      {isAddTravellerOpen && (
        <AddNewTravellerForm formRef={addTravellerFormRef} />
      )}
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
