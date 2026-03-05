"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MdKeyboardArrowUp } from "react-icons/md";
import { menuItems } from "@/components/navigation/menuItems";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [openSubMenuIndex, setOpenSubMenuIndex] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  let itemsToRender = menuItems;

  if (!user?.isBookingChecker) {
    itemsToRender = itemsToRender.filter((it) => it.label !== "Approvals");
  }

  const settingsItem = itemsToRender.find((item) => item.label === "Settings");
  const primaryItems = itemsToRender.filter((item) => item.label !== "Settings");

  const renderMenuItem = (item: (typeof menuItems)[number], index: number) => {
    const isRouteSelected = item.href
      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
      : (item.subMenu ?? []).some(
          (sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`),
        );
    const isExpanded = openSubMenuIndex === index;
    const isActive = isExpanded || isRouteSelected;
    const showArrow = isOpen && Boolean(item.subMenu);
    const commonItemClasses = "flex items-center gap-3 px-4 h-8";
    const labelClassName =
      "text-[13px] transition-transform duration-300 group-hover:translate-x-1";

    return (
      <li
        key={item.label}
        className={`relative group px-[3px] py-[8px] flex flex-col font-[400] items-center justify-center rounded-[16px] ${
          isRouteSelected
            ? "bg-gradient-to-r from-[#3E1466] to-[#110919] text-white shadow-[0_2px_8px_0_rgba(92,44,138,0.25)]"
            : isExpanded || hoveredIndex === index
              ? "bg-gradient-to-r from-[#585D7D] to-[#43527A] text-white"
              : "text-[#9CA3AF]"
        }`}
        style={{
          transition: "background 0.3s",
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {item.subMenu ? (
          <button
            type="button"
            className={`${commonItemClasses} w-full text-left`}
            onClick={() => setOpenSubMenuIndex(isActive ? null : index)}
          >
            <item.icon className="w-4 h-4" />
            {isOpen && <span className={labelClassName}>{item.label}</span>}
            {showArrow && (
              <MdKeyboardArrowUp
                size={16}
                className={`ml-auto transform transition-transform duration-300 text-gray-100 ${
                  !isActive ? "rotate-90" : "rotate-180"
                }`}
              />
            )}
          </button>
        ) : item.href ? (
          <Link
            prefetch
            href={item.href}
            className={`${commonItemClasses} block w-full`}
          >
            <item.icon className="w-4 h-4" />
            {isOpen && <span className={labelClassName}>{item.label}</span>}
          </Link>
        ) : (
          <button
            type="button"
            className={`${commonItemClasses} w-full text-left font-[400] cursor-default`}
            disabled
          >
            <item.icon className="w-4 h-4" />
            {isOpen && <span className={labelClassName}>{item.label}</span>}
          </button>
        )}
        {!isOpen && hoveredIndex === index && (
          <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[70] -translate-y-1/2">
            <div className="relative rounded-[14px] bg-[#2F343D] px-5 py-3 text-[14px] font-[600] text-white shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
              <span className="whitespace-nowrap">{item.label}</span>
              <span className="absolute left-0 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[4px] bg-[#2F343D]" />
            </div>
          </div>
        )}
        {item.subMenu && isOpen && (
          <ul
            className={`relative pl-4 border-l flex flex-col gap-2 mt-1 border-l-[rgba(235,215,255,0.40)] transition-all duration-300 ease-in-out overflow-hidden ${
              isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            }`}
            style={{
              transition: "background 0.3s",
            }}
          >
            {item.subMenu.map((sub) => (
              <li key={sub.href}>
                {(() => {
                  const isSubRouteSelected =
                    pathname === sub.href || pathname.startsWith(`${sub.href}/`);

                  return (
                <Link
                  prefetch
                  href={sub.href}
                  className={`block rounded px-2 text-left font-[400] text-[12px] leading-[19px] transition-all duration-300 cursor-pointer ${
                    isSubRouteSelected
                      ? "translate-x-1 text-[#D8B2FF]"
                      : "text-white hover:translate-x-1 hover:text-[#D8B2FF]"
                  }`}
                >
                  {sub.label}
                </Link>
                  );
                })()}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        event.target instanceof Node &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  return (
    <aside
      className="flex"
      aria-label="Primary navigation"
    >
      <div
        ref={sidebarRef}
        className={`fixed m-3 left-0 rounded-[33px] bg-[#110919] top-0 z-50 flex h-[95vh] flex-col shadow-[0_2px_8px_0_rgba(0,0,0,0.06)] pt-5 text-white transition-[width] duration-300 ease-out ${
          isOpen ? "w-48" : "w-[68px]"
        }`}
      >
        <div className="flex justify-center items-center w-full">
          {isOpen ? (
            <Image
              src="/icons/sidebar/cooncierge-full.svg"
              alt="Cooncierge wordmark"
              width={120}
              height={28}
              className="h-[66px] w-auto"
              priority
            />
          ) : (
            <Image
              src="/icons/sidebar/cooncierge.svg"
              alt="Cooncierge logo"
              width={84}
              height={68}
              className="h-[64px] w-[120px]"
              priority
            />
          )}
        </div>

        <nav aria-label="Sidebar" className="mt-0 flex min-h-0 flex-1 flex-col justify-between">
          <ul className="p-[8px] space-y-1">
            {primaryItems.map((item, index) => renderMenuItem(item, index))}
          </ul>
          {settingsItem ? (
            <ul className="p-[8px] pt-0">
              {renderMenuItem(settingsItem, primaryItems.length)}
            </ul>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
