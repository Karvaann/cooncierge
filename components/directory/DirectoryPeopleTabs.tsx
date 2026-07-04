"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TableTabs from "@/components/TableTabs";

export const CUSTOMER_PAGE_TABS = ["Customers", "Travellers", "Deleted"] as const;
export const TRAVELLER_PAGE_TABS = CUSTOMER_PAGE_TABS;
const ROUTE_TAB_ANIMATION_DELAY_MS = 160;

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
  const [displayActiveTab, setDisplayActiveTab] = useState(activeTab);
  const routeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayActiveTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    router.prefetch("/directory/customers");
    router.prefetch("/directory/travellers");

    return () => {
      if (routeTimeoutRef.current) {
        clearTimeout(routeTimeoutRef.current);
      }
    };
  }, [router]);

  const pushAfterTabMoves = (href: string) => {
    if (routeTimeoutRef.current) {
      clearTimeout(routeTimeoutRef.current);
    }

    routeTimeoutRef.current = setTimeout(() => {
      router.push(href);
      routeTimeoutRef.current = null;
    }, ROUTE_TAB_ANIMATION_DELAY_MS);
  };

  const handleChange = (tab: string) => {
    const isTravellersPage = activeTab === "Travellers";
    setDisplayActiveTab(tab);

    if (tab === "Travellers" && activeTab !== "Travellers") {
      pushAfterTabMoves("/directory/travellers");
      return;
    }

    if (onLocalTabChange && tabs.includes(tab)) {
      // On travellers page, "Customers" switches to the customers directory route.
      if (tab === "Customers" && isTravellersPage) {
        pushAfterTabMoves("/directory/customers");
        return;
      }

      onLocalTabChange(tab);
      return;
    }

    if (tab === "Customers") {
      pushAfterTabMoves("/directory/customers");
    }
  };

  return (
    <TableTabs
      tabs={[...tabs]}
      activeTab={displayActiveTab}
      onChange={handleChange}
      totalCount={totalCount}
    />
  );
}
