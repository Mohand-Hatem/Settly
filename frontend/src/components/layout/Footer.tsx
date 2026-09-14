import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-navy-950 text-white/70 border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-14 border-b border-white/10">
          {/* Col 1: Brand & Fiduciary Stance */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-navy-900 border border-brass/50 flex items-center justify-center font-display text-brass font-bold text-base">
                S
              </div>
              <span className="font-sans text-xl font-bold text-white tracking-tight">
                Settly<span className="text-brass">.</span>
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs">
              Sovereign real estate advisory & verification platform for the Egyptian luxury property market. Governed by verified title deeds and institutional trust guarantees.
            </p>
            <div className="pt-2 text-[11px] font-mono text-brass flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              CAIRO REGULATORY INTEGRITY VERIFIED
            </div>
          </div>

          {/* Col 2: Prime Portfolios */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-brass">
              Prime Portfolios
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/search?type=VILLA" className="hover:text-brass transition-colors">
                  Signature Villas
                </Link>
              </li>
              <li>
                <Link href="/search?type=PENTHOUSE" className="hover:text-brass transition-colors">
                  Sky Penthouses
                </Link>
              </li>
              <li>
                <Link href="/search?type=DUPLEX" className="hover:text-brass transition-colors">
                  Garden Duplexes
                </Link>
              </li>
              <li>
                <Link href="/search?intent=RENT" className="hover:text-brass transition-colors">
                  Executive Leases
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Cairo Destinations */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-brass">
              Destinations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/areas" className="hover:text-brass transition-colors">
                  New Cairo & Golden Square
                </Link>
              </li>
              <li>
                <Link href="/areas" className="hover:text-brass transition-colors">
                  Sheikh Zayed & New Giza
                </Link>
              </li>
              <li>
                <Link href="/areas" className="hover:text-brass transition-colors">
                  North Coast (Sahel) Prime
                </Link>
              </li>
              <li>
                <Link href="/market-insights" className="hover:text-brass transition-colors">
                  Capital Appreciation Indices
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-widest text-brass">
              Regulatory
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/agents" className="hover:text-brass transition-colors">
                  Licensed Advisors Registry
                </Link>
              </li>
              <li>
                <span className="text-white/40">5% Capped Deposit Escrow</span>
              </li>
              <li>
                <span className="text-white/40">48h Cooling-off Protection</span>
              </li>
              <li>
                <Link href="/login" className="hover:text-brass transition-colors">
                  Client & Advisor Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div className="flex flex-wrap items-center gap-6">
            <span>&copy; {new Date().getFullYear()} Settly Inc. Cairo, Arab Republic of Egypt.</span>
            <span>All rights reserved.</span>
          </div>
          <div className="font-mono text-[11px] text-white/50">
            EGP <span className="text-brass">|</span> EN (LTR) & AR (RTL) SOVEREIGN STACK
          </div>
        </div>
      </div>
    </footer>
  );
}
