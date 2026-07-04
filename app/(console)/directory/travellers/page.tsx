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
  getTravellers,
  deleteTraveller,
  getTravellerById,
  getTravellerBookingHistory,
  restoreTraveller,
} from "@/services/travellerApi";
import type { JSX } from "react";
import { BookingProvider } from "@/context/BookingContext";
import AddNewTravellerForm from "@/components/forms/AddNewForms/AddNewTravellerForm";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";
import type { DeletableItem } from "@/components/Modals/DeleteModal";
import LinkProfilesModal, {
  type LinkProfileSource,
} from "@/components/Modals/LinkProfilesModal";
import BookingHistoryModal from "@/components/Modals/BookingHistoryModal";
import { MdHistory } from "react-icons/md";
import { BOOKING_HISTORY_ACTION_BUTTON_CLASS } from "@/components/table/bookingHistoryActionStyles";
import TotalCountPill from "@/components/table/TotalCountPill";
import Image from "next/image";
import generateCustomId from "@/utils/helper";
import DirectoryPeopleTabs, {
  TRAVELLER_PAGE_TABS,
} from "@/components/directory/DirectoryPeopleTabs";
import DirectoryTravellersToggle from "@/components/directory/DirectoryTravellersToggle";
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

type TravellerSourceType =
  | "meta"
  | "google"
  | "referral"
  | "seo"
  | "word-of-mouth"
  | "none";

type TravellerSource = {
  type: TravellerSourceType;
  label: string;
};

const SOURCE_ICON_MAP: Record<Exclude<TravellerSourceType, "none">, string> = {
  meta: "/icons/source-icons/meta.svg",
  google: "/icons/source-icons/google-organic.svg",
  referral: "/icons/source-icons/referal.svg",
  seo: "/icons/source-icons/seo.svg",
  "word-of-mouth": "/icons/source-icons/word-of-mouth.svg",
};

type TravellerType = "individual" | "corporate";

type TravellerRow = {
  travellerID: string;
  _id: string;
  name: string;
  subtitle?: string;
  travellerType?: TravellerType;
  source: TravellerSource;
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
  "Traveller ID",
  "Name",
  "Source",
  "Tier",
  "Last Modified",
  "Actions",
];

const resolveTravellerType = (row: {
  travellerType?: TravellerType;
  subtitle?: string;
}): TravellerType => {
  if (row.travellerType === "individual" || row.travellerType === "corporate") {
    return row.travellerType;
  }

  if ((row.subtitle || "").toUpperCase().includes("GSTIN")) {
    return "corporate";
  }

  return "individual";
};

