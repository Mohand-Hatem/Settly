"use client";

import React, { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
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
  { key: "pending", label: "Requests" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "availability", label: "Availability" },
];
const EMPTY: Record<ViewingScope, { title: string; description: string }> = {
  pending: { title: "No requests waiting for you.", description: "Requests from buyers appear here as soon as they are sent." },
  upcoming: { title: "No confirmed viewings.", description: "Viewings you confirm appear here, grouped by day." },
  past: { title: "No past viewings yet.", description: "Completed, cancelled and expired viewings are kept here." },
};

function ViewingList({ scope, onOpen }: { scope: ViewingScope; onOpen: (v: Viewing) => void }) {
  const query = useInfiniteQuery(agentViewingsQuery(scope));
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.isPending) return <ListSkeleton />;
  if (query.isError) {
    return (
      <div role="alert" className="rounded-xl border border-line bg-white p-4 text-sm">
        {problemMessage(query.error)}{" "}
        <button type="button" className="font-semibold underline" onClick={() => query.refetch()}>Try again</button>
      </div>
    );
  }
  if (items.length === 0) {
    return <EmptyState icon={<CalendarClock className="h-6 w-6" />} title={EMPTY[scope].title} description={EMPTY[scope].description} />;
  }

  // Upcoming viewings are shown as a day-by-day agenda (Cairo days).
  const groups = new Map<string, Viewing[]>();
  for (const v of items) {
    const k = scope === "upcoming" ? cairoDateKey(v.startsAt) : "all";
    groups.set(k, [...(groups.get(k) ?? []), v]);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([k, vs]) => (
        <div key={k} className="space-y-2">
          {scope === "upcoming" && <h3 className="text-sm font-semibold text-ink-2">{cairoLongDay(vs[0]!.startsAt)}</h3>}
          {vs.map((v) => <ViewingCard key={v.id} viewing={v} view="agent" onOpen={() => onOpen(v)} />)}
        </div>
      ))}
      {query.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" isLoading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>Load more</Button>
        </div>
      )}
    </div>
  );
}

/** Agent calendar, requests and availability (spec S1-13). */
function AgentCalendar() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "pending") as Tab;
  const [open, setOpen] = useState<Viewing | null>(null);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-navy-900">Calendar &amp; requests</h1>
      <div role="tablist" aria-label="Section" className="mt-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab}
            onClick={() => router.replace(`${pathname}?tab=${t.key}`)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-semibold ${t.key === tab ? "border-brass text-navy-900" : "border-transparent text-ink-3 hover:text-navy-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {tab === "availability" ? <AvailabilityEditor /> : <ViewingList scope={tab} onOpen={setOpen} />}
      </div>
      <ViewingDrawer viewing={open} view="agent" onClose={() => setOpen(null)} />
    </div>
  );
}

export default function AgentCalendarPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <AgentCalendar />
    </Suspense>
  );
}
