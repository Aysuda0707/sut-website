/**
 * Formatting helpers for Persian content.
 */

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/** Convert Western digits in a string to Persian digits. */
export function toPersianDigits(input: string | number): string {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/\d/g, (d) => map[Number(d)]);
}

/**
 * Format an ISO date (Gregorian) as a readable Persian date.
 * Uses the Gregorian calendar but Persian month names are NOT applied here;
 * instead we show a Jalali date via Intl when available.
 */
export function formatPersianDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return toPersianDigits(iso);
  }
}

/** Format a duration in seconds as mm:ss (Persian digits). */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "۰:۰۰";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return toPersianDigits(`${m}:${s.toString().padStart(2, "0")}`);
}

/** Format a year (e.g. 1403) with Persian digits. */
export function formatYear(year: number): string {
  return toPersianDigits(year);
}

export { PERSIAN_MONTHS };
