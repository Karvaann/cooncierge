"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IoChevronForward } from "react-icons/io5";
import SidebarNavIcon from "@/components/navigation/SidebarNavIcon";
import {
  menuItems,
  SIDEBAR_WIDTH_OPEN,
  type MenuItem,
} from "@/components/navigation/menuItems";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

function getLabelClassName(isActive: boolean, isShifted = isActive) {
  return [
    "sidebar-nav-label flex-1 text-left",
    isShifted ? "is-active" : "",
    "group-focus-visible:text-[#7135AD]",
    isActive
      ? "font-medium text-[#7135AD]"
      : "font-normal text-[#818181] group-hover:text-[#7135AD]",
  ].join(" ");
}

function getSubLabelClassName(isActive: boolean) {
  return [
    "sidebar-nav-label",
    isActive ? "is-active" : "",
    "group-focus-visible:text-[#7135AD]",
    isActive
      ? "font-medium text-[#7135AD]"
      : "font-normal text-[#818181] group-hover:text-[#7135AD]",
  ].join(" ");
}

function getMenuItemClassName(isHighlighted: boolean, isOpen: boolean) {
  return [
    "group flex w-full items-center rounded-[10px] py-2 transition-colors duration-200 outline-none",
    isOpen ? "gap-3 px-3" : "justify-center px-0",
    "focus-visible:bg-[#F5F5F5]",
    isHighlighted
      ? "bg-[#F5F5F5] text-[#7135AD]"
      : "text-[#818181]",
  ].join(" ");
}

function isItemActive(pathname: string, item: MenuItem): boolean {
  if (item.href) {
    const baseHref = item.href.split("#")[0] ?? item.href;
    return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  }

  return (item.subMenu ?? []).some((sub) => {
    const baseHref = sub.href.split("#")[0] ?? sub.href;
    return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  });
}

function isSubItemActive(pathname: string, href: string): boolean {
  const baseHref = href.split("#")[0] ?? href;
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [openSubMenuIndex, setOpenSubMenuIndex] = useState<number | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  const itemsToRender = useMemo(() => {
    if (!user?.isBookingChecker) {
      return menuItems.filter((item) => item.label !== "Approvals");
    }

    return menuItems;
  }, [user?.isBookingChecker]);

  const settingsItem = itemsToRender.find((item) => item.label === "Settings");
  const primaryItems = itemsToRender.filter((item) => item.label !== "Settings");

  useEffect(() => {
    const activeIndex = itemsToRender.findIndex((item) => isItemActive(pathname, item));
    if (activeIndex >= 0 && itemsToRender[activeIndex]?.subMenu) {
      setOpenSubMenuIndex(activeIndex);
    }
  }, [pathname, itemsToRender]);

  useEffect(() => {
    if (!isOpen) {
      setOpenSubMenuIndex(null);
    }
  }, [isOpen]);

  const renderMenuItem = (item: MenuItem, index: number) => {
    const isRouteSelected = isItemActive(pathname, item);
    const isExpanded = openSubMenuIndex === index;
    const showSubMenu = Boolean(item.subMenu?.length);
    const isLabelActive = isRouteSelected || isExpanded;
    const isHighlighted = isRouteSelected || isExpanded;
    const itemClasses = getMenuItemClassName(isHighlighted, isOpen);

    const content = (
      <>
        <SidebarNavIcon
          src={item.icon}
          active={isRouteSelected || isExpanded}
          className={
            isRouteSelected || isExpanded ? "" : "group-hover:bg-[#7135AD]"
          }
        />
        {isOpen ? (
          <>
            <span className={getLabelClassName(isLabelActive, !showSubMenu && isRouteSelected)}>
              {item.label}
            </span>
            {showSubMenu ? (
              <IoChevronForward
                className={`sidebar-nav-chevron shrink-0 transition-transform duration-200 ${
                  isLabelActive
                    ? "text-[#7135AD]"
                    : "text-[#818181] group-hover:text-[#7135AD]"
                } ${isExpanded ? "rotate-90" : ""}`}
              />
            ) : null}
          </>
        ) : null}
      </>
    );

    return (
      <li key={item.label}>
        {showSubMenu ? (
          <div
            className={
              isExpanded ? "overflow-hidden rounded-[10px] bg-[#F5F5F5]" : ""
            }
          >
            <button
              type="button"
              className={
                isExpanded
                  ? `group flex w-full items-center py-2 text-[#7135AD] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#7135AD]/30 ${
                      isOpen ? "gap-3 px-3" : "justify-center px-0"
                    }`
                  : itemClasses
              }
              onClick={() => setOpenSubMenuIndex(isExpanded ? null : index)}
              title={!isOpen ? item.label : undefined}
            >
              {content}
            </button>

            {isOpen && isExpanded ? (
              <ul className="ml-8 flex flex-col gap-0.5 border-l border-[#E8E8E8] pb-1.5 pl-2">
                {item.subMenu?.map((sub) => {
                  const isSubActive = isSubItemActive(pathname, sub.href);

                  return (
                    <li key={sub.href}>
                      <Link
                        prefetch
                        href={sub.href}
                        className="group block rounded-[8px] px-2 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#7135AD]/30"
                        aria-current={isSubActive ? "page" : undefined}
                      >
                        <span className={getSubLabelClassName(isSubActive)}>
                          {sub.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : item.href ? (
          <Link
            prefetch
            href={item.href}
            className={itemClasses}
            title={!isOpen ? item.label : undefined}
            aria-current={isRouteSelected ? "page" : undefined}
          >
            {content}
          </Link>
        ) : (
          <button type="button" className={`${itemClasses} cursor-default`} disabled title={item.label}>
            {content}
          </button>
        )}
      </li>
    );
  };

  return (
    <aside aria-label="Primary navigation" aria-hidden={!isOpen}>
      <div
        className={`sidebar-shell fixed left-0 top-0 z-50 h-screen overflow-hidden border-[#F0F0F0] bg-white transition-[width,border-width] duration-[450ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? "" : "pointer-events-none"
        }`}
        style={{
          width: isOpen ? SIDEBAR_WIDTH_OPEN : 0,
          borderRightWidth: isOpen ? 1 : 0,
        }}
      >
        <div
          className="flex h-full flex-col"
          style={{ width: SIDEBAR_WIDTH_OPEN }}
        >
          <div className="h-[72px] shrink-0 border-b border-[#F0F0F0]" />

          <nav
            aria-label="Sidebar"
            aria-hidden={!isOpen}
            className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-3 py-4"
          >
            <ul className="flex flex-col gap-1">{primaryItems.map(renderMenuItem)}</ul>

            {settingsItem ? (
              <ul className="mt-4 flex flex-col gap-1 border-t border-[#F0F0F0] pt-4">
                {renderMenuItem(settingsItem, primaryItems.length)}
              </ul>
            ) : null}
          </nav>
        </div>
      </div>
    </aside>
  );
}
