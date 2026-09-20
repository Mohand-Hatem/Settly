"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, HandCoins, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { problemMessage } from "@/api/errors";
import { useCreateOffer } from "@/lib/query/offers";

export interface MakeOfferModalProps {
  propertyId: string;
  propertyTitle: string;
  listingPriceEgp: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MakeOfferModal({
  propertyId,
  propertyTitle,
  listingPriceEgp,
  isOpen,
  onClose,
}: MakeOfferModalProps) {
  const [amountStr, setAmountStr] = useState<string>("");
  const [earnestMoneyStr, setEarnestMoneyStr] = useState<string>("");
  const [conditions, setConditions] = useState<string>("");
  const [proposedClosingDate, setProposedClosingDate] = useState<string>("");

  const amountId = useId();
  const earnestId = useId();
  const conditionsId = useId();
  const closingDateId = useId();

  const createOfferMutation = useCreateOffer();

  useEffect(() => {
    if (isOpen) {
      setAmountStr(listingPriceEgp ? String(listingPriceEgp) : "");
      setEarnestMoneyStr("");
      setConditions("");
      setProposedClosingDate("");
      createOfferMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, listingPriceEgp]);

  const amount = Number(amountStr) || 0;
  const earnestMoney = earnestMoneyStr ? Number(earnestMoneyStr) : undefined;

  const priceDiff = useMemo(() => {
    if (!amount || !listingPriceEgp) return null;
    const diff = amount - listingPriceEgp;
    const pct = (diff / listingPriceEgp) * 100;
    return { diff, pct };
  }, [amount, listingPriceEgp]);

  const estimatedDeposit = useMemo(() => {
    if (!amount) return 0;
    return Math.min(50_000, Math.round(amount * 0.05));
  }, [amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 100_000) return;

    createOfferMutation.mutate({
      propertyId,
      amount,
      earnestMoney: earnestMoney && earnestMoney > 0 ? earnestMoney : undefined,
      conditions: conditions.trim() || undefined,
      proposedClosingDate: proposedClosingDate
        ? new Date(proposedClosingDate).toISOString()
        : undefined,
    });
  };

  if (createOfferMutation.isSuccess) {
    const created = createOfferMutation.data;
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Offer Submitted" maxWidth="md">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-bg text-sage">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h3 className="font-display text-xl text-navy-900">Offer received</h3>
            <p className="mt-1 text-sm text-ink-2">
              Your offer of{" "}
              <span className="font-mono font-bold text-navy-900">
                {created?.currentAmount?.toLocaleString("en-US")} EGP
              </span>{" "}
              has been transmitted to the listing agent for review.
            </p>
          </div>

          <div className="w-full rounded-xl border border-line bg-canvas p-4 text-left text-xs text-ink-2 space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold">Initial Status:</span>
              <span className="font-mono font-bold text-navy-800">Pending Agent Review</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Deposit upon acceptance:</span>
              <span className="font-mono font-bold text-brass-600">
                {created?.depositAmount?.toLocaleString("en-US")} EGP
              </span>
            </div>
            <p className="pt-2 text-[11px] text-ink-3">
              The agent will accept, counter, or decline. If accepted, you will have 72 hours to
              secure the property by paying the reservation deposit.
            </p>
          </div>

          <div className="mt-2 flex w-full gap-2">
            <Link
              href="/buyer/offers"
              className="flex-1 rounded-lg bg-navy-900 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              View in My Offers
            </Link>
            <Button variant="outline" onClick={onClose} className="px-4">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Make a Purchase Offer"
      description={`Submit an official offer for ${propertyTitle}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Asking price reference */}
        <div className="flex items-center justify-between rounded-xl border border-line bg-canvas p-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-ink-3">Listing Price</span>
            <div className="font-mono text-base font-bold text-navy-900">
              {listingPriceEgp ? `${listingPriceEgp.toLocaleString("en-US")} EGP` : "—"}
            </div>
          </div>
          {priceDiff && priceDiff.diff !== 0 && (
            <div
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                priceDiff.diff > 0
                  ? "bg-sage-bg text-sage"
                  : "bg-brass-050 text-brass-600"
              }`}
            >
              {priceDiff.diff > 0 ? "+" : ""}
              {priceDiff.pct.toFixed(1)}% vs asking
            </div>
          )}
        </div>

        {/* Offer Amount */}
        <div>
          <label htmlFor={amountId} className="block text-xs font-bold uppercase tracking-wider text-navy-900">
            Offer Amount (EGP) <span className="text-error">*</span>
          </label>
          <div className="relative mt-1">
            <input
              id={amountId}
              type="number"
              min={100_000}
              step={10_000}
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g. 7500000"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-base font-bold text-navy-900 placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-ink-3 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
            />
            <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-xs font-semibold text-ink-3">
              EGP
            </span>
          </div>
          <span className="mt-1 block text-xs text-ink-3">
            Minimum offer: 100,000 EGP. Whole numbers only.
          </span>
        </div>

        {/* Earnest Money / Down payment */}
        <div>
          <label htmlFor={earnestId} className="block text-xs font-bold uppercase tracking-wider text-navy-900">
            Earnest Money / Down Payment (EGP) <span className="text-xs font-normal text-ink-3">(Optional)</span>
          </label>
          <div className="relative mt-1">
            <input
              id={earnestId}
              type="number"
              min={0}
              step={10_000}
              value={earnestMoneyStr}
              onChange={(e) => setEarnestMoneyStr(e.target.value)}
              placeholder="e.g. 1500000"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm font-semibold text-navy-900 placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-ink-3 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
            />
            <span className="pointer-events-none absolute right-3 top-2.5 font-mono text-xs font-semibold text-ink-3">
              EGP
            </span>
          </div>
          <span className="mt-1 block text-xs text-ink-3">
            Upfront cash component proposed to strengthen your offer.
          </span>
        </div>

        {/* Proposed closing date */}
        <div>
          <label htmlFor={closingDateId} className="block text-xs font-bold uppercase tracking-wider text-navy-900">
            Target Closing Date <span className="text-xs font-normal text-ink-3">(Optional)</span>
          </label>
          <input
            id={closingDateId}
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={proposedClosingDate}
            onChange={(e) => setProposedClosingDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy-900 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>

        {/* Conditions / Contingencies */}
        <div>
          <label htmlFor={conditionsId} className="block text-xs font-bold uppercase tracking-wider text-navy-900">
            Contingencies & Terms <span className="text-xs font-normal text-ink-3">(Optional, max 1,000 chars)</span>
          </label>
          <textarea
            id={conditionsId}
            rows={3}
            maxLength={1000}
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="e.g. Subject to bank mortgage approval, delivery of unit by December 2026, inclusive of maintenance deposit..."
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-ink-3 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>

        {/* Deposit Advisory Box */}
        <div className="flex gap-2.5 rounded-xl border border-line bg-brass-050/60 p-3 text-xs text-navy-900">
          <Info className="h-4 w-4 flex-shrink-0 text-brass-600 mt-0.5" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-navy-900">
              5% Reservation Deposit ({estimatedDeposit.toLocaleString("en-US")} EGP)
            </p>
            <p className="text-ink-2">
              If the agent accepts your offer, you have a 72-hour window to secure the property by
              paying the 5% deposit (capped at 50,000 EGP). You can have up to 5 live offers at any time.
            </p>
          </div>
        </div>

        {/* Error message */}
        {createOfferMutation.isError && (
          <div role="alert" className="rounded-xl border border-line bg-white p-3 text-sm text-error">
            {problemMessage(createOfferMutation.error)}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={createOfferMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createOfferMutation.isPending}
            disabled={amount < 100_000 || createOfferMutation.isPending}
            className="bg-navy-900 hover:bg-navy-800 text-white"
          >
            <HandCoins className="mr-1.5 h-4 w-4" aria-hidden />
            Submit Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
