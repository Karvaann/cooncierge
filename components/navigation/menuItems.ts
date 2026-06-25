export interface SubMenuItem {
  label: string;
  href: string;
}

export interface MenuItem {
  label: string;
  icon: string;
  href?: string;
  subMenu?: SubMenuItem[];
}

export const SIDEBAR_WIDTH_OPEN = 200;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: "/icons/sidebar-icons/dashboard.svg",
    href: "/tasks",
  },
  {
    label: "Sales",
    icon: "/icons/sidebar-icons/sales.svg",
    subMenu: [
      { label: "Leads", href: "/sales/leads" },
      { label: "Quotations", href: "/sales/quotations" },
    ],
  },
  {
    label: "Operations",
    icon: "/icons/sidebar-icons/operations.svg",
    href: "/operations",
  },
  {
    label: "Bookings",
    icon: "/icons/sidebar-icons/bookings.svg",
    href: "/bookings",
  },
  {
    label: "Approvals",
    icon: "/icons/sidebar-icons/approvals.svg",
    subMenu: [{ label: "Other Services", href: "/approvals/other-services" }],
  },
  {
    label: "Content",
    icon: "/icons/sidebar-icons/content.svg",
    href: "/content",
  },
  {
    label: "Finance",
    icon: "/icons/sidebar-icons/finance.svg",
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
    icon: "/icons/sidebar-icons/directory.svg",
    subMenu: [
      { label: "Travellers", href: "/directory/travellers" },
      { label: "Customers", href: "/directory/customers" },
      { label: "Vendors", href: "/directory/vendors" },
      { label: "Team", href: "/directory/team" },
    ],
  },
  {
    label: "Reports",
    icon: "/icons/sidebar-icons/reports.svg",
    href: "/reports",
  },
  {
    label: "Settings",
    icon: "/icons/sidebar-icons/settings.svg",
    href: "/settings",
    subMenu: [
      { label: "Company Details", href: "/settings#company" },
      { label: "All Users / Roles", href: "/settings#users" },
      { label: "Approvals", href: "/settings#approvals" },
    ],
  },
];

export const sidebarRouteHrefs = Array.from(
  new Set(
    menuItems.flatMap((item) => [
      item.href,
      ...(item.subMenu?.map((sub) => sub.href.split("#")[0]) ?? []),
    ]),
  ),
).filter(Boolean) as string[];
