export type DirectorySourceUi = {
  type: "meta" | "google" | "referral" | "seo" | "word-of-mouth" | "none";
  label: string;
};

const API_SOURCE_MAP: Record<string, DirectorySourceUi> = {
  meta_organic: { type: "meta", label: "Meta (Organic)" },
  meta_paid: { type: "meta", label: "Meta (Paid)" },
  google_seo_organic: { type: "google", label: "Google (Organic)" },
  google_seo_paid: { type: "google", label: "Google (Paid)" },
  word_of_mouth: { type: "word-of-mouth", label: "Word of Mouth" },
  referral: { type: "referral", label: "Referral" },
};

export function mapApiSourceToUi(source: unknown): DirectorySourceUi {
  if (
    source &&
    typeof source === "object" &&
    "type" in source &&
    "label" in source
  ) {
    const typed = source as DirectorySourceUi;
    if (typed.type && typed.label) {
      return typed;
    }
  }

  if (typeof source === "string" && API_SOURCE_MAP[source]) {
    return API_SOURCE_MAP[source];
  }

  return { type: "none", label: "—" };
}

const UI_SOURCE_LABELS: Record<string, string> = {
  meta: "Meta (Organic)",
  google: "Google (Organic)",
  seo: "SEO (Paid)",
  "word-of-mouth": "Word of Mouth",
  referral: "Referral",
};

/** Map form dropdown value (meta, google, …) to backend enum (meta_organic, …). */
export function mapUiSourceToApi(uiSource: string, label?: string): string {
  if (!uiSource) return "";

  if (API_SOURCE_MAP[uiSource]) {
    return uiSource;
  }

  const resolvedLabel = label || UI_SOURCE_LABELS[uiSource] || "";
  const lowerLabel = resolvedLabel.toLowerCase();

  switch (uiSource) {
    case "meta":
      return lowerLabel.includes("paid") ? "meta_paid" : "meta_organic";
    case "google":
      return lowerLabel.includes("paid")
        ? "google_seo_paid"
        : "google_seo_organic";
    case "seo":
      return "google_seo_paid";
    case "word-of-mouth":
      return "word_of_mouth";
    case "referral":
      return "referral";
    default:
      return uiSource;
  }
}

/** Map backend source enum back to form dropdown value when editing. */
export function mapApiSourceToUiDropdown(apiSource: string): string {
  if (!apiSource) return "";

  if (UI_SOURCE_LABELS[apiSource]) {
    return apiSource;
  }

  switch (apiSource) {
    case "meta_organic":
    case "meta_paid":
      return "meta";
    case "google_seo_organic":
      return "google";
    case "google_seo_paid":
      return "seo";
    case "word_of_mouth":
      return "word-of-mouth";
    case "referral":
      return "referral";
    default:
      return "";
  }
}

export function mapTierToNumber(tier: unknown, fallback = 2): number {
  let value = fallback;

  if (typeof tier === "number" && Number.isFinite(tier)) {
    value = tier;
  } else if (typeof tier === "string") {
    const tierMatch = tier.match(/tier(\d+)/i);
    if (tierMatch?.[1]) {
      value = Number(tierMatch[1]);
    } else {
      const parsed = Number(tier);
      if (Number.isFinite(parsed)) {
        value = parsed;
      }
    }
  }

  return Math.min(Math.max(Math.round(value), 1), 3);
}

export function formatDirectoryDisplayDate(dateString?: string): string {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);
  return `${day} ${month} '${year}`;
}
