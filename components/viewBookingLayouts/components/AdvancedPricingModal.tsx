"use client";

import React, { useId, useMemo, useState } from "react";
import { TbNotes } from "react-icons/tb";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import Modal from "@/components/Modal";
import { useAuth } from "@/context/AuthContext";
import { getBusinessCurrency, requiresRoe } from "@/utils/currencyUtil";
import type { AmountSectionValue } from "@/components/AmountSection";

type Props = {
  value: AmountSectionValue;
  onChange: (next: AmountSectionValue) => void;
  showTotal?: boolean;
  onToggleTotal?: (v: boolean) => void;
  onClose?: () => void;
  onSave?: (val: AmountSectionValue) => void;
  isOpen?: boolean;
};

const sanitizeNumeric = (val: string) => {
  const v = String(val || "").replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length <= 1) return parts[0];
  return parts[0] + "." + parts.slice(1).join("");
};

const computeInr = (amountStr?: string | number, roeStr?: string | number) => {
  const a = Number(String(amountStr ?? "").replace(/,/g, ""));
  const r = Number(String(roeStr ?? "").replace(/,/g, ""));
  if (!isFinite(a) || !isFinite(r) || a === 0 || r === 0) return "";
  const product = a * r;
  const hasFraction = Math.abs(product - Math.round(product)) > 1e-9;
  return product.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

export default function AdvancedPricingModal({
  value,
  onChange,
  showTotal = false,
  onToggleTotal,
  onClose,
  onSave,
  isOpen,
}: Props) {
  const checkboxId = useId();
  const { user } = useAuth();
  const businessCurrency = getBusinessCurrency(user);

  const v = value ?? ({} as AmountSectionValue);
  const update = (patch: Partial<AmountSectionValue>) =>
    onChange({ ...v, ...patch });

  const [showVendorBaseNotesFlag, setShowVendorBaseNotesFlag] = useState(false);
  const [showVendorIncentiveNotesFlag, setShowVendorIncentiveNotesFlag] =
    useState(false);
  const [showCommissionNotesFlag, setShowCommissionNotesFlag] = useState(false);

  const derivedCostPrice = useMemo(() => {
    const parseNum = (s?: string) =>
      Number(String(s ?? "").replace(/,/g, "")) || 0;

    const base =
      String(v.vendorBaseCurrency) === "USD"
        ? parseNum(v.vendorBaseInr) ||
          parseNum(v.vendorBasePrice) * parseNum(v.vendorBaseRoe)
        : parseNum(v.vendorBasePrice);

    const inc =
      String(v.vendorIncentiveCurrency) === "USD"
        ? parseNum(v.vendorIncentiveInr) ||
          parseNum(v.vendorIncentiveReceived) * parseNum(v.vendorIncentiveRoe)
        : parseNum(v.vendorIncentiveReceived);

    const com =
      String(v.commissionCurrency) === "USD"
        ? parseNum(v.commissionInr) ||
          parseNum(v.commissionPaid) * parseNum(v.commissionRoe)
        : parseNum(v.commissionPaid);

    const result = base - inc + com;
    if (!isFinite(result)) return "";
    const hasFraction = Math.abs(result - Math.round(result)) > 1e-9;
    return result.toLocaleString("en-US", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }, [
    v.vendorBaseCurrency,
    v.vendorBasePrice,
    v.vendorBaseInr,
    v.vendorBaseRoe,
    v.vendorIncentiveCurrency,
    v.vendorIncentiveReceived,
    v.vendorIncentiveInr,
    v.vendorIncentiveRoe,
    v.commissionCurrency,
    v.commissionPaid,
    v.commissionInr,
    v.commissionRoe,
  ]);

  return (
    <Modal
      isOpen={Boolean(isOpen)}
      onClose={() => onClose && onClose()}
      size="xl"
      customWidth="w-[952px]"
      headerLeft={
        <h3 className="text-[13px] font-medium text-gray-700">Amount</h3>
      }
    >
      <div className="w-full">
        <h4 className="text-[13px] font-medium text-gray-700 mb-3">
          Vendor Payment Summary
        </h4>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Vendor Invoice (Base) */}
          <div className="grid grid-cols-[220px_1fr] border-b border-gray-200">
            <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
              Vendor Invoice (Base)
            </div>
            <div className="p-4 border-b border-gray-200">
              <MultiCurrencyInput
                currency={(v.vendorBaseCurrency as "INR" | "USD") || "INR"}
                onCurrencyChange={(val) =>
                  update({ vendorBaseCurrency: val as "INR" | "USD" })
                }
                amount={v.vendorBasePrice || ""}
                onAmountChange={(val) =>
                  update({
                    vendorBasePrice: sanitizeNumeric(String(val ?? "")),
                  } as any)
                }
                roe={v.vendorBaseRoe || ""}
                onRoeChange={(val) =>
                  update({
                    vendorBaseRoe: val,
                    vendorBaseInr: computeInr(
                      String(v.vendorBasePrice ?? ""),
                      val,
                    ),
                  })
                }
                inr={v.vendorBaseInr || ""}
                notes={v.vendorBaseNotes || ""}
                onNotesChange={(val) => update({ vendorBaseNotes: val })}
                showNotes={showVendorBaseNotesFlag}
                onToggleNotes={() => setShowVendorBaseNotesFlag((s) => !s)}
                businessCurrency={businessCurrency}
                requiresRoe={requiresRoe}
              />
            </div>
          </div>

          {/* Supplier Incentive Received */}
          <div className="grid grid-cols-[220px_1fr] border-b border-gray-200">
            <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
              Supplier Incentive Received
            </div>
            <div className="p-4 border-b border-gray-200">
              <MultiCurrencyInput
                currency={(v.vendorIncentiveCurrency as "INR" | "USD") || "INR"}
                onCurrencyChange={(val) =>
                  update({ vendorIncentiveCurrency: val as "INR" | "USD" })
                }
                amount={v.vendorIncentiveReceived || ""}
                onAmountChange={(val) =>
                  update({
                    vendorIncentiveReceived: sanitizeNumeric(String(val ?? "")),
                  } as any)
                }
                roe={v.vendorIncentiveRoe || ""}
                onRoeChange={(val) =>
                  update({
                    vendorIncentiveRoe: val,
                    vendorIncentiveInr: computeInr(
                      String(v.vendorIncentiveReceived ?? ""),
                      val,
                    ),
                  })
                }
                inr={v.vendorIncentiveInr || ""}
                notes={v.vendorIncentiveNotes || ""}
                onNotesChange={(val) => update({ vendorIncentiveNotes: val })}
                showNotes={showVendorIncentiveNotesFlag}
                onToggleNotes={() => setShowVendorIncentiveNotesFlag((s) => !s)}
                businessCurrency={businessCurrency}
                requiresRoe={requiresRoe}
              />
            </div>
          </div>

          {/* Commission Payout */}
          <div className="grid grid-cols-[220px_1fr] border-b border-gray-200">
            <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
              Commission Payout
            </div>
            <div className="p-4 border-b border-gray-200">
              <MultiCurrencyInput
                currency={(v.commissionCurrency as "INR" | "USD") || "INR"}
                onCurrencyChange={(val) =>
                  update({ commissionCurrency: val as "INR" | "USD" })
                }
                amount={v.commissionPaid || ""}
                onAmountChange={(val) =>
                  update({
                    commissionPaid: sanitizeNumeric(String(val ?? "")),
                  } as any)
                }
                roe={v.commissionRoe || ""}
                onRoeChange={(val) =>
                  update({
                    commissionRoe: val,
                    commissionInr: computeInr(
                      String(v.commissionPaid ?? ""),
                      val,
                    ),
                  })
                }
                inr={v.commissionInr || ""}
                notes={v.commissionNotes || ""}
                onNotesChange={(val) => update({ commissionNotes: val })}
                showNotes={showCommissionNotesFlag}
                onToggleNotes={() => setShowCommissionNotesFlag((s) => !s)}
                businessCurrency={businessCurrency}
                requiresRoe={requiresRoe}
              />
            </div>
          </div>

          {/* Cost Price */}
          <div className="grid grid-cols-[220px_1fr]">
            <div className="bg-[#F9F9F9] border-r border-gray-200 flex items-center justify-center text-[13px] font-medium text-[#414141] py-4">
              Cost Price
            </div>
            <div className="p-4">
              <div className="w-fit rounded-md px-3 py-1 bg-[#EEF6FF] text-[0.9rem] font-semibold text-[#126ACB]">
                {businessCurrency === "INR" ? "₹ " : ""}
                {derivedCostPrice || "0.00"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button
            className="px-3 py-2 bg-gray-100 rounded mr-2"
            onClick={() => onClose && onClose()}
          >
            Close
          </button>
          <button
            className="px-3 py-2 bg-[#126ACB] text-white rounded"
            onClick={() => {
              onSave && onSave(v);
              onClose && onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
