"use client";
import React from "react";
import DropDown from "../DropDown";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  customWidth?: string;
  menuWidth?: string;
  className?: string;
};

const TierDropDown: React.FC<Props> = ({
  value,
  onChange,
  disabled,
  customWidth,
  menuWidth,
  className,
}) => {
  const options = [
    {
      value: "tier1",
      label: (
        <div className="flex items-center gap-2">
          <img
            src="/icons/tier-icons/tier-1-svg.svg"
            alt="Tier 1"
            className="w-5 h-5"
          />
          <span className="text-[13px] font-medium">1</span>
        </div>
      ),
    },
    {
      value: "tier2",
      label: (
        <div className="flex items-center gap-2">
          <img
            src="/icons/tier-icons/tier-2-svg.svg"
            alt="Tier 2"
            className="w-5 h-5"
          />
          <span className="text-[13px] font-medium">2</span>
        </div>
      ),
    },
    {
      value: "tier3",
      label: (
        <div className="flex items-center gap-2">
          <img
            src="/icons/tier-icons/tier-3-svg.svg"
            alt="Tier 3"
            className="w-5 h-5"
          />
          <span className="text-[13px] font-medium">3</span>
        </div>
      ),
    },
    {
      value: "tier4",
      label: (
        <div className="flex items-center gap-2">
          <img
            src="/icons/tier-icons/tier-4-svg.svg"
            alt="Tier 4"
            className="w-5 h-5"
          />
          <span className="text-[13px] font-medium">4</span>
        </div>
      ),
    },
    {
      value: "tier5",
      label: (
        <div className="flex items-center gap-2">
          <img
            src="/icons/tier-icons/tier-5-svg.svg"
            alt="Tier 5"
            className="w-5 h-5"
          />
          <span className="text-[13px] font-medium">5</span>
        </div>
      ),
    },
  ];

  return (
    <DropDown
      options={options}
      value={value}
      onChange={onChange}
      disabled={!!disabled}
      customWidth={customWidth || ""}
      menuWidth={menuWidth || ""}
      className={className || ""}
      buttonClassName="px-3 py-1.5 text-[#020202] font-[400] hover:border-[#C6AEDE] rounded-[15px]"
      noButtonRadius
    />
  );
};

export default TierDropDown;
