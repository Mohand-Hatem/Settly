"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient, ROLE_HOME, roleOf } from "@/lib/auth-client";
import { Menu, X, User, LogOut } from "lucide-react";

interface NavbarProps {
  dark?: boolean;
}

export function Navbar({ dark = false }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const navLinks = [
    { label: "Buy", href: "/search" },
    { label: "Districts", href: "/areas" },
    { label: "Compare", href: "/compare" },
    { label: "Market Insights", href: "/market-insights" },
    { label: "Agents", href: "/agents" },
  ];

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  const getDashboardHref = () => (session?.user ? ROLE_HOME[roleOf(session.user)] : "/login");

  const isSearchMode = pathname === "/search";
  const isDarkHeader =
    dark ||
    pathname === "/market-insights" ||
    (pathname.startsWith("/areas/") && pathname !== "/areas");

  return (
    <header className={`settly-master-header ${isDarkHeader ? "header-dark" : ""}`}>
      <div className={`settly-nav-shell ${isSearchMode ? "settly-nav-search-mode" : ""}`}>
        {/* Brand Mark & Title */}
        <Link href="/" className="brand">
          <img
            src="/images/logo.png"
            alt="Settly Logo"
            width={38}
            height={38}
          />
          <span>Settly</span>
        </Link>

        {/* Refactored Impeccable Luxury Search Console on Search Page */}
        {isSearchMode && (
          <div className="settly-hdr-search" id="hdrSearchConsole">
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="hdr-search-input"
              id="globalSearchInput"
              placeholder="Search by area or compound (e.g. New Cairo, Sheikh Zayed)..."
              defaultValue="Golden Square, New Cairo"
              autoComplete="off"
              aria-label="Search properties in Egypt"
            />
            <button
              type="button"
              className="hdr-search-clear"
              id="hdrSearchClear"
              aria-label="Clear search"
              title="Clear query"
              onClick={() => {
                const input = document.getElementById(
                  "globalSearchInput"
                ) as HTMLInputElement;
                if (input) input.value = "";
              }}
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <span className="hdr-search-divider" />
            <kbd className="hdr-search-kbd" title="Press ⌘K or Ctrl+K to search">
              ⌘K
            </kbd>
          </div>
        )}

        {/* Primary Geometric Centered Navigation (Desktop) */}
        <nav className="settly-main-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`settly-nav-link ${isActive ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Header Actions */}
        <div className="settly-header-actions">
          {/* Auth State CTAs */}
          {!isPending && session?.user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={getDashboardHref()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-xs font-semibold text-navy-900 bg-canvas border border-line"
              >
                <User className="w-3.5 h-3.5 text-brass" />
                <span>{session.user.name?.split(" ")[0] || "Dashboard"}</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 rounded-md text-ink-3 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login" className="btn-settly-signin">
                Sign in
              </Link>
              <Link href="/register" className="btn-settly-getstarted">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-md transition-colors ${
              isDarkHeader ? "text-white hover:bg-white/10" : "text-navy-900 hover:bg-canvas"
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-white px-4 py-6 space-y-4 shadow-xl">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? "bg-brass/10 text-brass font-bold"
                    : "text-navy-900 hover:bg-canvas"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-line flex flex-col gap-3">
            {!isPending && session?.user ? (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={getDashboardHref()}
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-2.5 text-center rounded-lg bg-navy-900 text-white font-semibold text-sm"
                >
                  Go to Dashboard ({session.user.name?.split(" ")[0]})
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2 text-center text-xs text-red-600 font-medium hover:underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-lg border border-line text-navy-900 font-semibold text-sm hover:bg-canvas"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-center rounded-lg bg-navy-800 text-white font-semibold text-sm hover:bg-brass hover:text-navy-950"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
