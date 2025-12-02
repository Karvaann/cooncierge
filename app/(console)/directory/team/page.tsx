"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import TableSkeleton from "@/components/skeletons/TableSkeleton";
import ActionMenu from "@/components/Menus/ActionMenu";
import { FiSearch } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { HiArrowsUpDown } from "react-icons/hi2";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { getTeams, deleteTeam } from "@/services/teamsApi";
import type { JSX } from "react";
import AddTeamSideSheet from "@/components/Sidesheets/AddTeamSideSheet";
import SelectUploadMenu from "@/components/Menus/SelectUploadMenu";
import DownloadMergeMenu from "@/components/Menus/DownloadMergeMenu";
import type { DeletableItem } from "@/components/Modals/DeleteModal";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import ConfirmationModal from "@/components/popups/ConfirmationModal";
import { MdHistory } from "react-icons/md";

const Table = dynamic(() => import("@/components/Table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
});

type TeamRow = {
  ID: string;
  memberName: string;
  alias: string;
  userStatus: string;
  joiningDate: string;
  actions: React.ComponentType<any> | string;
};

const columns: string[] = [
  "ID",
  "Member Name",
  "Alias",
  "User Status",
  "Joining Date",
  "Actions",
];

const columnIconMap: Record<string, JSX.Element> = {
  "Member Name": <CiFilter className="inline w-3 h-3 text-white stroke-[1]" />,
  "User Status": <CiFilter className="inline w-3 h-3 text-white stroke-[1]" />,
  "Joining Date": (
    <HiArrowsUpDown className="inline w-3 h-3 text-white stroke-[1]" />
  ),
};

// const customerTableSeed: CustomerRow[] = [
//   {
//     customerID: "#C001",
//     name: "Amit Verma",
//     owner: "Riya Kapoor",
//     rating: "⭐️⭐️⭐️⭐️",
//     dateCreated: "05-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C002",
//     name: "Neha Gupta",
//     owner: "Arjun Mehta",
//     rating: "⭐️⭐️⭐️⭐️⭐️",
//     dateCreated: "10-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C003",
//     name: "Suresh Raina",
//     owner: "Priya Nair",
//     rating: "⭐️⭐️⭐️",
//     dateCreated: "15-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C004",
//     name: "Anjali Sharma",
//     owner: "Karan Malhotra",
//     rating: "⭐️⭐️⭐️⭐️",
//     dateCreated: "20-09-2025",
//     actions: "⋮",
//   },
//   {
//     customerID: "#C005",
//     name: "Rohit Yadav",
//     owner: "Sneha Joshi",
//     rating: "⭐️⭐️⭐️⭐️⭐️",
//     dateCreated: "25-09-2025",
//     actions: "⋮",
//   },
// ];

