"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IoChevronForward } from "react-icons/io5";
import { TbLayoutSidebarLeftCollapse } from "react-icons/tb";
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

function getMenuItemClassName(isHighlighted: boolean) {
  return [
    "group flex w-full items-center gap-3 rounded-[10px] px-3 py-2 transition-colors duration-200 outline-none",
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

  const renderMenuItem = (item: MenuItem, index: number) => {
    const isRouteSelected = isItemActive(pathname, item);
    const isExpanded = openSubMenuIndex === index;
    const showSubMenu = Boolean(item.subMenu?.length);
    const isLabelActive = isRouteSelected || isExpanded;
    const isHighlighted = isRouteSelected || isExpanded;
    const itemClasses = getMenuItemClassName(isHighlighted);

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
                  ? "group flex w-full items-center gap-3 px-3 py-2 text-[#7135AD] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#7135AD]/30"
                  : itemClasses
              }
              onClick={() => setOpenSubMenuIndex(isExpanded ? null : index)}
              title={!isOpen ? item.label : undefined}
            >
              {content}
            </button>

            {isOpen && isExpanded ? (
              <ul className="flex flex-col gap-0.5 border-l border-[#E8E8E8] pb-1.5 pl-6 ml-4">
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
    <aside aria-label="Primary navigation">
      {!isOpen ? null : (
      <div
        className="sidebar-shell fixed left-0 top-0 z-50 flex h-screen flex-col overflow-hidden border-r border-[#F0F0F0] bg-white transition-[width] duration-300 ease-out"
        style={{ width: SIDEBAR_WIDTH_OPEN }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-4 py-5">
          <span className="font-[Poppins,sans-serif] text-[22px] font-semibold leading-none text-[#7135AD]">
            ciergo
          </span>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#818181] transition-colors hover:bg-[#F5F5F5] hover:text-[#414141]"
            aria-label="Collapse sidebar"
          >
            <TbLayoutSidebarLeftCollapse size={18} />
          </button>
        </div>

        <nav
          aria-label="Sidebar"
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
      )}
    </aside>
  );
}
