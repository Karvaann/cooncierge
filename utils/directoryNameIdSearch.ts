/**
 * Shared Name / ID search for directory tables (customers, travellers, vendors).
 * - Name: 3+ letters, match first or last name as contiguous substring
 * - ID: 2+ digits, match digits in the ID in any order
 * Below thresholds, all rows pass (no filtering yet).
 */
export function matchesDirectoryNameOrIdSearch(
  name: string | null | undefined,
  id: string | null | undefined,
  query: string,
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const letters = trimmed.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const digits = trimmed.replace(/\D/g, "");

  if (letters.length < 3 && digits.length < 2) return true;

  const matchesName =
    letters.length >= 3 &&
    (() => {
      const parts = (name || "")
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      if (parts.length === 0) return false;

      const firstName = parts[0] ?? "";
      const lastName = parts.length > 1 ? (parts[parts.length - 1] ?? "") : "";

      return firstName.includes(letters) || lastName.includes(letters);
    })();

  const matchesId =
    digits.length >= 2 &&
    (() => {
      const idDigits = (id || "").replace(/\D/g, "");
      if (!idDigits) return false;

      const remaining = idDigits.split("");
      for (const digit of digits) {
        const index = remaining.indexOf(digit);
        if (index === -1) return false;
        remaining.splice(index, 1);
      }
      return true;
    })();

  return matchesName || matchesId;
}
