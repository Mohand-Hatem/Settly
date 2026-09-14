"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });

      if (error) {
        setErrorMessage(error.message || "Invalid email or password. Please check your credentials.");
        setLoading(false);
        return;
      }

      if (data) {
        // Redirect to dashboard or home
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("ValidPassword123!");
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Left Pane: Architectural Scrim & Sovereign Telemetry (Desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 p-12 lg:p-16 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.jpg"
            alt="Cairo Luxury Architecture"
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

        {/* Middle Editorial Stance */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="text-[11px] font-mono uppercase tracking-widest text-brass font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-brass inline-block" />
            SOVEREIGN REAL ESTATE INTELLIGENCE
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold leading-tight text-white mb-6">
            Institutional precision for Cairo&apos;s sovereign acquisitions.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed font-sans">
            Settly eliminates informational asymmetry across New Cairo, Golden Square, and Sheikh Zayed through verified title records, non-negotiable reservation guarantees, and licensed fiduciary advisors.
          </p>
        </div>

        {/* Bottom Sovereign Telemetry */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          <div>
            <div className="font-mono text-base font-bold text-white">5% / 50K EGP</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Deposit Ceiling
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">48 HOURS</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Cooling-Off Window
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">100% TITLE</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Audit Guarantee
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Access Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md bg-white border border-line rounded-xl p-8 sm:p-10 shadow-settly">
          {/* Card Header */}
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-sm bg-navy-900 border border-brass/50 flex items-center justify-center font-display text-brass font-bold text-sm">
                S
              </div>
              <span className="font-sans text-lg font-bold text-navy-900">
                Settly<span className="text-brass">.</span>
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-900 tracking-tight">
              Private Client Access
            </h1>
            <p className="text-xs text-ink-2 mt-2 leading-relaxed">
              Enter your credentials to access verified property shortlists, scheduled viewings, and reservation ledgers.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-sm bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="advisor@firm.com or client@estate.com"
                className="w-full px-3.5 py-2.5 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-ink-2">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-brass hover:text-brass-600 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-navy-900 text-xs"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-line text-brass focus:ring-brass/30 h-4 w-4"
              />
              <label htmlFor="rememberMe" className="text-xs text-ink-2 select-none cursor-pointer">
                Keep me signed in on this device (30-day session)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white font-sans text-xs uppercase tracking-widest font-semibold rounded-sm shadow-sm hover:shadow-brass transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Session...
                </>
              ) : (
                "Enter Private Portal &rarr;"
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Reviewers */}
          <div className="mt-8 pt-6 border-t border-line">
            <div className="text-[10px] font-mono text-ink-3 uppercase tracking-wider mb-2.5">
              Development Fast-Fill
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("buyer@settly.estate")}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-canvas-2 hover:bg-brass-50 text-ink-2 hover:text-brass-600 border border-line transition-colors"
              >
                Buyer Demo
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("agent@settly.estate")}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-canvas-2 hover:bg-brass-50 text-ink-2 hover:text-brass-600 border border-line transition-colors"
              >
                Advisor Demo
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("admin@settly.estate")}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-canvas-2 hover:bg-brass-50 text-ink-2 hover:text-brass-600 border border-line transition-colors"
              >
                Admin Demo
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-xs text-ink-2">
            Do not have verified platform access?{" "}
            <Link href="/register" className="text-brass hover:text-brass-600 font-semibold transition-colors">
              Request Private Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
