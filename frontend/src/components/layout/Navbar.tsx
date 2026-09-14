"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface NavbarProps {
  dark?: boolean;
}

export function Navbar({ dark = false }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const navLinks = [
    { label: "Properties", href: "/search" },
    { label: "Areas", href: "/areas" },
    { label: "Market Insights", href: "/market-insights" },
    { label: "Advisors", href: "/agents" },
  ];

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-200 backdrop-blur-md ${
        dark
          ? "bg-navy-950/95 border-b border-white/10 text-white"
          : "bg-white/95 border-b border-line text-ink"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[74px] flex items-center justify-between gap-4">
        {/* Brand Mark */}
        <Link href="/" className="inline-flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-sm bg-navy-900 border border-brass/40 flex items-center justify-center font-display text-brass font-bold text-lg shadow-sm group-hover:border-brass transition-colors">
            S
          </div>
          <span
            className={`font-sans text-xl font-bold tracking-tight ${
              dark ? "text-white" : "text-navy-900"
            }`}
          >
            Settly<span className="text-brass">.</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-brass ${
                  isActive
                    ? "text-brass font-semibold"
                    : dark
                    ? "text-white/80"
                    : "text-ink-2"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Auth Status */}
        <div className="hidden md:flex items-center gap-4">
          <div
            className={`text-xs font-mono font-medium px-2.5 py-1 rounded border ${
              dark
                ? "border-white/15 text-white/70"
                : "border-line text-ink-3"
            }`}
          >
            EN <span className="opacity-40">|</span> ع
          </div>

          {!isPending && session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href={session.user.role === "AGENT" ? "/agent/dashboard" : "/buyer/dashboard"}
                className="text-xs font-mono font-semibold text-brass hover:underline uppercase tracking-wider"
              >
                {session.user.name.split(" ")[0]}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs font-sans font-medium px-3 py-1.5 rounded border border-line hover:border-red-400 hover:text-red-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-brass ${
                  dark ? "text-white/90" : "text-navy-900"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-sm bg-brass text-navy-950 hover:bg-brass-600 hover:text-white transition-all shadow-sm"
              >
                Private Access
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded text-ink-2 hover:text-navy-900 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-white px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-ink-2 hover:text-brass"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-line flex flex-col gap-2">
            {!isPending && session?.user ? (
              <>
                <Link
                  href={session.user.role === "AGENT" ? "/agent/dashboard" : "/buyer/dashboard"}
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-semibold uppercase tracking-wider bg-navy-900 text-white rounded-sm"
                >
                  Dashboard ({session.user.name})
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-center py-2 text-xs font-semibold text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-semibold uppercase tracking-wider border border-line text-navy-900 rounded-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center py-2.5 text-xs font-semibold uppercase tracking-wider bg-brass text-navy-950 rounded-sm"
                >
                  Private Access
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
