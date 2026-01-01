"use client";

import React, { useEffect, useState } from "react";
import { AuthApi } from "@/services/authApi";
import SideSheet from "../SideSheet";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roleName?: string;
  initialPermissions?: Record<string, unknown>;
  roleId?: string;
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

const defaultCrud = {
  view: false,
  add: false,
  edit: false,
  delete: false,
};

const defaultPermissions = {
  cooncierce: {
    bookings: {
      limitless: false,
      os: false,
    },
    directory: {
      customer: false,
      vendor: false,
      team: false,
    },
  },
  settings: {
    companyDetails: { ...defaultCrud },
    billing: { ...defaultCrud },
    users: { ...defaultCrud },
    roles: { ...defaultCrud },
    approval: { ...defaultCrud },
    deleteAfterApproval: false,
    noEditAfterTravelDate: false,
    osPrimary: { ...defaultCrud },
    osSecondary: { ...defaultCrud },
    limitlessPrimary: { ...defaultCrud },
    limitlessSecondary: { ...defaultCrud },
  },
  bookings: {
    deleteAfterApproval: false,
    noEditAfterTravelDate: false,
    osPrimary: { ...defaultCrud },
    osSecondary: { ...defaultCrud },
    limitlessPrimary: { ...defaultCrud },
    limitlessSecondary: { ...defaultCrud },
  },
};

type PermissionState = typeof defaultPermissions;

const getValue = (obj: PermissionState, path: string): boolean => {
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    current = current?.[part];
  }
  return Boolean(current);
};

const setValue = (
  obj: PermissionState,
  path: string,
  value: boolean
): PermissionState => {
  const parts = path.split(".");
  const next: any = { ...obj };
  let current: any = next;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const prev = current[key] ?? {};
    current[key] = { ...prev };
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
  return next as PermissionState;
};

const mergePermissions = (
  base: PermissionState,
  incoming: Record<string, unknown> | undefined
): PermissionState => {
  if (!incoming || typeof incoming !== "object") return base;
  const next: any = Array.isArray(base) ? [...base] : { ...base };
  Object.keys(base).forEach((key) => {
    const baseValue = (base as any)[key];
    const incomingValue = (incoming as any)[key];
    if (
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      next[key] = mergePermissions(baseValue, incomingValue || {});
    } else if (typeof incomingValue !== "undefined") {
      next[key] = incomingValue;
    } else {
      next[key] = baseValue;
    }
  });
  return next as PermissionState;
};

