export type CurrencyOption = {
  value: string;
  label: string;
  symbol: string;
};

export const CURRENCIES: CurrencyOption[] = [
  { value: "USD", label: "US Dollar (USD)", symbol: "$" },
  { value: "EUR", label: "Euro (EUR)", symbol: "€" },
  { value: "GBP", label: "British Pound (GBP)", symbol: "£" },
  { value: "INR", label: "Indian Rupee (INR)", symbol: "₹" },
  { value: "JPY", label: "Japanese Yen (JPY)", symbol: "¥" },
  { value: "AUD", label: "Australian Dollar (AUD)", symbol: "A$" },
  { value: "CAD", label: "Canadian Dollar (CAD)", symbol: "C$" },
  { value: "CHF", label: "Swiss Franc (CHF)", symbol: "CHF" },
  { value: "CNY", label: "Chinese Yuan (CNY)", symbol: "¥" },
  { value: "SGD", label: "Singapore Dollar (SGD)", symbol: "S$" },
  { value: "AED", label: "UAE Dirham (AED)", symbol: "د.إ" },
  { value: "SAR", label: "Saudi Riyal (SAR)", symbol: "﷼" },
  { value: "ZAR", label: "South African Rand (ZAR)", symbol: "R" },
  { value: "NZD", label: "New Zealand Dollar (NZD)", symbol: "NZ$" },
  { value: "KRW", label: "South Korean Won (KRW)", symbol: "₩" },
  { value: "BRL", label: "Brazilian Real (BRL)", symbol: "R$" },
  { value: "RUB", label: "Russian Ruble (RUB)", symbol: "₽" },
  { value: "HKD", label: "Hong Kong Dollar (HKD)", symbol: "HK$" },
  { value: "SEK", label: "Swedish Krona (SEK)", symbol: "kr" },
  { value: "NOK", label: "Norwegian Krone (NOK)", symbol: "kr" },
  { value: "DKK", label: "Danish Krone (DKK)", symbol: "kr" },
  { value: "THB", label: "Thai Baht (THB)", symbol: "฿" },
  { value: "MYR", label: "Malaysian Ringgit (MYR)", symbol: "RM" },
  { value: "IDR", label: "Indonesian Rupiah (IDR)", symbol: "Rp" },
  { value: "PHP", label: "Philippine Peso (PHP)", symbol: "₱" },
  { value: "TRY", label: "Turkish Lira (TRY)", symbol: "₺" },
  { value: "MXN", label: "Mexican Peso (MXN)", symbol: "$" },
  { value: "PLN", label: "Polish Zloty (PLN)", symbol: "zł" },
  { value: "ILS", label: "Israeli Shekel (ILS)", symbol: "₪" },
  { value: "EGP", label: "Egyptian Pound (EGP)", symbol: "£" },
];