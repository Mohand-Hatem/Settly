"use client";

import React from "react";
import Image from "next/image";
import type { Viewing, ViewingStatus } from "@/api/pipeline";
import { cairoDay, cairoRange } from "@/lib/cairo-format";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import { Skeleton } from "@/components/ui/Skeleton";

/** Every documented viewing state (BUSINESS_RULES §3), shown as-is — never collapsed. */
const STATUS: Record<ViewingStatus, { label: string; tone: string }> = {
  REQUESTED: { label: "Requested", tone: "bg-brass-50 text-brass-600 border-brass/30" },
  RESCHEDULE_PROPOSED: { label: "New time proposed", tone: "bg-brass-50 text-brass-600 border-brass/30" },
  CONFIRMED: { label: "Confirmed", tone: "bg-sage-bg text-sage border-sage/30" },
  DECLINED: { label: "Declined", tone: "bg-canvas text-ink-3 border-line" },
  CANCELLED: { label: "Cancelled", tone: "bg-canvas text-ink-3 border-line" },
  COMPLETED: { label: "Completed", tone: "bg-sage-bg text-sage border-sage/30" },
  NO_SHOW: { label: "No-show", tone: "bg-red-50 text-red-700 border-red-200" },
  EXPIRED: { label: "Expired", tone: "bg-canvas text-ink-3 border-line" },
};

export function ViewingStatusBadge({ status }: { status: ViewingStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${s.tone}`}>
      {s.label}
    </span>
  );
}

export function ViewingCard({
  viewing,
  view,
  onOpen,
}: {
  viewing: Viewing;
  view: "buyer" | "agent";
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-settly transition-colors hover:border-line-2"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas-2">
        <Image src={viewing.property.imageUrl ?? PLACEHOLDER_PROPERTY_IMAGE} alt="" fill className="object-cover" sizes="80px" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{viewing.property.title ?? "Property"}</div>
        <div className="text-sm text-ink-2">
          {cairoDay(viewing.startsAt)} · {cairoRange(viewing.startsAt, viewing.endsAt)}
        </div>
        <div className="truncate text-xs text-ink-3">
          {view === "agent" ? `Buyer: ${viewing.buyer?.name ?? "—"}` : `Agent: ${viewing.agent.name}`}
        </div>
      </div>
      <ViewingStatusBadge status={viewing.status} />
    </button>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading viewings">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-xl border border-line bg-white p-4"
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}
