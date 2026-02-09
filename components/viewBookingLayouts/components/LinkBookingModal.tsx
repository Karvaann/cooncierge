"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CiFilter } from "react-icons/ci";
import { TbArrowsUpDown } from "react-icons/tb";
import { FiLink2 } from "react-icons/fi";

import Modal from "@/components/Modal";
import Table from "@/components/Table";
import CustomCheckbox from "@/components/CustomCheckbox";
import AvatarTooltip from "@/components/AvatarToolTip";
import { formatServiceType } from "@/utils/helper";
import { BookingApiService } from "@/services/bookingApi";

type QuotationRow = {
  customId?: string;
  _id: string;
  quotationType?: string;
  customerId?: { name?: string };
  formFields?: Record<string, any>;
  travelDate?: string;
  createdAt?: string;
  totalAmount?: number;
  status?: string;
  primaryOwner?: { name?: string };
  secondaryOwner?: Array<{ name?: string }>;
};

export default function LinkBookingModal({
  isOpen,
  onClose,
  selectedServiceLabel,
  activeTab = "Bookings",
  onLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedServiceLabel?: string;
  activeTab?: string;
  onLink?: (selectedBookingIds: string[], selectedRows: QuotationRow[]) => void;
}) {
  const checkboxBaseId = React.useId();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const colorPalette = useMemo(
    () => [
      "border-pink-700 text-pink-700",
      "border-[#AF52DE] text-[#AF52DE]",
      "border-[#5856D6] text-[#5856D6]",
      "border-cyan-700 text-cyan-700",
      "border-emerald-700 text-emerald-700",
      "border-amber-700 text-amber-700",
    ],
    [],
  );

  const computeInitials = useCallback((name: string) => {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const a = (parts[0] || "").slice(0, 1);
    const b = (parts[1] || "").slice(0, 1);
    return (a + b).toUpperCase();
  }, []);

  const formatDMY = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const mapStatus = useCallback((status?: string): string => {
    const statusMap: Record<string, string> = {
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      canceled: "Cancelled",
      successful: "Successful",
      success: "Successful",
      draft: "Draft",
      deleted: "Deleted",
    };
    return statusMap[String(status || "").toLowerCase()] || "Confirmed";
  }, []);

  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case "Confirmed":
      case "Successful":
        return "px-2 py-1 text-[0.70rem] border border-green-100 font-semibold rounded-full bg-[#F0FDF4] text-[#15803D]";
      case "Draft":
        return "px-2 py-1 text-[0.70rem] border border-yellow-200 font-semibold rounded-full bg-yellow-100 text-yellow-700";
      case "Cancelled":
      case "Deleted":
      default:
        return "px-2 py-1 text-[0.75rem] border border-red-100 font-semibold rounded-full bg-[#FEE2E2] text-[#991B1B]";
    }
  }, []);

  const getServiceIcon = useCallback((quotationType?: string) => {
    if (!quotationType) return "Visa";
    const normalized = quotationType.toLowerCase().trim();
    const typeMap: Record<string, string> = {
      flight: "flight",
      flights: "flight",
      travel: "flight",
      hotel: "accommodation",
      accommodation: "accommodation",
      maritime: "maritime",
      "transport-maritime": "maritime",
      "maritime transportation": "maritime",
      "maritime-transportation": "maritime",
      maritime_transportation: "maritime",
      car: "land",
      "land transportation": "land",
      "land-transportation": "land",
      land_transportation: "land",
      transportation: "land",
      land: "land",
      "transport-land": "land",
      package: "package",
      "travel insurance": "insurance",
      activity: "activity",
      activities: "activity",
      insurance: "insurance",
      visa: "visa",
      visas: "visa",
      ticket: "ticket",
      tickets: "ticket",
    };
    const key = typeMap[normalized] || normalized;

    const iconMap: Record<string, React.ReactNode> = {
      flight: (
        <Image
          src="/icons/service-icons/flight.svg"
          alt="Flight"
          width={16}
          height={16}
          className="object-contain"
        />
      ),
      accommodation: (
        <Image
          src="/icons/service-icons/accommodation.svg"
          alt="Accommodation"
          width={14}
          height={14}
          className="object-contain"
        />
      ),
      activity: (
        <Image
          src="/icons/service-icons/activity.svg"
          alt="Activity"
          width={9}
          height={9}
          className="object-contain"
        />
      ),
      insurance: (
        <Image
          src="/icons/service-icons/insurance.svg"
          alt="Insurance"
          width={14}
          height={14}
          className="object-contain"
        />
      ),
      ticket: (
        <Image
          src="/icons/service-icons/ticket.svg"
          alt="Tickets"
          width={14}
          height={14}
          className="object-contain"
        />
      ),
      land: (
        <Image
          src="/icons/service-icons/land-icon.svg"
          alt="Land Transport"
          width={11}
          height={11}
          className="object-contain"
        />
      ),
      visa: (
        <Image
          src="/icons/service-icons/visa-icon-final.svg"
          alt="visa"
          width={12}
          height={12}
          className="object-contain"
        />
      ),
      package: "Package",
    };

    return iconMap[key] || "📋";
  }, []);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const allSelected = useMemo(() => {
    if (!quotations.length) return false;
    return quotations.every((q) => selectedIds.includes(q._id));
  }, [quotations, selectedIds]);

  const someSelected = useMemo(() => {
    if (!quotations.length) return false;
    return quotations.some((q) => selectedIds.includes(q._id));
  }, [quotations, selectedIds]);

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds([]);
        return;
      }
      setSelectedIds(quotations.map((q) => q._id));
    },
    [quotations],
  );

  const loadQuotations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await BookingApiService.getAllQuotations({ activeTab });
      if (response?.success && (response as any).data) {
        const raw: any = (response as any).data;
        const all = (raw?.quotations as any[]) || (raw as any[]) || [];
        setQuotations(all as QuotationRow[]);
      } else {
        throw new Error(response?.message || "Failed to load bookings");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds([]);
    loadQuotations();
  }, [isOpen, loadQuotations]);

  const columns = useMemo(
    () => [
      "Booking ID",
      "Lead Pax",
      "Travel Date",
      "Service",
      "Service Status",
      "Amount",
      "Owner",
    ],
    [],
  );

  const columnIconMap = useMemo<Record<string, React.ReactNode>>(
    () => ({
      "Travel Date": (
        <TbArrowsUpDown className="inline w-3 h-3 text-white stroke-[1.5]" />
      ),
      Service: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
      "Service Status": (
        <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />
      ),
      Owner: <CiFilter className="inline w-3 h-3 text-white stroke-[1.5]" />,
    }),
    [],
  );

  const tableData = useMemo<React.ReactNode[][]>(() => {
    return quotations.map((item, index) => {
      const status = mapStatus(item.status);
      const ownerNames = (
        Array.isArray(item.secondaryOwner) ? [...item.secondaryOwner] : []
      )
        .concat(item.primaryOwner ? [item.primaryOwner] : [])
        .map((o: any) => o?.name || "")
        .filter(Boolean);

      const isSel = selectedIds.includes(item._id);

      return [
        <td
          key={`cb-${index}`}
          className="px-3 py-3 text-center align-middle h-[3rem]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center">
            <CustomCheckbox
              id={`${checkboxBaseId}-${item._id}`}
              checked={isSel}
              onCheckedChange={() => toggleOne(item._id)}
              wrapperClassName="flex items-center justify-center"
            />
          </div>
        </td>,
        <td
          key={`id-${index}`}
          className="px-4 py-3 text-center text-[#020202] font-medium align-middle h-[3rem]"
        >
          <button
            type="button"
            className="text-[#114958] hover:underline font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              toggleOne(item._id);
            }}
          >
            {item.customId || item._id}
          </button>
        </td>,
        <td
          key={`lead-${index}`}
          className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
        >
          {item.customerId?.name || item.formFields?.customer || "--"}
        </td>,
        <td
          key={`date-${index}`}
          className="px-4 py-3 text-center align-middle h-[3rem]"
        >
          {item.travelDate
            ? formatDMY(item.travelDate)
            : item.formFields?.departureDate
              ? formatDMY(item.formFields.departureDate)
              : item.createdAt
                ? formatDMY(item.createdAt)
                : "--"}
        </td>,
        <td
          key={`service-${index}`}
          className="px-4 py-3 text-center text-[14px] text-[#020202] font-normal align-middle h-[3rem]"
        >
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center">
              {getServiceIcon(item.quotationType || "draft")}
            </div>
            <span className="text-center leading-tight">
              {formatServiceType(item.quotationType || "draft")}
            </span>
          </div>
        </td>,
        <td
          key={`status-${index}`}
          className="px-4 py-3 text-center align-middle text-[14px] h-[3rem]"
        >
          <span className={getStatusBadgeClass(status)}>{status}</span>
        </td>,
        <td
          key={`amount-${index}`}
          className="px-4 py-3 text-center text-[#020202] font-normal align-middle h-[3rem]"
        >
          {typeof item.totalAmount === "number" && item.totalAmount
            ? `₹ ${item.totalAmount.toLocaleString("en-IN")}`
            : item.formFields?.budget
              ? `₹ ${Number(item.formFields.budget).toLocaleString("en-IN")}`
              : "--"}
        </td>,
        <td
          key={`owners-${index}`}
          className="px-4 py-3 text-center align-middle h-[3rem]"
        >
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {ownerNames.map((ownerName: string, i: number) => {
                const short = computeInitials(ownerName);
                const color = (colorPalette[i % colorPalette.length] ||
                  colorPalette[0]) as string;
                return (
                  <AvatarTooltip
                    key={`${ownerName}-${i}`}
                    short={short}
                    full={ownerName}
                    color={color}
                  />
                );
              })}
            </div>
          </div>
        </td>,
      ];
    });
  }, [
    quotations,
    selectedIds,
    checkboxBaseId,
    toggleOne,
    formatDMY,
    getServiceIcon,
    getStatusBadgeClass,
    mapStatus,
    computeInitials,
    colorPalette,
  ]);

  const headerCheckbox = (
    <div className="flex justify-center">
      <CustomCheckbox
        id={`${checkboxBaseId}-all`}
        checked={allSelected}
        onCheckedChange={(checked) => toggleAll(Boolean(checked))}
        wrapperClassName="flex items-center justify-center"
        label={
          <span className="sr-only">
            {someSelected && !allSelected ? "Some selected" : "Select all"}
          </span>
        }
      />
    </div>
  );

  const selectedRows = useMemo(() => {
    if (!selectedIds.length) return [];
    const set = new Set(selectedIds);
    return quotations.filter((q) => set.has(q._id));
  }, [quotations, selectedIds]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      closeOnEscape
      closeOnOverlayClick
      customWidth="w-[95vw] max-w-[1400px]"
      size="full"
      headerLeft={
        <div className="flex items-center gap-2">
          <FiLink2 className="text-[#114958]" />
          <div className="text-black text-[1rem] md:text-[1.15rem] font-semibold leading-snug">
            Link Booking to Service
          </div>
        </div>
      }
      className="rounded-xl"
    >
      <div className="space-y-3">
        {selectedServiceLabel && (
          <div className="text-[13px] text-gray-500">
            {selectedServiceLabel} selected
          </div>
        )}

        {error && (
          <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-[13px] text-gray-600 px-2 py-6">
            Loading bookings...
          </div>
        ) : (
          <Table
            data={tableData as any}
            columns={columns}
            initialRowsPerPage={5}
            maxRowsPerPageOptions={[5, 10, 25, 50]}
            columnIconMap={columnIconMap as any}
            showCheckboxColumn
            headerCheckbox={headerCheckbox}
            categoryName="Bookings"
            onRowClick={(globalIndex) => {
              const row = quotations[globalIndex];
              if (!row) return;
              toggleOne(row._id);
            }}
          />
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            className={`px-4 py-2 rounded-md text-[0.85rem] font-medium transition ${
              selectedIds.length
                ? "bg-[#0D4B37] text-white hover:bg-[#0b3f2f]"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!selectedIds.length}
            onClick={() => {
              onLink?.(selectedIds, selectedRows);
            }}
          >
            Link Booking(s)
          </button>
        </div>
      </div>
    </Modal>
  );
}
