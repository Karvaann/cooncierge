"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { GoSignOut } from "react-icons/go";
import { IoHomeOutline, IoPersonOutline } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { HiOutlineHandRaised } from "react-icons/hi2";
import { SlSettings } from "react-icons/sl";
import RaiseRequestModal from "./Modals/RaiseRequestModal";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useAuth } from "@/context/AuthContext";

// Type definitions
interface HeaderProps {
  isOpen: boolean;
}

type PieceMapKey =
  | "other-services"
  | "limitless"
  | "sales"
  | "tasks"
  | "leads"
  | "dashboard"
  | "operations"
  | "bookings"
  | "finance"
  | "directory"
  | "customers"
  | "team"
  | "vendors"
  | "settings"
  | "approvals"
  | "view-booking"
  | "ProfileSettings"
  | "UserProfile";

type HeaderMapKey =
  | "/sales/limitless"
  | "/sales/other-services"
  | "/bookings"
  | "/bookings"
  | "/operations/limitless"
  | "/operations/other-services"
  | "/finance/bookings"
  | "/finance/payments"
  | "/finance/customers"
  | "/finance/vendors"
  | "/leads"
  | "/tasks"
  | "/directory/vendors"
  | "/directory/customers"
  | "/directory/team"
  | "/dashboard"
  | "/settings"
  | "/approvals"
  | "/bookings/limitless/view-booking"
  | "/bookings/other-services/view-booking/flights"
  | "/bookings/other-services/view-booking/accommodation"
  | "/ProfileSettings"
  | "/ProfileSettings/UserProfile";

// Optimized constants with proper typing
const PIECE_MAP: Record<PieceMapKey, string> = {
  "other-services": "OS",
  limitless: "Limitless",
  sales: "Sales",
  tasks: "Tasks",
  leads: "Leads",
  dashboard: "Dashboard",
  operations: "Operations",
  bookings: "Bookings",
  finance: "Finance",
  directory: "Directory",
  customers: "Customers",
  team: "Team",
  vendors: "Vendors",
  ProfileSettings: "Profile Settings",
  UserProfile: "User Profile",
  settings: "Settings",
  "view-booking": "View Booking",
  approvals: "Approvals",
} as const;

const HEADER_MAP: Record<HeaderMapKey, string> = {
  "/sales/limitless": "Sales - Limitless",
  "/sales/other-services": "Sales - OS",
  "/bookings": "My Bookings",
  "/bookings/other-services/view-booking/flights": "My Bookings - OS",
  "/bookings/other-services/view-booking/accommodation": "My Bookings - OS",
  "/operations/limitless": "Operations - Limitless",
  "/operations/other-services": "Operations - OS",
  "/finance/bookings": "Finance - Bookings",
  "/finance/payments": "Finance - Payments",
  "/finance/customers": "Finance - Customers",
  "/finance/vendors": "Finance - Vendors",
  "/leads": "Leads",
  "/tasks": "Tasks",
  "/directory/vendors": "Directory - Vendors",
  "/directory/customers": "Directory - Customers",
  "/directory/team": "Directory - Team",
  "/dashboard": "Dashboard",
  "/ProfileSettings": "Profile Settings",
  "/ProfileSettings/UserProfile": "User Profile",
  "/settings": "Settings",
  "/approvals": "Approvals",
  "/bookings/limitless/view-booking": "Bookings - Limitless",
} as const;

