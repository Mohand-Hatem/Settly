"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, MessageSquare, Phone } from "lucide-react";
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
  const isCounterAction = offer.status === "PENDING_BUYER";
  const deadlineDate = isDepositDue
    ? new Date(offer.depositDeadlineAt!)
    : offer.expiresAt
    ? new Date(offer.expiresAt)
    : null;

  const hoursLeft = deadlineDate
    ? Math.max(0, Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

  const offerCode = `OFFER #${offer.id.slice(0, 8).toUpperCase()}`;
  const submittedDate = new Date(offer.createdAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="deal-card" data-status={offer.status}>
      {/* Deal Card Header */}
      <div className="deal-card-header">
        <div className="deal-meta-left">
          <span className="offer-id-code">{offerCode}</span>
          <span>
            Submitted: <strong>{submittedDate}</strong>
          </span>
          <span>·</span>
          <span>
            Corridor: <strong>{offer.property.locationName || "Greater Cairo"}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hoursLeft !== null && (isDepositDue || isCounterAction) && (
            <div className="countdown-timer-wrap">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isDepositDue
                  ? `${hoursLeft}H Remaining for Deposit`
                  : `${hoursLeft}H Remaining to Respond`}
              </span>
            </div>
          )}
          <OfferStatusBadge status={offer.status} />
        </div>
      </div>

      {/* Deal Body Grid */}
      <div className="deal-body-grid">
        {/* Column 1: Property Thumbnail */}
        <div className="property-thumb-box">
          <Image
            src={offer.property.imageUrl ?? PLACEHOLDER_PROPERTY_IMAGE}
            alt={offer.property.title ?? "Property"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 260px"
          />
          <span className="compound-badge">
            {offer.property.locationName || "Verified Listing"}
          </span>
        </div>

        {/* Column 2: Information & Financials */}
        <div className="deal-info-col">
          <div>
            <span className="prop-corridor-tag">
              {offer.property.locationName || "Prime Corridor"}
            </span>
            <h3 className="mt-1">
              <Link
                href={`/properties/${offer.property.slug}`}
                className="prop-heading hover:underline"
              >
                {offer.property.title ?? "Acquisition Residence"}
              </Link>
            </h3>
            <div className="prop-specs-line mt-1.5">
              <span>
                Asking Price:{" "}
                <strong className="text-navy-900 font-mono">
                  {offer.property.price.toLocaleString("en-US")} EGP
                </strong>
              </span>
              <span>·</span>
              <span>Revision #{offer.latestRevision.revisionNumber}</span>
            </div>
          </div>

          {/* Financial Comparison Matrix */}
          <div className="financial-matrix-box">
            <div className="fin-item">
              <span className="fin-item-label">
                {view === "buyer" ? "Your Offer" : "Buyer Proposal"}
              </span>
              <span className="fin-item-val">
                {offer.currentAmount.toLocaleString("en-US")} EGP
              </span>
              <span className="fin-item-note">
                {diffFromListing > 0 ? "+" : ""}
                {diffFromListing.toFixed(1)}% vs Asking
              </span>
            </div>

            <div className="fin-item">
              <span className="fin-item-label">Listing Ask</span>
              <span className="fin-item-val text-ink-2">
                {offer.property.price.toLocaleString("en-US")} EGP
              </span>
              <span className="fin-item-note">Developer/Seller Baseline</span>
            </div>

            <div className="fin-item">
              <span className="fin-item-label">Reservation Deposit</span>
              <span className="fin-item-val highlight-counter">
                {offer.depositAmount.toLocaleString("en-US")} EGP
              </span>
              <span className="fin-item-note">5% Capped Deposit</span>
            </div>
          </div>

          {/* Counter-Offer or Deposit Alert Notice */}
          {isCounterAction && (
            <div className="counter-offer-alert-box">
              <div className="counter-alert-content">
                <Clock className="w-4 h-4 text-brass-600 shrink-0" aria-hidden="true" />
                <span>
                  {offer.latestRevision.conditions ||
                    "Counter-offer proposal received. Review updated valuation terms before window expires."}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpen}
                className="btn btn-sm btn-brass shrink-0"
              >
                Review &amp; Respond
              </button>
            </div>
          )}

          {isDepositDue && (
            <div className="rounded-lg border border-sage/30 bg-sage-bg p-3 text-xs text-sage flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage shrink-0" />
                <span>
                  Offer Accepted! Complete the {offer.depositAmount.toLocaleString("en-US")} EGP reservation deposit via Paymob sandbox to secure reservation.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpen}
                className="btn btn-sm btn-sage shrink-0"
              >
                Pay Deposit
              </button>
            </div>
          )}

          {/* Contingency Strip */}
          <div className="contingency-strip">
            <span className="contingency-item">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage" aria-hidden="true" />
              <span>Identity Verified</span>
            </span>
            <span className="contingency-item">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage" aria-hidden="true" />
              <span>48h 100% Refund Window</span>
            </span>
            <span className="contingency-item">
              <CheckCircle2 className="w-3.5 h-3.5 text-sage" aria-hidden="true" />
              <span>FRA Regulatory Standard</span>
            </span>
          </div>
        </div>

        {/* Column 3: Fiduciary Desk & Action Column */}
        <div className="deal-action-col">
          <div className="broker-lead-card">
            <div className="w-10 h-10 rounded-full border border-brass bg-navy-800 text-brass flex items-center justify-center font-mono font-bold text-xs shrink-0">
              {(view === "agent" ? offer.buyer.name : offer.agent.name)
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="broker-details min-w-0">
              <span className="broker-name truncate">
                {view === "agent" ? offer.buyer.name : offer.agent.name}
              </span>
              <span className="broker-license">
                {view === "agent" ? "Registered Buyer" : "Licensed Property Advisor"}
              </span>
            </div>
          </div>

          <div className="escrow-deposit-meter">
            <div className="escrow-meter-top">
              <span>Reservation Deposit</span>
              <strong>{offer.depositAmount.toLocaleString("en-US")} EGP</strong>
            </div>
            <div className="escrow-bar-track">
              <div
                className="escrow-bar-fill"
                style={{
                  width:
                    offer.status === "RESERVED" || offer.status === "COMPLETED"
                      ? "100%"
                      : offer.status === "ACCEPTED"
                      ? "60%"
                      : "25%",
                }}
              />
            </div>
            <span className="text-[10px] text-ink-3">
              {offer.status === "RESERVED"
                ? "Deposit Secured & Held"
                : "Secured under 48h Refund Terms"}
            </span>
          </div>

          <div className="deal-ctas-stack">
            <button
              type="button"
              onClick={onOpen}
              className={`btn ${
                isCounterAction
                  ? "btn-brass"
                  : isDepositDue
                  ? "btn-sage"
                  : "btn-primary"
              }`}
            >
              <span>
                {isCounterAction
                  ? "Review Counter-Offer"
                  : isDepositDue
                  ? "Pay Reservation Deposit"
                  : "View Deal Details"}
              </span>
            </button>

            {view === "buyer" ? (
              <Link href="/buyer/messages" className="btn btn-outline text-xs py-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Advisor</span>
              </Link>
            ) : (
              offer.buyer.phone && (
                <div className="flex items-center justify-center gap-1.5 font-mono text-xs text-ink-2 py-2">
                  <Phone className="w-3.5 h-3.5 text-brass-600" />
                  <span>{offer.buyer.phone}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </article>
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
