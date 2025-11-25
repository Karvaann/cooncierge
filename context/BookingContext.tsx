"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useState,
} from "react";
import {
  BookingApiService,
  DraftManager,
  validateGeneralInfo,
  validateServiceInfo,
} from "@/services/bookingApi";

// Import the DraftBooking type
interface DraftBooking {
  id: string;
  draftName: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "completed";
  completedQuotationId?: string;
  service?: Service;
  generalInfo?: Partial<GeneralInfo>;
  serviceInfo?: Partial<ServiceInfo>;
  customerform?: CustomerForm;
  vendorform?: VendorForm;
  flightinfoform?: FlightInfoForm;
  timestamp?: string;
}

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

interface GeneralInfo {
  customer: string;
  vendor: string;
  adults: number;
  children: number;
  infants: number;
  traveller1: string;
  traveller2: string;
  traveller3: string;
  bookingOwner: string;
  remarks: string;
}

interface ServiceInfo {
  serviceType: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  budget: number;
  preferences: string;
  specialRequests: string;
  priority: "low" | "medium" | "high";
  flexibility: boolean;
}

interface CustomerForm {
  firstname: string;
  lastname: string;
  nickname: string;
  contactnumber: number;
  emailId: string;
  dateofbirth: number;
  gstin: number;
  companyname: string;
  documents?: string | File;
  billingaddress: string | number;
  remarks: string;
}

interface TravellerForm {
  firstname: string;
  lastname: string;
  nickname: string;
  contactnumber: number | string;
  emailId: string;
  dateofbirth: number | string;
  remarks: string;
}

interface VendorForm {
  companyname: string;
  companyemail: string;
  contactnumber: number;
  gstin: number;
  firstname: string;
  lastname: string;
  nickname: string;
  emailId: string;
  dateofbirth: number;
  documents?: string | File;
  billingaddress: string | number;
  remarks: string;
}

interface FlightSegment {
  id: string;
  flightnumber: number | string;
  traveldate: string;
  cabinclass:
    | "Economy"
    | "Premium Economy"
    | "Business"
    | "First Class"
    | string;
  pnr?: string;
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
}

interface FlightInfoForm {
  bookingdate: string;
  traveldate: string;
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  costprice: number | string;
  sellingprice: number | string;
  PNR: number | string;
  pnrEnabled: boolean;
  segments: FlightSegment[]; // Array of flight segments
  returnSegments: ReturnFlightSegment[]; // array for return segments
  samePNRForAllSegments: boolean;
  flightType: "One Way" | "Round Trip" | "Multi-City";
  remarks: string;
}
interface AccommodationInfoForm {
  bookingdate: string;
  traveldate: string; // This can be the main/first travel date
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  checkindate: string;
  checkintime: string;
  checkoutdate: string;
  checkouttime: string;
  checkOutPeriod: "AM" | "PM";
  pax: number | string;
  mealPlan: "EPAI" | "CPAI" | "MAPAI" | "APAI" | string;
  confirmationNumber: number | string;
  accommodationType:
    | "Hotel"
    | "Resort"
    | "Hostel"
    | "Villa"
    | "Apartment"
    | "Homestay"
    | "Experiental Stay"
    | string;
  propertyName: string;
  propertyAddress: string;
  googleMapsLink: string;
  segments: RoomSegment[];
  costprice: number | string;
  sellingprice: number | string;

  remarks: string;
}

interface RoomSegment {
  id?: string | null;
  roomCategory: string;
  bedType: string;
}

interface OtherServiceInfoForm {
  bookingdate: string;
  traveldate: string; // This can be the main/first travel date
  bookingstatus: "Confirmed" | "Canceled" | "In Progress" | string;
  costprice: number | string;
  sellingprice: number | string;
  confirmationNumber: number | string;
  title: string;
  description: string;
  documents?: string | File;
  remarks: string;
}

interface BookingState {
  // UI State
  isModalOpen: boolean;
  isSidesheetOpen: boolean;
  isLoading: boolean;

  // Form Data
  selectedService: Service | undefined;
  generalInfo: Partial<GeneralInfo>;
  serviceInfo: Partial<ServiceInfo>;
  customerForm: CustomerForm;
  vendorForm: VendorForm;
  flightinfoform: FlightInfoForm;
  accommodationinfoform: AccommodationInfoForm;
  otherServiceInfoForm: OtherServiceInfoForm;

  travellerForm: TravellerForm;

