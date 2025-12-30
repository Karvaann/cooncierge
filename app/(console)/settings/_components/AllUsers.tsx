"use client";

import React, { useMemo, useState, useEffect } from "react";
import { getUsers } from "@/services/userApi";
import Table from "../../../../components/Table";
import DropDown from "../../../../components/DropDown";
import AvatarToolTip from "../../../../components/AvatarToolTip";
import AddUserSidesheet from "../../../../components/Sidesheets/AddUserSidesheet";
import CreateRoleModal from "../../../../components/Modals/CreateRoleModal";
import ActivateusersModal from "../../../../components/Modals/ActivateusersModal";
import ActionMenu from "../../../../components/Menus/ActionMenu";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import type { JSX } from "react";

const columns = ["Name", "Mobile", "Email", "Role", "User Status", "Actions"];

const roleColumns = ["Role", "Users", "Access Level", "Actions"];

// users will be fetched from backend

const sampleRoles = [
  {
    id: "r1",
    role: "Operations",
    users: [
      { id: "1", name: "AS", fullName: "Abhishek Singh" },
      { id: "2", name: "VG", fullName: "Vikram Gupta" },
    ],
    access: "Limited Access",
  },
  {
    id: "r2",
    role: "Admin",
    users: [{ id: "3", name: "YM", fullName: "Yash Manocha" }],
    access: "Admin Access",
  },
  {
    id: "r3",
    role: "Sales",
    users: [{ id: "2", name: "VG", fullName: "Vikram Gupta" }],
    access: "Limited Access",
  },
];