const TeamDirectory = () => {
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Current");
  const [searchValue, setSearchValue] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const tabOptions = ["Current", "Former", "Deleted"];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuMode, setMenuMode] = useState<"main" | "action">("main");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const filteredTeams = useMemo(() => {
    if (!searchValue.trim()) return teams;

    const search = searchValue.toLowerCase();

    return teams.filter(
      (t) =>
        (t.ID || "").toLowerCase().includes(search) ||
        (t.memberName || "").toLowerCase().includes(search) ||
        (t.alias || "").toLowerCase().includes(search)
    );
  }, [teams, searchValue]);

  const handleSort = (column: string) => {
    const sorted = [...teams];

    if (column === "Joining Date") {
      sorted.reverse();
    }

    setTeams(sorted);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => setIsMenuOpen(false);

  const handleOpenConfirmDeleteModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleSelectClick = () => {
    setSelectMode(true);
    setMenuMode("action"); // switch to new action menu

    setIsMenuOpen(false); // Close current menu once
  };

  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedTeamMembers([]);
    setMenuMode("main"); // ✅ Revert menu to SelectUploadMenu
  };

  // Handle Delete Team Member
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteTeam(userId);
      // Refresh your user list or remove from state
      // Example: setUsers(users.filter(u => u.id !== userId));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      throw error;
    }
  };

  const formatDMY = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchTeamsData = async () => {
      try {
        const teamsResponse = await getTeams();

        console.log("Fetched teams list:", teamsResponse);

        const teamArray = Array.isArray(teamsResponse) ? teamsResponse : [];

        const mappedRows: TeamRow[] = teamArray.map((u: any, index: number) => {
          const fullName = u.name || "—";
          const alias = u.alias || "—";

          return {
            ...u,
            ID: u._id || `#T00${index + 1}`,
            memberName: fullName,
            alias: alias,
            userStatus: u.userStatus || u.status || "Active",
            joiningDate: u.dateOfJoining ? formatDMY(u.dateOfJoining) : "—",
            actions: "⋮",
          };
        });

        setTeams(mappedRows);
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      }
    };

    fetchTeamsData();
  }, []);

  const tableData = useMemo<JSX.Element[][]>(
    () =>
      filteredTeams.map((row, index) => {
        const cells: JSX.Element[] = [];

        // Checkbox column when selectMode is ON
        if (selectMode) {
          const isSelected = selectedTeamMembers.includes(row.ID);

          cells.push(
            <td key={`select-${index}`} className="px-4 py-3 text-center">
              <div className="flex items-center justify-center">
                {/* Hidden checkbox */}
                <input
                  type="checkbox"
                  id={`select-${row.ID}`}
                  className="hidden peer"
                  checked={isSelected}
                  onChange={() => {
                    setSelectedTeamMembers((prev) =>
                      isSelected
                        ? prev.filter((id) => id !== row.ID)
                        : [...prev, row.ID]
                    );
                  }}
                />

                {/* Styled label */}
                <label
                  htmlFor={`select-${row.ID}`}
                  className={`w-5 h-5 border border-gray-400 rounded-md flex items-center justify-center cursor-pointer 
          `}
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="11"
                      viewBox="0 0 12 11"
                      fill="none"
                    >
                      <path
                        d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                        stroke="#0D4B37"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </label>
              </div>
            </td>
          );
        }

        // Normal Table Fields
        cells.push(
          <td key={`ID-${index}`} className="px-4 py-3 text-center">
            {row.ID}
          </td>,
          <td key={`memberName-${index}`} className="px-4 py-3  text-center">
            {row.memberName}
          </td>,
          <td key={`alias-${index}`} className="px-4 py-3  text-center">
            {row.alias}
          </td>,
          <td key={`userStatus-${index}`} className="px-4 py-3  text-center">
            {row.userStatus}
          </td>,
          <td key={`joiningDate-${index}`} className="px-4 py-3  text-center">
            {row.joiningDate}
          </td>,

          // Action Menu
          <td key={`actions-${index}`} className="px-4 py-3 text-center pr-3">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-md text-[0.75rem] font-medium border border-gray-200 hover:bg-gray-200"
                onClick={() => setIsHistoryOpen(true)}
              >
                <MdHistory className="inline mr-1" size={14} />
                Booking History
              </button>
              <ActionMenu
                actions={[
                  {
                    label: "Edit",
                    icon: <FaRegEdit />,
                    color: "text-green-600",
                    onClick: () => {
                      setSelectedTeam(row); // full row data
                      setIsSideSheetOpen(true);
                      setMode("edit");
                    },
                  },
                  {
                    label: "Delete",
                    icon: <FaRegTrashAlt />,
                    color: "text-red-600",
                    onClick: () => {
                      setSelectedTeam(row);
                      handleOpenConfirmDeleteModal();
                    },
                  },
                ]}
              />
            </div>
          </td>
        );

        return cells;
      }),
    [filteredTeams, selectMode, selectedTeamMembers]
  );

  const selectedDeletables: DeletableItem[] = useMemo(() => {
    return teams
      .filter((t) => selectedTeamMembers.includes(t.ID))
      .map((t) => ({
        id: t.ID,
        memberName: t.memberName,
        alias: t.alias,
        userStatus: t.userStatus,
        joiningDate: t.joiningDate,
      }));
  }, [teams, selectedTeamMembers]);

  return (
    <div className="bg-white rounded-2xl shadow px-3 py-2 mb-5 w-full">
      <div className="flex items-center justify-between rounded-2xl px-4 py-3">
        {/*  Tabs */}
        <div className="flex w-[18rem] -ml-2 items-center bg-[#F3F3F3] rounded-2xl space-x-4">
          {tabOptions.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-xl text-[0.85rem] font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[#0D4B37] text-white shadow-sm"
                  : "text-[#818181] hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/*  Total Count + Add Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white w-[5.5rem] border border-gray-200 rounded-xl px-2 py-1.5 mr-2">
            <span className="text-gray-600 text-[0.85rem] font-medium">
              Total
            </span>
            <span className="bg-gray-100 text-black font-semibold text-[0.85rem] px-2 mr-1 rounded-lg shadow-sm">
              {teams.length}
            </span>
          </div>
          <button
            onClick={() => setIsSideSheetOpen(true)}
            className="flex items-center text-[0.85rem] cursor-pointer gap-2 border border-green-900 text-white bg-green-900 px-3 py-1.5 rounded-md font-semibold transition-all duration-200"
            type="button"
          >
            + Add Team Member
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 mb-4 mt-2"></div>

      {/* SEARCH & SORT */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="relative w-[24rem] ">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search by Customer ID/Name/Owner"
            className="w-full text-[0.85rem] py-2 pl-4 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900 text-gray-700 bg-white"
          />

          <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-[0.85rem] pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Show these two only in select mode  selecting functionality of customer array */}
          {selectMode && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelSelectMode}
                className="px-2 py-1.5 w-[5rem] text-[0.75rem]  font-medium text-[#414141] border border-gray-200 bg-[#F9F9F9] hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedTeamMembers.length === teams.length) {
                    setSelectedTeamMembers([]); // deselect all
                  } else {
                    setSelectedTeamMembers(teams.map((c) => c.ID)); // select all
                  }
                }}
                className="px-2 py-1.5 w-[6rem] mr-3 text-[0.75rem] font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100"
              >
                {selectedTeamMembers.length === teams.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleMenuToggle}
            className="p-2 rounded-lg mr-1 border border-gray-200 bg-white hover:bg-gray-100 relative z-[30]"
          >
            <IoEllipsisHorizontal className="text-[0.85rem] text-gray-500" />
          </button>

          {/* Conditionally render menus */}
          {isMenuOpen && (
            <div
              className="
        absolute
        top-full
        right-0
        
        z-[40]
      "
              style={{ pointerEvents: "auto" }}
            >
              {menuMode === "main" ? (
                <SelectUploadMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  onSelect={handleSelectClick} // triggers the switch
                />
              ) : (
                <DownloadMergeMenu
                  isOpen={isMenuOpen}
                  onClose={handleCloseMenu}
                  entity="team"
                  items={selectedDeletables}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-screen mt-2 px-2">
        <Table
          data={tableData}
          columns={columns}
          columnIconMap={columnIconMap}
          showCheckboxColumn={selectMode}
          onSort={handleSort}
        />
      </div>
      {isSideSheetOpen && (
        <AddTeamSideSheet
          isOpen={isSideSheetOpen}
          onCancel={() => {
            setIsSideSheetOpen(false);
            setSelectedTeam(null);
            setMode("create");
          }}
          data={selectedTeam} // REQUIRED
          mode={mode}
        />
      )}

      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Are you sure you want to delete this team member? This action cannot be undone."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          confirmButtonColor="bg-red-600"
          onConfirm={() => {
            if (!selectedTeam) return;

            handleDeleteUser(selectedTeam.ID);
            setTeams((prev) => prev.filter((t) => t.ID !== selectedTeam.ID));

            setIsConfirmModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default TeamDirectory;
