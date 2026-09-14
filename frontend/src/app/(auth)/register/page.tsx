"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import { apiClient } from "@/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"USER" | "AGENT">("USER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLocale, setPreferredLocale] = useState("en");

  // Agent fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [brokerageName, setBrokerageName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Better Auth Sign-Up
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to create account. Please check your information.");
        setLoading(false);
        return;
      }

      if (data) {
        // 2. If Agent, submit AgentProfile details to Settly API
        if (role === "AGENT") {
          try {
            await apiClient.POST("/api/v1/me/agent-profile", {
              body: {
                licenseNumber,
                brokerageName,
              },
            });
          } catch (agentErr) {
            console.error("Failed to submit initial agent profile", agentErr);
          }
        }

        // 3. Redirect to verify-email notice page
        router.push("/verify-email?registered=true");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      {/* Left Pane: Architectural Scrim & Sovereign Telemetry (Desktop only) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-navy-950 p-12 lg:p-16 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/1.jpg"
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

        {/* Middle Editorial Stance */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="text-[11px] font-mono uppercase tracking-widest text-brass font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-brass inline-block" />
            INSTITUTIONAL ONBOARDING
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold leading-tight text-white mb-6">
            Direct access to Cairo&apos;s verified transaction ledger.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed font-sans">
            Join discerning private buyers and licensed fiduciary advisors acquiring prime residential real estate across Egypt. Every listing is cross-referenced with government land registries.
          </p>
        </div>

        {/* Bottom Sovereign Telemetry */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
          <div>
            <div className="font-mono text-base font-bold text-white">0% DUPLICATES</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Title Deed Verified
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">INSTANT</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Shortlist & Search
            </div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-white">RESEND</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/50 mt-1">
              Verified Delivery
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Registration Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md bg-white border border-line rounded-xl p-8 sm:p-10 shadow-settly my-8">
          {/* Header */}
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
              Create Private Account
            </h1>
            <p className="text-xs text-ink-2 mt-2 leading-relaxed">
              Select your participation status to begin verified discovery.
            </p>
          </div>

          {/* Segmented Role Selector */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-canvas rounded-md border border-line mb-6">
            <button
              type="button"
              onClick={() => setRole("USER")}
              className={`py-2 text-xs font-sans font-semibold rounded-sm transition-all ${
                role === "USER"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-ink-2 hover:text-navy-900"
              }`}
            >
              Private Buyer / Client
            </button>
            <button
              type="button"
              onClick={() => setRole("AGENT")}
              className={`py-2 text-xs font-sans font-semibold rounded-sm transition-all ${
                role === "AGENT"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-ink-2 hover:text-navy-900"
              }`}
            >
              Licensed Advisor / Agent
            </button>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mohamed El-Sayed"
                className="w-full px-3.5 py-2 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@settly.estate"
                className="w-full px-3.5 py-2 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
              />
            </div>

            {/* Dynamic Agent Fields */}
            {role === "AGENT" && (
              <div className="pt-2 space-y-4 border-t border-line">
                <div className="text-[11px] font-mono text-brass font-semibold uppercase tracking-wider">
                  Advisor Regulatory Credentials
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                    Real Estate License Number
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="EGY-RE-2026-XXXX"
                    className="w-full px-3.5 py-2 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                    Brokerage / Agency Affiliation
                  </label>
                  <input
                    type="text"
                    required
                    value={brokerageName}
                    onChange={(e) => setBrokerageName(e.target.value)}
                    placeholder="Prime Cairo Real Estate"
                    className="w-full px-3.5 py-2 text-sm bg-canvas border border-line rounded-sm text-ink placeholder:text-ink-3/50 focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
                  />
                </div>
              </div>
            )}

            {/* Language Preference */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-2 mb-1.5">
                Preferred Interface Language
              </label>
              <select
                value={preferredLocale}
                onChange={(e) => setPreferredLocale(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-canvas border border-line rounded-sm text-ink focus:outline-none focus:border-brass focus:bg-white transition-all font-sans"
              >
                <option value="en">English (Official / Broadsheet)</option>
                <option value="ar">العربية (Arabic Native)</option>
              </select>
            </div>

            {/* Verification Boundary Rationale Box (Decision #38) */}
            <div className="p-3.5 rounded-sm bg-canvas-2/70 border border-line text-[11px] text-ink-2 leading-relaxed">
              <span className="font-semibold text-navy-900 block mb-0.5">Instant Privileges:</span>
              Browse listings, save searches, and inspect AI market indices immediately. Verification is only required prior to booking viewings or advancing offer reservations.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brass hover:bg-brass-600 text-navy-950 hover:text-white font-sans text-xs uppercase tracking-widest font-semibold rounded-sm shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-navy-950/40 border-t-navy-950 rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Verified Account &rarr;"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-ink-2">
            Already have an active account?{" "}
            <Link href="/login" className="text-brass hover:text-brass-600 font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
