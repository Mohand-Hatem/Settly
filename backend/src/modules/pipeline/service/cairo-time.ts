/**
 * Africa/Cairo wall-clock helpers (BUSINESS_RULES §3.2): availability is authored in local time and
 * resolved to UTC instants per date, so the Egyptian DST change never shifts a booking.
 * Built on Intl only — no timezone dependency.
 */
export const CAIRO_TZ = "Africa/Cairo";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAIRO_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function cairoParts(instant: Date): Parts {
  const out: Record<string, number> = {};
  for (const p of formatter.formatToParts(instant)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year!,
    month: out.month!,
    day: out.day!,
    hour: out.hour!,
    minute: out.minute!,
    second: out.second!,
  };
}

function offsetMs(instant: Date): number {
  const p = cairoParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** "YYYY-MM-DD" of the instant in Cairo. */
export function cairoDate(instant: Date): string {
  const p = cairoParts(instant);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Calendar weekday of a "YYYY-MM-DD" date: 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}

/** Minutes since midnight for "HH:MM". */
export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

export function timeOf(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Converts a Cairo wall-clock date + time to a UTC instant. Returns null for a local time that does
 * not exist (skipped by the spring-forward DST change).
 */
export function cairoToUtc(date: string, time: string): Date | null {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, h!, mi!);
  let utc = guess - offsetMs(new Date(guess));
  utc = guess - offsetMs(new Date(utc));
  const back = cairoParts(new Date(utc));
  if (back.day !== d || back.hour !== h || back.minute !== mi) return null;
  return new Date(utc);
}
