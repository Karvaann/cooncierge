export type Currency = "INR" | "USD";

/**
 * Read business currency from user object.
 *
 */
export function getBusinessCurrency(user: any): Currency | null {
  try {
    const maybe = user || {};
    const fromBusinessInfo = maybe.businessInfo && maybe.businessInfo.currency;
    const fromBusinessId =
      maybe.businessId && typeof maybe.businessId === "object"
        ? maybe.businessId.currency
        : maybe.businessId;
    const cur = fromBusinessInfo || fromBusinessId || null;
    if (cur === "INR" || cur === "USD") return cur as Currency;
    return null;
  } catch {
    return null;
  }
}

/**
 * Determine whether selected currency requires ROE/INR UI.
 * - If businessCurrency is present, returns true when selected !== businessCurrency.
 * - If no businessCurrency is known, treat USD as requiring ROE.
 */
export function requiresRoe(
  selectedCurrency?: string | Currency | null,
  businessCurrency?: string | Currency | null,
): boolean {
  if (!selectedCurrency) return false;
  if (businessCurrency) return String(selectedCurrency) !== businessCurrency;
  return String(selectedCurrency) === "USD";
}
