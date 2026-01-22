"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CiFilter } from "react-icons/ci";
import { FiEye } from "react-icons/fi";
import { HiArrowsUpDown } from "react-icons/hi2";
import { IoChevronDownOutline } from "react-icons/io5";
import { LuRefreshCcw } from "react-icons/lu";
import type { JSX } from "react";
import Modal from "../Modal";
import DateRangeInput from "../DateRangeInput";
import Table from "../Table";
import ActionMenu from "../Menus/ActionMenu";
import FilterTrigger from "../FilterTrigger";
import type { FilterCardOption } from "../FilterCard";
import AddPaymentSidesheet from "../Sidesheets/AddPaymentSidesheet";
import ViewPaymentSidesheet from "../Sidesheets/ViewPaymentSidesheet";
import { PiArrowCircleUpRight } from "react-icons/pi";
import { PiArrowCircleDownLeft } from "react-icons/pi";
import PaymentsApi from "@/services/paymentsApi";

type LedgerStatus = "paid" | "none" | "partial";

export type LedgerRow = {
  id: string; // booking ID or payment ID
  bookingDate: string; // dd-mm-yyyy
  status: LedgerStatus;
  account: string | null;
  amount: number;
  closingBalance: number;
  type: "booking" | "payment"; // to determine row color
};

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string | null;
  customerId?: string | null;
  rawId?: string | null;
  onRefresh?: () => void;
  onViewPdf?: () => void;
  isVendorLedger?: boolean; // If true, inverts the color scheme
}

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

