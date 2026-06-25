"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { GoSignOut } from "react-icons/go";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { HiOutlineHandRaised } from "react-icons/hi2";
import { SlSettings } from "react-icons/sl";
import { CiSearch } from "react-icons/ci";
import RaiseRequestModal from "./Modals/RaiseRequestModal";
import { MdKeyboardArrowDown } from "react-icons/md";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { TbLayoutSidebarLeftExpand } from "react-icons/tb";

interface HeaderProps {
  isSidebarOpen: boolean;
  onSidebarExpand: () => void;
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

const PROFILE_IMAGE_SRC = "/images/profile/profile-img.png";

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onSidebarExpand }) => {
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
        <div key={`${piece}-${index}`} className="flex gap-[5px] items-center">
          <div className="text-[#414141] text-[14px] mx-1">/</div>
          <div className="text-[#7135AD] text-[14px] mr-1">
            {PIECE_MAP[piece as PieceMapKey] || piece}
          </div>
        </div>
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
      <div key={`${piece}-${index}`} className="flex gap-[5px] items-baseline">
        <div className="text-[#414141] text-[14px] mx-1">/</div>
        <div className="text-[#7135AD] text-[14px] mr-1">
          {PIECE_MAP[piece as PieceMapKey] || piece}
        </div>
      </div>
    ));
  }, [pathname]);

  // Memoized header title
  // const headerTitle = useMemo(() => {
  //   return HEADER_MAP[pathname as HeaderMapKey] || "Dashboard";
  // }, [pathname]);

  const dropdownClasses = useMemo(
    () =>
      `absolute right-0 top-full mt-4 -mr-3 w-70 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden transition-all duration-300 ease-in-out ${isDropDownOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
        <div
          className={`flex items-center justify-between py-6 ${
            isSidebarOpen ? "px-7" : "pl-[14px] pr-7"
          }`}
        >
          <div className="flex min-w-0 items-center gap-[22px]">
            {!isSidebarOpen && (
              <div className="sidebar-logo-collapsed flex shrink-0 items-center gap-2 rounded-[12px] border border-[#F0F0F0] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <Image
                  src="/full_logo.svg"
                  alt="ciergo"
                  width={90}
                  height={28}
                  className="h-7 w-auto object-contain"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={onSidebarExpand}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#818181] transition-colors hover:bg-[#F5F5F5] hover:text-[#414141]"
                  aria-label="Expand sidebar"
                >
                  <TbLayoutSidebarLeftExpand size={18} />
                </button>
              </div>
            )}

            {pathname !== "/settings" && (
              <div className="flex min-w-0 items-center gap-[3px]">
                <Image width={22} height={22} src="/icons/header/home.svg" alt="Home" />
                {breadcrumbElements}
              </div>
            )}
          </div>

          {/* Here the text box will come   */}
          <div className="mx-10 hidden flex-1 items-center justify-center xl:flex">
            <div className="flex w-full px-[13px] py-[8px] max-w-[420px] items-center rounded-[14px] border border-[#F0F0F0] bg-white shadow-[0_2px_8px_0_rgba(0,0,0,0.06)]">
              <Image src="/icons/header/search.svg" alt="search" width={20} height={20} className="text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search or type command..."
                className="ml-[13px] min-w-0 flex-1 bg-transparent text-[14px] font-[400] text-[#9CA3AF] outline-none placeholder:text-[#9CA3AF]"
              />
              <div className="ml-4 flex items-center gap-3 text-[#98A1B2]">
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E8E8E8] bg-[#FAFAFA] text-[18px] font-[400] leading-none">
                  ⌘
                </div>
                <span className="text-[16px] font-[400] leading-none">K</span>
              </div>
            </div>
          </div>

          {/* Right: Notification, Profile Avatar, Profile Settings */}
          <div className="flex items-center gap-[22px]">
            {/* Notification Bell with red dot */}
            <div className="relative">
              <button
                type="button"
                className="mt-1 cursor-pointer text-gray-500 transition-colors hover:text-[#114958]"
                aria-label="Notifications"
              >
                <Image width={22} height={22} src="/icons/header/notification.svg" alt="notofication" />
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
                className="flex cursor-pointer items-center gap-3 text-[0.75rem] font-medium text-gray-700 transition-colors hover:text-[#114958]"
                aria-expanded={isDropDownOpen}
                aria-haspopup="true"
              >
                <Image
                  src={PROFILE_IMAGE_SRC}
                  alt={user?.name || "Profile"}
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 cursor-pointer rounded-full border-2 border-[#D2D2D2] object-cover"
                />
                <div>
                  <div className="text-gray-900 text-[14px] text-left font-medium">
                    {user?.name || "User Name"}
                  </div>
                  <div className="text-[21x] text-left text-gray-500">
                    {user?.designation || "Member"}
                  </div>
                </div>
              </button>

              {/* Dropdown menu */}
              <div className={dropdownClasses}>
                <div className="border-t border-gray-100 py-2 px-3 text-[14px]">
                  {/* User Info */}
                  <div className="flex items-center gap-2">
                    <Image
                      src={PROFILE_IMAGE_SRC}
                      alt={user?.name || "Profile"}
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full border-2 border-[#D2D2D2] object-cover"
                    />
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
                    className="flex w-full cursor-pointer items-center px-2 py-1.5 text-[14px] transition-colors hover:text-gray-700"
                  >
                    <SlSettings className="mr-2 text-gray-600 w-3.5 h-3.5" />
                    Profile Info
                  </button>

                  {/* Raise Request */}
                  <button
                    type="button"
                    onClick={openRaiseRequestModal}
                    className="flex w-full cursor-pointer items-center px-2 py-1.5 text-[14px] transition-colors hover:text-gray-700"
                  >
                    <HiOutlineHandRaised className="mr-2 text-gray-600 w-3.5 h-3.5" />
                    Raise Request
                  </button>

                  <hr className="my-1.5 border-t border-gray-200" />

                  {/* Logout */}
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center px-2 py-1.5 text-[14px] text-red-500 transition-colors"
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


        <RaiseRequestModal
          isOpen={isRaiseRequestModalOpen}
          onClose={closeRaiseRequestModal}
        />
      </header>
    </>
  );
};

export default React.memo(Header);
