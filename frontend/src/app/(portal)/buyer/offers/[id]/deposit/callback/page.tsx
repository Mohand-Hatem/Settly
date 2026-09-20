"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { fetchDepositStatus, type DepositStatusResponse } from "@/api/payments";
import { formatEGP } from "@/lib/money";

type PollingState = "POLLING" | "SUCCEEDED" | "FAILED" | "SUPERSEDED" | "TIMEOUT";

export default function DepositCallbackPage() {
  const params = useParams<{ id: string }>();
  const offerId = params.id;
  const searchParams = useSearchParams();

  const [pollingState, setPollingState] = useState<PollingState>("POLLING");
  const [statusData, setStatusData] = useState<DepositStatusResponse | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [simulatedWebhookTriggered, setSimulatedWebhookTriggered] = useState(false);

  // In simulated local mode, trigger mock webhook if needed
  useEffect(() => {
    const isSimulated = searchParams.get("simulated") === "true";
    if (isSimulated && !simulatedWebhookTriggered) {
      setSimulatedWebhookTriggered(true);
      // Call backend test simulation or wait for status
      // We can poll status directly; in local simulation, if user clicked return, we trigger status check
    }
  }, [searchParams, simulatedWebhookTriggered]);

  // Polling state machine (SH-05, PAYMENTS.md §5.1)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;

    async function checkStatus() {
      try {
        const data = await fetchDepositStatus(offerId);
        if (isCancelled) return;
        setStatusData(data);

        if (data.paymentStatus === "SUCCEEDED" || data.offerStatus === "RESERVED") {
          setPollingState("SUCCEEDED");
          return;
        }

        if (data.offerStatus === "SUPERSEDED") {
          setPollingState("SUPERSEDED");
          return;
        }

        if (data.paymentStatus === "CANCELLED" || data.paymentStatus === "EXPIRED") {
          setPollingState("FAILED");
          return;
        }

        // Still PENDING or PROCESSING: keep polling up to 25 attempts (~60s)
        if (pollCount >= 25) {
          setPollingState("TIMEOUT");
          return;
        }

        setPollCount((prev) => prev + 1);
        timeoutId = setTimeout(checkStatus, 2500);
      } catch {
        if (!isCancelled) {
          if (pollCount >= 25) {
            setPollingState("TIMEOUT");
          } else {
            setPollCount((prev) => prev + 1);
            timeoutId = setTimeout(checkStatus, 2500);
          }
        }
      }
    }

    checkStatus();

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [offerId, pollCount]);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6">
      <div className="bg-white border border-navy-200/80 rounded-3xl shadow-sm p-8 text-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brass-500 via-emerald-500 to-navy-900" />

        {/* State 1: Polling / Processing */}
        {pollingState === "POLLING" && (
          <div className="py-8 space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-navy-100" />
              <div className="absolute inset-0 rounded-full border-4 border-brass-500 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="w-8 h-8 text-brass-600 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-spectral font-medium text-navy-950">
                Confirming Your Reservation...
              </h1>
              <p className="text-sm text-navy-600 max-w-md mx-auto">
                Settly is currently verifying your payment with the Central Bank of Egypt and Paymob network.
                Please do not refresh or close this tab.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bone border border-navy-200/70 text-xs font-mono text-navy-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-brass-600" />
              Verification cycle {pollCount + 1} of 25
            </div>
          </div>
        )}

        {/* State 2: Succeeded (The Goal) */}
        {pollingState === "SUCCEEDED" && (
          <div className="py-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-emerald-700 font-bold">
                Payment Succeeded & Verified
              </span>
              <h1 className="text-3xl font-spectral font-normal text-navy-950">
                Property Reserved!
              </h1>
              <p className="text-sm text-navy-600 max-w-md mx-auto">
                Your deposit has cleared and the property is officially reserved exclusively for you.
                Rival offers have been automatically superseded.
              </p>
            </div>

            {statusData && (
              <div className="p-4 rounded-2xl bg-bone border border-navy-200/80 text-left space-y-2.5 max-w-md mx-auto text-xs">
                <div className="flex justify-between text-navy-600">
                  <span>Offer Reference:</span>
                  <span className="font-mono text-navy-950 font-medium">#{offerId.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between text-navy-600">
                  <span>Deposit Amount Credited:</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {formatEGP(statusData.depositAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-navy-600">
                  <span>Cooling-Off Window:</span>
                  <span className="font-medium text-navy-900">48 Hours (100% Refundable)</span>
                </div>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/buyer/offers"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>View Reserved Offer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/buyer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-800 font-medium text-sm transition-colors"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Superseded (Residual Race Lost, §6.2) */}
        {pollingState === "SUPERSEDED" && (
          <div className="py-6 space-y-6">
            <div className="w-20 h-20 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertOctagon className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-amber-700 font-bold">
                Residual Reservation Race
              </span>
              <h1 className="text-2xl font-spectral font-medium text-navy-950">
                Property Reserved by Another Buyer
              </h1>
              <p className="text-sm text-navy-600 max-w-md mx-auto">
                During the checkout transition, a rival accepted buyer’s deposit confirmed first.
                Under Settly Business Rules §6.2, your reservation could not be applied.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-xs text-emerald-900 space-y-1.5 max-w-md mx-auto">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Automatic Refund Initiated
              </div>
              <p className="text-emerald-800 leading-relaxed">
                A full refund for your deposit has been initiated automatically to your original payment method.
                Settly absorbs all payment processing fees.
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/buyer/offers"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 text-white font-medium text-sm hover:bg-navy-800 transition-colors"
              >
                Return to My Offers
              </Link>
            </div>
          </div>
        )}

        {/* State 4: Failed or Cancelled */}
        {pollingState === "FAILED" && (
          <div className="py-6 space-y-6">
            <div className="w-20 h-20 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-rose-700 font-bold">
                Transaction Unsuccessful
              </span>
              <h1 className="text-2xl font-spectral font-medium text-navy-950">
                Payment Was Declined or Cancelled
              </h1>
              <p className="text-sm text-navy-600 max-w-md mx-auto">
                The card transaction could not be completed by Paymob. Your accepted offer remains active, and you
                may retry checkout with another payment method.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <Link
                href={`/buyer/offers/${offerId}/deposit`}
                className="px-6 py-3 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 font-semibold text-sm transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/buyer/offers"
                className="px-6 py-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-800 font-medium text-sm transition-colors"
              >
                Return to Offers
              </Link>
            </div>
          </div>
        )}

        {/* State 5: Timeout / Reconciliation */}
        {pollingState === "TIMEOUT" && (
          <div className="py-6 space-y-6">
            <div className="w-20 h-20 rounded-full bg-navy-100 border border-navy-200 flex items-center justify-center mx-auto text-navy-600">
              <FileCheck className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest text-navy-600 font-bold">
                Verification Queued
              </span>
              <h1 className="text-2xl font-spectral font-medium text-navy-950">
                Payment Under Reconciliation
              </h1>
              <p className="text-sm text-navy-600 max-w-md mx-auto">
                The banking network confirmation is taking longer than expected. Our automated reconciliation sweeper
                polls the provider continuously and will update your offer status shortly.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPollCount(0);
                  setPollingState("POLLING");
                }}
                className="px-6 py-3 rounded-xl bg-brass-500 hover:bg-brass-400 text-navy-950 font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Check Status Again
              </button>
              <Link
                href="/buyer/offers"
                className="px-6 py-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-800 font-medium text-sm transition-colors"
              >
                Go to My Offers
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
