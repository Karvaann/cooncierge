// Type definitions for Tailwind CSS classes
export type BgClass = 
  | 'bg-blue-100' | 'bg-green-100' | 'bg-yellow-100' | 'bg-purple-100' 
  | 'bg-red-100' | 'bg-pink-100' | 'bg-cyan-100' | 'bg-orange-100' | 'bg-lime-100';

export type DarkBgClass = 
  | 'bg-blue-700' | 'bg-green-700' | 'bg-yellow-700' | 'bg-purple-700' 
  | 'bg-red-700' | 'bg-pink-700' | 'bg-cyan-700' | 'bg-orange-700' 
  | 'bg-lime-700' | 'bg-gray-700' | 'bg-indigo-700' | 'bg-teal-700';

export type DarkClass = 
  | 'blue-700' | 'green-700' | 'yellow-700' | 'purple-700' 
  | 'red-700' | 'pink-700' | 'cyan-700' | 'orange-700' 
  | 'lime-700' | 'gray-700' | 'indigo-700' | 'teal-700';

export type BgTextClass = string;

// Optimized arrays with readonly for better performance
const bgClasses: readonly BgClass[] = [
  'bg-blue-100',
  'bg-green-100',
  'bg-yellow-100',
  'bg-purple-100',
  'bg-red-100',
  'bg-pink-100',
  'bg-cyan-100',
  'bg-orange-100',
  'bg-lime-100',
] as const;

const bgTextPairs: readonly BgTextClass[] = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-purple-100 text-purple-700',
  'bg-red-100 text-red-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-lime-100 text-lime-700',
] as const;

const darkBgClasses: readonly DarkBgClass[] = [
  'bg-blue-700',
  'bg-green-700',
  'bg-yellow-700',
  'bg-purple-700',
  'bg-red-700',
  'bg-pink-700',
  'bg-cyan-700',
  'bg-orange-700',
  'bg-lime-700',
  'bg-gray-700',
  'bg-indigo-700',
  'bg-teal-700',
] as const;

const darkClasses: readonly DarkClass[] = [
  'blue-700',
  'green-700',
  'yellow-700',
  'purple-700',
  'red-700',
  'pink-700',
  'cyan-700',
  'orange-700',
  'lime-700',
  'gray-700',
  'indigo-700',
  'teal-700',
] as const;

// Optimized random number generation with crypto API when available
const getSecureRandomIndex = (max: number): number => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] ?? 0) % max;
  }
  return Math.floor(Math.random() * max);
};

/**
 * Returns a random background class from the predefined set
 * @returns A random background class string
 */
export const getRandomBgClass = (): BgClass => {
  const randomIndex = getSecureRandomIndex(bgClasses.length);
  return bgClasses[randomIndex]!;
};

/**
 * Returns a random background-text class combination
 * @returns A random background-text class string
 */
export const getRandomBgTextClass = (): BgTextClass => {
  const randomIndex = getSecureRandomIndex(bgTextPairs.length);
  return bgTextPairs[randomIndex]!;
};

/**
 * Returns a random dark background class
 * @returns A random dark background class string
 */
export const getRandomDarkBgClass = (): DarkBgClass => {
  const randomIndex = getSecureRandomIndex(darkBgClasses.length);
  return darkBgClasses[randomIndex]!;
};

/**
 * Returns a random dark class (without bg- prefix)
 * @returns A random dark class string
 */
export const getRandomDarkClass = (): DarkClass => {
  const randomIndex = getSecureRandomIndex(darkBgClasses.length);
  return darkClasses[randomIndex]!;
};

// Additional utility functions for better performance
/**
 * Memoized function to get random border class (used in calendar)
 * @returns A random border class string
 */
export const getRandomBorderClass = (): string => {
  const borderClasses = [
    'border-blue-400',
    'border-green-400',
    'border-yellow-400',
    'border-purple-400',
    'border-red-400',
    'border-pink-400',
    'border-cyan-400',
    'border-orange-400',
    'border-lime-400',
  ] as const;
  
  const randomIndex = getSecureRandomIndex(borderClasses.length);
  return borderClasses[randomIndex]!;
};

/**
 * Deterministically maps a string seed (e.g., owner name) to a border+text color pair.
 * Useful for avatar chips so colors stay stable across renders.
 */
export const getOwnerAvatarColorClass = (seed: string): string => {
  const palette = [
    "border-pink-700 text-pink-700",
    "border-[#AF52DE] text-[#AF52DE]",
    "border-[#5856D6] text-[#5856D6]",
    "border-cyan-700 text-cyan-700",
    "border-emerald-700 text-emerald-700",
    "border-amber-700 text-amber-700",
  ] as const;

  const input = (seed || "").trim().toLowerCase();

  // Simple stable hash (djb2-ish)
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }

  const idx = Math.abs(hash) % palette.length;
  return palette[idx]!;
};

