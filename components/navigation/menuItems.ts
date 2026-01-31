import type { IconType } from "react-icons";
import { LuLayoutDashboard } from "react-icons/lu";
import { GoPeople } from "react-icons/go";
import { TbGraph, TbLuggage, TbBrandNetbeans } from "react-icons/tb";
import { LuClipboardList } from "react-icons/lu";
import { PiCurrencyCircleDollar } from "react-icons/pi";
import { RiContactsBook3Line } from "react-icons/ri";
import { IoSettingsOutline } from "react-icons/io5";
import { IoMdCheckboxOutline } from "react-icons/io";
import { TbFileReport } from "react-icons/tb";

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
    label: "Tasks",
    icon: LuLayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Sales",
    icon: TbGraph,
    subMenu: [
      { label: "Leads", href: "/sales/leads" },
      { label: "Quotations", href: "/sales/quotations" },
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
      // { label: "Limitless", href: "/bookings/limitless" },
      { label: "Other Services", href: "/bookings/other-services" },
    ],
  },
  {
    label: "Approvals",
    icon: IoMdCheckboxOutline,
    subMenu: [
      { label: "Limitless", href: "/approvals/limitless" },
      { label: "Other Services", href: "/approvals/other-services" },
    ],
  },
  {
    label: "Finance",
    icon: PiCurrencyCircleDollar,
    subMenu: [
      { label: "Bookings", href: "/finance/bookings" },
      { label: "Customers", href: "/finance/customers" },
      { label: "Vendors", href: "/finance/vendors" },
      { label: "Payments", href: "/finance/payments" },
      { label: "Journals", href: "/finance/journals" },
      
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
    label: "Reports",
    icon: TbFileReport,
    href: "/reports",
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
