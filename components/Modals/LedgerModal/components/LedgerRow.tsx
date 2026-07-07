"use client";

import React from "react";
import Image from "next/image";
import { FiEye } from "react-icons/fi";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import { TbCircleArrowDownLeft, TbCircleArrowUpRight } from "react-icons/tb";
import ActionMenu from "@/components/Menus/ActionMenu";
import { BOOKING_HISTORY_ACTION_BUTTON_CLASS } from "@/components/table/bookingHistoryActionStyles";
import { formatDirectoryDisplayDate } from "@/utils/directoryApiMappers";
import {
  formatNumberByStoredCurrency,
  getStoredCurrencySymbol,
} from "@/utils/helper";

type LedgerStatus = "paid" | "none" | "partial";

const mapQuotationTypeToCategory = (qt?: string) => {
  const v = (qt || "").toLowerCase().trim();
  const map: Record<string, string> = {
    flight: "travel",
    flights: "travel",
    travel: "travel",
    hotel: "accommodation",
    accommodation: "accommodation",
    car: "transport-land",
    "transport-land": "transport-land",
    transportation: "transport-land",
    transport: "transport-land",
    maritime: "transport-maritime",
    ticket: "tickets",
    activity: "activity",
    insurance: "travel insurance",
    visa: "visas",
    others: "others",
  };
  return map[v] || "others";
};

