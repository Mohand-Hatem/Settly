"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  HelpCircle,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { Offer } from "@/api/offers";
import { problemMessage } from "@/api/errors";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import {
  useConfirmSaleMutation,
  useDisputeSaleMutation,
} from "@/lib/query/sales";

interface SaleCompletionCardProps {
  offer: Offer;
  view: "buyer" | "agent";
  onUpdated?: () => void;
}

export function SaleCompletionCard({
  offer,
  view,
  onUpdated,
}: SaleCompletionCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const confirmMutation = useConfirmSaleMutation();
  const disputeMutation = useDisputeSaleMutation();

  const isReserved = offer.status === "RESERVED";
  const isCompleted = offer.status === "COMPLETED";
  const isFellThrough = offer.status === "FELL_THROUGH";

  if (!isReserved && !isCompleted && !isFellThrough) {
    return null;
  }

  // 1. Calculations for 30-day review period
  const reservationDate = offer.acceptedAt ? new Date(offer.acceptedAt) : null;
  const deadlineDate = offer.adminReviewDeadline
    ? new Date(offer.adminReviewDeadline)
    : reservationDate
    ? new Date(reservationDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;

  const now = new Date();
  const daysElapsed = reservationDate
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - reservationDate.getTime()) / (24 * 60 * 60 * 1000)
        )
      )
    : 0;

  const daysRemaining = deadlineDate
    ? Math.max(
        0,
        Math.ceil(
          (deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        )
      )
    : 30;

  const timelinePercent = Math.min(100, Math.round((daysElapsed / 30) * 100));

  // 2. Party Confirmation status
  const buyerConfirmed = Boolean(offer.buyerConfirmedAt);
  const agentConfirmed = Boolean(offer.agentConfirmedAt);
  const isDisputed = Boolean(offer.disputedAt);

  const currentUserConfirmed =
    view === "buyer" ? buyerConfirmed : agentConfirmed;

  const handleConfirmSubmit = () => {
    confirmMutation.mutate(
      { offerId: offer.id },
      {
        onSuccess: () => {
          toast.success(
            buyerConfirmed || agentConfirmed
              ? "Both parties confirmed! Sale successfully completed and property marked SOLD."
              : "Your sale confirmation was recorded. Waiting for the counterparty to confirm."
          );
          setShowConfirmModal(false);
          setConfirmChecked(false);
          onUpdated?.();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disputeReason.trim().length < 10) return;

    disputeMutation.mutate(
      { offerId: offer.id, input: { reason: disputeReason.trim() } },
      {
        onSuccess: () => {
          toast.success(
            "Dispute reported. The transaction has entered Settly Admin Review."
          );
          setShowDisputeModal(false);
          setDisputeReason("");
          onUpdated?.();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  // RENDER: Completed State
  if (isCompleted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden />
          <span className="font-bold text-sm text-emerald-900">
            Sale Completed — Property SOLD
          </span>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          Both the buyer and the listing agent have verified legal conveyance,
          notary contract signatures, and physical property handover. This
          listing has officially transitioned to <strong>SOLD</strong>.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900">
          <div>
            <span className="text-emerald-700">Buyer Confirmed:</span>{" "}
            <span className="font-mono font-semibold">
              {offer.buyerConfirmedAt
                ? new Date(offer.buyerConfirmedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Admin Verified"}
            </span>
          </div>
          <div>
            <span className="text-emerald-700">Agent Confirmed:</span>{" "}
            <span className="font-mono font-semibold">
              {offer.agentConfirmedAt
                ? new Date(offer.agentConfirmedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Admin Verified"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Fell-Through State
  if (isFellThrough) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" aria-hidden />
          <span className="font-bold text-sm text-red-900">
            Sale Fell Through
          </span>
        </div>
        <p className="text-xs text-red-800 leading-relaxed">
          This transaction concluded without sale completion. The property has
          returned to <strong>PUBLISHED</strong> status, and reservation deposit
          refund determinations have been logged per §7 Business Rules.
        </p>
        {offer.adminReviewNotes && (
          <div className="rounded-lg bg-white/80 p-2.5 text-xs text-ink-2 border border-red-200/40">
            <span className="font-semibold text-ink-1">Admin Notes: </span>
            {offer.adminReviewNotes}
          </div>
        )}
      </div>
    );
  }

  // RENDER: Active Reserved State (Two-Party Confirmation Flow)
  return (
    <div className="rounded-xl border border-brass-200 bg-canvas p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-brass-600" aria-hidden />
          <h4 className="font-bold text-xs uppercase tracking-wider text-navy-900">
            Conveyance & Closing Progress
          </h4>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-brass-100 text-brass-800">
          RESERVED
        </span>
      </div>

      {/* Two-Party Confirmation Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Buyer Step */}
        <div
          className={`rounded-lg border p-2.5 transition-colors ${
            buyerConfirmed
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
              : "border-line bg-white text-ink-2"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">Buyer</span>
            {buyerConfirmed ? (
              <CheckCircle2
                className="h-4 w-4 text-emerald-600"
                aria-hidden
              />
            ) : (
              <Clock className="h-4 w-4 text-ink-4" aria-hidden />
            )}
          </div>
          <div className="text-[11px] text-ink-3">
            {buyerConfirmed
              ? `Confirmed ${new Date(
                  offer.buyerConfirmedAt!
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`
              : "Awaiting confirmation"}
          </div>
        </div>

        {/* Agent Step */}
        <div
          className={`rounded-lg border p-2.5 transition-colors ${
            agentConfirmed
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-900"
              : "border-line bg-white text-ink-2"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">Listing Agent</span>
            {agentConfirmed ? (
              <CheckCircle2
                className="h-4 w-4 text-emerald-600"
                aria-hidden
              />
            ) : (
              <Clock className="h-4 w-4 text-ink-4" aria-hidden />
            )}
          </div>
          <div className="text-[11px] text-ink-3">
            {agentConfirmed
              ? `Confirmed ${new Date(
                  offer.agentConfirmedAt!
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`
              : "Awaiting confirmation"}
          </div>
        </div>
      </div>

      {/* Invariant #102 Notice */}
      <div className="rounded-lg bg-white border border-line/60 p-2.5 text-[11px] text-ink-2 leading-relaxed">
        <strong>Dual Confirmation Rule (#77, #102):</strong> The property will
        remain reserved until <em>both</em> the buyer and listing agent certify
        completion. An agent can never mark a listing sold alone.
      </div>

      {/* 30-Day Timeline Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 text-ink-3">
            <Calendar className="h-3 w-3" aria-hidden />
            Day {daysElapsed} of 30
          </span>
          <span
            className={`font-semibold ${
              daysRemaining <= 5 ? "text-red-600" : "text-ink-2"
            }`}
          >
            {daysRemaining} {daysRemaining === 1 ? "day" : "days"} before Admin
            Review
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              daysRemaining <= 5 ? "bg-red-500" : "bg-brass"
            }`}
            style={{ width: `${timelinePercent}%` }}
          />
        </div>
      </div>

      {/* Dispute Alert Banner if Disputed */}
      {isDisputed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldAlert className="h-4 w-4 text-amber-700" aria-hidden />
            Case in Settly Admin Review
          </div>
          <p className="text-[11px] text-amber-800">
            A delay or dispute was reported: &quot;{offer.disputeReason}&quot;.
            An administrator is adjudicating this transaction.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col gap-2">
        {!currentUserConfirmed ? (
          <Button
            onClick={() => setShowConfirmModal(true)}
            className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5 text-xs shadow-sm"
          >
            <KeyRound className="mr-1.5 h-3.5 w-3.5 text-brass" aria-hidden />
            Confirm Sale Completion ({view === "buyer" ? "Buyer" : "Agent"})
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
            You have confirmed completion. Waiting for{" "}
            {view === "buyer" ? "agent" : "buyer"}.
          </div>
        )}

        {!isDisputed && (
          <button
            type="button"
            onClick={() => setShowDisputeModal(true)}
            className="text-[11px] text-ink-3 hover:text-red-700 transition-colors text-center underline self-center pt-1"
          >
            Report conveyance dispute or delay
          </button>
        )}
      </div>

      {/* MODAL 1: Confirm Completion */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Sale Completion"
      >
        <div className="space-y-4 text-sm text-ink-2">
          <p>
            By confirming completion as the{" "}
            <strong>{view === "buyer" ? "buyer" : "listing agent"}</strong>, you
            certify under Settly terms of service that:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-ink-2">
            <li>Official notary deed and sales contracts have been executed.</li>
            <li>Full agreed purchase funds have been transferred to seller.</li>
            <li>Physical keys and possession have been delivered.</li>
          </ul>

          <div className="rounded-lg bg-canvas border border-line p-3 text-xs text-ink-3 flex items-start gap-2">
            <HelpCircle className="h-4 w-4 text-brass-600 shrink-0 mt-0.5" />
            <span>
              If the counterparty has already confirmed, the listing will
              immediately become <strong>SOLD</strong>. Otherwise, this
              deal waits for their final confirmation.
            </span>
          </div>

          <label className="flex items-start gap-2 pt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-brass focus:ring-brass"
            />
            <span className="text-xs text-navy-900 font-medium select-none">
              I verify and certify that the conveyance process is 100% complete.
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-line">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!confirmChecked}
              isLoading={confirmMutation.isPending}
              onClick={handleConfirmSubmit}
              className="bg-navy-900 text-white font-semibold"
            >
              Submit Confirmation
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Report Dispute */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        title="Report Conveyance Dispute / Delay"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4 text-sm text-ink-2">
          <p className="text-xs text-ink-3">
            If title issues, registry delays, or disagreements occur during the
            conveyance period, reporting a dispute escalates this deal directly to
            the <strong>Settly Admin Review Queue</strong> (`ADM-07`).
          </p>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-navy-900">
              Dispute or Delay Details (min 10 characters)
            </label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain the specific issue (e.g., notary appointment postponed, missing clearance certificate, seller requested extra time)..."
              className="w-full rounded-xl border border-line bg-white p-3 text-xs text-navy-900 placeholder:text-ink-4 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowDisputeModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={disputeMutation.isPending}
              disabled={disputeReason.trim().length < 10}
              className="bg-red-700 hover:bg-red-800 text-white font-semibold"
            >
              Escalate to Admin Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
