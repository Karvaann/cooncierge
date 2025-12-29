"use client";

import React, { useState } from "react";
import Modal from "../Modal";
import DropDown from "../DropDown";
import AddRolesSidesheet from "../Sidesheets/AddRolesSidesheet";

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: (payload: {
    type: "existing" | "scratch";
    role?: string;
    name?: string;
  }) => void;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "operations", label: "Operations" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
];

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [openSidesheet, setOpenSidesheet] = useState(false);
  const [mode, setMode] = useState<"existing" | "scratch">("existing");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleName, setRoleName] = useState<string>("");

  const handleContinue = () => {
    if (onContinue) {
      onContinue({ type: mode, role: selectedRole, name: roleName });
    }
    // open the AddRolesSidesheet and close this modal
    setOpenSidesheet(true);
    onClose();
  };

  const isContinueEnabled =
    mode === "existing"
      ? Boolean(selectedRole)
      : Boolean(roleName && roleName.trim());

  return (
    <>
      <Modal
        title={null}
        headerLeft={
          <h3 className="text-black text-lg font-semibold">Create a Role</h3>
        }
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        customWidth="w-[730px]"
        showCloseButton
      >
        <div className="p-2 -mt-4">
          {/* Radio choices */}
          <div className="flex gap-6 items-start mb-4">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="create-role-mode"
                checked={mode === "existing"}
                onChange={() => setMode("existing")}
                className="mt-1"
                style={{ accentColor: "#126ACB" }}
              />
              <div>
                <div className="text-sm font-semibold">
                  Start with an Existing Role
                </div>
                <div className="text-xs text-gray-500">
                  Duplicate & customise a role
                </div>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="create-role-mode"
                checked={mode === "scratch"}
                onChange={() => setMode("scratch")}
                className="mt-1"
                style={{ accentColor: "#126ACB" }}
              />
              <div>
                <div className="text-sm font-semibold">Start from Scratch</div>
                <div className="text-xs text-gray-500">
                  Create everything from blank
                </div>
              </div>
            </label>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {mode === "existing" ? (
              <>
                <div>
                  <label className="text-sm font-medium text-black">
                    <span className="text-red-500 mr-1">*</span>Select Role
                  </label>
                  <div className="mt-1">
                    <DropDown
                      options={roleOptions}
                      placeholder="Select Role"
                      value={selectedRole}
                      onChange={(v) => setSelectedRole(v)}
                      customWidth="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-black">
                    <span className="text-red-500 mr-1">*</span>Role Name
                  </label>
                  <input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Enter Role Name"
                    className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium text-black">
                  <span className="text-red-500 mr-1">*</span>Role Name
                </label>
                <input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Enter Role Name"
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-300"
                />
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!isContinueEnabled}
              className={`px-4 py-1.5 rounded-md text-white text-[14px] font-medium transition-colors ${
                isContinueEnabled
                  ? "bg-[#0D4B37] hover:bg-green-900 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Roles Sidesheet opened after continue */}
      <AddRolesSidesheet
        isOpen={openSidesheet}
        onClose={() => setOpenSidesheet(false)}
        roleName={
          roleName ||
          roleOptions.find((o) => o.value === selectedRole)?.label ||
          ""
        }
      />
    </>
  );
};

export default CreateRoleModal;
