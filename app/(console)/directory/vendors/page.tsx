"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { CiFilter, CiSearch } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { FiCopy } from "react-icons/fi";
import {
  getVendors,
  deleteVendor,
  getVendorBookingHistory,
  getVendorById,
} from "@/services/vendorApi";
import type { JSX } from "react";
import { BookingProvider } from "@/context/BookingContext";
import AddVendorSideSheet from "@/components/Sidesheets/AddVendorSideSheet";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";
import type { DeletableItem } from "@/components/Modals/DeleteModal";
import LinkProfilesModal, {
  type LinkProfileSource,
} from "@/components/Modals/LinkProfilesModal";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { MdHistory } from "react-icons/md";
import { BOOKING_HISTORY_ACTION_BUTTON_CLASS } from "@/components/table/bookingHistoryActionStyles";
import Image from "next/image";
import CustomIdApi from "@/services/customIdApi";
import TableTabs from "@/components/TableTabs";
import CustomerNameTypeFilterDropdown, {
  DEFAULT_CUSTOMER_NAME_TYPE_FILTER,
} from "@/components/Filters/CustomerNameTypeFilterDropdown";
import CustomerSourceFilterDropdown, {
  DEFAULT_SOURCE_FILTER,
  resolveSourceFilterValue,
} from "@/components/Filters/CustomerSourceFilterDropdown";
import {
  passesMultiSelectFilter,
  useMultiSelectFilter,
} from "@/hooks/useMultiSelectFilter";
import { MOCK_BOOKING_HISTORY } from "@/mock-data/directory";
import {
  formatDirectoryDisplayDate,
  mapApiSourceToUi,
  mapTierToNumber,
} from "@/utils/directoryApiMappers";
import {
  getNextTriSortState,
  type TriSortState,
  getItemTimestamp,
} from "@/utils/sorting";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type VendorSourceType =
  | "meta"
  | "google"
  | "referral"
  | "seo"
  | "word-of-mouth"
  | "none";

type VendorSource = {
  type: VendorSourceType;
  label: string;
};

const SOURCE_ICON_MAP: Record<Exclude<VendorSourceType, "none">, string> = {
  meta: "/icons/source-icons/meta.svg",
  google: "/icons/source-icons/google-organic.svg",
  referral: "/icons/source-icons/referal.svg",
  seo: "/icons/source-icons/seo.svg",
  "word-of-mouth": "/icons/source-icons/word-of-mouth.svg",
};

type VendorType = "individual" | "corporate";

type VendorRow = {
  vendorID: string;
  _id: string;
  name: string;
  subtitle?: string;
  vendorType?: VendorType;
  source: VendorSource;
  tier: number;
  dateModified: string;
  createdAt?: string;
  actions: React.ComponentType<any> | string;
};

const TIER_LABELS: Record<number, string> = {
  1: "Tier I",
  2: "Tier II",
  3: "Tier III",
};

const ROW_HOVER_ACTION_CLASS =
  "opacity-0 pointer-events-none transition-opacity duration-300 ease-in-out [.row-actions-active_&]:opacity-100 [.row-actions-active_&]:pointer-events-auto";

const columns: string[] = [
  "Vendor ID",
  "Name",
  "Source",
  "Tier",
  "Last Modified",
  "Actions",
];

const resolveVendorType = (row: {
  vendorType?: VendorType;
  subtitle?: string;
}): VendorType => {
  if (row.vendorType === "individual" || row.vendorType === "corporate") {
    return row.vendorType;
  }

  if ((row.subtitle || "").toUpperCase().includes("GSTIN")) {
    return "corporate";
  }

  return "individual";
};


const mapVendorToRow = (v: any, index: number): VendorRow => {
  const subtitle =
    v.companyName && v.companyName !== v.contactPerson
      ? v.companyName
      : v.gstin
        ? `GSTIN: ${v.gstin}`
        : undefined;

  const sourceRaw = v.source;
  const source: VendorSource = mapApiSourceToUi(sourceRaw);

  return {
    _id: v._id || "",
    vendorID: v.customId || v.vendorID || `VE-AB${String(index + 1).padStart(3, "0")}`,
    name: v.contactPerson || v.name || "—",
    subtitle,
    vendorType: resolveVendorType({ subtitle }),
    source,
    tier: mapTierToNumber(v.tier),
    dateModified: formatDirectoryDisplayDate(v.updatedAt || v.createdAt),
    createdAt: v.updatedAt || v.createdAt,
    actions: "⋮",
  };
};

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

