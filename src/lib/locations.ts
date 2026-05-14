import { ALL_SITES } from "@/config/sites";

/** Delivery locations — derived from the configured site list. */
export const LOCATIONS = ALL_SITES.map((s) => s.location) as string[];
export type LocationName = string;

/** Normalizes location text for safe comparisons. */
export function normalizeLocationName(value: string | null | undefined): string {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

/** Returns true when two location strings refer to the same site. */
export function isSameLocation(
  left: string | null | undefined,
  right: string | null | undefined
): boolean {
  return normalizeLocationName(left) === normalizeLocationName(right);
}

/** Returns the accent + primary colours for a given location name. */
export function locationTheme(location: string | null | undefined): { color: string; bg: string } {
  const normalized = normalizeLocationName(location);
  const site = ALL_SITES.find((s) => normalizeLocationName(s.location) === normalized);
  if (!site) return { color: "#6b7280", bg: "#f3f4f6" };
  // Derive a light tint from the accent for the badge background
  return { color: site.theme.primary, bg: site.theme.accent + "22" };
}
