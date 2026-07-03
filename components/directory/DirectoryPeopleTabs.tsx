"use client";

import { useRouter } from "next/navigation";
import TableTabs from "@/components/TableTabs";

export const TRAVELLER_PAGE_TABS = ["Travellers", "Customers", "Deleted"] as const;
export const CUSTOMER_PAGE_TABS = ["Customers", "Draft", "Deleted"] as const;

type DirectoryPeopleTabsProps = {
  tabs: readonly string[];
  activeTab: string;
  totalCount: number;
  /** Called when a tab should be handled on the current page (e.g. Draft, Deleted). */
  onLocalTabChange?: (tab: string) => void;
};

export default function DirectoryPeopleTabs({
  tabs,
  activeTab,
  totalCount,
  onLocalTabChange,
}: DirectoryPeopleTabsProps) {
  const router = useRouter();

  const handleChange = (tab: string) => {
    const isTravellersPage = tabs.includes("Travellers");

    if (onLocalTabChange && tabs.includes(tab)) {
      // On travellers page, "Customers" switches to the customers directory route.
      if (tab === "Customers" && isTravellersPage) {
        router.push("/directory/customers");
        return;
      }

      onLocalTabChange(tab);
      return;
    }

    if (tab === "Travellers") {
      router.push("/directory/travellers");
      return;
    }

    if (tab === "Customers") {
      router.push("/directory/customers");
    }
  };

  return (
    <TableTabs
      tabs={[...tabs]}
      activeTab={activeTab}
      onChange={handleChange}
      totalCount={totalCount}
    />
  );
}
