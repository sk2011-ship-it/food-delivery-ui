const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
];

export function normalizeImageUrl(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isLikelyImageUrl(value: unknown): boolean {
  const url = normalizeImageUrl(value);
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}
