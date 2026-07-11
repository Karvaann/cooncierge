"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { CiFilter, CiSearch } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";
import {
  getCustomers,
  deleteCustomer,
  getCustomerById,
  getBookingHistoryByCustomer,
} from "@/services/customerApi";
import type { JSX } from "react";
import LinkProfilesModal, {
  type LinkProfileSource,
} from "@/components/Modals/LinkProfilesModal";
import AddCustomerSideSheet from "@/components/Sidesheets/AddCustomerSideSheet";
import { BookingProvider } from "@/context/BookingContext";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";
import MergeModal from "@/components/Modals/MergeModal";
import type { DeletableItem } from "@/components/Modals/DeleteModal";
import {
  MOCK_BOOKING_HISTORY,
  MOCK_DRAFT_CUSTOMERS,
} from "@/mock-data/directory";
import {
  formatDirectoryDisplayDate,
  mapApiSourceToUi,
  mapTierToNumber,
} from "@/utils/directoryApiMappers";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { MdHistory } from "react-icons/md";
import { BOOKING_HISTORY_ACTION_BUTTON_CLASS } from "@/components/table/bookingHistoryActionStyles";
import TotalCountPill from "@/components/table/TotalCountPill";
import Image from "next/image";
import CustomIdApi from "@/services/customIdApi";
import DirectoryPeopleTabs, {
  CUSTOMER_PAGE_TABS,
} from "@/components/directory/DirectoryPeopleTabs";
import CustomerNameTypeFilterDropdown, {
  DEFAULT_CUSTOMER_NAME_TYPE_FILTER,
} from "@/components/Filters/CustomerNameTypeFilterDropdown";
import CustomerSourceFilterDropdown, {
  DEFAULT_SOURCE_FILTER,
  resolveSourceFilterValue,
} from "@/components/Filters/CustomerSourceFilterDropdown";
import CustomerTierFilterDropdown, {
  DEFAULT_TIER_FILTER,
  resolveTierFilterValue,
} from "@/components/Filters/CustomerTierFilterDropdown";
import {
  passesMultiSelectFilter,
  useMultiSelectFilter,
} from "@/hooks/useMultiSelectFilter";
import {
  getNextTriSortState,
  type TriSortState,
  getItemTimestamp,
} from "@/utils/sorting";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type CustomerSourceType =
  | "meta"
  | "google"
  | "referral"
  | "seo"
  | "word-of-mouth"
  | "none";

type CustomerSource = {
  type: CustomerSourceType;
  label: string;
};

const SOURCE_ICON_MAP: Record<
  Exclude<CustomerSourceType, "none">,
  string
> = {
  meta: "/icons/source-icons/meta.svg",
  google: "/icons/source-icons/google-organic.svg",
  referral: "/icons/source-icons/referal.svg",
  seo: "/icons/source-icons/seo.svg",
  "word-of-mouth": "/icons/source-icons/word-of-mouth.svg",
};

type CustomerType = "individual" | "corporate";

type CustomerRow = {
  customerID: string;
  _id: string;
  name: string;
  subtitle?: string;
  customerType?: CustomerType;
  source: CustomerSource;
  tier: number;
  owner: string;
  dateCreated: string;
  createdAt?: string;
  actions: React.ComponentType<any> | string;
};

const resolveCustomerType = (row: {
  customerType?: CustomerType;
  subtitle?: string;
}): CustomerType => {
  if (row.customerType === "individual" || row.customerType === "corporate") {
    return row.customerType;
  }

  if ((row.subtitle || "").toUpperCase().includes("GSTIN")) {
    return "corporate";
  }

  return "individual";
};

const TIER_LABELS: Record<number, string> = {
  1: "Tier I",
  2: "Tier II",
  3: "Tier III",
};

const ROW_HOVER_ACTION_CLASS =
  "opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out [.row-actions-active_&]:opacity-100 [.row-actions-active_&]:pointer-events-auto";

function renderSelectCheckbox(
  inputId: string,
  checked: boolean,
  onToggle: () => void,
  indeterminate = false,
) {
  const isActive = checked || indeterminate;

  return (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        id={inputId}
        className="sr-only"
        checked={checked}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggle}
      />
      <label
        htmlFor={inputId}
        onClick={(e) => e.stopPropagation()}
        className={`flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-[5px] border transition ${
          isActive
            ? "border-[#7135AD] bg-[#7135AD]"
            : "border-[#D1D5DB] bg-white"
        }`}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="8"
            viewBox="0 0 12 11"
            fill="none"
            aria-hidden
          >
            <path
              d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {indeterminate && !checked && (
          <span className="block h-[2px] w-[10px] rounded-full bg-white" aria-hidden />
        )}
      </label>
    </div>
  );
}


