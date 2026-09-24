"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Compass } from "lucide-react";
import type { Viewing, ViewingScope } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { myViewingsQuery } from "@/lib/query/pipeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ListSkeleton, ViewingCard } from "@/components/viewings/ViewingParts";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";

const TABS: { key: ViewingScope; label: string; empty: string }[] = [
  { key: "upcoming", label: "Upcoming Confirmed", empty: "No confirmed viewings scheduled yet." },
  { key: "pending", label: "Pending Confirmation", empty: "No viewing requests waiting for broker response." },
  { key: "past", label: "Completed & Historic", empty: "No past property inspections on record." },
];

/** Buyer viewings (spec S1-11, ADM-01/SH-02): Upcoming · Pending · Past, with rich telemetry ribbon. */
function BuyerViewingsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "upcoming") as ViewingScope;

  const upcomingQuery = useInfiniteQuery(myViewingsQuery("upcoming"));
  const pendingQuery = useInfiniteQuery(myViewingsQuery("pending"));
  const pastQuery = useInfiniteQuery(myViewingsQuery("past"));

  const activeQuery = tab === "upcoming" ? upcomingQuery : tab === "pending" ? pendingQuery : pastQuery;
  const [open, setOpen] = useState<Viewing | null>(null);

  const items = activeQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const upcomingCount = upcomingQuery.data?.pages[0]?.items.length ?? 0;
  const pendingCount = pendingQuery.data?.pages[0]?.items.length ?? 0;
  const pastCount = pastQuery.data?.pages[0]?.items.length ?? 0;

  return (
    <div className="portal-content max-w-[1440px]">
      {/* Command Header */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Property Tours &amp; Viewing Itinerary</h1>
          <p>
            Schedule and coordinate verified private inspections with accredited broker representation and strict 60-minute windows.
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-navy-800"
          >
            <Compass className="h-4 w-4 text-brass" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </section>

      {/* 4-Metric Telemetry KPI Ribbon */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Viewing Itinerary Telemetry">
        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Upcoming Confirmed</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-sage">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{upcomingCount}</span>
            <span className="text-xs text-ink-3">Tours</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Confirmed by accredited broker</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Pending Review</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-brass-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{pendingCount}</span>
            <span className="text-xs text-ink-3">Requests</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Awaiting broker confirmation</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Completed Visits</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-navy-700">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{pastCount}</span>
            <span className="text-xs text-ink-3">Dossiers</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Past on-site inspections</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Inspection Window</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-brass-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">60</span>
            <span className="text-xs text-ink-3">Minutes</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Standard guaranteed slot duration</p>
        </div>
      </section>

      {/* Tabs Row */}
      <div className="border-b border-line">
        <div role="tablist" aria-label="Viewing status" className="flex gap-2">
          {TABS.map((t) => {
            const count = t.key === "upcoming" ? upcomingCount : t.key === "pending" ? pendingCount : pastCount;
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
                    isSelected
                      ? "bg-navy-900 text-white"
                      : "bg-canvas-2 text-ink-3"
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
          <ListSkeleton rows={3} />
        ) : activeQuery.isError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-xs text-red-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-red-800">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Failed to load viewing schedule</span>
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
              icon={<CalendarDays className="h-8 w-8 text-brass-600" />}
              title={TABS.find((t) => t.key === tab)!.empty}
              description="Discover verified Egyptian residential properties and schedule a dedicated private viewing at your convenience."
              action={
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-navy-800"
                >
                  <Compass className="h-4 w-4 text-brass" />
                  <span>Browse Residences</span>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((v) => (
              <ViewingCard key={v.id} viewing={v} view="buyer" onOpen={() => setOpen(v)} />
            ))}
            {activeQuery.hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  isLoading={activeQuery.isFetchingNextPage}
                  onClick={() => activeQuery.fetchNextPage()}
                  className="text-xs"
                >
                  Load More Viewings
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <ViewingDrawer viewing={open} view="buyer" onClose={() => setOpen(null)} />
    </div>
  );
}

export default function BuyerViewingsPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-content max-w-[1440px]">
          <ListSkeleton rows={4} />
        </div>
      }
    >
      <BuyerViewingsContent />
    </Suspense>
  );
}
