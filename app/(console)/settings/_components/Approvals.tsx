"use client";

import React, { useMemo, useState } from "react";
import Table from "../../../../components/Table";
import DropDown from "../../../../components/DropDown";
import AvatarToolTip from "../../../../components/AvatarToolTip";
import ActionMenu from "../../../../components/Menus/ActionMenu";
import CreateTeamSidesheet from "../../../../components/Sidesheets/CreateTeamSidesheet";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

interface Team {
  id: string;
  name: string;
  checkers: { id: string; name: string }[];
  makers: { id: string; name: string }[];
  status: "Active" | "Inactive";
}

const columns = ["Team Name", "Checkers", "Makers", "Team Status", "Actions"];

const sampleTeams: Team[] = [
  {
    id: "t1",
    name: "Team 1",
    checkers: [{ id: "u1", name: "YM" }],
    makers: [
      { id: "u2", name: "AS" },
      { id: "u3", name: "VG" },
    ],
    status: "Inactive",
  },
  {
    id: "t2",
    name: "Team 2",
    checkers: [{ id: "u2", name: "VG" }],
    makers: [
      { id: "u2", name: "AS" },
      { id: "u4", name: "AK" },
      { id: "u5", name: "SR" },
      { id: "u3", name: "VG" },
    ],
    status: "Active",
  },
  {
    id: "t3",
    name: "Team 3",
    checkers: [{ id: "u1", name: "YM" }],
    makers: [
      { id: "u4", name: "AK" },
      { id: "u5", name: "SR" },
      { id: "u3", name: "VG" },
    ],
    status: "Active",
  },
];

export default function Approvals(): React.ReactElement {
  const [activeTab, setActiveTab] = useState("Bookings");
  const [teams, setTeams] = useState<Team[]>(sampleTeams);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
                short={u.name}
                full={u.name}
                color={idx % 2 === 0 ? "border-[#FCA5A5]" : "border-[#BFDBFE]"}
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
                short={u.name}
                full={u.name}
                color={idx % 2 === 0 ? "border-[#FCA5A5]" : "border-[#BFDBFE]"}
              />
            ))}
          </div>
        </td>
      );

      row.push(
        <td key={`status-${t.id}`} className="px-6 py-4 text-center">
          <div className="inline-flex items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[12px] font-semibold ${
                t.status === "Active"
                  ? "bg-[#F0FDF4] text-[#15803D]"
                  : "bg-[#FEE2E2] text-[#991B1B]"
              }`}
            >
              {t.status}
            </span>

            <DropDown
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              value={t.status}
              onChange={(v) => {
                setTeams((prev) =>
                  prev.map((p) =>
                    p.id === t.id ? { ...p, status: v as Team["status"] } : p
                  )
                );
              }}
              customWidth="w-8"
              menuWidth="w-[140px]"
              noBorder={true}
              iconOnly={true}
              placeholder="Change status"
            />
          </div>
        </td>
      );

      row.push(
        <td key={`actions-${t.id}`} className="px-6 py-4 text-center">
          <ActionMenu
            right="right-23"
            width="w-23"
            actions={[
              {
                label: "Delete",
                icon: <FiTrash2 />,
                color: "text-red-600",
                onClick: () => {
                  console.log("Delete team:", t.id);
                },
              },
            ]}
          />
        </td>
      );

      return row;
    });
  }, [teams]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-semibold">Approvals</h2>
        </div>
      </div>

      <div className="mb-3 -mt-2 -ml-2">
        <nav className="flex gap-2 relative" role="tablist">
          <button
            onClick={() => setActiveTab("Bookings")}
            className={`px-4 py-1.5 text-[14px] font-medium transition-colors relative ${
              activeTab === "Bookings"
                ? "text-[#0D4B37]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            role="tab"
            aria-selected={activeTab === "Bookings"}
          >
            Bookings
            {activeTab === "Bookings" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-[#0D4B37] z-20"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("Finance")}
            className={`px-4 py-1.5 text-[14px] font-medium transition-colors relative ${
              activeTab === "Finance"
                ? "text-[#0D4B37]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            role="tab"
            aria-selected={activeTab === "Finance"}
          >
            Finance
            {activeTab === "Finance" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-[#0D4B37] z-20"></span>
            )}
          </button>
        </nav>
      </div>

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
              className="px-4 py-2 text-[14px] font-semibold leading-5 bg-[#0D4B37] text-white rounded-md"
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
          onCreate={(payload) => {
            const newTeam: Team = {
              id: String(Date.now()),
              name: payload.teamName || "New Team",
              checkers: [],
              makers: [],
              status: (payload.teamStatus as Team["status"]) || "Active",
            };
            setTeams((prev) => [newTeam, ...prev]);
            setIsCreateOpen(false);
          }}
        />
      </div>
    </div>
  );
}
