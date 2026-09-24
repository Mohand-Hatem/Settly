"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, ShieldCheck, ChevronRight, MessageSquare } from "lucide-react";
import type { Viewing, ViewingStatus } from "@/api/pipeline";
import { cairoDay, cairoRange } from "@/lib/cairo-format";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import { Skeleton } from "@/components/ui/Skeleton";

/** Every documented viewing state (BUSINESS_RULES §3), shown as-is — never collapsed. */
const STATUS: Record<ViewingStatus, { label: string; tone: string }> = {
  REQUESTED: { label: "Pending Agent Confirmation", tone: "bg-brass-050 text-brass-700 border-brass-200" },
  RESCHEDULE_PROPOSED: { label: "Reschedule Proposed", tone: "bg-brass-050 text-brass-700 border-brass-200" },
  CONFIRMED: { label: "Confirmed Tour", tone: "bg-sage-bg text-sage border-sage/30" },
  DECLINED: { label: "Declined", tone: "bg-canvas-2 text-ink-3 border-line" },
  CANCELLED: { label: "Cancelled", tone: "bg-canvas-2 text-ink-3 border-line" },
  COMPLETED: { label: "Completed Tour", tone: "bg-sage-bg text-sage border-sage/30" },
  NO_SHOW: { label: "No-Show", tone: "bg-red-50 text-red-700 border-red-200" },
  EXPIRED: { label: "Expired", tone: "bg-canvas-2 text-ink-3 border-line" },
};

export function ViewingStatusBadge({ status }: { status: ViewingStatus }) {
  const s = STATUS[status] ?? { label: status, tone: "bg-canvas-2 text-ink-3 border-line" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${s.tone}`}>
      {s.label}
    </span>
  );
}

/**
 * Rich 3-column Inspection Card matching docs/design/candidates/settly-landing/buyer-dashboard/viewings.html
 */
export function ViewingCard({
  viewing,
  view,
  onOpen,
}: {
  viewing: Viewing;
  view: "buyer" | "agent";
  onOpen: () => void;
}) {
  const gatePassCode = `GATE-EG-${viewing.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="rounded-2xl border border-line bg-white shadow-settly transition-all hover:border-brass/40 overflow-hidden">
      {/* Topbar: Time Slot Banner & Status */}
      <div className="flex items-center justify-between gap-4 border-b border-line bg-[#FAF8F4] px-5 py-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-brass-600" aria-hidden="true" />
          <span className="font-mono text-xs font-bold text-navy-900">
            {cairoDay(viewing.startsAt)} · {cairoRange(viewing.startsAt, viewing.endsAt)}
          </span>
        </div>
        <ViewingStatusBadge status={viewing.status} />
      </div>

      {/* Main 3-Column Inspection Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Column 1: Property Thumbnail (md:col-span-3) */}
        <div className="relative h-32 md:h-28 w-full rounded-xl overflow-hidden bg-canvas-2 md:col-span-3">
          <Image
            src={viewing.property.imageUrl ?? PLACEHOLDER_PROPERTY_IMAGE}
            alt={viewing.property.title ?? "Property"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 240px"
          />
          <div className="absolute bottom-2 left-2 rounded bg-navy-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-brass backdrop-blur-sm">
            VERIFIED RESIDENCE
          </div>
        </div>

        {/* Column 2: Details & Meeting Point (md:col-span-5) */}
        <div className="space-y-1.5 md:col-span-5">
          <Link
            href={`/properties/${viewing.property.slug}`}
            className="font-display text-base font-bold text-navy-900 hover:text-brass-600 transition-colors line-clamp-1"
          >
            {viewing.property.title ?? "Property Listing"}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-ink-3">
            <MapPin className="h-3.5 w-3.5 text-brass-600 shrink-0" />
            <span className="truncate">
              {viewing.property.title || "Greater Cairo, Egypt"}
            </span>
          </div>
          <div className="pt-1 flex items-center gap-2 text-xs text-ink-2">
            <span className="font-semibold text-navy-900">
              {view === "agent" ? "Buyer:" : "Advisor:"}
            </span>
            <span>
              {view === "agent" ? viewing.buyer?.name ?? "Prospective Client" : viewing.agent.name}
            </span>
            <span className="text-[10px] text-sage font-mono font-bold bg-sage-bg px-1.5 py-0.2 rounded border border-sage/20">
              LICENSED
            </span>
          </div>
        </div>

        {/* Column 3: Security Gate Pass & Actions (md:col-span-4) */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 md:col-span-4 border-t md:border-t-0 pt-3 md:pt-0 border-line">
          {/* Gate Pass Code Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-canvas border border-line">
            <ShieldCheck className="h-3.5 w-3.5 text-sage shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono font-bold text-ink-3 uppercase leading-tight">
                Gate Pass
              </span>
              <span className="font-mono text-xs font-bold text-navy-900 leading-tight">
                {gatePassCode}
              </span>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {view === "buyer" && (
              <Link
                href="/buyer/messages"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-2 hover:bg-canvas hover:text-navy-900 transition-colors"
                title="Message Advisor"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Message</span>
              </Link>
            )}
            <button
              type="button"
              onClick={onOpen}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy-800 transition-colors"
            >
              <span>Manage Tour</span>
              <ChevronRight className="h-3.5 w-3.5 text-brass" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading viewings">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-white p-5 space-y-4"
        >
          <div className="flex justify-between items-center pb-3 border-b border-line">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <Skeleton className="h-28 rounded-xl md:col-span-3" />
            <div className="space-y-2 md:col-span-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="space-y-2 md:col-span-4 flex flex-col items-end">
              <Skeleton className="h-8 w-36 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