const VendorDirectory = () => {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Vendors");
  const [searchValue, setSearchValue] = useState("");
  const [searchBy, setSearchBy] = useState("vendorId");
  const [searchByOpen, setSearchByOpen] = useState(false);
  const searchByRef = useRef<HTMLButtonElement | null>(null);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);
  const [searchByPos, setSearchByPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });
  const tabOptions = useMemo(() => ["Vendors", "Deleted"], []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<
    "Name" | "Source" | null
  >(null);
  const nameTypeFilter = useMultiSelectFilter(DEFAULT_CUSTOMER_NAME_TYPE_FILTER);
  const sourceFilter = useMultiSelectFilter(DEFAULT_SOURCE_FILTER);

  const [generatedVendorCode, setGeneratedVendorCode] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkSourceProfile, setLinkSourceProfile] =
    useState<LinkProfileSource | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyBookings, setHistoryBookings] = useState<
    {
      id: string;
      bookingDate: string;
      travelDate: string;
      status: "Confirmed" | "On Hold" | "In Progress" | "Failed";
      amount: string;
    }[]
  >([]);

  const mapStatusForModal = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Confirmed" as const;
      case "cancelled":
        return "Failed" as const;
      case "draft":
      default:
        return "In Progress" as const;
    }
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
  }, [
    activeHeaderFilter,
    nameTypeFilter.syncPendingFromApplied,
    sourceFilter.syncPendingFromApplied,
  ]);

  const handleHeaderIconClick = useCallback((column: string) => {
    if (column !== "Name" && column !== "Source") return;
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
            onDeselectAll={sourceFilter.deselectAllPending}
            onReset={sourceFilter.resetPending}
            onApply={() => {
              sourceFilter.applyPending();
              setActiveHeaderFilter(null);
            }}
          />
        ),
      },
    }),
    [activeHeaderFilter, nameTypeFilter, sourceFilter],
  );

  const filteredVendors = useMemo(() => {
    let list = vendors;

    list = list.filter((vendor) =>
      passesMultiSelectFilter(
        nameTypeFilter.applied,
        DEFAULT_CUSTOMER_NAME_TYPE_FILTER,
        resolveVendorType(vendor),
      ),
    );

    list = list.filter((vendor) =>
      passesMultiSelectFilter(
        sourceFilter.applied,
        DEFAULT_SOURCE_FILTER,
        resolveSourceFilterValue(vendor.source),
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
        } else if (sortState.key === "Last Modified") {
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

    const search = searchValue.toLowerCase();

    return sorted.filter((v) => {
      if (searchBy === "name") {
        return (
          (v.name || "").toLowerCase().includes(search) ||
          (v.subtitle || "").toLowerCase().includes(search)
        );
      }
      return (v.vendorID || "").toLowerCase().includes(search);
    });
  }, [
    vendors,
    searchValue,
    searchBy,
    sortState,
    nameTypeFilter.applied,
    sourceFilter.applied,
  ]);

  const handleSort = (column: string) => {
    if (column === "Tier" || column === "Last Modified") {
      setSortState((prev) => getNextTriSortState(prev, column));
      return;
    }

    const sorted = [...vendors];
    if (column === "Vendor ID") {
      sorted.reverse();
    }
    setVendors(sorted);
  };

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen);
  const handleCloseMenu = () => setIsMenuOpen(false);

  const handleSelectClick = () => {
    setSelectMode(true);
    setIsMenuOpen(false);
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedVendors([]);
    setIsMenuOpen(false);
  };

  const handleSelectAllToggle = () => {
    if (selectedVendors.length === vendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(vendors.map((v) => v.vendorID));
    }
  };

  const isAllSelected =
    selectedVendors.length === vendors.length && vendors.length > 0;
  const isSomeSelected =
    selectedVendors.length > 0 && selectedVendors.length < vendors.length;

  const selectAllHeaderCheckbox = renderSelectCheckbox(
    "header-select-vendors",
    isAllSelected,
    handleSelectAllToggle,
    isSomeSelected,
  );

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
        <span className="text-[#414141]">{tierLabel}</span>
      </div>
    );
  };

  const renderSource = (source: VendorSource) => {
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
      <div className="font-[500] text-[#020202]">{row.name}</div>
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
        <span className="inline-flex items-center gap-2">
          <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
          <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
        </span>
      ),
      "Last Modified": (
        <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      ),
    }),
    [],
  );

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      await deleteVendor(vendorId);
    } catch (error: unknown) {
      console.error("Error deleting vendor:", error);
      throw error;
    }
  };

  const fetchVendors = async () => {
    try {
      if (activeTab === "Deleted") {
        const data = await getVendors({ isDeleted: true });
        setVendors(data.map(mapVendorToRow));
        return;
      }

      const data = await getVendors({ isDeleted: false });
      setVendors(data.map(mapVendorToRow));
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      setVendors([]);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [activeTab]);

  const openHistoryForVendor = async (row: VendorRow) => {
    try {
      const fullVendorData = await getVendorById(row._id);
      setSelectedVendor(fullVendorData);

      const resp = await getVendorBookingHistory(row._id, {
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        limit: 10,
      });

      const quotations = resp?.quotations || [];
      setHistoryBookings(
        quotations.map((q: any) => ({
          id: q.customId || q._id,
          bookingDate: q.createdAt
            ? new Date(q.createdAt).toLocaleDateString("en-IN")
            : "—",
          travelDate: q.travelDate ? String(q.travelDate) : "",
          status: mapStatusForModal(q.status),
          amount: q.totalAmount != null ? String(q.totalAmount) : "0",
        })),
      );
      setIsHistoryOpen(true);
    } catch (e) {
      console.error("Failed to open vendor history:", e);
      setSelectedVendor(row);
      setHistoryBookings(
        MOCK_BOOKING_HISTORY.map((q) => ({
          id: q.customId,
          bookingDate: "—",
          travelDate: q.travelDate,
          status: mapStatusForModal(q.status),
          amount: String(q.totalAmount),
        })),
      );
      setIsHistoryOpen(true);
    }
  };

  const handleVendorRowClick = async (row: VendorRow) => {
    if (selectMode) return;

    try {
      const vendor = await getVendorById(row._id);
      setSelectedVendor(vendor);
      setMode("view");
      setIsSideSheetOpen(true);
    } catch (e) {
      console.error("Failed to fetch vendor:", e);
      setSelectedVendor(row);
      setMode("view");
      setIsSideSheetOpen(true);
    }
  };

  const activeVendorsAction = (row: VendorRow) => [
    {
      label: "Edit",
      icon: <FaRegEdit size={14} />,
      color: "text-[#126ACB]",
      onClick: async () => {
        try {
          const vendor = await getVendorById(row._id);
          setSelectedVendor(vendor);
          setMode("edit");
          setIsSideSheetOpen(true);
        } catch (e) {
          console.error("Failed to fetch vendor for edit:", e);
        }
      },
    },
    {
      label: "Delete",
      icon: <FaRegTrashAlt size={14} />,
      color: "text-red-600",
      confirmDeleteId: row.vendorID,
      onClick: async () => {
        await handleDeleteVendor(row._id);
        fetchVendors();
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
          profileType: "Vendor",
          id: row.vendorID,
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
      confirmDuplicateId: row.vendorID,
      onClick: async () => {
        try {
          const vendor = await getVendorById(row._id);
          const res = await CustomIdApi.generate("vendor");
          setGeneratedVendorCode(res?.customId || "");
          setSelectedVendor({
            ...vendor,
            _id: undefined,
            customId: res?.customId || "",
          });
          setMode("create");
          setIsSideSheetOpen(true);
        } catch (e) {
          console.error("Failed to duplicate vendor:", e);
        }
      },
    },
  ];

  const deletedVendorsAction = (row: VendorRow) => [
    {
      label: "Resolve",
      icon: <FaRegEdit size={14} />,
      color: "text-[#126ACB]",
      onClick: () => {
        console.log(row);
      },
    },
  ];

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      filteredVendors.map((row, index) => {
        const cells: JSX.Element[] = [];

        if (selectMode) {
          const isSelected = selectedVendors.includes(row.vendorID);

          cells.push(
            <td key={`select-${index}`} className="px-4 py-3 text-center">
              {renderSelectCheckbox(
                `vendor-select-${row.vendorID}`,
                isSelected,
                () => {
                  setSelectedVendors((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== row.vendorID)
                      : [...prev, row.vendorID],
                  );
                },
              )}
            </td>,
          );
        }

        cells.push(
          <td
            key={`vendorID-${index}`}
            className="h-[4rem] px-4 py-3 text-center align-middle text-[#020202]"
          >
            {row.vendorID}
          </td>,
          <td key={`name-${index}`} className="h-[4rem] px-4 py-3 text-center align-middle">
            {renderNameCell(row)}
          </td>,
          <td key={`source-${index}`} className="h-[4rem] px-4 py-3 text-center align-middle">
            {renderSource(row.source)}
          </td>,
          <td key={`tier-${index}`} className="h-[4rem] px-4 py-3 text-center align-middle">
            {getTierBadge(row.tier)}
          </td>,
          <td
            key={`dateModified-${index}`}
            className="h-[4rem] px-4 py-3 text-center align-middle text-[#414141]"
          >
            {row.dateModified}
          </td>,
          <td key={`actions-${index}`} className="h-[4rem] px-4 py-3 text-center align-middle">
            <div
              className="mx-auto grid w-[12rem] grid-cols-[1fr_2rem] items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex min-h-[34px] items-center justify-end">
                {activeTab === "Vendors" && (
                  <button
                    type="button"
                    className={`${BOOKING_HISTORY_ACTION_BUTTON_CLASS} ${ROW_HOVER_ACTION_CLASS}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openHistoryForVendor(row);
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
                    activeTab === "Vendors"
                      ? activeVendorsAction(row)
                      : deletedVendorsAction(row)
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
    [filteredVendors, selectMode, selectedVendors, activeTab],
  );

  const selectedDeletables: DeletableItem[] = useMemo(() => {
    const rowById = new Map(vendors.map((v) => [v.vendorID, v]));

    return selectedVendors
      .map((id) => rowById.get(id))
      .filter((v): v is VendorRow => Boolean(v))
      .map((v) => ({
        id: v.vendorID,
        mongoId: v._id,
        name: v.name,
        ...(v.subtitle ? { subtitle: v.subtitle } : {}),
        source: v.source,
        rating: Number(v.tier),
        dateModified: v.dateModified,
      }));
  }, [vendors, selectedVendors]);

  const totalCount = vendors.length;

  const tableSharedProps = {
    columnIconMap,
    onHeaderIconClick: handleHeaderIconClick,
    headerIconClickableColumns: ["Name", "Source"] as string[],
    headerDropdownMap,
    showCheckboxColumn: selectMode,
    headerCheckbox: selectMode ? selectAllHeaderCheckbox : undefined,
    onSort: handleSort,
    categoryName: "Vendors" as const,
    initialRowsPerPage: 8,
    maxRowsPerPageOptions: [8, 16, 24, 48],
    headerClassName: "bg-[#F3F3F3]",
    headerRowTextClassName: "text-[#818181]",
    headerCellTextClassName: "text-[#818181]",
    headerAlign: {
      "Vendor ID": "center" as const,
      Name: "center" as const,
      Source: "center" as const,
      Tier: "center" as const,
      "Last Modified": "center" as const,
      Actions: "center" as const,
    },
    columnWidthClassMap: {
      "Vendor ID": "w-[8rem]",
      Name: "w-[12rem]",
      Source: "w-[11rem]",
      Tier: "w-[8rem]",
      "Last Modified": "w-[9rem]",
      Actions: "w-[14rem]",
    },
    enableRowHoverActions: true,
  };

  return (
    <div className="console-page-viewport overflow-hidden bg-[#F9F9F9] px-7 py-0">
      <div className="flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-x-hidden">
        <div className="relative mb-6 mt-4 flex w-full shrink-0 items-center justify-between">
          <TableTabs
            tabs={tabOptions}
            activeTab={activeTab}
            onChange={setActiveTab}
            totalCount={totalCount}
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
                    callback={fetchVendors}
                    entity="vendor"
                    items={selectedDeletables}
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
                  entity="vendor"
                  rootRef={moreActionsRef}
                />
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await CustomIdApi.generate("vendor");
                  setGeneratedVendorCode(res?.customId || "");
                  setSelectedVendor(null);
                  setMode("create");
                  setIsSideSheetOpen(true);
                } catch (err) {
                  console.error("Failed to generate vendor code", err);
                }
              }}
              className="cursor-pointer rounded-[14px] bg-[#7135AD] px-[14px] py-[8px] text-[14px] font-[500] text-white"
            >
              + Add Vendor
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4">
            <div className="min-w-0 flex-1">
              <div className="flex h-[44px] max-w-[34rem] items-stretch overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white">
                <button
                  ref={searchByRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = searchByRef.current?.getBoundingClientRect();
                    if (rect) {
                      setSearchByPos({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                      });
                    }
                    setSearchByOpen((prev) => !prev);
                  }}
                  className="flex h-full shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap px-3 text-[12px] font-[400] text-[#020202]"
                >
                  <span>{searchBy === "name" ? "Name" : "Vendor ID"}</span>
                  <MdOutlineKeyboardArrowDown className="text-[20px] text-[#7A7A7A]" />
                </button>

                <div className="flex min-w-0 flex-1 items-center border-l border-[#D9D9D9]">
                  <input
                    type="text"
                    placeholder="Type here"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent pl-3 pr-3 text-[12px] font-normal text-[#111111] outline-none placeholder:text-[#A0A9BA]"
                  />
                  <CiSearch className="mr-4 shrink-0 text-[#808080]" size={22} />
                </div>
              </div>

              {searchByOpen &&
                searchByPos &&
                createPortal(
                  <div
                    style={{
                      position: "fixed",
                      left: searchByPos.left,
                      top: searchByPos.top + searchByPos.height + 4,
                      minWidth: searchByPos.width,
                      zIndex: 9999,
                    }}
                    className="overflow-hidden rounded-[16px] border border-[#D9D9D9] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.10)]"
                  >
                    {[
                      { value: "vendorId", label: "Vendor ID" },
                      { value: "name", label: "Name" },
                    ].map((option, index, arr) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSearchBy(option.value);
                          setSearchByOpen(false);
                        }}
                        className={`block w-full cursor-pointer whitespace-nowrap px-3 py-2 text-left text-[12px] ${
                          searchBy === option.value
                            ? "text-[#7C3AED]"
                            : "text-[#444444]"
                        } ${index < arr.length - 1 ? "border-b border-[#D9D9D9]" : ""}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>,
                  document.body,
                )}
            </div>

            <div className="flex shrink-0 items-center rounded-full border border-[#C6B2DE] px-[14px] py-[6px] align-middle font-[Poppins,sans-serif] text-[12px] leading-[20px] tracking-[0] text-[#4B4B4B]">
              <span className="font-normal italic">Total : </span>
              <span className="font-normal not-italic text-[#7135AD]">
                {totalCount}
              </span>
            </div>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col px-5 pb-4 pt-[4px]">
            <Table
              data={tableData}
              columns={columns}
              externalTotalRows={totalCount}
              {...tableSharedProps}
              {...(selectMode
                ? {}
                : {
                    onRowClick: (index: number) => {
                      const row = filteredVendors[index];
                      if (!row) return;
                      handleVendorRowClick(row);
                    },
                  })}
            />
          </div>
        </div>
      </div>

      {isSideSheetOpen && (
        <BookingProvider>
          <AddVendorSideSheet
            isOpen={isSideSheetOpen}
            onCancel={() => {
              setIsSideSheetOpen(false);
              setSelectedVendor(null);
              setMode("create");
              setGeneratedVendorCode("");
            }}
            data={selectedVendor}
            mode={mode}
            vendorCode={generatedVendorCode}
            onSuccess={fetchVendors}
          />
        </BookingProvider>
      )}

      {isLinkModalOpen && (
        <LinkProfilesModal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setLinkSourceProfile(null);
          }}
          sourceProfile={linkSourceProfile}
        />
      )}

      {isHistoryOpen && (
        <BookingHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onViewCustomer={
            selectedVendor
              ? async () => {
                  try {
                    const vendorData = await getVendorById(
                      selectedVendor._id || selectedVendor.vendorID,
                    );
                    setSelectedVendor(vendorData);
                    setMode("view");
                    setIsSideSheetOpen(true);
                    setIsHistoryOpen(false);
                  } catch (e) {
                    console.error("Failed to fetch vendor:", e);
                  }
                }
              : undefined
          }
          onEditCustomer={
            selectedVendor
              ? async () => {
                  try {
                    const vendorData = await getVendorById(
                      selectedVendor._id || selectedVendor.vendorID,
                    );
                    setSelectedVendor(vendorData);
                    setMode("edit");
                    setIsSideSheetOpen(true);
                    setIsHistoryOpen(false);
                  } catch (e) {
                    console.error("Failed to fetch vendor:", e);
                  }
                }
              : undefined
          }
          bookings={historyBookings}
          recordName={
            selectedVendor?.companyName ||
            selectedVendor?.name ||
            selectedVendor?.vendorName ||
            "—"
          }
          recordId={
            selectedVendor?.customId ||
            selectedVendor?.vendorCode ||
            selectedVendor?.vendorID ||
            selectedVendor?._id ||
            "—"
          }
          categoryName="vendors"
        />
      )}
    </div>
  );
};

export default VendorDirectory;
