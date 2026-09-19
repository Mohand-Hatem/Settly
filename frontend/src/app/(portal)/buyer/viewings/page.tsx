"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import type { Viewing, ViewingScope } from "@/api/pipeline";
import { problemMessage } from "@/api/errors";
import { myViewingsQuery } from "@/lib/query/pipeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ListSkeleton, ViewingCard } from "@/components/viewings/ViewingParts";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";

const TABS: { key: ViewingScope; label: string; empty: string }[] = [
  { key: "upcoming", label: "Upcoming", empty: "No confirmed viewings yet." },
  { key: "pending", label: "Pending", empty: "No requests waiting for the agent." },
  { key: "past", label: "Past", empty: "Nothing here yet." },
];

/** Buyer viewings (spec S1-11): Upcoming · Pending · Past, detail in a drawer. */
function BuyerViewings() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "upcoming") as ViewingScope;
  const query = useInfiniteQuery(myViewingsQuery(tab));
  const [open, setOpen] = useState<Viewing | null>(null);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-navy-900">My viewings</h1>
      <div role="tablist" aria-label="Viewing status" className="mt-4 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab}
            onClick={() => router.replace(`${pathname}?tab=${t.key}`)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              t.key === tab ? "border-brass text-navy-900" : "border-transparent text-ink-3 hover:text-navy-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3" role="tabpanel">
        {query.isPending ? (
          <ListSkeleton />
        ) : query.isError ? (
          <div role="alert" className="rounded-xl border border-line bg-white p-4 text-sm">
            {problemMessage(query.error)}{" "}
            <button type="button" className="font-semibold underline" onClick={() => query.refetch()}>Try again</button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title={TABS.find((t) => t.key === tab)!.empty}
            description="Find a property and request a 60-minute viewing at a time that suits you."
            action={<Link href="/search" className="inline-flex rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Browse properties</Link>}
          />
        ) : (
          <>
            {items.map((v) => (
              <ViewingCard key={v.id} viewing={v} view="buyer" onOpen={() => setOpen(v)} />
            ))}
            {query.hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" isLoading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <ViewingDrawer viewing={open} view="buyer" onClose={() => setOpen(null)} />
    </div>
  );
}

export default function BuyerViewingsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <BuyerViewings />
    </Suspense>
  );
}
