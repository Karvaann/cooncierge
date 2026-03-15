"use client";

import React from "react";
import StyledDescription from "@/components/StyledDescription";

interface RemarksFieldProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  isSubmitting?: boolean;
}

const RemarksField: React.FC<RemarksFieldProps> = ({
  value,
  onChange,
  readOnly = false,
  isSubmitting = false,
}) => {
  return (
    <div className="flex flex-col border border-[#E2E1E1] w-full rounded-[12px] px-3.5 py-3.5 mt-4">
      <label className="block text-[13px] font-[500] text-[#020202]">
        Remarks
        <hr className="mt-1 mb-2 border-t border-[#E2E1E1]" />
      </label>
      <div className="-mt-2 ml-1 pb-2 rounded-[15px]">
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
