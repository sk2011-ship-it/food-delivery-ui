import { ALL_SITES } from "@/config/sites";

/** Delivery locations — derived from the configured site list. */
export const LOCATIONS = ALL_SITES.map((s) => s.location) as string[];
export type LocationName = string;

/** Returns the accent + primary colours for a given location name. */
export function locationTheme(location: string | null | undefined): { color: string; bg: string } {
  const site = ALL_SITES.find((s) => s.location === location);
  if (!site) return { color: "#6b7280", bg: "#f3f4f6" };
  // Derive a light tint from the accent for the badge background
  return { color: site.theme.primary, bg: site.theme.accent + "22" };
}
