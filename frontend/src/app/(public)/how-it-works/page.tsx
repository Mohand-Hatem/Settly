import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  CalendarCheck,
  HandCoins,
  ShieldCheck,
  CheckCircle2,
  FileText,
  BadgeCheck,
  Lock,
  ArrowRight,
  Clock,
  Building,
  UserCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How Settly Works — The Verified Resale Real Estate Standard in Egypt",
  description:
    "Understand Settly's structured resale process from verified discovery and private viewings to formal offers and secure deposit reservations.",
};

const BUYER_STEPS = [
  {
    step: "01",
    title: "Discover with Precision",
    desc: "Every listing is vetted for valid title deeds, accurate built-up area (BUA), and transparent price per square metre. No generic marketing fluff or ghost listings.",
    icon: Compass,
    highlights: ["Verified floor plans & plot sizes", "EGP/m² transparency", "Zero developer-plan confusion"],
  },
  {
    step: "02",
    title: "Structured Private Viewings",
    desc: "Request a viewing directly through the platform. Propose convenient dates and times; the assigned licensed agent confirms or proposes alternatives inside the thread.",
    icon: CalendarCheck,
    highlights: ["In-app scheduling", "No unsolicited phone calls", "Agent license verified"],
  },
  {
    step: "03",
    title: "Formal Offer & Negotiation",
    desc: "Submit binding offers with your proposed price, payment terms (cash or transferred installments), and closing window. Every counter-offer is tracked in writing.",
    icon: HandCoins,
    highlights: ["Written negotiation trail", "Seller acceptance record", "Clear validity deadlines"],
  },
  {
    step: "04",
    title: "Deposit Reservation & Closing",
    desc: "Once an offer is mutually accepted, pay a formal reservation deposit to hold the unit off-market while final contract verification and title conveyance take place.",
    icon: ShieldCheck,
    highlights: ["Fixed reservation hold", "Secure Paymob checkout", "Two-sided closing confirmation"],
  },
];

const AGENT_STEPS = [
  {
    step: "01",
    title: "Licensed Agent Verification",
    desc: "Agents must submit their Egyptian Real Estate Tax Authority (ETA) commercial register and license for admin verification before publishing.",
    icon: BadgeCheck,
  },
  {
    step: "02",
    title: "Listing Moderation & Due Diligence",
    desc: "Every submitted resale unit undergoes administrative review. Ownership documents and pricing sanity are audited before publication.",
    icon: FileText,
  },
  {
    step: "03",
    title: "Structured Deal Pipeline",
    desc: "Manage viewing requests, present written buyer offers directly to sellers, and execute transactions through an organized closing flow.",
    icon: Building,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="w-full bg-canvas text-ink py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-brass-200 bg-brass-050 px-3.5 py-1 text-xs font-mono font-semibold text-brass-600 mb-5">
            <span>THE SETTLY STANDARD</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-navy-900 tracking-tight leading-tight mb-6">
            From verified search to keys in hand.
          </h1>
          <p className="text-base sm:text-lg text-ink-2 leading-relaxed">
            Settly transforms Egyptian residential resale by replacing verbal ambiguity with verified metrics, written negotiation trails, and secure reservation holds.
          </p>
        </div>

        {/* Buyer Journey Section */}
        <div className="mb-20 md:mb-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-line">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-brass-600 font-bold">
                For Homebuyers &amp; Investors
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-navy-900 mt-1">
                The 4-Step Acquisition Flow
              </h2>
            </div>
            <Link
              href="/search"
              className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-brass-600 transition"
            >
              <span>Explore verified homes</span>
              <ArrowRight className="w-3.5 h-3.5 text-brass-600" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {BUYER_STEPS.map(({ step, title, desc, icon: Icon, highlights }) => (
              <div
                key={step}
                className="rounded-xl border border-line bg-white p-7 sm:p-8 shadow-sm transition hover:shadow-md hover:border-brass/40"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-900 text-brass">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xl font-bold text-ink-3/40">{step}</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-navy-900 mb-3">{title}</h3>
                <p className="text-sm text-ink-2 leading-relaxed mb-6">{desc}</p>
                <ul className="space-y-2 pt-4 border-t border-line/60">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-xs font-medium text-navy-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Agent & Seller Section */}
        <div className="mb-20 md:mb-28">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-line">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-brass-600 font-bold">
                For Real Estate Professionals
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-navy-900 mt-1">
                The Verified Agent Standard
              </h2>
            </div>
            <Link
              href="/agents"
              className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 hover:text-brass-600 transition"
            >
              <span>View licensed agents</span>
              <ArrowRight className="w-3.5 h-3.5 text-brass-600" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {AGENT_STEPS.map(({ step, title, desc, icon: Icon }) => (
              <div
                key={step}
                className="rounded-xl border border-line bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-bg text-sage mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs font-bold text-brass-600 mb-1 block">STAGE {step}</span>
                <h3 className="font-serif text-lg font-bold text-navy-900 mb-2">{title}</h3>
                <p className="text-xs text-ink-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust & Invariants Banner */}
        <div className="rounded-2xl border border-line bg-navy-900 text-white p-8 sm:p-12">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-wider text-brass font-bold mb-2 block">
              Core Invariants
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight mb-4">
              Protected by clear platform rules.
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-8">
              Settly operates under strict architectural and consumer protection boundaries designed for the Egyptian real estate market.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-brass shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans text-sm font-bold text-white mb-1">No Unsolicited Calls</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Agent phone numbers are never published. All communication is managed through platform threads.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-brass shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans text-sm font-bold text-white mb-1">No Speculative Escrow</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Deposits are only requested after mutual written offer acceptance between buyer and seller.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-brass shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans text-sm font-bold text-white mb-1">Licensed Agents Only</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Only brokers with verified commercial register entries and tax cards are approved to list properties.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <Clock className="w-4 h-4 text-brass" />
              <span>Cairo Standard Time (CLT) · Egyptian Resale Market</span>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-lg bg-brass px-5 py-2.5 text-xs font-bold text-navy-950 hover:bg-brass-600 hover:text-white transition"
            >
              Start Searching Residences
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
