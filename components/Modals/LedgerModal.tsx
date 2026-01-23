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
import { MdOutlineFileDownload } from "react-icons/md";
import PaymentsApi from "@/services/paymentsApi";
import DropDown from "../DropDown";
import { exportPDF, exportXLSX } from "@/utils/exportUtils";
import { isWithinDateRange } from "@/utils/helper";

type LedgerStatus = "paid" | "none" | "partial";

export type LedgerRow = {
  id: string; // booking ID or payment ID
  bookingDate: string; // dd-mm-yyyy
  status: LedgerStatus;
  account: string | null;
  amount: number;
  party: "Customer" | "Vendor";
  partyId: string;
  partyName?: string;
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
    paymentType?: string;
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
  const [downloadType, setDownloadType] = useState<"pdf" | "excel">("pdf");

  const accountOptions: FilterCardOption[] = useMemo(
    () => ["Bank 1", "Bank 2", "Cash"].map((v) => ({ value: v, label: v })),
    [],
  );

  // Date column label and filter options (Booking Date <-> Travel Date)
  const [dateColumnLabel, setDateColumnLabel] =
    useState<string>("Booking Date");
  const dateFilterOptions: FilterCardOption[] = useMemo(
    () => [
      { value: "travel", label: "Travel Date" },
      { value: "booking", label: "Booking Date" },
    ],
    [],
  );

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        if (isVendorLedger) {
          const data = await PaymentsApi.getVendorLedger(rawId!);
          setLedgerData(data);
        } else {
          const data = await PaymentsApi.getCustomerLedger(rawId!);
          setLedgerData(data);
        }
      } catch (err) {
        console.error("Failed to fetch ledger:", err);
      }
    };
    if (isOpen) {
      fetchLedger();
    }
  }, [isOpen, customerName, rawId]);

  // Normalize an entry (ledgerData.entries item) into a payment-like object
  // Expect the API to send the payment object with the known shape.
  // Keep mapping minimal and avoid deep fallback chains.
  const normalizeEntryToPayment = (entry: any) => {
    if (!entry) return null;
    const data = entry.data || {};
    const payment = {
      customId: entry.customId || data.customId,
      _id: data._id || entry._id || entry.referenceId,
      amount: Number(data.amount || entry.amount || 0),
      entryType: data.entryType || entry.entryType,
      paymentDate: data.paymentDate || entry.paymentDate || entry.date,
      paymentType: data.paymentType || entry.paymentType,
      bank: data.bankId || entry.bank || entry.bankId || null,
      account: entry.account,
      documents: data.documents || entry.documents || [],
      internalNotes:
        data.internalNotes ||
        data.notes ||
        entry.internalNotes ||
        entry.notes ||
        "",
      allocations: entry.allocations || data.allocations || [],
      outstandingAmount: data.unallocatedAmount || entry.unallocatedAmount,
      party: data.party || entry.party,
      partyId: data.partyId || entry.partyId,
      partyName: data.partyId?.name || entry.partyName,
      bankCharges: data.bankCharges || entry.bankCharges,
      bankChargesNotes: data.bankChargesNotes || entry.bankChargesNotes,
      cashbackReceived: data.cashbackReceived || entry.cashbackReceived,
      cashbackNotes: data.cashbackNotes || entry.cashbackNotes,
      data: data,
      // keep original entry for reference
      _entry: entry,
    } as any;

    return payment;
  };

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
      [dateColumnLabel]: (
        <>
          <HiArrowsUpDown className="inline w-3 h-3 text-gray-600 font-semibold stroke-[2]" />
          <FilterTrigger
            ariaLabel="Filter Date Type"
            options={dateFilterOptions}
            onApply={(sel) => {
              const val =
                Array.isArray(sel) && sel.length > 0 ? sel[0] : "booking";
              setDateColumnLabel(
                val === "travel" ? "Travel Date" : "Booking Date",
              );
            }}
          >
            <CiFilter className="inline w-3 h-3 text-gray-600 stroke-[1.5] ml-2" />
          </FilterTrigger>
        </>
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
  }, [accountOptions, statusOptions, dateColumnLabel, dateFilterOptions]);

  const columns = useMemo(() => {
    return [
      "ID",
      dateColumnLabel,
      "Status",
      "Account",
      "Amount",
      "Closing Balance",
      "Actions",
    ];
  }, [dateColumnLabel]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return date;
  };

  // Format ledger data for export
  const formatLedgerDataForExport = () => {
    if (!ledgerData?.entries) return [];

    return ledgerData.entries.map((entry: any) => ({
      ID: entry.type === "opening" ? "Opening Balance" : entry.customId || "NA",
      Date: formatDate(entry?.data?.formFields?.bookingdate || entry.date),
      Type:
        entry.type === "payment"
          ? "Payment"
          : entry.type === "opening"
            ? "Opening"
            : "Booking",
      Status:
        entry.type === "opening" || entry.type === "payment"
          ? "-"
          : entry.paymentStatus === "none"
            ? "Pending"
            : entry.paymentStatus === "partial"
              ? "Partially Paid"
              : "Paid",
      Account: entry.account || "-",
      Amount: `₹ ${formatMoney(entry.amount)}`,
      "Closing Balance": `₹ ${formatMoney(entry.closingBalance.amount)}`,
    }));
  };

  // Handle download based on selected type
  const handleDownload = () => {
    const formattedData = formatLedgerDataForExport();
    const fileName = `${customerName || "Ledger"}_${customerId || ""}_${new Date().toISOString().split("T")[0]}`;

    if (downloadType === "pdf") {
      exportPDF(formattedData, fileName);
    } else if (downloadType === "excel") {
      exportXLSX(formattedData, fileName);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!ledgerData?.entries) return [];

    return ledgerData.entries.filter((entry: any) => {
      // Pending filter
      if (pendingOnly && entry.paymentStatus !== "none") return false;

      // Choose the date field according to selected date column
      let entryDate: string = "";
      if (entry.type === "payment") {
        entryDate = entry.paymentDate || "";
      } else if (dateColumnLabel === "Travel Date") {
        entryDate =
          entry.travelDate ||
          entry.data?.travelDate ||
          entry.data?.formFields?.traveldate ||
          "";
      } else {
        entryDate = entry.data?.formFields?.bookingdate || "";
      }

      if (!isWithinDateRange(entryDate, startDate, endDate)) return false;

      return true;
    });
  }, [ledgerData, pendingOnly, startDate, endDate, dateColumnLabel]);

  const tableData = useMemo<JSX.Element[][]>(() => {
    return filteredEntries.map((r: any, index: any) => {
      console.log(r);

      // show travel date when selected, otherwise booking date
      const displayedDate = (() => {
        if (r.type === "payment") {
          return r.paymentDate || r.date;
        }

        if (dateColumnLabel === "Travel Date") {
          return (
            r.travelDate || r.data?.travelDate || r.data?.formFields?.traveldate
          );
        }

        // Default: Booking Date
        return r.data?.formFields?.bookingdate || r.date;
      })();
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
          {r.type === "opening" ? "Opening Balance" : r.customId || "NA"}
        </td>,
        <td key={`date-${index}`} className="px-4 py-3 text-center text-[14px]">
          {formatDate(displayedDate)}
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
            {r.type === "opening" || r.type === "payment"
              ? ""
              : r.paymentStatus === "none"
                ? "Pending"
                : r.paymentStatus === "partial"
                  ? "Partially Paid"
                  : "Paid"}
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
            ₹ {formatMoney(r.closingBalance.amount)}
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
                    // Normalize entry and open AddPaymentSidesheet in edit mode
                    const payment = normalizeEntryToPayment(r);
                    setSelectedLedgerRow(payment);
                    setPaymentSidesheetMode("edit");
                    // Title based on customId prefix: PI- = Payment In, PO- = Payment Out
                    const customId = payment.customId || "";
                    setPaymentSidesheetTitle(
                      customId.startsWith("PI-") ? "Payment In" : "Payment Out",
                    );
                    setPaymentInitial({
                      amount: String(payment.amount || ""),
                      paymentDate: payment.paymentDate || "",
                      bank:
                        payment.data?.bankId?._id ||
                        payment.bank?._id ||
                        payment.bank ||
                        r.data?.bankId?._id ||
                        r.bank?._id ||
                        r.bankId ||
                        "",
                      paymentType: payment.paymentType || "",
                      internalNotes: payment.internalNotes || "",
                      bankCharges: String(payment.bankCharges || ""),
                      bankChargesNotes: payment.bankChargesNotes || "",
                      cashbackReceived: String(payment.cashbackReceived || ""),
                      cashbackNotes: payment.cashbackNotes || "",
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
  }, [filteredEntries, isVendorLedger, dateColumnLabel]);

  const handleOpenViewPaymentByRowIndex = (rowIndex: number) => {
    const row = ledgerData?.entries[rowIndex];
    if (!row) return;
    // Only open view payment sidesheet for payment records
    if (row.type === "payment") {
      const payment = normalizeEntryToPayment(row);
      setSelectedLedgerRow(payment);
      setIsViewPaymentOpen(true);
    }
  };

  const handleEditFromViewPayment = (paymentData: any) => {
    if (!paymentData) return;

    // Accept either a raw entry or a normalized payment object
    const payment =
      paymentData && paymentData._entry
        ? paymentData
        : normalizeEntryToPayment(paymentData);

    setSelectedLedgerRow(payment);
    setPaymentSidesheetMode("edit");
    // Title based on customId prefix: PI- = Payment In, PO- = Payment Out
    const customId = payment.customId || "";
    setPaymentSidesheetTitle(
      customId.startsWith("PI-") ? "Payment In" : "Payment Out",
    );
    setPaymentInitial({
      amount: String(payment.amount || ""),
      paymentDate: payment.paymentDate || "",
      bank:
        payment.data?.bankId?._id || payment.bank?._id || payment.bank || "",
      paymentType: payment.paymentType || "",
      internalNotes: payment.internalNotes || "",
      bankCharges: String(payment.bankCharges || ""),
      bankChargesNotes: payment.bankChargesNotes || "",
      cashbackReceived: String(payment.cashbackReceived || ""),
      cashbackNotes: payment.cashbackNotes || "",
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

  // Compute initial customer/vendor safely for create/edit flows
  const { computedInitialCustomer, computedInitialVendor } =
    React.useMemo(() => {
      try {
        let initialCustomer: any = null;
        let initialVendor: any = null;

        if (paymentSidesheetMode === "edit" && selectedLedgerRow) {
          if (selectedLedgerRow.party === "Customer") {
            initialCustomer = {
              _id: selectedLedgerRow.partyId || "",
              name: selectedLedgerRow.partyName || "",
            };
          } else if (selectedLedgerRow.party === "Vendor") {
            initialVendor = {
              _id: selectedLedgerRow.partyId || "",
              name: selectedLedgerRow.partyName || "",
            };
          }
        } else {
          // create mode: prefer ledger owner; if ledger is vendor type, pass vendor
          if (isVendorLedger) {
            if (rawId || customerName) {
              initialVendor = {
                _id: rawId ?? "",
                name: customerName ?? "",
                ...(customerId ? { customId: customerId } : {}),
              };
            }
          } else {
            if (rawId || customerName) {
              initialCustomer = {
                _id: rawId ?? "",
                name: customerName ?? "",
                ...(customerId ? { customId: customerId } : {}),
              };
            }
          }
        }

        return {
          computedInitialCustomer: initialCustomer,
          computedInitialVendor: initialVendor,
        };
      } catch (err) {
        console.error("Failed to compute initial party:", err);
        return { computedInitialCustomer: null, computedInitialVendor: null };
      }
    }, [
      paymentSidesheetMode,
      selectedLedgerRow,
      rawId,
      customerName,
      customerId,
      isVendorLedger,
    ]);

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
                      {ledgerData?.closingBalance?.balanceType === "credit"
                        ? "You Collect"
                        : "You Pay"}
                    </span>
                    <span
                      className={`text-[14px] font-semibold ${
                        ledgerData?.closingBalance?.balanceType === "credit"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      ₹{" "}
                      {formatMoney(
                        Math.abs(ledgerData?.closingBalance?.amount),
                      )}
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
                  onClick={handleDownload}
                  className="flex items-center gap-2 border border-gray-200 rounded-l-md px-4 py-2 bg-[#F8FAFC] hover:bg-gray-50 text-gray-700 text-[13px] font-medium"
                >
                  <MdOutlineFileDownload size={16} />
                  {downloadType === "pdf" ? "View PDF" : "Download Excel"}
                </button>
                <div className="border border-l-0 border-gray-200 rounded-r-md bg-[#F8FAFC] hover:bg-gray-50">
                  <DropDown
                    options={[
                      {
                        value: "pdf",
                        label: (
                          <span className="flex items-center gap-2">
                            <MdOutlineFileDownload size={16} />
                            View PDF
                          </span>
                        ),
                      },
                      {
                        value: "excel",
                        label: (
                          <span className="flex items-center gap-2">
                            <MdOutlineFileDownload size={16} />
                            Download Excel
                          </span>
                        ),
                      },
                    ]}
                    value={downloadType}
                    onChange={(val) => setDownloadType(val as "pdf" | "excel")}
                    iconOnly
                    noBorder
                    noButtonRadius
                    buttonClassName="px-3 py-2.5 bg-[#F8FAFC] hover:bg-gray-50 text-gray-700"
                    customWidth="w-auto"
                    customHeight="h-auto"
                    menuWidth="w-[150px]"
                  />
                </div>
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
              {ledgerData?.entries && (
                <Table
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
              )}
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
        payment={selectedLedgerRow}
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
        initialCustomer={computedInitialCustomer}
        initialVendor={computedInitialVendor}
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
