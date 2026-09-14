"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const { data: session } = authClient.useSession();
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setResendStatus(null);
    try {
      if (session?.user?.email) {
        await authClient.sendVerificationEmail({
          email: session.user.email,
        });
        setResendStatus("A fresh verification link has been dispatched to your inbox via Resend.");
      } else {
        setResendStatus("Please sign in first to resend a verification link to your active email.");
      }
    } catch {
      setResendStatus("Unable to dispatch verification email at this moment. Please retry in a few moments.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Left Pane: Architectural Scrim & Sovereign Telemetry (Desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 p-12 lg:p-16 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/2.jpg"
            alt="Cairo Luxury Compound"
            fill
            className="object-cover opacity-35 saturate-75"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-900/90 to-navy-800/80" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-sm bg-navy-900 border border-brass/50 flex items-center justify-center font-display text-brass font-bold text-base group-hover:border-brass transition-colors">
              S
            </div>
            <span className="font-sans text-xl font-bold tracking-tight text-white">
              Settly<span className="text-brass">.</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-sans text-white/70 hover:text-brass transition-colors flex items-center gap-1.5"
          >
            &larr; Back to Platform
          </Link>
        </div>

        {/* Middle Stance */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="text-[11px] font-mono uppercase tracking-widest text-brass font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-brass inline-block" />
            FIDUCIARY VERIFICATION BOUNDARY
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold leading-tight text-white mb-6">
            Institutional protection before binding commitments.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed font-sans">
            Settly enforces email verification strictly at transactional gates. You are free to explore listings, analyze market valuations, and assemble shortlists without restriction. Verification unlocks formal viewings and offer negotiations.
          </p>
        </div>

        {/* Bottom Metrics */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          <div>
            <div className="font-mono text-base font-bold text-white">DECISION #38</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Guarded Gates
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">RESEND</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Zero Phishing
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">IMMEDIATE</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Search Access
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Verification Status & Action */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md bg-white border border-line rounded-xl p-8 sm:p-10 shadow-settly text-center">
          {/* Email Icon */}
          <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-brass/10 border border-brass/30 flex items-center justify-center text-brass">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-900 tracking-tight mb-3">
            Confirm Your Email Address
          </h1>
          <p className="text-xs text-ink-2 leading-relaxed mb-6">
            We have dispatched a verification link to your registered email address. Please click the link to activate viewing bookings and formal offer submissions.
          </p>

          {/* Decision #38 Highlight */}
          <div className="text-left p-4 rounded-sm bg-canvas border border-line mb-6 space-y-2 text-xs">
            <div className="font-mono text-[11px] font-semibold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              What you can do right now:
            </div>
            <p className="text-ink-2 text-[11px] leading-relaxed">
              &bull; Browse and filter prime Egyptian properties<br />
              &bull; Save favorites into curated collections<br />
              &bull; Review market capital appreciation trends
            </p>
          </div>

          {resendStatus && (
            <div className="mb-6 p-3 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {resendStatus}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white font-sans text-xs uppercase tracking-widest font-semibold rounded-sm shadow-sm transition-colors disabled:opacity-50"
            >
              {resending ? "Dispatching Email..." : "Resend Verification Link"}
            </button>

            <Link
              href="/"
              className="block w-full py-2.5 px-4 border border-line hover:border-brass text-ink-2 hover:text-brass text-xs uppercase tracking-widest font-semibold rounded-sm transition-colors"
            >
              Explore Properties &rarr;
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-line text-xs text-ink-3">
            Need assistance? Contact our fiduciary desk at{" "}
            <a href="mailto:support@settly.estate" className="text-brass hover:underline">
              support@settly.estate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
