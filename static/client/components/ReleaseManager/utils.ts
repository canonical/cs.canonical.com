/**
 * Recursive equality check for two values.
 */
export function recurseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => recurseEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Deep clone a value using structuredClone.
 */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

export function formatInputLabel(label: string): string {
  return label.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function formatSectionTitle(key: string): string {
  return key.replace(/_/g, " ").toUpperCase();
}

export const RELEASES_PR_STATUS = {
  inProgressLabel: "In progress",
  notStartedLabel: "Not started",
  inProgressAppearance: "information" as const,
};

export function getReleaseDemoUrl(prNumber: string | null): string | null {
  return prNumber ? `https://ubuntu-com-${prNumber}.demos.haus/` : null;
}

function compareVersionsDesc(a: string, b: string): number {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const diff = (bParts[i] ?? 0) - (aParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function sortByVersionDesc(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.keys(obj)
      .sort(compareVersionsDesc)
      .map((k) => [k, obj[k]]),
  );
}

export interface IValidationResult<T> {
  isValid: boolean;
  value?: T;
  caution?: string;
}

function invalid<T>(caution: string): IValidationResult<T> {
  return { isValid: false, caution };
}

export function validateRequiredUrl(rawValue: string): IValidationResult<string> {
  if (!rawValue.trim()) {
    return invalid("URL is required.");
  }

  try {
    const parsed = new URL(rawValue);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return invalid("Enter a valid URL (http:// or https://).");
    }
  } catch {
    return invalid("Enter a valid URL (http:// or https://).");
  }

  return { isValid: true, value: rawValue };
}

export function validateMonthYear(rawValue: string): IValidationResult<string> {
  if (!rawValue.trim()) {
    return invalid("Date is required.");
  }

  const normalized = rawValue.trim();
  const monthYearRegex =
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$/i;

  if (!monthYearRegex.test(normalized)) {
    return invalid("Enter a valid date in the format Month YYYY (e.g. October 2025).");
  }

  return { isValid: true, value: rawValue };
}

export function validateRequiredNumber(rawValue: string): IValidationResult<number> {
  if (!rawValue.trim()) {
    return invalid("Please enter a number.");
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) {
    return invalid("Enter a valid numeric value.");
  }

  return { isValid: true, value: parsed };
}
