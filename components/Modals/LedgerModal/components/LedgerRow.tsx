"use client";

import React from "react";
import { FiEye } from "react-icons/fi";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import ActionMenu from "@/components/Menus/ActionMenu";

type LedgerStatus = "paid" | "none" | "partial";

const statusPillClasses: Record<LedgerStatus, string> = {
  paid: "bg-green-100 text-green-700 border border-green-200",
  none: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  partial: "bg-orange-100 text-orange-700 border border-orange-200",
};

const formatMoney = (value: number) => {
  try {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(value);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return date;
};

type Props = {
  entry: any;
  dateColumnLabel: string;
  isVendorLedger: boolean;
  bankNameById: Map<string, string>;
  onEditPayment: (entry: any) => void;
  onDeletePayment: (entry: any) => void;
  onEditQuotation: (entry: any) => void;
  onDeleteQuotation: (entry: any) => void;
};

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
    "land-transport": "transport-land",
    land: "transport-land",
    transportation: "transport-land",
    maritime: "transport-maritime",
    "transport-maritime": "transport-maritime",
    ticket: "tickets",
    tickets: "tickets",
    activity: "activity",
    activities: "activity",
    insurance: "travel insurance",
    "travel insurance": "travel insurance",
    visa: "visas",
    visas: "visas",
    others: "others",
    package: "others",
  };
  return map[v] || "others";
};

const getQuotationDisplayLabel = (rawType?: string) => {
  const cat = mapQuotationTypeToCategory(rawType);
  const labelMap: Record<string, string> = {
    travel: "Flight",
    accommodation: "Accommodation",
    "transport-land": "Land Transport",
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

const LedgerRow: React.FC<Props> = ({
  entry: r,
  dateColumnLabel,
  isVendorLedger,
  bankNameById,
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
          icon: <FaRegEdit />,
          color: "text-blue-600",
          onClick: () => onEditPayment(r),
        },
        {
          label: "Delete",
          icon: <FaRegTrashAlt />,
          color: "text-red-600",
          onClick: () => onDeletePayment(r),
        },
      ];
    }

    if (r.type === "quotation") {
      return [
        {
          label: "Edit",
          icon: <FaRegEdit />,
          color: "text-blue-600",
          onClick: () => onEditQuotation(r),
        },
        {
          label: "Delete",
          icon: <FaRegTrashAlt />,
          color: "text-red-600",
          onClick: () => onDeleteQuotation(r),
        },
      ];
    }

    return [];
  })();

  const displayedDate = (() => {
    if (r.type === "payment") {
      return r.paymentDate || r.date;
    }

    if (dateColumnLabel === "Travel Date") {
      return (
        r.travelDate || r.data?.travelDate || r.data?.formFields?.traveldate
      );
    }

    return r.data?.formFields?.bookingdate || r.date;
  })();

  const amountBgClass = isVendorLedger
    ? // Vendor ledger: payments are red, bookings/base are green, incentive rows should be red
      r._vendorSplit === "incentive"
      ? "bg-red-50"
      : r.type === "payment"
        ? "bg-red-50"
        : "bg-green-50"
    : r.type === "payment"
      ? "bg-green-50"
      : "bg-red-50";

  const amountTextClass = isVendorLedger
    ? // Vendor ledger: ensure incentive rows use red text
      r._vendorSplit === "incentive"
      ? "text-red-500"
      : r.type === "payment"
        ? "text-red-500"
        : "text-green-600"
    : r.type === "payment"
      ? "text-green-600"
      : "text-red-500";

  const displayAmount =
    typeof r?._displayAmount === "number" ? r._displayAmount : r.amount;

  const bankName = resolveBankNameFromEntry(r, bankNameById);
  const paymentTypeLabel =
    r?.paymentType ||
    r?.data?.payment?.paymentType ||
    r?.data?.paymentType ||
    r?.data?.payment?.type ||
    "-";

  return (
    <>
      <td className="px-4 py-3 text-center font-[600] text-[14px]">
        {r.type === "opening" ? (
          "Opening Balance"
        ) : r.type === "quotation" ? (
          <div className="relative inline-flex flex-col items-center justify-center">
            <span className="peer cursor-default leading-5">
              {r.customId || "NA"}
            </span>
            {r._displayIdSubLabel ? (
              <span className="text-[12px] font-[500] text-gray-500 leading-4 mt-1">
                {String(r._displayIdSubLabel)}
              </span>
            ) : null}

            <div
              className="absolute -top-8 left-1/2 z-50 px-2 py-1 text-[0.75rem] text-white bg-gray-800 rounded-md shadow-lg pointer-events-none -translate-x-1/2 transition-opacity duration-150 ease-in-out opacity-0 invisible whitespace-nowrap peer-hover:opacity-100 peer-hover:visible"
              role="tooltip"
            >
              {getQuotationDisplayLabel(extractQuotationTypeFromEntry(r))}
              <div
                className="absolute left-1/2 -bottom-1 w-2.5 h-2.5 bg-gray-800"
                style={{
                  transform: "translateX(-50%) rotate(45deg)",
                  WebkitTransform: "translateX(-50%) rotate(45deg)",
                }}
              />
            </div>
          </div>
        ) : (
          r.customId || "NA"
        )}
      </td>

      <td className="px-4 py-3 text-center text-[14px]">
        {formatDate(displayedDate)}
      </td>

      <td className="px-4 py-3 text-center text-[14px]">
        <span
          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-semibold ${
            statusPillClasses[r.paymentStatus as LedgerStatus]
          }`}
        >
          {r.type === "opening" || r.type === "payment"
            ? ""
            : r.paymentStatus === "none"
              ? "Pending"
              : r.paymentStatus === "partial"
                ? "Partially Paid"
                : "Paid"}
        </span>
      </td>

      <td className="px-4 py-3 text-center text-[14px]">
        <div className="relative inline-flex items-center justify-center">
          <span className="peer cursor-default">{bankName}</span>

          <div
            className="absolute -top-8 left-1/2 z-50 px-2 py-1 text-[0.75rem] text-white bg-gray-800 rounded-md shadow-lg pointer-events-none -translate-x-1/2 transition-opacity duration-150 ease-in-out opacity-0 invisible whitespace-nowrap peer-hover:opacity-100 peer-hover:visible"
            role="tooltip"
          >
            {paymentTypeLabel}
            <div
              className="absolute left-1/2 -bottom-1 w-2.5 h-2.5 bg-gray-800"
              style={{
                transform: "translateX(-50%) rotate(45deg)",
                WebkitTransform: "translateX(-50%) rotate(45deg)",
              }}
            />
          </div>
        </div>
      </td>

      <td className={`px-4 py-3 text-center text-[14px] ${amountBgClass}`}>
        <span className="font-semibold">₹ {formatMoney(displayAmount)}</span>
      </td>

      <td className={`px-4 py-3 text-center text-[14px] ${amountBgClass}`}>
        <span className={`${amountTextClass} font-semibold`}>
          ₹ {formatMoney(r.closingBalance.amount)}
        </span>
      </td>

      <td className="px-4 py-3 text-center text-[14px]">
        <div
          className="flex items-center justify-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="p-2 rounded-md bg-[#FEF7E7] hover:bg-[#FDF1D5] transition border border-[#F5E6C3]"
            aria-label="View"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <FiEye className="text-[#8B6914]" size={16} />
          </button>

          {rowActions.length > 0 ? (
            <ActionMenu width="w-24" actions={rowActions} />
          ) : null}
        </div>
      </td>
    </>
  );
};

export default React.memo(LedgerRow);