const getQuotationDisplayLabel = (rawType?: string) => {
  const cat = mapQuotationTypeToCategory(rawType);
  const labelMap: Record<string, string> = {
    travel: "Flight",
    accommodation: "Accommodation",
    "transport-land": "Transportation",
    activity: "Activity",
    "transport-maritime": "Maritime",
    tickets: "Tickets",
    "travel insurance": "Travel Insurance",
    visas: "Visas",
    others: "Others",
  };
  return (
    labelMap[cat] ||
    String(rawType || "-").replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

const getServiceIconSrc = (rawType?: string, entryType?: string, customId?: string) => {
  if (entryType === "payment") {
    const id = String(customId || "").toUpperCase();
    if (id.startsWith("PI-")) return "/icons/service-icons/others.svg";
    if (id.startsWith("PO-")) return "/icons/service-icons/others.svg";
    return "/icons/service-icons/others.svg";
  }

  const cat = mapQuotationTypeToCategory(rawType);
  const iconMap: Record<string, string> = {
    travel: "/icons/service-icons/flight.svg",
    accommodation: "/icons/service-icons/accommodation.svg",
    "transport-land": "/icons/service-icons/transport.svg",
    activity: "/icons/service-icons/activity.svg",
    "transport-maritime": "/icons/service-icons/transportation.svg",
    tickets: "/icons/service-icons/ticket.svg",
    "travel insurance": "/icons/service-icons/insurance.svg",
    visas: "/icons/service-icons/visa-icon-final.svg",
    others: "/icons/service-icons/others.svg",
  };
  return iconMap[cat] || iconMap.others!;
};

const extractQuotationTypeFromEntry = (entry: any) => {
  return (
    entry?.data?.quotationType ||
    entry?.quotationType ||
    entry?.data?.formFields?.quotationType ||
    entry?.data?.formFields?.serviceType ||
    ""
  );
};

const resolveBankFromEntry = (entry: any) => {
  return (
    entry?.bankId ||
    entry?.bank ||
    entry?.data?.bankId ||
    entry?.data?.payment?.bankId ||
    null
  );
};

const resolveBankNameFromEntry = (
  entry: any,
  bankNameById: Map<string, string>,
) => {
  const bank = resolveBankFromEntry(entry);
  if (!bank) return "—";
  if (typeof bank === "object") return bank.name || "—";
  return bankNameById.get(String(bank)) || "—";
};

const getPaymentStatusLabel = (status?: LedgerStatus) => {
  if (status === "none") return "Pending";
  if (status === "partial") return "Partially Paid";
  return "Paid";
};

const getPaymentStatusPillClass = (status?: LedgerStatus) => {
  if (status === "none") {
    return "rounded-full bg-[#FFF1C2] px-2.5 py-0.5 text-[11px] font-[500] text-[#414141]";
  }
  if (status === "partial") {
    return "rounded-full bg-[#FFE8D6] px-2.5 py-0.5 text-[11px] font-[500] text-[#D97706]";
  }
  return "rounded-full bg-[#E8F8E6] px-2.5 py-0.5 text-[11px] font-[500] text-[#419836]";
};

const getModePillClass = () =>
  "rounded-full border border-[#126ACB] bg-white px-2.5 py-0.5 text-[11px] font-[500] text-[#126ACB]";

const formatLedgerDate = (dateString?: string) => {
  if (!dateString) return "—";
  return formatDirectoryDisplayDate(dateString);
};

type Props = {
  entry: any;
  isVendorLedger: boolean;
  bankNameById: Map<string, string>;
  onViewEntry: (entry: any) => void;
  onEditPayment: (entry: any) => void;
  onDeletePayment: (entry: any) => void;
  onEditQuotation: (entry: any) => void;
  onDeleteQuotation: (entry: any) => void;
};

const LedgerRow: React.FC<Props> = ({
  entry: r,
  isVendorLedger,
  bankNameById,
  onViewEntry,
  onEditPayment,
  onDeletePayment,
  onEditQuotation,
  onDeleteQuotation,
}) => {
  const rowActions = (() => {
    if (r.type === "payment") {
      return [
        {
          label: "Edit",
          icon: <FaRegEdit size={14} />,
          color: "text-[#126ACB]",
          onClick: () => onEditPayment(r),
        },
        {
          label: "Delete",
          icon: <FaRegTrashAlt size={14} />,
          color: "text-red-600",
          onClick: () => onDeletePayment(r),
        },
      ];
    }

    if (r.type === "quotation") {
      return [
        {
          label: "Edit",
          icon: <FaRegEdit size={14} />,
          color: "text-[#126ACB]",
          onClick: () => onEditQuotation(r),
        },
        {
          label: "Delete",
          icon: <FaRegTrashAlt size={14} />,
          color: "text-red-600",
          onClick: () => onDeleteQuotation(r),
        },
      ];
    }

    return [];
  })();

  const displayedDate = (() => {
    if (r.type === "payment") {
      return formatLedgerDate(
        r.paymentDate ||
          r.date ||
          r.data?.paymentDate ||
          r.data?.formFields?.paymentDate,
      );
    }

    return formatLedgerDate(
      r.data?.formFields?.bookingdate || r.date || r.data?.bookingDate,
    );
  })();

  const displayAmount =
    typeof r?._displayAmount === "number" ? r._displayAmount : r.amount;

  const isPaymentRow = r.type === "payment";
  const amountPrefix = isPaymentRow ? "+" : "-";
  const amountTextClass = isVendorLedger
    ? isPaymentRow
      ? "text-[#C85542]"
      : "text-[#5E9D5A]"
    : isPaymentRow
      ? "text-[#5E9D5A]"
      : "text-[#C85542]";

  const bankName = resolveBankNameFromEntry(r, bankNameById);
  const paymentTypeLabel =
    r?.paymentType ||
    r?.data?.payment?.paymentType ||
    r?.data?.paymentType ||
    r?.data?.payment?.type ||
    "";

  const serviceLabel = (() => {
    if (r.type === "opening") return "Opening Balance";
    if (r.type === "payment") {
      const id = String(r.customId || "").toUpperCase();
      if (id.startsWith("PI-")) return "Pay In";
      if (id.startsWith("PO-")) return "Pay Out";
      return "Payment";
    }
    return getQuotationDisplayLabel(extractQuotationTypeFromEntry(r));
  })();

  const serviceIconSrc = getServiceIconSrc(
    extractQuotationTypeFromEntry(r),
    r.type,
    r.customId,
  );

  const invoiceSubLabel =
    r?.invoiceCustomId ||
    r?.data?.invoiceCustomId ||
    r?.data?.invoiceId ||
    r?.data?.formFields?.invoiceId ||
    null;

  const secondaryStatus = (() => {
    const raw =
      r?.data?.serviceStatus ||
      r?.data?.status ||
      r?.data?.formFields?.status ||
      r?.data?.formFields?.bookingStatus ||
      "";
    if (!raw) return null;
    const normalized = String(raw).toLowerCase();
    if (normalized.includes("cancel")) return "Cancelled";
    if (normalized.includes("resched")) return "Rescheduled";
    if (normalized.includes("confirm")) return "Confirmed";
    return String(raw).replace(/\b\w/g, (c) => c.toUpperCase());
  })();

  const closingBalanceAmount = Number(r?.closingBalance?.amount ?? 0);
  const closingBalanceType = r?.closingBalance?.balanceType;
  const isClosingDebit = closingBalanceType === "debit";
  const closingTextClass = isClosingDebit ? "text-[#C85542]" : "text-[#5E9D5A]";

  return (
    <>
      <td className="h-[4rem] px-4 py-3 text-center align-middle">
        {r.type === "opening" ? (
          <span className="text-[13px] font-[600] text-[#020202]">
            Opening Balance
          </span>
        ) : (
          <div className="mx-auto flex w-fit flex-col items-center">
            <span className="text-[13px] font-[600] text-[#020202]">
              {r.customId || "—"}
            </span>
            {r._displayIdSubLabel || invoiceSubLabel ? (
              <span className="mt-0.5 text-[12px] font-[400] text-[#818181]">
                {String(r._displayIdSubLabel || invoiceSubLabel)}
              </span>
            ) : null}
          </div>
        )}
      </td>

      <td className="h-[4rem] px-4 py-3 text-center align-middle">
        {r.type === "opening" ? (
          <span className="text-[13px] text-[#818181]">—</span>
        ) : (
          <div className="mx-auto flex w-fit items-center justify-center gap-2">
            <Image
              src={serviceIconSrc}
              alt={serviceLabel}
              width={18}
              height={18}
              className="h-[18px] w-[18px] object-contain"
              unoptimized
            />
            <span className="text-[13px] font-[400] text-[#414141]">
              {serviceLabel}
            </span>
          </div>
        )}
      </td>

      <td className="h-[4rem] px-4 py-3 text-center align-middle text-[13px] text-[#414141]">
        {displayedDate}
      </td>

      <td className="h-[4rem] px-4 py-3 text-center align-middle">
        {r.type === "opening" ? (
          <span className="text-[13px] text-[#818181]">—</span>
        ) : r.type === "payment" ? (
          <div className="mx-auto flex w-fit flex-col items-center gap-1">
            {paymentTypeLabel ? (
              <span className={getModePillClass()}>{paymentTypeLabel}</span>
            ) : (
              <span className="text-[13px] text-[#818181]">—</span>
            )}
          </div>
        ) : (
          <div className="mx-auto flex w-fit flex-col items-center gap-1">
            <span className={getPaymentStatusPillClass(r.paymentStatus)}>
              {getPaymentStatusLabel(r.paymentStatus)}
            </span>
            {secondaryStatus ? (
              <span className="text-[12px] text-[#818181]">{secondaryStatus}</span>
            ) : null}
          </div>
        )}
      </td>

      <td className="h-[4rem] px-4 py-3 text-center align-middle text-[13px] text-[#414141]">
        {bankName}
      </td>

      <td className="h-[4rem] px-4 py-3 text-center align-middle">
        <span className={`text-[13px] font-[500] ${amountTextClass}`}>
          {amountPrefix} {getStoredCurrencySymbol()}{" "}
          {formatNumberByStoredCurrency(Math.abs(displayAmount))}
        </span>
      </td>

      <td className="h-[4rem] px-4 py-3 text-center align-middle">
        <span
          className={`inline-flex items-center justify-center gap-1.5 text-[13px] font-[500] ${closingTextClass}`}
        >
          {isClosingDebit ? (
            <TbCircleArrowUpRight className="text-[16px]" />
          ) : (
            <TbCircleArrowDownLeft className="text-[16px]" />
          )}
          {getStoredCurrencySymbol()}{" "}
          {formatNumberByStoredCurrency(Math.abs(closingBalanceAmount))}
        </span>
      </td>

      <td className="h-[4rem] px-4 py-3 text-center align-middle">
        {r.type === "opening" ? null : (
          <div
            className="mx-auto grid w-[5.5rem] grid-cols-[1fr_2rem] items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end">
              <button
                type="button"
                className={BOOKING_HISTORY_ACTION_BUTTON_CLASS}
                aria-label="View"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewEntry(r);
                }}
              >
                <FiEye size={14} />
              </button>
            </div>
            <div className="flex items-center justify-center">
              {rowActions.length > 0 ? (
                <ActionMenu
                  width="min-w-[7.5rem]"
                  align="left"
                  actions={rowActions}
                />
              ) : null}
            </div>
          </div>
        )}
      </td>
    </>
  );
};

export default React.memo(LedgerRow);
