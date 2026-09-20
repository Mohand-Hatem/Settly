/**
 * The API returns every price in EGP piastres as a stringified BigInt
 * (PropertyResponse.price, CompareItem.price). Convert once, here, and never guess the unit.
 */
export function piastresToEgp(piastres: string | null | undefined): number {
  if (!piastres) return 0;
  try {
    return Number(BigInt(piastres) / 100n);
  } catch {
    return 0;
  }
}

export type Currency = "EGP" | "USD" | "EUR" | "AED";

/** EGP per unit of foreign currency. */
export interface FxRates {
  USD: number;
  EUR: number;
  AED?: number;
}

export function formatMoney(egp: number, currency: Currency, fx: FxRates): string {
  if (!Number.isFinite(egp)) return "N/A";
  if (currency === "USD") return `$${Math.round(egp / fx.USD).toLocaleString("en-US")}`;
  if (currency === "EUR") return `€${Math.round(egp / fx.EUR).toLocaleString("en-US")}`;
  if (currency === "AED") {
    const aedRate = fx.AED || (fx.USD / 3.6725);
    return `${Math.round(egp / aedRate).toLocaleString("en-US")} AED`;
  }
  return `${Math.round(egp).toLocaleString("en-US")} EGP`;
}

export function formatEGP(egp: number): string {
  if (!Number.isFinite(egp)) return "N/A";
  return `${Math.round(egp).toLocaleString("en-US")} EGP`;
}


