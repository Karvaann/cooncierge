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
  const serviceFormRef = useRef<HTMLFormElement | HTMLDivElement | null>(null);
  const addCustomerFormRef = useRef<HTMLFormElement | null>(null);
  const addVendorFormRef = useRef<HTMLFormElement | null>(null);
  const addTravellerFormRef = useRef<HTMLFormElement | null>(null);

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

    // Get data from Add Customer form (if open/filled)
    if (addCustomerFormRef.current instanceof HTMLElement) {
      const customerData = new FormData(addCustomerFormRef.current as any);
      customerData.forEach((value, key) => {
        allFormData[key] = value;
      });
    }

    // Get data from Add Vendor form (if open/filled)
    if (addVendorFormRef.current instanceof HTMLElement) {
      const vendorData = new FormData(addVendorFormRef.current as any);
      vendorData.forEach((value, key) => {
        allFormData[key] = value;
      });
    }

    // Get data from Add Traveller form (if open/filled)
    if (addTravellerFormRef.current instanceof HTMLElement) {
      const travellerData = new FormData(addTravellerFormRef.current as any);
      travellerData.forEach((value, key) => {
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

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    if (!selectedService) {
      console.error("No service selected");
      alert("Please select a service");
      setIsSubmitting(false);
      return;
    }

    try {
      // Collect data from all forms
      const formValues = collectAllFormData();

      const selectedServiceObj: Service = {
        id: "",
        title: selectedService.title || "",
        image: selectedService.image || "",
        category: selectedService.category,
        description: selectedService.description || "",
      };

      const bookingData = {
        service: selectedServiceObj,
        generalInfo: {
          customer: formValues.customer || "",
          vendor: formValues.vendor || "",
          adults: Number(formValues.adults || 0),
          children: Number(formValues.children || 0),
          infants: Number(formValues.infants || 0),
          adultTravellers: formValues.adultTravellers || [],
          infantTravellers: formValues.infantTravellers || [],
          traveller1: formValues.traveller1 || "",
          traveller2: formValues.traveller2 || "",
          traveller3: formValues.traveller3 || "",
          bookingOwner: formValues.bookingOwner || "",
          remarks: formValues.remarks || "",
        },
        customerform: {
          firstname: formValues.firstname || "",
          lastname: formValues.lastname || "",
          nickname: formValues.nickname || formValues.alias || "",
          contactnumber: formValues.contactnumber || formValues.phone || "",
          emailId: formValues.emailId || formValues.email || "",
          dateofbirth: formValues.dateofbirth || formValues.dateOfBirth || "",
          gstin: formValues.gstin || "",
          companyname: formValues.companyname || formValues.companyName || "",
          billingaddress: formValues.billingaddress || formValues.address || "",
          remarks: formValues.customerRemarks || formValues.remarks || "",
        },
        vendorform: {
          companyname:
            formValues.vendorCompanyName || formValues.companyName || "",
          companyemail: formValues.vendorCompanyEmail || formValues.email || "",
          contactnumber: formValues.vendorContact || formValues.phone || "",
          gstin: formValues.vendorGstin || formValues.GSTIN || "",
          firstname: formValues.vendorFirstname || formValues.firstname || "",
          lastname: formValues.vendorLastname || formValues.lastname || "",
          nickname: formValues.vendorNickname || formValues.alias || "",
          emailId: formValues.vendorEmailId || formValues.email || "",
          dateofbirth: formValues.vendorDob || formValues.dateOfBirth || "",
          billingaddress:
            formValues.vendorBillingAddress || formValues.address || "",
          remarks: formValues.vendorRemarks || formValues.remarks || "",
        },
        flightinfoform: {
          bookingdate: formValues.bookingdate || "",
          traveldate: formValues.traveldate || "",
          bookingstatus: formValues.bookingstatus || "Confirmed",
          costprice: Number(formValues.costprice || 0),
          sellingprice: Number(formValues.sellingprice || 0),
          PNR: formValues.PNR || "",
          pnrEnabled:
            formValues.pnrEnabled === "true" || formValues.pnrEnabled === true,
          segments: formValues.segments || [],
          returnSegments: formValues.returnSegments || [],
          samePNRForAllSegments:
            formValues.samePNRForAllSegments === "true" ||
            formValues.samePNRForAllSegments === true,
          flightType: formValues.flightType || "One Way",
          remarks: formValues.flightRemarks || "",
        },
        accommodationform: {
          bookingdate: formValues.bookingdate || "",
          traveldate: formValues.traveldate || "",
          bookingstatus: formValues.bookingstatus || "Confirmed",
          checkindate: formValues.checkindate || "",
          checkintime: formValues.checkintime || "",
          checkoutdate: formValues.checkoutdate || "",
          checkouttime: formValues.checkouttime || "",
          checkOutPeriod: formValues.checkOutPeriod || "AM",
          pax: Number(formValues.pax || 0),
          mealPlan: formValues.mealPlan || "EPAI",
          confirmationNumber: formValues.confirmationNumber || "",
          accommodationType: formValues.accommodationType || "",
          propertyName: formValues.propertyName || "",
          propertyAddress: formValues.propertyAddress || "",
          googleMapsLink: formValues.googleMapsLink || "",
          segments: formValues.accommodationSegments || [],
          costprice: Number(formValues.accomCost || 0),
          sellingprice: Number(formValues.accomSell || 0),
          remarks: formValues.accomRemarks || "",
        },
        otherServiceInfoform: {
          bookingdate: formValues.bookingdate || "",
          traveldate: formValues.traveldate || "",
          bookingstatus: formValues.bookingstatus || "Confirmed",
          confirmationNumber: formValues.confirmationNumber || "",
          title: formValues.title || "",
          description: formValues.description || "",
          remarks: formValues.remarks || "",
        },
        travellerform: {
          firstname: formData.firstname || "",
          lastname: formData.lastname || "",
          nickname: formData.nickname || "",
          contactnumber: formData.contactnumber || "",
          emailId: formData.emailId || "",
          dateofbirth: formData.dateofbirth || "",
          remarks: formData.remarks || "",
        },
        timestamp: new Date().toISOString(),
      };

      console.log("Submitting Booking Data:", bookingData);

      const response = await BookingApiService.createQuotation(bookingData);

      if (response.success) {
        console.log("Booking created successfully!", response.data);
        setIsSuccessModalOpen(true);

        // Reset all forms
        generalFormRef.current?.reset();
        if (serviceFormRef.current instanceof HTMLFormElement) {
          serviceFormRef.current.reset();
        }

        addCustomerFormRef.current?.reset();
        addVendorFormRef.current?.reset();
        addTravellerFormRef.current?.reset();

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
    setFormData((prev: any) => ({ ...prev, ...newData }));
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
                        className="px-3 py-2 text-[0.75rem] bg-[#114958] text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
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
            const formValues = {
              ...collectAllFormData(),
              ...formData,
            };
            const draftName = `${selectedService?.title || "Booking"} - ${
              formValues.customer || "Draft"
            }`;
            await saveDraft(formValues, draftName);
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
