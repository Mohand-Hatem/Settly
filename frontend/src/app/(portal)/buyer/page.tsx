"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import type { Viewing } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { authClient } from "@/lib/auth-client";
import { myViewingsQuery } from "@/lib/query/pipeline";
import { ListSkeleton, ViewingCard } from "@/components/viewings/ViewingParts";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";

/**
 * Buyer dashboard — slice scope (spec S1-10): upcoming viewings, pending requests, search CTA.
 * Offers, favourites and saved searches arrive with their phases.
 */
export default function BuyerDashboardPage() {
  const { data: session } = authClient.useSession();
  const upcoming = useInfiniteQuery(myViewingsQuery("upcoming"));
  const pending = useInfiniteQuery(myViewingsQuery("pending"));
  const [open, setOpen] = useState<Viewing | null>(null);

  const next = upcoming.data?.pages[0]?.items.slice(0, 3) ?? [];
  const pendingCount = pending.data?.pages.flatMap((p) => p.items).length ?? 0;
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-navy-900">{firstName ? `Welcome, ${firstName}` : "Welcome"}</h1>
        <p className="mt-1 text-sm text-ink-2">Your viewings in one place.</p>
      </div>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-settly">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <CalendarDays className="h-4 w-4 text-brass-600" aria-hidden /> Upcoming viewings
          </h2>
          <Link href="/buyer/viewings" className="text-sm font-semibold text-navy-900 underline underline-offset-2">See all</Link>
        </div>
        <div className="mt-4 space-y-3">
          {upcoming.isPending ? (
            <ListSkeleton rows={2} />
          ) : upcoming.isError ? (
            <p role="alert" className="text-sm text-red-700">{problemMessage(upcoming.error)}</p>
          ) : next.length === 0 ? (
            <p className="rounded-lg bg-canvas p-4 text-sm text-ink-2">
              No confirmed viewings yet. Open a listing and choose a time — the agent confirms it.
            </p>
          ) : (
            next.map((v) => <ViewingCard key={v.id} viewing={v} view="buyer" onOpen={() => setOpen(v)} />)
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/buyer/viewings?tab=pending" className="rounded-2xl border border-line bg-white p-5 shadow-settly hover:border-line-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-3">Pending requests</div>
          <div className="mt-1 font-mono text-3xl font-bold text-navy-900">
            {pending.isPending ? "…" : pendingCount}
            <span className="ml-1 text-sm font-medium text-ink-3">of 3 open</span>
          </div>
          <p className="mt-1 text-sm text-ink-2">Waiting for the agent to respond.</p>
        </Link>
        <Link href="/search" className="flex flex-col justify-between rounded-2xl border border-line bg-navy-900 p-5 text-white shadow-settly">
          <Search className="h-5 w-5 text-brass" aria-hidden />
          <div>
            <div className="mt-3 font-semibold">Find a property</div>
            <p className="text-sm text-white/70">Search listings across Egypt and book a viewing.</p>
          </div>
        </Link>
      </div>

      <ViewingDrawer viewing={open} view="buyer" onClose={() => setOpen(null)} />
    </div>
  );
}
