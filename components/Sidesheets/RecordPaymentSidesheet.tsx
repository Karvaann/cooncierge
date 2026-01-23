"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SideSheet from "@/components/SideSheet";
import Table from "@/components/Table";
import SingleCalendar from "@/components/SingleCalendar";
import DropDown from "@/components/DropDown";
import AddBankSidesheet, {
  type BankPayload,
} from "@/components/Sidesheets/AddBankSidesheet";
import BankApi from "@/services/bankApi";
import { MdOutlineFileUpload } from "react-icons/md";
import { FaRegFolder } from "react-icons/fa";
import { FiPlusCircle, FiTrash2 } from "react-icons/fi";
import PaymentsApi from "@/services/paymentsApi";
import Button from "@/components/Button";

type BookingLike = {
  _id: string;
  customId?: string;
  customerId?: { _id: string; name: string };
  formFields?: { customer?: string };
};

interface RecordPaymentSidesheetProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingLike | null;
}

type DocumentPreview = {
  file: File;
  name: string;
  size: number;
  preview?: string;
};

const formatMoney = (n: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const sanitizeAmountInput = (value: string) => {
  if (!value) return "";
  // keep digits + optional decimal
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, "")
  );
};

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`w-4 h-4 transform transition-transform ${
      open ? "rotate-180" : "rotate-0"
    }`}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 8l5 5 5-5"
      stroke="#6B6B6B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RecordPaymentSidesheet: React.FC<RecordPaymentSidesheetProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const bookingLabel = booking?.customId || booking?._id || "";
  const leadPaxName =
    booking?.customerId?.name || booking?.formFields?.customer || "--";

  // Ledger state (to show pending/balance similar to screenshot)
  const [outstandingAmount, setOutstandingAmount] = useState<number | null>(
    null,
  );
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Payment Type State
  type PaymentType = "CARD" | "UPI" | "IMPS" | "NEFT" | "RTGS" | "CHEQUE";

  const [paymentType, setPaymentType] = useState<PaymentType | "">("");

  // Form State
  const [amountToRecord, setAmountToRecord] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentPreview[]>([]);

  // Advance settle UI
  const [settleFromAdvance, setSettleFromAdvance] = useState<boolean>(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState<boolean>(true);
  const [settleAmount, setSettleAmount] = useState<string>("");
  const [settleAmountDirty, setSettleAmountDirty] = useState<boolean>(false);

  const amountToRecordNumber = useMemo(() => {
    const n = Number(amountToRecord);
    return Number.isFinite(n) ? n : 0;
  }, [amountToRecord]);

  const pendingAmount = useMemo(() => {
    if (
      typeof outstandingAmount === "number" &&
      !Number.isNaN(outstandingAmount)
    ) {
      return Math.max(0, outstandingAmount);
    }
    return Math.max(0, amountToRecordNumber);
  }, [outstandingAmount, amountToRecordNumber]);

  // Dummy advance payment amount to match UI while backend support is wired
  const advancePaymentAmount = useMemo(() => {
    // Use real pending amount (remove dummy fallback)
    return pendingAmount;
  }, [pendingAmount]);

  const remainingAfterSettle = useMemo(() => {
    const n = Number(settleAmount || 0);
    if (!Number.isFinite(n)) return pendingAmount;
    return Math.max(0, pendingAmount - n);
  }, [pendingAmount, settleAmount]);

  const [banks, setBanks] = useState<Array<{ _id?: string; name: string }>>([]);
  const [isAddBankOpen, setIsAddBankOpen] = useState<boolean>(false);

  const bankDropdownOptions = useMemo(
    () => banks.map((b) => ({ value: b._id || b.name, label: b.name })),
    [banks],
  );

  const handleAddBank = (bank: BankPayload) => {
    const normalizedName = (bank.name || "").trim();
    if (!normalizedName) return;

    setBanks((prev) => {
      const exists = prev.some(
        (x) => x.name.toLowerCase() === normalizedName.toLowerCase(),
      );
      if (exists) return prev;
      return [...prev, { _id: bank._id, name: normalizedName }];
    });

    // Prefer returned _id when available, else use name
    setSelectedBank(bank._id || normalizedName);
    setIsAddBankOpen(false);
  };

  // Fetch banks when the sidesheet opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await BankApi.getBanks({ isDeleted: false });
        const list = (resp?.banks || resp?.data || resp || []) as any[];
        if (cancelled) return;
        const mapped = list.map((b) => ({
          _id: b._id,
          name: b.name || b.alias || b.accountNumber || String(b._id),
        }));
        setBanks(mapped);
      } catch (err) {
        console.error("Failed to load banks", err);
        if (!cancelled) setBanks([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // revoke object URLs on unmount
  useEffect(() => {
    return () => {
      documents.forEach((d) => d.preview && URL.revokeObjectURL(d.preview));
    };
  }, [documents]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxFiles = 3;
    if (documents.length + files.length > maxFiles) {
      alert("Maximum of 3 files can be uploaded");
      e.target.value = "";
      return;
    }

    const nextDocs: DocumentPreview[] = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));

    setDocuments((prev) => [...prev, ...nextDocs]);
    e.target.value = "";
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  // Submit handler - record payment against quotation
  const handleRecordPayment = async () => {
    if (!booking?._id) {
      alert("No booking selected");
      return;
    }

    if (!amountToRecord || Number(amountToRecord) <= 0) {
      alert("Enter a valid amount to record");
      return;
    }

    const bankId = selectedBank;
    if (!bankId || String(bankId).trim() === "") {
      alert("Please select a valid bank");
      return;
    }

    const hasFiles = documents.length > 0;
    const allocationAmount = settleFromAdvance
      ? Number(settleAmount || 0)
      : undefined;

    // normalize payment type to backend expected values (lowercase)
    const selectedPaymentType =
      paymentType && paymentType !== "" ? paymentType.toLowerCase() : "cash";

    if (hasFiles) {
      const form = new FormData();
      form.append("bankId", bankId);
      form.append("amount", String(Number(amountToRecord)));
      form.append("entryType", "credit");
      form.append("paymentType", selectedPaymentType);
      form.append("party", "Customer");
      form.append("paymentDate", paymentDate || new Date().toISOString());
      form.append("status", "approved");
      if (remarks) form.append("internalNotes", remarks);
      if (allocationAmount !== undefined)
        form.append("allocationAmount", String(allocationAmount));
      documents.forEach((d) => form.append("documents", d.file, d.name));

      try {
        const resp = await PaymentsApi.createPaymentForQuotation(
          booking._id,
          form,
        );
        onClose();
        alert("Payment recorded successfully");
      } catch (err: any) {
        console.error("Failed to record payment", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to record payment";
        alert(msg);
      }

      return;
    }

    const payload: any = {
      bankId,
      amount: Number(amountToRecord),
      entryType: "credit",
      paymentType: selectedPaymentType,
      paymentDate: paymentDate || new Date().toISOString(),
      status: "approved",
      internalNotes: remarks,
      party: "Customer",
    };

    if (allocationAmount !== undefined)
      payload.allocationAmount = allocationAmount;

    try {
      const resp = await PaymentsApi.createPaymentForQuotation(
        booking._id,
        payload,
      );
      onClose();
      alert("Payment recorded successfully");
    } catch (err: any) {
      console.error("Failed to record payment", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to record payment";
      alert(msg);
    }
  };

  // Reset when opening
  useEffect(() => {
    if (!isOpen) return;
    setAmountToRecord("");
    setPaymentDate("");
    setSelectedBank("");
    setRemarks("");
    setDocuments([]);
    setSettleFromAdvance(false);
    setPaymentDetailsOpen(true);
    setSettleAmount("");
    setSettleAmountDirty(false);
    setOutstandingAmount(null);
  }, [isOpen]);

  // Fetch ledger (pending amount / balance) when opened with a booking
  useEffect(() => {
    const quotationId = booking?._id;
    if (!isOpen || !quotationId) return;

    let cancelled = false;
    (async () => {
      setIsLedgerLoading(true);
      try {
        const resp = await PaymentsApi.getQuotationLedger(quotationId);
        const outstanding = Number(resp?.outstandingAmount);
        if (!cancelled) {
          setOutstandingAmount(
            Number.isFinite(outstanding) ? outstanding : null,
          );
        }
      } catch (e) {
        if (!cancelled) setOutstandingAmount(null);
      } finally {
        if (!cancelled) setIsLedgerLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, booking?._id]);

  // When settle UI opens, collapse payment details like screenshot
  useEffect(() => {
    if (!isOpen) return;
    if (settleFromAdvance) {
      setPaymentDetailsOpen(false);
      if (!settleAmountDirty) {
        setSettleAmount(amountToRecord);
      }
    } else {
      setPaymentDetailsOpen(true);
    }
  }, [settleFromAdvance, isOpen, amountToRecord, settleAmountDirty]);

  const balanceText = useMemo(() => {
    if (isLedgerLoading) return "Balance : …";
    if (typeof outstandingAmount !== "number") return "Balance : ₹ --";
    // keep visual consistent with screenshot (negative sign)
    return `Balance : ₹ -${formatMoney(Math.max(0, outstandingAmount))}`;
  }, [isLedgerLoading, outstandingAmount]);

  const settleTableData = useMemo(() => {
    return [
      [
        <td key="p" className="px-4 py-3 text-center text-[13px]">
          <span className="font-medium text-gray-900">{bookingLabel}</span>
        </td>,
        <td key="a" className="px-4 py-3 text-center text-[13px]">
          <div className="text-gray-900 font-medium">
            ₹ {formatMoney(advancePaymentAmount)}
          </div>
          <div className="mt-1 text-[12px] text-orange-500 font-medium">
            Remaining : ₹ {formatMoney(remainingAfterSettle)}
          </div>
        </td>,
        <td key="s" className="px-4 py-3 text-center">
          <div className="inline-flex items-center border border-gray-200 rounded-md overflow-hidden bg-white">
            <span className="px-3 py-1.5 text-[13px] text-gray-500 bg-gray-50 border-r border-gray-200">
              ₹
            </span>
            <input
              type="text"
              value={settleAmount}
              onChange={(e) => {
                setSettleAmountDirty(true);
                setSettleAmount(sanitizeAmountInput(e.target.value));
              }}
              onBlur={() => {
                const n = Number(settleAmount || 0);
                const clamped = Math.min(
                  Math.max(Number.isFinite(n) ? n : 0, 0),
                  pendingAmount,
                );
                setSettleAmount(String(clamped));
              }}
              className="w-[5rem] px-3 py-1.5 text-[13px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
            />
          </div>
        </td>,
      ],
    ];
  }, [advancePaymentAmount, bookingLabel, pendingAmount, settleAmount]);

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      width="xl"
      position="right"
      title={
        <span className="flex items-center gap-2">
          <span>Record Payment</span>
          <span className="font-semibold">{bookingLabel}</span>
        </span>
      }
    >
      <div className="px-6 pb-8">
        <div className="mt-2 flex items-center justify-between">
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-900">
            {leadPaxName}
          </div>
          <div className="text-[12px] font-medium text-red-500">
            {balanceText}
          </div>
        </div>

        {/* Settle from Advance Payments */}
        <div className="mt-3 mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between gap-4">
            <label
              className="flex items-start gap-3 cursor-pointer select-none"
              onClick={() => setSettleFromAdvance((p) => !p)}
            >
              <div className="mt-0.5 w-5 h-5 border border-gray-300 rounded-md flex items-center justify-center bg-white">
                {settleFromAdvance && (
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

              <div>
                <p className="text-[13px] font-semibold text-gray-900">
                  Settle from Advance Payments
                </p>
                <p className="text-[12px] text-gray-600">
                  You have advance payments for this booking. Click here to
                  settle from Advance Payments.
                </p>
              </div>
            </label>
          </div>

          {settleFromAdvance && (
            <>
              <div className="mt-4 border-t border-gray-200" />

              <div className="mt-4">
                <div className="inline-flex items-center gap-3 rounded-lg bg-white border border-gray-200 px-4 py-3">
                  <span className="text-[13px] font-medium text-gray-700">
                    Amount Pending
                  </span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    ₹ {formatMoney(pendingAmount)}
                  </span>
                </div>

                <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-visible">
                  <Table
                    columns={["Payment", "Amount (₹)", "Settle Amount (₹)"]}
                    headerAlign={{
                      Payment: "center",
                      "Amount (₹)": "center",
                      "Settle Amount (₹)": "center",
                    }}
                    hideRowsPerPage
                    hideEntriesText
                    initialRowsPerPage={1}
                    data={settleTableData}
                  />
                </div>

                <div className="mt-2 text-right text-[12px] text-gray-500">
                  Remaining after settle: ₹ {formatMoney(remainingAfterSettle)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Payment Details (collapsible) */}
        <div className="mb-4 border border-gray-200 rounded-lg bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setPaymentDetailsOpen((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-3"
            aria-expanded={paymentDetailsOpen}
          >
            <span className="text-[13px] font-semibold text-gray-900">
              Payment Details
            </span>
            <Chevron open={paymentDetailsOpen} />
          </button>
          {paymentDetailsOpen && (
            <>
              <hr className="mb-2 -mt-1 border-t border-gray-200" />
              <div className="px-4 pb-4">
                {/* Amount to be recorded */}
                <div className="mb-4">
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span>Amount to be Recorded
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[13px] text-gray-500">
                      ₹
                    </span>
                    <input
                      type="text"
                      value={amountToRecord}
                      onChange={(e) => {
                        const next = sanitizeAmountInput(e.target.value);
                        setAmountToRecord(next);
                        if (settleFromAdvance && !settleAmountDirty) {
                          setSettleAmount(next);
                        }
                      }}
                      placeholder="Enter Amount"
                      className="w-full pl-8 pr-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300"
                    />
                  </div>
                </div>

                {/* Payment Date */}
                <div className="mb-4">
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <div className="w-full">
                    <SingleCalendar
                      customWidth="w-full"
                      value={paymentDate}
                      onChange={setPaymentDate}
                      placeholder="Select Date"
                    />
                  </div>
                </div>

                {/* Bank Selection */}
                <div className="mb-4">
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    <span className="text-red-500">*</span>Bank
                  </label>
                  <DropDown
                    options={bankDropdownOptions}
                    placeholder="Select Bank"
                    value={selectedBank}
                    onChange={(val) => setSelectedBank(val)}
                    customWidth="w-full"
                    buttonClassName="text-[13px]"
                    footerAction={{
                      label: "Add New Bank",
                      icon: <FiPlusCircle size={16} />,
                      onClick: () => setIsAddBankOpen(true),
                    }}
                  />
                  <p className="mt-2 text-[12px] text-red-500">
                    Note : Select the bank for this payment
                  </p>
                </div>

                {selectedBank && (
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium text-gray-700 mb-2">
                      Payment Type
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {["CARD", "UPI", "IMPS", "NEFT", "RTGS", "CHEQUE"].map(
                        (type) => {
                          const selected = paymentType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                setPaymentType(type as PaymentType)
                              }
                              className={`px-4 py-2 text-[13px] rounded-full border transition inline-flex items-center gap-3 ${
                                selected
                                  ? "bg-[#F9F3FF] border-gray-300 text-gray-800 font-semibold"
                                  : "bg-[#F9F9F9] border-gray-200 text-gray-700"
                              }`}
                            >
                              <div className="w-4 h-4 border border-gray-300 rounded-sm flex items-center justify-center bg-white">
                                {selected && (
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
                              <span className="leading-none">{type}</span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                <AddBankSidesheet
                  isOpen={isAddBankOpen}
                  onClose={() => setIsAddBankOpen(false)}
                  onSubmit={handleAddBank}
                />

                {/* Files */}
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Files
                </label>
                <div className="mb-2">
                  <label className="inline-flex items-center px-3 py-1.5 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <span className="text-[13px] text-blue-500 font-medium flex items-center gap-2">
                      <MdOutlineFileUpload size={16} />
                      Attach Files
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[12px] text-red-500 mb-3">
                  Note : Maximum of 3 files can be uploaded
                </p>

                {documents.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between w-full bg-white rounded-md px-3 py-2 hover:bg-gray-50 transition"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            doc.preview && window.open(doc.preview, "_blank")
                          }
                          className="text-blue-700 border border-gray-200 p-1 -ml-2 rounded-md bg-gray-100 text-[13px] truncate flex items-center gap-2"
                        >
                          <FaRegFolder className="text-blue-500 w-3 h-3" />
                          {doc.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove file"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter your remarks..."
                    rows={3}
                    className="w-full px-4 py-2 text-[13px] border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-300 resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Fixed Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end items-center">
        <Button
          text="Update Payment"
          onClick={handleRecordPayment}
          bgColor="bg-[#0D4B37]"
          textColor="text-white"
          className="py-2.5 text-[13px] font-semibold"
        />
      </div>
    </SideSheet>
  );
};

export default RecordPaymentSidesheet;