const Header: React.FC<HeaderProps> = ({ isOpen: _isOpen }) => {
  const [isDropDownOpen, setIsDropDownOpen] = useState<boolean>(false);
  const [isRaiseRequestModalOpen, setIsRaiseRequestModalOpen] =
    useState<boolean>(false);
  const openRaiseRequestModal = () => setIsRaiseRequestModalOpen(true);
  const closeRaiseRequestModal = () => setIsRaiseRequestModalOpen(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Memoized handlers for better performance
  const handleLogOut = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const handleSettingsClick = useCallback(() => {
    router.push("/ProfileSettings/UserProfile");
  }, [router]);

  const toggleDropdown = useCallback(() => {
    setIsDropDownOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsDropDownOpen(false);
      }
    };

    if (isDropDownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropDownOpen]);

  // Memoized breadcrumb generation
  const breadcrumbElements = useMemo(() => {
    const urlPieces = pathname.split("/").slice(1);

    // For any view-booking route under bookings, always show:
    // Home / Bookings / View Booking
    const bookingsIndex = urlPieces.indexOf("bookings");
    const viewBookingIndex = urlPieces.indexOf("view-booking");
    if (
      bookingsIndex !== -1 &&
      viewBookingIndex !== -1 &&
      bookingsIndex < viewBookingIndex
    ) {
      return ["bookings", "view-booking"].map((piece, index) => (
        <span key={`${piece}-${index}`} className="flex items-center">
          <span className="text-gray-400 text-[12px] mx-1">/</span>
          <span className="text-[#114958] text-[12px] mr-1">
            {PIECE_MAP[piece as PieceMapKey] || piece}
          </span>
        </span>
      ));
    }

    // For view-booking pages, hide the intermediate service segment
    const filteredPieces = urlPieces.filter((piece, index, pieces) => {
      const isServiceSegment =
        piece === "limitless" || piece === "other-services";
      const isBetweenBookingsAndViewBooking =
        isServiceSegment &&
        pieces[index - 1] === "bookings" &&
        pieces[index + 1] === "view-booking";

      return !isBetweenBookingsAndViewBooking;
    });

    return filteredPieces.map((piece, index) => (
      <span key={`${piece}-${index}`} className="flex items-center">
        <span className="text-gray-400 text-[12px] mx-1">/</span>
        <span className="text-[#114958] text-[10px] mr-1">
          {PIECE_MAP[piece as PieceMapKey] || piece}
        </span>
      </span>
    ));
  }, [pathname]);

  // Memoized header title
  const headerTitle = useMemo(() => {
    return HEADER_MAP[pathname as HeaderMapKey] || "Dashboard";
  }, [pathname]);

  const dropdownClasses = useMemo(
    () =>
      `absolute right-0 top-full mt-4 -mr-3 w-70 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden transition-all duration-300 ease-in-out ${
        isDropDownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`,
    [isDropDownOpen],
  );

  useEffect(() => {
    // Close dropdown when pathname changes
    setIsDropDownOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30">
        {/* Header Main Row */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-1">
          {/* Left: Page Title */}
          <div>
            <h1 className="text-[18px] mt-1 font-[600] leading-[1.75rem] tracking-normal">
              {headerTitle}
            </h1>
          </div>

          {/* Right: Notification, Profile Avatar, Profile Settings */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with red dot */}
            <div className="relative">
              <button
                type="button"
                className="text-gray-500 hover:text-[#114958] transition-colors mt-1"
                aria-label="Notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-0.5 block w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>

            <div className="w-px h-7 bg-gray-300"></div>

            {/* Profile Avatar with dropdown */}
            <div
              className="flex items-center cursor-pointer relative"
              ref={menuRef}
            >
              <button
                type="button"
                onClick={toggleDropdown}
                className="flex items-center gap-1 text-gray-700 font-medium text-[0.75rem] hover:text-[#114958] transition-colors"
                aria-expanded={isDropDownOpen}
                aria-haspopup="true"
              >
                <div className="w-6 h-6 rounded-full bg-[#0D4B37] flex items-center justify-center">
                  <IoPersonOutline className="text-white w-3.5 h-3.5" />
                </div>
                <MdKeyboardArrowDown className="text-gray-700 w-3.5 h-3.5" />
              </button>

              {/* Dropdown menu */}
              <div className={dropdownClasses}>
                <div className="border-t border-gray-100 py-2 px-3 text-[14px]">
                  {/* User Info */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#0D4B37] rounded-full flex items-center justify-center text-white">
                      <IoPersonOutline className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-gray-900 text-[14px] font-medium">
                        {user?.name || "User Name"}
                      </div>
                      <div className="text-[12px] text-gray-500">
                        {user?.email || "user@email.com"}
                      </div>
                    </div>
                  </div>

                  <hr className="my-1.5 border-t border-gray-200" />

                  {/* Profile Settings */}
                  <button
                    type="button"
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-2 py-1.5 text-[14px] hover:text-gray-700 transition-colors"
                  >
                    <SlSettings className="mr-2 text-gray-600 w-3.5 h-3.5" />
                    Profile Info
                  </button>

                  {/* Raise Request */}
                  <button
                    type="button"
                    onClick={openRaiseRequestModal}
                    className="flex items-center w-full px-2 py-1.5 text-[14px] hover:text-gray-700 transition-colors"
                  >
                    <HiOutlineHandRaised className="mr-2 text-gray-600 w-3.5 h-3.5" />
                    Raise Request
                  </button>

                  <hr className="my-1.5 border-t border-gray-200" />

                  {/* Logout */}
                  <button
                    className="flex items-center w-full px-2 py-1.5 text-red-500 text-[14px] transition-colors"
                    onClick={handleLogOut}
                  >
                    <GoSignOut className="mr-2 w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumb Row */}
        {pathname !== "/settings" && (
          <div className="flex items-center px-5 py-2 bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M6.75 15.75V11.25C6.75 10.8522 6.90804 10.4706 7.18934 10.1893C7.47064 9.90804 7.85218 9.75 8.25 9.75H9.75C10.1478 9.75 10.5294 9.90804 10.8107 10.1893C11.092 10.4706 11.25 10.8522 11.25 11.25V15.75M3.75 9H2.25L9 2.25L15.75 9H14.25V14.25C14.25 14.6478 14.092 15.0294 13.8107 15.3107C13.5294 15.592 13.1478 15.75 12.75 15.75H5.25C4.85218 15.75 4.47064 15.592 4.18934 15.3107C3.90804 15.0294 3.75 14.6478 3.75 14.25V9Z"
                stroke="#114958"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {breadcrumbElements}
          </div>
        )}

        <RaiseRequestModal
          isOpen={isRaiseRequestModalOpen}
          onClose={closeRaiseRequestModal}
        />
      </header>
    </>
  );
};

export default React.memo(Header);
