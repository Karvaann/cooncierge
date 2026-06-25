"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Modal from "../Modal";
import Table from "../Table";
import ActionMenu from "../Menus/ActionMenu";
import TaskButton from "../TaskButton";
import { FiEye, FiEdit } from "react-icons/fi";
import { CiFilter } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import { IoChevronDown, IoEllipsisHorizontal } from "react-icons/io5";
import { LuDownload } from "react-icons/lu";
import {
  formatNumberByStoredCurrency,
  formatServiceType,
  getStoredCurrencySymbol,
} from "@/utils/helper";
import { MOCK_BOOKING_HISTORY as defaultMockBookingHistory } from "@/mock-data/directory";
import type { JSX } from "react";

const BookingFormSidesheet = dynamic(
  () => import("@/components/BookingFormSidesheet"),
  { ssr: false },
);

interface BookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewCustomer?: (() => void) | undefined;
  onEditCustomer?: (() => void) | undefined;
  bookings: Array<Record<string, any>>;
  recordName?: string | null;
  recordId?: string | null;
  recordMongoId?: string | null;
  categoryName?: string | null;
  vendorLinkCount?: number;
  travellerLinkCount?: number;
}

const VOUCHER_MENU_OPTIONS = [
  "Booking Voucher",
  "Customer Invoice(s)",
  "Vendor Voucher(s)",
  "Vendor Invoice(s)",
];

const mapStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
    cancelled: "Cancelled",
    draft: "Draft",
  };
  return statusMap[(status || "").toLowerCase()] || "Confirmed";
};

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "Confirmed":
      return "inline-flex rounded-full border border-[#DCFCE7] bg-[#F0FDF4] px-2.5 py-1 text-[12px] font-[500] text-[#15803D]";
    case "Cancelled":
      return "inline-flex rounded-full border border-[#FEE2E2] bg-[#FFF5F5] px-2.5 py-1 text-[12px] font-[500] text-[#991B1B]";
    case "Draft":
      return "inline-flex rounded-full border border-[#FEF9C3] bg-[#FEF9C3] px-2.5 py-1 text-[12px] font-[500] text-[#854D0E]";
    default:
      return "inline-flex rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-1 text-[12px] font-[500] text-[#1D4ED8]";
  }
};

const formatShortDate = (dateString?: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${month} '${year}`;
};

const getServiceIcon = (quotationType: string): React.ReactNode => {
  const normalized = (quotationType || "").toLowerCase().trim();
  const typeMap: Record<string, string> = {
    flight: "flight",
    flights: "flight",
    travel: "flight",
    hotel: "accommodation",
    accommodation: "accommodation",
    car: "transport",
    land: "transport",
    transportation: "transport",
    "transport-land": "transport",
    ticket: "ticket",
    tickets: "ticket",
    others: "others",
  };
  const key = typeMap[normalized] || "others";

  const iconMap: Record<string, string> = {
    flight: "/icons/service-icons/flight.svg",
    accommodation: "/icons/service-icons/accommodation.svg",
    transport: "/icons/service-icons/transport.svg",
    ticket: "/icons/service-icons/ticket.svg",
    others: "/icons/service-icons/others.svg",
  };

  const src = iconMap[key] || iconMap.others;
  return (
    <Image
      src={src!}
      alt={formatServiceType(quotationType || "others")}
      width={18}
      height={18}
      className="h-[18px] w-[18px] object-contain"
      unoptimized
    />
  );
};

