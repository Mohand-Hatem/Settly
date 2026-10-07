"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FilePen,
  PlusCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { PropertyResponse, PropertyStatus } from "@/api/catalog";
import { problemMessage } from "@/api/errors";
import { myPropertiesQuery } from "@/lib/query/catalog";
import { agentSubscriptionQuery } from "@/lib/query/subscription";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

// -- Filter definitions --
type FilterKey = "all" | "active" | "waiting_quota" | "pending" | "draft" | "closed";

const FILTER_GROUPS: { key: FilterKey; label: string; statuses?: PropertyStatus[] }[] = [
  { key: "all", label: "All Listings" },
  { key: "active", label: "Live", statuses: ["PUBLISHED", "RESERVED"] },
  { key: "waiting_quota", label: "Waiting for Quota" },
  { key: "pending", label: "In Review", statuses: ["PENDING_REVIEW", "REJECTED"] },
  { key: "draft", label: "Drafts", statuses: ["DRAFT"] },
  { key: "closed", label: "Closed", statuses: ["SOLD", "RENTED", "ARCHIVED", "SUSPENDED"] },
];

const STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RENTED: "Rented",
  ARCHIVED: "Archived",
  SUSPENDED: "Suspended",
};

const STATUS_CLASSES: Record<PropertyStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border border-gray-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-800 border border-amber-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  PUBLISHED: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  RESERVED: "bg-blue-50 text-blue-700 border border-blue-200",
  SOLD: "bg-navy-050 text-navy-900 border border-navy-200",
  RENTED: "bg-purple-50 text-purple-700 border border-purple-200",
  ARCHIVED: "bg-stone-100 text-stone-600 border border-stone-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border border-rose-200",
};

function ListingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-white p-5 flex gap-4">
          <Skeleton className="h-20 w-24 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 rounded" />
            <Skeleton className="h-3 w-2/5 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-xl shrink-0 self-center" />
        </div>
      ))}
    </div>
  );
}

function formatEgp(val: string | null | undefined): string {
  if (!val) return "-";
  const egp = Number(val) / 100;
  if (isNaN(egp)) return "-";
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(egp);
}