  // Form Progress
  currentStep: "service-selection" | "general-info" | "service-info" | "review";
  completedSteps: string[];

  // Validation
  errors: Record<string, string>;

  // API State
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;

  // Draft State
  currentDraftId: string | null;
  drafts: DraftBooking[];
  isDraftLoading: boolean;
  draftError: string | null;
}

type BookingAction =
  | { type: "OPEN_MODAL" }
  | { type: "CLOSE_MODAL" }
  | { type: "OPEN_SIDESHEET" }
  | { type: "CLOSE_SIDESHEET" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SELECT_SERVICE"; payload: Service }
  | { type: "UPDATE_GENERAL_INFO"; payload: Partial<GeneralInfo> }
  | { type: "UPDATE_SERVICE_INFO"; payload: Partial<ServiceInfo> }
  | { type: "SET_CUSTOMER_FORM"; payload: CustomerForm }
  | { type: "SET_VENDOR_FORM"; payload: VendorForm }
  | { type: "SET_TRAVELLER_FORM"; payload: TravellerForm }
  | { type: "SET_CURRENT_STEP"; payload: BookingState["currentStep"] }
  | { type: "COMPLETE_STEP"; payload: string }
  | { type: "SET_ERRORS"; payload: Record<string, string> }
  | { type: "CLEAR_ERRORS" }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_SUBMIT_ERROR"; payload: string | null }
  | { type: "SET_SUBMIT_SUCCESS"; payload: boolean }
  | { type: "RESET_BOOKING" }
  | { type: "LOAD_FROM_STORAGE"; payload: Partial<BookingState> }
  | { type: "SET_CURRENT_DRAFT_ID"; payload: string | null }
  | { type: "SET_DRAFTS"; payload: DraftBooking[] }
  | { type: "SET_DRAFT_LOADING"; payload: boolean }
  | { type: "SET_DRAFT_ERROR"; payload: string | null }
  | { type: "LOAD_DRAFT"; payload: DraftBooking };

interface BookingContextType {
  state: BookingState;

  // UI Actions
  openModal: () => void;
  closeModal: () => void;
  openSidesheet: () => void;
  closeSidesheet: () => void;
  setLoading: (loading: boolean) => void;

  // Form Actions
  selectService: (service: Service) => void;
  updateGeneralInfo: (info: Partial<GeneralInfo>) => void;
  // updateServiceInfo: (info: Partial<ServiceInfo>) => void;
  setCustomerForm: (form: CustomerForm) => void;
  setCurrentStep: (step: BookingState["currentStep"]) => void;
  completeStep: (step: string) => void;
  isAddCustomerOpen: boolean;
  openAddCustomer: () => void;
  closeAddCustomer: () => void;
  setVendorForm: (form: VendorForm) => void;
  isAddVendorOpen: boolean;
  openAddVendor: () => void;
  closeAddVendor: () => void;
  isAddTravellerOpen: boolean;
  openAddTraveller: () => void;
  closeAddTraveller: () => void;
  setTravellerForm: (form: TravellerForm) => void;

  // Validation Actions
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;

  // API Actions
  submitBooking: () => Promise<void>;
  saveDraft: (draftName?: string) => Promise<void>;
  validateCustomer: (customerId: string) => Promise<boolean>;
  validateVendor: (vendorId: string) => Promise<boolean>;
  resetBooking: () => void;

  // Draft Actions
  loadDrafts: () => Promise<void>;
  loadDraft: (draftId: string) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  searchDrafts: (query: string) => Promise<DraftBooking[]>;

  // Computed Properties
  isFormValid: boolean;
  canProceedToNext: boolean;
  totalSteps: number;
  currentStepIndex: number;
}

// Initial state
const initialState: BookingState = {
  isModalOpen: false,
  isSidesheetOpen: false,
  isLoading: false,
  selectedService: undefined,
  generalInfo: {},
  serviceInfo: {},
  customerForm: {
    firstname: "",
    lastname: "",
    nickname: "",
    contactnumber: 0,
    emailId: "",
    dateofbirth: 0,
    gstin: 0,
    companyname: "",
    documents: "",
    billingaddress: "",
    remarks: "",
  },
  vendorForm: {
    firstname: "",
    lastname: "",
    companyemail: "",
    nickname: "",
    documents: "",
    contactnumber: 0,
    emailId: "",
    dateofbirth: 0,
    gstin: 0,
    companyname: "",
    billingaddress: "",
    remarks: "",
  },
  flightinfoform: {
    bookingdate: "",
    traveldate: "",
    bookingstatus: "",
    costprice: "",
    sellingprice: "",
    PNR: "",
    segments: [
      {
        id: "1",
        flightnumber: "",
        traveldate: "",
        cabinclass: "",
      },
    ], // Start with one segment
    returnSegments: [
      {
        id: "return-1",
        flightnumber: "",
        traveldate: "",
        cabinclass: "",
      },
    ],
    pnrEnabled: false,
    samePNRForAllSegments: false,
    flightType: "One Way",
    remarks: "",
  },
  accommodationinfoform: {
    bookingdate: "",
    traveldate: "",
    bookingstatus: "",
    costprice: "",
    sellingprice: "",
    confirmationNumber: "",
    checkindate: "",
    checkintime: "",
    checkoutdate: "",
    checkouttime: "",
    checkOutPeriod: "AM",
    pax: "",
    mealPlan: "",
    propertyName: "",
    propertyAddress: "",
    googleMapsLink: "",
    segments: [
      {
        id: "room-1",
        roomCategory: "",
        bedType: "",
      },
    ],
    accommodationType: "",
    remarks: "",
  },
  otherServiceInfoForm: {
    bookingdate: "",
    traveldate: "",
    bookingstatus: "",
    costprice: "",
    sellingprice: "",
    confirmationNumber: "",
    title: "",
    description: "",
    documents: "",
    remarks: "",
  },
  travellerForm: {
    firstname: "",
    lastname: "",
    nickname: "",
    contactnumber: 0,
    emailId: "",
    dateofbirth: 0,
    remarks: "",
  },

  currentStep: "service-selection",
  completedSteps: [],
  errors: {},
  isSubmitting: false,
  submitError: null,
  submitSuccess: false,
  // Draft State
  currentDraftId: null,
  drafts: [],
  isDraftLoading: false,
  draftError: null,
};

// Reducer
const bookingReducer = (
  state: BookingState,
  action: BookingAction
): BookingState => {
  switch (action.type) {
    case "OPEN_MODAL":
      return { ...state, isModalOpen: true };

    case "CLOSE_MODAL":
      return { ...state, isModalOpen: false };

    case "OPEN_SIDESHEET":
      return { ...state, isSidesheetOpen: true };

    case "CLOSE_SIDESHEET":
      return { ...state, isSidesheetOpen: false };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SELECT_SERVICE":
      return {
        ...state,
        selectedService: action.payload,
        currentStep: "general-info",
        isModalOpen: false,
        isSidesheetOpen: true,
      };

    case "UPDATE_GENERAL_INFO":
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };

    case "UPDATE_SERVICE_INFO":
      return {
        ...state,
        serviceInfo: { ...state.serviceInfo, ...action.payload },
      };

    case "SET_CUSTOMER_FORM":
      return { ...state, customerForm: action.payload };

    case "SET_VENDOR_FORM":
      return { ...state, vendorForm: action.payload };

    case "SET_TRAVELLER_FORM":
      return { ...state, travellerForm: action.payload };

    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };

    case "COMPLETE_STEP":
      return {
        ...state,
        completedSteps: [...new Set([...state.completedSteps, action.payload])],
      };

    case "SET_ERRORS":
      return { ...state, errors: action.payload };

    case "CLEAR_ERRORS":
      return { ...state, errors: {} };

    case "SET_SUBMITTING":
      return { ...state, isSubmitting: action.payload };

    case "SET_SUBMIT_ERROR":
      return { ...state, submitError: action.payload, isSubmitting: false };

    case "SET_SUBMIT_SUCCESS":
      return { ...state, submitSuccess: action.payload, isSubmitting: false };

    case "RESET_BOOKING":
      return { ...initialState };

    case "LOAD_FROM_STORAGE":
      return { ...state, ...action.payload };

    case "SET_CURRENT_DRAFT_ID":
      return { ...state, currentDraftId: action.payload };

    case "SET_DRAFTS":
      return { ...state, drafts: action.payload };

    case "SET_DRAFT_LOADING":
      return { ...state, isDraftLoading: action.payload };

    case "SET_DRAFT_ERROR":
      return { ...state, draftError: action.payload, isDraftLoading: false };

    case "LOAD_DRAFT":
      return {
        ...state,
        selectedService: action.payload.service,
        generalInfo: action.payload.generalInfo || {},
        serviceInfo: action.payload.serviceInfo || {},
        customerForm: action.payload.customerform || state.customerForm,
        vendorForm: action.payload.vendorform || state.vendorForm,
        flightinfoform: action.payload.flightinfoform || state.flightinfoform,
        currentDraftId: action.payload.id,
        currentStep: action.payload.service
          ? "general-info"
          : "service-selection",
      };

    default:
      return state;
  }
};

