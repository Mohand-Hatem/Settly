"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  HandCoins,
  Search,
  ArrowRight,
  Clock,
  Compass,
  AlertCircle,
  Building2,
  CheckCircle2,
} from "lucide-react";
import type { Viewing } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { authClient } from "@/lib/auth-client";
import { myViewingsQuery } from "@/lib/query/pipeline";
import { myOffersQuery } from "@/lib/query/offers";
import { ListSkeleton, ViewingCard } from "@/components/viewings/ViewingParts";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Buyer dashboard — Navy & Brass candidate design suite.
 * Features Spectral command bar, 4-metric telemetry ribbon with 5-dot offer capacity meter,
 * urgent action center, viewing pipeline tracker, and Egyptian market catalog gateway.
 */
export default function BuyerDashboardPage() {
  const { data: session } = authClient.useSession();
  const upcoming = useInfiniteQuery(myViewingsQuery("upcoming"));
  const pending = useInfiniteQuery(myViewingsQuery("pending"));
  const liveOffers = useInfiniteQuery(myOffersQuery("live"));
  const [open, setOpen] = useState<Viewing | null>(null);

  const next = upcoming.data?.pages[0]?.items.slice(0, 3) ?? [];
  const upcomingCount = upcoming.data?.pages.flatMap((p) => p.items).length ?? 0;
  const pendingCount = pending.data?.pages.flatMap((p) => p.items).length ?? 0;
  const liveOffersCount = liveOffers.data?.pages.flatMap((p) => p.items).length ?? 0;
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="portal-content">
      {/* Welcome Command Bar */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p>
            Portfolio & transaction command center · Verified Egypt real estate
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link href="/buyer/offers" className="btn-portal-outline">
            <HandCoins className="h-4 w-4 text-brass-600" aria-hidden="true" />
            <span>Active Offers</span>
          </Link>
          <Link href="/search" className="btn-portal-brass">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </section>

      {/* Urgent Action Center (shown when actions require buyer attention) */}
      {pendingCount > 0 && (
        <section className="action-center" role="region" aria-label="Action Center">
          <div className="action-center-left">
            <div className="action-center-icon">
              <Clock className="h-5 w-5 text-brass-600" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span>Pending Viewing Responses</span>
                <span className="inline-flex items-center rounded-full bg-brass-050 px-2 py-0.5 text-[11px] font-mono font-bold text-brass-600">
                  {pendingCount} AWAITING
                </span>
              </div>
              <p className="action-center-desc">
                You have {pendingCount} viewing request{pendingCount > 1 ? "s" : ""} waiting for agent confirmation.
              </p>
            </div>
          </div>
          <div className="action-center-actions">
            <Link href="/buyer/viewings?tab=pending" className="btn-portal-primary text-xs">
              <span>Review Requests</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {liveOffersCount >= 5 && (
        <section className="action-center" role="region" aria-label="Offer Limit Alert">
          <div className="action-center-left">
            <div className="action-center-icon">
              <AlertCircle className="h-5 w-5 text-brass-600" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span>Maximum Offer Capacity Reached (5 of 5)</span>
              </div>
              <p className="action-center-desc">
                Per Settly business rules, buyers can maintain up to 5 concurrent active offers. You cannot submit new offers until an existing one is completed, declined, or cancelled.
              </p>
            </div>
          </div>
          <div className="action-center-actions">
            <Link href="/buyer/offers" className="btn-portal-outline text-xs">
              <span>View Offers</span>
            </Link>
          </div>
        </section>
      )}

      {/* Telemetry 4-Card Executive Instrument Panel */}
      <section className="telemetry-grid" aria-label="Portfolio Telemetry">
        {/* Card 1: Live Offers with 5-dot capacity meter */}
        <Link href="/buyer/offers" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Live Offers</span>
            <span className={`metric-badge-tag ${liveOffersCount > 0 ? "brass" : ""}`}>
              {liveOffersCount > 0 ? "ACTIVE" : "IDLE"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {liveOffers.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : liveOffersCount}
            </span>
            <span className="font-mono text-xs text-ink-3">/ 5 max</span>
          </div>
          <div className="metric-capacity-meter" title={`${liveOffersCount} of 5 slots in use`}>
            {[0, 1, 2, 3, 4].map((slot) => (
              <span
                key={slot}
                className={`capacity-pip ${slot < liveOffersCount ? "active" : ""}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="metric-footnote-txt">
            <HandCoins className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
            <span>Active purchase negotiations & counters</span>
          </div>
        </Link>

        {/* Card 2: Upcoming Viewings */}
        <Link href="/buyer/viewings" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Upcoming Tours</span>
            <span className={`metric-badge-tag ${upcomingCount > 0 ? "sage" : ""}`}>
              {upcomingCount > 0 ? "CONFIRMED" : "CLEAR"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {upcoming.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : upcomingCount}
            </span>
            <span className="font-mono text-xs text-ink-3">scheduled</span>
          </div>
          <div className="metric-footnote-txt">
            <CalendarDays className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
            <span>
              {upcomingCount > 0 ? "Private verified on-site visits" : "No tours scheduled"}
            </span>
          </div>
        </Link>

        {/* Card 3: Pending Requests */}
        <Link href="/buyer/viewings?tab=pending" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Tour Requests</span>
            <span className={`metric-badge-tag ${pendingCount > 0 ? "brass" : ""}`}>
              {pendingCount > 0 ? `${pendingCount} PENDING` : "CLEAR"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {pending.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : pendingCount}
            </span>
            <span className="font-mono text-xs text-ink-3">awaiting</span>
          </div>
          <div className="metric-footnote-txt">
            <Clock className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
            <span>Awaiting agent schedule confirmation</span>
          </div>
        </Link>

        {/* Card 4: Explore Catalog */}
        <Link href="/search" className="metric-card bg-gradient-to-br from-white to-canvas">
          <div className="metric-card-header">
            <span className="metric-card-label">Egypt Catalog</span>
            <span className="metric-badge-tag sage">VERIFIED</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val text-navy-900">Explore</span>
            <ArrowRight className="h-4 w-4 text-brass-600 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
          <div className="metric-footnote-txt">
            <Compass className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
            <span>New Cairo, Zayed, North Coast & Red Sea</span>
          </div>
        </Link>
      </section>

      {/* Main Grid: Upcoming Viewings (2/3) + Quick Navigator & Egyptian Markets (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Viewings Column */}
        <section className="rounded-2xl border border-line bg-white p-6 shadow-settly lg:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-brass">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-navy-900">
                  Upcoming Property Tours
                </h2>
                <p className="text-xs text-ink-3">
                  Confirmed visits with verified licensed advisors
                </p>
              </div>
            </div>
            <Link
              href="/buyer/viewings"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 transition-colors hover:text-brass-600"
            >
              <span>View full schedule</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {upcoming.isPending ? (
              <ListSkeleton rows={2} />
            ) : upcoming.isError ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {problemMessage(upcoming.error)}
              </p>
            ) : next.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-2 bg-canvas p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-3 shadow-sm">
                  <CalendarDays className="h-6 w-6 text-brass-600" aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-display text-base font-semibold text-navy-900">
                  No Confirmed Viewings Yet
                </h3>
                <p className="mt-1 max-w-sm text-xs text-ink-2">
                  Explore verified listings across Greater Cairo and the coast, then request your private viewing window.
                </p>
                <Link
                  href="/search"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
                >
                  <Search className="h-3.5 w-3.5 text-brass" aria-hidden="true" />
                  <span>Browse Properties</span>
                </Link>
              </div>
            ) : (
              next.map((v) => (
                <ViewingCard
                  key={v.id}
                  viewing={v}
                  view="buyer"
                  onOpen={() => setOpen(v)}
                />
              ))
            )}
          </div>
        </section>

        {/* Quick Navigator & Prime Egypt Hotspots Column */}
        <div className="space-y-6">
          {/* Quick Navigator Card */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-settly">
            <h3 className="font-display text-base font-bold text-navy-900">
              Buyer Command Links
            </h3>
            <p className="mt-0.5 text-xs text-ink-3">
              Direct access to your transaction records
            </p>

            <nav className="mt-4 flex flex-col gap-2" aria-label="Buyer Shortcuts">
              <Link
                href="/buyer/offers"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <HandCoins className="h-4 w-4 text-brass-600" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Purchase Offers</span>
                </div>
                <span className="font-mono text-xs font-bold text-navy-900">
                  {liveOffersCount}
                </span>
              </Link>

              <Link
                href="/buyer/viewings?tab=pending"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-brass-600" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Pending Tour Requests</span>
                </div>
                <span className="font-mono text-xs font-bold text-navy-900">
                  {pendingCount}
                </span>
              </Link>

              <Link
                href="/buyer/settings"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sage" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Account & Security</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              </Link>
            </nav>
          </div>

          {/* Prime Egypt Destinations */}
          <div className="rounded-2xl border border-line bg-navy-900 p-5 text-white shadow-settly">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brass" aria-hidden="true" />
                <h3 className="font-display text-base font-bold">Egyptian Markets</h3>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-brass">
                VERIFIED
              </span>
            </div>
            <p className="mt-1 text-xs text-white/70">
              Direct filter into high-demand residential districts
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { name: "New Cairo", slug: "new-cairo" },
                { name: "Sheikh Zayed", slug: "sheikh-zayed" },
                { name: "North Coast", slug: "north-coast" },
                { name: "El Gouna", slug: "el-gouna" },
                { name: "New Capital", slug: "new-capital" },
              ].map((area) => (
                <Link
                  key={area.slug}
                  href={`/search?area=${area.slug}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/90 transition-colors hover:border-brass hover:bg-white/10"
                >
                  {area.name}
                </Link>
              ))}
            </div>

            <Link
              href="/search"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brass px-3 py-2 text-xs font-bold text-navy-950 transition-colors hover:bg-brass-light"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Explore All Listings</span>
            </Link>
          </div>
        </div>
      </div>

      <ViewingDrawer viewing={open} view="buyer" onClose={() => setOpen(null)} />
    </div>
  );
}
