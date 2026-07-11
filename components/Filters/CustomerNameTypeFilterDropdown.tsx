"use client";

import { LuUser } from "react-icons/lu";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import MultiSelectFilterDropdown, {
  type MultiSelectFilterOption,
} from "./MultiSelectFilterDropdown";

export type CustomerNameTypeFilterValue = "individual" | "corporate";

export const DEFAULT_CUSTOMER_NAME_TYPE_FILTER: CustomerNameTypeFilterValue[] =
  ["individual", "corporate"];

export const CUSTOMER_NAME_TYPE_FILTER_OPTIONS: MultiSelectFilterOption<CustomerNameTypeFilterValue>[] =
  [
    { value: "individual", label: "Individual", icon: LuUser },
    { value: "corporate", label: "Corporate", icon: HiOutlineBuildingOffice2 },
  ];

type CustomerNameTypeFilterDropdownProps = {
  pendingValues: CustomerNameTypeFilterValue[];
  onToggle: (value: CustomerNameTypeFilterValue) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onReset: () => void;
  onApply: () => void;
};

const CustomerNameTypeFilterDropdown: React.FC<
  CustomerNameTypeFilterDropdownProps
> = (props) => (
  <MultiSelectFilterDropdown
    {...props}
    options={CUSTOMER_NAME_TYPE_FILTER_OPTIONS}
    className="w-[268px]"
    maxListHeightClassName=""
  />
);

export default CustomerNameTypeFilterDropdown;
