"use client";

import React, { useMemo, useState } from "react";
import Table from "../../../../components/Table";
import DropDown from "../../../../components/DropDown";
import AvatarToolTip from "../../../../components/AvatarToolTip";
import ActionMenu from "../../../../components/Menus/ActionMenu";
import CreateTeamSidesheet from "../../../../components/Sidesheets/CreateTeamSidesheet";
import {
  getMakerCheckerGroups,
  updateMakerCheckerGroup,
  deleteMakerCheckerGroup,
} from "@/services/makerCheckerApi";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

const getShortName = (name?: string | null): string => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return (parts[0] || "").slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
};

interface Team {
  _id?: string;
  id: string;
  name: string;
  checkers: { id: string; name: string }[];
  makers: { id: string; name: string }[];
  active: boolean;
}

const columns = ["Team Name", "Checkers", "Makers", "Team Status", "Actions"];

export default function Approvals(): React.ReactElement {
  const [activeTab, setActiveTab] = useState("Bookings");
  const [teams, setTeams] = useState<Team[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // deterministic border + text color picker for avatars (applies to short form only)
  const BORDER_COLOR_PAIRS = [
    "border-blue-400 text-blue-700",
    "border-green-400 text-green-700",
    "border-yellow-400 text-yellow-700",
    "border-purple-400 text-purple-700",
    "border-red-400 text-red-700",
    "border-pink-400 text-pink-700",
    "border-cyan-400 text-cyan-700",
    "border-orange-400 text-orange-700",
    "border-lime-400 text-lime-700",
  ] as const;

  const getColorForId = (id: string | number | undefined, idx: number) => {
    if (!id)
      return BORDER_COLOR_PAIRS[idx % BORDER_COLOR_PAIRS.length] as string;
    const s = String(id);
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % BORDER_COLOR_PAIRS.length;
    return BORDER_COLOR_PAIRS[index] as string;
  };

  const tableData = useMemo<React.ReactNode[][]>(() => {
    return teams.map((t) => {
      const row: React.ReactNode[] = [];

      row.push(
        <td key={`name-${t.id}`} className="px-6 py-4">
          <div className="font-medium">{t.name}</div>
        </td>
      );

      row.push(
        <td key={`checkers-${t.id}`} className="px-6 py-4 text-center">
          <div className="inline-flex items-center">
            {t.checkers.map((u, idx) => (
              <AvatarToolTip
                key={u.id}
                short={getShortName(u.name)}
                full={u.name}
                color={getColorForId(u.id, idx)}
              />
            ))}
          </div>
        </td>
      );

      row.push(
        <td key={`makers-${t.id}`} className="px-6 py-4 text-center">
          <div className="inline-flex items-center">
            {t.makers.map((u, idx) => (
              <AvatarToolTip
                key={u.id}
                short={getShortName(u.name)}
                full={u.name}
                color={getColorForId(u.id, idx)}
              />
            ))}
          </div>
        </td>
      );

      row.push(
        <td key={`status-${t._id ?? t.id}`} className="px-6 py-4 text-center">
          <div className="inline-flex items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[12px] font-semibold ${
                t.active
                  ? "bg-[#F0FDF4] text-[#15803D]"
                  : "bg-[#FEE2E2] text-[#991B1B]"
              }`}
            >
              {t.active ? "Active" : "Inactive"}
            </span>

            <DropDown
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              value={t.active ? "Active" : "Inactive"}
              onChange={(v) => {
                void updateMakerCheckerGroup(
                  t._id ?? t.id,
                  { active: v === "Active" },
                  fetchGroups
                );
              }}
              customWidth="w-8"
              menuWidth="w-[216px]"
              noBorder={true}
              iconOnly={true}
              placeholder="Change status"
              menuCentered={true}
            />
          </div>
        </td>
      );

      row.push(
        <td key={`actions-${t._id ?? t.id}`} className="px-6 py-4 text-center">
          <ActionMenu
            right="right-23"
            width="w-23"
            actions={[
              {
                label: "Delete",
                icon: <FiTrash2 />,
                color: "text-red-600",
                onClick: async () => {
                  if (!confirm("Delete team? This action cannot be undone."))
                    return;
                  try {
                    await deleteMakerCheckerGroup(t._id ?? t.id);
                    await fetchGroups();
                  } catch (err) {
                    console.error("Failed to delete team:", err);
                  }
                },
              },
            ]}
          />
        </td>
      );

      return row;
    });
  }, [teams]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await getMakerCheckerGroups(
        activeTab === "Bookings" ? "booking" : "finance"
      );
      const list = res?.groups || res?.data || res || [];
      setTeams(list);
    } catch (err) {
      console.error("Failed to load maker-checker groups", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  React.useEffect(() => {
    void fetchGroups();
  }, [activeTab]);

  return (
    <div>
      <h2 className="text-[15px] font-[600] mb-[12px]">Approvals</h2>

      <div className="mb-[14px]">
        <nav className="flex gap-2 relative" role="tablist">
          <span
            className="absolute bottom-[2px] h-[2px] bg-[#0D4B37] transition-all duration-300 ease-out"
            style={{
              width: activeTab === "Bookings" ? "72px" : "56px",
              transform:
                activeTab === "Bookings"
                  ? "translateX(0px)"
                  : "translateX(94px)",
            }}
          />
          <button
            onClick={() => setActiveTab("Bookings")}
            className={`px-1 py-1.5 text-[14px] font-[400] transition-colors duration-300 relative ${
              activeTab === "Bookings"
                ? "text-[#0D4B37]"
                : "text-gray-500 hover:text-gray-700 font-[500]"
            }`}
            role="tab"
            aria-selected={activeTab === "Bookings"}
          >
            Bookings
          </button>

          <button
            onClick={() => setActiveTab("Finance")}
            className={`px-4 py-1.5 text-[14px] font-[400] transition-colors duration-300 relative ${
              activeTab === "Finance"
                ? "text-[#0D4B37]"
                : "text-gray-500 hover:text-gray-700 font-[500]"
            }`}
            role="tab"
            aria-selected={activeTab === "Finance"}
          >
            Finance
          </button>
        </nav>
      </div>

      {/* Divider line below tabs */}
      <div className="absolute top-28 left-59 right-10 z-10 border-b border-gray-200"></div>

      <div className="rounded-lg bg-white p-0 -mt-3">
        <div className="px-0 py-3 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-[#818181]">
              Here is the list of all the teams for {activeTab}
            </div>
          </div>

          <div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-[14px] py-[6px] text-[14px] font-[500] leading-5 bg-[#0D4B37] text-white rounded-md"
            >
              + Create Team
            </button>
          </div>
        </div>

        <div className="px-0">
          <Table
            data={tableData}
            columns={columns}
            headerClassName="bg-[#0D4B37]"
            categoryName="Teams"
          />
        </div>
        <CreateTeamSidesheet
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={async (_payload) => {
            await fetchGroups();
            setIsCreateOpen(false);
          }}
        />
      </div>
    </div>
  );
}