const mapTravellerToRow = (t: any, index: number): TravellerRow => {
  const subtitle = t.subtitle || t.alias;

  return {
    _id: t._id || "",
    travellerID:
      t.customId || t.travellerID || `TR-AB${String(index + 1).padStart(3, "0")}`,
    name: t.name || "—",
    subtitle,
    travellerType: resolveTravellerType({ subtitle }),
    source: mapApiSourceToUi(t.source),
    tier: mapTierToNumber(t.tier),
    dateModified: formatDirectoryDisplayDate(t.updatedAt || t.createdAt),
    createdAt: t.createdAt,
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

const TravellerDirectory = () => {
  const [activeTab, setActiveTab] = useState("Travellers");
  const [searchValue, setSearchValue] = useState("");
  const [searchBy, setSearchBy] = useState("travellerId");
  const [searchByOpen, setSearchByOpen] = useState(false);
  const searchByRef = useRef<HTMLButtonElement | null>(null);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);
  const [searchByPos, setSearchByPos] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [travellers, setTravellers] = useState<TravellerRow[]>([]);
  const [sortState, setSortState] = useState<TriSortState<string>>({
    key: null,
    direction: "none",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedTravellers, setSelectedTravellers] = useState<string[]>([]);
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<
    "Name" | "Source" | null
  >(null);
  const nameTypeFilter = useMultiSelectFilter(DEFAULT_CUSTOMER_NAME_TYPE_FILTER);
  const sourceFilter = useMultiSelectFilter(DEFAULT_SOURCE_FILTER);

  const [isTravellerSheetOpen, setIsTravellerSheetOpen] = useState(false);
  const [travellerMode, setTravellerMode] = useState<
    "create" | "edit" | "view"
  >("create");
  const [selectedTravellerRow, setSelectedTravellerRow] = useState<any | null>(
    null,
  );
  const [selectedTravellerFull, setSelectedTravellerFull] = useState<
    any | null
  >(null);
  const [generatedTravellerCode, setGeneratedTravellerCode] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkSourceProfile, setLinkSourceProfile] =
    useState<LinkProfileSource | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<
    {
      id: string;
      bookingDate: string;
      travelDate: string;
      status: "Confirmed" | "On Hold" | "In Progress" | "Failed" | "Cancelled";
      amount: string;
    }[]
  >([]);

  const mapStatusForModal = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "confirmed":
        return "Confirmed" as const;
      case "cancelled":
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

  const openHistoryForTraveller = async (row: TravellerRow) => {
    try {
      setSelectedTravellerRow(row);
      const resp = await getTravellerBookingHistory(row._id, {
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        limit: 10,
      });
      setBookingHistory(mapQuotationsToModal(resp?.quotations || []));
      setIsHistoryOpen(true);
    } catch (e) {
      console.error("Failed to open traveller history:", e);
      setSelectedTravellerRow(row);
      setBookingHistory(
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

  const filteredTravellers = useMemo(() => {
    let list = travellers;

    list = list.filter((traveller) =>
      passesMultiSelectFilter(
        nameTypeFilter.applied,
        DEFAULT_CUSTOMER_NAME_TYPE_FILTER,
        resolveTravellerType(traveller),
      ),
    );

    list = list.filter((traveller) =>
      passesMultiSelectFilter(
        sourceFilter.applied,
        DEFAULT_SOURCE_FILTER,
        resolveSourceFilterValue(traveller.source),
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

    return sorted.filter((t) => {
      if (searchBy === "name") {
        return (
          (t.name || "").toLowerCase().includes(search) ||
          (t.subtitle || "").toLowerCase().includes(search)
        );
      }
      return (t.travellerID || "").toLowerCase().includes(search);
    });
  }, [
    travellers,
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

    const sorted = [...travellers];
    if (column === "Traveller ID") {
      sorted.reverse();
    }
    setTravellers(sorted);
  };

  const handleMenuToggle = () => setIsMenuOpen(!isMenuOpen);
  const handleCloseMenu = () => setIsMenuOpen(false);

  const handleSelectClick = () => {
    setSelectMode(true);
    setIsMenuOpen(false);
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedTravellers([]);
    setIsMenuOpen(false);
  };

  const handleSelectAllToggle = () => {
    if (selectedTravellers.length === travellers.length) {
      setSelectedTravellers([]);
    } else {
      setSelectedTravellers(travellers.map((t) => t.travellerID));
    }
  };

  const isAllSelected =
    selectedTravellers.length === travellers.length && travellers.length > 0;
  const isSomeSelected =
    selectedTravellers.length > 0 && selectedTravellers.length < travellers.length;

  const selectAllHeaderCheckbox = renderSelectCheckbox(
    "header-select-travellers",
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

  const renderSource = (source: TravellerSource) => {
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

  const fetchTravellers = async () => {
    try {
      if (activeTab === "Deleted") {
        const data = await getTravellers({ isDeleted: true });
        setTravellers(data.map(mapTravellerToRow));
        return;
      }

      const data = await getTravellers({ isDeleted: false });
      setTravellers(data.map(mapTravellerToRow));
    } catch (err) {
      console.error("Failed to fetch travellers:", err);
      setTravellers([]);
    }
  };

  useEffect(() => {
    fetchTravellers();
  }, [activeTab]);

  const handleTravellerRowClick = async (row: TravellerRow) => {
    if (selectMode) return;

    try {
      const traveller = await getTravellerById(row._id);
      setSelectedTravellerFull(traveller);
      setSelectedTravellerRow(row);
      setTravellerMode("view");
      setIsTravellerSheetOpen(true);
    } catch (e) {
      console.error("Failed to fetch traveller:", e);
      setSelectedTravellerFull(row);
      setSelectedTravellerRow(row);
      setTravellerMode("view");
      setIsTravellerSheetOpen(true);
    }
  };

  const activeTravellersAction = (row: TravellerRow) => [
    {
      label: "Edit",
      icon: <FaRegEdit size={14} />,
      color: "text-[#126ACB]",
      onClick: async () => {
        try {
          const traveller = await getTravellerById(row._id);
          setSelectedTravellerFull(traveller);
          setSelectedTravellerRow(row);
          setTravellerMode("edit");
          setIsTravellerSheetOpen(true);
        } catch (e) {
          console.error("Failed to fetch traveller for edit:", e);
        }
      },
    },
    {
      label: "Delete",
      icon: <FaRegTrashAlt size={14} />,
      color: "text-red-600",
      confirmDeleteId: row.travellerID,
      onClick: async () => {
        await deleteTraveller(row._id);
        fetchTravellers();
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
          profileType: "Traveller",
          id: row.travellerID,
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
      confirmDuplicateId: row.travellerID,
      onClick: async () => {
        try {
          const traveller = await getTravellerById(row._id);
          const newCustomId = generateCustomId("traveller");
          setGeneratedTravellerCode(newCustomId);
          setSelectedTravellerFull({
            ...traveller,
            _id: undefined,
            customId: newCustomId,
          });
          setSelectedTravellerRow(row);
          setTravellerMode("create");
          setIsTravellerSheetOpen(true);
        } catch (e) {
          console.error("Failed to duplicate traveller:", e);
        }
      },
    },
  ];

  const deletedTravellersAction = (row: TravellerRow) => [
    {
      label: "Resolve",
      icon: <FaRegEdit size={14} />,
      color: "text-[#126ACB]",
      onClick: async () => {
        await restoreTraveller(row._id);
        fetchTravellers();
      },
    },
  ];

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      filteredTravellers.map((row, index) => {
        const cells: JSX.Element[] = [];

        if (selectMode) {
          const isSelected = selectedTravellers.includes(row.travellerID);

          cells.push(
            <td key={`select-${index}`} className="px-4 py-3 text-center">
              {renderSelectCheckbox(
                `traveller-select-${row.travellerID}`,
                isSelected,
                () => {
                  setSelectedTravellers((prev) =>
                    isSelected
                      ? prev.filter((id) => id !== row.travellerID)
                      : [...prev, row.travellerID],
                  );
                },
              )}
            </td>,
          );
        }

        cells.push(
          <td
            key={`travellerID-${index}`}
            className="h-[4rem] px-4 py-3 text-center align-middle text-[#020202]"
          >
            {row.travellerID}
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
                {activeTab === "Travellers" && (
                  <button
                    type="button"
                    className={`${BOOKING_HISTORY_ACTION_BUTTON_CLASS} ${ROW_HOVER_ACTION_CLASS}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void openHistoryForTraveller(row);
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
                    activeTab === "Travellers"
                      ? activeTravellersAction(row)
                      : deletedTravellersAction(row)
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
    [filteredTravellers, selectMode, selectedTravellers, activeTab],
  );

  const selectedDeletables: DeletableItem[] = useMemo(() => {
    const rowById = new Map(travellers.map((t) => [t.travellerID, t]));

    return selectedTravellers
      .map((id) => rowById.get(id))
      .filter((t): t is TravellerRow => Boolean(t))
      .map((t) => ({
        id: t.travellerID,
        mongoId: t._id,
        name: t.name,
        ...(t.subtitle ? { subtitle: t.subtitle } : {}),
        source: t.source,
        rating: Number(t.tier),
        dateModified: t.dateModified,
      }));
  }, [travellers, selectedTravellers]);

  const totalCount = travellers.length;

  const tableSharedProps = {
    columnIconMap,
    onHeaderIconClick: handleHeaderIconClick,
    headerIconClickableColumns: ["Name", "Source"] as string[],
    headerDropdownMap,
    showCheckboxColumn: selectMode,
    headerCheckbox: selectMode ? selectAllHeaderCheckbox : undefined,
    onSort: handleSort,
    categoryName: "Travellers" as const,
    initialRowsPerPage: 10,
    maxRowsPerPageOptions: [10, 20, 50, 100],
    headerClassName: "bg-[#F3F3F3]",
    headerRowTextClassName: "text-[#818181]",
    headerCellTextClassName: "text-[#818181]",
    headerAlign: {
      "Traveller ID": "center" as const,
      Name: "center" as const,
      Source: "center" as const,
      Tier: "center" as const,
      "Last Modified": "center" as const,
      Actions: "center" as const,
    },
    columnWidthClassMap: {
      "Traveller ID": "w-[8rem]",
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
          <DirectoryPeopleTabs
            tabs={TRAVELLER_PAGE_TABS}
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
                    callback={fetchTravellers}
                    entity="traveller"
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
                  rootRef={moreActionsRef}
                />
              </div>
            )}

            {activeTab === "Travellers" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTravellerFull(null);
                  setSelectedTravellerRow(null);
                  setTravellerMode("create");
                  setIsTravellerSheetOpen(true);
                }}
                className="cursor-pointer rounded-[14px] bg-[#7135AD] px-[14px] py-[8px] text-[14px] font-[500] text-white"
              >
                + Add Traveller
              </button>
            )}
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
                  <span>{searchBy === "name" ? "Name" : "Traveller ID"}</span>
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
                      { value: "travellerId", label: "Traveller ID" },
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

            <div className="flex shrink-0 items-center gap-[20px]">
              {activeTab === "Travellers" && (
                <DirectoryTravellersToggle isTravellersView={true} />
              )}

              <TotalCountPill count={totalCount} />
            </div>
          </div>

          <div className="mt-4 flex min-h-0 flex-1 flex-col px-5 pb-0 pt-[4px]">
            <Table
              data={tableData}
              columns={columns}
              {...tableSharedProps}
              {...(selectMode
                ? {}
                : {
                    onRowClick: (index: number) => {
                      const row = filteredTravellers[index];
                      if (!row) return;
                      handleTravellerRowClick(row);
                    },
                  })}
            />
          </div>
        </div>
      </div>

      {isTravellerSheetOpen && (
        <BookingProvider>
          <AddNewTravellerForm
            isOpen={isTravellerSheetOpen}
            onClose={() => {
              setIsTravellerSheetOpen(false);
              setSelectedTravellerFull(null);
              setSelectedTravellerRow(null);
              setTravellerMode("create");
              setGeneratedTravellerCode("");
              fetchTravellers();
            }}
            mode={travellerMode}
            data={selectedTravellerFull}
            travellerCode={generatedTravellerCode}
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
          bookings={bookingHistory}
          recordName={selectedTravellerRow?.name || "—"}
          recordId={selectedTravellerRow?.travellerID || "—"}
          categoryName="travellers"
        />
      )}
    </div>
  );
};

export default TravellerDirectory;
