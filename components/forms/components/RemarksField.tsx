"use client";

import React from "react";
import StyledDescription from "@/components/StyledDescription";

interface RemarksFieldProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  isSubmitting?: boolean;
  label?: string;
  headerRight?: React.ReactNode;
  showBorder?: boolean;
}

const RemarksField: React.FC<RemarksFieldProps> = ({
  value,
  onChange,
  readOnly = false,
  isSubmitting = false,
  label = "Remarks",
  headerRight,
  showBorder=true
}) => {
  return (
    <div className={`flex flex-col ${showBorder ? 'border border-[#E2E1E1] px-3 py-3' : ''} w-full rounded-[12px] mt-4`}>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-[13px] font-[500] text-[#020202]">
          {label}
        </label>
        {headerRight}
      </div>
      {showBorder && <hr className="mt-1 mb-2 border-t border-[#E2E1E1]" />}
      <div className="-mt-2 pb-2 rounded-[15px]">
        <StyledDescription
          value={String(value ?? "")}
          onChange={(val) => onChange(val)}
          readOnly={readOnly}
          // disabled prop intentionally left to match existing usage
        />
      </div>
    </div>
  );
};

export default RemarksField;
