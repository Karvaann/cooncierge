"use client";

import React, { useEffect, useMemo, useState } from "react";
import SideSheet from "@/components/SideSheet";
import Button from "@/components/Button";

export type BankPayload = {
  name: string;
  accountNumber: string;
  ifscCode: string;
  accountType: "savings" | "current";
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
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [accountType, setAccountType] = useState<"savings" | "current">(
    "savings",
  );

  const canSubmit = useMemo(
    () =>
      bankName.trim().length > 0 &&
      accountNumber.trim().length > 0 &&
      ifscCode.trim().length > 0,
    [bankName, accountNumber, ifscCode],
  );

  useEffect(() => {
    if (!isOpen) {
      setBankName("");
      setAccountNumber("");
      setIfscCode("");
      setAccountType("savings");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      accountType,
    });
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
                  Account Number
                </label>
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="Enter IFSC code"
                  className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) =>
                    setAccountType(e.target.value as "savings" | "current")
                  }
                  className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
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
