"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Phone,
  ShieldAlert,
  X,
} from "lucide-react";
import type { Offer } from "@/api/offers";
import { problemMessage } from "@/api/errors";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toaster";
import {
  useAcceptOffer,
  useCounterOffer,
  useRejectOffer,
  useWithdrawOffer,
} from "@/lib/query/offers";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import { OfferStatusBadge } from "./OfferParts";
import { SaleCompletionCard } from "./SaleCompletionCard";

type ModalMode = null | "counter" | "reject" | "withdraw" | "deposit";

export function OfferDrawer({
  offer,
  view,
  onClose,
}: {
  offer: Offer | null;
  view: "buyer" | "agent";
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ModalMode>(null);
  const [reason, setReason] = useState("");
  const [counterAmount, setCounterAmount] = useState<string>("");
  const [counterEarnest, setCounterEarnest] = useState<string>("");
  const [counterConditions, setCounterConditions] = useState<string>("");

  const acceptMutation = useAcceptOffer();
  const counterMutation = useCounterOffer();
  const rejectMutation = useRejectOffer();
  const withdrawMutation = useWithdrawOffer();

  useEffect(() => {
    setMode(null);
    setReason("");
    setCounterAmount("");
    setCounterEarnest("");
    setCounterConditions("");
  }, [offer?.id]);

  useEffect(() => {
    if (!offer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [offer, onClose]);

  if (!offer) return null;

  const isDepositDue = offer.status === "ACCEPTED" && offer.depositDeadlineAt;
  const deadlineDate = isDepositDue ? new Date(offer.depositDeadlineAt!) : null;
  const hoursLeft = deadlineDate
    ? Math.max(0, Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;

  const handleAccept = () => {
    acceptMutation.mutate(offer.id, {
      onSuccess: () => {
        toast.success("Offer accepted successfully");
        onClose();
      },
      onError: (err) => {
        toast.error(problemMessage(err));
      },
    });
  };

  const handleCounter = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(counterAmount);
    if (!amount || amount < 100_000) return;

    counterMutation.mutate(
      {
        id: offer.id,
        input: {
          amount,
          earnestMoney: counterEarnest ? Number(counterEarnest) : undefined,
          conditions: counterConditions.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Counter-offer submitted");
          setMode(null);
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    rejectMutation.mutate(
      { id: offer.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Offer declined");
          setMode(null);
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    withdrawMutation.mutate(
      { id: offer.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Offer withdrawn");
          setMode(null);
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const canBuyerAction =
    view === "buyer" &&
    (offer.status === "PENDING_BUYER" ||
      offer.status === "PENDING_AGENT" ||
      offer.status === "ACCEPTED");

  const canAgentAction =
    view === "agent" && offer.status === "PENDING_AGENT";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-drawer-title"
      className="fixed inset-0 z-40 flex justify-end bg-navy-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col border-l border-line bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id="offer-drawer-title" className="font-display text-lg text-navy-900">
              Offer Details
            </h2>
            <p className="text-xs text-ink-3">
              Submitted on {new Date(offer.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-canvas hover:text-navy-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 p-5">
          {/* Property Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-line bg-canvas p-3">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas-2">
              <Image
                src={offer.property.imageUrl ?? PLACEHOLDER_PROPERTY_IMAGE}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/properties/${offer.property.slug}`}
                className="inline-flex items-center gap-1 font-semibold text-sm text-navy-900 hover:underline"
              >
                <span className="truncate">{offer.property.title ?? "Property"}</span>
                <ExternalLink className="h-3 w-3 text-ink-3 shrink-0" aria-hidden />
              </Link>
              <div className="font-mono text-xs text-ink-3">
                Listing Price: {offer.property.price.toLocaleString("en-US")} EGP
              </div>
            </div>
          </div>

          {/* Current Status and Amount Summary */}
          <div className="rounded-xl border border-line bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                Status
              </span>
              <OfferStatusBadge status={offer.status} />
            </div>

            <div className="flex items-baseline justify-between border-t border-line/60 pt-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-3">
                Current Offer
              </span>
              <span className="font-mono text-2xl font-bold text-navy-900">
                {offer.currentAmount.toLocaleString("en-US")} EGP
              </span>
            </div>

            {offer.depositAmount > 0 && (
              <div className="flex items-center justify-between text-xs text-ink-2">
                <span>5% Reservation Deposit:</span>
                <span className="font-mono font-bold text-brass-600">
                  {offer.depositAmount.toLocaleString("en-US")} EGP
                </span>
              </div>
            )}
          </div>

          {/* Deposit Deadline Alert for ACCEPTED */}
          {isDepositDue && hoursLeft !== null && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Clock className="h-4 w-4" aria-hidden />
                <span>Deposit Deadline: {hoursLeft} hours remaining</span>
              </div>
              <p className="text-amber-700">
                This offer has been accepted! To lock in the property, the 5% reservation deposit of{" "}
                <span className="font-mono font-bold text-navy-900">
                  {offer.depositAmount.toLocaleString("en-US")} EGP
                </span>{" "}
                must be paid within the 72-hour window.
              </p>
              {view === "buyer" && (
                <Link
                  href={`/buyer/offers/${offer.id}/deposit`}
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-brass hover:bg-brass-600 text-navy-900 font-bold text-sm transition-colors shadow-sm"
                >
                  Pay Reservation Deposit
                </Link>
              )}
            </div>
          )}

          {/* Sale Completion & Conveyance Section (BUY-10, AGT-07) */}
          <SaleCompletionCard offer={offer} view={view} onUpdated={onClose} />

          {/* Rejection / Withdrawal Reason notice */}
          {offer.rejectionReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <div className="font-semibold">Reason for decline:</div>
              <p className="mt-1 text-red-700">{offer.rejectionReason}</p>
            </div>
          )}
          {offer.withdrawalReason && (
            <div className="rounded-xl border border-line bg-canvas p-3.5 text-xs text-ink-2">
              <div className="font-semibold">Reason for withdrawal:</div>
              <p className="mt-1 text-ink-3">{offer.withdrawalReason}</p>
            </div>
          )}

          {/* Parties involved */}
          <div className="rounded-xl border border-line bg-canvas p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-ink-3">Buyer:</span>
              <span className="font-semibold text-navy-900">{offer.buyer.name}</span>
            </div>
            {view === "agent" && offer.buyer.phone && (
              <div className="flex justify-between items-center">
                <span className="text-ink-3">Buyer Contact:</span>
                <a
                  href={`tel:${offer.buyer.phone}`}
                  className="flex items-center gap-1 font-mono font-bold text-brass-600 hover:underline"
                >
                  <Phone className="h-3 w-3" aria-hidden />
                  {offer.buyer.phone}
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-3">Listing Agent:</span>
              <span className="font-semibold text-navy-900">{offer.agent.name}</span>
            </div>
          </div>

          {/* Negotiation Revision Thread */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-900">
              <History className="h-4 w-4 text-brass-600" aria-hidden />
              <span>Negotiation History ({offer.revisions.length} {offer.revisions.length === 1 ? "revision" : "revisions"})</span>
            </div>

            <div className="relative space-y-3 pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
              {[...offer.revisions].reverse().map((rev) => (
                <div
                  key={rev.id}
                  className="relative rounded-lg border border-line bg-white p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-900">
                      Revision #{rev.revisionNumber} ({rev.actorRole === "BUYER" ? "Buyer" : "Agent"})
                    </span>
                    <span className="font-mono text-[11px] text-ink-3">
                      {new Date(rev.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="font-mono text-sm font-bold text-navy-900">
                    {rev.amount.toLocaleString("en-US")} EGP
                  </div>

                  {rev.earnestMoney && (
                    <div className="text-[11px] text-ink-2">
                      Earnest money: <span className="font-mono font-semibold">{rev.earnestMoney.toLocaleString("en-US")} EGP</span>
                    </div>
                  )}

                  {rev.conditions && (
                    <div className="pt-1 text-[11px] italic text-ink-3 border-t border-line/40">
                      &quot;{rev.conditions}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        {(canBuyerAction || canAgentAction) && (
          <div className="border-t border-line bg-canvas p-4 space-y-2">
            {/* Agent Actions on PENDING_AGENT */}
            {view === "agent" && offer.status === "PENDING_AGENT" && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleAccept}
                  isLoading={acceptMutation.isPending}
                  className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2.5"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-400" aria-hidden />
                  Accept Offer ({offer.currentAmount.toLocaleString("en-US")} EGP)
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCounterAmount(String(offer.currentAmount));
                      setMode("counter");
                    }}
                    className="flex-1"
                  >
                    Counter-Offer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMode("reject")}
                    className="flex-1 text-error hover:bg-red-50"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* Buyer Actions on PENDING_BUYER */}
            {view === "buyer" && offer.status === "PENDING_BUYER" && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleAccept}
                  isLoading={acceptMutation.isPending}
                  className="w-full bg-brass hover:bg-brass-600 text-navy-900 font-bold py-2.5"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden />
                  Accept Counter ({offer.currentAmount.toLocaleString("en-US")} EGP)
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCounterAmount(String(offer.currentAmount));
                      setMode("counter");
                    }}
                    className="flex-1"
                  >
                    Counter Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setMode("withdraw")}
                    className="flex-1 text-ink-3 hover:bg-canvas"
                  >
                    Withdraw
                  </Button>
                </div>
              </div>
            )}

            {/* Buyer Actions on PENDING_AGENT or ACCEPTED */}
            {view === "buyer" &&
              (offer.status === "PENDING_AGENT" || offer.status === "ACCEPTED") && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setMode("withdraw")}
                    className="w-full text-ink-3 hover:text-error hover:bg-red-50"
                  >
                    Withdraw this offer
                  </Button>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Counter Offer Modal */}
      {mode === "counter" && (
        <Modal
          isOpen={true}
          onClose={() => setMode(null)}
          title="Submit Counter-Offer"
          description={`Revise the price and terms for ${offer.property.title ?? "this listing"}`}
          maxWidth="md"
        >
          <form onSubmit={handleCounter} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900">
                Revised Price (EGP) <span className="text-error">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min={100_000}
                  step={10_000}
                  required
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2 font-mono text-base font-bold text-navy-900 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                />
                <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-xs font-semibold text-ink-3">
                  EGP
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900">
                Earnest Money / Down Payment (EGP) <span className="text-xs font-normal text-ink-3">(Optional)</span>
              </label>
              <input
                type="number"
                min={0}
                step={10_000}
                value={counterEarnest}
                onChange={(e) => setCounterEarnest(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 font-mono text-sm text-navy-900 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900">
                Adjusted Terms / Note <span className="text-xs font-normal text-ink-3">(Optional)</span>
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={counterConditions}
                onChange={(e) => setCounterConditions(e.target.value)}
                placeholder="Explain the rationale or revised contingencies..."
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-navy-900 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setMode(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={counterMutation.isPending}
                disabled={!counterAmount || Number(counterAmount) < 100_000}
                className="bg-navy-900 hover:bg-navy-800 text-white"
              >
                Send Counter-Offer
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Offer Modal */}
      {mode === "reject" && (
        <Modal
          isOpen={true}
          onClose={() => setMode(null)}
          title="Decline Offer"
          description="Are you sure you want to decline this offer? The buyer will be notified."
          maxWidth="sm"
        >
          <form onSubmit={handleReject} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900">
                Reason for declining <span className="text-xs font-normal text-ink-3">(Optional)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Price is below seller's threshold, closing date too late..."
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-navy-900 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMode(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={rejectMutation.isPending}
                className="bg-error hover:bg-red-700 text-white"
              >
                Confirm Decline
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Withdraw Offer Modal */}
      {mode === "withdraw" && (
        <Modal
          isOpen={true}
          onClose={() => setMode(null)}
          title="Withdraw Offer"
          description="Are you sure you want to withdraw your offer? This action is permanent."
          maxWidth="sm"
        >
          <form onSubmit={handleWithdraw} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy-900">
                Reason for withdrawing <span className="text-xs font-normal text-ink-3">(Optional)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Found another property, changed budget..."
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-navy-900 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMode(null)}>
                Keep Offer
              </Button>
              <Button
                type="submit"
                isLoading={withdrawMutation.isPending}
                className="bg-error hover:bg-red-700 text-white"
              >
                Confirm Withdrawal
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Deposit Information Modal */}
      {mode === "deposit" && (
        <Modal
          isOpen={true}
          onClose={() => setMode(null)}
          title="Pay Reservation Deposit"
          description="Secure your accepted property with a 5% reservation deposit"
          maxWidth="md"
        >
          <div className="space-y-4 pt-2 text-sm text-ink-2">
            <div className="rounded-xl border border-line bg-canvas p-4 space-y-2">
              <div className="flex justify-between">
                <span>Offer agreed price:</span>
                <span className="font-mono font-bold text-navy-900">
                  {offer.currentAmount.toLocaleString("en-US")} EGP
                </span>
              </div>
              <div className="flex justify-between text-navy-900 font-bold border-t border-line/60 pt-2">
                <span>5% Deposit amount (capped):</span>
                <span className="font-mono text-brass-600">
                  {offer.depositAmount.toLocaleString("en-US")} EGP
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 rounded-xl border border-line bg-brass-050/60 p-3 text-xs text-navy-900">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 text-brass-600 mt-0.5" aria-hidden />
              <p>
                Deposit is processed via Paymob hosted redirect with an exclusive 15-minute checkout hold
                and 48-hour cooling-off full refund guarantee.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setMode(null)} variant="outline">
                Cancel
              </Button>
              <Link
                href={`/buyer/offers/${offer.id}/deposit`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brass hover:bg-brass-600 text-navy-900 font-bold text-sm transition-colors"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
