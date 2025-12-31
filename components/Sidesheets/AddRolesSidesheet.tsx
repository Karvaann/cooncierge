"use client";

import React, { useState } from "react";
import { AuthApi } from "@/services/authApi";
import SideSheet from "../SideSheet";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roleName?: string;
}

const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ checked, onChange }) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onChange(!checked);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      role="switch"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-checked={checked}
      className={`inline-flex items-center justify-between w-7 h-4 rounded-full p-1 transition-colors focus:outline-none`}
      style={{ backgroundColor: checked ? "#126ACB" : "#E5E7EB" }}
    >
      <span
        className={`block bg-white rounded-full w-3 h-3 transform transition-transform`}
        style={{ transform: checked ? "translateX(12px)" : "translateX(-2px)" }}
      />
    </div>
  );
};

const SectionRow: React.FC<{
  label: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  description?: string;
}> = ({ label, checked, onToggle, description }) => (
  <div className="flex items-center justify-between px-4 py-3">
    <div>
      <div className="text-[13px] text-[#414141] font-medium">{label}</div>
      {description && (
        <div className="text-[12px] text-[#6B6B6B]">{description}</div>
      )}
    </div>
    <div>
      <Toggle checked={checked} onChange={(v: boolean) => onToggle(v)} />
    </div>
  </div>
);

