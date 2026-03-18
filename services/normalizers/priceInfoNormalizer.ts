// ================= TYPES =================

type Currency = "INR" | "USD";

interface ApiMoney {
  amount?: number;
  currency?: Currency;
  exchangeRate?: number;
}

// ================= HELPERS =================

// Extract { amount, currency, roe } from API money object
export const extractMoney = (obj?: ApiMoney) => {
  const rawAmount = obj?.amount;
  return {
    amount: rawAmount ? String(rawAmount) : "",
    currency: (obj?.currency || "INR") as Currency,
    roe: obj?.exchangeRate ? String(obj.exchangeRate) : "",
  };
};

// Safely get array
export const getArray = (primary: any, fallback: any) =>
  Array.isArray(primary) ? primary : Array.isArray(fallback) ? fallback : [];

// ================= DETECTION =================

export const hasPriceApiSchema = (source: Record<string, any>) => {
  const pi = source.priceInfo;
  return pi && typeof pi === "object" && (pi.costPrice || pi.sellingPrice);
};

// ================= CORE EXTRACTION =================

export const extractCorePricing = (pi: Record<string, any>) => {
  return {
    cost: extractMoney(pi.costPrice),
    selling: extractMoney(pi.sellingPrice),
    vendorBase: extractMoney(pi.vendorInvoiceBase),
    vendorIncentive: extractMoney(pi.vendorIncentiveReceived),
    commission: extractMoney(pi.commissionPayout),
  };
};

export const extractRefundPricing = (pi: Record<string, any>) => {
  return {
    refundReceived: extractMoney(pi.refundReceived),
    refundPaid: extractMoney(pi.refundPaid),
    additionalVendorInvoice: extractMoney(
      pi.additionalVendorInvoiceBase,
    ),
    vendorChargeback: extractMoney(pi.vendorIncentiveChargeback),
    commissionChargeback: extractMoney(
      pi.commissionPayoutChargeback,
    ),
  };
};

export const extractReschedulePricing = (pi: Record<string, any>) => {
  return {
    additionalCost: extractMoney(pi.additionalCostPrice),
    additionalSelling: extractMoney(pi.additionalSellingPrice),
    additionalVendorIncentiveRec: extractMoney(
      pi.additionalVendorIncentiveReceived,
    ),
    additionalCommission: extractMoney(
      pi.additionalCommissionPayout,
    ),
  };
};

// ================= STATUS-BASED SELECTION =================

export const resolveAdditionalPricing = ({
  status,
  refund,
  reschedule,
}: {
  status: string;
  refund: ReturnType<typeof extractRefundPricing>;
  reschedule: ReturnType<typeof extractReschedulePricing>;
}) => {
  const isRescheduled = status === "rescheduled";

  return {
    addCost: isRescheduled
      ? reschedule.additionalCost
      : refund.refundReceived,
    addSelling: isRescheduled
      ? reschedule.additionalSelling
      : refund.refundPaid,
    addVendorInvoice: refund.additionalVendorInvoice,
    addVendorIncentive: isRescheduled
      ? reschedule.additionalVendorIncentiveRec
      : refund.vendorChargeback,
    addCommission: isRescheduled
      ? reschedule.additionalCommission
      : refund.commissionChargeback,
  };
};

// ================= CUSTOMER PRICING =================

export const buildCustomerSellingPrices = (
  source: Record<string, any>,
  selling: ReturnType<typeof extractMoney>,
) => {
  const customerPricingArr = Array.isArray(source.customerPricing)
    ? source.customerPricing
    : [];

  if (customerPricingArr.length <= 1) return undefined;

  return customerPricingArr.map((cp: any) => ({
    sellingprice: cp.sellingPrice ? String(cp.sellingPrice) : "",
    sellingCurrency: selling.currency,
    sellingRoe: selling.roe,
    sellingInr: "",
    sellingNotes: "",
  }));
};

// ================= MAIN NORMALIZER =================

export const normalizePriceInfo = (
  externalFormData?: Record<string, any>,
) => {
  const source = (externalFormData ?? {}) as Record<string, any>;

  // Already normalized (edit mode)
  if (source.priceinfoform) {
    return source.priceinfoform;
  }

  // Detect schema
  if (!hasPriceApiSchema(source)) {
    const fields = source.formFields ?? source;
    return fields;
  }

  const pi = source.priceInfo;

  // Extract all groups
  const core = extractCorePricing(pi);
  const refund = extractRefundPricing(pi);
  const reschedule = extractReschedulePricing(pi);

  const status = String(
    source.status || source.formFields?.bookingstatus || "",
  ).toLowerCase();

  const additional = resolveAdditionalPricing({
    status,
    refund,
    reschedule,
  });

  const sellingPrices = buildCustomerSellingPrices(
    source,
    core.selling,
  );

  // FINAL OBJECT (UNCHANGED LOGIC)
  return {
    bookingdate: source.bookingDate || "",
    traveldate: source.travelDate || "",
    bookingstatus: source.status || "",
    cancellationDate: source.cancellationDate || "",
    newBookingDate: source.newBookingDate || "",
    newTravelDate: source.newTravelDate || "",
    remarks: String(pi.notes ?? ""),

    costprice: core.cost.amount,
    costCurrency: core.cost.currency,
    costRoe: core.cost.roe,
    costInr: "",
    costNotes: "",

    sellingprice: core.selling.amount,
    sellingCurrency: core.selling.currency,
    sellingRoe: core.selling.roe,
    sellingInr: "",
    sellingNotes: "",

    vendorBasePrice: core.vendorBase.amount,
    vendorBaseCurrency: core.vendorBase.currency,
    vendorBaseRoe: core.vendorBase.roe,
    vendorBaseInr: "",
    vendorBaseNotes: "",

    vendorIncentiveReceived: core.vendorIncentive.amount,
    vendorIncentiveCurrency: core.vendorIncentive.currency,
    vendorIncentiveRoe: core.vendorIncentive.roe,
    vendorIncentiveInr: "",
    vendorIncentiveNotes: "",

    commissionPaid: core.commission.amount,
    commissionCurrency: core.commission.currency,
    commissionRoe: core.commission.roe,
    commissionInr: "",
    commissionNotes: "",

    showAdvancedPricing: Boolean(pi.advancedPricing),

    costRefundAmount: additional.addCost.amount,
    costRefundCurrency: additional.addCost.currency,
    costRefundRoe: additional.addCost.roe,
    costRefundInr: "",
    costRefundNotes: "",

    sellingRefundAmount: additional.addSelling.amount,
    sellingRefundCurrency: additional.addSelling.currency,
    sellingRefundRoe: additional.addSelling.roe,
    sellingRefundInr: "",
    sellingRefundNotes: "",

    vendorInvoiceRefundAmount: additional.addVendorInvoice.amount,
    vendorInvoiceRefundCurrency: additional.addVendorInvoice.currency,
    vendorInvoiceRefundRoe: additional.addVendorInvoice.roe,
    vendorInvoiceRefundInr: "",
    vendorInvoiceRefundNotes: "",

    chargebackAmount: additional.addVendorIncentive.amount,
    chargebackCurrency: additional.addVendorIncentive.currency,
    chargebackRoe: additional.addVendorIncentive.roe,
    chargebackInr: "",
    chargebackNotes: "",

    commissionRefundAmount: additional.addCommission.amount,
    commissionRefundCurrency: additional.addCommission.currency,
    commissionRefundRoe: additional.addCommission.roe,
    commissionRefundInr: "",
    commissionRefundNotes: "",

    ...(sellingPrices ? { sellingPrices } : {}),
  };
};