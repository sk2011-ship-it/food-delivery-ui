/**
 * Restaurant and UI business logic shared across components.
 */

export function parseTimeToMinutes(time: string): number {
  const matches = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!matches) return 0;

  let hours = Number(matches[1]);
  const minutes = Number(matches[2]);
  const period = matches[3].toUpperCase();

  if (hours === 12) hours = 0;
  if (period === "PM") hours += 12;

  return hours * 60 + minutes;
}

export function isOpenNow(opening: string, closing: string, nowMinutes: number): boolean {
  const open = parseTimeToMinutes(opening);
  const close = parseTimeToMinutes(closing);

  if (open === close) {
    return true;
  }

  if (open < close) {
    return nowMinutes >= open && nowMinutes <= close;
  }

  // Handles places that close after midnight (e.g., 10:00 PM - 2:00 AM)
  return nowMinutes >= open || nowMinutes <= close;
}

export function estimateRating(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const min = 3.2;
  const max = 4.9;
  const normalized = ((hash % 100) + 100) % 100 / 100;
  return Math.round((min + (max - min) * normalized) * 10) / 10;
}
