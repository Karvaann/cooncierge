"use client";

import { IoAddCircleOutline } from "react-icons/io5";
import MultiSelectFilterDropdown, {
  type MultiSelectFilterOption,
} from "./MultiSelectFilterDropdown";
import {
  DEFAULT_SOURCE_FILTER,
  resolveSourceFilterValue,
  type CustomerSourceFilterValue,
} from "@/utils/customerSourceFilter";

export type { CustomerSourceFilterValue };
export { DEFAULT_SOURCE_FILTER, resolveSourceFilterValue };

const SOURCE_FILTER_OPTIONS: MultiSelectFilterOption<CustomerSourceFilterValue>[] =
  [
    {
      value: "meta-organic",
      label: "Meta (Organic)",
      iconSrc: "/icons/source-icons/meta.svg",
    },
    {
      value: "meta-paid",
      label: "Meta (Paid)",
      iconSrc: "/icons/source-icons/meta.svg",
    },
    {
      value: "google-organic",
      label: "Google (Organic)",
      iconSrc: "/icons/source-icons/google-organic.svg",
    },
    {
      value: "google-paid",
      label: "Google (Paid)",
      iconSrc: "/icons/source-icons/google-organic.svg",
    },
    {
      value: "seo-organic",
      label: "SEO (Organic)",
      iconSrc: "/icons/source-icons/seo.svg",
    },
    {
      value: "seo-paid",
      label: "SEO (Paid)",
      iconSrc: "/icons/source-icons/seo.svg",
    },
    {
      value: "word-of-mouth",
      label: "Word of Mouth",
      iconSrc: "/icons/source-icons/word-of-mouth.svg",
    },
    {
      value: "referral",
      label: "Referral",
      iconSrc: "/icons/source-icons/referal.svg",
    },
    { value: "none", label: "No Category" },
  ];

type CustomerSourceFilterDropdownProps = {
  pendingValues: CustomerSourceFilterValue[];
  onToggle: (value: CustomerSourceFilterValue) => void;
  onDeselectAll: () => void;
  onReset: () => void;
  onApply: () => void;
  onAddCategory?: () => void;
};

const CustomerSourceFilterDropdown: React.FC<CustomerSourceFilterDropdownProps> = ({
  onAddCategory,
  ...props
}) => (
  <MultiSelectFilterDropdown
    {...props}
    options={SOURCE_FILTER_OPTIONS}
    footerAction={{
      label: "Add Category",
      icon: IoAddCircleOutline,
      ...(onAddCategory ? { onClick: onAddCategory } : {}),
    }}
  />
);

export default CustomerSourceFilterDropdown;
