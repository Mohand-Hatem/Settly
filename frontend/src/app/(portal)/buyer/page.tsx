"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  HandCoins,
  Search,
  ArrowRight,
  Clock,
  Compass,
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import type { Viewing } from "@/api/pipeline";
import { authClient } from "@/lib/auth-client";
import { myViewingsQuery } from "@/lib/query/pipeline";
import { myOffersQuery } from "@/lib/query/offers";
import { ViewingDrawer } from "@/components/viewings/ViewingDrawer";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Buyer dashboard — Matches docs/design/candidates/settly-landing/buyer-dashboard/overview.html.
 * Features Spectral command bar, 4-metric telemetry ribbon with 5-dot offer capacity meter,
 * urgent action center, active acquisition pipeline deal card with 6-stage lifecycle stepper,
 * viewing itinerary dossier with compound gate pass, and Egyptian market catalog gateway.
 */
export default function BuyerDashboardPage() {
  const { data: session } = authClient.useSession();
  const upcoming = useInfiniteQuery(myViewingsQuery("upcoming"));
  const pending = useInfiniteQuery(myViewingsQuery("pending"));
  const liveOffers = useInfiniteQuery(myOffersQuery("live"));
  const [open, setOpen] = useState<Viewing | null>(null);

  const nextViewings = upcoming.data?.pages[0]?.items ?? [];
  const primaryViewing = nextViewings[0];
  const upcomingCount = upcoming.data?.pages.flatMap((p) => p.items).length ?? 0;
  const pendingCount = pending.data?.pages.flatMap((p) => p.items).length ?? 0;

  const activeOffers = liveOffers.data?.pages[0]?.items ?? [];
  const primaryOffer = activeOffers[0];
  const liveOffersCount = liveOffers.data?.pages.flatMap((p) => p.items).length ?? 0;
  const firstName = session?.user?.name?.split(" ")[0];

  // Check if an accepted offer requires reservation deposit payment
  const acceptedOffer = activeOffers.find((o) => o.status === "ACCEPTED");

  // Determine stage for active acquisition stepper (1 to 6)
  const getOfferStageIndex = (status?: string) => {
    switch (status) {
      case "PENDING_AGENT":
        return 1; // Offer Made
      case "PENDING_BUYER":
        return 2; // Counter Received
      case "ACCEPTED":
        return 3; // Accepted - Deposit Due
      case "RESERVED":
        return 5; // Reserved
      case "COMPLETED":
        return 6; // Final Closing
      default:
        return 1;
    }
  };

  const currentStageIndex = getOfferStageIndex(primaryOffer?.status);

  return (
    <div className="portal-content max-w-7xl mx-auto space-y-8">
      {/* Welcome Command Bar (matches reference .welcome-bar) */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p>
            Portfolio &amp; transaction command center · Verified Egypt real estate
          </p>
        </div>
        <div className="welcome-actions-row">
          <Link href="/buyer/offers" className="btn-portal-outline">
            <HandCoins className="h-4 w-4 text-brass-600" aria-hidden="true" />
            <span>Active Offers ({liveOffersCount})</span>
          </Link>
          <Link href="/search" className="btn-portal-brass">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </section>

      {/* Urgent Action Center (shown when actions require buyer attention) */}
      {acceptedOffer && (
        <section className="action-center bg-[#FAF8F4] border-2 border-brass-600/30" role="region" aria-label="Deposit Payment Required">
          <div className="action-center-left">
            <div className="action-center-icon bg-brass text-navy-950">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span className="font-display font-bold text-navy-900">Offer Accepted — 72-Hour Deposit Window Active</span>
                <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[11px] font-mono font-bold">
                  DEPOSIT REQUIRED
                </span>
              </div>
              <p className="action-center-desc">
                Your purchase offer of {acceptedOffer.currentAmount.toLocaleString()} EGP for {acceptedOffer.property.title || "Selected Residence"} has been accepted by the seller. Pay the 5% reservation deposit ({acceptedOffer.depositAmount.toLocaleString()} EGP) to lock the property and enter the 48-hour fully refundable due diligence period.
              </p>
            </div>
          </div>
          <div className="action-center-actions">
            <Link
              href={`/buyer/offers/${acceptedOffer.id}/deposit`}
              className="btn-portal-primary font-bold text-xs"
            >
              <span>Pay 5% Reservation Deposit</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {pendingCount > 0 && !acceptedOffer && (
        <section className="action-center" role="region" aria-label="Action Center">
          <div className="action-center-left">
            <div className="action-center-icon">
              <Clock className="h-5 w-5 text-brass-600" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span>Pending Viewing Responses</span>
                <span className="inline-flex items-center rounded-full bg-brass-050 px-2 py-0.5 text-[11px] font-mono font-bold text-brass-600">
                  {pendingCount} AWAITING
                </span>
              </div>
              <p className="action-center-desc">
                You have {pendingCount} viewing request{pendingCount > 1 ? "s" : ""} waiting for agent confirmation.
              </p>
            </div>
          </div>
          <div className="action-center-actions">
            <Link href="/buyer/viewings?tab=pending" className="btn-portal-primary text-xs">
              <span>Review Requests</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {liveOffersCount >= 5 && (
        <section className="action-center" role="region" aria-label="Offer Limit Alert">
          <div className="action-center-left">
            <div className="action-center-icon">
              <AlertCircle className="h-5 w-5 text-brass-600" aria-hidden="true" />
            </div>
            <div className="action-center-body">
              <div className="action-center-title">
                <span>Maximum Offer Capacity Reached (5 of 5)</span>
              </div>
              <p className="action-center-desc">
                Per Settly business rules, buyers can maintain up to 5 concurrent active offers. You cannot submit new offers until an existing one is completed, declined, or cancelled.
              </p>
            </div>
          </div>
          <div className="action-center-actions">
            <Link href="/buyer/offers" className="btn-portal-outline text-xs">
              <span>View Offers</span>
            </Link>
          </div>
        </section>
      )}

      {/* Telemetry 4-Card Executive Instrument Panel (matches reference .telemetry-grid) */}
      <section className="telemetry-grid" aria-label="Portfolio Telemetry">
        {/* Card 1: Live Offers with 5-dot capacity meter */}
        <Link href="/buyer/offers" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Live Offers</span>
            <span className={`metric-badge-tag ${liveOffersCount > 0 ? "brass" : ""}`}>
              {liveOffersCount > 0 ? "ACTIVE" : "IDLE"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {liveOffers.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : liveOffersCount}
            </span>
            <span className="font-mono text-xs text-ink-3">/ 5 max</span>
          </div>
          <div className="metric-capacity-meter" title={`${liveOffersCount} of 5 slots in use`}>
            {[0, 1, 2, 3, 4].map((slot) => (
              <span
                key={slot}
                className={`capacity-pip ${slot < liveOffersCount ? "active" : ""}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="metric-footnote-txt">
            <HandCoins className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
            <span>Active purchase negotiations &amp; counters</span>
          </div>
        </Link>

        {/* Card 2: Upcoming Viewings */}
        <Link href="/buyer/viewings" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Upcoming Tours</span>
            <span className={`metric-badge-tag ${upcomingCount > 0 ? "sage" : ""}`}>
              {upcomingCount > 0 ? "CONFIRMED" : "CLEAR"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {upcoming.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : upcomingCount}
            </span>
            <span className="font-mono text-xs text-ink-3">scheduled</span>
          </div>
          <div className="metric-footnote-txt">
            <CalendarDays className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
            <span>
              {upcomingCount > 0 ? "Private verified on-site visits" : "No tours scheduled"}
            </span>
          </div>
        </Link>

        {/* Card 3: Pending Requests */}
        <Link href="/buyer/viewings?tab=pending" className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Tour Requests</span>
            <span className={`metric-badge-tag ${pendingCount > 0 ? "brass" : ""}`}>
              {pendingCount > 0 ? `${pendingCount} PENDING` : "CLEAR"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {pending.isPending ? <Skeleton className="h-7 w-8 inline-block rounded" /> : pendingCount}
            </span>
            <span className="font-mono text-xs text-ink-3">awaiting</span>
          </div>
          <div className="metric-footnote-txt">
            <Clock className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
            <span>Awaiting agent schedule confirmation</span>
          </div>
        </Link>

        {/* Card 4: Explore Catalog */}
        <Link href="/search" className="metric-card bg-gradient-to-br from-white to-canvas">
          <div className="metric-card-header">
            <span className="metric-card-label">Egypt Catalog</span>
            <span className="metric-badge-tag sage">VERIFIED</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val text-navy-900">Explore</span>
            <ArrowRight className="h-4 w-4 text-brass-600 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
          <div className="metric-footnote-txt">
            <Compass className="h-3.5 w-3.5 text-brass-600" aria-hidden="true" />
            <span>New Cairo, Zayed, North Coast &amp; Red Sea</span>
          </div>
        </Link>
      </section>

      {/* Primary Section: Active Acquisition Pipeline & Conveyance Stepper (matches reference overview.html) */}
      <section className="section-box" aria-label="Acquisition Pipeline">
        <div className="section-header-row">
          <div>
            <h2 className="section-heading">Active Acquisition Pipeline</h2>
            <p className="section-subtext">
              Real-time lifecycle tracking from offer submission to cadastral registration
            </p>
          </div>
          <Link
            href="/buyer/offers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 transition-colors hover:text-brass-600"
          >
            <span>All offers ({liveOffersCount})</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {primaryOffer ? (
          <div className="pipeline-deal-card">
            <div className="deal-info-grid">
              <div className="deal-thumbnail">
                <Image
                  src={primaryOffer.property.imageUrl || "/images/hero.jpg"}
                  alt={primaryOffer.property.title || "Property"}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="deal-content">
                <div className="deal-location">
                  {primaryOffer.property.locationName || "Greater Cairo, Egypt"}
                </div>
                <Link
                  href={`/properties/${primaryOffer.property.slug}`}
                  className="deal-title"
                >
                  {primaryOffer.property.title || "Luxury Residence"}
                </Link>
                <div className="deal-specs">
                  <span>List: {Math.round(primaryOffer.property.price / 100).toLocaleString()} EGP</span>
                  <span>·</span>
                  <span>Offer #{primaryOffer.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>

              <div className="deal-finance">
                <span className="deal-price">
                  {primaryOffer.currentAmount.toLocaleString()} EGP
                </span>
                <span className={`deal-status-pill ${
                  primaryOffer.status === "ACCEPTED"
                    ? "accepted"
                    : primaryOffer.status === "RESERVED"
                    ? "reserved"
                    : "review"
                }`}>
                  {primaryOffer.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* 6-Step Stepper Lifecycle Bar from Reference */}
            <div className="deal-stepper" aria-label="Conveyance progress">
              {[
                { step: 1, title: "Offer Made" },
                { step: 2, title: "Counter" },
                { step: 3, title: "Accepted" },
                { step: 4, title: "Deposit" },
                { step: 5, title: "Reserved" },
                { step: 6, title: "Closing" },
              ].map(({ step, title }) => {
                const isDone = step < currentStageIndex;
                const isCurrent = step === currentStageIndex;
                return (
                  <div key={step} className="step-node">
                    <div
                      className={`step-marker ${
                        isDone ? "done" : isCurrent ? "current" : ""
                      }`}
                    >
                      {isDone ? "✓" : step}
                    </div>
                    <span
                      className={`step-title ${isCurrent ? "current" : ""}`}
                    >
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty Pipeline State with 5-stage Conveyance Educational Track */
          <div className="rounded-xl border border-dashed border-line bg-canvas p-6 text-center space-y-4">
            <div className="max-w-md mx-auto">
              <h3 className="font-display text-base font-bold text-navy-900">
                No Active Purchase Offers
              </h3>
              <p className="mt-1 text-xs text-ink-2">
                When you submit an offer on a property, its full 6-stage conveyance lifecycle, deposit hold deadline, and negotiation diff will appear here.
              </p>
              <Link
                href="/search"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
              >
                <Search className="h-3.5 w-3.5 text-brass" aria-hidden="true" />
                <span>Find a Residence to Offer On</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Split Operational Row: Next Viewing Itinerary (Left) + Command Links & Egyptian Markets (Right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next Viewing Itinerary & Gate Pass Card */}
        <section className="viewing-dossier" aria-label="Viewing Itinerary">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-navy-900" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-navy-900">
                Next Confirmed Tour
              </h2>
            </div>
            <Link
              href="/buyer/viewings"
              className="text-xs font-semibold text-navy-900 hover:text-brass-600"
            >
              All viewings ({upcomingCount})
            </Link>
          </div>

          {primaryViewing ? (
            <div className="space-y-4">
              <div className="viewing-time-banner">
                <span className="viewing-date-text">
                  {new Date(primaryViewing.startsAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="viewing-hour-pill">
                  {new Date(primaryViewing.startsAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}{" "}
                  EET
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-navy-900">
                  {primaryViewing.property.title || "Private Residence"}
                </h3>
                <p className="text-xs text-ink-3">
                  {primaryViewing.property.title || "Greater Cairo"}
                </p>
              </div>

              {/* Gate Pass Code Box (Category 2 reference element) */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF8F4] border border-brass-200">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] font-bold text-ink-3 uppercase tracking-wider block">
                    Security Gate Pass
                  </span>
                  <span className="font-mono text-xs font-extrabold text-navy-900">
                    GATE-EG-{primaryViewing.id.slice(0, 6).toUpperCase()}
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold text-sage bg-sage-bg px-2 py-0.5 rounded-full border border-sage/20">
                  VERIFIED ACCESS
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/buyer/messages"
                  className="btn-advisor-action btn-advisor-msg text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Message Assigned Advisor</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setOpen(primaryViewing)}
                  className="text-xs font-semibold text-navy-900 hover:text-brass-600 underline"
                >
                  View Details &amp; Directions
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-canvas p-8 text-center space-y-2">
              <CalendarDays className="h-8 w-8 text-brass-600 mx-auto" aria-hidden="true" />
              <h3 className="font-display text-sm font-bold text-navy-900">No Tours Scheduled</h3>
              <p className="text-xs text-ink-3 max-w-xs mx-auto">
                Schedule an in-person or physical inspection tour on any verified property listing.
              </p>
              <Link
                href="/search"
                className="mt-3 inline-block rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800"
              >
                Browse Catalog
              </Link>
            </div>
          )}
        </section>

        {/* Right Column: Buyer Quick Navigator & Egyptian Markets */}
        <div className="space-y-6">
          {/* Quick Command Links */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-settly">
            <h3 className="font-display text-base font-bold text-navy-900">
              Buyer Command Links
            </h3>
            <p className="mt-0.5 text-xs text-ink-3">
              Direct access to your transaction records and legal documents
            </p>

            <nav className="mt-4 flex flex-col gap-2" aria-label="Buyer Shortcuts">
              <Link
                href="/buyer/offers"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <HandCoins className="h-4 w-4 text-brass-600" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Purchase Offers</span>
                </div>
                <span className="font-mono text-xs font-bold text-navy-900">
                  {liveOffersCount}
                </span>
              </Link>

              <Link
                href="/buyer/documents"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-brass-600" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Transaction Documents &amp; Vault</span>
                </div>
                <span className="font-mono text-[10px] text-sage font-bold">
                  FRA SECURE
                </span>
              </Link>

              <Link
                href="/buyer/viewings?tab=pending"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-brass-600" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Pending Tour Requests</span>
                </div>
                <span className="font-mono text-xs font-bold text-navy-900">
                  {pendingCount}
                </span>
              </Link>

              <Link
                href="/buyer/settings"
                className="flex items-center justify-between rounded-xl border border-line p-3 transition-all hover:border-line-2 hover:bg-canvas"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-sage" aria-hidden="true" />
                  <span className="text-xs font-semibold text-navy-900">Account &amp; Security</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-ink-3" aria-hidden="true" />
              </Link>
            </nav>
          </div>

          {/* Prime Egypt Destinations */}
          <div className="rounded-2xl border border-line bg-navy-900 p-5 text-white shadow-settly">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brass" aria-hidden="true" />
                <h3 className="font-display text-base font-bold">Egyptian Residential Markets</h3>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-brass">
                VERIFIED
              </span>
            </div>
            <p className="mt-1 text-xs text-white/70">
              Direct filter into high-demand residential districts
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { name: "New Cairo", slug: "new-cairo" },
                { name: "Sheikh Zayed", slug: "sheikh-zayed" },
                { name: "North Coast", slug: "north-coast" },
                { name: "El Gouna", slug: "el-gouna" },
                { name: "New Capital", slug: "new-capital" },
              ].map((area) => (
                <Link
                  key={area.slug}
                  href={`/search?area=${area.slug}`}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/90 transition-colors hover:border-brass hover:bg-white/10"
                >
                  {area.name}
                </Link>
              ))}
            </div>

            <Link
              href="/search"
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-brass px-3 py-2 text-xs font-bold text-navy-950 transition-colors hover:bg-brass-light"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Explore All Listings</span>
            </Link>
          </div>
        </div>
      </div>

      <ViewingDrawer viewing={open} view="buyer" onClose={() => setOpen(null)} />
    </div>
  );
}
