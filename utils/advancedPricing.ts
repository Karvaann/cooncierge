export const isNonEmptyPricingValue = (value: unknown): boolean => {
  if (value === 0) return true;
  if (value === null || value === undefined) return false;
  const text = String(value).trim();
  if (!text) return false;
  const lowered = text.toLowerCase();
  if (lowered === "null" || lowered === "undefined" || lowered === "nan") {
    return false;
  }
  return true;
};

// If a booking has vendor base / incentive / commission fields populated
// but *not* a direct cost price, it likely originated from the
// "Show Advanced Pricing" UI.
export const inferShowAdvancedPricing = (data: unknown): boolean => {
  const d = (data ?? {}) as Record<string, unknown>;

  const hasAdvanced =
    isNonEmptyPricingValue(d.vendorBasePrice) ||
    isNonEmptyPricingValue(d.vendorBaseInr) ||
    isNonEmptyPricingValue(d.vendorIncentiveReceived) ||
    isNonEmptyPricingValue(d.vendorIncentiveInr) ||
    isNonEmptyPricingValue(d.commissionPaid) ||
    isNonEmptyPricingValue(d.commissionInr);

  const hasDirectCost =
    isNonEmptyPricingValue(d.costprice) || isNonEmptyPricingValue(d.costInr);

  return Boolean(hasAdvanced && !hasDirectCost);
};

export const getDefaultShowAdvancedPricing = (
  data: unknown,
  isReadOnly: boolean,
): boolean => {
  const d = (data ?? {}) as Record<string, unknown>;

  // If explicitly saved as truthy, respect it.
  // If saved as false, we still allow inference in view mode because
  // older / inconsistent records may not have this flag set correctly.
  if (
    d.showAdvancedPricing === true ||
    d.showAdvancedPricing === "true" ||
    d.showAdvancedPricing === 1 ||
    d.showAdvancedPricing === "1"
  ) {
    return true;
  }

  // In view mode, infer from the persisted pricing fields.
  return isReadOnly ? inferShowAdvancedPricing(d) : false;
};
