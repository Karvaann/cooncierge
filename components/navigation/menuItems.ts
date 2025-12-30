import type { IconType } from "react-icons";
import { LuLayoutDashboard } from "react-icons/lu";
import { GoPeople } from "react-icons/go";
import { TbGraph, TbLuggage, TbBrandNetbeans } from "react-icons/tb";
import { LuClipboardList } from "react-icons/lu";
import { PiCurrencyCircleDollar } from "react-icons/pi";
import { RiContactsBook3Line } from "react-icons/ri";
import { IoSettingsOutline } from "react-icons/io5";
import { IoMdCheckboxOutline } from "react-icons/io";

export interface SubMenuItem {
  label: string;
  href: string;
}

export interface MenuItem {
  label: string;
  icon: IconType;
  href?: string | undefined;
  subMenu?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
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
    label: "Approvals",
    icon: IoMdCheckboxOutline,
    href: "/approvals",
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
  {
    label: "Settings",
    icon: IoSettingsOutline,
    href: "/settings",
  },
];

export const sidebarRouteHrefs = Array.from(
  new Set(
    menuItems.flatMap((item) => [
      item.href,
      ...(item.subMenu?.map((sub) => sub.href) ?? []),
    ])
  )
).filter(Boolean) as string[];