const AddRolesSidesheet: React.FC<Props> = ({
  isOpen,
  onClose,
  roleName,
  initialPermissions,
  roleId
}) => {
  const [tab, setTab] = useState<string>("cooncierge");

  const [state, setState] = useState<PermissionState>(defaultPermissions);

  const [bookingsOpen, setBookingsOpen] = useState<boolean>(true);
  const [directoryOpen, setDirectoryOpen] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setState(mergePermissions(defaultPermissions, initialPermissions));
  }, [initialPermissions]);

  const bookingsMasterChecked =
    state.cooncierce.bookings.limitless && state.cooncierce.bookings.os;
  const directoryMasterChecked =
    state.cooncierce.directory.customer &&
    state.cooncierce.directory.vendor &&
    state.cooncierce.directory.team;

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {

      if (roleId) {
        // update role
        const payload = {
          _id: roleId,
          roleName,
          permission: { ...state },
        };
        const res = await AuthApi.updateRole(payload as any);
        if (res && (res.success || res.data)) {
          // updated successfully
          onClose();
        } else {
          console.error("Update role failed", res);
        }
        return;
      } else {
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
      }

      
    } catch (e) {
      console.error("Error creating role", e);
    } finally {
      setIsSaving(false);
      window.location.reload()
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
            checked={getValue(state, viewKey)}
            onChange={() =>
              setState((s) => setValue(s, viewKey, !getValue(s, viewKey)))
            }
          />
          <label
            htmlFor={viewKey}
            className={
              "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
              (getValue(state, viewKey)
                ? "bg-[#126ACB] border-[#126ACB]"
                : "border-[#0D4B37] bg-white")
            }
          >
            {getValue(state, viewKey) && (
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
                checked={getValue(state, addKey)}
                onChange={() =>
                  setState((s) => setValue(s, addKey, !getValue(s, addKey)))
                }
              />
              <label
                htmlFor={addKey}
                className={
                  "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
                  (getValue(state, addKey)
                    ? "bg-[#126ACB] border-[#126ACB]"
                    : "border-[#0D4B37] bg-white")
                }
              >
                {getValue(state, addKey) && (
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
                checked={getValue(state, editKey)}
                onChange={() =>
                  setState((s) => setValue(s, editKey, !getValue(s, editKey)))
                }
              />
              <label
                htmlFor={editKey}
                className={
                  "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
                  (getValue(state, editKey)
                    ? "bg-[#126ACB] border-[#126ACB]"
                    : "border-[#0D4B37] bg-white")
                }
              >
                {getValue(state, editKey) && (
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
                checked={getValue(state, deleteKey)}
                onChange={() =>
                  setState((s) =>
                    setValue(s, deleteKey, !getValue(s, deleteKey))
                  )
                }
              />
              <label
                htmlFor={deleteKey}
                className={
                  "w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition " +
                  (getValue(state, deleteKey)
                    ? "bg-[#126ACB] border-[#126ACB]"
                    : "border-[#0D4B37] bg-white")
                }
              >
                {getValue(state, deleteKey) && (
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
                        checked={bookingsMasterChecked}
                        onChange={(v) => {
                          setState((s) => {
                            let next = setValue(
                              s,
                              "cooncierce.bookings.limitless",
                              v
                            );
                            next = setValue(next, "cooncierce.bookings.os", v);
                            return next;
                          });
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
                          checked={state.cooncierce.bookings.limitless}
                          onToggle={(v) =>
                            setState((s) =>
                              setValue(
                                s,
                                "cooncierce.bookings.limitless",
                                v
                              )
                            )
                          }
                        />
                        <SectionRow
                          label="OS"
                          checked={state.cooncierce.bookings.os}
                          onToggle={(v) =>
                            setState((s) =>
                              setValue(s, "cooncierce.bookings.os", v)
                            )
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
                        checked={directoryMasterChecked}
                        onChange={(v) => {
                          setState((s) => {
                            let next = setValue(
                              s,
                              "cooncierce.directory.customer",
                              v
                            );
                            next = setValue(
                              next,
                              "cooncierce.directory.vendor",
                              v
                            );
                            next = setValue(
                              next,
                              "cooncierce.directory.team",
                              v
                            );
                            return next;
                          });
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
                          checked={state.cooncierce.directory.customer}
                          onToggle={(v) =>
                            setState((s) =>
                              setValue(
                                s,
                                "cooncierce.directory.customer",
                                v
                              )
                            )
                          }
                        />
                        <SectionRow
                          label="Vendor"
                          checked={state.cooncierce.directory.vendor}
                          onToggle={(v) =>
                            setState((s) =>
                              setValue(s, "cooncierce.directory.vendor", v)
                            )
                          }
                        />
                        <SectionRow
                          label="Team"
                          checked={state.cooncierce.directory.team}
                          onToggle={(v) =>
                            setState((s) =>
                              setValue(s, "cooncierce.directory.team", v)
                            )
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
                            checked={state.bookings.deleteAfterApproval}
                            onChange={(v) =>
                              setState((s) =>
                                setValue(s, "bookings.deleteAfterApproval", v)
                              )
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
                            checked={state.bookings.noEditAfterTravelDate}
                            onChange={(v) =>
                              setState((s) =>
                                setValue(
                                  s,
                                  "bookings.noEditAfterTravelDate",
                                  v
                                )
                              )
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
                      viewKey="bookings.osPrimary.view"
                      addKey="bookings.osPrimary.add"
                      editKey="bookings.osPrimary.edit"
                      deleteKey="bookings.osPrimary.delete"
                    />
                    <Row
                      label="OS (Secondary)"
                      viewKey="bookings.osSecondary.view"
                      addKey="bookings.osSecondary.add"
                      editKey="bookings.osSecondary.edit"
                      deleteKey="bookings.osSecondary.delete"
                    />
                    <Row
                      label="Limitless (Primary)"
                      viewKey="bookings.limitlessPrimary.view"
                      addKey="bookings.limitlessPrimary.add"
                      editKey="bookings.limitlessPrimary.edit"
                      deleteKey="bookings.limitlessPrimary.delete"
                    />
                    <Row
                      label="Limitless (Secondary)"
                      viewKey="bookings.limitlessSecondary.view"
                      addKey="bookings.limitlessSecondary.add"
                      editKey="bookings.limitlessSecondary.edit"
                      deleteKey="bookings.limitlessSecondary.delete"
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
                      viewKey="settings.companyDetails.view"
                      addKey="settings.companyDetails.add"
                      editKey="settings.companyDetails.edit"
                      deleteKey="settings.companyDetails.delete"
                    />
                    <Row
                      label="Billing & Compliance"
                      viewKey="settings.billing.view"
                      addKey="settings.billing.add"
                      editKey="settings.billing.edit"
                      deleteKey="settings.billing.delete"
                    />
                    <Row
                      label="Users"
                      viewKey="settings.users.view"
                      addKey="settings.users.add"
                      editKey="settings.users.edit"
                      deleteKey="settings.users.delete"
                    />
                    <Row
                      label="Roles & Permissions"
                      viewKey="settings.roles.view"
                      addKey="settings.roles.add"
                      editKey="settings.roles.edit"
                      deleteKey="settings.roles.delete"
                    />

                    <Row
                      label="Approval / Module Settings"
                      viewKey="settings.approval.view"
                      addKey="settings.approval.add"
                      editKey="settings.approval.edit"
                      deleteKey="settings.approval.delete"
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
                              checked={state.settings.deleteAfterApproval}
                              onChange={(v) =>
                                setState((s) =>
                                  setValue(
                                    s,
                                    "settings.deleteAfterApproval",
                                    v
                                  )
                                )
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
                              checked={state.settings.noEditAfterTravelDate}
                              onChange={(v) =>
                                setState((s) =>
                                  setValue(
                                    s,
                                    "settings.noEditAfterTravelDate",
                                    v
                                  )
                                )
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
                      viewKey="settings.osPrimary.view"
                      addKey="settings.osPrimary.add"
                      editKey="settings.osPrimary.edit"
                      deleteKey="settings.osPrimary.delete"
                    />
                    <Row
                      label="OS (Secondary)"
                      viewKey="settings.osSecondary.view"
                      addKey="settings.osSecondary.add"
                      editKey="settings.osSecondary.edit"
                      deleteKey="settings.osSecondary.delete"
                    />
                    <Row
                      label="Limitless (Primary)"
                      viewKey="settings.limitlessPrimary.view"
                      addKey="settings.limitlessPrimary.add"
                      editKey="settings.limitlessPrimary.edit"
                      deleteKey="settings.limitlessPrimary.delete"
                    />
                    <Row
                      label="Limitless (Secondary)"
                      viewKey="settings.limitlessSecondary.view"
                      addKey="settings.limitlessSecondary.add"
                      editKey="settings.limitlessSecondary.edit"
                      deleteKey="settings.limitlessSecondary.delete"
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