/**
 * Utility to combine multiple class names efficiently
 * @param classes Array of class names to combine
 * @returns Combined class string
 */
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Returns a currency symbol for common currencies.
 * Defaults to rupee if unknown/undefined to preserve existing behaviour.
 */
export const getCurrencySymbol = (currency?: string): string => {
  if (!currency) return "₹";
  const c = String(currency).trim().toUpperCase();
  const map: Record<string, string> = {
    USD: "$",
    USDT: "$",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };
  return map[c] || c;
};

/**
 * Returns a locale string suitable for formatting numbers for the given currency.
 */
export const getCurrencyLocale = (currency?: string): string => {
  if (!currency) return "en-IN";
  const c = String(currency).trim().toUpperCase();
  switch (c) {
    case "USD":
    case "USDT":
      return "en-US";
    case "EUR":
      return "de-DE";
    case "GBP":
      return "en-GB";
    case "INR":
    default:
      return "en-IN";
  }
};

/**
 * Debounce function for performance optimization
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const formatServiceType = (type: string): string => {
  const normalized = type?.toLowerCase().trim();

  const map: Record<string, string> = {
    
    flight: "Flight",
    flights: "Flight",
    travel: "Flight",

    
    hotel: "Accommodation",
    accommodation: "Accommodation",
    maritime: "Transportation (Maritime)",
    "transport-maritime": "Transportation (Maritime)",
    "maritime transportation": "Transportation (Maritime)",
    "maritime-transportation": "Transportation (Maritime)",
    "maritime_transportation": "Transportation (Maritime)",

    
    car: "Car Rental",
    "land transportation": "Transportation (Land)",
    "land-transportation": "Transportation (Land)",
    "land_transportation": "Transportation (Land)",
    transportation: "Transportation (Land)",
    land: "Transportation (Land)",
    "transport-land": "Transportation (Land)",

    
    package: "Package",

    "travel insurance": "Travel Insurance",

   
    activity: "Activity",

    
    insurance: "Insurance",

   
    visa: "Visa",
     visas: "Visa",
  };

  return map[normalized] || type;
};



export const generateCustomId = (type: "customer" | "vendor" | "traveller" | "team" | "bookings") => {
  // Prefix mapping
  const prefixes: Record<typeof type, string> = {
    customer: "CU",
    vendor: "VE",
    traveller: "TR",
    team: "TE",
    bookings: "OS",
  };

  const prefix = prefixes[type];

  // Generate 2 random uppercase letters
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];

  // Generate a random 3-digit number (001–999)
  const number = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");

  // Final ID: e.g., CU-AB001
  return `${prefix}-${letter1}${letter2}${number}`;
};


export default generateCustomId;

const isAfterDate = (a: string, b: string) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return d1 > d2;
};
export { isAfterDate };

const parseDateSafe = (val?: string | null): Date | null => {
  if (!val) return null;

  // If ISO or other formats parseable by Date do that first
  const iso = new Date(val);
  if (!isNaN(iso.getTime())) return iso;

  // dd-mm-yyyy or dd/mm/yyyy
  const m = String(val).trim().match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

const isWithinDateRange = (
  entryDate: string,
  start?: string,
  end?: string,
) => {
  if (!start && !end) return true;

  const d = parseDateSafe(entryDate);
  const s = parseDateSafe(start ?? null);
  const e = parseDateSafe(end ?? null);

  if (!d) return false;

  if (s) s.setHours(0, 0, 0, 0);
  if (e) e.setHours(23, 59, 59, 999);

  if (s && d < s) return false;
  if (e && d > e) return false;

  return true;
};
export { isWithinDateRange };

/**
 * Format a number as currency-like string with two decimals.
 * Defaults to Indian locale if currency not provided.
 */
export const formatMoney = (value: number, currency?: string): string => {
  try {
    const num = Number(value ?? 0) || 0;
    const locale = getCurrencyLocale(currency);
    return num.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return String(value);
  }
};

/**
 * Parse a value to number, returning 0 for invalid inputs.
 */
export const toNumberOrZero = (value: unknown): number => {
  try {
    if (value == null) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const s = String(value).replace(/,/g, "").trim();
    if (!s) return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

/**
 * Format a date string into `DD Mon YYYY` using Indian locale.
 * Returns empty string when input is falsy or invalid.
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
};


