"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CalendarClock, CalendarDays, CheckCircle2, Clock, AlertCircle, Compass } from "lucide-react";
import type { Viewing, ViewingScope } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { agentViewingsQuery } from "@/lib/query/pipeline";
import { cairoDateKey, cairoLongDay } from "@/lib/cairo-format";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton, ViewingCard } from "@/components/viewings/ViewingParts";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";
import { AvailabilityEditor } from "@/components/viewings/AvailabilityEditor";

type Tab = ViewingScope | "availability";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Incoming Requests" },
  { key: "upcoming", label: "Confirmed Agenda" },
  { key: "past", label: "Completed Tours" },
  { key: "availability", label: "Slot Availability" },
];

const EMPTY: Record<ViewingScope, { title: string; description: string }> = {
  pending: { title: "No requests waiting for you.", description: "Requests from buyers appear here as soon as they are sent." },
  upcoming: { title: "No confirmed viewings.", description: "Viewings you confirm appear here, grouped by day." },
  past: { title: "No past viewings yet.", description: "Completed, cancelled and expired viewings are kept here." },
};

function ViewingList({ scope, onOpen }: { scope: ViewingScope; onOpen: (v: Viewing) => void }) {
  const query = useInfiniteQuery(agentViewingsQuery(scope));
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.isPending) return <ListSkeleton rows={3} />;
  if (query.isError) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-xs text-red-900 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-red-800">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span>Failed to load viewings schedule</span>
        </div>
        <p>{problemMessage(query.error)}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()} className="text-xs">
          Try again
        </Button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-12 text-center">
        <EmptyState
          icon={<CalendarClock className="h-8 w-8 text-brass-600" />}
          title={EMPTY[scope].title}
          description={EMPTY[scope].description}
        />
      </div>
    );
  }

  // Upcoming viewings are shown as a day-by-day agenda (Cairo days).
  const groups = new Map<string, Viewing[]>();
  for (const v of items) {
    const k = scope === "upcoming" ? cairoDateKey(v.startsAt) : "all";
    groups.set(k, [...(groups.get(k) ?? []), v]);
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([k, vs]) => (
        <div key={k} className="space-y-3">
          {scope === "upcoming" && (
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <span className="h-2 w-2 rounded-full bg-brass" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-navy-900">
                {cairoLongDay(vs[0]!.startsAt)}
              </h3>
            </div>
          )}
          <div className="space-y-2.5">
            {vs.map((v) => (
              <ViewingCard key={v.id} viewing={v} view="agent" onOpen={() => onOpen(v)} />
            ))}
          </div>
        </div>
      ))}
      {query.hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            isLoading={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
            className="text-xs"
          >
            Load More Viewings
          </Button>
        </div>
      )}
    </div>
  );
}

/** Agent calendar, requests and availability (spec S1-13). */
function AgentCalendarContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "pending") as Tab;
  const [open, setOpen] = useState<Viewing | null>(null);

  const pendingQuery = useInfiniteQuery(agentViewingsQuery("pending"));
  const upcomingQuery = useInfiniteQuery(agentViewingsQuery("upcoming"));
  const pastQuery = useInfiniteQuery(agentViewingsQuery("past"));

  const pendingCount = pendingQuery.data?.pages[0]?.items.length ?? 0;
  const upcomingCount = upcomingQuery.data?.pages[0]?.items.length ?? 0;
  const pastCount = pastQuery.data?.pages[0]?.items.length ?? 0;

  return (
    <div className="portal-content max-w-[1440px]">
      {/* Command Header */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Viewing Calendar &amp; Tour Schedule</h1>
          <p>
            Coordinate private client viewings, manage weekly availability slots, and review incoming requests.
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link
            href="/agent/listings"
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-navy-800"
          >
            <Compass className="h-4 w-4 text-brass" />
            <span>Manage Listings</span>
          </Link>
        </div>
      </section>

      {/* 4-Metric Telemetry KPI Ribbon */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Calendar Telemetry">
        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Pending Requests</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-brass-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{pendingCount}</span>
            <span className="text-xs text-ink-3">Awaiting action</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Buyer viewing inquiries</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Upcoming Confirmed</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-sage">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{upcomingCount}</span>
            <span className="text-xs text-ink-3">Scheduled tours</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Confirmed on your agenda</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Completed Visits</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-navy-800">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">{pastCount}</span>
            <span className="text-xs text-ink-3">Historic visits</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Successfully conducted inspections</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 transition hover:border-brass/50">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold tracking-wider text-ink-3 uppercase">Slot Duration</span>
            <div className="rounded-xl border border-line bg-canvas p-2 text-brass-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-navy-900">60</span>
            <span className="text-xs text-ink-3">Minutes</span>
          </div>
          <p className="mt-1 text-xs text-ink-2">Standard slot per Decision #22</p>
        </div>
      </section>

      {/* Tabs Row */}
      <div className="border-b border-line">
        <div role="tablist" aria-label="Calendar views" className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => {
            const count =
              t.key === "pending"
                ? pendingCount
                : t.key === "upcoming"
                ? upcomingCount
                : t.key === "past"
                ? pastCount
                : null;
            const isSelected = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => router.replace(`${pathname}?tab=${t.key}`)}
                className={`relative flex items-center gap-2 shrink-0 border-b-2 px-5 py-3 text-xs font-semibold transition ${
                  isSelected
                    ? "border-brass text-navy-900 font-bold"
                    : "border-transparent text-ink-3 hover:text-navy-900"
                }`}
              >
                <span>{t.label}</span>
                {count !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                      isSelected ? "bg-navy-900 text-white" : "bg-canvas-2 text-ink-3"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div role="tabpanel" className="space-y-4">
        {tab === "availability" ? <AvailabilityEditor /> : <ViewingList scope={tab} onOpen={setOpen} />}
      </div>

      <ViewingDrawer viewing={open} view="agent" onClose={() => setOpen(null)} />
    </div>
  );
}

export default function AgentCalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-content max-w-[1440px]">
          <ListSkeleton rows={4} />
        </div>
      }
    >
      <AgentCalendarContent />
    </Suspense>
  );
}
