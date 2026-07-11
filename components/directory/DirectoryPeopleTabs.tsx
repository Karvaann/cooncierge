"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const pathname = usePathname();
  const [displayActiveTab, setDisplayActiveTab] = useState(activeTab);
  const routeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTravellersPage = pathname?.startsWith("/directory/travellers") ?? false;
  const isCustomersPage = pathname?.startsWith("/directory/customers") ?? false;

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
    setDisplayActiveTab(tab);

    // Travellers: stay local when already on travellers page (e.g. Deleted → Travellers)
    if (tab === "Travellers") {
      if (isTravellersPage) {
        onLocalTabChange?.(tab);
        return;
      }
      pushAfterTabMoves("/directory/travellers");
      return;
    }

    // Customers: stay local when already on customers page (e.g. Deleted → Customers)
    if (tab === "Customers") {
      if (isCustomersPage) {
        onLocalTabChange?.(tab);
        return;
      }
      pushAfterTabMoves("/directory/customers");
      return;
    }

    // Local-only tabs on the current page (Deleted, Draft, etc.)
    if (onLocalTabChange && tabs.includes(tab)) {
      onLocalTabChange(tab);
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
