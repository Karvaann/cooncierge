"use client";

import React, { useEffect, useMemo, useState } from "react";
import Table from "../Table";

type User = {
  id: string;
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

  useEffect(() => {
    // Initialize selection state when users change or modal opens
    const map: Record<string, boolean> = {};
    users.forEach((u) => (map[u.id] = false));
    setSelected(map);
  }, [users, open]);

  const allSelected = useMemo(() => {
    if (!users.length) return false;
    return users.every((u) => selected[u.id]);
  }, [users, selected]);

  const handleToggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const handleSelectAll = () => {
    const next: Record<string, boolean> = {};
    const toggleTo = !allSelected;
    users.forEach((u) => (next[u.id] = toggleTo));
    setSelected(next);
  };

  const handleActivate = () => {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (deactivate) {
      onDeactivate?.(ids);
    } else {
      onActivate?.(ids);
    }
    onClose();
  };

  // Build rows as arrays of <td> elements (first cell is the checkbox)
  const rows = users.map((u) => [
    <td key={u.id + "-check"} className="px-4 py-3 w-[3rem]">
      <input
        type="checkbox"
        checked={!!selected[u.id]}
        onChange={() => handleToggle(u.id)}
        className="w-4 h-4 text-green-600 rounded border-gray-300"
      />
    </td>,
    <td key={u.id + "-name"} className="px-4 py-3 text-left">
      <div className="text-[13px] text-[#020202]">{u.name}</div>
    </td>,
    <td key={u.id + "-mobile"} className="px-4 py-3 text-center">
      <div className="text-[13px] text-[#020202]">{u.mobile}</div>
    </td>,
    <td key={u.id + "-email"} className="px-4 py-3 text-center">
      <div className="text-[13px] text-[#020202]">{u.email}</div>
    </td>,
  ]);

  if (!open) return null;

  return (
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
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className={`w-4 h-4 rounded border-gray-300 ${
                    deactivate ? "text-rose-600" : "text-green-600"
                  }`}
                  aria-label="Select all users"
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
  );
};

export default ActivateusersModal;
