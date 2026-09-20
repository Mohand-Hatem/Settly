/** Display helpers: every viewing time is shown in Cairo time (BUSINESS_RULES §3.2). */
const TZ = "Africa/Cairo";

const dateKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const longDayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

/** "YYYY-MM-DD" in Cairo — used to group slots by local day. */
export const cairoDateKey = (iso: string) => dateKeyFmt.format(new Date(iso));
export const cairoDay = (iso: string) => dayFmt.format(new Date(iso));
export const cairoLongDay = (iso: string) => longDayFmt.format(new Date(iso));
export const cairoTime = (iso: string) => timeFmt.format(new Date(iso));
export const cairoRange = (startIso: string, endIso: string) => `${cairoTime(startIso)}–${cairoTime(endIso)}`;
