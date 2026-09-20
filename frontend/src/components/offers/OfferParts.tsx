"use client";

import React from "react";
import Image from "next/image";
import { Clock, Phone } from "lucide-react";
import type { Offer, OfferStatus } from "@/api/offers";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * 10-state Offer Status Badges (BUSINESS_RULES §4)
 */
const STATUS_CONFIG: Record<OfferStatus, { label: string; tone: string }> = {
  PENDING_AGENT: {
    label: "Pending Agent Review",
    tone: "bg-brass-050 text-brass-600 border-brass/30",
  },
  PENDING_BUYER: {
    label: "Counter Received — Action Needed",
    tone: "bg-amber-50 text-amber-700 border-amber-300",
  },
  ACCEPTED: {
    label: "Offer Accepted — Deposit Due",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
  RESERVED: {
    label: "Reserved",
    tone: "bg-sage-bg text-sage border-sage/30",
  },
  REJECTED: {
    label: "Rejected",
    tone: "bg-canvas text-ink-3 border-line",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    tone: "bg-canvas text-ink-3 border-line",
  },
  EXPIRED: {
    label: "Expired",
    tone: "bg-canvas text-ink-3 border-line",
  },
  SUPERSEDED: {
    label: "Superseded",
    tone: "bg-canvas text-ink-3 border-line",
  },
  COMPLETED: {
    label: "Completed",
    tone: "bg-sage-bg text-sage border-sage/30",
  },
  FELL_THROUGH: {
    label: "Fell Through",
    tone: "bg-red-50 text-red-700 border-red-200",
  },
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    tone: "bg-canvas text-ink-3 border-line",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.tone}`}
    >
      {config.label}
    </span>
  );
}

export function OfferCard({
  offer,
  view,
  onOpen,
}: {
  offer: Offer;
  view: "buyer" | "agent";
  onOpen: () => void;
}) {
  const diffFromListing = offer.property.price
    ? ((offer.currentAmount - offer.property.price) / offer.property.price) * 100
    : 0;

  const isDepositDue = offer.status === "ACCEPTED" && offer.depositDeadlineAt;
  const deadlineDate = isDepositDue ? new Date(offer.depositDeadlineAt!) : null;
  const hoursLeft = deadlineDate
    ? Math.max(0, Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-xl border border-line bg-white p-4 text-left shadow-settly transition-colors hover:border-line-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div className="relative h-18 w-24 shrink-0 overflow-hidden rounded-lg bg-canvas-2">
          <Image
            src={offer.property.imageUrl ?? PLACEHOLDER_PROPERTY_IMAGE}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="truncate text-sm font-semibold text-navy-900">
            {offer.property.title ?? "Property"}
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-base font-bold text-navy-900">
              {offer.currentAmount.toLocaleString("en-US")} EGP
            </span>
            {offer.property.price > 0 && (
              <span className="text-xs text-ink-3">
                asking {offer.property.price.toLocaleString("en-US")} EGP (
                {diffFromListing > 0 ? "+" : ""}
                {diffFromListing.toFixed(1)}%)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-2">
            <span>
              {view === "agent"
                ? `Buyer: ${offer.buyer.name}`
                : `Agent: ${offer.agent.name}`}
            </span>
            {view === "agent" && offer.buyer.phone && (
              <span className="flex items-center gap-1 font-mono text-ink-3">
                <Phone className="h-3 w-3 text-brass-600" aria-hidden />
                {offer.buyer.phone}
              </span>
            )}
            <span className="text-ink-3">
              Revision #{offer.latestRevision.revisionNumber}
            </span>
          </div>

          {isDepositDue && hoursLeft !== null && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              <span>
                Deposit deadline: {hoursLeft}h remaining (
                {offer.depositAmount.toLocaleString("en-US")} EGP)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t border-line/60 sm:border-t-0">
        <OfferStatusBadge status={offer.status} />
        <span className="text-xs font-medium text-ink-3">
          {new Date(offer.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </button>
  );
}

export function OfferListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading offers">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="flex items-center gap-4 rounded-xl border border-line bg-white p-4"
        >
          <Skeleton className="h-20 w-24 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-32 font-mono" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
}
