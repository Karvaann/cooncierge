"use client";

import React, { useEffect, useMemo, useState } from "react";
import MultiCurrencyInput from "@/components/multiCurrencyUI";
import { requiresRoe } from "@/utils/currencyUtil";
import AdvancedPricingModal from "@/components/viewBookingLayouts/components/AdvancedPricingModal";
import StyledDescription from "@/components/StyledDescription";
import CustomCheckbox from "@/components/CustomCheckbox";
import { allowTextAndNumbers } from "@/utils/inputValidators";

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
  const checkboxBaseId = React.useId();

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

  const [totalCostForAllFlights, setTotalCostForAllFlights] = useState(false);
  const [showCostNotes, setShowCostNotes] = useState(false);

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
    <>
      <div className="py-3 px-0 -ml-2">
        <div className="flex items-start gap-2">
          <div>
            <label className="text-[13px] text-gray-600 mb-2 block">
              Confirmation Number
            </label>
            <input
              name="confirmationNumber"
              placeholder="Enter Confirmation No."
              value={String(formData.confirmationNumber ?? "")}
              onChange={(e) => {
                const val = allowTextAndNumbers(e.target.value || "");
                setFormData((prev) => ({ ...prev, confirmationNumber: val }));
              }}
              readOnly={isReadOnly}
              className="w-[100%] px-2 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300 text-[13px] placeholder:text-[13px]"
            />
          </div>
          <div className="flex-1">
            <label className="text-[13px] text-gray-600 mb-2 block">
              Title
            </label>
            <input
              name="title"
              placeholder="Enter Title"
              value={String(formData.title ?? "")}
              onChange={handleChange}
              readOnly={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-300 text-[13px] placeholder:text-[13px]"
            />
          </div>
        </div>

        <div className="mt-4 ">
          <div className="p-0 ">
            <StyledDescription
              value={String(formData.description ?? "")}
              onChange={(v: any) =>
                setFormData((p) => ({ ...p, description: v }))
              }
              readOnly={isReadOnly}
              labelSize="text-[14px]"
              boxWidth="w-90%"
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="mt-5 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium text-gray-700">Amount</h3>
              <div className="flex items-center gap-5">
                <CustomCheckbox
                  id={`${checkboxBaseId}-total-cost`}
                  checked={Boolean(totalCostForAllFlights)}
                  onCheckedChange={setTotalCostForAllFlights}
                  label={
                    <span className="text-[13px] text-gray-700">
                      Total Cost for all Flights
                    </span>
                  }
                  labelClassName="text-[13px] text-gray-700"
                />

                <CustomCheckbox
                  id={`${checkboxBaseId}-advanced-pricing`}
                  checked={Boolean(showAdvancedPricing)}
                  onCheckedChange={() => {
                    setAdvancedValue((prev: any) => ({
                      ...prev,
                      vendorBaseCurrency: formData.costCurrency ?? "INR",
                      vendorBasePrice: String(formData.costprice ?? ""),
                      vendorBaseRoe: String(formData.costRoe ?? ""),
                      vendorBaseInr: String(formData.costInr ?? ""),
                      vendorBaseNotes: String(formData.costNotes ?? ""),
                      vendorIncentiveCurrency: "INR",
                      vendorIncentiveReceived: String(
                        formData.vendorIncentiveReceived ?? "",
                      ),
                      commissionCurrency: "INR",
                      commissionPaid: String(formData.commissionPaid ?? ""),
                    }));
                    setOpenAdvancedModal(true);
                    setShowAdvancedPricing(true);
                    setFormData((p) => ({ ...p, showAdvancedPricing: true }));
                  }}
                  label={
                    <span className="text-[13px] text-gray-700">
                      Show Advanced Pricing
                    </span>
                  }
                  labelClassName="text-[13px] text-gray-700"
                />
              </div>
            </div>

            <hr className="mb-3 -mt-1 border-t border-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-1 font-medium text-gray-600 text-[13px]">
                  Cost Price
                </label>
                <MultiCurrencyInput
                  currency={formData.costCurrency as any}
                  onCurrencyChange={(c: any) =>
                    setFormData((p) => ({ ...p, costCurrency: c }))
                  }
                  amount={String(formData.costprice ?? "")}
                  onAmountChange={(v: string) =>
                    setFormData((p) => ({ ...p, costprice: v }))
                  }
                  roe={String(formData.costRoe ?? "")}
                  onRoeChange={(r: string) =>
                    setFormData((p) => ({ ...p, costRoe: r }))
                  }
                  inr={String(formData.costInr ?? "")}
                  notes={String(formData.costNotes ?? "")}
                  onNotesChange={(n: string) =>
                    setFormData((p) => ({ ...p, costNotes: n }))
                  }
                  showNotes={showCostNotes}
                  onToggleNotes={() => setShowCostNotes((v) => !v)}
                  businessCurrency={"INR"}
                  requiresRoe={requiresRoe}
                  useWhiteDropdown={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdvancedPricingModal
        isOpen={openAdvancedModal}
        value={advancedValue}
        onChange={(next: any) => setAdvancedValue(next)}
        showTotal={Boolean(totalCostForAllFlights)}
        onToggleTotal={setTotalCostForAllFlights}
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
            showAdvancedPricing: true,
          }));
          setShowAdvancedPricing(true);
          setOpenAdvancedModal(false);
        }}
      />
    </>
  );
}
