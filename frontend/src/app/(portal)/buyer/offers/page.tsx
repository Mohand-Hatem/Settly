"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { HandCoins } from "lucide-react";
import type { Offer, OfferScope } from "@/api/offers";
import { problemMessage } from "@/api/errors";
import { myOffersQuery } from "@/lib/query/offers";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { OfferCard, OfferListSkeleton } from "@/components/offers/OfferParts";
import { OfferDrawer } from "@/components/offers/OfferDrawer";

const TABS: { key: OfferScope; label: string; empty: string }[] = [
  { key: "live", label: "Live Offers", empty: "No active offers right now." },
  { key: "terminal", label: "Past Offers", empty: "No past offers found." },
];

function BuyerOffers() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "live") as OfferScope;
  const query = useInfiniteQuery(myOffersQuery(tab));
  const [open, setOpen] = useState<Offer | null>(null);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl text-navy-900">My offers</h1>
        <span className="text-xs text-ink-3">
          Max 5 live offers allowed
        </span>
      </div>

      <div role="tablist" aria-label="Offer status" className="mt-4 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab}
            onClick={() => router.replace(`${pathname}?tab=${t.key}`)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
              t.key === tab
                ? "border-brass text-navy-900"
                : "border-transparent text-ink-3 hover:text-navy-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3" role="tabpanel">
        {query.isPending ? (
          <OfferListSkeleton />
        ) : query.isError ? (
          <div role="alert" className="rounded-xl border border-line bg-white p-4 text-sm text-error">
            {problemMessage(query.error)}{" "}
            <button
              type="button"
              className="font-semibold underline text-navy-900"
              onClick={() => query.refetch()}
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="h-6 w-6 text-brass-600" />}
            title={TABS.find((t) => t.key === tab)!.empty}
            description="Explore verified residential and commercial listings and submit purchase offers with custom terms."
            action={
              <Link
                href="/search"
                className="inline-flex rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800"
              >
                Browse properties
              </Link>
            }
          />
        ) : (
          <>
            {items.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                view="buyer"
                onOpen={() => setOpen(offer)}
              />
            ))}
            {query.hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  isLoading={query.isFetchingNextPage}
                  onClick={() => query.fetchNextPage()}
                >
                  Load more offers
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <OfferDrawer offer={open} view="buyer" onClose={() => setOpen(null)} />
    </div>
  );
}

export default function BuyerOffersPage() {
  return (
    <Suspense fallback={<OfferListSkeleton />}>
      <BuyerOffers />
    </Suspense>
  );
}
