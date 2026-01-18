"use client";

import React, { useEffect, useMemo, useState } from "react";
import SideSheet from "@/components/SideSheet";
import Button from "@/components/Button";

export type BankPayload = {
  name: string;
  alias: string;
};

interface AddBankSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bank: BankPayload) => void;
}

const AddBankSidesheet: React.FC<AddBankSidesheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [bankName, setBankName] = useState<string>("");
  const [bankAlias, setBankAlias] = useState<string>("");

  const canSubmit = useMemo(
    () => bankName.trim().length > 0 && bankAlias.trim().length > 0,
    [bankAlias, bankName],
  );

  useEffect(() => {
    if (!isOpen) {
      setBankName("");
      setBankAlias("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: bankName.trim(), alias: bankAlias.trim() });
  };

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bank"
      width="lg"
      position="right"
      zIndex={1050}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-6 pb-24">
          <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-white">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Bank Alias
                </label>
                <input
                  value={bankAlias}
                  onChange={(e) => setBankAlias(e.target.value)}
                  placeholder="Enter bank alias"
                  className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center gap-2">
          <Button
            text="Cancel"
            onClick={onClose}
            bgColor="bg-gray-100"
            textColor="text-gray-700"
            className="py-3 text-[13px] font-semibold"
          />
          <Button
            text="Add Bank"
            onClick={handleSubmit}
            bgColor="bg-[#0D4B37]"
            textColor="text-white"
            disabled={!canSubmit}
            className="py-3 text-[13px] font-semibold"
          />
        </div>
      </div>
    </SideSheet>
  );
};

export default AddBankSidesheet;
