"use client";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { FiUser } from "react-icons/fi";
import CustomCheckbox from "@/components/CustomCheckbox";

export type TravellerRow = {
  id: string;
  name: string;
  note?: string; // e.g. Lead Pax or Age
  type?: "Adult" | "Child" | string;
};

interface AllTravellersModalProps {
  isOpen: boolean;
  onClose: () => void;
  travellers?: TravellerRow[];
  value?: string[]; // selected ids
  onSave?: (selected: string[]) => void;
}

const AllTravellersModal: React.FC<AllTravellersModalProps> = ({
  isOpen,
  onClose,
  travellers,
  value,
  onSave,
}) => {
  const dataset = useMemo<TravellerRow[]>(
    () =>
      travellers ?? [
        {
          id: "t1",
          name: "Mr. Vijay Shekhawat",
          note: "Lead Pax",
          type: "Adult",
        },
        { id: "t2", name: "Mrs. Aastha Shekhawat", type: "Adult" },
        {
          id: "t3",
          name: "Ms. Riya Shekhawat",
          note: "Age: 3 Yrs",
          type: "Child",
        },
      ],
    [travellers],
  );

  const [selected, setSelected] = useState<string[]>(value ?? []);

  useEffect(() => {
    setSelected(value ?? []);
  }, [value, isOpen]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Total Travellers (${dataset.length})`}
      size="sm"
      customWidth="w-[650px]"
      subtitle="Select the Traveller(s) taking this Flight"
    >
      <div className="space-y-3">
        <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
          <div className="p-3 space-y-1">
            {dataset.map((t) => {
              const isSel = selected.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-md hover:bg-gray-50"
                >
                  <CustomCheckbox checked={isSel} />

                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <FiUser />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-semibold text-gray-900 truncate">
                        {t.name}
                      </div>
                      {t.note && (
                        <div className="text-[12px] text-gray-400">
                          ({t.note})
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-none">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-[0.75rem] font-medium ${t.type === "Child" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {t.type}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              onSave?.(selected);
              onClose();
            }}
            className="bg-[#0D4B37] text-white px-4 py-2 rounded-md hover:bg-[#0b3f2f]"
            type="button"
          >
            Save & Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AllTravellersModal;