const BookingHistoryModal: React.FC<BookingHistoryModalProps> = ({
  isOpen,
  onClose,
  onViewCustomer,
  onEditCustomer,
  bookings,
  recordName = null,
  recordId = null,
  recordMongoId = null,
  categoryName = null,
  vendorLinkCount = 1,
  travellerLinkCount = 0,
}) => {
  const [activeProfileTab, setActiveProfileTab] = useState<"Customer" | "Vendor">(
    "Customer",
  );
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [sideSheetMode, setSideSheetMode] = useState<"view" | "edit">("edit");
  const [selectedBooking, setSelectedBooking] = useState<Record<
    string,
    any
  > | null>(null);
  const [localBookings, setLocalBookings] = useState<Array<any>>(bookings || []);
  const [activeVoucherRowId, setActiveVoucherRowId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setLocalBookings(bookings || []);
  }, [bookings]);

  useEffect(() => {
    if (!isOpen) {
      setActiveProfileTab("Customer");
      setActiveVoucherRowId(null);
    }
  }, [isOpen]);

  const displayBookings = useMemo(() => {
    const source =
      localBookings.length > 0 ? localBookings : defaultMockBookingHistory;
    if (activeProfileTab === "Vendor") {
      return source.filter((item) => item?.vendorId);
    }
    return source;
  }, [activeProfileTab, localBookings]);

  const handleOpenSideSheet = (
    booking: Record<string, any>,
    mode: "view" | "edit",
  ) => {
    setSelectedBooking(booking);
    setSideSheetMode(mode);
    setIsSideSheetOpen(true);
  };

  const columns = [
    "Booking ID",
    "Service",
    "Travel Date",
    "Service Status",
    "Amount",
    "Voucher",
    "Task",
    "Actions",
  ];

  const columnIconMap: Record<string, JSX.Element> = {
    Service: (
      <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
    ),
    "Travel Date": (
      <span className="inline-flex items-center gap-1.5">
        <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
        <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
      </span>
    ),
    "Service Status": (
      <CiFilter className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
    ),
    Amount: (
      <TbArrowsUpDown className="inline h-3 w-3 stroke-[2] text-[#818181] hover:text-[#7135AD]" />
    ),
  };

  const rows = displayBookings.map((item: any, index: number) => {
    const rowId = String(item?._id || item?.id || index);
    const statusLabel = mapStatus(item.status || item.serviceStatus || "confirmed");

    return [
      <td
        key={`${rowId}-id`}
        className="h-[4rem] px-4 py-3 text-center align-middle text-[13px] font-medium text-[#020202]"
      >
        {item.customId || item._id || "—"}
      </td>,
      <td
        key={`${rowId}-service`}
        className="h-[4rem] px-4 py-3 text-center align-middle"
      >
        <div className="mx-auto flex w-fit flex-col items-center justify-center gap-1">
          {getServiceIcon(item.quotationType || "others")}
          {item.exploreTag ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[13px] font-[500] text-[#020202]">UAE</span>
              <span className="rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[11px] font-[500] text-[#7135AD]">
                {item.exploreTag}
              </span>
            </div>
          ) : (
            <span className="text-[13px] font-[400] text-[#414141]">
              {formatServiceType(item.quotationType || "others")}
            </span>
          )}
        </div>
      </td>,
      <td
        key={`${rowId}-date`}
        className="h-[4rem] px-4 py-3 text-center align-middle text-[13px] text-[#414141]"
      >
        {formatShortDate(item.travelDate || item.formFields?.departureDate)}
      </td>,
      <td
        key={`${rowId}-status`}
        className="h-[4rem] px-4 py-3 text-center align-middle"
      >
        <div className="mx-auto flex w-fit flex-col items-center gap-1">
          <span className={getStatusBadgeClass(statusLabel)}>{statusLabel}</span>
          {item.secondaryStatus ? (
            <span className="text-[12px] text-[#818181]">
              {item.secondaryStatus}
            </span>
          ) : null}
        </div>
      </td>,
      <td
        key={`${rowId}-amount`}
        className="h-[4rem] px-4 py-3 text-center align-middle text-[13px] font-[400] text-[#020202]"
      >
        {item.totalAmount || item.amount
          ? `${getStoredCurrencySymbol()} ${formatNumberByStoredCurrency(
              item.totalAmount || item.amount,
            )}`
          : "—"}
      </td>,
      <td key={`${rowId}-voucher`} className="h-[4rem] px-4 py-3 text-center align-middle">
        <div className="relative mx-auto flex w-fit items-center justify-center">
          <div className="inline-flex overflow-hidden rounded-[7px] border border-[#E2E1E1] bg-white">
            <span className="flex items-center justify-center border-r border-[#E2E1E1] p-[6px]">
              <Image
                src="/icons/voucher-icon.svg"
                alt="Voucher"
                width={20}
                height={20}
                className="object-contain"
                unoptimized
              />
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveVoucherRowId((prev) => (prev === rowId ? null : rowId));
              }}
              className="flex items-center justify-center p-[6px]"
            >
              <IoChevronDown className="h-[14px] w-[14px] text-[#8A8A8A]" />
            </button>
          </div>
          {activeVoucherRowId === rowId && (
            <div className="absolute left-1/2 top-[calc(100%+8px)] z-[150] w-[180px] -translate-x-1/2 overflow-hidden rounded-[12px] border border-[#D6D6D6] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.14)]">
              {VOUCHER_MENU_OPTIONS.map((label, optionIndex) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveVoucherRowId(null)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px] text-[#3E3E3E] hover:bg-[#FAF7FF] ${
                    optionIndex < VOUCHER_MENU_OPTIONS.length - 1
                      ? "border-b border-[#DCDCDC]"
                      : ""
                  }`}
                >
                  <LuDownload className="h-[15px] w-[15px] text-[#7C3AED]" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>,
      <td key={`${rowId}-task`} className="h-[4rem] px-4 py-3 text-center align-middle">
        <TaskButton count={item.taskCount ?? 1} bookingId={item._id} />
      </td>,
      <td key={`${rowId}-actions`} className="h-[4rem] px-4 py-3 text-center align-middle">
        <div className="mx-auto flex w-fit items-center gap-2">
          <button
            type="button"
            className="rounded-[6px] border border-[#E2E1E1] bg-white px-3 py-1.5 text-[14px] font-[400] text-[#414141] hover:text-[#7135AD]"
          >
            {getStoredCurrencySymbol()}
          </button>
          <ActionMenu
            align="left"
            width="min-w-[8rem]"
            actions={[
              {
                label: "View",
                icon: <FiEye size={14} />,
                color: "text-[#126ACB]",
                onClick: () => handleOpenSideSheet(item, "view"),
              },
              {
                label: "Edit",
                icon: <FiEdit size={14} />,
                color: "text-[#126ACB]",
                onClick: () => handleOpenSideSheet(item, "edit"),
              },
            ]}
          />
        </div>
      </td>,
    ];
  });

  const profileTabs = ["Customer", "Vendor"] as const;

  return (
    <Modal
      title=""
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      customWidth="w-[min(1180px,calc(100vw-2rem))]"
      customeHeight="h-fit"
      showCloseButton={true}
      zIndexClass="z-[9999]"
      disableOverlayClick={false}
    >
      <div className="px-6 pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#ECECEC] pb-4 pt-1">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="font-[Poppins,sans-serif] text-[18px] font-[600] text-[#020202]">
              Booking History
            </h2>
            <span className="text-[#D1D5DB]">|</span>
            <span className="font-[Poppins,sans-serif] text-[14px] font-[500] text-[#020202]">
              {recordName ?? "—"}
            </span>
            <span className="text-[#D1D5DB]">|</span>
            <span className="font-[Poppins,sans-serif] text-[14px] text-[#818181]">
              {recordId ?? "—"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onViewCustomer}
                className="rounded-[8px] bg-[#FFF1C2] p-2 transition-colors hover:bg-[#FFE9A8]"
              >
                <FiEye className="text-[#414141]" size={14} />
              </button>
              <button
                type="button"
                onClick={onEditCustomer}
                className="rounded-[8px] bg-[#E8F2FF] p-2 transition-colors hover:bg-[#D6E8FF]"
              >
                <FiEdit className="text-[#126ACB]" size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {profileTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveProfileTab(tab)}
                className={`relative pb-2 font-[Poppins,sans-serif] text-[14px] font-[500] transition-colors ${
                  activeProfileTab === tab
                    ? "text-[#7135AD]"
                    : "text-[#818181] hover:text-[#414141]"
                }`}
              >
                {tab}
                {activeProfileTab === tab && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-[#7135AD]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 font-[Poppins,sans-serif] text-[12px] font-medium text-[#7135AD] transition-colors hover:bg-[#7135AD0D]"
            >
              <Image
                src="/icons/link-icon.svg"
                alt=""
                width={12}
                height={12}
                className="object-contain"
                unoptimized
              />
              Vendor {vendorLinkCount}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 font-[Poppins,sans-serif] text-[12px] font-medium text-[#7135AD] transition-colors hover:bg-[#7135AD0D]"
            >
              <Image
                src="/icons/link-icon.svg"
                alt=""
                width={12}
                height={12}
                className="object-contain"
                unoptimized
              />
              Traveller {travellerLinkCount}
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[#414141] transition-colors hover:bg-[#F3F3F3]"
              aria-label="More options"
            >
              <IoEllipsisHorizontal className="text-[20px]" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          <Table
            data={rows}
            columns={columns}
            columnIconMap={columnIconMap}
            initialRowsPerPage={10}
            maxRowsPerPageOptions={[10, 20, 50]}
            categoryName="Bookings"
            headerClassName="bg-[#F3F3F3]"
            headerRowTextClassName="text-[#818181]"
            headerCellTextClassName="text-[#818181]"
            headerAlign={{
              "Booking ID": "center",
              Service: "center",
              "Travel Date": "center",
              "Service Status": "center",
              Amount: "center",
              Voucher: "center",
              Task: "center",
              Actions: "center",
            }}
            columnWidthClassMap={{
              "Booking ID": "w-[8rem]",
              Service: "w-[9rem]",
              "Travel Date": "w-[9rem]",
              "Service Status": "w-[10rem]",
              Amount: "w-[8rem]",
              Voucher: "w-[8rem]",
              Task: "w-[6rem]",
              Actions: "w-[8rem]",
            }}
          />
        </div>
      </div>

      {isSideSheetOpen && (
        <BookingFormSidesheet
          isOpen={isSideSheetOpen}
          onClose={() => setIsSideSheetOpen(false)}
          selectedService={null}
          initialData={selectedBooking}
          mode={sideSheetMode}
          onRequestEdit={() => setSideSheetMode("edit")}
          onBookingSaved={(updatedBooking: any) => {
            setSelectedBooking(updatedBooking || selectedBooking);
          }}
        />
      )}
    </Modal>
  );
};

export default BookingHistoryModal;
