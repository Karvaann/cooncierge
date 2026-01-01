"use client";

import React, { useEffect, useMemo, useState } from "react";
import SuccessPopupModal from "../popups/BookingPopups/SuccessPopupModal";
import Table from "../Table";

type User = {
  id?: string;
  _id?: string;
  name: string;
  mobile: string;
  email: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  users: User[];
  onActivate?: (ids: string[]) => void;
  onDeactivate?: (ids: string[]) => void;
  deactivate?: boolean;
};

const ActivateusersModal: React.FC<Props> = ({
  open,
  onClose,
  users = [],
  onActivate,
  onDeactivate,
  deactivate,
}) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const FancyCheckbox: React.FC<{
    id: string;
    checked: boolean;
    onChange: () => void;
    ariaLabel?: string;
    whiteBg?: boolean;
  }> = ({ id, checked, onChange, ariaLabel, whiteBg = false }) => (
    <>
      <input
        id={id}
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
      <label
        htmlFor={id}
        className={`w-4 h-4 border border-[#0D4B37] rounded-sm flex items-center justify-center cursor-pointer ${
          whiteBg ? "bg-white" : ""
        }`}
        style={
          whiteBg ? { boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" } : undefined
        }
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="10"
            viewBox="0 0 11 10"
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
    </>
  );

  const normalizedUsers = useMemo(
    () =>
      users.map((u, index) => ({
        ...u,
        selectionKey: String(u._id ?? u.id ?? u.email ?? u.mobile ?? index),
      })),
    [users]
  );

  useEffect(() => {
    // Initialize selection state when users change or modal opens
    const map: Record<string, boolean> = {};
    normalizedUsers.forEach((u) => (map[u.selectionKey] = false));
    setSelected(map);
  }, [normalizedUsers, open]);

  const allSelected = useMemo(() => {
    if (!normalizedUsers.length) return false;
    return normalizedUsers.every((u) => selected[u.selectionKey]);
  }, [normalizedUsers, selected]);

  const handleToggle = (key: string) => {
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    const toggleTo = !allSelected;
    normalizedUsers.forEach((u) => (next[u.selectionKey] = toggleTo));
    setSelected(next);
  };

  const handleActivate = () => {
    const ids = normalizedUsers
      .filter((u) => selected[u.selectionKey])
      .map((u) => String(u._id ?? u.id ?? u.selectionKey));
    if (deactivate) {
      onDeactivate?.(ids);
    } else {
      onActivate?.(ids);
    }
    setShowSuccess(true);
    onClose();
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const successTitle = deactivate
    ? "Selected Users have been successfully deactivated!"
    : "Selected Users have been successfully activated!";

  // Build rows as arrays of <td> elements (first cell is the checkbox)
  const rows = normalizedUsers.map((u) => [
    <td key={u.selectionKey + "-check"} className="px-4 py-3 w-[3rem]">
      <FancyCheckbox
        id={`chk-${u.selectionKey}`}
        checked={!!selected[u.selectionKey]}
        onChange={() => handleToggle(u.selectionKey)}
        ariaLabel={`Select user ${u.name}`}
      />
    </td>,
    <td key={u.selectionKey + "-name"} className="px-4 py-3 text-left">
      <div className="text-[13px] text-[#020202]">{u.name}</div>
    </td>,
    <td key={u.selectionKey + "-mobile"} className="px-4 py-3 text-center">
      <div className="text-[13px] text-[#020202]">{u.mobile}</div>
    </td>,
    <td key={u.selectionKey + "-email"} className="px-4 py-3 text-center">
      <div className="text-[13px] text-[#020202]">{u.email}</div>
    </td>,
  ]);

  if (!open && !showSuccess) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <div className="relative w-[90%] max-w-4xl bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="text-lg font-semibold">
                {deactivate ? "Deactivate Users" : "Activate Users"}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 -mt-4">
              <div className="mb-4 rounded-lg">
                <Table
                  data={rows}
                  columns={["Name", "Mobile", "Email"]}
                  initialRowsPerPage={5}
                  maxRowsPerPageOptions={[5, 10, 25, 50]}
                  showCheckboxColumn={true}
                  headerCheckbox={
                    <FancyCheckbox
                      id={`header-select`}
                      checked={allSelected}
                      onChange={handleSelectAll}
                      ariaLabel="Select all users"
                      whiteBg
                    />
                  }
                  hideEntriesText={false}
                  categoryName="Users"
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <div />

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleActivate}
                    className={`px-4 py-2 rounded-md text-white hover:opacity-95 ${
                      deactivate
                        ? "bg-[#DD1425] hover:bg-rose-700"
                        : "bg-[#4CA640] hover:bg-green-600"
                    }`}
                  >
                    {deactivate ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SuccessPopupModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
        title={successTitle}
        boldPart="Selected Users"
        showVideo={false}
        imageSrc="/images/checkmark-success.png"
      />
    </>
  );
};

export default ActivateusersModal;
