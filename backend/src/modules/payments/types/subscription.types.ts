// ==============================================================================
// Agent Subscription Types & Constants (Decisions #88, #89, #103, #104, #105)
// ==============================================================================

export type SubscriptionPlanName = "FREE" | "PRO" | "ENTERPRISE";
export type SubscriptionPeriodKindName = "NEW" | "RENEWAL" | "UPGRADE" | "DOWNGRADE";
export type SubscriptionPeriodStatusName = "SCHEDULED" | "ACTIVE" | "ENDED" | "SUPERSEDED";
export type SubscriptionPaymentStatusName = "PENDING" | "PROCESSING" | "SUCCEEDED" | "EXPIRED" | "CANCELLED";

export interface PlanConfig {
  plan: SubscriptionPlanName;
  quota: number; // New publications per Cairo calendar month (#80, #88)
  basePriceUsd: number; // USD canonical price (#89)
  baseAmountCents: number; // BigInt minor units (US cents)
  fxRate: number; // Fixed 48.98 (#103)
  chargedPriceEgp: number; // 980 or 2,449 EGP
  chargedAmountPiastres: number; // BigInt minor units (piastres)
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanName, PlanConfig> = {
  FREE: {
    plan: "FREE",
    quota: 2,
    basePriceUsd: 0,
    baseAmountCents: 0,
    fxRate: 48.98,
    chargedPriceEgp: 0,
    chargedAmountPiastres: 0,
  },
  PRO: {
    plan: "PRO",
    quota: 4,
    basePriceUsd: 20,
    baseAmountCents: 2000,
    fxRate: 48.98,
    chargedPriceEgp: 980,
    chargedAmountPiastres: 98000,
  },
  ENTERPRISE: {
    plan: "ENTERPRISE",
    quota: 8,
    basePriceUsd: 50,
    baseAmountCents: 5000,
    fxRate: 48.98,
    chargedPriceEgp: 2449,
    chargedAmountPiastres: 244900,
  },
};

export const CHECKOUT_LIFETIME_MS = 60 * 60 * 1000; // 60 minutes (#105)
export const SUBSCRIPTION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 720 hours / 30 full days (#104)
export const RENEWAL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // Last 7 days of period (#104)

/**
 * Returns UTC range corresponding to the current Cairo calendar month (Africa/Cairo)
 * per Decision #88 and #104.
 */
export function getCairoMonthRange(now = new Date()): { start: Date; end: Date; resetDate: Date } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const month = parseInt(parts.find((p) => p.type === "month")!.value, 10);

  const startCairoIso = `${year}-${String(month).padStart(2, "0")}-01T00:00:00`;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const resetCairoIso = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00`;

  const getUtcDateFromCairo = (iso: string): Date => {
    const rough = new Date(`${iso}Z`);
    const cairoDateStr = rough.toLocaleString("en-US", { timeZone: "Africa/Cairo" });
    const cairoDate = new Date(cairoDateStr);
    const diffMs = cairoDate.getTime() - rough.getTime();
    return new Date(rough.getTime() - diffMs);
  };

  const start = getUtcDateFromCairo(startCairoIso);
  const resetDate = getUtcDateFromCairo(resetCairoIso);
  const end = new Date(resetDate.getTime() - 1);

  return { start, end, resetDate };
}