const matchesCustomerSearch = (customer: CustomerRow, query: string) => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const digits = trimmed.replace(/\D/g, "");

  // Only filter once a name or ID threshold is met
  if (letters.length < 3 && digits.length < 2) return true;

  const matchesName =
    letters.length >= 3 &&
    (() => {
      const parts = (customer.name || "")
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (parts.length === 0) return false;

      const firstName = parts[0] ?? "";
      const lastName = parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";

      return firstName.includes(letters) || lastName.includes(letters);
    })();

  const matchesId =
    digits.length >= 2 &&
    (() => {
      const idDigits = (customer.customerID || "").replace(/\D/g, "");
      if (!idDigits) return false;

      const remaining = idDigits.split("");
      for (const digit of digits) {
        const index = remaining.indexOf(digit);
        if (index === -1) return false;
        remaining.splice(index, 1);
      }
      return true;
    })();

  return matchesName || matchesId;
};

const mapCustomerToRow = (c: any, index: number): CustomerRow => {
  const subtitle = c.alias || (c.gstin ? `GSTIN: ${c.gstin}` : undefined);

  return {
    _id: c._id,
    customerID: c.customId || c._id || `#${index + 1}`,
    name: c.name,
    subtitle,
    customerType: resolveCustomerType({
      customerType: c.customerType,
      subtitle,
    }),
    source: mapApiSourceToUi(c.source),
    owner:
      typeof c.ownerId === "object" && c.ownerId !== null
        ? c.ownerId.name
        : c.ownerId || "—",
    tier: mapTierToNumber(c.tier),
    dateCreated: formatDirectoryDisplayDate(c.updatedAt || c.createdAt),
    createdAt: c.createdAt,
    actions: "⋮",
  };
};

const columns: string[] = [
  "Customer ID",
  "Name",
  "Source",
  "Tier",
  "Last Modified",
  "Actions",
];

