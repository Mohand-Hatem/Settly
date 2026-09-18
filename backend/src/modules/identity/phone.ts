/**
 * Phone number normalisation (#53, #60): international numbers are allowed and stored in E.164.
 * Numbers are collected, not verified (#53). Egyptian local numbers (01XXXXXXXXX) are accepted and
 * converted to +20.
 */
const E164 = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let value = raw.replace(/[\s\-().]/g, "");
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  if (/^01\d{9}$/.test(value)) value = `+2${value}`;
  return E164.test(value) ? value : null;
}
