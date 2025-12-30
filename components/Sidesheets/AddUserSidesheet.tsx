"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { AuthApi } from "../../services/authApi";
import { getAuthUser } from "../../services/storage/authStorage";
import SideSheet from "../SideSheet";
import DropDown from "../DropDown";
import Button from "../Button";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { JSX } from "react";

interface AddUserSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser?: (data: any) => void;
  initialData?: Record<string, any> | null;
  isEdit?: boolean;
  onUpdateUser?: (data: any) => void;
}

export default function AddUserSidesheet({
  isOpen,
  onClose,
  onAddUser,
  initialData = null,
  isEdit = false,
  onUpdateUser,
}: AddUserSidesheetProps): JSX.Element {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [mobile, setMobile] = useState<string>("");
  const [userStatus, setUserStatus] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [rolesOptions, setRolesOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const [autoCreate, setAutoCreate] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requireChange, setRequireChange] = useState(false);

  // Password rules (copied from login reset UI logic)
  const hasMinLength = useMemo(() => password.length >= 8, [password]);
  const hasUpper = useMemo(() => /[A-Z]/.test(password), [password]);
  const hasLower = useMemo(() => /[a-z]/.test(password), [password]);
  const hasNumber = useMemo(() => /[0-9]/.test(password), [password]);
  const hasSpecial = useMemo(() => /[^A-Za-z0-9]/.test(password), [password]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleAdd = useCallback(async (): Promise<void> => {
    const payload = {
      name: fullName,
      email,
      phoneCode: countryCode,
      mobile,
      userStatus,
      roleId: role,
      autoCreate,
      password: autoCreate ? undefined : password,
      requireChange,
    } as any;

    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const authUser = getAuthUser<any>();
      const roleIdFromStorage = authUser?.roleId || authUser?.role?._id;
      const businessIdFromStorage =
        authUser?.businessId || authUser?.businessId?._id || undefined;

      // convert phone code
      const phoneCodeNum = Number(
        (countryCode || "").toString().replace("+", "")
      );

      // Prefer selected role from dropdown, fallback to stored role
      const roleIdFinal =
        role || roleIdFromStorage || "000000000000000000000000";

      // Build request payload matching backend required fields and model
      const reqPayload = {
        mobile: mobile || "",
        email: email || "",
        roleId: roleIdFinal,
        gender: "other",
        phoneCode: isNaN(phoneCodeNum) ? 91 : phoneCodeNum,

        name: fullName || "",
        designation: "Staff",
        businessId: businessIdFromStorage,
      } as any;

      // Basic client-side validation for backend-required fields
      if (
        !reqPayload.mobile ||
        !reqPayload.email ||
        !reqPayload.roleId ||
        !reqPayload.gender ||
        !reqPayload.phoneCode
      ) {
        console.error("Missing required fields", reqPayload);
        setIsSubmitting(false);
        return;
      }

      // If editing, include userId and call update path
      if (isEdit && initialData && (initialData.id || initialData._id)) {
        reqPayload.userId = initialData.id || initialData._id;
      }

      const res = await AuthApi.createOrUpdateUser(reqPayload);

      if (res && (res.success || res.user || res.data)) {
        const returned = res.user || res.data || payload;
        if (isEdit) {
          if (onUpdateUser) onUpdateUser(returned);
        } else {
          if (onAddUser) onAddUser(returned);
        }
        onClose();
      } else {
        console.error("Create/update user failed", res);
      }
    } catch (e) {
      console.error("Error creating/updating user", e);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    fullName,
    email,
    countryCode,
    mobile,
    userStatus,
    role,
    autoCreate,
    password,
    requireChange,
    onAddUser,
    onClose,
    isSubmitting,
    initialData,
    isEdit,
    onUpdateUser,
  ]);

  // Fetch business roles when the sidesheet opens
  useEffect(() => {
    let mounted = true;
    const fetchRoles = async () => {
      try {
        // debug log
        console.debug("AddUserSidesheet: fetching business roles...");
        const res = await AuthApi.getBusinessRoles();
        const output = res?.output || [];
        const opts = output.map((r: any) => ({
          value: String(r.id ?? r._id ?? ""),
          label: String(
            r.name ?? r.roleName ?? r.roleName ?? r.id ?? r._id ?? ""
          ),
        }));
        if (!mounted) return;
        setRolesOptions(opts);
        const first = opts[0];
        if (!role && first) setRole(first.value);
      } catch (e) {
        // ignore

        console.error("Failed to fetch roles", e);
      }
    };

    if (isOpen) fetchRoles();
    return () => {
      mounted = false;
    };
  }, [isOpen]);
  // Prefill when editing
  useEffect(() => {
    if (isEdit && initialData) {
      setFullName(String(initialData.name || ""));
      setEmail(String(initialData.email || ""));

      let code = "+91";
      if (
        initialData.phoneCode !== undefined &&
        initialData.phoneCode !== null
      ) {
        const pc = String(initialData.phoneCode);
        code = pc.startsWith("+") ? pc : `+${pc}`;
      }

      // Only accept allowed codes, fallback to +91
      const allowedCodes = ["+91", "+1", "+44"];
      if (!allowedCodes.includes(code)) code = "+91";

      setCountryCode(code);

      setMobile(String(initialData.mobile || initialData.phone || ""));
      setUserStatus(String(initialData.status || "").toLowerCase());
      setRole(String(initialData.role || ""));
    } else if (!isEdit) {
      // reset when opening add form
      setFullName("");
      setEmail("");
      setCountryCode("+91");
      setMobile("");
      setUserStatus("");
      setRole("");
      setAutoCreate(true);
      setPassword("");
      setRequireChange(false);
    }
  }, [isEdit, initialData]);

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit User" : "Add New User"}
      width="lg"
    >
      <div className="p-4 text-[13px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <div className="border border-gray-200 rounded-lg p-4 -mt-3">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  *Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter Full Name"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  *Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  type="email"
                />
              </div>

              <div className="grid grid-cols-6">
                <div className="col-span-1">
                  <label className="text-[13px] font-medium text-[#414141]">
                    Mobile
                  </label>
                  <DropDown
                    options={[
                      { value: "+91", label: "+91" },
                      { value: "+1", label: "+1" },
                      { value: "+44", label: "+44" },
                    ]}
                    value={countryCode}
                    onChange={(v) => setCountryCode(v)}
                    customWidth="w-[6rem]"
                    customHeight="h-[2.2rem]"
                    className="mt-1.5"
                    menuWidth="w-[6rem]"
                  />
                </div>
                <div className="col-span-5">
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter Contact Number"
                    className="mt-6 -ml-2.5 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  User Status
                </label>
                <DropDown
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  value={userStatus}
                  onChange={(v) => setUserStatus(v)}
                  customWidth="w-full"
                  menuWidth="w-162"
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[#414141]">
                  *Role
                </label>
                <DropDown
                  options={rolesOptions}
                  value={role}
                  onChange={(v) => setRole(v)}
                  customWidth="w-full"
                  menuWidth="w-162"
                />
              </div>

              <div className="flex items-center gap-2 mt-1 mb-1">
                <input
                  type="checkbox"
                  id="autoCreate"
                  className="hidden"
                  checked={autoCreate}
                  onChange={() => setAutoCreate(!autoCreate)}
                />
                <label
                  htmlFor="autoCreate"
                  className={`w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition
      ${
        autoCreate
          ? "bg-[#126ACB] border-[#126ACB]"
          : "border-[#0D4B37] bg-white"
      }
    `}
                >
                  {autoCreate && (
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
                <span className="text-[13px] font-normal text-[#414141]">
                  Automatically create a password
                </span>
              </div>

              {!autoCreate && (
                <div>
                  <label className="text-sm font-medium">*Password</label>
                  <div className="relative mt-1">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      type={showPassword ? "text" : "password"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-2 text-gray-500"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                    </button>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    Note: Password should consist of minimum 8 characters
                    <ul className="list-disc pl-5 mt-2 text-[13px] text-gray-600">
                      <li
                        className={
                          hasUpper ? "text-emerald-600" : "text-gray-500"
                        }
                      >
                        Minimum 1 uppercase letter
                      </li>
                      <li
                        className={
                          hasLower ? "text-emerald-600" : "text-gray-500"
                        }
                      >
                        Minimum 1 lowercase letter
                      </li>
                      <li
                        className={
                          hasNumber ? "text-emerald-600" : "text-gray-500"
                        }
                      >
                        Minimum 1 number
                      </li>
                      <li
                        className={
                          hasSpecial ? "text-emerald-600" : "text-gray-500"
                        }
                      >
                        Minimum 1 special character
                      </li>
                      <li
                        className={
                          hasMinLength ? "text-emerald-600" : "text-gray-500"
                        }
                      >
                        Minimum 8 characters
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireChange"
                  className="hidden"
                  checked={requireChange}
                  onChange={() => setRequireChange(!requireChange)}
                />
                <label
                  htmlFor="requireChange"
                  className={`w-4.5 h-4.5 rounded-sm pb-0.5 pt-0.5 flex items-center justify-center cursor-pointer border transition
      ${
        requireChange
          ? "bg-[#126ACB] border-[#126ACB]"
          : "border-[#0D4B37] bg-white"
      }
    `}
                >
                  {requireChange && (
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
                <span className="text-[13px] font-normal text-[#414141]">
                  Require this user to change their password on their first sign
                  in
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              text={isEdit ? "Save & Update" : "Add User"}
              type="submit"
              bgColor="bg-[#0D4B37]"
              textColor="text-white text-[13px] py-2"
            />
          </div>
        </form>
      </div>
    </SideSheet>
  );
}
