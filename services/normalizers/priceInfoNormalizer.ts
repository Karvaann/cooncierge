// ================= TYPES =================

type Currency = "INR" | "USD";

interface ApiMoney {
  amount?: number;
  currency?: Currency;
  exchangeRate?: number;
  notes?: string;
}

// ================= HELPERS =================

// Extract { amount, currency, roe } from API money object
export const extractMoney = (obj?: ApiMoney) => {
  const rawAmount = obj?.amount;
  return {
    amount:
      rawAmount === 0 || rawAmount ? String(rawAmount) : "",
    currency: (obj?.currency || "INR") as Currency,
    roe:
      obj?.exchangeRate === 0 || obj?.exchangeRate
        ? String(obj.exchangeRate)
        : "",
    notes: obj?.notes ? String(obj.notes) : "",
  };
};

// Safely get array
export const getArray = (primary: any, fallback: any) =>
  Array.isArray(primary) ? primary : Array.isArray(fallback) ? fallback : [];

// ================= DETECTION =================

export const hasPriceApiSchema = (source: Record<string, any>) => {
  const pi = source.priceInfo ?? {};
  return (
    (pi &&
      typeof pi === "object" &&
      (pi.costPrice ||
        pi.vendorInvoiceBase ||
        pi.refundReceived ||
        pi.additionalCostPrice)) ||
    Array.isArray(source.customerPricing)
  );
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
  status: string,
) => {
  const customerPricingArr = Array.isArray(source.customerPricing)
    ? source.customerPricing
    : [];

  return customerPricingArr.map((cp: any) => {
    const primarySelling =
      status === "rescheduled"
        ? extractMoney(cp.oldSellingPrice)
        : extractMoney(cp.sellingPrice);
    const secondarySelling =
      status === "rescheduled"
        ? extractMoney(cp.newSellingPrice)
        : extractMoney(cp.refundPaid);

    return {
      sellingprice: primarySelling.amount,
      sellingCurrency: primarySelling.currency,
      sellingRoe: primarySelling.roe,
      sellingInr: "",
      sellingNotes: primarySelling.notes,
      sellingRefundAmount: secondarySelling.amount,
      sellingRefundCurrency: secondarySelling.currency,
      sellingRefundRoe: secondarySelling.roe,
      sellingRefundInr: "",
      sellingRefundNotes: secondarySelling.notes,
    };
  });
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

  const sellingPrices = buildCustomerSellingPrices(source, status);
  const primaryCustomerPricing = sellingPrices[0];

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
    costNotes: core.cost.notes,

    sellingprice: primaryCustomerPricing?.sellingprice ?? core.selling.amount,
    sellingCurrency:
      primaryCustomerPricing?.sellingCurrency ?? core.selling.currency,
    sellingRoe: primaryCustomerPricing?.sellingRoe ?? core.selling.roe,
    sellingInr: "",
    sellingNotes: primaryCustomerPricing?.sellingNotes ?? core.selling.notes,

    vendorBasePrice: core.vendorBase.amount,
    vendorBaseCurrency: core.vendorBase.currency,
    vendorBaseRoe: core.vendorBase.roe,
    vendorBaseInr: "",
    vendorBaseNotes: core.vendorBase.notes,

    vendorIncentiveReceived: core.vendorIncentive.amount,
    vendorIncentiveCurrency: core.vendorIncentive.currency,
    vendorIncentiveRoe: core.vendorIncentive.roe,
    vendorIncentiveInr: "",
    vendorIncentiveNotes: core.vendorIncentive.notes,

    commissionPaid: core.commission.amount,
    commissionCurrency: core.commission.currency,
    commissionRoe: core.commission.roe,
    commissionInr: "",
    commissionNotes: core.commission.notes,

    showAdvancedPricing: Boolean(pi.advancedPricing),

    costRefundAmount: additional.addCost.amount,
    costRefundCurrency: additional.addCost.currency,
    costRefundRoe: additional.addCost.roe,
    costRefundInr: "",
    costRefundNotes: additional.addCost.notes,

    sellingRefundAmount:
      primaryCustomerPricing?.sellingRefundAmount ?? additional.addSelling.amount,
    sellingRefundCurrency:
      primaryCustomerPricing?.sellingRefundCurrency ??
      additional.addSelling.currency,
    sellingRefundRoe:
      primaryCustomerPricing?.sellingRefundRoe ?? additional.addSelling.roe,
    sellingRefundInr: "",
    sellingRefundNotes:
      primaryCustomerPricing?.sellingRefundNotes ?? additional.addSelling.notes,

    vendorInvoiceRefundAmount: additional.addVendorInvoice.amount,
    vendorInvoiceRefundCurrency: additional.addVendorInvoice.currency,
    vendorInvoiceRefundRoe: additional.addVendorInvoice.roe,
    vendorInvoiceRefundInr: "",
    vendorInvoiceRefundNotes: additional.addVendorInvoice.notes,

    chargebackAmount: additional.addVendorIncentive.amount,
    chargebackCurrency: additional.addVendorIncentive.currency,
    chargebackRoe: additional.addVendorIncentive.roe,
    chargebackInr: "",
    chargebackNotes: additional.addVendorIncentive.notes,

    commissionRefundAmount: additional.addCommission.amount,
    commissionRefundCurrency: additional.addCommission.currency,
    commissionRefundRoe: additional.addCommission.roe,
    commissionRefundInr: "",
    commissionRefundNotes: additional.addCommission.notes,

    ...(sellingPrices.length ? { sellingPrices } : {}),
  };
};
