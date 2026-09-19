"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock } from "lucide-react";
import type { Viewing } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { agentViewingsQuery, availabilityQuery } from "@/lib/query/pipeline";
import { ListSkeleton, ViewingCard } from "@/components/viewings/ViewingParts";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";

/**
 * Agent dashboard — slice scope (spec S1-12): requests awaiting a response, upcoming confirmed
 * viewings, availability status. Plan, quota, listings and leads arrive with their phases.
 */
export default function AgentDashboardPage() {
  const pending = useInfiniteQuery(agentViewingsQuery("pending"));
  const upcoming = useInfiniteQuery(agentViewingsQuery("upcoming"));
  const availability = useQuery(availabilityQuery());
  const [open, setOpen] = useState<Viewing | null>(null);

  const requests = pending.data?.pages[0]?.items ?? [];
  const next = upcoming.data?.pages[0]?.items.slice(0, 5) ?? [];
  const noAvailability = availability.data && availability.data.windows.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-2xl text-navy-900">Agent dashboard</h1>

      {noAvailability && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brass/40 bg-brass-50 p-4">
          <Clock className="h-5 w-5 text-brass-600" aria-hidden />
          <p className="flex-1 text-sm text-ink">
            Set your viewing hours — buyers can&apos;t request viewings on your listings until you do.
          </p>
          <Link href="/agent/calendar?tab=availability" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white">
            Set availability
          </Link>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white p-5 shadow-settly">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-navy-900">
            Requests awaiting you{" "}
            <span className="ml-1 rounded-full bg-brass-50 px-2 py-0.5 text-xs text-brass-600">
              {pending.isPending ? "…" : `${requests.length}${pending.hasNextPage ? "+" : ""}`}
            </span>
          </h2>
          <Link href="/agent/calendar?tab=pending" className="text-sm font-semibold text-navy-900 underline underline-offset-2">All requests</Link>
        </div>
        <div className="mt-4 space-y-3">
          {pending.isPending ? <ListSkeleton rows={2} /> : pending.isError ? (
            <p role="alert" className="text-sm text-red-700">{problemMessage(pending.error)}</p>
          ) : requests.length === 0 ? (
            <p className="rounded-lg bg-canvas p-4 text-sm text-ink-2">No requests right now.</p>
          ) : (
            requests.slice(0, 5).map((v) => <ViewingCard key={v.id} viewing={v} view="agent" onOpen={() => setOpen(v)} />)
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-settly">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <CalendarClock className="h-4 w-4 text-brass-600" aria-hidden /> Upcoming viewings
          </h2>
          <Link href="/agent/calendar?tab=upcoming" className="text-sm font-semibold text-navy-900 underline underline-offset-2">Calendar</Link>
        </div>
        <div className="mt-4 space-y-3">
          {upcoming.isPending ? <ListSkeleton rows={2} /> : upcoming.isError ? (
            <p role="alert" className="text-sm text-red-700">{problemMessage(upcoming.error)}</p>
          ) : next.length === 0 ? (
            <p className="rounded-lg bg-canvas p-4 text-sm text-ink-2">No confirmed viewings.</p>
          ) : (
            next.map((v) => <ViewingCard key={v.id} viewing={v} view="agent" onOpen={() => setOpen(v)} />)
          )}
        </div>
      </section>

      <ViewingDrawer viewing={open} view="agent" onClose={() => setOpen(null)} />
    </div>
  );
}