function ListingRow({
  listing,
  fifoQueueIndex,
  resetDate,
}: {
  listing: PropertyResponse;
  fifoQueueIndex?: number;
  resetDate?: string;
}) {
  const status = listing.status as PropertyStatus;
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusClass = STATUS_CLASSES[status] ?? STATUS_CLASSES.DRAFT;
  const coverImage = listing.images?.find((img) => img.isCover) ?? listing.images?.[0];
  const isWaitingForQuota = Boolean(listing.approvedWaitingForQuotaAt);

  return (
    <article className="group rounded-2xl border border-line bg-white p-4 shadow-settly transition-all hover:border-brass/40 hover:shadow-md flex flex-col sm:flex-row gap-4">
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-canvas border border-line">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={listing.titleEn ?? "Listing thumbnail"}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-8 w-8 text-ink-4" />
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 rounded-md bg-navy-900/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
          {listing.listingIntent}
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="font-display text-sm font-bold text-navy-900 line-clamp-1 flex-1">
            {listing.titleEn ?? "Untitled Listing"}
          </h3>

          {isWaitingForQuota && fifoQueueIndex ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 font-mono text-[10px] font-bold">
              <Clock className="h-3 w-3 text-amber-700" />
              FIFO QUEUE #{fifoQueueIndex}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${statusClass}`}>
              {statusLabel}
            </span>
          )}
        </div>

        <p className="text-xs text-ink-3 line-clamp-1">
          {listing.area?.nameEn ?? "-"} · {listing.propertyType} · {listing.areaSqm ?? "-"} m²
        </p>

        {isWaitingForQuota && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-[#FAF8F4] border border-brass-200 p-2.5 text-xs text-navy-900">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brass-600 shrink-0" />
              <div>
                <span className="font-bold">Approved by Compliance</span>
                <span className="text-ink-3 block sm:inline sm:ml-1 text-[11px]">
                  · Auto-activates on {resetDate || "1st of next Cairo month"} at 00:00 EET
                </span>
              </div>
            </div>
            <Link
              href="/agent/subscription"
              className="text-brass-700 hover:text-brass-800 font-bold text-[11px] flex items-center gap-1 whitespace-nowrap self-end sm:self-auto"
            >
              <span>Upgrade to publish now</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {status === "REJECTED" && (
          <div className="flex items-start gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5">
            <AlertTriangle className="h-3 w-3 text-red-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-700">Rejected by compliance. Edit required credentials and resubmit.</p>
          </div>
        )}

        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-bold text-navy-900">{formatEgp(listing.price)}</span>
          {listing.listingIntent === "RENT" && listing.rentalPeriod && (
            <span className="font-mono text-[11px] text-ink-3">
              / {listing.rentalPeriod === "MONTHLY" ? "mo" : "yr"}
            </span>
          )}
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0">
        {listing.slug && (
          <Link
            href={`/properties/${listing.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink-2 transition hover:border-line-2 hover:bg-white"
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Link>
        )}
        {(status === "DRAFT" || status === "REJECTED") && (
          <Link
            href={`/agent/listings/${listing.id}/edit`}
            className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-800"
          >
            <FilePen className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Link>
        )}
        {status === "PUBLISHED" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>
    </article>
  );
}

function AgentListingsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const rawFilter = params.get("filter") as FilterKey | null;
  const activeFilter: FilterKey = FILTER_GROUPS.find((g) => g.key === rawFilter)?.key ?? "all";

  const query = useQuery(myPropertiesQuery());
  const subscriptionQuery = useQuery(agentSubscriptionQuery());

  const allListings = query.data?.items ?? [];
  const quota = subscriptionQuery.data?.quota;
  const currentPlan = subscriptionQuery.data?.plan || "FREE";

  // Identify waiting listings and sort FIFO by approvedWaitingForQuotaAt ASC (Decision #87)
  const waitingListings = allListings
    .filter((l) => Boolean(l.approvedWaitingForQuotaAt))
    .sort((a, b) => new Date(a.approvedWaitingForQuotaAt!).getTime() - new Date(b.approvedWaitingForQuotaAt!).getTime());

  const waitingMap = new Map<string, number>();
  waitingListings.forEach((l, idx) => {
    waitingMap.set(l.id, idx + 1);
  });

  const filtered =
    activeFilter === "all"
      ? allListings
      : activeFilter === "waiting_quota"
      ? waitingListings
      : allListings.filter((l) => {
          const group = FILTER_GROUPS.find((g) => g.key === activeFilter);
          return group?.statuses ? group.statuses.includes(l.status as PropertyStatus) : true;
        });

  const countFor = (key: FilterKey) => {
    if (key === "all") return allListings.length;
    if (key === "waiting_quota") return waitingListings.length;
    const group = FILTER_GROUPS.find((g) => g.key === key);
    return group?.statuses
      ? allListings.filter((l) => group.statuses!.includes(l.status as PropertyStatus)).length
      : 0;
  };

  const setFilter = (key: FilterKey) => {
    const url = new URL(pathname, window.location.origin);
    if (key === "all") url.searchParams.delete("filter");
    else url.searchParams.set("filter", key);
    router.push(url.pathname + url.search);
  };

  const publishedCount = allListings.filter((l) => l.status === "PUBLISHED").length;
  const pendingCount = allListings.filter((l) => l.status === "PENDING_REVIEW").length;

  const used = quota?.used ?? publishedCount;
  const total = quota?.total ?? 3;
  const remaining = quota?.remaining ?? Math.max(0, total - used);
  const percentUsed = Math.min(100, Math.round((used / total) * 100));

  const resetFormatted = quota?.resetDate
    ? new Date(quota.resetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "1st of next month";

  return (
    <div className="portal-content max-w-[1540px] space-y-6">
      {/* Welcome Command Bar */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brass-600" aria-hidden="true" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
              My Property Portfolio
            </h1>
          </div>
          <p className="text-xs text-ink-3 mt-1">
            Manage your listings, track Cairo calendar-month quota slots, and monitor the FIFO activation queue.
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link href="/agent/subscription" className="btn-portal-outline">
            <Zap className="h-4 w-4 text-brass-600" aria-hidden="true" />
            <span>Quota Cockpit ({used}/{total})</span>
          </Link>
          <Link href="/agent/listings/new" className="btn-portal-brass">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>New Listing</span>
          </Link>
        </div>
      </section>

      {/* Monthly Quota Cockpit Ribbon (SUB-09, Decisions #89, #103) */}
      <section className="rounded-2xl border border-line bg-gradient-to-r from-white via-white to-canvas p-4 shadow-settly">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-brass">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-navy-900">
                  Monthly Listing Quota ({currentPlan} Tier)
                </span>
                <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                  percentUsed >= 100
                    ? "bg-red-100 text-red-800"
                    : percentUsed >= 80
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}>
                  {used} OF {total} SLOTS USED
                </span>
              </div>
              <p className="text-xs text-ink-3 mt-0.5">
                {remaining > 0
                  ? `${remaining} slot${remaining > 1 ? "s" : ""} remaining this Cairo calendar month.`
                  : "Quota full. New compliance-approved listings enter the FIFO queue."}{" "}
                Resets on {resetFormatted} at 00:00 EET (Decision #103).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:block w-36 bg-line-2 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  percentUsed >= 100 ? "bg-red-500" : percentUsed >= 80 ? "bg-brass-500" : "bg-emerald-500"
                }`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <Link
              href="/agent/subscription"
              className="inline-flex flex-row items-center gap-1.5 rounded-lg bg-brass px-3.5 py-2 text-xs font-bold text-navy-950 transition hover:bg-brass-light whitespace-nowrap shadow-sm"
            >
              <span>Upgrade Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Waiting for Quota Warning Center (AGT-02 / SUB-09) */}
      {waitingListings.length > 0 && (
        <section className="action-center bg-[#FAF8F4] border-2 border-brass-600/30" role="region" aria-label="Waiting for Quota Alert">
          <div className="action-center-left">
            <div className="action-center-icon bg-brass text-navy-950">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span className="font-display font-bold text-navy-900">
                  {waitingListings.length} Listing{waitingListings.length > 1 ? "s" : ""} Waiting for Next Month&apos;s Quota
                </span>
                <span className="inline-flex items-center rounded-full bg-brass-050 text-brass-700 px-2 py-0.5 text-[11px] font-mono font-bold">
                  FIFO QUEUE ACTIVE
                </span>
              </div>
              <p className="action-center-desc">
                These properties have passed compliance review but await slot availability. They will automatically publish on {resetFormatted} at 00:00 EET in chronological order (Decision #87). Upgrade your tier to publish them immediately.
              </p>
            </div>
          </div>
          <div className="action-center-actions">
            <button
              type="button"
              onClick={() => setFilter("waiting_quota")}
              className="btn-portal-primary font-bold text-xs"
            >
              <span>View Waiting Queue ({waitingListings.length})</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* 4-Metric Telemetry Ribbon */}
      {!query.isPending && allListings.length > 0 && (
        <section className="telemetry-grid" aria-label="Listing telemetry">
          <div className="metric-card">
            <div className="metric-card-header">
              <span className="metric-card-label">Live Listings</span>
              <span className={`metric-badge-tag ${publishedCount > 0 ? "sage" : ""}`}>
                {publishedCount > 0 ? "PUBLISHED" : "NONE"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="metric-num-val font-mono">{publishedCount}</span>
              <span className="font-mono text-xs text-ink-3">active</span>
            </div>
            <div className="metric-footnote-txt">
              <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
              <span>Indexed on Egypt catalog</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span className="metric-card-label">Monthly Quota</span>
              <span className={`metric-badge-tag ${percentUsed >= 80 ? "brass" : "sage"}`}>
                {percentUsed}% USED
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="metric-num-val font-mono">{used} / {total}</span>
              <span className="font-mono text-xs text-ink-3">slots</span>
            </div>
            <div className="metric-footnote-txt">
              <Zap className="h-3.5 w-3.5 text-brass-600" />
              <span>{remaining} remaining this period</span>
            </div>
          </div>

          <div
            onClick={() => setFilter("waiting_quota")}
            className="metric-card cursor-pointer hover:border-brass/40"
          >
            <div className="metric-card-header">
              <span className="metric-card-label">Waiting for Quota</span>
              <span className={`metric-badge-tag ${waitingListings.length > 0 ? "brass" : ""}`}>
                {waitingListings.length > 0 ? "FIFO QUEUED" : "CLEAR"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="metric-num-val font-mono">{waitingListings.length}</span>
              <span className="font-mono text-xs text-ink-3">approved</span>
            </div>
            <div className="metric-footnote-txt">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Auto-publishes on 1st</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-card-header">
              <span className="metric-card-label">Under Compliance</span>
              <span className={`metric-badge-tag ${pendingCount > 0 ? "brass" : ""}`}>
                {pendingCount > 0 ? "IN REVIEW" : "NONE"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="metric-num-val font-mono">{pendingCount}</span>
              <span className="font-mono text-xs text-ink-3">listings</span>
            </div>
            <div className="metric-footnote-txt">
              <ShieldCheck className="h-3.5 w-3.5 text-ink-3" />
              <span>Admin moderation queue</span>
            </div>
          </div>
        </section>
      )}

      {/* Filter Tabs Toolbar */}
      {!query.isPending && allListings.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap border-b border-line pb-4" role="tablist">
          {FILTER_GROUPS.map((g) => {
            const count = countFor(g.key);
            const isActive = g.key === activeFilter;
            return (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(g.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-canvas border border-line text-ink-2 hover:border-line-2 hover:bg-white"
                }`}
              >
                {g.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : g.key === "waiting_quota"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-navy-900/10 text-navy-900"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Listings Section */}
      <section aria-label="Listings" className="space-y-3 mt-1">
        {query.isPending ? (
          <ListingSkeleton rows={4} />
        ) : query.isError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-800">Failed to load listings</p>
              <p className="text-xs text-red-700 mt-1">{problemMessage(query.error)}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()} className="mt-3 text-xs">
                Try again
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-2 bg-canvas py-16 text-center">
            <Building2 className="h-10 w-10 text-ink-4" />
            <h3 className="mt-3 font-display text-base font-semibold text-navy-900">
              {activeFilter === "all"
                ? "No listings yet"
                : activeFilter === "waiting_quota"
                ? "No listings waiting for quota"
                : "No listings in this filter"}
            </h3>
            <p className="mt-1.5 max-w-xs text-xs text-ink-3">
              {activeFilter === "all"
                ? "Create your first listing. It will be reviewed by compliance before going live."
                : activeFilter === "waiting_quota"
                ? "All approved listings have active quota slots and are live on Settly."
                : "Try a different filter or create a new listing."}
            </p>
            {activeFilter === "all" && (
              <Link href="/agent/listings/new" className="btn-portal-brass mt-6 text-xs">
                <PlusCircle className="h-4 w-4" />
                <span>New Listing</span>
              </Link>
            )}
          </div>
        ) : (
          filtered.map((listing) => (
            <ListingRow
              key={listing.id}
              listing={listing}
              fifoQueueIndex={waitingMap.get(listing.id)}
              resetDate={resetFormatted}
            />
          ))
        )}
      </section>
    </div>
  );
}

export default function AgentListingsPage() {
  return (
    <Suspense fallback={<div className="portal-content"><ListingSkeleton rows={5} /></div>}>
      <AgentListingsContent />
    </Suspense>
  );
}
