"use client";

import React, { useEffect, useMemo, useState } from "react";
import AmountSection from "@/components/AmountSection";
import AdvancedPricingModal from "@/components/viewBookingLayouts/components/AdvancedPricingModal";
import StyledDescription from "@/components/StyledDescription";

interface OtherServiceInfoFormData {
  confirmationNumber?: string | number;
  title?: string;
  description?: string;
  costprice?: string | number;
  costCurrency?: "INR" | "USD";
  costRoe?: string;
  costInr?: string;
  costNotes?: string;
  showAdvancedPricing?: boolean;
  vendorBasePrice?: string;
  vendorBaseCurrency?: "INR" | "USD";
  vendorBaseRoe?: string;
  vendorBaseInr?: string;
  vendorBaseNotes?: string;
  vendorIncentiveReceived?: string;
  commissionPaid?: string;
}

interface Props {
  externalFormData?:
    | Partial<OtherServiceInfoFormData>
    | Record<string, unknown>;
  onFormDataUpdate?: (data: any) => void;
  isReadOnly?: boolean;
}

export default function OtherServiceLayoutUI({
  externalFormData,
  onFormDataUpdate,
  isReadOnly = false,
}: Props) {
  const normalized = useMemo(() => {
    const src = externalFormData ?? {};
    return (src as Partial<OtherServiceInfoFormData>) ?? {};
  }, [externalFormData]);

  const [formData, setFormData] = useState<OtherServiceInfoFormData>({
    confirmationNumber: String(normalized.confirmationNumber ?? ""),
    title: String(normalized.title ?? ""),
    description: String(normalized.description ?? ""),
    costprice: String(normalized.costprice ?? ""),
    costCurrency: (normalized.costCurrency as any) ?? "INR",
    costRoe: String(normalized.costRoe ?? ""),
    costInr: String(normalized.costInr ?? ""),
    costNotes: String(normalized.costNotes ?? ""),
    showAdvancedPricing: Boolean(normalized.showAdvancedPricing),
    vendorBasePrice: String(normalized.vendorBasePrice ?? ""),
    vendorBaseCurrency: (normalized.vendorBaseCurrency as any) ?? "INR",
    vendorBaseRoe: String(normalized.vendorBaseRoe ?? ""),
    vendorBaseInr: String(normalized.vendorBaseInr ?? ""),
    vendorIncentiveReceived: String(normalized.vendorIncentiveReceived ?? ""),
    commissionPaid: String(normalized.commissionPaid ?? ""),
  });

  const [showAdvancedPricing, setShowAdvancedPricing] = useState(
    Boolean(normalized.showAdvancedPricing),
  );

  // Modal state and advanced value (same shape used in FlightSegmentCard)
  const [openAdvancedModal, setOpenAdvancedModal] = useState(false);
  const [advancedValue, setAdvancedValue] = useState<any>(() => ({
    vendorBaseCurrency: formData.costCurrency ?? "INR",
    vendorBasePrice: String(
      formData.vendorBasePrice ?? formData.costprice ?? "",
    ),
    vendorBaseRoe: String(formData.vendorBaseRoe ?? formData.costRoe ?? ""),
    vendorBaseInr: String(formData.vendorBaseInr ?? formData.costInr ?? ""),
    vendorBaseNotes: String(
      formData.vendorBaseNotes ?? formData.costNotes ?? "",
    ),
    vendorIncentiveCurrency: "INR",
    vendorIncentiveReceived: String(formData.vendorIncentiveReceived ?? ""),
    vendorIncentiveRoe: "",
    vendorIncentiveInr: "",
    vendorIncentiveNotes: "",
    commissionCurrency: "INR",
    commissionPaid: String(formData.commissionPaid ?? ""),
    commissionRoe: "",
    commissionInr: "",
    commissionNotes: "",
  }));

  useEffect(() => {
    onFormDataUpdate?.({ otherserviceform: formData });
  }, [formData, onFormDataUpdate]);

  useEffect(() => {
    setShowAdvancedPricing(Boolean(normalized.showAdvancedPricing));
    setFormData((prev) => ({ ...prev, ...normalized }));
  }, [normalized]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              Confirmation Number
            </label>
            <input
              name="confirmationNumber"
              value={String(formData.confirmationNumber ?? "")}
              onChange={handleChange}
              readOnly={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">Title</label>
            <input
              name="title"
              value={String(formData.title ?? "")}
              onChange={handleChange}
              readOnly={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-2 block">
            Description
          </label>
          <div className="border border-gray-200 rounded-md bg-white">
            <div className="p-3">
              <StyledDescription
                value={String(formData.description ?? "")}
                onChange={(v: any) =>
                  setFormData((p) => ({ ...p, description: v }))
                }
                readOnly={isReadOnly}
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-800">Amount</h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAdvancedPricing}
                  onChange={(e) => setShowAdvancedPricing(e.target.checked)}
                  className="hidden"
                />
                <span className="w-4 h-4 border border-[#0D4B37] rounded-sm flex items-center justify-center">
                  {showAdvancedPricing && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="10"
                      viewBox="0 0 11 10"
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
                </span>
                <span className="text-[0.85rem]">Show Advanced Pricing</span>
              </label>

              <button
                type="button"
                onClick={() => setOpenAdvancedModal(true)}
                className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="Open advanced pricing"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="text-[#F59E0B]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6v6l4 2"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 border border-gray-200 rounded-lg p-3">
            <AmountSection
              value={formData as any}
              onChange={(updated: any) =>
                setFormData((prev) => ({ ...prev, ...updated }))
              }
              showAdvancedPricing={showAdvancedPricing}
              onToggleAdvancedPricing={setShowAdvancedPricing}
              isReadOnly={isReadOnly}
            />
          </div>
        </div>
      </div>

      <AdvancedPricingModal
        isOpen={openAdvancedModal}
        value={advancedValue}
        onChange={(next: any) => setAdvancedValue(next)}
        showTotal={false}
        onToggleTotal={() => {}}
        onClose={() => setOpenAdvancedModal(false)}
        onSave={(val: any) => {
          const parseNum = (s?: any) =>
            Number(String(s ?? "").replace(/,/g, "")) || 0;
          const base =
            String(val.vendorBaseCurrency) === "USD"
              ? parseNum(val.vendorBaseInr) ||
                parseNum(val.vendorBasePrice) * parseNum(val.vendorBaseRoe)
              : parseNum(val.vendorBasePrice);
          const inc =
            String(val.vendorIncentiveCurrency) === "USD"
              ? parseNum(val.vendorIncentiveInr) ||
                parseNum(val.vendorIncentiveReceived) *
                  parseNum(val.vendorIncentiveRoe)
              : parseNum(val.vendorIncentiveReceived);
          const com =
            String(val.commissionCurrency) === "USD"
              ? parseNum(val.commissionInr) ||
                parseNum(val.commissionPaid) * parseNum(val.commissionRoe)
              : parseNum(val.commissionPaid);
          const result = base - inc + com;
          let resStr = "";
          if (isFinite(result)) {
            const hasFraction = Math.abs(result - Math.round(result)) > 1e-9;
            resStr = hasFraction
              ? result.toFixed(2)
              : String(Math.round(result));
          }

          setFormData((prev) => ({
            ...prev,
            costprice: String(resStr),
            costCurrency: val.vendorBaseCurrency ?? prev.costCurrency,
            costRoe: val.vendorBaseRoe ?? prev.costRoe,
            costInr: val.vendorBaseInr ?? prev.costInr,
            vendorBasePrice: String(
              val.vendorBasePrice ?? prev.vendorBasePrice ?? "",
            ),
            vendorBaseCurrency:
              val.vendorBaseCurrency ?? prev.vendorBaseCurrency,
            vendorBaseRoe: val.vendorBaseRoe ?? prev.vendorBaseRoe,
            vendorBaseInr: val.vendorBaseInr ?? prev.vendorBaseInr,
            vendorIncentiveReceived: String(
              val.vendorIncentiveReceived ?? prev.vendorIncentiveReceived ?? "",
            ),
            commissionPaid: String(
              val.commissionPaid ?? prev.commissionPaid ?? "",
            ),
          }));
          setOpenAdvancedModal(false);
        }}
      />
    </div>
  );
}
