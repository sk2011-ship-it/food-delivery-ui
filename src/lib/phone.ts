export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d+]/g, "").replace(/\+/g, "");

  if (!digits) return "";
  return hasLeadingPlus ? `+${digits}` : digits;
}

export function phoneDigits(value: unknown): string {
  return normalizePhone(value).replace(/\D/g, "");
}

export function isValidPhone(value: unknown): boolean {
  const digits = phoneDigits(value);
  return digits.length >= 10 && digits.length <= 15;
}
