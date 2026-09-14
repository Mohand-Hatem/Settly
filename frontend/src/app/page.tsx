import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ShieldCheck, Sparkles, Building2, Scale } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink selection:bg-brass-200 selection:text-navy-950">
      <Navbar />

      <main className="flex-1">
        {/* Luxury Broadsheet Hero */}
        <section className="relative bg-navy-950 text-white overflow-hidden py-20 lg:py-28">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero.jpg"
              alt="Cairo Luxury Skyline"
              fill
              className="object-cover opacity-30 saturate-75"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-white/10 border border-white/15 text-xs font-mono text-brass uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-brass" />
                <span>Cairo Sovereign Real Estate Ledger</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.12] tracking-tight text-white">
                Fiduciary clarity for Cairo&apos;s most discerning acquisitions.
              </h1>

              <p className="text-base sm:text-lg text-white/75 leading-relaxed font-sans max-w-2xl">
                Every property cross-referenced against official Egyptian land records. Guaranteed 5% reservation deposit escrow, 48-hour cooling-off protection, and licensed advisors.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/register"
                  className="px-6 py-3.5 rounded-sm bg-brass hover:bg-brass-600 text-navy-950 hover:text-white font-sans text-xs uppercase tracking-widest font-semibold transition-all shadow-sm"
                >
                  Request Private Access &rarr;
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-sm border border-white/20 hover:border-brass text-white hover:text-brass font-sans text-xs uppercase tracking-widest font-semibold transition-all"
                >
                  Advisor & Client Portal
                </Link>
              </div>
            </div>

            {/* Sovereign Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 mt-16 border-t border-white/10">
              <div>
                <div className="font-mono text-2xl font-bold text-white">5% / 50K EGP</div>
                <div className="font-mono text-xs text-white/50 uppercase tracking-wider mt-1">
                  Deposit Ceiling
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-white">48 HOURS</div>
                <div className="font-mono text-xs text-white/50 uppercase tracking-wider mt-1">
                  Full Cooling-Off
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-white">100% AUDIT</div>
                <div className="font-mono text-xs text-white/50 uppercase tracking-wider mt-1">
                  Title Deed Verified
                </div>
              </div>
              <div>
                <div className="font-mono text-2xl font-bold text-white">RESEND</div>
                <div className="font-mono text-xs text-white/50 uppercase tracking-wider mt-1">
                  Sovereign Delivery
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fiduciary Pillars Section */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-mono font-semibold uppercase tracking-widest text-brass mb-2">
              INSTITUTIONAL INTEGRITY
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-navy-900 tracking-tight">
              Eliminating asymmetry from Egyptian real estate.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-line rounded-xl p-8 shadow-settly space-y-4 hover:border-brass/50 transition-colors">
              <div className="w-10 h-10 rounded-sm bg-navy-900 border border-brass/40 flex items-center justify-center text-brass">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-navy-900">
                Verified Title Registry
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Zero placeholder or duplicate listings. Every luxury villa, duplex, and penthouse is validated before publication.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-line rounded-xl p-8 shadow-settly space-y-4 hover:border-brass/50 transition-colors">
              <div className="w-10 h-10 rounded-sm bg-navy-900 border border-brass/40 flex items-center justify-center text-brass">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-navy-900">
                Deposit Escrow Protocol
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Reservation deposits are legally capped at 5% (max 50,000 EGP) and held with institutional cooling-off refund rights.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-line rounded-xl p-8 shadow-settly space-y-4 hover:border-brass/50 transition-colors">
              <div className="w-10 h-10 rounded-sm bg-navy-900 border border-brass/40 flex items-center justify-center text-brass">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold text-navy-900">
                Licensed Advisor Network
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Only licensed Egyptian real estate advisors with verified brokerage credentials represent properties on Settly.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
