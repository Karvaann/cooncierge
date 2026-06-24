import { countryDialCodes, phoneLengthByDialCode } from "./countryDialCodes";

const dialCodes = Array.from(
  new Set(countryDialCodes.map((c) => c.dialCode))
).sort((a, b) => b.length - a.length);

export const getPhoneNumberMaxLength = (
  dialCode?: string,
  fallback = 10
): number => {
  if (!dialCode) return fallback;
  return phoneLengthByDialCode[dialCode] ?? fallback;
};

export const isSupportedDialCode = (dialCode?: string): boolean => {
  if (!dialCode) return false;
  return countryDialCodes.some((c) => c.dialCode === dialCode);
};

export const splitPhoneWithDialCode = (
  phone: string,
  fallbackDialCode = "+91"
): { dialCode: string; number: string } => {
  const raw = String(phone || "");
  const sanitized = raw.replace(/[\s\-()]/g, "");
  if (sanitized.startsWith("+")) {
    const match = dialCodes.find((code) => sanitized.startsWith(code));
    if (match) {
      return {
        dialCode: match,
        number: sanitized.slice(match.length),
      };
    }
    const m = sanitized.match(/^(\+\d{1,4})(\d+)$/);
    if (m) {
      return { dialCode: m[1], number: m[2] || "" };
    }
  }
  return { dialCode: fallbackDialCode, number: sanitized };
};

export const toFlagEmoji = (iso2: string): string => {
  const code = String(iso2 || "").toUpperCase();
  if (code.length !== 2) return "";
  const a = 0x1f1e6;
  const first = a + (code.charCodeAt(0) - 65);
  const second = a + (code.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
};