// Context
const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = "coonicerge_booking_state";

// Provider component
export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddTravellerOpen, setIsAddTravellerOpen] = useState(false);

  const openAddCustomer = useCallback(() => setIsAddCustomerOpen(true), []);
  const closeAddCustomer = useCallback(() => setIsAddCustomerOpen(false), []);

  const openAddVendor = useCallback(() => setIsAddVendorOpen(true), []);
  const closeAddVendor = useCallback(() => setIsAddVendorOpen(false), []);
  const openAddTraveller = useCallback(() => setIsAddTravellerOpen(true), []);
  const closeAddTraveller = useCallback(() => setIsAddTravellerOpen(false), []);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedState = JSON.parse(stored);
          dispatch({ type: "LOAD_FROM_STORAGE", payload: parsedState });
        }
      } catch (error) {
        console.error("Error loading booking state from storage:", error);
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stateToSave = {
          selectedService: state.selectedService,
          generalInfo: state.generalInfo,
          serviceInfo: state.serviceInfo,
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Error saving booking state to storage:", error);
      }
    }
  }, [
    state.selectedService,
    state.generalInfo,
    state.serviceInfo,
    state.currentStep,
    state.completedSteps,
  ]);

  // Action creators
  const openModal = useCallback(() => dispatch({ type: "OPEN_MODAL" }), []);
  const closeModal = useCallback(() => dispatch({ type: "CLOSE_MODAL" }), []);
  const openSidesheet = useCallback(
    () => dispatch({ type: "OPEN_SIDESHEET" }),
    []
  );
  const closeSidesheet = useCallback(
    () => dispatch({ type: "CLOSE_SIDESHEET" }),
    []
  );
  const setLoading = useCallback(
    (loading: boolean) => dispatch({ type: "SET_LOADING", payload: loading }),
    []
  );

  const selectService = useCallback((service: Service) => {
    dispatch({ type: "SELECT_SERVICE", payload: service });
  }, []);

  const updateGeneralInfo = useCallback((info: Partial<GeneralInfo>) => {
    dispatch({ type: "UPDATE_GENERAL_INFO", payload: info });
  }, []);

  const updateServiceInfo = useCallback((info: Partial<ServiceInfo>) => {
    dispatch({ type: "UPDATE_SERVICE_INFO", payload: info });
  }, []);

  const setCustomerForm = useCallback((form: CustomerForm) => {
    dispatch({ type: "SET_CUSTOMER_FORM", payload: form });
  }, []);

  const setVendorForm = useCallback((form: VendorForm) => {
    dispatch({ type: "SET_VENDOR_FORM", payload: form });
  }, []);

  const setTravellerForm = useCallback((form: TravellerForm) => {
    dispatch({ type: "SET_TRAVELLER_FORM", payload: form });
  }, []);

  const setCurrentStep = useCallback((step: BookingState["currentStep"]) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  }, []);

  const completeStep = useCallback((step: string) => {
    dispatch({ type: "COMPLETE_STEP", payload: step });
  }, []);

  const setErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: "SET_ERRORS", payload: errors });
  }, []);

  const clearErrors = useCallback(() => dispatch({ type: "CLEAR_ERRORS" }), []);

  const resetBooking = useCallback(() => {
    dispatch({ type: "RESET_BOOKING" });
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Submit booking function with comprehensive validation and API integration
  const submitBooking = useCallback(async () => {
    dispatch({ type: "SET_SUBMITTING", payload: true });
    dispatch({ type: "SET_SUBMIT_ERROR", payload: null });

    try {
      // Validate general info
      const generalInfoErrors = validateGeneralInfo(state.generalInfo);
      const serviceInfoErrors = validateServiceInfo(
        state.serviceInfo,
        state.selectedService
      );

      const allErrors = { ...generalInfoErrors, ...serviceInfoErrors };

      if (Object.keys(allErrors).length > 0) {
        dispatch({ type: "SET_ERRORS", payload: allErrors });
        throw new Error("Please fix the validation errors before submitting");
      }

      // Ensure we have a selected service
      if (!state.selectedService) {
        throw new Error("Please select a service");
      }

      // Prepare booking data
      const bookingData = {
        service: state.selectedService,
        generalInfo: state.generalInfo as GeneralInfo,
        serviceInfo: state.serviceInfo as ServiceInfo,
        customerform: state.customerForm,
        vendorform: state.vendorForm,
        flightinfoform: state.flightinfoform,
        accommodationinfoform: state.accommodationinfoform,
        otherServiceInfoForm: state.otherServiceInfoForm,
        timestamp: new Date().toISOString(),
      };

      // Submit to API with draft ID if available
      const response = await BookingApiService.createQuotation(
        bookingData,
        state.currentDraftId || undefined
      );

      if (!response.success) {
        if (response.errors) {
          dispatch({ type: "SET_ERRORS", payload: response.errors });
        }
        throw new Error(response.message || "Failed to create booking");
      }

      console.log("Booking submitted successfully:", response.data);

      dispatch({ type: "SET_SUBMIT_SUCCESS", payload: true });

      // Clear current draft ID since booking is completed
      dispatch({ type: "SET_CURRENT_DRAFT_ID", payload: null });

      // Reset form after successful submission
      setTimeout(() => {
        resetBooking();
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while submitting the booking";
      dispatch({ type: "SET_SUBMIT_ERROR", payload: errorMessage });
    }
  }, [
    state.selectedService,
    state.generalInfo,
    state.serviceInfo,
    state.customerForm,
    resetBooking,
  ]);

  // Save draft function
  const saveDraft = useCallback(
    async (draftName?: string) => {
      dispatch({ type: "SET_DRAFT_LOADING", payload: true });

      try {
        const draftData = {
          service: state.selectedService,
          generalInfo: state.generalInfo,
          serviceInfo: state.serviceInfo,
          customerform: state.customerForm,
          vendorform: state.vendorForm,
          flightinfoform: state.flightinfoform,
          accommodationinfoform: state.accommodationinfoform,
          otherServiceInfoForm: state.otherServiceInfoForm,
          timestamp: new Date().toISOString(),
        };

        const response = await BookingApiService.saveDraft(
          draftData,
          draftName
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to save draft");
        }

        // Update current draft ID
        if (response.data) {
          dispatch({ type: "SET_CURRENT_DRAFT_ID", payload: response.data.id });
        }

        console.log("Draft saved successfully to localStorage");
      } catch (error) {
        console.error("Error saving draft:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save draft";
        dispatch({ type: "SET_DRAFT_ERROR", payload: errorMessage });
      } finally {
        dispatch({ type: "SET_DRAFT_LOADING", payload: false });
      }
    },
    [
      state.selectedService,
      state.generalInfo,
      state.serviceInfo,
      state.customerForm,
      state.vendorForm,
      state.flightinfoform,
      state.accommodationinfoform,
      state.otherServiceInfoForm,
    ]
  );

  // Validate customer function
  const validateCustomer = useCallback(
    async (customerId: string): Promise<boolean> => {
      try {
        const response = await BookingApiService.validateCustomer(customerId);
        return response.success;
      } catch (error) {
        console.error("Error validating customer:", error);
        return false;
      }
    },
    []
  );

  // Validate vendor function
  const validateVendor = useCallback(
    async (vendorId: string): Promise<boolean> => {
      try {
        const response = await BookingApiService.validateVendor(vendorId);
        return response.success;
      } catch (error) {
        console.error("Error validating vendor:", error);
        return false;
      }
    },
    []
  );

  // Load drafts function
  const loadDrafts = useCallback(async () => {
    dispatch({ type: "SET_DRAFT_LOADING", payload: true });
    try {
      const response = await BookingApiService.getDrafts();
      if (response.success && response.data) {
        dispatch({ type: "SET_DRAFTS", payload: response.data });
      } else {
        throw new Error(response.message || "Failed to load drafts");
      }
    } catch (error) {
      console.error("Error loading drafts:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load drafts";
      dispatch({ type: "SET_DRAFT_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_DRAFT_LOADING", payload: false });
    }
  }, []);

  // Load specific draft function
  const loadDraft = useCallback(async (draftId: string) => {
    dispatch({ type: "SET_DRAFT_LOADING", payload: true });
    try {
      const response = await BookingApiService.getDraftById(draftId);
      if (response.success && response.data) {
        dispatch({ type: "LOAD_DRAFT", payload: response.data });
      } else {
        throw new Error(response.message || "Draft not found");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load draft";
      dispatch({ type: "SET_DRAFT_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_DRAFT_LOADING", payload: false });
    }
  }, []);

  // Delete draft function
  const deleteDraft = useCallback(
    async (draftId: string) => {
      try {
        const response = await BookingApiService.deleteDraft(draftId);
        if (response.success) {
          // Reload drafts to update the list
          await loadDrafts();
          // Clear current draft ID if it was the deleted draft
          if (state.currentDraftId === draftId) {
            dispatch({ type: "SET_CURRENT_DRAFT_ID", payload: null });
          }
        } else {
          throw new Error(response.message || "Failed to delete draft");
        }
      } catch (error) {
        console.error("Error deleting draft:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete draft";
        dispatch({ type: "SET_DRAFT_ERROR", payload: errorMessage });
      }
    },
    [loadDrafts, state.currentDraftId]
  );

  // Search drafts function
  const searchDrafts = useCallback(
    async (query: string): Promise<DraftBooking[]> => {
      try {
        const response = await BookingApiService.searchDrafts(query);
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || "Failed to search drafts");
        }
      } catch (error) {
        console.error("Error searching drafts:", error);
        return [];
      }
    },
    []
  );

  // Computed properties
  const steps = ["service-selection", "general-info", "service-info", "review"];
  const totalSteps = steps.length;
  const currentStepIndex = steps.indexOf(state.currentStep);

  const isFormValid = useMemo(() => {
    const hasService = !!state.selectedService;
    const hasRequiredGeneralInfo = !!(
      state.generalInfo.customer &&
      state.generalInfo.vendor &&
      state.generalInfo.traveller1 &&
      state.generalInfo.bookingOwner
    );
    const hasRequiredServiceInfo = !!(
      state.serviceInfo.destination &&
      state.serviceInfo.departureDate &&
      state.serviceInfo.budget
    );

    return hasService && hasRequiredGeneralInfo && hasRequiredServiceInfo;
  }, [state.selectedService, state.generalInfo, state.serviceInfo]);

  const canProceedToNext = useMemo(() => {
    switch (state.currentStep) {
      case "service-selection":
        return !!state.selectedService;
      case "general-info":
        return !!(
          state.generalInfo.customer &&
          state.generalInfo.vendor &&
          state.generalInfo.traveller1 &&
          state.generalInfo.bookingOwner
        );
      case "service-info":
        return !!(
          state.serviceInfo.destination &&
          state.serviceInfo.departureDate &&
          state.serviceInfo.budget
        );
      case "review":
        return isFormValid;
      default:
        return false;
    }
  }, [
    state.currentStep,
    state.selectedService,
    state.generalInfo,
    state.serviceInfo,
    isFormValid,
  ]);

  const contextValue: BookingContextType = useMemo(
    () => ({
      state,
      openModal,
      closeModal,
      openSidesheet,
      closeSidesheet,
      setLoading,
      selectService,
      updateGeneralInfo,
      updateServiceInfo,
      setCurrentStep,
      setCustomerForm,
      isAddCustomerOpen,
      openAddCustomer,
      closeAddCustomer,
      setVendorForm,
      isAddVendorOpen,
      openAddVendor,
      closeAddVendor,
      setTravellerForm,
      isAddTravellerOpen,
      openAddTraveller,
      closeAddTraveller,
      completeStep,
      setErrors,
      clearErrors,
      submitBooking,
      saveDraft,
      validateCustomer,
      validateVendor,
      resetBooking,
      loadDrafts,
      loadDraft,
      deleteDraft,
      searchDrafts,
      isFormValid,
      canProceedToNext,
      totalSteps,
      currentStepIndex,
    }),
    [
      state,
      openModal,
      closeModal,
      openSidesheet,
      closeSidesheet,
      setLoading,
      selectService,
      updateGeneralInfo,
      updateServiceInfo,
      setCustomerForm,
      isAddCustomerOpen,
      openAddCustomer,
      closeAddCustomer,
      setVendorForm,
      isAddVendorOpen,
      openAddVendor,
      closeAddVendor,
      setTravellerForm,
      isAddTravellerOpen,
      openAddTraveller,
      closeAddTraveller,
      setCurrentStep,
      completeStep,
      setErrors,
      clearErrors,
      submitBooking,
      saveDraft,
      validateCustomer,
      validateVendor,
      resetBooking,
      loadDrafts,
      loadDraft,
      deleteDraft,
      searchDrafts,
      isFormValid,
      canProceedToNext,
      totalSteps,
      currentStepIndex,
    ]
  );

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// Hook to use booking context
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};

export default BookingContext;
