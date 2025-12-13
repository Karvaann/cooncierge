"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { LuEye } from "react-icons/lu";
import { CiSearch } from "react-icons/ci";
import { FiMinus } from "react-icons/fi";
import { GoPlus } from "react-icons/go";
import { useBooking } from "@/context/BookingContext";
import Fuse from "fuse.js";
import { getCustomers, getCustomerById } from "@/services/customerApi";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import { getVendorById } from "@/services/vendorApi";
import AddVendorSideSheet from "@/components/Sidesheets/AddVendorSideSheet";
import { getVendors } from "@/services/vendorApi";
import { getTeams } from "@/services/teamsApi";
import { getTravellers } from "@/services/travellerApi";
import DropDown from "@/components/DropDown";
import { getTravellerById } from "@/services/travellerApi";
import AddNewTravellerForm from "@/components/forms/AddNewForms/AddNewTravellerForm";
import { FiTrash2 } from "react-icons/fi";

// Type definitions
interface GeneralInfoFormData {
  customer: string;
  vendor: string;
  vendorName: string;
  adults: number;
  children: number;
  infants: number;
  childAges?: (number | null)[];
  adultTravellers: string[]; // Names for display
  infantTravellers: string[]; // Names for display
  adultTravellerIds: string[]; // IDs for backend
  infantTravellerIds: string[]; // IDs for backend
  bookingOwner: string;
  remarks: string;
}

interface CustomerDataType {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  tier?: string | number;
  firstname?: string;
  lastname?: string;
  alias?: string;
  dateOfBirth?: string;
  gstin?: string | number;
  companyName?: string;
  address?: string | number;
  remarks?: string;
  openingBalance?: string;
  balanceType?: "credit" | "debit";
}

interface VendorDataType {
  _id: string;
  id?: string;
  name?: string;
  contactPerson?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  tier?: string | number;
  firstname?: string;
  lastname?: string;
  alias?: string;
  countryCode?: string;
  dateOfBirth?: string;
  GSTIN?: string;
  address?: string;
  openingBalance?: string;
  balanceType?: "credit" | "debit";
  remarks?: string;
}

interface TeamDataType {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  username?: string;
}

interface TravellerDataType {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  tier?: string | number;
}

interface OwnerData {
  _id: string;
  name: string;
  email: string;
}

interface Segment {
  id: string;
  flightnumber: string;
  traveldate: string;
  cabinclass: string;
}

