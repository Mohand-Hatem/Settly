"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  AlertCircle,
  Crown,
  Sparkles,
} from "lucide-react";
import {
  agentSubscriptionQuery,
  useSubscriptionCheckoutMutation,
  useCancelSubscriptionMutation,
} from "@/lib/query/subscription";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { problemMessage } from "@/api/errors";

const PLAN_SPECS = {
  FREE: {
    name: "Free Starter",
    priceEgp: 0,
    priceNote: "Free forever",
    quota: 3,
    badge: "STANDARD",
    description: "Ideal for individual licensed brokers beginning on the Settly Egyptian marketplace.",
    features: [
      "3 active verified listings per Cairo calendar month",
      "Standard moderation queue (< 24h SLA)",
      "Direct buyer viewing requests & scheduling",
      "FRA-regulated legal document templates",
      "Full analytics & viewing itinerary dashboard",
    ],
  },
  PRO: {
    name: "Pro Broker",
    priceEgp: 980,
    priceNote: "980 EGP / month (~$20 USD CBE rate)",
    quota: 15,
    badge: "MOST POPULAR",
    description: "Designed for high-performing residential agents and boutique agencies across Cairo & Giza.",
    features: [
      "15 active verified listings per Cairo calendar month",
      "Priority compliance & moderation queue (< 4h SLA)",
      "Featured listing badges & search placement boost",
      "SMS & WhatsApp viewing notifications to buyers",
      "Direct buyer conveyance room & negotiation diff",
      "5 concurrent purchase offers per listing support",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise Agency",
    priceEgp: 2449,
    priceNote: "2,449 EGP / month (~$50 USD CBE rate)",
    quota: 50,
    badge: "FULL CAPACITY",
    description: "For major brokerage firms, developers, and asset managers managing multiple developments.",
    features: [
      "50 active verified listings per Cairo calendar month",
      "Instant automated moderation for accredited feeds",
      "Top-tier catalog gateway & homepage placement",
      "Dedicated Settly senior relationship advisor",
      "Cadastral batch upload & API listing synchronization",
      "Exclusive off-plan project showcase dossier",
    ],
  },
} as const;

type PlanKey = keyof typeof PLAN_SPECS;

export default function AgentSubscriptionPage() {
  const [selectedPlanToCheckout, setSelectedPlanToCheckout] = useState<"PRO" | "ENTERPRISE" | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const query = useQuery(agentSubscriptionQuery());
  const checkoutMutation = useSubscriptionCheckoutMutation();
  const cancelMutation = useCancelSubscriptionMutation();

  const sub = query.data;
  const currentPlan: PlanKey = (sub?.plan as PlanKey) || "FREE";

  const handleCheckout = async (plan: "PRO" | "ENTERPRISE") => {
    setSelectedPlanToCheckout(plan);
    try {
      const res = await checkoutMutation.mutateAsync({
        body: {
          plan,
          returnUrl: typeof window !== "undefined" ? `${window.location.origin}/agent/subscription?status=success` : undefined,
        },
      });

      if (res.checkoutUrl) {
        toast.success(`Redirecting to Paymob secure checkout for ${PLAN_SPECS[plan].name}...`);
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Checkout URL was not returned by payment gateway.");
      }
    } catch (err: unknown) {
      toast.error(problemMessage(err) || "Failed to initiate subscription checkout.");
    } finally {
      setSelectedPlanToCheckout(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelMutation.mutateAsync();
      toast.success("Subscription renewal cancelled. Your active plan remains active until the end of the billing period.");
      setShowCancelModal(false);
      query.refetch();
    } catch (err: unknown) {
      toast.error(problemMessage(err) || "Failed to cancel subscription.");
    }
  };

  // Quota calculation
  const used = sub?.quota?.used ?? 0;
  const total = sub?.quota?.total ?? 3;
  const remaining = sub?.quota?.remaining ?? Math.max(0, total - used);
  const waitingCount = sub?.quota?.waitingCount ?? 0;
  const percentUsed = Math.min(100, Math.round((used / total) * 100));

  const resetFormatted = sub?.quota?.resetDate
    ? new Date(sub.quota.resetDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "1st of next Cairo month";

  return (
    <div className="portal-content max-w-[1540px] space-y-8">
      {/* Welcome Command Bar */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-brass-600" aria-hidden="true" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
              Subscription &amp; Listing Quota Cockpit
            </h1>
          </div>
          <p className="text-xs text-ink-3 mt-1">
            Cairo calendar-month listing capacity, verified tiers, and Paymob Egyptian payment rails (`SUB-01` → `SUB-12`, Decisions #89, #103).
          </p>
        </div>
        <div className="welcome-actions-row flex flex-row items-center gap-2.5">
          <Link href="/agent/listings" className="btn-portal-outline inline-flex flex-row items-center gap-1.5 whitespace-nowrap">
            <Building2 className="h-4 w-4 text-brass-600" aria-hidden="true" />
            <span>Manage Listings</span>
          </Link>
          <a
            href="#plans-grid"
            className="btn-portal-brass inline-flex flex-row items-center gap-1.5 whitespace-nowrap"
          >
            <Crown className="h-4 w-4" aria-hidden="true" />
            <span>Upgrade Capacity</span>
          </a>
        </div>
      </section>

      {/* 4-Card Telemetry Ribbon */}
      <section className="telemetry-grid" aria-label="Subscription Telemetry">
        {/* Card 1: Active Tier */}
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Active Plan Tier</span>
            <span className={`metric-badge-tag ${currentPlan !== "FREE" ? "brass" : ""}`}>
              {sub ? PLAN_SPECS[currentPlan]?.badge || currentPlan : "SYNCING"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val font-display text-2xl font-bold text-navy-900">
              {query.isPending ? <Skeleton className="h-8 w-24 rounded" /> : PLAN_SPECS[currentPlan]?.name}
            </span>
          </div>
          <div className="metric-footnote-txt">
            <ShieldCheck className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
            <span>Accredited Egyptian Syndicate Broker</span>
          </div>
        </div>

        {/* Card 2: Quota Consumption */}
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Monthly Listing Quota</span>
            <span className={`metric-badge-tag ${percentUsed >= 80 ? "brass" : "sage"}`}>
              {percentUsed}% USED
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val font-mono">
              {query.isPending ? <Skeleton className="h-8 w-16 rounded" /> : `${used} / ${total}`}
            </span>
            <span className="font-mono text-xs text-ink-3">active slots</span>
          </div>
          <div className="w-full bg-line-2 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed >= 100
                  ? "bg-red-500"
                  : percentUsed >= 80
                  ? "bg-brass-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="metric-footnote-txt">
            <span>{remaining} slots remaining this period</span>
          </div>
        </div>

        {/* Card 3: Waiting for Quota Queue */}
        <Link href="/agent/listings" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Waiting for Quota</span>
            <span className={`metric-badge-tag ${waitingCount > 0 ? "brass" : ""}`}>
              {waitingCount > 0 ? "FIFO QUEUE" : "CLEAR"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val font-mono">
              {query.isPending ? <Skeleton className="h-8 w-10 rounded" /> : waitingCount}
            </span>
            <span className="font-mono text-xs text-ink-3">approved listings</span>
          </div>
          <div className="metric-footnote-txt">
            <Clock className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
            <span>Activates on next calendar month</span>
          </div>
        </Link>

        {/* Card 4: Next Reset Date */}
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Cairo Quota Reset</span>
            <span className="metric-badge-tag sage">00:00 EET</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base font-bold text-navy-900 truncate">
              {query.isPending ? <Skeleton className="h-7 w-28 rounded" /> : resetFormatted}
            </span>
          </div>
          <div className="metric-footnote-txt">
            <Calendar className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
            <span>Monthly quota auto-renews</span>
          </div>
        </div>
      </section>

      {/* Waiting for Quota Warning Banner (AGT-02 / SUB-09) */}
      {waitingCount > 0 && (
        <section className="action-center bg-[#FAF8F4] border-2 border-brass-600/30" role="region" aria-label="Quota Limit Warning">
          <div className="action-center-left">
            <div className="action-center-icon bg-brass text-navy-950">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span className="font-display font-bold text-navy-900">
                  {waitingCount} Listing{waitingCount > 1 ? "s" : ""} Waiting for Next Month&apos;s Quota
                </span>
                <span className="inline-flex items-center rounded-full bg-brass-050 text-brass-700 px-2 py-0.5 text-[11px] font-mono font-bold">
                  FIFO QUEUE ACTIVE
                </span>
              </div>
              <p className="action-center-desc">
                Your monthly allowance of {total} active listings has been reached. Listings approved by compliance are safely queued in FIFO order (Decision #87) and will automatically activate on {resetFormatted} at 00:00 EET. Or upgrade to Pro / Enterprise for immediate listing slots.
              </p>
            </div>
          </div>
          <div className="action-center-actions flex flex-row items-center">
            <a
              href="#plans-grid"
              className="btn-portal-primary font-bold text-xs inline-flex flex-row items-center gap-2 whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 text-brass" aria-hidden="true" />
              <span>Upgrade Capacity Immediately</span>
            </a>
          </div>
        </section>
      )}

      {/* Current Active Plan Status Dossier (Navy & Brass Reference Design) */}
      <section className="rounded-2xl border border-brass/40 bg-gradient-to-br from-navy-900 via-navy-850 to-navy-950 p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brass via-emerald-400 to-brass" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brass uppercase tracking-wider">
                Current Operational Subscription
              </span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold">
                ACTIVE
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              {PLAN_SPECS[currentPlan]?.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {currentPlan !== "FREE" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                className="border-white/20 text-white/80 hover:bg-white/10 text-xs"
              >
                Cancel Renewal
              </Button>
            ) : null}
            <a
              href="#plans-grid"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brass px-3.5 py-2 text-xs font-bold text-navy-950 transition hover:bg-brass-light"
            >
              <span>Explore All Tiers</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-5 text-xs">
          <div>
            <span className="font-mono text-white/50 block mb-0.5">Monthly Allowance:</span>
            <span className="font-mono text-base font-bold text-brass-200">
              {PLAN_SPECS[currentPlan]?.quota} verified listings
            </span>
          </div>
          <div>
            <span className="font-mono text-white/50 block mb-0.5">Billing Investment:</span>
            <span className="font-mono text-base font-bold text-white">
              {PLAN_SPECS[currentPlan]?.priceEgp === 0
                ? "0 EGP (Free Tier)"
                : `${PLAN_SPECS[currentPlan]?.priceEgp.toLocaleString()} EGP / mo`}
            </span>
          </div>
          <div>
            <span className="font-mono text-white/50 block mb-0.5">Quota Reset Cycle:</span>
            <span className="font-semibold text-white">
              Cairo Calendar Month (Decision #103)
            </span>
          </div>
          <div>
            <span className="font-mono text-white/50 block mb-0.5">Payment Rail:</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-brass" />
              Paymob Egyptian Gateway
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-white/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brass shrink-0" />
            <span>
              Egyptian Law #119 Real Estate compliance active. All listings verified before publication.
            </span>
          </div>
          <span className="font-mono text-[11px] text-brass">FRA SECURE</span>
        </div>
      </section>

      {/* 3-Tier Plan Comparison Matrix (SUB-01 → SUB-06) */}
      <section id="plans-grid" className="space-y-6 pt-2">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-display text-2xl font-bold text-navy-900 tracking-tight">
            Accredited Agent Subscription Tiers
          </h2>
          <p className="text-xs text-ink-3">
            Transparent pricing in Egyptian Pounds (EGP). Paymob hosted checkout accepts Meeza cards, Visa, Mastercard, and Fawry cash.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(PLAN_SPECS) as PlanKey[]).map((key) => {
            const plan = PLAN_SPECS[key];
            const isCurrent = currentPlan === key;
            const isPro = key === "PRO";

            return (
              <div
                key={key}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                  isCurrent
                    ? "border-2 border-brass bg-white shadow-lg ring-1 ring-brass/30"
                    : isPro
                    ? "border-2 border-navy-900 bg-white shadow-md hover:shadow-xl"
                    : "border-line bg-white shadow-sm hover:border-line-2"
                }`}
              >
                {/* Popular / Active Badge */}
                {isCurrent ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brass px-3 py-0.5 font-mono text-[10px] font-bold text-navy-950 uppercase shadow-sm">
                    Current Active Tier
                  </div>
                ) : isPro ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy-900 px-3 py-0.5 font-mono text-[10px] font-bold text-white uppercase shadow-sm">
                    Recommended For Brokers
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-navy-900">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-ink-3 mt-1 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="border-y border-line py-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-3xl font-extrabold text-navy-900">
                        {plan.priceEgp === 0 ? "0" : plan.priceEgp.toLocaleString()}
                      </span>
                      <span className="font-mono text-xs font-bold text-ink-3">EGP</span>
                      <span className="text-xs text-ink-4">/ month</span>
                    </div>
                    <span className="font-mono text-[11px] text-ink-4 block mt-0.5">
                      {plan.priceNote}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <span className="font-mono text-[11px] font-bold text-navy-900 uppercase tracking-wider block">
                      Plan Inclusions:
                    </span>
                    <ul className="space-y-2 text-xs text-ink-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-line">
                  {isCurrent ? (
                    <Button
                      disabled
                      className="w-full bg-canvas text-navy-900 border border-line font-semibold text-xs py-2.5 cursor-default inline-flex flex-row items-center justify-center gap-2"
                    >
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Current Plan</span>
                    </Button>
                  ) : key === "FREE" ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelModal(true)}
                      className="w-full text-xs py-2.5 text-ink-2 hover:bg-canvas inline-flex flex-row items-center justify-center gap-2"
                    >
                      <span>Downgrade to Free</span>
                    </Button>
                  ) : (
                    <Button
                      isLoading={checkoutMutation.isPending && selectedPlanToCheckout === key}
                      onClick={() => handleCheckout(key)}
                      className={`w-full text-xs font-bold py-2.5 shadow-sm inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap ${
                        isPro
                          ? "bg-navy-900 hover:bg-navy-850 text-white"
                          : "bg-brass hover:bg-brass-light text-navy-950"
                      }`}
                    >
                      <Zap className="h-4 w-4 shrink-0" />
                      <span>Upgrade to {plan.name}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cairo Calendar-Month Quota Rules & FAQ (Decisions #87, #89, #103) */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Clock className="h-5 w-5 text-brass-600" />
          <h3 className="font-display text-base font-bold text-navy-900">
            How Cairo Listing Quota Works (Egyptian Real Estate Standard)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-ink-2">
          <div className="space-y-1.5">
            <h4 className="font-bold text-navy-900 flex items-center gap-1.5">
              <span>1. Calendar-Month Reset</span>
            </h4>
            <p className="leading-relaxed text-ink-3">
              Per Decision #103, quotas reset on the <strong>1st of every calendar month at 00:00 Africa/Cairo time (EET)</strong>, regardless of the day you subscribed. This ensures predictable market indexing and fair catalog rotation.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-navy-900 flex items-center gap-1.5">
              <span>2. FIFO Waiting Queue</span>
            </h4>
            <p className="leading-relaxed text-ink-3">
              When your monthly quota is exhausted, new listings reviewed and approved by compliance enter the <strong>FIFO queue</strong> (Decision #87). On the 1st of the next month, they automatically transition to <code>PUBLISHED</code> in chronological order.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-navy-900 flex items-center gap-1.5">
              <span>3. Paymob Payment Security</span>
            </h4>
            <p className="leading-relaxed text-ink-3">
              Subscription checkouts are processed via Paymob, Egypt&apos;s Central Bank-licensed payment provider. No card details touch Settly servers. Upgrades grant instantaneous quota slots upon successful payment.
            </p>
          </div>
        </div>
      </section>

      {/* Cancel Renewal Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-line">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="cancel-modal-title" className="font-display text-base font-bold text-navy-900">
                  Cancel Subscription Renewal?
                </h3>
                <span className="text-xs text-ink-3">
                  Current tier: {PLAN_SPECS[currentPlan]?.name}
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              Your subscription renewal will be canceled. Your current plan and its {PLAN_SPECS[currentPlan]?.quota} listing allowance will remain active until the end of the current billing cycle. When it ends, your account will revert to the <strong>Free Starter tier (3 listings)</strong>.
            </p>

            <div className="rounded-xl border border-line bg-canvas p-3 text-xs text-ink-3">
              <strong>Notice:</strong> Excess active listings above 3 will not be deleted, but no new listings can be published until your active count drops below the Free quota limit.
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
              >
                Keep My Plan
              </Button>
              <Button
                size="sm"
                isLoading={cancelMutation.isPending}
                onClick={handleCancelSubscription}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
