"use client";

import MultiSelectFilterDropdown, {
  type MultiSelectFilterOption,
} from "./MultiSelectFilterDropdown";

export type CustomerTierFilterValue = "1" | "2" | "3";

export const DEFAULT_TIER_FILTER: CustomerTierFilterValue[] = ["1", "2", "3"];

export const CUSTOMER_TIER_FILTER_OPTIONS: MultiSelectFilterOption<CustomerTierFilterValue>[] =
  [
    {
      value: "1",
      label: "Tier I",
      iconSrc: "/icons/tier-1.svg",
    },
    {
      value: "2",
      label: "Tier II",
      iconSrc: "/icons/tier-2.svg",
    },
    {
      value: "3",
      label: "Tier III",
      iconSrc: "/icons/tier-3.svg",
    },
  ];

export const resolveTierFilterValue = (
  tier: number | string | null | undefined,
): CustomerTierFilterValue => {
  const rating = Math.min(Math.max(Math.round(Number(tier) || 1), 1), 3);
  return String(rating) as CustomerTierFilterValue;
};

type CustomerTierFilterDropdownProps = {
  pendingValues: CustomerTierFilterValue[];
  onToggle: (value: CustomerTierFilterValue) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onReset: () => void;
  onApply: () => void;
};

const CustomerTierFilterDropdown: React.FC<CustomerTierFilterDropdownProps> = (
  props,
) => (
  <MultiSelectFilterDropdown
    {...props}
    options={CUSTOMER_TIER_FILTER_OPTIONS}
    className="w-[268px]"
    maxListHeightClassName=""
  />
);

export default CustomerTierFilterDropdown;
