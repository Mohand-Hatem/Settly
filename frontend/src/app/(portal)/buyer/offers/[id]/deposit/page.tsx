"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  Clock,
  ArrowRight,
  AlertTriangle,
  CreditCard,
  Building2,
  Info,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { fetchOffer, type Offer } from "@/api/offers";
import { initiateDepositCheckout, fetchDepositStatus, type DepositStatusResponse } from "@/api/payments";
import { formatEGP } from "@/lib/money";
import { DepositCheckoutSkeleton } from "@/components/ui/Skeleton";

export default function DepositCheckoutPage() {
  const params = useParams<{ id: string }>();
  const offerId = params.id;
  const router = useRouter();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [depositStatus, setDepositStatus] = useState<DepositStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdRemainingSeconds, setHoldRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [offerData, statusData] = await Promise.all([
          fetchOffer(offerId),
          fetchDepositStatus(offerId).catch(() => null),
        ]);
        setOffer(offerData);
        if (statusData) {
          setDepositStatus(statusData);
          if (statusData.holdRemainingSeconds > 0) {
            setHoldRemainingSeconds(statusData.holdRemainingSeconds);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load offer details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [offerId]);

  // Countdown timer for 15-min hold
  useEffect(() => {
    if (holdRemainingSeconds === null || holdRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setHoldRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [holdRemainingSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProceedToCheckout = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await initiateDepositCheckout(offerId);

      // If in offline simulation mode, redirect immediately to callback with query params
      if (res.isSimulated) {
        router.push(res.checkoutUrl);
      } else {
        // Live Paymob Hosted Redirection
        window.location.href = res.checkoutUrl;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to acquire checkout hold. Please refresh and try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DepositCheckoutSkeleton />;
  }

  if (error && !offer) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl shadow-sm text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-spectral font-medium text-navy-900 mb-2">Checkout Error</h2>
        <p className="text-navy-600 text-sm mb-6">{error}</p>
        <Link
          href="/buyer/offers"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy-900 text-white rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors"
        >
          Return to Offers
        </Link>
      </div>
    );
  }

  if (!offer) return null;

  const depositAmount = offer.depositAmount || Math.min(Math.round(offer.currentAmount * 0.05), 50000);
  const isAccepted = offer.status === "ACCEPTED";
  const isReserved = offer.status === "RESERVED";
  const anotherHolding = depositStatus?.anotherBuyerHolding;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-medium text-navy-600 mb-6">
        <Link href="/buyer/offers" className="hover:text-navy-900 transition-colors">
          My Offers
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-navy-500" />
        <span className="text-navy-500">Offer #{offer.id.slice(0, 8)}</span>
        <ChevronRight className="w-3.5 h-3.5 text-navy-500" />
        <span className="text-brass-700 font-semibold">Deposit Checkout</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-spectral font-normal text-navy-950">
              Reservation Deposit Checkout
            </h1>
            <p className="text-sm text-navy-600 mt-1">
              Secure official reservation via Paymob gateway with 48-hour cooling-off protection.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            TLS 1.3 256-Bit Escrow Gateway
          </div>
        </div>
      </div>

      {/* Another Buyer Holding Alert (409 State) */}
      {anotherHolding && (
        <div className="mb-8 p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
          <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-950">Checkout Hold Active by Another Buyer</h3>
            <p className="text-xs text-amber-800 mt-1">
              Another prospective buyer has initiated checkout on this property. Under Settly’s anti-race rules
              (Decision #11), they hold an exclusive 15-minute reservation window.
            </p>
            <p className="text-xs font-mono font-medium text-amber-900 mt-2">
              Estimated hold expiration: ~{depositStatus?.holdRemainingSeconds || 900} seconds remaining.
            </p>
          </div>
        </div>
      )}

      {/* Already Reserved State */}
      {isReserved && (
        <div className="mb-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-xl font-spectral font-medium text-emerald-950">Property Already Reserved!</h2>
          <p className="text-sm text-emerald-800 mt-1 max-w-md mx-auto">
            The reservation deposit for this accepted offer has already been confirmed. Your unit is safely locked.
          </p>
          <div className="mt-5">
            <Link
              href="/buyer/offers"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-sm font-medium hover:bg-emerald-900 transition-colors"
            >
              View In My Offers
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Financial Details & Protection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Property Card */}
          <div className="p-5 rounded-2xl bg-white border border-navy-200/80 shadow-xs">
            <div className="flex gap-4">
              {offer.property.imageUrl ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-navy-100 shrink-0">
                  <Image
                    src={offer.property.imageUrl}
                    alt={offer.property.title || "Property"}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-8 h-8 text-navy-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-brass-700">
                  Agreed Purchase
                </span>
                <h3 className="text-base font-semibold text-navy-950 truncate mt-0.5">
                  {offer.property.title || "Property Details"}
                </h3>
                <p className="text-xs text-navy-500 mt-0.5">Status: {offer.property.status}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xs text-navy-500">Agreed Price:</span>
                  <span className="text-sm font-mono font-bold text-navy-950">
                    {formatEGP(offer.currentAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-navy-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-navy-950 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brass-600" />
              Reservation Deposit Breakdown
            </h3>

            <div className="space-y-3 pt-2 text-sm">
              <div className="flex justify-between items-center text-navy-600">
                <span>Agreed Purchase Price</span>
                <span className="font-mono">{formatEGP(offer.currentAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-navy-600">
                <span>Statutory Reservation Rate</span>
                <span>5.0%</span>
              </div>
              <div className="flex justify-between items-center text-navy-600">
                <span>Statutory Cap (Business Rules §5)</span>
                <span className="font-mono">50,000 EGP</span>
              </div>
              <div className="pt-3 border-t border-navy-100 flex justify-between items-center text-navy-950 font-semibold">
                <span className="text-base">Reservation Deposit Due</span>
                <span className="text-lg font-mono font-bold text-brass-700">
                  {formatEGP(depositAmount)}
                </span>
              </div>
            </div>

            {/* Note confirming credit to price */}
            <div className="p-3.5 rounded-xl bg-bone border border-navy-200/60 flex items-start gap-3">
              <Info className="w-4 h-4 text-brass-600 shrink-0 mt-0.5" />
              <p className="text-xs text-navy-700 leading-relaxed">
                <strong className="font-semibold text-navy-950">100% Credited to Final Price (#76):</strong> This
                reservation deposit is not an additional fee. It is fully deducted from the remaining purchase
                balance upon contract signing.
              </p>
            </div>
          </div>

          {/* Refund Policy & Consumer Protections (§7) */}
          <div className="p-6 rounded-2xl bg-white border border-navy-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-navy-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Consumer Protection & Refund Policy
            </h3>
            <ul className="space-y-2.5 text-xs text-navy-600 leading-normal">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                <span>
                  <strong className="font-medium text-navy-900">48-Hour Cooling-Off Window:</strong> If you withdraw
                  your reservation within 48 hours of payment, you receive a <strong className="text-emerald-700">100% full refund</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-navy-400 shrink-0 mt-1.5" />
                <span>
                  <strong className="font-medium text-navy-900">Withdrawal After 48 Hours (#84):</strong> 20% is
                  retained as seller compensation (paid 100% to the seller, zero Settly fee) and 80% is refunded.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-navy-400 shrink-0 mt-1.5" />
                <span>
                  <strong className="font-medium text-navy-900">Residual Race Protection (§6.2):</strong> If a rival
                  deposit confirms while your checkout is active, you receive an immediate, automatic{" "}
                  <strong className="text-navy-950">100% refund with zero fee deduction</strong>.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Checkout Action & Concurrency Hold */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-navy-950 text-white shadow-xl relative overflow-hidden border border-navy-800">
            {/* Background architectural glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-brass-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-brass-400 font-bold">
                  Checkout Hold
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brass-400/15 border border-brass-400/30 text-brass-300 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  15 Minutes
                </span>
              </div>

              <div>
                <p className="text-xs text-navy-300 leading-relaxed">
                  Proceeding to Paymob grants you an <strong className="text-white">exclusive 15-minute checkout hold</strong> on
                  this property. No other buyer can complete checkout while your hold is active.
                </p>
              </div>

              {holdRemainingSeconds !== null && holdRemainingSeconds > 0 && (
                <div className="p-3.5 rounded-xl bg-navy-900/80 border border-brass-500/30 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-brass-400 font-semibold">
                    Current Hold Remaining
                  </div>
                  <div className="text-2xl font-mono font-bold text-white mt-0.5">
                    {formatTimer(holdRemainingSeconds)}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-navy-800">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs text-navy-300">Amount Due:</span>
                  <span className="text-2xl font-mono font-bold text-brass-400">
                    {formatEGP(depositAmount)}
                  </span>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={submitting || !isAccepted || Boolean(anotherHolding)}
                  className="w-full py-3.5 px-4 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-brass-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                      <span>Acquiring Hold & Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Paymob Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {!isAccepted && !isReserved && (
                  <p className="text-center text-xs text-rose-400 mt-3">
                    This offer is currently {offer.status}. Only accepted offers can be reserved.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-navy-800/80 flex flex-wrap items-center justify-between text-[11px] text-navy-400 gap-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Paymob Hosted Redirect
                </span>
                <span>Central Bank Regulated</span>
              </div>
            </div>
          </div>

          {/* Secure Guarantee Box */}
          <div className="p-4 rounded-xl bg-bone border border-navy-200/80 text-xs text-navy-600 flex items-center gap-3">
            <Lock className="w-5 h-5 text-navy-400 shrink-0" />
            <p>
              Settly never accepts, stores, or handles credit card numbers. Your payment is processed securely via
              Paymob’s hosted PCI-DSS Level 1 compliant infrastructure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