interface ExternalFormData {
  _id?: string;
  customId?: string;
  quotationType?: string;
  businessId?: {
    _id: string;
    businessName: string;
    businessType: string;
  };
  formFields?: {
    adultTravellers?: string[];
    infantTravellers?: string[];
    bookingOwner?: string;
    costprice?: string;
    sellingprice?: string;
    vendorName?: string;
    infants?: number;
    childAges?: (number | null)[];
    customerName?: string;
    ownerName?: string;
    bookingdate?: string;
    traveldate?: string;
    bookingstatus?: string;
    PNR?: string;
    segments?: Segment[];
    returnSegments?: Segment[];
    pnrEnabled?: boolean;
    samePNRForAllSegments?: boolean;
    flightType?: string;
    remarks?: string;
    adults?: number;
    children?: number;
    adultTravellerIds?: string[];
    infantTravellerIds?: string[];
  };
  totalAmount?: number;
  status?: string;
  owner?: OwnerData[];
  serviceStatus?: string;
  travelDate?: string;
  customerId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  vendorId?: {
    _id: string;
    companyName?: string;
    contactPerson?: string;
    email: string;
    phone: string;
  };
  travelers?: TravellerDataType[];
  adultTravlers?: number;
  childTravlers?: number;
  remarks?: string;
  isDeleted?: boolean;
  documents?: Array<{
    originalName: string;
    fileName: string;
    url: string;
    key: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
    _id: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  __owners?: string[];
  customer?: string;
  vendor?: string;
  adults?: number;
  children?: number;
  infants?: number;
  childAges?: (number | null)[];
  adultTravellers?: string[];
  infantTravellers?: string[];
  adultTravellerIds?: string[];
  infantTravellerIds?: string[];
  bookingOwner?: string;
  flightinfoform?: {
    bookingdate?: string;
    traveldate?: string;
    bookingstatus?: string;
    costprice?: string;
    sellingprice?: string;
    PNR?: string;
    segments?: Segment[];
    returnSegments?: Segment[];
    pnrEnabled?: boolean;
    samePNRForAllSegments?: boolean;
    flightType?: string;
    remarks?: string;
  };
}

// InputField component moved OUTSIDE of GeneralInfoForm to prevent re-creation on each render
interface InputFieldProps {
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  min?: number;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string | undefined;
  isValidating?: boolean;
  isValid?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  type = "text",
  placeholder,
  required,
  className = "",
  min,
  value,
  onChange,
  onBlur,
  disabled = false,
  hasError = false,
  errorMessage,
  isValidating = false,
  isValid = false,
}) => {
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        min={min}
        disabled={disabled || isValidating}
        className={`
          w-full border rounded-md px-3 py-2 pr-10 text-[0.75rem]  transition-colors hover:border-green-400 
          ${
            hasError
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-200 focus:ring-green-400"
          }

          ${disabled || isValidating ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      />

      {/* Validation indicator */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1 translate-y-[1px]">
        <CiSearch size={18} className="text-gray-400" />
        {isValidating && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        )}
        {/* {!isValidating && isValid && (
          <svg
            className="h-4 w-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )} */}
        {!isValidating && hasError && (
          <svg
            className="h-4 w-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
      <div className="">
        {hasError && errorMessage && (
          <p className="absolute -bottom-4 left-0 text-red-500 text-xs px-1">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

interface ValidationErrors {
  [key: string]: string;
}

interface GeneralInfoFormProps {
  initialFormData?: Partial<ExternalFormData>;
  onFormDataUpdate?: (data: Partial<GeneralInfoFormData>) => void;
  onSubmit?: (data: GeneralInfoFormData) => void;
  isSubmitting?: boolean;
  showValidation?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}

const GeneralInfoForm: React.FC<GeneralInfoFormProps> = ({
  initialFormData: externalFormData = {},
  onFormDataUpdate,
  onSubmit,
  isSubmitting = false,
  showValidation = true,
  formRef,
}) => {
  // Internal form state

  console.log("Initial External Form Data", externalFormData);

  const [formData, setFormData] = useState<GeneralInfoFormData>({
    customer: externalFormData?.customerId?._id || "",
    vendor: externalFormData?.vendorId?._id || "",
    vendorName:
      externalFormData?.vendorId?.contactPerson ||
      externalFormData?.vendorId?.companyName ||
      externalFormData?.formFields?.vendorName ||
      "",
    adults:
      externalFormData?.adults || externalFormData?.formFields?.adults || 1,
    children:
      externalFormData?.children || externalFormData?.formFields?.children || 1,
    infants:
      externalFormData?.infants || externalFormData?.formFields?.infants || 1,
    childAges:
      externalFormData?.childAges ||
      externalFormData?.formFields?.childAges ||
      [],
    adultTravellers: externalFormData?.formFields?.adultTravellers || [""], // Adult 1 (Lead Pax) - Names for display
    infantTravellers: externalFormData?.formFields?.infantTravellers || [""], // Names for display
    adultTravellerIds: externalFormData?.formFields?.adultTravellerIds || [""], // IDs for backend
    infantTravellerIds: externalFormData?.formFields?.infantTravellerIds || [
      "",
    ], // IDs for backend
    bookingOwner:
      externalFormData?.owner?.[0]?._id || externalFormData?.bookingOwner || "",
    remarks:
      externalFormData?.remarks || externalFormData?.formFields?.remarks || "",
  });

  // Sync initial form state to parent on mount
  useEffect(() => {
    onFormDataUpdate?.(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const {
    openAddCustomer,
    openAddVendor,
    openAddTraveller,
    lastAddedCustomer,
    lastAddedVendor,
    lastAddedTraveller,
    setLastAddedTraveller,
    travellerTarget,
    setTravellerTarget,
  } = useBooking();
  const [customerList, setCustomerList] = useState<
    { id: string; name: string }[]
  >([{ id: "", name: "" }]);

  const [vendorList, setVendorList] = useState<{ id: string; name: string }[]>([
    { id: "", name: "" },
  ]);

  // const [vendorData, setVendorData] = useState<{ id: string; name: string }>({
  //   id: "",
  //   name: "",
  // });

  // Search data states
  const [allCustomers, setAllCustomers] = useState<CustomerDataType[]>([]);
  const [allVendors, setAllVendors] = useState<VendorDataType[]>([]);
  const [allTeams, setAllTeams] = useState<TeamDataType[]>([]);
  const [allTravellers, setAllTravellers] = useState<TravellerDataType[]>([]);

  const [customerResults, setCustomerResults] = useState<CustomerDataType[]>(
    []
  );
  const [vendorResults, setVendorResults] = useState<VendorDataType[]>([]);
  const [TeamsResults, setTeamsResults] = useState<TeamDataType[]>([]);
  const [travellerResults, setTravellerResults] = useState<TravellerDataType[]>(
    []
  );

  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Track which traveller input is showing dropdown: { type: 'adultTravellers' | 'infantTravellers', index: number } | null
  const [activeTravellerDropdown, setActiveTravellerDropdown] = useState<{
    type: "adultTravellers" | "infantTravellers";
    index: number;
  } | null>(null);

  const [activeCustomerIndex, setActiveCustomerIndex] = useState<number | null>(
    null
  );

  const [ownerList, setOwnerList] = useState<{ id: string; name: string }[]>([
    { id: "", name: "" },
  ]);

  // View customer sidesheet state
  const [isViewCustomerOpen, setIsViewCustomerOpen] = useState(false);
  const [viewCustomerData, setViewCustomerData] =
    useState<CustomerDataType | null>(null);
  // View vendor sidesheet state
  const [isViewVendorOpen, setIsViewVendorOpen] = useState(false);
  const [viewVendorData, setViewVendorData] = useState<VendorDataType | null>(
    null
  );
  // View traveller sidesheet state
  const [isViewTravellerOpen, setIsViewTravellerOpen] = useState(false);
  const [viewTravellerData, setViewTravellerData] =
    useState<TravellerDataType | null>(null);

  // Add refs for click-outside detection
  const customerRef = useRef<HTMLDivElement | null>(null);
  const vendorRef = useRef<HTMLDivElement | null>(null);
  const teamsRef = useRef<HTMLDivElement | null>(null);
  const travellerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Node;

      const isInCustomer = customerRef.current?.contains(target);
      const isInVendor = vendorRef.current?.contains(target);
      const isInTeams = teamsRef.current?.contains(target);

      // Check if click is inside any traveller dropdown
      let isInTraveller = false;
      travellerRefs.current.forEach((ref) => {
        if (ref?.contains(target)) {
          isInTraveller = true;
        }
      });

      if (!isInCustomer) {
        setShowCustomerDropdown(false);
        setActiveCustomerIndex(null);
      }
      if (!isInVendor) {
        setShowVendorDropdown(false);
      }
      if (!isInTeams) {
        setShowTeamsDropdown(false);
      }
      if (!isInTraveller) {
        setActiveTravellerDropdown(null);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCustomerDropdown(false);
        setActiveCustomerIndex(null);
        setShowVendorDropdown(false);
        setShowTeamsDropdown(false);
        setActiveTravellerDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Handler to open view sidesheet for customer
  const handleViewCustomer = async (index: number) => {
    const idFromList = customerList[index]?.id;
    const id = idFromList || (formData.customer as string) || "";
    if (!id) return;

    // Try local cache first
    let cust = allCustomers.find((c) => c._id === id || c.id === id);
    if (!cust) {
      try {
        cust = await getCustomerById(id);
      } catch (err) {
        console.error("Failed to fetch customer for view:", err);
        return;
      }
    }

    setViewCustomerData(cust || null);
    setIsViewCustomerOpen(true);
  };

  // Handler to open view sidesheet for vendor
  const handleViewVendor = async () => {
    // vendorList[0] is used as single vendor selection in this form
    const idFromList = vendorList?.[0]?.id;
    const id = idFromList || (formData.vendor as string) || "";
    if (!id) return;

    let vendor = allVendors.find((v) => v._id === id || v.id === id);
    if (!vendor) {
      try {
        vendor = await getVendorById(id);
      } catch (err) {
        console.error("Failed to fetch vendor for view:", err);
        return;
      }
    }

    setViewVendorData(vendor || null);
    setIsViewVendorOpen(true);
  };

  // Handler to open view sidesheet for traveller
  const handleViewTraveller = async (
    type: "adultTravellers" | "infantTravellers",
    index: number
  ) => {
    const idsArray =
      type === "adultTravellers"
        ? formData.adultTravellerIds
        : formData.infantTravellerIds;
    const nameArray = formData[type];

    const idFromState = idsArray?.[index];
    const nameFromState = nameArray?.[index] || "";

    let traveller: TravellerDataType | undefined = undefined;

    // Try cached list first (match by id or name)
    if (idFromState) {
      traveller = allTravellers.find(
        (t) => t._id === idFromState || t.id === idFromState
      );
    }

    if (!traveller && nameFromState) {
      traveller = allTravellers.find(
        (t) => t.name === nameFromState || t.email === nameFromState
      );
    }

    if (!traveller && idFromState) {
      try {
        traveller = await getTravellerById(idFromState);
      } catch (err) {
        console.error("Failed to fetch traveller by id:", err);
        return;
      }
    }

    if (!traveller) {
      // nothing to view
      return;
    }

    setViewTravellerData(traveller || null);
    setIsViewTravellerOpen(true);
  };

  const handleDeleteFile = (index: number) => {
    const newFiles = [...attachedFiles];
    newFiles.splice(index, 1);
    setAttachedFiles(newFiles);
  };

  // Fetch all customers, vendors, Teamss on mount
  useEffect(() => {
    const fetchLists = async () => {
      try {
        console.log(
          "[GeneralInfoForm] Fetching lists: customers, vendors, teams"
        );
        const [cRes, travellerRes, vRes, tRes] = await Promise.all([
          getCustomers(),
          getTravellers(),
          getVendors(),
          getTeams(),
        ]);

        setAllCustomers(cRes || []);
        setAllVendors(vRes || []);
        setAllTeams(tRes || []);
        setAllTravellers(travellerRes || []);
      } catch (err) {
        console.error("[GeneralInfoForm] Failed loading lists", err);
      }
    };

    fetchLists();
  }, []);

  // Hydrate owner from externalFormData
  useEffect(() => {
    if (!externalFormData?.bookingOwner && !externalFormData?.owner?.[0])
      return;
    if (!Array.isArray(allTeams) || allTeams.length === 0) return;

    const ownerId =
      externalFormData.owner?.[0]?._id || externalFormData.bookingOwner || "";
    if (ownerId && externalFormData.owner?.[0]) {
      const match = allTeams.find((t) => t._id === ownerId);
      if (match) {
        setOwnerList([{ id: match._id, name: match.name }]);
      } else if (externalFormData.owner[0].name) {
        // If we can't find in teams, use the name from external data
        setOwnerList([{ id: ownerId, name: externalFormData.owner[0].name }]);
      }
    }
  }, [externalFormData?.bookingOwner, externalFormData?.owner, allTeams]);

  // Hydrate vendor from externalFormData
  useEffect(() => {
    if (!externalFormData?.vendorId) return;
    if (!Array.isArray(allVendors) || allVendors.length === 0) return;

    const match = allVendors.find(
      (v) => v._id === externalFormData.vendorId?._id
    );
    if (match) {
      setVendorList([
        { id: match._id, name: match.contactPerson || match.companyName || "" },
      ]);
    } else if (
      externalFormData.vendorId.contactPerson ||
      externalFormData.vendorId.companyName
    ) {
      // If we can't find in vendors, use the name from external data
      setVendorList([
        {
          id: externalFormData.vendorId._id,
          name:
            externalFormData.vendorId.contactPerson ||
            externalFormData.vendorId.companyName ||
            "",
        },
      ]);
    }
  }, [externalFormData?.vendorId, allVendors]);

  // Hydrate customer from externalFormData
  useEffect(() => {
    if (!externalFormData?.customerId) return;
    if (!Array.isArray(allCustomers) || allCustomers.length === 0) return;

    const match = allCustomers.find(
      (c) => c._id === externalFormData.customerId?._id
    );
    if (match) {
      setCustomerList([{ id: match._id, name: match.name }]);
    } else if (externalFormData.customerId.name) {
      // If we can't find in customers, use the name from external data
      setCustomerList([
        {
          id: externalFormData.customerId._id,
          name: externalFormData.customerId.name,
        },
      ]);
    }
  }, [externalFormData?.customerId, allCustomers]);

  // Hydrate travellers from externalFormData
  useEffect(() => {
    if (
      !externalFormData?.travelers ||
      !Array.isArray(externalFormData.travelers)
    )
      return;

    // Process adult travellers
    if (externalFormData.travelers.length > 0) {
      const adultNames = externalFormData.travelers.map(
        (traveller: TravellerDataType) => traveller.name || ""
      );
      const adultIds = externalFormData.travelers.map(
        (traveller: TravellerDataType) => traveller._id || ""
      );

      setFormData((prev) => ({
        ...prev,
        adultTravellers: adultNames,
        adultTravellerIds: adultIds,
      }));
    }
  }, [externalFormData?.travelers]);

  // Fuzzy search helper
  const runFuzzySearch = <T,>(
    list: T[],
    term: string,
    keys: (keyof T)[]
  ): T[] => {
    if (!term.trim()) return [];

    const fuse = new Fuse(list, {
      threshold: 0.3,
      keys: keys as string[],
    });

    return fuse.search(term).map((r) => r.item);
  };

  // useEffect(() => {
  //   if (!externalFormData?.vendor) return;
  //   if (!Array.isArray(allVendors) || allVendors.length === 0) return;

  //   const match = allVendors.find((v) => v._id === externalFormData.vendor);
  //   if (match) {
  //     setVendorData({ id: match._id, name: match.name });
  //   }
  // }, [externalFormData?.vendor, allVendors]);

  // when adults change
  useEffect(() => {
    setFormData((prev) => {
      const adults = [...prev.adultTravellers];
      const adultIds = [...prev.adultTravellerIds];

      // always at least 1 adult input
      if (adults.length === 0) adults.push("");
      if (adultIds.length === 0) adultIds.push("");

      while (adults.length < prev.adults) {
        adults.push("");
        adultIds.push("");
      }
      while (adults.length > prev.adults && adults.length > 1) {
        adults.pop();
        adultIds.pop();
      }

      return { ...prev, adultTravellers: adults, adultTravellerIds: adultIds };
    });
  }, [formData.adults]);

  useEffect(() => {
    setFormData((prev) => {
      const infants = [...prev.infantTravellers];
      const infantIds = [...prev.infantTravellerIds];

      // always at least one infant input
      if (infants.length === 0) infants.push("");
      if (infantIds.length === 0) infantIds.push("");

      while (infants.length < prev.infants) {
        infants.push("");
        infantIds.push("");
      }
      while (infants.length > prev.infants && infants.length > 1) {
        infants.pop();
        infantIds.pop();
      }

      return {
        ...prev,
        infantTravellers: infants,
        infantTravellerIds: infantIds,
      };
    });
  }, [formData.infants]);

  // Sync childAges array with infants count, defaulting to null (no selection)
  useEffect(() => {
    setFormData((prev) => {
      const ages = [...(prev.childAges || [])];

      if (ages.length === 0) ages.push(null);

      while (ages.length < prev.infants) ages.push(null);
      while (ages.length > prev.infants && ages.length > 1) ages.pop();

      return { ...prev, childAges: ages };
    });
  }, [formData.infants]);

  const addCustomerField = () => {
    setCustomerList([...customerList, { id: "", name: "" }]);
  };

  const removeCustomerField = (index: number) => {
    setCustomerList(customerList.filter((_, i) => i !== index));
  };

  // update customer field from customer array
  const updateCustomerField = (
    index: number,
    data: { id: string; name: string }
  ) => {
    const updated = [...customerList];
    updated[index] = data;
    setCustomerList(updated);

    // Sync to main form
    if (index === 0) {
      setFormData((prev) => ({ ...prev, customer: data.id })); // VALIDATION USES ID
    }
  };

  // update traveller field from traveller array
  const updateTraveller = (
    type: "adultTravellers" | "infantTravellers",
    index: number,
    value: string,
    id?: string // Optional ID - if provided, also update the ID array
  ) => {
    const updated = [...formData[type]];
    updated[index] = value;

    const idType =
      type === "adultTravellers" ? "adultTravellerIds" : "infantTravellerIds";
    const updatedIds = [...formData[idType]];
    if (id !== undefined) {
      updatedIds[index] = id;
    } else {
      // If no ID provided (user typing), clear the ID
      updatedIds[index] = "";
    }

    const newFormData = { ...formData, [type]: updated, [idType]: updatedIds };
    setFormData(newFormData);
    onFormDataUpdate?.(newFormData);
  };

  const clearField = (fieldName: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: "" }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setTouched((prev) => ({ ...prev, [fieldName]: false }));
  };

  // Hydrate UI when a new customer is created via sidesheet
  useEffect(() => {
    if (!lastAddedCustomer) return;
    // Update first customer field with new entry
    setCustomerList((prev) => {
      const next = [...prev];
      next[0] = { id: lastAddedCustomer.id, name: lastAddedCustomer.name };
      return next;
    });
    const newFormData = { ...formData, customer: lastAddedCustomer.id };
    setFormData(newFormData);
    onFormDataUpdate?.(newFormData);
    // Clear any error on customer field
    setErrors((prev) => ({ ...prev, customer: "" }));
  }, [lastAddedCustomer]);

  // Hydrate UI when a new vendor is created via sidesheet
  useEffect(() => {
    if (!lastAddedVendor) return;
    setVendorList([{ id: lastAddedVendor.id, name: lastAddedVendor.name }]);
    const newFormData = { ...formData, vendor: lastAddedVendor.id };
    setFormData(newFormData);
    onFormDataUpdate?.(newFormData);
    setErrors((prev) => ({ ...prev, vendor: "" }));
  }, [lastAddedVendor]);

  // Hydrate UI when a new traveller is created via sidesheet
  useEffect(() => {
    if (!lastAddedTraveller || !travellerTarget) return;
    const name = lastAddedTraveller.name || "";
    const id = lastAddedTraveller.id || "";
    if (!name) return;

    setFormData((prev) => {
      let newFormData;
      if (travellerTarget.type === "adultTravellers") {
        const adults = [...prev.adultTravellers];
        const adultIds = [...prev.adultTravellerIds];
        adults[travellerTarget.index] = name;
        adultIds[travellerTarget.index] = id;
        newFormData = {
          ...prev,
          adultTravellers: adults,
          adultTravellerIds: adultIds,
        };
      } else {
        const infants = [...prev.infantTravellers];
        const infantIds = [...prev.infantTravellerIds];
        infants[travellerTarget.index] = name;
        infantIds[travellerTarget.index] = id;
        newFormData = {
          ...prev,
          infantTravellers: infants,
          infantTravellerIds: infantIds,
        };
      }
      onFormDataUpdate?.(newFormData);
      return newFormData;
    });

    setErrors((prev) => ({ ...prev, traveller1: "" }));
    setLastAddedTraveller(null);
    setTravellerTarget(null);
  }, [
    lastAddedTraveller,
    travellerTarget,
    setLastAddedTraveller,
    setTravellerTarget,
  ]);
  const getFieldValue = (fieldName: string, overrideValue?: string) => {
    if (overrideValue !== undefined) return overrideValue;
    return formData[fieldName as keyof GeneralInfoFormData] ?? "";
  };

  // clearInput() helper
  const clearInput = (
    fieldName: string,
    overrideHandler?: (value: string) => void
  ) => {
    if (overrideHandler) {
      overrideHandler("");
    } else {
      clearField(fieldName);
    }
  };

  const RightSideIcons: React.FC<{
    fieldName: string;
    value?: string | undefined; // override value
    overrideSetter?: (val: string) => void;
    onClickPlus?: () => void; // for add customer/vendor modal
    onClickView?: () => void;
  }> = ({ fieldName, value, overrideSetter, onClickPlus, onClickView }) => {
    const actualValue = getFieldValue(fieldName, value);
    const valueString = String(actualValue ?? "");
    const isEmpty = valueString.trim() === "";

    return (
      <div className="flex items-center gap-2 ml-auto">
        {isEmpty && (
          <button
            type="button"
            onClick={onClickPlus}
            className="w-6.5 h-6.5 flex items-center bg-[#414141] justify-center rounded-md transition-colors"
          >
            <GoPlus size={16} className="text-white" />
          </button>
        )}

        {/* EYE and MINUS when value exists */}
        {!isEmpty && (
          <>
            <button
              type="button"
              onClick={onClickView}
              className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <LuEye size={17} className="text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => clearInput(fieldName, overrideSetter)}
              className="w-6.5 h-6.5 flex items-center justify-center bg-[#414141] rounded-md cursor-pointer transition-colors"
            >
              <FiMinus size={16} className="text-white" />
            </button>
          </>
        )}
      </div>
    );
  };

  // Get validation functions from booking context
  const { validateCustomer, validateVendor } = useBooking();

  // Validation rules
  const validationRules = useMemo(
    () => ({
      // customer: {
      //   required: true,
      //   message: "Customer name is required",
      // },
      // vendor: {
      //   required: true,
      //   message: "Vendor name is required",
      // },

      adults: {
        required: true,
        minLength: 1,
        message: "At least 1 adult is required",
      },
      traveller1: {
        required: true,
        minLength: 2,
        message: "Lead passenger name is required",
      },
      // bookingOwner: {
      //   required: true,
      //   message: "Booking owner is required",
      // },
    }),
    []
  );

  // Enhanced validation function using API validation
  const validateField = useCallback(
    (name: string, value: unknown): string => {
      // Use API validation for comprehensive checks
      // if (name === "customer" || name === "vendor") {
      //   const apiErrors = validateGeneralInfo({ [name]: value });
      //   return apiErrors[name] || "";
      // }

      const rule = validationRules[name as keyof typeof validationRules];
      if (!rule) return "";

      if (
        rule.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        return rule.message;
      }

      // if (
      //   rule.minLength &&
      //   typeof value === "string" &&
      //   value.length < rule.minLength
      // ) {
      //   return rule.message;
      // }

      // if (
      //   rule.minLength &&
      //   typeof value === "number" &&
      //   value < rule.minLength
      // ) {
      //   return rule.message;
      // }

      return "";
    },
    [validationRules]
  );

  // Customer validation handler
  // const handleCustomerValidation = useCallback(
  //   async (customerId: string) => {
  //     if (!customerId.trim()) return;

  //     setValidatingCustomer(true);
  //     try {
  //       const isValid = await validateCustomer(customerId);
  //       if (!isValid) {
  //         setErrors((prev) => ({
  //           ...prev,
  //           customer: "Customer not found or invalid",
  //         }));
  //       } else {
  //         setErrors((prev) => ({ ...prev, customer: "" }));
  //       }
  //     } catch (error) {
  //       setErrors((prev) => ({
  //         ...prev,
  //         customer: "Error validating customer",
  //       }));
  //     } finally {
  //       setValidatingCustomer(false);
  //     }
  //   },
  //   [validateCustomer]
  // );

  // Vendor validation handler
  // const handleVendorValidation = useCallback(
  //   async (vendorId: string) => {
  //     if (!vendorId.trim()) return;

  //     setValidatingVendor(true);
  //     try {
  //       const isValid = await validateVendor(vendorId);
  //       if (!isValid) {
  //         setErrors((prev) => ({
  //           ...prev,
  //           vendor: "Vendor not found or invalid",
  //         }));
  //       } else {
  //         setErrors((prev) => ({ ...prev, vendor: "" }));
  //       }
  //     } catch (error) {
  //       setErrors((prev) => ({ ...prev, vendor: "Error validating vendor" }));
  //     } finally {
  //       setValidatingVendor(false);
  //     }
  //   },
  //   [validateVendor]
  // );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        formData[fieldName as keyof GeneralInfoFormData]
      );
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField, validationRules]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const processedValue = type === "number" ? value : value;

    // build next state from current formData
    if (name !== "vendor") {
      const next = { ...formData, [name]: processedValue };
      setFormData(next);
      onFormDataUpdate?.(next);
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Enhanced blur handler with API validation
  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (showValidation) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));

        // Trigger API validation for customer and vendor
        // if (name === "customer" && value.trim()) {
        //   const custId = customerList?.[0]?.id?.trim() ?? "";
        //   if (custId) {
        //     await handleCustomerValidation(custId);
        //   }
        // } else if (name === "vendor" && value.trim()) {
        //   if (vendorData.id.trim()) {
        //     await handleVendorValidation(vendorData.id);
        //   }
        // }
      }

      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [validateField, showValidation, customerList]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (validateForm()) {
        onSubmit?.(formData);
      } else {
        // Mark all fields as touched to show validation errors
        const allTouched = Object.keys(validationRules).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setTouched(allTouched);
      }
    },
    [formData, validateForm, onSubmit, validationRules]
  );

  // Sync with external form data
  useEffect(() => {
    if (externalFormData && Object.keys(externalFormData).length > 0) {
      setFormData((prev) => ({ ...prev, ...externalFormData }));
    }
  }, [externalFormData]);

  // Memoized traveller count
  const totalTravellers = useMemo(
    () => formData.adults + formData.children + formData.infants,
    [formData.adults, formData.children, formData.infants]
  );

  // Helper to get input field props
  const getInputProps = (
    name: keyof GeneralInfoFormData,
    options?: {
      value?: string | number;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      skipValidation?: boolean;
    }
  ) => {
    const fieldValue =
      options?.value !== undefined ? options.value : formData[name];
    const hasError = !!(errors[name] && touched[name]);
    const hasValue = formData[name] && String(formData[name]).trim();
    const isValid = !options?.skipValidation && !!hasValue && !hasError;

    return {
      value: fieldValue as string | number,
      onChange: options?.onChange || handleChange,
      onBlur: handleBlur,
      disabled: isSubmitting,
      hasError,
      errorMessage: errors[name],
      isValid,
    };
  };

  return (
    <form
      ref={formRef}
      className="space-y-4 p-4"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Customer Section */}
      <div className="border border-gray-200 rounded-[12px] p-3">
        <h2 className="text-[0.75rem] font-medium mb-2">Billed To</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />

        {customerList.map((customer, index) => (
          <div key={index} className="mb-4">
            <div className="flex items-center gap-2 mt-3">
              <label className="text-[0.75rem] font-medium text-gray-700">
                <span className="text-red-500">*</span> Customer
              </label>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeCustomerField(index)}
                  className="w-4 h-4 mb-1 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <FiMinus size={14} className="text-black" />
                </button>
              )}
            </div>

            <div className="flex items-center mt-1 w-full">
              <div className="w-[30rem] relative" ref={customerRef}>
                <InputField
                  name="customer"
                  placeholder="Search by Customer Name/ID"
                  required
                  className="w-full text-[0.75rem] py-2"
                  type="text"
                  {...getInputProps("customer", {
                    value: customerList[index]?.name ?? "", // SHOW NAME
                    onChange: (e) => {
                      const value = e.target.value;

                      // Update name only, ID stays same until selected from dropdown
                      updateCustomerField(index, {
                        id: customerList[index]?.id ?? "",
                        name: value,
                      });

                      // IF FIELD CLEARED then also clear stored value so validation becomes empty
                      if (value.trim() === "") {
                        const newFormData = {
                          ...formData,
                          customer: "",
                          customerName: "",
                        };
                        setFormData(newFormData);
                        onFormDataUpdate?.(newFormData);
                      } else {
                        // Update customerName for draft display
                        const newFormData = {
                          ...formData,
                          customerName: value,
                        };
                        setFormData(newFormData);
                        onFormDataUpdate?.(newFormData);
                      }

                      const results = runFuzzySearch(allCustomers, value, [
                        "name",
                        "email",
                        "phone",
                      ]);
                      setCustomerResults(results);
                      setShowCustomerDropdown(true);
                      setActiveCustomerIndex(index);
                    },
                  })}
                />

                {activeCustomerIndex === index && showCustomerDropdown && (
                  <div className="absolute bg-white border border-gray-200 rounded-md w-[30rem] max-h-60 mt-1 overflow-y-auto shadow-md z-50">
                    {customerResults.map((cust) => {
                      // derive numeric rating (1-5) from cust.tier if available
                      let rating = 4;
                      try {
                        if (cust?.tier) {
                          if (typeof cust.tier === "string") {
                            const match = cust.tier.match(/\d+/);
                            if (match) rating = Number(match[0]);
                          } else if (typeof cust.tier === "number") {
                            rating = Math.round(cust.tier);
                          }
                        }
                      } catch (e) {
                        rating = 4;
                      }
                      rating = Math.min(Math.max(rating || 4, 1), 5);
                      const alias =
                        (cust as any)?.alias || (cust as any)?.nickname || "";

                      return (
                        <div
                          key={cust._id}
                          className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                          onClick={() => {
                            updateCustomerField(index, {
                              id: cust._id,
                              name: cust.name,
                            });
                            setActiveCustomerIndex(null);
                            // Sync main form and notify parent with both ID and name
                            const newFormData = {
                              ...formData,
                              customer: cust._id,
                              customerName: cust.name,
                            };
                            setFormData(newFormData);
                            onFormDataUpdate?.(newFormData);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <p className="font-medium text-[0.75rem] text-gray-900">
                                {cust.name}
                              </p>
                              <span className="text-gray-300">|</span>
                              <p className="text-[0.70rem] text-gray-600 truncate">
                                {alias || "-"}
                              </p>
                              <span className="text-gray-300">|</span>
                              <p className="text-[0.70rem] text-gray-600 truncate">
                                {cust._id}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <img
                                src={`/icons/tier-${rating}.png`}
                                alt={`Tier ${rating}`}
                                className="w-4 h-4 object-contain"
                              />
                              <span className="text-[0.75rem] font-semibold text-gray-700">
                                {rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Staple option */}
                    {/* <div
                      className="p-2 cursor-pointer bg-[#f9f9f9] hover:bg-gray-100 border-t border-gray-200 rounded-b-md"
                      onClick={() => {
                        updateCustomerField(index, { id: "", name: "TBA" });
                        setFormData((prev) => ({ ...prev, customer: "" }));
                        setActiveCustomerIndex(null);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <p className="font-medium text-[0.70rem] text-gray-700">
                        Don't have the name? Enter TBA
                      </p>
                    </div> */}
                  </div>
                )}
              </div>

              <RightSideIcons
                fieldName="customer"
                value={customerList[index]?.name ?? ""}
                overrideSetter={(val: string) =>
                  updateCustomerField(index, {
                    id: customerList[index]?.id ?? "",
                    name: val,
                  })
                }
                onClickPlus={openAddCustomer}
                onClickView={() => handleViewCustomer(index)}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Vendor Section */}
      <div className="border border-gray-200 rounded-[12px] px-3 py-4">
        <h2 className="text-[0.75rem]  font-medium mb-2">Vendors</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />

        <label className="block text-[0.75rem] mt-3 font-medium text-gray-700 mb-1">
          <span className="text-red-500">*</span> Vendor
        </label>

        <div className="flex items-center gap-2">
          <div className="w-[30rem] relative" ref={vendorRef}>
            <InputField
              name="vendor"
              placeholder="Search by Vendor Name/ID"
              required
              className="w-full text-[0.75rem] py-2"
              value={vendorList[0]?.name ?? ""}
              onChange={(e) => {
                const value = e.target.value;

                // Update vendor name only
                setVendorList([{ id: "", name: value }]);

                // clear actual vendor ID but keep the name for draft display
                const newFormData = {
                  ...formData,
                  vendor: "",
                  vendorName: value,
                };
                setFormData(newFormData);
                onFormDataUpdate?.(newFormData);

                const results = runFuzzySearch(allVendors, value, [
                  "name",
                  "contactPerson",
                  "email",
                ]);
                setVendorResults(results);

                setShowVendorDropdown(true);
              }}
              onBlur={handleBlur}
            />

            {showVendorDropdown && (
              <div className="absolute bg-white border border-gray-200 rounded-md w-[30rem] mt-1 max-h-60 overflow-y-auto shadow-md z-50">
                {vendorResults.map((v) => {
                  // derive rating only if tier present
                  let rating: number | null = null;
                  try {
                    if (v?.tier) {
                      if (typeof v.tier === "string") {
                        const m = v.tier.match(/\d+/);
                        if (m) rating = Number(m[0]);
                      } else if (typeof v.tier === "number") {
                        rating = Math.round(v.tier);
                      }
                    }
                  } catch (e) {
                    rating = null;
                  }
                  if (rating !== null)
                    rating = Math.min(Math.max(rating, 1), 5);
                  const alias = (v as any)?.alias || (v as any)?.nickname || "";

                  return (
                    <div
                      key={v._id}
                      className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                      onClick={() => {
                        setShowVendorDropdown(false);
                        setVendorList([
                          { id: v._id, name: v.name ?? v.contactPerson ?? "" },
                        ]);
                        const newFormData = {
                          ...formData,
                          vendor: v._id,
                          vendorName: v.name ?? v.contactPerson ?? "",
                        };
                        setFormData(newFormData);
                        onFormDataUpdate?.(newFormData);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <p className="font-normal text-[0.75rem] text-gray-900">
                            {v.name || v.contactPerson}
                          </p>
                          <span className="text-gray-300">|</span>
                          <p className="text-[0.70rem] text-gray-600 truncate">
                            {alias || "-"}
                          </p>
                          <span className="text-gray-300">|</span>
                          <p className="text-[0.70rem] text-gray-600 truncate">
                            {v._id}
                          </p>
                        </div>

                        {rating !== null ? (
                          <div className="flex items-center gap-1">
                            <img
                              src={`/icons/tier-${rating}.png`}
                              alt={`Tier ${rating}`}
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-[0.75rem] font-semibold text-gray-700">
                              {rating}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {/* Staple option */}
                {/* <div
                  className="p-2 cursor-pointer bg-[#f9f9f9] hover:bg-gray-100 border-t border-gray-200 rounded-b-md"
                  onClick={() => {
                    setVendorList([{ id: "", name: "TBA" }]);
                    setFormData((prev) => ({ ...prev, vendor: "" }));
                    setShowVendorDropdown(false);
                  }}
                >
                  <p className="font-medium text-[0.70rem] text-gray-700">
                    Don't have the name? Enter TBA
                  </p>
                </div> */}
              </div>
            )}
          </div>

          <RightSideIcons
            fieldName="vendor"
            value={vendorList[0]?.name ?? ""}
            overrideSetter={(val) => setVendorList([{ id: "", name: val }])}
            onClickPlus={openAddVendor}
            onClickView={() => handleViewVendor()}
          />
        </div>
      </div>

      {/* Travellers Counter Section */}
      <div className="border border-gray-200 rounded-xl p-3">
        <h2 className="text-[0.75rem]  font-medium mb-1">Travellers</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />

        <div className="flex gap-6 mb-4 mt-3 ">
          <div className="flex flex-col items-center">
            <label className="block text-xs text-black mb-1">Adults</label>
            <div className="flex items-center border border-black rounded-lg px-2 py-1">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    adults: Math.max(1, formData.adults - 1),
                  })
                }
                className="px-1 text-lg font-semibold"
              >
                <FiMinus size={12} />
              </button>
              <span className="px-2 text-[0.75rem] ">{formData.adults}</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, adults: formData.adults + 1 })
                }
                className="px-1 text-lg font-semibold"
              >
                <GoPlus size={12} />
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <label className="block text-xs text-black mb-1">Children</label>
            <div className="flex items-center border border-black rounded-lg px-2 py-1">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    children: Math.max(1, formData.children - 1),
                  })
                }
                className="px-1 text-lg font-semibold"
              >
                <FiMinus size={12} />
              </button>
              <span className="px-2 text-[0.75rem] ">{formData.children}</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, children: formData.children + 1 })
                }
                className="px-1 text-lg font-semibold"
              >
                <GoPlus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Traveller Details */}
        <div className="mt-4 space-y-4">
          <label className="block text-[0.75rem] mt-3 font-medium text-gray-700 mb-1">
            <span className="text-red-500">*</span> Adult
          </label>

          {formData.adultTravellers.map((trav, index) => (
            <div key={index} className="flex items-center gap-2 my-2">
              <div
                className="w-[30rem] relative"
                ref={(el) => {
                  travellerRefs.current.set(`adult-${index}`, el);
                }}
              >
                <InputField
                  name="adultTravellers"
                  placeholder={`Adult ${index + 1}`}
                  required={index === 0}
                  {...getInputProps("adultTravellers", {
                    value: trav,
                    onChange: (e) => {
                      const value = e.target.value;
                      updateTraveller("adultTravellers", index, value);

                      // Run fuzzy search
                      const results = runFuzzySearch(allTravellers, value, [
                        "name",
                        "email",
                        "phone",
                      ]);
                      setTravellerResults(results);
                      setActiveTravellerDropdown({
                        type: "adultTravellers",
                        index,
                      });
                    },
                    skipValidation: true,
                  })}
                />

                {/* Traveller Dropdown */}
                {activeTravellerDropdown?.type === "adultTravellers" &&
                  activeTravellerDropdown?.index === index &&
                  travellerResults.length > 0 && (
                    <div className="absolute bg-white border border-gray-200 rounded-md w-full mt-1 max-h-60 overflow-y-auto shadow-md z-50">
                      {travellerResults.map((t: TravellerDataType) => (
                        <div
                          key={t._id}
                          className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                          onClick={() => {
                            updateTraveller(
                              "adultTravellers",
                              index,
                              t.name,
                              t._id
                            );
                            setActiveTravellerDropdown(null);
                            setTravellerResults([]);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <p className="font-normal text-[0.75rem] text-gray-900">
                                {t.name}
                              </p>
                              <span className="text-gray-300">|</span>
                              <p className="text-[0.70rem] text-gray-600 truncate">
                                {t._id}
                              </p>
                            </div>

                            {/* show rating only when available */}
                            {(() => {
                              let rating: number | null = null;
                              try {
                                if (t?.tier) {
                                  if (typeof t.tier === "string") {
                                    const m = t.tier.match(/\d+/);
                                    if (m) rating = Number(m[0]);
                                  } else if (typeof t.tier === "number") {
                                    rating = Math.round(t.tier);
                                  }
                                }
                              } catch (e) {
                                rating = null;
                              }
                              if (rating !== null) {
                                rating = Math.min(Math.max(rating, 1), 5);
                                return (
                                  <div className="flex items-center gap-1">
                                    <img
                                      src={`/icons/tier-${rating}.png`}
                                      alt={`Tier ${rating}`}
                                      className="w-4 h-4 object-contain"
                                    />
                                    <span className="text-[0.75rem] font-semibold text-gray-700">
                                      {rating}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ))}
                      {/* Staple option */}
                      <div
                        className="p-2 cursor-pointer bg-[#f9f9f9] hover:bg-gray-100 border-t border-gray-200 rounded-b-md"
                        onClick={() => {
                          // Set this traveller to TBA (To Be Announced)
                          updateTraveller("adultTravellers", index, "TBA");
                          setActiveTravellerDropdown(null);
                          setTravellerResults([]);
                        }}
                      >
                        <p className="font-medium text-[0.70rem] text-gray-700">
                          Don&apos;t have the name? Enter TBA
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              <RightSideIcons
                fieldName="adultTravellers"
                value={trav}
                overrideSetter={(val) =>
                  updateTraveller("adultTravellers", index, val)
                }
                onClickPlus={() =>
                  openAddTraveller({ type: "adultTravellers", index })
                }
                onClickView={() =>
                  handleViewTraveller("adultTravellers", index)
                }
              />
            </div>
          ))}

          {formData.infantTravellers.map((trav, index) => (
            <div key={index} className="mb-6">
              {/* LABEL and AGE DROPDOWN IN ONE ROW */}
              <div className="flex items-center justify-between pr-65 mb-1">
                {/* Children label only for first row */}
                <label className="text-[0.75rem] font-medium text-gray-700">
                  <span className="text-red-500">*</span>{" "}
                  {/* {index === 0 ? "Children" : ""} */}
                  Children
                </label>

                {/* Select age dropdown */}
                <DropDown
                  options={Array.from({ length: 10 }, (_, i) => ({
                    value: String(i + 1),
                    label: String(i + 1),
                  }))}
                  placeholder="Select Age"
                  value={formData.childAges?.[index]?.toString() ?? ""}
                  onChange={(val) => {
                    const numVal = val === "" ? null : Number(val);
                    setFormData((prev) => {
                      const ages = [...(prev.childAges || [])];
                      ages[index] = numVal;
                      return { ...prev, childAges: ages };
                    });
                  }}
                  className="mb-2"
                  customWidth="w-[8rem]"
                />
              </div>

              {/* CHILD INPUT */}
              <div className="flex items-center gap-2">
                <div
                  className="w-[30rem] relative"
                  ref={(el) => {
                    travellerRefs.current.set(`infant-${index}`, el);
                  }}
                >
                  <InputField
                    name="infantTravellers"
                    placeholder={`Child ${index + 1}`}
                    required={index === 0}
                    {...getInputProps("infantTravellers", {
                      value: trav,
                      onChange: (e) => {
                        const value = e.target.value;
                        updateTraveller("infantTravellers", index, value);

                        // Run fuzzy search
                        const results = runFuzzySearch(allTravellers, value, [
                          "name",
                          "email",
                          "phone",
                        ]);
                        setTravellerResults(results);
                        setActiveTravellerDropdown({
                          type: "infantTravellers",
                          index,
                        });
                      },
                      skipValidation: true,
                    })}
                  />

                  {/* Traveller Dropdown for Children */}
                  {activeTravellerDropdown?.type === "infantTravellers" &&
                    activeTravellerDropdown?.index === index &&
                    travellerResults.length > 0 && (
                      <div className="absolute bg-white border border-gray-200 rounded-md w-full mt-1 max-h-60 overflow-y-auto shadow-md z-50">
                        {travellerResults.map((t: TravellerDataType) => {
                          let rating: number | null = null;
                          try {
                            if (t?.tier) {
                              if (typeof t.tier === "string") {
                                const m = t.tier.match(/\d+/);
                                if (m) rating = Number(m[0]);
                              } else if (typeof t.tier === "number") {
                                rating = Math.round(t.tier);
                              }
                            }
                          } catch (e) {
                            rating = null;
                          }
                          if (rating !== null)
                            rating = Math.min(Math.max(rating, 1), 5);

                          return (
                            <div
                              key={t._id}
                              className="p-2 cursor-pointer hover:bg-gray-100 rounded-md"
                              onClick={() => {
                                updateTraveller(
                                  "infantTravellers",
                                  index,
                                  t.name,
                                  t._id
                                );
                                setActiveTravellerDropdown(null);
                                setTravellerResults([]);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <p className="font-normal text-[0.75rem] text-gray-900">
                                    {t.name}
                                  </p>
                                  <span className="text-gray-300">|</span>
                                  <p className="text-[0.70rem] text-gray-600 truncate">
                                    {t._id}
                                  </p>
                                </div>

                                {rating !== null ? (
                                  <div className="flex items-center gap-1">
                                    <img
                                      src={`/icons/tier-${rating}.png`}
                                      alt={`Tier ${rating}`}
                                      className="w-4 h-4 object-contain"
                                    />
                                    <span className="text-[0.75rem] font-semibold text-gray-700">
                                      {rating}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                        {/* Staple option */}
                        <div
                          className="p-2 cursor-pointer bg-[#f9f9f9] hover:bg-gray-100 border-t border-gray-200 rounded-b-md"
                          onClick={() => {
                            // Set this infant traveller to TBA
                            updateTraveller("infantTravellers", index, "TBA");
                            setActiveTravellerDropdown(null);
                            setTravellerResults([]);
                          }}
                        >
                          <p className="font-medium text-[0.70rem] text-gray-700">
                            Don&apos;t have the name? Enter TBA
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                <RightSideIcons
                  fieldName="infantTravellers"
                  value={trav}
                  overrideSetter={(val) =>
                    updateTraveller("infantTravellers", index, val)
                  }
                  onClickPlus={() =>
                    openAddTraveller({ type: "infantTravellers", index })
                  }
                  onClickView={() =>
                    handleViewTraveller("infantTravellers", index)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Owner */}
      <div className="border border-gray-200 rounded-xl p-3">
        <h2 className="text-[0.75rem] font-medium mb-2">Booking Owner</h2>
        <hr className="mt-1 mb-2 border-t border-gray-200" />
        <label className="block text-[0.75rem] font-medium text-gray-700 mb-1">
          <span className="text-red-500">*</span> User
        </label>
        <div className="w-[66%] relative" ref={teamsRef}>
          <InputField
            name="bookingOwner"
            placeholder="Search by Name/Username/ID"
            required
            className="mt-1 text-[0.75rem] py-2"
            // show the NAME from ownerList, never formData.bookingOwner
            value={ownerList[0]?.name || ""}
            onChange={(e) => {
              const value = e.target.value;
              // show typed text, clear ID until selection
              setOwnerList([{ id: "", name: value }]);
              // don't send name as ID, but keep the name for draft display
              const newFormData = {
                ...formData,
                bookingOwner: "",
                ownerName: value,
              };
              setFormData(newFormData);
              onFormDataUpdate?.(newFormData);

              const results = runFuzzySearch(allTeams, value, [
                "name",
                "email",
                "username",
              ]);
              setTeamsResults(results);
              setShowTeamsDropdown(true);
            }}
            onBlur={handleBlur}
          />
          {showTeamsDropdown && (
            <div className="absolute bg-white border border-gray-200 rounded-md w-[30rem] mt-1 max-h-60 overflow-y-auto shadow-md z-50">
              {TeamsResults.map((t: TeamDataType) => (
                <div
                  key={t._id}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setOwnerList([{ id: t._id, name: t.name }]); // Save both ID and name
                    const newFormData = {
                      ...formData,
                      bookingOwner: t._id,
                      ownerName: t.name,
                    };
                    setFormData(newFormData);
                    onFormDataUpdate?.(newFormData);
                    setShowTeamsDropdown(false);
                  }}
                >
                  <p className="font-medium text-[0.75rem]">{t.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remarks */}
      <div className="border border-gray-200 rounded-xl p-3">
        <label className="block text-[0.75rem]  font-medium text-gray-700">
          Remarks
        </label>
        <hr className="mt-1 mb-2 border-t border-gray-200" />
        <textarea
          name="remarks"
          rows={5}
          value={formData.remarks}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter Your Remarks Here"
          disabled={isSubmitting}
          className={`
            w-full border border-gray-200 rounded-md px-3 py-2 text-[0.75rem]  mt-2 transition-colors
            focus:ring focus:ring-blue-200
            ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      </div>

      {/* View customer sidesheet (read-only) */}
      {isViewCustomerOpen && (
        <AddCustomerSideSheet
          isOpen={isViewCustomerOpen}
          onCancel={() => {
            setIsViewCustomerOpen(false);
            setViewCustomerData(null);
          }}
          mode="view"
          data={viewCustomerData}
        />
      )}

      {isViewVendorOpen && (
        <AddVendorSideSheet
          isOpen={isViewVendorOpen}
          onCancel={() => {
            setIsViewVendorOpen(false);
            setViewVendorData(null);
          }}
          mode="view"
          data={viewVendorData}
        />
      )}
      {isViewTravellerOpen && (
        <AddNewTravellerForm
          isOpen={isViewTravellerOpen}
          onClose={() => {
            setIsViewTravellerOpen(false);
            setViewTravellerData(null);
          }}
          mode="view"
          data={viewTravellerData}
        />
      )}

      {/* Submit Button (if standalone) */}
      {/* {onSubmit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#114958] text-white text-[0.75rem] rounded-lg hover:bg-[#0d3a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save General Info"}
          </button>
        </div>
      )} */}
    </form>
  );
};

export default React.memo(GeneralInfoForm);
