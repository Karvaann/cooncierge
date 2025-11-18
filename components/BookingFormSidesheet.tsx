"use client";

import React, { useState, useCallback, useMemo } from "react";
import ConfirmPopupModal from "./popups/BookingPopups/ConfirmPopupModal";
import SuccessPopupModal from "./popups/BookingPopups/SuccessPopupModal";
import { BookingProvider, useBooking } from "@/context/BookingContext";
import { BookingApiService } from "@/services/bookingApi";
import SideSheet from "@/components/SideSheet";
import GeneralInfoForm from "./forms/GeneralInfoForm";
import AddNewCustomerForm from "./forms/AddNewFroms/AddNewCustomerForm";
import AddNewVendorForm from "./forms/AddNewFroms/AddNewVendorForm";
import FlightServiceInfoForm from "./forms/FlightServiceInfo/FlightServiceInfoForm";
import AccommodationServiceInfo from "./forms/AccommodationServiceInfo/AccommodationServiceInfo";

// Type definitions
interface Service {
  id: string;
  title: string;
  image: string;
  category: "travel" | "accommodation" | "transport" | "activity";
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

  if (!selectedService) return null;

  switch (selectedService.category) {
    case "travel":
      return <FlightServiceInfoForm {...props} />;

    case "accommodation":
      return <AccommodationServiceInfo {...props} />;

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
  const { isAddCustomerOpen, isAddVendorOpen } = useBooking();
  const { submitBooking, saveDraft } = useBooking();

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const formValues = Object.fromEntries(formData.entries()) as Record<
        string,
        any
      >;

      if (!selectedService) {
        console.error("No service selected");
        return;
      }

      const { totalAmount, ...restFields } = formValues;

      const selectedServiceObj: Service = {
        id: "",
        title: "",
        image: "",
        category: selectedService.category,
        description: "",
      };

      const bookingData = {
        service: selectedServiceObj,
        generalInfo: {
          customer: formValues.customer || "",
          vendor: formValues.vendor || "",
          adults: Number(formValues.adults || 0),
          children: Number(formValues.children || 0),
          infants: Number(formValues.infants || 0),
          traveller1: formValues.traveller1 || "",
          traveller2: formValues.traveller2 || "",
          traveller3: formValues.traveller3 || "",
          bookingOwner: formValues.bookingOwner || "",
          remarks: formValues.remarks || "",
        },
        customerform: {
          firstname: formValues.firstname || "",
          lastname: formValues.lastname || "",
          nickname: formValues.nickname || "",
          contactnumber: Number(formValues.contactnumber || 0),
          emailId: formValues.emailId || "",
          dateofbirth: Number(formValues.dateofbirth || 0),
          gstin: Number(formValues.gstin || 0),
          companyname: formValues.companyname || "",
          documents: formValues.documents || "",
          billingaddress: formValues.billingaddress || "",
          remarks: formValues.customerRemarks || "",
        },
        vendorform: {
          companyname: formValues.vendorCompanyName || "",
          companyemail: formValues.vendorCompanyEmail || "",
          contactnumber: Number(formValues.vendorContact || 0),
          gstin: Number(formValues.vendorGstin || 0),
          firstname: formValues.vendorFirstname || "",
          lastname: formValues.vendorLastname || "",
          nickname: formValues.vendorNickname || "",
          emailId: formValues.vendorEmailId || "",
          dateofbirth: Number(formValues.vendorDob || 0),
          documents: "",
          billingaddress: formValues.vendorBillingAddress || "",
          remarks: formValues.vendorRemarks || "",
        },
        flightinfoform: {
          bookingdate: formValues.bookingdate || "",
          traveldate: formValues.traveldate || "",
          bookingstatus: formValues.bookingstatus || "Confirmed",
          costprice: Number(formValues.costprice || 0),
          sellingprice: Number(formValues.sellingprice || 0),
          PNR: formValues.PNR || "",
          pnrEnabled: formValues.pnrEnabled || false,
          segments: formValues.segments || [],
          returnSegments: formValues.returnSegments || [],
          samePNRForAllSegments: formValues.samePNRForAllSegments || false,
          flightType: formValues.flightType || "One Way",
          documents: "",
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
        timestamp: new Date().toISOString(),
      };

      try {
        const formData = new FormData();

        // append JSON payload
        formData.append("bookingData", JSON.stringify(bookingData));

        formData.append("customerDocument", formValues.customerDocument);
        formData.append("vendorDocument", formValues.vendorDocument);
        formData.append("flightDocument", formValues.flightDocument);

        const response = await BookingApiService.createQuotation(bookingData);

        if (response.success) {
          console.log("Quotation created successfully!", response.data);
          e.currentTarget.reset();
        } else {
          console.error(
            "Failed to create quotation:",
            response.message,
            response.errors
          );
        }
      } catch (err: any) {
        console.error(
          "Unexpected error creating quotation:",
          err.message || err
        );
      }
    },
    [selectedService]
  );

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
          px-4 py-2 text-[0.75rem] font-medium border-b-2 transition-colors
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
  const activeTabContent = useMemo(() => {
    const activeTabConfig = tabs.find((tab) => tab.id === activeTab);
    if (!activeTabConfig) return null;

    const Component = activeTabConfig.component;

    const commonProps = {
      formData,
      onFormDataUpdate: handleFormDataUpdate,
      onSubmit: handleFormSubmit,
      selectedService,
      isSubmitting,
    };

    return <Component {...commonProps} />;
  }, [
    activeTab,
    tabs,
    formData,
    handleFormDataUpdate,
    handleFormSubmit,
    selectedService,
    isSubmitting,
  ]);

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
            {activeTabContent}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 p-4 mt-4">
            <div className="flex justify-between">
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                className="px-3 py-1 text-[0.85rem] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <div className="flex space-x-2">
                {activeTab !== "general" && (
                  <button
                    onClick={() => {
                      const currentIndex = tabs.findIndex(
                        (tab) => tab.id === activeTab
                      );
                      const prevTab = tabs[currentIndex - 1];
                      if (prevTab?.isEnabled) {
                        setActiveTab(prevTab.id);
                      }
                    }}
                    className="px-3 text-[#114958] text-[0.85rem] border border-[#114958] rounded-lg hover:bg-[#114958] hover:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    Previous
                  </button>
                )}

                {activeTab !== "review" ? (
                  <button
                    onClick={() => {
                      const currentIndex = tabs.findIndex(
                        (tab) => tab.id === activeTab
                      );
                      const nextTab = tabs[currentIndex + 1];
                      if (nextTab?.isEnabled) {
                        setActiveTab(nextTab.id);
                      }
                    }}
                    className="px-3 bg-[#114958] text-[0.85rem] text-white rounded-lg hover:bg-[#0d3a45] transition-colors"
                    disabled={isSubmitting}
                  >
                    Next
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const draftName = `${
                            selectedService?.title || "Booking"
                          } - ${formData?.generalInfo?.customer || "Draft"}`;
                          await saveDraft(draftName);
                          // Show success message or close
                          onClose();
                        } catch (error) {
                          console.error("Error saving draft:", error);
                        }
                      }}
                      className="px-3 py-2  text-[0.75rem] bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleFormSubmit(formData)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      disabled={isSubmitting || !selectedService}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Booking"}
                    </button>
                  </div>
                )}
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
            const draftName = `${selectedService?.title || "Booking"} - ${
              formData?.generalInfo?.customer || "Draft"
            }`;
            await saveDraft(draftName);
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

      {isAddCustomerOpen && <AddNewCustomerForm />}
      {isAddVendorOpen && <AddNewVendorForm />}
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
