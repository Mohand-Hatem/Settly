"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Clock,
  HandCoins,
  ArrowRight,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import type { Viewing } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { agentViewingsQuery, availabilityQuery } from "@/lib/query/pipeline";
import { agentOffersQuery } from "@/lib/query/offers";
import { ListSkeleton, ViewingCard } from "@/components/viewings/ViewingParts";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Agent dashboard — Navy & Brass candidate operational desk.
 * Features operational command bar, 4-metric executive telemetry ribbon,
 * availability status guard, viewing request queue, and purchase offers tracker.
 */
export default function AgentDashboardPage() {
  const pending = useInfiniteQuery(agentViewingsQuery("pending"));
  const upcoming = useInfiniteQuery(agentViewingsQuery("upcoming"));
  const liveOffers = useInfiniteQuery(agentOffersQuery("live"));
  const availability = useQuery(availabilityQuery());
  const [open, setOpen] = useState<Viewing | null>(null);

  const requests = pending.data?.pages[0]?.items ?? [];
  const next = upcoming.data?.pages[0]?.items.slice(0, 5) ?? [];
  const upcomingCount = upcoming.data?.pages.flatMap((p) => p.items).length ?? 0;
  const offersCount = liveOffers.data?.pages.flatMap((p) => p.items).length ?? 0;
  const noAvailability = availability.data && availability.data.windows.length === 0;
  const windowsCount = availability.data?.windows.length ?? 0;

  return (
    <div className="portal-content">
      {/* Operational Command Bar */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Agent Command Desk</h1>
          <p>
            Client viewings, tour requests, and purchase negotiation pipeline
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link href="/agent/offers" className="btn-portal-outline">
            <HandCoins className="h-4 w-4 text-brass-600" aria-hidden="true" />
            <span>Offers Desk</span>
          </Link>
          <Link href="/agent/calendar" className="btn-portal-brass">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            <span>Viewing Calendar</span>
          </Link>
        </div>
      </section>

      {/* Availability Status Guard (shown when agent has not configured viewing hours) */}
      {noAvailability && (
        <section className="action-center" role="region" aria-label="Availability Warning">
          <div className="action-center-left">
            <div className="action-center-icon bg-amber-100 border-amber-300">
              <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span>Viewing Availability Not Established</span>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-800">
                  ACTION REQUIRED
                </span>
              </div>
              <p className="action-center-desc">
                Buyers cannot request appointments on your listings until weekly availability slots are configured. Set your recurring schedule to accept tours.
              </p>
            </div>
          </div>
          <div className="action-center-actions">
            <Link
              href="/agent/calendar?tab=availability"
              className="btn-portal-primary text-xs"
            >
              <span>Set Availability Hours</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {/* 4-Metric Executive Telemetry Ribbon */}
      <section className="telemetry-grid" aria-label="Operational Telemetry">
        {/* Metric 1: Viewing Requests Awaiting Response */}
        <Link href="/agent/calendar?tab=pending" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Awaiting You</span>
            <span
              className={`metric-badge-tag ${
                requests.length > 0 ? "brass" : ""
              }`}
            >
              {requests.length > 0 ? "ACTION REQUIRED" : "CLEAR"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {pending.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : requests.length}
              {pending.hasNextPage ? "+" : ""}
            </span>
            <span className="font-mono text-xs text-ink-3">requests</span>
          </div>
          <div className="metric-footnote-txt">
            <Clock className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
            <span>Tour requests requiring confirmation or counter</span>
          </div>
        </Link>

        {/* Metric 2: Confirmed Viewings */}
        <Link href="/agent/calendar?tab=upcoming" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Confirmed Tours</span>
            <span className={`metric-badge-tag ${upcomingCount > 0 ? "sage" : ""}`}>
              {upcomingCount > 0 ? "SCHEDULED" : "IDLE"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {upcoming.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : upcomingCount}
            </span>
            <span className="font-mono text-xs text-ink-3">upcoming</span>
          </div>
          <div className="metric-footnote-txt">
            <CalendarDays className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
            <span>Confirmed buyer property walkthroughs</span>
          </div>
        </Link>

        {/* Metric 3: Incoming Purchase Offers */}
        <Link href="/agent/offers" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Incoming Offers</span>
            <span className={`metric-badge-tag ${offersCount > 0 ? "brass" : ""}`}>
              {offersCount > 0 ? `${offersCount} LIVE` : "NONE"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {liveOffers.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : offersCount}
            </span>
            <span className="font-mono text-xs text-ink-3">active</span>
          </div>
          <div className="metric-footnote-txt">
            <HandCoins className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
            <span>Purchase proposals submitted by verified buyers</span>
          </div>
        </Link>

        {/* Metric 4: Calendar Availability Status */}
        <Link href="/agent/calendar?tab=availability" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Availability</span>
            <span className={`metric-badge-tag ${noAvailability ? "brass" : "sage"}`}>
              {noAvailability ? "SETUP NEEDED" : "ACTIVE"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {availability.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : `${windowsCount} Slots`}
            </span>
          </div>
          <div className="metric-footnote-txt">
            <ShieldCheck className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
            <span>Weekly recurring viewing hours</span>
          </div>
        </Link>
      </section>

      {/* Main Grid: Viewing Requests & Calendar (2/3) + Operations Suite (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Tour Requests + Confirmed Tours */}
        <div className="space-y-6 lg:col-span-2">
          {/* Requests Awaiting You Section */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-settly">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-brass">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-navy-900">
                      Requests Awaiting Your Response
                    </h2>
                    {requests.length > 0 && (
                      <span className="rounded-full bg-brass-050 px-2 py-0.5 font-mono text-[11px] font-bold text-brass-600">
                        {requests.length}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-3">
                    Buyers waiting for appointment confirmation or alternate time proposals
                  </p>
                </div>
              </div>
              <Link
                href="/agent/calendar?tab=pending"
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 transition-colors hover:text-brass-600"
              >
                <span>All requests</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {pending.isPending ? (
                <ListSkeleton rows={2} />
              ) : pending.isError ? (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {problemMessage(pending.error)}
                </p>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-2 bg-canvas p-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-sage" aria-hidden="true" />
                  <h3 className="mt-2 font-display text-base font-semibold text-navy-900">
                    Queue is All Caught Up
                  </h3>
                  <p className="mt-1 text-xs text-ink-2">
                    No pending viewing requests waiting for your action.
                  </p>
                </div>
              ) : (
                requests
                  .slice(0, 5)
                  .map((v) => (
                    <ViewingCard
                      key={v.id}
                      viewing={v}
                      view="agent"
                      onOpen={() => setOpen(v)}
                    />
                  ))
              )}
            </div>
          </section>

          {/* Upcoming Confirmed Tours Section */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-settly">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-brass">
                  <CalendarClock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-navy-900">
                    Upcoming Confirmed Tours
                  </h2>
                  <p className="text-xs text-ink-3">
                    Scheduled on-site appointments with prospective buyers
                  </p>
                </div>
              </div>
              <Link
                href="/agent/calendar?tab=upcoming"
                className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 transition-colors hover:text-brass-600"
              >
                <span>Full calendar</span>
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
                  <CalendarDays className="h-8 w-8 text-ink-3" aria-hidden="true" />
                  <h3 className="mt-2 font-display text-base font-semibold text-navy-900">
                    No Confirmed Tours Scheduled
                  </h3>
                  <p className="mt-1 text-xs text-ink-2">
                    Confirmed client viewing sessions will be listed here.
                  </p>
                </div>
              ) : (
                next.map((v) => (
                  <ViewingCard
                    key={v.id}
                    viewing={v}
                    view="agent"
                    onOpen={() => setOpen(v)}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right 1 Col: Operational Suite Shortcuts & Guidelines */}
        <div className="space-y-6">
          {/* Purchase Offers Portal Box */}
          <section className="rounded-2xl border border-line bg-white p-5 shadow-settly">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-brass-600" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-navy-900">
                  Incoming Offers
                </h3>
              </div>
              <span className="rounded-full bg-brass-050 px-2 py-0.5 font-mono text-xs font-bold text-brass-600">
                {liveOffers.isPending ? "…" : offersCount}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink-2">
              Review, accept, or counter purchase offers submitted by verified prospective buyers across your listings.
            </p>
            <div className="mt-4">
              <Link
                href="/agent/offers"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
              >
                <span>Open Offers Desk</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Quick Operations Links */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-settly">
            <h3 className="font-display text-base font-bold text-navy-900">
              Agent Operations
            </h3>
            <p className="mt-0.5 text-xs text-ink-3">
              Tools and account credentials
            </p>

            <nav className="mt-4 flex flex-col gap-2" aria-label="Agent Operations Shortcuts">
              <Link
                href="/agent/calendar?tab=availability"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarClock className="h-4 w-4 text-brass-600" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Manage Availability</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              </Link>

              <Link
                href="/agent/calendar"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="h-4 w-4 text-navy-900" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Appointment Schedule</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              </Link>

              <Link
                href="/agent/settings"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-sage" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Account & Security</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              </Link>
            </nav>
          </div>

          {/* Settly Agent Standards Card */}
          <div className="rounded-2xl border border-line bg-navy-900 p-5 text-white shadow-settly">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brass" aria-hidden="true" />
              <h3 className="font-display text-base font-bold">Settly Broker Standards</h3>
            </div>
            <p className="mt-1 text-xs text-white/70">
              Licensed Egyptian real estate advisory protocol
            </p>
            <ul className="mt-3 space-y-2 text-xs text-white/80">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brass shrink-0" />
                <span>Private contact info is kept confidential until viewings are confirmed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brass shrink-0" />
                <span>Respond to viewing requests within 24 hours to preserve broker ranking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brass shrink-0" />
                <span>All purchase offers are timestamped with Cairo time (EET).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ViewingDrawer viewing={open} view="agent" onClose={() => setOpen(null)} />
    </div>
  );
}
