export type CustomerSourceFilterValue =
  | "meta-organic"
  | "meta-paid"
  | "google-organic"
  | "google-paid"
  | "seo-organic"
  | "seo-paid"
  | "word-of-mouth"
  | "referral"
  | "none";

export const DEFAULT_SOURCE_FILTER: CustomerSourceFilterValue[] = [
  "meta-organic",
  "meta-paid",
  "google-organic",
  "google-paid",
  "seo-organic",
  "seo-paid",
  "word-of-mouth",
  "referral",
  "none",
];

type SourceLike = {
  type: string;
  label: string;
};

/** Maps a customer/traveller source object to a filter checkbox value. */
export const resolveSourceFilterValue = (
  source: SourceLike,
): CustomerSourceFilterValue => {
  if (source.type === "none") return "none";

  const label = (source.label || "").toLowerCase();

  if (source.type === "meta") {
    return label.includes("paid") ? "meta-paid" : "meta-organic";
  }
  if (source.type === "google") {
    return label.includes("paid") ? "google-paid" : "google-organic";
  }
  if (source.type === "seo") {
    return label.includes("paid") ? "seo-paid" : "seo-organic";
  }
  if (source.type === "word-of-mouth") return "word-of-mouth";
  if (source.type === "referral") return "referral";

  return "none";
};
