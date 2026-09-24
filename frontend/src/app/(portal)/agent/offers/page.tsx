"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { HandCoins, ShieldCheck, Scale, AlertCircle, Compass, CheckCircle2 } from "lucide-react";
import type { Offer, OfferScope } from "@/api/offers";
import { problemMessage } from "@/api/errors";
import { agentOffersQuery } from "@/lib/query/offers";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OfferCard, OfferListSkeleton } from "@/components/offers/OfferParts";
import { OfferDrawer } from "@/components/offers/OfferDrawer";

const TABS: { key: OfferScope; label: string; empty: string }[] = [
  { key: "live", label: "Active Proposals", empty: "No active purchase proposals currently under review." },
  { key: "terminal", label: "Closed & Settled", empty: "No past or closed offers found in your portfolio archive." },
];

function AgentOffersContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "live") as OfferScope;

  const liveQuery = useInfiniteQuery(agentOffersQuery("live"));
  const terminalQuery = useInfiniteQuery(agentOffersQuery("terminal"));

  const activeQuery = tab === "live" ? liveQuery : terminalQuery;
  const [open, setOpen] = useState<Offer | null>(null);

  const items = activeQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const liveCount = liveQuery.data?.pages[0]?.items.length ?? 0;
  const terminalCount = terminalQuery.data?.pages[0]?.items.length ?? 0;

  return (
    <div className="portal-content max-w-[1440px]">
      {/* Command Header */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Purchase Proposals &amp; Offer Review</h1>
          <p>
            Review incoming buyer acquisition offers, issue binding counter-proposals, and monitor escrow deposits.
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link
            href="/agent/listings"
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-navy-800"
          >
            <Compass className="h-4 w-4 text-brass" />
            <span>My Listings</span>
          </Link>
        </div>
      </section>

      {/* 4-Metric Telemetry KPI Ribbon */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Offer Telemetry">
        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Active Proposals</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-brass-600">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{liveCount}</span>
            <span className="text-xs text-ink-3">Live</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Awaiting decision or counter-offer</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Closed Deals</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-sage">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{terminalCount}</span>
            <span className="text-xs text-ink-3">Settled</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Concluded or archived negotiations</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Escrow Protocol</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-brass-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-base font-bold text-navy-900">Paymob Sandbox</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Statutory deposit hold enabled</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Governance Invariant</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-navy-800">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-base font-bold text-navy-900">Conflict Guard</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">No concurrent conflicting deposits</p>
        </div>
      </section>

      {/* Tabs Row */}
      <div className="border-b border-line">
        <div role="tablist" aria-label="Offer status" className="flex gap-2">
          {TABS.map((t) => {
            const count = t.key === "live" ? liveCount : terminalCount;
            const isSelected = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => router.replace(`${pathname}?tab=${t.key}`)}
                className={`relative flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-semibold transition ${
                  isSelected
                    ? "border-brass text-navy-900 font-bold"
                    : "border-transparent text-ink-3 hover:text-navy-900"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                    isSelected ? "bg-navy-900 text-white" : "bg-canvas-2 text-ink-3"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content List / Empty State */}
      <div role="tabpanel" className="space-y-4">
        {activeQuery.isPending ? (
          <OfferListSkeleton />
        ) : activeQuery.isError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-xs text-red-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-red-800">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Failed to load incoming offers</span>
            </div>
            <p>{problemMessage(activeQuery.error)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => activeQuery.refetch()}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-12 text-center">
            <EmptyState
              icon={<HandCoins className="h-8 w-8 text-brass-600" />}
              title={TABS.find((t) => t.key === tab)!.empty}
              description="When verified buyers submit purchase proposals on your exclusive listing mandates, they will appear here."
              action={
                <Link
                  href="/agent/listings"
                  className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800"
                >
                  <Compass className="h-4 w-4 text-brass" />
                  <span>Review Active Listings</span>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                view="agent"
                onOpen={() => setOpen(offer)}
              />
            ))}
            {activeQuery.hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  isLoading={activeQuery.isFetchingNextPage}
                  onClick={() => activeQuery.fetchNextPage()}
                  className="text-xs"
                >
                  Load More Offers
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <OfferDrawer offer={open} view="agent" onClose={() => setOpen(null)} />
    </div>
  );
}

export default function AgentOffersPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-content max-w-[1440px]">
          <OfferListSkeleton />
        </div>
      }
    >
      <AgentOffersContent />
    </Suspense>
  );
}