const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  customerName = "Anand Mishra",
  rawId = null,
  customerId = "CU-AB001",
  onRefresh,
  onViewPdf,
  isVendorLedger = false,
}) => {
  const [paymentSidesheetOpen, setPaymentSidesheetOpen] = useState(false);
  const [paymentSidesheetTitle, setPaymentSidesheetTitle] =
    useState<string>("Payment Out");
  const [paymentSidesheetMode, setPaymentSidesheetMode] = useState<
    "create" | "edit"
  >("create");
  const [paymentInitial, setPaymentInitial] = useState<{
    amount?: string;
    bankCharges?: string;
    bankChargesNotes?: string;
    cashbackReceived?: string;
    cashbackNotes?: string;
    paymentDate?: string;
    bank?: string;
    internalNotes?: string;
  } | null>(null);

  const [ledgerData, setLedgerData] = useState<any>(null);

  const [isViewPaymentOpen, setIsViewPaymentOpen] = useState(false);
  const [selectedLedgerRow, setSelectedLedgerRow] = useState<LedgerRow | null>(
    null,
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pendingOnly, setPendingOnly] = useState(false);

  const accountOptions: FilterCardOption[] = useMemo(
    () => ["Bank 1", "Bank 2", "Cash"].map((v) => ({ value: v, label: v })),
    [],
  );

  useEffect(() => {

    const fetchLedger = async () => {
      try {
        const data = await PaymentsApi.getCustomerLedger(rawId!);
        setLedgerData(data);
      } catch (err) {
        console.error("Failed to fetch ledger:", err);
      }
    };
    if (isOpen) {
     fetchLedger();
    }
  }, [isOpen, customerName, rawId]);

  const statusOptions: FilterCardOption[] = useMemo(
    () =>
      ["Paid", "Pending", "Partially Paid"].map((v) => ({
        value: v,
        label: v,
      })),
    [],
  );

  // Map column names to header icons/components
  const columnIconMap: Record<string, React.ReactNode | null> = useMemo(() => {
    return {
      "Booking Date": (
        <HiArrowsUpDown className="inline w-3 h-3 text-gray-600 font-semibold stroke-[2]" />
      ),
      Account: (
        <FilterTrigger
          ariaLabel="Filter Account"
          options={accountOptions}
          onApply={(sel) => console.log("Account filter applied:", sel)}
        >
          <CiFilter className="inline w-3 h-3 text-gray-600 stroke-[1.5]" />
        </FilterTrigger>
      ),
      Status: (
        <FilterTrigger
          ariaLabel="Filter Status"
          options={statusOptions}
          onApply={(sel) => console.log("Status filter applied:", sel)}
        >
          <CiFilter className="inline w-3 h-3 text-gray-600 stroke-[1.5]" />
        </FilterTrigger>
      ),
    };
  }, [accountOptions, statusOptions]);

  const columns = useMemo(
    () => [
      "ID",
      "Booking Date",
      "Status",
      "Account",
      "Amount",
      "Closing Balance",
      "Actions",
    ],
    [],
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    return date;
  };

  const tableData = useMemo<JSX.Element[][]>(() => {
    return ledgerData?.entries?.map((r, index) => {
      console.log(r)
      // Determine background color based on row type and ledger type
      // Customer ledger: payment=green, booking=red
      // Vendor ledger: payment=red, booking=green (inverted)
      const amountBgClass = isVendorLedger
        ? r.type === "payment"
          ? "bg-red-50"
          : "bg-green-50"
        : r.type === "payment"
          ? "bg-green-50"
          : "bg-red-50";
      const amountTextClass = isVendorLedger
        ? r.type === "payment"
          ? "text-red-500"
          : "text-green-600"
        : r.type === "payment"
          ? "text-green-600"
          : "text-red-500";

      return [
        <td
          key={`id-${index}`}
          className="px-4 py-3 text-center font-[600] text-[14px]"
        >
          {r.customId}
        </td>,
        <td key={`date-${index}`} className="px-4 py-3 text-center text-[14px]">
          {formatDate(r?.data?.formFields?.bookingdate || r.date)}
        </td>,
        <td
          key={`status-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
          <span
            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-semibold ${
              statusPillClasses[r.paymentStatus as LedgerStatus]
            }`}
          >
            {r.paymentStatus === 'none' ? 'Pending' : r.paymentStatus === 'partial'
                ? 'Partially Paid'
                : 'Paid'}
          </span>
        </td>,
        <td
          key={`account-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
          {r.account ?? ""}
        </td>,
        <td
          key={`amount-${index}`}
          className={`px-4 py-3 text-center text-[14px] ${amountBgClass}`}
        >
          <span className="font-semibold">₹ {formatMoney(r.amount)}</span>
        </td>,
        <td
          key={`closing-${index}`}
          className={`px-4 py-3 text-center text-[14px] ${amountBgClass}`}
        >
          <span className={`${amountTextClass} font-semibold`}>
            ₹ {formatMoney(r.outstandingAmount)}
          </span>
        </td>,
        <td
          key={`actions-${index}`}
          className="px-4 py-3 text-center text-[14px]"
        >
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
                // View handled by row click for payment rows only.
                // Intentionally do not open the ViewPaymentSidesheet here.
              }}
            >
              <FiEye className="text-[#8B6914]" size={16} />
            </button>

            <ActionMenu
              width="w-24"
              actions={[
                {
                  label: "Edit",
                  onClick: () => {
                    // Open AddPaymentSidesheet in edit mode with prefilled values
                    setSelectedLedgerRow(r);
                    setPaymentSidesheetMode("edit");
                    // Title depends on ledger context and row type
                    setPaymentSidesheetTitle(
                      r.type === "payment"
                        ? isVendorLedger
                          ? "Payment Out"
                          : "Payment In"
                        : "Payment Out",
                    );
                    setPaymentInitial({
                      amount: String(r.amount),
                      paymentDate: r.bookingDate,
                      bank: r.account ?? "",
                      internalNotes: "",
                      bankCharges: "",
                      bankChargesNotes: "",
                      cashbackReceived: "",
                      cashbackNotes: "",
                    });
                    setPaymentSidesheetOpen(true);
                  },
                },
                {
                  label: "Delete",
                  color: "text-red-600",
                  onClick: () => console.log("Delete row:", r),
                },
              ]}
            />
          </div>
        </td>,
      ];
    });
  }, [ledgerData]);

  const handleOpenViewPaymentByRowIndex = (rowIndex: number) => {
    const row = ledgerData?.entries[rowIndex];
    if (!row) return;
    // Only open view payment sidesheet for payment records
    if (row.type === "payment") {
      setSelectedLedgerRow(row);
      setIsViewPaymentOpen(true);
    }
  };

  const handleEditFromViewPayment = () => {
    setPaymentSidesheetMode("edit");
    setPaymentSidesheetTitle("Payment In");
    setPaymentInitial({
      amount: "10000",
      paymentDate: "05-10-2025",
      bank: "Bank 1",
      internalNotes:
        "In a world where creativity knows no bounds, the quick brown fox jumps over the lazy dog, showcasing the beauty of language and imagination.",
      bankCharges: "",
      bankChargesNotes: "",
      cashbackReceived: "",
      cashbackNotes: "",
    });
    setIsViewPaymentOpen(false);
    setPaymentSidesheetOpen(true);
  };

  const headerLeft = (
    <div className="flex items-center gap-3">
      <h2 className="text-[1rem] md:text-[1.15rem] font-semibold text-black">
        Ledger
      </h2>
      <div className="w-px h-6 bg-gray-300" />
      <span className="text-[0.95rem] font-semibold text-gray-900">
        {customerName ?? "—"}
      </span>
      <div className="w-px h-6 bg-gray-300" />
      <span className="text-[0.95rem] font-semibold text-gray-900">
        {customerId ?? "—"}
      </span>
    </div>
  );

  return (
    <>
      <Modal
        title=""
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        customWidth="w-[1100px]"
        customeHeight="h-fit"
        className="pb-2"
        closeOnOverlayClick={true}
        closeOnEscape={true}
        zIndexClass="z-[200]"
        disableOverlayClick={false}
        headerLeft={headerLeft}
      >
        <div className="p-2 -mt-4" onClick={(e) => e.stopPropagation()}>
          <div className="border border-gray-200 rounded-xl p-3">
            {/* Top actions row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="rounded-lg px-4 py-3 bg-[#F9F9F9]">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-[14px] font-medium">
                      {ledgerData?.closingBalance?.balanceType === "credit" ? "You Collect" : "You Pay"}
                    </span>
                    <span
                      className={`text-[14px] font-semibold ${
                        ledgerData?.closingBalance?.balanceType === "credit" ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      ₹ {formatMoney(Math.abs(ledgerData?.closingBalance?.amount))}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-50 transition"
                  aria-label="Refresh"
                  onClick={() => onRefresh?.()}
                >
                  <LuRefreshCcw size={18} />
                </button>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onViewPdf?.()}
                  className="flex items-center gap-2 border border-gray-200 rounded-l-md px-4 py-2 bg-[#F8FAFC] hover:bg-gray-50 text-gray-700 text-[13px] font-medium"
                >
                  <span className="inline-flex items-center justify-center w-4 h-4">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </span>
                  View PDF
                </button>
                <button
                  type="button"
                  className="border border-l-0 border-gray-200 rounded-r-md px-3 py-2.5 bg-[#F8FAFC] hover:bg-gray-50 text-gray-700"
                  aria-label="PDF options"
                >
                  <IoChevronDownOutline size={16} />
                </button>
              </div>
            </div>

            {/* Filters row */}
            <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
              <DateRangeInput
                startDate={startDate}
                endDate={endDate}
                onChange={(s, e) => {
                  setStartDate(s);
                  setEndDate(e);
                }}
              />

              <label
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setPendingOnly((prev) => !prev)}
              >
                <div className="mt-0.5 w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center bg-white">
                  {pendingOnly && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="11"
                      viewBox="0 0 12 11"
                      fill="none"
                    >
                      <path
                        d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                        stroke="#0D4B37"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-gray-700 mt-1">
                  Show bookings with amount pending
                </span>
              </label>
            </div>

            {/* Table */}
            <div className="mt-4">
              {
                ledgerData?.entries && <Table
                  data={tableData}
                  columns={columns}
                  columnIconMap={columnIconMap}
                  initialRowsPerPage={2}
                  hideRowsPerPage={false}
                  categoryName="entries"
                  hideEntriesText={false}
                  headerClassName="bg-gray-100"
                  headerRowTextClassName="text-[#414141]"
                  headerCellTextClassName="text-[#414141]"
                  sortableHeaderHoverClass="bg-gray-50"
                  onRowClick={handleOpenViewPaymentByRowIndex}
                />
              }
              
            </div>
          </div>

          {/* Bottom summary buttons */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPaymentSidesheetMode("create");
                setPaymentInitial(null);
                setPaymentSidesheetTitle("Payment Out");
                setPaymentSidesheetOpen(true);
              }}
              className="bg-[#EB382B] hover:bg-[#DC2626] text-white px-4 py-2.5 rounded-md text-[14px] font-semibold"
            >
              <span className="flex items-center gap-2">
                <PiArrowCircleUpRight size={18} height="bold" strokeWidth={4} />
                You Gave
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentSidesheetMode("create");
                setPaymentInitial(null);
                setPaymentSidesheetTitle("Payment In");
                setPaymentSidesheetOpen(true);
              }}
              className="bg-[#4CA640] hover:bg-[#16A34A] text-white px-4 py-2.5 rounded-md text-[14px] font-semibold"
            >
              <span className="text-sm flex items-center gap-1">
                {" "}
                <PiArrowCircleDownLeft
                  size={18}
                  height="bold"
                  strokeWidth={4}
                />
                You Got
              </span>
            </button>
          </div>
        </div>
      </Modal>

      <ViewPaymentSidesheet
        isOpen={isViewPaymentOpen}
        onClose={() => setIsViewPaymentOpen(false)}
        onEdit={handleEditFromViewPayment}
        onDelete={() => console.log("Delete payment:", selectedLedgerRow)}
      />
      {/* Payment Sidesheet triggered from Ledger actions */}
      <AddPaymentSidesheet
        isOpen={paymentSidesheetOpen}
        onClose={() => {
          setPaymentSidesheetOpen(false);
          setPaymentSidesheetMode("create");
          setPaymentInitial(null);
        }}
        title={paymentSidesheetTitle}
        mode={paymentSidesheetMode}
        initialPayment={paymentInitial}
        initialCustomer={
          customerId || customerName
            ? {
                _id: customerId ?? "",
                name: customerName ?? "",
                ...(customerId ? { customId: customerId } : {}),
              }
            : null
        }
        disablePartyType={true}
        onView={() => {
          setPaymentSidesheetOpen(false);
          // keep selectedLedgerRow so view can reference it if needed
          setIsViewPaymentOpen(true);
        }}
        onDelete={() =>
          console.log("Delete payment from edit header", paymentInitial)
        }
      />
    </>
  );
};

export default LedgerModal;