export default function AllUsers(): JSX.Element {
  const [activeTab, setActiveTab] = useState("All Users");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await getUsers();

        const list = res?.data || [];
        if (!mounted) return;
        const mapped = list.map((u: any) => ({
          id: u._id || u.id,
          name:
            u.name ||
            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            u.email ||
            "-",
          mobile:
            u.phoneCode && u.mobile
              ? `${u.phoneCode}-${u.mobile}`
              : u.mobile || u.mobileNumber || "",
          email: u.email || "",
          role:
            (u.roleId && (u.roleId.roleName || u.roleId.name)) || u.role || "",
          status: u.isActive === false ? "Inactive" : "Active",
        }));
        setUsers(mapped);
      } catch (e) {
        console.error("Failed to load users", e);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const rolesTableData = useMemo<React.ReactNode[][]>(() => {
    return sampleRoles.map((r) => {
      const row: JSX.Element[] = [];

      row.push(
        <td key={`role-${r.id}`} className="px-6 py-4">
          <div className="font-medium">{r.role}</div>
        </td>
      );

      row.push(
        <td key={`users-${r.id}`} className="px-6 py-4 text-center">
          <div className="inline-flex items-center">
            {r.users.map((u, idx) => (
              <AvatarToolTip
                key={u.id}
                short={u.name}
                full={u.fullName}
                color={idx % 2 === 0 ? "border-[#FCA5A5]" : "border-[#BFDBFE]"}
              />
            ))}
          </div>
        </td>
      );

      row.push(
        <td key={`access-${r.id}`} className="px-6 py-4 text-center">
          <span
            className={`px-3 py-1 rounded-full text-[12px] font-semibold ${
              r.access === "Admin Access"
                ? "bg-[#E1E5FF] text-[#4056E5]"
                : "bg-[#FEF9C3] text-[#854D0E]"
            }`}
          >
            {r.access}
          </span>
        </td>
      );

      row.push(
        <td key={`actions-role-${r.id}`} className="px-6 py-4 text-center">
          <ActionMenu
            actions={[
              {
                label: "Edit Role",
                icon: <MdOutlineEdit />,
                color: "text-blue-600",
                onClick: () => setIsCreateRoleOpen(true),
              },
              {
                label: "Delete",
                icon: <FaRegTrashAlt />,
                color: "text-red-600",
                onClick: () => {
                  console.log("delete role", r.id);
                },
              },
            ]}
            width="w-21"
            right="right-29"
          />
        </td>
      );

      return row;
    });
  }, []);

  const tableData = useMemo<React.ReactNode[][]>(() => {
    return users.map((u) => {
      const row: JSX.Element[] = [];

      row.push(
        <td key={`name-${u.id}`} className="px-6 py-4">
          <div className="font-medium">{u.name}</div>
        </td>
      );

      row.push(
        <td key={`mobile-${u.id}`} className="px-6 py-4 text-center">
          {u.mobile}
        </td>
      );

      row.push(
        <td key={`email-${u.id}`} className="px-6 py-4 text-center">
          {u.email}
        </td>
      );

      row.push(
        <td key={`role-${u.id}`} className="px-6 py-4 text-center">
          <div className="inline-flex items-center gap-2 justify-center">
            <span>{u.role}</span>
            <DropDown
              options={[
                { value: "Admin", label: "Admin" },
                { value: "Operations", label: "Operations" },
                { value: "Sales", label: "Sales" },
                { value: "Finance", label: "Finance" },
              ]}
              value={u.role}
              onChange={(v) =>
                setUsers((prev) =>
                  prev.map((p) => (p.id === u.id ? { ...p, role: v } : p))
                )
              }
              className=""
              customWidth="w-8"
              menuWidth="w-[310px]"
              noBorder={true}
              iconOnly={true}
              placeholder="Change role"
            />
          </div>
        </td>
      );

      row.push(
        <td key={`status-${u.id}`} className="px-6 py-4 text-center">
          <div className="inline-flex items-center gap-2 justify-center">
            <span
              className={`px-3 py-1 rounded-full text-[12px] font-semibold ${
                u.status === "Active"
                  ? "bg-[#F0FDF4] text-[#15803D]"
                  : "bg-[#FEE2E2] text-[#991B1B]"
              }`}
            >
              {u.status}
            </span>
            <DropDown
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              value={u.status}
              onChange={(v) =>
                setUsers((prev) =>
                  prev.map((p) => (p.id === u.id ? { ...p, status: v } : p))
                )
              }
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
        <td key={`actions-${u.id}`} className="px-6 py-4 text-center">
          <ActionMenu
            actions={[
              {
                label: "Edit",
                icon: <MdOutlineEdit />,
                color: "text-blue-600",
                onClick: () => {
                  setEditingUser({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    mobile: u.mobile,
                    role: u.role,
                    status: u.status,
                  });
                  setIsAddOpen(true);
                },
              },
              {
                label: "Delete",
                icon: <FaRegTrashAlt />,
                color: "text-red-600",
                onClick: () => {
                  setUsers((prev) => prev.filter((p) => p.id !== u.id));
                },
              },
            ]}
            width="w-21"
            right="right-14"
          />
        </td>
      );

      return row;
    });
  }, [users]);

  return (
    <div>
      <h2 className="text-[15px] font-[600] mb-[12px]">All Users / Roles</h2>

      <div className="mb-[14px]">
        <nav className="flex gap-2 relative" role="tablist">
          <button
            onClick={() => setActiveTab("All Users")}
            className={`px-1 py-1.5 text-[14px] font-[400] transition-colors relative ${
              activeTab === "All Users"
                ? "text-[#0D4B37]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            role="tab"
            aria-selected={activeTab === "All Users"}
          >
            All Users
            {activeTab === "All Users" && (
              <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[100%] h-[2px] bg-[#0D4B37] z-20"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("Roles & Permissions")}
            className={`px-4 py-1.5 text-[14px] font-[400] transition-colors relative ${
              activeTab === "Roles & Permissions"
                ? "text-[#0D4B37]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            role="tab"
            aria-selected={activeTab === "Roles & Permissions"}
          >
            Roles & Permissions
            {activeTab === "Roles & Permissions" && (
              <span className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[100%] h-[2px] bg-[#0D4B37] z-20"></span>
            )}
          </button>
        </nav>
      </div>

      <div className="rounded-lg bg-white p-0 -mt-3">
        <div className="px-0 py-3 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-[#818181]">
              {activeTab === "Roles & Permissions"
                ? "Here is the list of roles & permissions of all the users"
                : "Here is the list of all the users and their details"}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-[10px]">
            {activeTab === "Roles & Permissions" ? (
              <button
                onClick={() => setIsCreateRoleOpen(true)}
                className="px-[14px] py-[6px] text-[14px] font-[500] leading-5 bg-[#0D4B37] text-white rounded-md"
              >
                + Add New Role
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsActivateModalOpen(true)}
                  className="px-[14px] py-[6px] text-[14px] font-[500] leading-5 border border-[#4CA640] text-[#4CA640] rounded-md bg-[#4CA6401A]"
                >
                  Activate (1 Left)
                </button>
                <button
                  onClick={() => setIsDeactivateModalOpen(true)}
                  className="px-[14px] py-[6px] text-[14px] font-[500] leading-5 border border-[#DD1425] text-[#DD1425] rounded-md bg-[#DD14251A]"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-[14px] py-[6px] text-[14px] font-[500] leading-5 bg-[#0D4B37] text-white rounded-md"
                >
                  + Add User
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-0">
          {activeTab === "Roles & Permissions" ? (
            <Table
              data={rolesTableData}
              columns={roleColumns}
              headerClassName="bg-[#0D4B37]"
              categoryName="Users"
            />
          ) : (
            <Table
              data={tableData}
              columns={columns}
              headerClassName="bg-[#0D4B37]"
              categoryName="Users"
            />
          )}
        </div>
        <AddUserSidesheet
          isOpen={isAddOpen}
          onClose={() => {
            setIsAddOpen(false);
            setEditingUser(null);
          }}
          initialData={editingUser || undefined}
          isEdit={!!editingUser}
          onAddUser={(payload) => {
            const newUser = {
              id: String(Date.now()),
              name: payload.fullName || payload.name || "New User",
              mobile: `${payload.countryCode || "+91"}-${payload.mobile || ""}`,
              email: payload.email || "",
              role: payload.role || payload.roleId || "",
              status: payload.userStatus || "Active",
            };
            setUsers((prev) => [newUser, ...prev]);
            setIsAddOpen(false);
            setEditingUser(null);
          }}
          onUpdateUser={(payload) => {
            const id = payload._id || payload.id || editingUser?.id;
            setUsers((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      id: id,
                      name: payload.name || payload.fullName || p.name,
                      mobile:
                        payload.phoneCode && payload.mobile
                          ? `${payload.phoneCode}-${payload.mobile}`
                          : payload.mobile || p.mobile,
                      email: payload.email || p.email,
                      role:
                        (payload.roleId &&
                          (payload.roleId.roleName || payload.roleId.name)) ||
                        payload.role ||
                        p.role,
                      status:
                        payload.isActive === false
                          ? "Inactive"
                          : payload.status || p.status,
                    }
                  : p
              )
            );
            setIsAddOpen(false);
            setEditingUser(null);
          }}
        />

        <CreateRoleModal
          isOpen={isCreateRoleOpen}
          onClose={() => setIsCreateRoleOpen(false)}
          onContinue={(payload) => {
            // For now, simply close the modal. Implement role creation handling later.
            setIsCreateRoleOpen(false);
          }}
        />
        <ActivateusersModal
          open={isActivateModalOpen}
          onClose={() => setIsActivateModalOpen(false)}
          users={users}
          onActivate={(ids) => {
            setUsers((prev) =>
              prev.map((u) =>
                ids.includes(u.id) ? { ...u, status: "Active" } : u
              )
            );
          }}
        />

        <ActivateusersModal
          open={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          users={users}
          deactivate={true}
          onDeactivate={(ids) => {
            setUsers((prev) =>
              prev.map((u) =>
                ids.includes(u.id) ? { ...u, status: "Inactive" } : u
              )
            );
          }}
        />
      </div>
    </div>
  );
}
