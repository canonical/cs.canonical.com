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