const CustomerDirectory = () => {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Customers");
  const [searchValue, setSearchValue] = useState("");
  const moreActionsRef = useRef<HTMLDivElement | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMode, setMenuMode] = useState<"main" | "action">("main");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeModalItems, setMergeModalItems] = useState<DeletableItem[]>([]);
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<
    "Name" | "Source" | "Tier" | null
  >(null);
  const nameTypeFilter = useMultiSelectFilter(DEFAULT_CUSTOMER_NAME_TYPE_FILTER);
  const sourceFilter = useMultiSelectFilter(DEFAULT_SOURCE_FILTER);
  const tierFilter = useMultiSelectFilter(DEFAULT_TIER_FILTER);

  const [generatedCustomerCode, setGeneratedCustomerCode] =
    useState<string>("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkSourceProfile, setLinkSourceProfile] =
    useState<LinkProfileSource | null>(null);
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const mapStatusForModal = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Confirmed" as const;
      case "cancelled":
        // Align with BookingHistoryModal expected status union which uses 'Cancelled'
        return "Cancelled" as const;
      case "draft":
      default:
        return "In Progress" as const;
    }
  };
  const mapQuotationsToModal = (qs: any[]) =>
    qs.map((q: any) => ({
      id: q.customId || q._id,
      bookingDate: q.createdAt
        ? new Date(q.createdAt).toLocaleDateString("en-IN")
        : "—",
      travelDate: q.travelDate ? String(q.travelDate) : "",
      status: mapStatusForModal(q.status),
      amount: q.totalAmount != null ? String(q.totalAmount) : "0",
    }));

  const handleCloseLinkModal = () => {
    setIsLinkModalOpen(false);
    setLinkSourceProfile(null);
  };

  useEffect(() => {
    if (!activeHeaderFilter) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-header-filter-trigger]") ||
        target.closest("[data-header-filter-dropdown]")
      ) {
        return;
      }
      setActiveHeaderFilter(null);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [activeHeaderFilter]);

  useEffect(() => {
    if (activeHeaderFilter === "Name") {
      nameTypeFilter.syncPendingFromApplied();
    }
    if (activeHeaderFilter === "Source") {
      sourceFilter.syncPendingFromApplied();
    }
    if (activeHeaderFilter === "Tier") {
      tierFilter.syncPendingFromApplied();
    }
  }, [
    activeHeaderFilter,
    nameTypeFilter.syncPendingFromApplied,
    sourceFilter.syncPendingFromApplied,
    tierFilter.syncPendingFromApplied,
  ]);

  const handleHeaderIconClick = useCallback((column: string) => {
    if (column !== "Name" && column !== "Source" && column !== "Tier") return;

    setActiveHeaderFilter((prev) => (prev === column ? null : column));
  }, []);

  const headerDropdownMap = useMemo(
    () => ({
      Name: {
        isOpen: activeHeaderFilter === "Name",
        align: "center" as const,
        content: (
          <CustomerNameTypeFilterDropdown
            pendingValues={nameTypeFilter.pending}
            onToggle={nameTypeFilter.togglePending}
            onSelectAll={nameTypeFilter.selectAllPending}
            onDeselectAll={nameTypeFilter.deselectAllPending}
            onReset={nameTypeFilter.resetPending}
            onApply={() => {
              nameTypeFilter.applyPending();
              setActiveHeaderFilter(null);
            }}
          />
        ),
      },
      Source: {
        isOpen: activeHeaderFilter === "Source",
        align: "center" as const,
        content: (
          <CustomerSourceFilterDropdown
            pendingValues={sourceFilter.pending}
            onToggle={sourceFilter.togglePending}
            onSelectAll={sourceFilter.selectAllPending}
            onDeselectAll={sourceFilter.deselectAllPending}
            onReset={sourceFilter.resetPending}
            onApply={() => {
              sourceFilter.applyPending();
              setActiveHeaderFilter(null);
            }}
          />
        ),
      },
      Tier: {
        isOpen: activeHeaderFilter === "Tier",
        align: "center" as const,
        content: (
          <CustomerTierFilterDropdown
            pendingValues={tierFilter.pending}
            onToggle={tierFilter.togglePending}
            onSelectAll={tierFilter.selectAllPending}
            onDeselectAll={tierFilter.deselectAllPending}
            onReset={tierFilter.resetPending}
            onApply={() => {
              tierFilter.applyPending();
              setActiveHeaderFilter(null);
            }}
          />
        ),
      },
    }),
    [activeHeaderFilter, nameTypeFilter, sourceFilter, tierFilter],
  );

  const filteredCustomers = useMemo(() => {
    let list = customers;

    list = list.filter((customer) =>
      passesMultiSelectFilter(
        nameTypeFilter.applied,
        DEFAULT_CUSTOMER_NAME_TYPE_FILTER,
        resolveCustomerType(customer),
      ),
    );

    list = list.filter((customer) =>
      passesMultiSelectFilter(
        sourceFilter.applied,
        DEFAULT_SOURCE_FILTER,
        resolveSourceFilterValue(customer.source),
      ),
    );

    list = list.filter((customer) =>
      passesMultiSelectFilter(
        tierFilter.applied,
        DEFAULT_TIER_FILTER,
        resolveTierFilterValue(customer.tier),
      ),
    );

    const sorted = (() => {
      if (!sortState.key || sortState.direction === "none") return list;

      const withIndex = list.map((item, originalIndex) => ({
        item,
        originalIndex,
      }));

      withIndex.sort((a, b) => {
        let cmp = 0;
        if (sortState.key === "Tier") {
          cmp = (a.item.tier || 0) - (b.item.tier || 0);
        } else if (
          sortState.key === "Last Modified" ||
          sortState.key === "Date Modified"
        ) {
          const ta = getItemTimestamp({ createdAt: a.item.createdAt }) ?? 0;
          const tb = getItemTimestamp({ createdAt: b.item.createdAt }) ?? 0;
          cmp = ta - tb;
        }

        if (cmp === 0) return a.originalIndex - b.originalIndex;
        return sortState.direction === "asc" ? cmp : -cmp;
      });

      return withIndex.map((x) => x.item);
    })();

    if (!searchValue.trim()) return sorted;

    return sorted.filter((c) => matchesCustomerSearch(c, searchValue));
  }, [
    customers,
    searchValue,
    sortState,
    nameTypeFilter.applied,
    sourceFilter.applied,
    tierFilter.applied,
  ]);

  const handleSort = (column: string) => {
    if (column === "Tier" || column === "Last Modified" || column === "Date Modified") {
      setSortState((prev) => getNextTriSortState(prev, column));
      return;
    }

    const sorted = [...customers];
    if (column === "Customer ID") {
      sorted.reverse();
    }
    setCustomers(sorted);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => setIsMenuOpen(false);

  const getTierBadge = (tier: number) => {
    const rating = Math.min(Math.max(Math.round(tier), 1), 3);
    const tierIcon = `/icons/tier-${rating}.svg`;
    const tierLabel = TIER_LABELS[rating] ?? `Tier ${rating}`;

    return (
      <div className="flex items-center justify-center gap-2">
        <div className="relative h-5 w-5">
          <Image
            src={tierIcon}
            alt={tierLabel}
            width={20}
            height={20}
            className="object-contain"
            unoptimized
          />
        </div>
        <span className="text-[#414141]">
          {tierLabel}
        </span>
      </div>
    );
  };

  const renderSource = (source: CustomerSource) => {
    if (source.type === "none") {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-[#414141]">—</span>
        </div>
      );
    }

    return (
      <div className="mx-auto flex h-full w-full flex-col items-center justify-center gap-1">
        <Image
          src={SOURCE_ICON_MAP[source.type]}
          alt={source.label}
          width={20}
          height={20}
          className="h-5 w-5 shrink-0 object-contain"
          unoptimized
        />
        <span className="text-center font-[400] text-[#414141]">
          {source.label}
        </span>
      </div>
    );
  };

  const renderNameCell = (row: { name: string; subtitle?: string }) => (
    <div className="mx-auto w-fit text-center">
      <div className="font-[500] text-[#020202] min-[1728px]:font-[400]">{row.name}</div>
      {row.subtitle ? (
        <div className="table-cell-subtext mt-0.5 text-[#818181]">
          {row.subtitle}
        </div>
      ) : null}
    </div>
  );

  const columnIconMap = useMemo<Record<string, JSX.Element>>(
    () => ({
      Name: (
        <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      Source: (
        <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      Tier: (
        <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
      "Last Modified": (
        <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
    }),
    [],
  );

  const columnSortIconMap = useMemo<Record<string, JSX.Element>>(
    () => ({
      Tier: (
        <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
    }),
    [],
  );

  const handleSelectClick = () => {
    setSelectMode(true);
    setMenuMode("action"); // switch to new action menu

    setIsMenuOpen(false); // Close current menu once
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedCustomers([]);
    setMenuMode("main");
    setIsMenuOpen(false);
  };

  const handleSelectAllToggle = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((c) => c.customerID));
    }
  };

  const isAllSelected =
    selectedCustomers.length === customers.length && customers.length > 0;

  const isSomeSelected =
    selectedCustomers.length > 0 &&
    selectedCustomers.length < customers.length;

  const selectAllHeaderCheckbox = renderSelectCheckbox(
    "header-select-customers",
    isAllSelected,
    handleSelectAllToggle,
    isSomeSelected,
  );

  const handleCustomerRowClick = async (row: CustomerRow) => {
    if (selectMode) return;

    try {
      const customer = await getCustomerById(row._id);
      setSelectedCustomer(customer);
      setMode("view");
      setIsSideSheetOpen(true);
    } catch (e) {
      console.error("Failed to fetch customer:", e);
    }
  };

  const handleDeleteCustomer = async (customerID: string) => {
    try {
      const response = await deleteCustomer(customerID);

      console.log("Customer deleted successfully:", response.message);
    } catch (error: any) {
      console.error("Error deleting customer:", error.message || error);
    }
  };

  const openHistoryForCustomer = async (row: CustomerRow) => {
    try {
      setSelectedCustomer(row);
      const resp = await getBookingHistoryByCustomer(row._id, {
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        limit: 10,
      });
      setBookingHistory(mapQuotationsToModal(resp?.quotations || []));
      setIsHistoryOpen(true);
    } catch (e) {
      console.error("Failed to open customer history:", e);
      setSelectedCustomer(row);
      setBookingHistory(mapQuotationsToModal(MOCK_BOOKING_HISTORY));
      setIsHistoryOpen(true);
    }
  };

  const fetchData = async () => {
    try {
      if (activeTab === "Deleted") {
        const deleted = await getCustomers({ isDeleted: true });
        setCustomers(deleted.map(mapCustomerToRow));
        return;
      }

      if (activeTab === "Draft") {
        setCustomers(MOCK_DRAFT_CUSTOMERS);
        return;
      }

      const data = await getCustomers({ isDeleted: false });
      setCustomers(data.map(mapCustomerToRow));
    } catch (err) {
      console.error("Failed to fetch:", err);
      if (activeTab === "Draft") {
        setCustomers(MOCK_DRAFT_CUSTOMERS);
      } else {
        setCustomers([]);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const activeCustomersAction = (row: CustomerRow) => [
    {
      label: "Edit",
      icon: <FaRegEdit size={14} />,
      color: "text-[#126ACB]",
      onClick: async () => {
        try {
          const customer = await getCustomerById(row._id);
          setSelectedCustomer(customer);
          setIsSideSheetOpen(true);
          setMode("edit");
        } catch (e) {
          console.error("Failed to fetch customer for edit:", e);
        }
      },
    },
    {
      label: "Delete",
      icon: <FaRegTrashAlt size={14} />,
      color: "text-red-600",
      confirmDeleteId: row.customerID,
      onClick: async () => {
        await handleDeleteCustomer(row._id);
        fetchData();
      },
    },
    {
      label: "Link",
      icon: (
        <Image
          src="/icons/link-icon.svg"
          alt="Link"
          width={14}
          height={14}
          className="object-contain"
        />
      ),
      color: "text-[#419836]",
      onClick: () => {
        setLinkSourceProfile({
          profileType: "Customer",
          id: row.customerID,
          name: row.name,
          ...(row.subtitle ? { nickname: row.subtitle } : {}),
          tier: row.tier,
        });
        setIsLinkModalOpen(true);
      },
    },
    {
      label: "Duplicate",
      icon: <FiCopy size={14} />,
      color: "text-[#818181]",
      confirmDuplicateId: row.customerID,
      onClick: async () => {
        try {
          const customer = await getCustomerById(row._id);
          const res = await CustomIdApi.generate("customer");
          setGeneratedCustomerCode(res?.customId || "");
          setSelectedCustomer({
            ...customer,
            _id: undefined,
            customId: res?.customId || "",
          });
          setMode("create");
          setIsSideSheetOpen(true);
        } catch (e) {
          console.error("Failed to duplicate customer:", e);
        }
      },
    },
  ];

  const draftCustomersAction = (row: CustomerRow) => [
    {
      label: "Edit",
      icon: <FaRegEdit size={14} />,
      color: "text-[#126ACB]",
      onClick: async () => {
        try {
          const customer = await getCustomerById(row._id);
          setSelectedCustomer(customer);
          setIsSideSheetOpen(true);
          setMode("edit");
        } catch (e) {
          console.error("Failed to fetch draft customer for edit:", e);
        }
      },
    },
    {
      label: "Delete",
      icon: <FaRegTrashAlt size={14} />,
      color: "text-red-600",
      confirmDeleteId: row.customerID,
      onClick: async () => {
        await handleDeleteCustomer(row._id);
        fetchData();
      },
    },
  ];

  const deletedCustomersAction = (row: CustomerRow) => [
    {
      label: "Resolve",
      icon: <FaRegEdit />,
      color: "text-blue-600",
      onClick: async () => {
        console.log(row);
      },
    },
  ];

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      filteredCustomers.map((row, index) => {
        const cells: JSX.Element[] = [];

        // If select mode is ON, insert checkbox column
        if (selectMode) {
          const isSelected = selectedCustomers.includes(row.customerID);

          cells.push(
            <td key={`select-${index}`} className="px-4 py-3 text-center">
              {renderSelectCheckbox(
                `customer-select-${row.customerID}`,
                isSelected,
                () => {
                  setSelectedCustomers((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== row.customerID)
                      : [...prev, row.customerID],
                  );
                },
              )}
            </td>,
          );
        }
        cells.push(
          <td
            key={`customerID-${index}`}
            className="px-4 py-3 text-center align-middle h-[4rem] text-[#020202]"
          >
            {row.customerID}
          </td>,
          <td key={`name-${index}`} className="px-4 py-3 text-center align-middle h-[4rem]">
            {renderNameCell(row)}
          </td>,
          <td key={`source-${index}`} className="px-4 py-3 text-center align-middle h-[4rem]">
            {renderSource(row.source)}
          </td>,
          <td key={`tier-${index}`} className="px-4 py-3 text-center align-middle h-[4rem]">
            {getTierBadge(row.tier)}
          </td>,
          <td key={`dateCreated-${index}`} className="px-4 py-3 text-center align-middle h-[4rem] text-[#414141]">
            {row.dateCreated}
          </td>,
          <td key={`actions-${index}`} className="px-4 py-3 text-center align-middle h-[4rem]">
            <div
              className="mx-auto grid w-[12rem] grid-cols-[1fr_2rem] items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex min-h-[34px] items-center justify-end">
                {activeTab !== "Draft" && (
                  <button
                    type="button"
                    className={`${BOOKING_HISTORY_ACTION_BUTTON_CLASS} ${ROW_HOVER_ACTION_CLASS}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void openHistoryForCustomer(row);
                    }}
                  >
                    <MdHistory size={14} />
                    Booking History
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center">
                <ActionMenu
                  revealClassName={ROW_HOVER_ACTION_CLASS}
                  actions={
                    activeTab === "Customers"
                      ? activeCustomersAction(row)
                      : activeTab === "Draft"
                        ? draftCustomersAction(row)
                        : activeTab === "Deleted"
                          ? deletedCustomersAction(row)
                          : []
                  }
                  align="left"
                  width="min-w-[7.5rem]"
                />
              </div>
            </div>
          </td>,
        );

        return cells;
      }),
    [filteredCustomers, selectMode, selectedCustomers],
  );

  const buildCustomerDeletables = useCallback((): DeletableItem[] => {
    const rowById = new Map(
      [...customers, ...filteredCustomers].map((c) => [c.customerID, c]),
    );

    return selectedCustomers
      .map((id) => rowById.get(id))
      .filter((c): c is CustomerRow => Boolean(c))
      .map((c) => ({
        id: c.customerID,
        mongoId: c._id,
        name: c.name,
        ...(c.subtitle ? { subtitle: c.subtitle } : {}),
        source: c.source,
        owner: c.owner,
        rating: Number(c.tier),
        dateModified: c.dateCreated,
      }));
  }, [customers, filteredCustomers, selectedCustomers]);

  const selectedDeletables: DeletableItem[] = useMemo(
    () => buildCustomerDeletables(),
    [buildCustomerDeletables],
  );

  const totalCount = customers.length;

  return (
    <div className="console-page-viewport overflow-hidden bg-[#F9F9F9] px-7 py-0">
      <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-x-hidden">
        <div className="relative mb-6 mt-4 flex w-full shrink-0 items-center justify-between">
          <DirectoryPeopleTabs
            tabs={CUSTOMER_PAGE_TABS}
            activeTab={activeTab}
            totalCount={totalCount}
            onLocalTabChange={setActiveTab}
          />

          <div className="relative flex items-center gap-3">
            {selectMode ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelSelectMode}
                  className="inline-flex h-10 cursor-pointer items-center rounded-[14px] border border-[#E2E1E1] bg-white px-5 text-[14px] font-medium text-[#414141] transition-colors hover:bg-[#FAFAFA]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllToggle}
                  className="inline-flex h-10 cursor-pointer items-center rounded-[14px] border border-[#E2E1E1] bg-white px-5 text-[14px] font-medium text-[#414141] transition-colors hover:bg-[#FAFAFA]"
                >
                  {isAllSelected ? "Deselect all" : "Select all"}
                </button>
                <div className="relative inline-flex items-center" ref={moreActionsRef}>
                  <button
                    type="button"
                    onClick={handleMenuToggle}
                    className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] text-[#414141] transition-colors hover:bg-[#F3F3F3]"
                    aria-label="More actions"
                    aria-expanded={isMenuOpen}
                  >
                    <IoEllipsisHorizontal className="text-[22px]" />
                  </button>
                  <DownloadMergeMenu
                    isOpen={isMenuOpen}
                    onClose={handleCloseMenu}
                    callback={() => {
                      fetchData();
                    }}
                    entity="customer"
                    items={selectedDeletables}
                    onMergeClick={() => {
                      setMergeModalItems(buildCustomerDeletables());
                      setIsMergeModalOpen(true);
                    }}
                    rootRef={moreActionsRef}
                    menuVariant="dropdown"
                  />
                </div>
              </div>
            ) : (
              <div className="relative inline-flex" ref={moreActionsRef}>
                <button
                  type="button"
                  onClick={handleMenuToggle}
                  className={`inline-flex cursor-pointer items-stretch overflow-hidden border border-[#7135AD66] bg-white text-[14px] font-[600] text-[#414141] transition-colors hover:bg-[#FAFAFA] ${
                    isMenuOpen
                      ? "rounded-t-[14px] rounded-b-none"
                      : "rounded-[14px]"
                  }`}
                >
                  <span className="flex items-center px-[14px] py-[8px]">
                    More Actions
                  </span>
                  <span className="flex items-center border-l border-[#7135AD66] px-[10px] py-[8px]">
                    <MdOutlineKeyboardArrowDown className="text-[18px] text-[#414141]" />
                  </span>
                </button>

                <SelectUploadMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  onSelect={handleSelectClick}
                  rootRef={moreActionsRef}
                />
              </div>
            )}

            {activeTab === "Customers" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsGeneratingCode(true);
                    const res = await CustomIdApi.generate("customer");
                    setGeneratedCustomerCode(res?.customId || null);
                    setMode("create");
                    setSelectedCustomer(null);
                    setIsSideSheetOpen(true);
                  } catch (err) {
                    console.error("Failed to generate customer code", err);
                  } finally {
                    setIsGeneratingCode(false);
                  }
                }}
                className="cursor-pointer rounded-[14px] bg-[#7135AD] px-[14px] py-[8px] text-[14px] font-[500] text-white"
              >
                + Add Customer
              </button>
            )}
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex h-[44px] max-w-[34rem] items-stretch overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white">
                <div className="flex min-w-0 flex-1 items-center">
                  <input
                    type="text"
                    placeholder="Search by Customer's Name or ID"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent pl-4 pr-3 text-[12px] font-normal text-[#111111] outline-none placeholder:text-[#A0A9BA]"
                  />
                  <CiSearch className="mr-4 shrink-0 text-[#808080]" size={22} />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-[20px]">
              <TotalCountPill count={totalCount} />
            </div>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col px-5 pb-0 pt-[4px]">
            {activeTab === "Customers" && (
              <Table
                data={tableData}
                columns={columns}
                columnIconMap={columnIconMap}
                columnSortIconMap={columnSortIconMap}
                onHeaderIconClick={handleHeaderIconClick}
                headerIconClickableColumns={["Name", "Source", "Tier"]}
                headerDropdownMap={headerDropdownMap}
                showCheckboxColumn={selectMode}
                headerCheckbox={selectMode ? selectAllHeaderCheckbox : undefined}
                onSort={handleSort}
                categoryName="Customers"
                initialRowsPerPage={10}
                maxRowsPerPageOptions={[10, 20, 50, 100]}
                headerClassName="bg-[#F3F3F3]"
                headerRowTextClassName="text-[#818181]"
                headerAlign={{
                  "Customer ID": "center",
                  Name: "center",
                  Source: "center",
                  Tier: "center",
                  "Last Modified": "center",
                  Actions: "center",
                }}
                headerCellTextClassName="text-[#818181]"
                columnWidthClassMap={{
                  "Customer ID": "w-[8rem]",
                  Name: "w-[12rem]",
                  Source: "w-[11rem]",
                  Tier: "w-[8rem]",
                  "Last Modified": "w-[9rem]",
                  Actions: "w-[14rem]",
                }}
                enableRowHoverActions={true}
                {...(selectMode
                  ? {}
                  : {
                      onRowClick: (index: number) => {
                        const row = filteredCustomers[index];
                        if (!row) return;
                        handleCustomerRowClick(row);
                      },
                    })}
              />
            )}

            {activeTab === "Draft" && (
              <Table
                data={tableData}
                columns={columns}
                columnIconMap={columnIconMap}
                columnSortIconMap={columnSortIconMap}
                onHeaderIconClick={handleHeaderIconClick}
                headerIconClickableColumns={["Name", "Source", "Tier"]}
                headerDropdownMap={headerDropdownMap}
                showCheckboxColumn={selectMode}
                headerCheckbox={selectMode ? selectAllHeaderCheckbox : undefined}
                onSort={handleSort}
                categoryName="Customers"
                initialRowsPerPage={10}
                maxRowsPerPageOptions={[10, 20, 50, 100]}
                headerClassName="bg-[#F3F3F3]"
                headerRowTextClassName="text-[#818181]"
                headerAlign={{
                  "Customer ID": "center",
                  Name: "center",
                  Source: "center",
                  Tier: "center",
                  "Last Modified": "center",
                  Actions: "center",
                }}
                headerCellTextClassName="text-[#818181]"
                columnWidthClassMap={{
                  "Customer ID": "w-[8rem]",
                  Name: "w-[12rem]",
                  Source: "w-[11rem]",
                  Tier: "w-[8rem]",
                  "Last Modified": "w-[9rem]",
                  Actions: "w-[14rem]",
                }}
                enableRowHoverActions={true}
                {...(selectMode
                  ? {}
                  : {
                      onRowClick: (index: number) => {
                        const row = filteredCustomers[index];
                        if (!row) return;
                        handleCustomerRowClick(row);
                      },
                    })}
              />
            )}

            {activeTab === "Deleted" && (
              <Table
                data={tableData}
                columns={columns}
                columnIconMap={columnIconMap}
                columnSortIconMap={columnSortIconMap}
                onHeaderIconClick={handleHeaderIconClick}
                headerIconClickableColumns={["Name", "Source", "Tier"]}
                headerDropdownMap={headerDropdownMap}
                showCheckboxColumn={selectMode}
                headerCheckbox={selectMode ? selectAllHeaderCheckbox : undefined}
                onSort={handleSort}
                categoryName="Customers"
                headerClassName="bg-[#F3F3F3]"
                headerRowTextClassName="text-[#818181]"
                headerCellTextClassName="text-[#818181]"
              />
            )}
          </div>
        </div>
      </div>

      {isSideSheetOpen && (
        <BookingProvider>
          <AddCustomerSideSheet
            isOpen={isSideSheetOpen}
            onCancel={() => {
              setIsSideSheetOpen(false);
              setSelectedCustomer(null);
              setMode("create");
              setGeneratedCustomerCode(""); // Reset generated code on close
            }}
            data={selectedCustomer} // REQUIRED
            mode={mode}
            customerCode={generatedCustomerCode}
            onSuccess={fetchData}
          />
        </BookingProvider>
      )}
      {isLinkModalOpen && (
        <LinkProfilesModal
          isOpen={isLinkModalOpen}
          onClose={handleCloseLinkModal}
          sourceProfile={linkSourceProfile}
        />
      )}

      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => {
          setIsMergeModalOpen(false);
          setMergeModalItems([]);
        }}
        items={mergeModalItems}
        mode="customer"
      />

      {isHistoryOpen && (
        <BookingHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onViewCustomer={
            (activeTab === "Customers" || activeTab === "Draft") &&
            selectedCustomer
              ? async () => {
                  try {
                    const customer = await getCustomerById(
                      selectedCustomer._id,
                    );
                    setSelectedCustomer(customer);
                    setMode("view");
                    setIsSideSheetOpen(true);
                    setIsHistoryOpen(false);
                  } catch (e) {
                    console.error("Failed to fetch customer:", e);
                  }
                }
              : undefined
          }
          onEditCustomer={
            (activeTab === "Customers" || activeTab === "Draft") &&
            selectedCustomer
              ? async () => {
                  try {
                    const customer = await getCustomerById(
                      selectedCustomer._id,
                    );
                    setSelectedCustomer(customer);
                    setMode("edit");
                    setIsSideSheetOpen(true);
                    setIsHistoryOpen(false);
                  } catch (e) {
                    console.error("Failed to fetch customer:", e);
                  }
                }
              : undefined
          }
          bookings={bookingHistory}
          recordName={
            selectedCustomer?.name ||
            selectedCustomer?.customerName ||
            selectedCustomer?.companyName ||
            "—"
          }
          recordId={
            selectedCustomer?.customerID ||
            selectedCustomer?._id ||
            selectedCustomer?.id ||
            "—"
          }
          recordMongoId={selectedCustomer?._id}
          categoryName="customers"
          vendorLinkCount={1}
          travellerLinkCount={0}
        />
      )}
    </div>
  );
};

export default CustomerDirectory;
