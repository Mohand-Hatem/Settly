"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/login?reset=success",
      });

      if (error) {
        setStatusMessage(error.message || "Failed to initiate password reset. Please verify your email.");
        setIsSuccess(false);
      } else {
        setIsSuccess(true);
        setStatusMessage("A high-entropy recovery link has been dispatched to your email address via Resend.");
      }
    } catch {
      setStatusMessage("An unexpected error occurred. Please try again.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Left Pane: Architectural Scrim & Sovereign Telemetry (Desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 p-12 lg:p-16 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/3.jpg"
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
            href="/login"
            className="text-xs font-sans text-white/70 hover:text-brass transition-colors flex items-center gap-1.5"
          >
            &larr; Back to Sign In
          </Link>
        </div>

        {/* Middle Stance */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="text-[11px] font-mono uppercase tracking-widest text-brass font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-brass inline-block" />
            SECURITY ARCHITECTURE
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold leading-tight text-white mb-6">
            Immediate session revocation upon password renewal.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed font-sans">
            In strict compliance with Settly&apos;s security protocol (AUTH.md §3), resetting your password automatically terminates all active sessions across all devices to prevent unauthorized credential reuse.
          </p>
        </div>

        {/* Bottom Metrics */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          <div>
            <div className="font-mono text-base font-bold text-white">ARGON2ID</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Cryptographic Hash
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">1 HOUR</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Token Expiry
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">IMMEDIATE</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Session Revocation
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Reset Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md bg-white border border-line rounded-xl p-8 sm:p-10 shadow-settly">
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-sm bg-navy-900 border border-brass/50 flex items-center justify-center font-display text-brass font-bold text-sm">
                S
              </div>
              <span className="font-sans text-lg font-bold text-navy-900">
                Settly<span className="text-brass">.</span>
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-900 tracking-tight">
              Reset Password
            </h1>
            <p className="text-xs text-ink-2 mt-2 leading-relaxed">
              Enter your registered email address to receive a secure recovery link.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`mb-6 p-4 rounded-sm text-xs flex items-start gap-3 border ${
                isSuccess
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@settly.estate"
                className="w-full px-3.5 py-2.5 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white font-sans text-xs uppercase tracking-widest font-semibold rounded-sm shadow-sm hover:shadow-brass transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Dispatching Link...
                </>
              ) : (
                "Dispatch Recovery Link &rarr;"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-line text-center text-xs text-ink-2">
            Remember your credentials?{" "}
            <Link href="/login" className="text-brass hover:text-brass-600 font-semibold transition-colors">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