const AddRolesSidesheet: React.FC<Props> = ({
  isOpen,
  onClose,
  roleName = "Sales Associate",
}) => {
  const [tab, setTab] = useState<string>("cooncierge");

  const [state, setState] = useState({
  "cooncierce": {
    "bookings": {
      "limitless": false,
      "os": false
    },
    "directory": {
      "customer": false,
      "vendor": false,
      "team": false
    }
  },
  "settings": {
    "companyDetails": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "billing": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "users": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "roles": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "approval": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "deleteAfterApproval": false,
    "noEditAfterTravelDate": false,
    "osPrimary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "osSecondary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "limitlessPrimary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "limitlessSecondary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    }
  },
  "bookings": {
    "deleteAfterApproval": false,
    "noEditAfterTravelDate": false,
    "osPrimary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "osSecondary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "limitlessPrimary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    },
    "limitlessSecondary": {
      "view": false,
      "add": false,
      "edit": false,
      "delete": false
    }
  }
});

  const [bookingsOpen, setBookingsOpen] = useState<boolean>(true);
  const [directoryOpen, setDirectoryOpen] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        roleName,
        permission: { ...state },
      };

      const res = await AuthApi.createRole(payload as any);
      if (res && (res.success || res.data)) {
        // created successfully
        onClose();
      } else {
        console.error("Create role failed", res);
      }
    } catch (e) {
      console.error("Error creating role", e);
    } finally {
      setIsSaving(false);
    }
  };

  const Row: React.FC<{
    label: string;
    viewKey: string;
    addKey?: string;
    editKey?: string;
    deleteKey?: string;
  }> = ({ label, viewKey, addKey, editKey, deleteKey }) => (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-[13px] text-[#414141]">{label}</div>
      <div className="flex items-center gap-6">
        <div className="w-12 flex justify-center">
          <input
            id={viewKey}
            type="checkbox"
            className="hidden"
            checked={!!(state as any)[viewKey]}
            onChange={() =>
              setState((s) => ({
                ...(s as any),
                [viewKey]: !(s as any)[viewKey],
              }))
            }
          />
          <label
            htmlFor={viewKey}
            className={
              "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
              ((state as any)[viewKey]
                ? "bg-[#126ACB] border-[#126ACB]"
                : "border-[#0D4B37] bg-white")
            }
          >
            {(state as any)[viewKey] && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="10"
                viewBox="0 0 11 10"
                fill="none"
              >
                <path
                  d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </label>
        </div>

        <div className="w-12 flex justify-center">
          {addKey ? (
            <>
              <input
                id={addKey}
                type="checkbox"
                className="hidden"
                checked={!!(state as any)[addKey]}
                onChange={() =>
                  setState((s) => ({
                    ...(s as any),
                    [addKey]: !(s as any)[addKey],
                  }))
                }
              />
              <label
                htmlFor={addKey}
                className={
                  "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
                  ((state as any)[addKey]
                    ? "bg-[#126ACB] border-[#126ACB]"
                    : "border-[#0D4B37] bg-white")
                }
              >
                {(state as any)[addKey] && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="10"
                    viewBox="0 0 11 10"
                    fill="none"
                  >
                    <path
                      d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </label>
            </>
          ) : (
            <div />
          )}
        </div>

        <div className="w-12 flex justify-center">
          {editKey ? (
            <>
              <input
                id={editKey}
                type="checkbox"
                className="hidden"
                checked={!!(state as any)[editKey]}
                onChange={() =>
                  setState((s) => ({
                    ...(s as any),
                    [editKey]: !(s as any)[editKey],
                  }))
                }
              />
              <label
                htmlFor={editKey}
                className={
                  "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
                  ((state as any)[editKey]
                    ? "bg-[#126ACB] border-[#126ACB]"
                    : "border-[#0D4B37] bg-white")
                }
              >
                {(state as any)[editKey] && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="10"
                    viewBox="0 0 11 10"
                    fill="none"
                  >
                    <path
                      d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </label>
            </>
          ) : (
            <div />
          )}
        </div>

        <div className="w-12 flex justify-center">
          {deleteKey ? (
            <>
              <input
                id={deleteKey}
                type="checkbox"
                className="hidden"
                checked={!!(state as any)[deleteKey]}
                onChange={() =>
                  setState((s) => ({
                    ...(s as any),
                    [deleteKey]: !(s as any)[deleteKey],
                  }))
                }
              />
              <label
                htmlFor={deleteKey}
                className={
                  "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
                  ((state as any)[deleteKey]
                    ? "bg-[#126ACB] border-[#126ACB]"
                    : "border-[#0D4B37] bg-white")
                }
              >
                {(state as any)[deleteKey] && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="11"
                    height="10"
                    viewBox="0 0 11 10"
                    fill="none"
                  >
                    <path
                      d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </label>
            </>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${roleName}  |  Permissions`}
      width="xl"
      position="right"
      showCloseButton
    >
      <div className="flex h-full" style={{ minHeight: 640 }}>
        {/* Left nav */}
        <div className="w-56 border-r border-gray-100 bg-white px-4 pt-4">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setTab("cooncierge")}
              className={`text-[13px] text-[#414141] font-medium text-left py-2 px-3 ${
                tab === "cooncierge"
                  ? "border-l-4 border-[#0D4B37] bg-[#F8FAFC]"
                  : "hover:bg-gray-50"
              }`}
            >
              Cooncierge
            </button>
            <button
              onClick={() => setTab("settings")}
              className={`text-[13px] text-[#414141] font-medium text-left py-2 px-3 ${
                tab === "settings"
                  ? "border-l-4 border-[#0D4B37] bg-[#F8FAFC]"
                  : "hover:bg-gray-50"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setTab("bookings")}
              className={`text-[13px] text-[#414141] font-medium text-left py-2 px-3 ${
                tab === "bookings"
                  ? "border-l-4 border-[#0D4B37] bg-[#F8FAFC]"
                  : "hover:bg-gray-50"
              }`}
            >
              Bookings
            </button>
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 relative bg-white">
          <div className="px-6 pt-4 pb-20">
            {/* pad bottom for save button */}
            {/* Header removed per request (no top permissions toggle) */}

            {tab === "cooncierge" && (
              <>
                {/* Bookings dropdown (no border, options on gray-400) */}
                <div className="mb-4">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setBookingsOpen((v) => !v)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[13px] text-[#414141] font-medium">
                        Bookings
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={state.bookings_master}
                        onChange={(v) => {
                          setState((s) => ({
                            ...s,
                            bookings_master: v,
                            bookings_limitless: v,
                            bookings_os: v,
                          }));
                        }}
                      />
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          setBookingsOpen((v) => !v);
                        }}
                        aria-expanded={bookingsOpen}
                        className="w-6 h-6 inline-flex items-center justify-center"
                      >
                        <svg
                          className={`w-4 h-4 transform transition-transform ${
                            bookingsOpen ? "rotate-180" : "rotate-0"
                          }`}
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 8l5 5 5-5"
                            stroke="#6B6B6B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {bookingsOpen && (
                    <div className="px-4 py-2">
                      <div className="rounded-md p-1 bg-[#F9F9F9]">
                        <SectionRow
                          label="Limitless"
                          checked={state.bookings_limitless}
                          onToggle={(v) =>
                            setState((s) => ({ ...s, bookings_limitless: v }))
                          }
                        />
                        <SectionRow
                          label="OS"
                          checked={state.bookings_os}
                          onToggle={(v) =>
                            setState((s) => ({ ...s, bookings_os: v }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Directory dropdown (no border, options on gray-400) */}
                <div className="mb-4">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                    onClick={() => setDirectoryOpen((v) => !v)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[13px] text-[#414141] font-medium">
                        Directory
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={state.directory_master}
                        onChange={(v) => {
                          setState((s) => ({
                            ...s,
                            directory_master: v,
                            directory_customer: v,
                            directory_vendor: v,
                            directory_team: v,
                          }));
                        }}
                      />
                      <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.stopPropagation();
                          setDirectoryOpen((v) => !v);
                        }}
                        aria-expanded={directoryOpen}
                        className="w-6 h-6 inline-flex items-center justify-center"
                      >
                        <svg
                          className={`w-4 h-4 transform transition-transform ${
                            directoryOpen ? "rotate-180" : "rotate-0"
                          }`}
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 8l5 5 5-5"
                            stroke="#6B6B6B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {directoryOpen && (
                    <div className="px-4 py-2">
                      <div className="rounded-md p-1 bg-[#F9F9F9]">
                        <SectionRow
                          label="Customer"
                          checked={state.directory_customer}
                          onToggle={(v) =>
                            setState((s) => ({ ...s, directory_customer: v }))
                          }
                        />
                        <SectionRow
                          label="Vendor"
                          checked={state.directory_vendor}
                          onToggle={(v) =>
                            setState((s) => ({ ...s, directory_vendor: v }))
                          }
                        />
                        <SectionRow
                          label="Team"
                          checked={state.directory_team}
                          onToggle={(v) =>
                            setState((s) => ({ ...s, directory_team: v }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "bookings" && (
              <div className="mb-4">
                <div className="py-3 -ml-7">
                  {/* Delete after approval row */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="bg-[#F9F9F9] rounded-md p-2 w-full">
                      <div className="flex items-center justify-between gap-6 ">
                        <div className="text-[13px] text-[#414141]">
                          Delete after approval
                        </div>
                        <div>
                          <Toggle
                            checked={!!state.approval_delete_after_approval}
                            onChange={(v) =>
                              setState((s) => ({
                                ...(s as any),
                                approval_delete_after_approval: v,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="h-2" />
                      <div className="flex items-center justify-between gap-6">
                        <div className="text-[13px] text-[#414141]">
                          Non-editable after travel date
                        </div>
                        <div>
                          <Toggle
                            checked={
                              !!state.approval_noneditable_after_travel_date
                            }
                            onChange={(v) =>
                              setState((s) => ({
                                ...(s as any),
                                approval_noneditable_after_travel_date: v,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 text-[12px] text-gray-600 font-medium mb-2">
                    <div className="col-span-6 ml-4">AREA</div>
                    <div className="col-span-6 flex justify-end gap-6 pr-4">
                      <div className="w-12 text-center">VIEW</div>
                      <div className="w-12 text-center">ADD</div>
                      <div className="w-12 text-center">EDIT</div>
                      <div className="w-12 text-center">DELETE</div>
                    </div>
                  </div>

                  <div className="rounded-md overflow-hidden border border-transparent">
                    <Row
                      label="OS (Primary)"
                      viewKey="os_primary_view"
                      addKey="os_primary_add"
                      editKey="os_primary_edit"
                      deleteKey="os_primary_delete"
                    />
                    <Row
                      label="OS (Secondary)"
                      viewKey="os_secondary_view"
                      addKey="os_secondary_add"
                      editKey="os_secondary_edit"
                      deleteKey="os_secondary_delete"
                    />
                    <Row
                      label="Limitless (Primary)"
                      viewKey="limitless_primary_view"
                      addKey="limitless_primary_add"
                      editKey="limitless_primary_edit"
                      deleteKey="limitless_primary_delete"
                    />
                    <Row
                      label="Limitless (Secondary)"
                      viewKey="limitless_secondary_view"
                      addKey="limitless_secondary_add"
                      editKey="limitless_secondary_edit"
                      deleteKey="limitless_secondary_delete"
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="mb-4">
                <div className="py-3 -ml-7">
                  <div className="grid grid-cols-12 gap-2 text-[12px] text-gray-600 font-medium mb-2">
                    <div className="col-span-6 ml-4">AREA</div>
                    <div className="col-span-6 flex justify-end gap-6 pr-4">
                      <div className="w-12 text-center">VIEW</div>
                      <div className="w-12 text-center">ADD</div>
                      <div className="w-12 text-center">EDIT</div>
                      <div className="w-12 text-center">DELETE</div>
                    </div>
                  </div>

                  <div className="rounded-md overflow-hidden border border-transparent">
                    <Row
                      label="Company Details"
                      viewKey="company_view"
                      addKey="company_add"
                      editKey="company_edit"
                      deleteKey="company_delete"
                    />
                    <Row
                      label="Billing & Compliance"
                      viewKey="billing_view"
                      addKey="billing_add"
                      editKey="billing_edit"
                      deleteKey="billing_delete"
                    />
                    <Row
                      label="Users"
                      viewKey="users_view"
                      addKey="users_add"
                      editKey="users_edit"
                      deleteKey="users_delete"
                    />
                    <Row
                      label="Roles & Permissions"
                      viewKey="roles_view"
                      addKey="roles_add"
                      editKey="roles_edit"
                      deleteKey="roles_delete"
                    />

                    <Row
                      label="Approval / Module Settings"
                      viewKey="approval_view"
                      addKey="approval_add"
                      editKey="approval_edit"
                      deleteKey="approval_delete"
                    />

                    {/* Delete after approval row */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="bg-[#F9F9F9] rounded-md p-2 w-full">
                        <div className="flex items-center justify-between gap-6 ">
                          <div className="text-[13px] text-[#414141]">
                            Delete after approval
                          </div>
                          <div>
                            <Toggle
                              checked={!!state.approval_delete_after_approval}
                              onChange={(v) =>
                                setState((s) => ({
                                  ...(s as any),
                                  approval_delete_after_approval: v,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="h-2" />
                        <div className="flex items-center justify-between gap-6">
                          <div className="text-[13px] text-[#414141]">
                            Non-editable after travel date
                          </div>
                          <div>
                            <Toggle
                              checked={
                                !!state.approval_noneditable_after_travel_date
                              }
                              onChange={(v) =>
                                setState((s) => ({
                                  ...(s as any),
                                  approval_noneditable_after_travel_date: v,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-[12px] text-gray-600 font-medium mb-2">
                      <div className="col-span-6 ml-4">AREA</div>
                      <div className="col-span-6 flex justify-end gap-6 pr-4">
                        <div className="w-12 text-center">VIEW</div>
                        <div className="w-12 text-center">ADD</div>
                        <div className="w-12 text-center">EDIT</div>
                        <div className="w-12 text-center">DELETE</div>
                      </div>
                    </div>
                    <Row
                      label="OS (Primary)"
                      viewKey="os_primary_view"
                      addKey="os_primary_add"
                      editKey="os_primary_edit"
                      deleteKey="os_primary_delete"
                    />
                    <Row
                      label="OS (Secondary)"
                      viewKey="os_secondary_view"
                      addKey="os_secondary_add"
                      editKey="os_secondary_edit"
                      deleteKey="os_secondary_delete"
                    />
                    <Row
                      label="Limitless (Primary)"
                      viewKey="limitless_primary_view"
                      addKey="limitless_primary_add"
                      editKey="limitless_primary_edit"
                      deleteKey="limitless_primary_delete"
                    />
                    <Row
                      label="Limitless (Secondary)"
                      viewKey="limitless_secondary_view"
                      addKey="limitless_secondary_add"
                      editKey="limitless_secondary_edit"
                      deleteKey="limitless_secondary_delete"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button bottom-right */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`text-white font-medium text-[13px] px-4 py-2 rounded ${
                isSaving ? "opacity-60 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: "#0D4B37" }}
            >
              {isSaving ? "Saving..." : "Save Role"}
            </button>
          </div>
        </div>
      </div>
    </SideSheet>
  );
};

export default AddRolesSidesheet;
