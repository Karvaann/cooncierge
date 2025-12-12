"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { MdKeyboardArrowUp } from "react-icons/md";
import { TbGraph } from "react-icons/tb";
import { LuLayoutDashboard } from "react-icons/lu";
import { GoPeople } from "react-icons/go";
import { TbLuggage } from "react-icons/tb";
import { LuClipboardList } from "react-icons/lu";
import { PiCurrencyCircleDollar } from "react-icons/pi";
import { TbBrandNetbeans } from "react-icons/tb";
import { RiContactsBook3Line } from "react-icons/ri";

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  label: string;
  icon: IconType;
  href?: string | undefined;
  subMenu?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LuLayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Leads",
    icon: GoPeople,
    href: "/leads",
  },
  {
    label: "Sales",
    icon: TbGraph,
    subMenu: [
      { label: "Limitless", href: "/sales/limitless" },
      { label: "Other Services", href: "/sales/other-services" },
    ],
  },
  {
    label: "Operations",
    icon: TbBrandNetbeans,
    subMenu: [
      { label: "Limitless", href: "/operations/limitless" },
      { label: "Other Services", href: "/operations/other-services" },
    ],
  },
  {
    label: "Bookings",
    icon: TbLuggage,
    subMenu: [
      { label: "Limitless", href: "/bookings/limitless" },
      { label: "Other Services", href: "/bookings/other-services" },
    ],
  },
  {
    label: "Content",
    icon: LuClipboardList,
    href: undefined,
  },
  {
    label: "Finance",
    icon: PiCurrencyCircleDollar,
    subMenu: [
      { label: "Limitless", href: "/finance/limitless" },
      { label: "Other Services", href: "/finance/other-services" },
    ],
  },
  {
    label: "Directory",
    icon: RiContactsBook3Line,
    subMenu: [
      { label: "Customers", href: "/directory/customers" },
      { label: "Vendors", href: "/directory/vendors" },
      { label: "Team", href: "/directory/team" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [openSubMenuIndex, setOpenSubMenuIndex] = useState<number | null>(null);
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.href) {
        router.prefetch(item.href);
      }

      item.subMenu?.forEach((sub) => {
        router.prefetch(sub.href);
      });
    });
  }, [router]);

  return (
    <div
      className="flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen text-white border-r border-gray-700 transition-all transform duration-500 ease-in-out z-50 pt-3 ${
          isOpen ? "w-48" : "w-12"
        }`}
        style={{
          background:
            "linear-gradient(175.12deg, #0D4B37 27.08%, #63BB9E 153.71%)",
        }}
      >
        <div className="flex justify-center items-center w-full gap-3">
          {isOpen ? (
            <Image
              src="/logo/cooncierge-wordmark.svg"
              alt="Cooncierge wordmark"
              width={120}
              height={28}
              className="h-[28px] w-auto"
              priority
            />
          ) : (
            <Image
              src="/logo/cooncierge-logo-icon.svg"
              alt="Cooncierge logo"
              width={28}
              height={28}
              className="h-[28px] w-[28px]"
              priority
            />
          )}
        </div>

        <ul className="mt-4 space-y-1">
          {menuItems.map((item, index) => {
            const isActive = openSubMenuIndex === index;
            const showArrow = isOpen && Boolean(item.subMenu);
            const commonItemClasses =
              "flex items-center gap-2 px-4 h-8 transition-colors";

            return (
              <li
                key={item.label}
                className={`relative group ${isActive ? "bg-[#387a64]" : ""}`}
                style={{
                  background:
                    isActive || hoveredIndex === index ? "#387a64" : undefined,
                  transition: "background 0.3s",
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {item.subMenu ? (
                  <button
                    type="button"
                    className={`${commonItemClasses} w-full text-left text-white`}
                    onClick={() => setOpenSubMenuIndex(isActive ? null : index)}
                  >
                    <item.icon className="w-4 h-4" />
                    {isOpen && (
                      <span className="text-[0.75rem]">{item.label}</span>
                    )}
                    {showArrow && (
                      <MdKeyboardArrowUp
                        size={16}
                        className={`ml-auto transform transition-transform duration-300 text-gray-100 ${
                          isActive ? "" : "rotate-180"
                        }`}
                      />
                    )}
                  </button>
                ) : item.href ? (
                  <Link
                    prefetch
                    href={item.href}
                    className={`${commonItemClasses} text-white block w-full`}
                  >
                    <item.icon className="w-4 h-4" />
                    {isOpen && (
                      <span className="text-[0.75rem]">{item.label}</span>
                    )}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`${commonItemClasses} w-full text-left text-white/70 cursor-default`}
                    disabled
                  >
                    <item.icon className="w-4 h-4" />
                    {isOpen && (
                      <span className="text-[0.75rem]">{item.label}</span>
                    )}
                  </button>
                )}
                {item.subMenu && isOpen && (
                  <ul
                    className={`relative pl-8 mt-0 transition-all duration-300 ease-in-out overflow-hidden ${
                      isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                    style={{
                      background: isActive ? "#387a64" : undefined,
                      borderRadius: "0.5rem",
                      transition: "background 0.3s",
                    }}
                  >
                    {item.subMenu.map((sub) => (
                      <li key={sub.href}>
                        <div className="absolute left-7 top-2 bottom-2 w-[1px] bg-white"></div>
                        <Link
                          prefetch
                          href={sub.href}
                          className="block text-left text-[0.70rem] py-1 px-2 rounded text-white cursor-pointer"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
