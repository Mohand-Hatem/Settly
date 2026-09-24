"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient, roleOf } from "@/lib/auth-client";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  CalendarDays,
  HandCoins,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  ArrowRight,
  Compass,
  Home,
  Bookmark,
  Search,
  ClipboardList,
  BadgeCheck,
  MessageSquare,
} from "lucide-react";

interface NavbarProps {
  dark?: boolean;
}

function NavbarSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get("q") || searchParams?.get("keyword") || "";
  const [val, setVal] = useState(queryParam);

  useEffect(() => {
    setVal(queryParam);
  }, [queryParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = val.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  const handleClear = () => {
    setVal("");
    router.push("/search");
  };

  return (
    <form onSubmit={handleSubmit} className="settly-hdr-search" id="hdrSearchConsole">
      <Search className="search-icon w-4 h-4 text-ink-3 shrink-0" />
      <input
        type="text"
        className="hdr-search-input"
        id="globalSearchInput"
        placeholder="Search by area or compound (e.g. New Cairo, Sheikh Zayed)..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        autoComplete="off"
        aria-label="Search properties in Egypt"
      />
      {val && (
        <button
          type="button"
          className="hdr-search-clear"
          id="hdrSearchClear"
          aria-label="Clear search"
          title="Clear query"
          onClick={handleClear}
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      )}
      <span className="hdr-search-divider" />
      <kbd className="hdr-search-kbd" title="Press Enter to search">
        ↵
      </kbd>
    </form>
  );
}

export function Navbar({ dark = false }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const role = roleOf(session?.user as { role?: string } | undefined);
  const isAgent = role === "AGENT" || role === "ADMIN";
  const isAdmin = role === "ADMIN";

  // Close user dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [userMenuOpen]);

  // Close mobile drawer and dropdown on route changes
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await authClient.signOut();
    window.location.href = "/";
  };

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
          <Image
            src="/images/logo.png"
            alt="Settly Logo"
            width={38}
            height={38}
            className="brand-logo-img"
            priority
          />
          <span>Settly</span>
        </Link>

        {/* Refactored Search Console on Search Page */}
        {isSearchMode && (
          <Suspense fallback={<div className="settly-hdr-search animate-pulse" />}>
            <NavbarSearchInput />
          </Suspense>
        )}

        {/* Primary Geometric Centered Navigation (Desktop) */}
        <nav className="settly-main-nav">
          {/* Buy with Dropdown */}
          <div className="settly-nav-dropdown-wrap">
            <Link
              href="/search"
              className={`settly-nav-link inline-flex items-center gap-1 ${
                pathname === "/search" ? "active" : ""
              }`}
            >
              <span>Buy</span>
              <ChevronDown className="w-3 h-3 text-ink-3 opacity-60" />
            </Link>
            <div className="settly-nav-dropdown settly-dropdown-buy">
              <div className="space-y-1">
                <Link
                  href="/search?type=VILLA"
                  className="flex items-center justify-between rounded-lg p-2.5 text-xs font-semibold text-navy-900 transition hover:bg-canvas hover:text-brass-600"
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 text-brass-600" />
                    <span>Standalone Villas</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-ink-3">Prime</span>
                </Link>
                <Link
                  href="/search?type=PENTHOUSE"
                  className="flex items-center justify-between rounded-lg p-2.5 text-xs font-semibold text-navy-900 transition hover:bg-canvas hover:text-brass-600"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-brass-600" />
                    <span>Penthouses & Duplexes</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-ink-3">Skyline</span>
                </Link>
                <Link
                  href="/search?type=APARTMENT"
                  className="flex items-center justify-between rounded-lg p-2.5 text-xs font-semibold text-navy-900 transition hover:bg-canvas hover:text-brass-600"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-brass-600" />
                    <span>Luxury Apartments</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-ink-3">Resale</span>
                </Link>
              </div>
              <Link href="/search" className="dropdown-footer-link">
                <span>View all properties</span>
                <ArrowRight className="w-3.5 h-3.5 text-brass-600" />
              </Link>
            </div>
          </div>

          {/* Districts with Mega Menu */}
          <div className="settly-nav-dropdown-wrap">
            <Link
              href="/areas"
              className={`settly-nav-link inline-flex items-center gap-1 ${
                pathname === "/areas" || pathname.startsWith("/areas/") ? "active" : ""
              }`}
            >
              <span>Districts</span>
              <ChevronDown className="w-3 h-3 text-ink-3 opacity-60" />
            </Link>
            <div className="settly-nav-dropdown settly-dropdown-mega">
              <div className="mega-grid">
                <Link href="/areas/new-cairo" className="mega-card">
                  <div className="mega-card-title">
                    <span>New Cairo & Golden Square</span>
                    <span className="font-mono text-[11px] text-brass-600">East</span>
                  </div>
                  <div className="mega-card-desc">Sovereign nexus, gated compounds & golf clubs</div>
                  <div className="mega-card-meta">72,500 EGP / m²</div>
                </Link>
                <Link href="/areas/sheikh-zayed" className="mega-card">
                  <div className="mega-card-title">
                    <span>Sheikh Zayed & New Zayed</span>
                    <span className="font-mono text-[11px] text-brass-600">West</span>
                  </div>
                  <div className="mega-card-desc">Crown jewel of West Cairo & Grand Museum axis</div>
                  <div className="mega-card-meta">58,200 EGP / m²</div>
                </Link>
                <Link href="/areas/north-coast" className="mega-card">
                  <div className="mega-card-title">
                    <span>North Coast & Ras El Hekma</span>
                    <span className="font-mono text-[11px] text-brass-600">Coastal</span>
                  </div>
                  <div className="mega-card-desc">Mediterranean Riviera & mega sovereign zone</div>
                  <div className="mega-card-meta">94,000 EGP / m²</div>
                </Link>
                <Link href="/areas/el-gouna" className="mega-card">
                  <div className="mega-card-title">
                    <span>El Gouna & Red Sea Coast</span>
                    <span className="font-mono text-[11px] text-brass-600">Red Sea</span>
                  </div>
                  <div className="mega-card-desc">Interconnected lagoon haven & yacht marinas</div>
                  <div className="mega-card-meta">86,500 EGP / m²</div>
                </Link>
              </div>
              <Link href="/areas" className="dropdown-footer-link">
                <span>Explore all districts & GIS Radar Map</span>
                <ArrowRight className="w-3.5 h-3.5 text-brass-600" />
              </Link>
            </div>
          </div>

          <Link
            href="/how-it-works"
            className={`settly-nav-link ${pathname === "/how-it-works" ? "active" : ""}`}
          >
            How It Works
          </Link>
          <Link
            href="/compare"
            className={`settly-nav-link ${pathname === "/compare" ? "active" : ""}`}
          >
            Compare
          </Link>
          <Link
            href="/market-insights"
            className={`settly-nav-link ${pathname === "/market-insights" ? "active" : ""}`}
          >
            Market Insights
          </Link>
          <Link
            href="/agents"
            className={`settly-nav-link ${pathname === "/agents" || pathname.startsWith("/agents/") ? "active" : ""}`}
          >
            Agents
          </Link>
        </nav>

        {/* Right Header Actions */}
        <div className="settly-header-actions">
          {/* FX Pill */}
          <div className="settly-fx-pill hidden xl:inline-flex" title="CBE Benchmark FX Rate">
            <span>USD/EGP:</span>
            <strong>48.98</strong>
          </div>

          {/* Quick Search Shortcut when not in search mode */}
          {!isSearchMode && (
            <Link
              href="/search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink-2 shadow-sm transition hover:border-brass hover:text-navy-900"
              title="Search residences"
              aria-label="Search residences"
            >
              <Search className="w-4 h-4" />
            </Link>
          )}

          {/* Auth State: User Menu Dropdown or Sign In / Register */}
          {!isPending && session?.user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-sm transition hover:border-brass hover:bg-canvas"
                aria-expanded={userMenuOpen}
                aria-label="User account menu"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brass-050 font-mono text-[11px] font-bold text-brass-600">
                  {session.user.name?.charAt(0) || "U"}
                </div>
                <span className="max-w-[110px] truncate">
                  {session.user.name?.split(" ")[0] || "Account"}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-ink-3 transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* User Menu Dropdown Panel */}
              {userMenuOpen && (
                <div className="settly-user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{session.user.name}</div>
                    <div className="user-dropdown-email">{session.user.email}</div>
                    <div
                      className={`user-dropdown-role-badge ${
                        role === "ADMIN"
                          ? "role-badge-admin"
                          : role === "AGENT"
                            ? "role-badge-agent"
                            : "role-badge-buyer"
                      }`}
                    >
                      {role === "ADMIN"
                        ? "Administrator"
                        : role === "AGENT"
                          ? "Verified Agent"
                          : "Verified Buyer"}
                    </div>
                  </div>

                  {/* Buyer Portal Navigation */}
                  <div className="user-dropdown-section-title">Buyer Portal</div>
                  <Link href="/buyer" className="user-dropdown-item is-portal">
                    <LayoutDashboard className="w-4 h-4 text-brass-600" />
                    <span>Buyer Dashboard</span>
                  </Link>
                  <Link href="/buyer/offers" className="user-dropdown-item">
                    <HandCoins className="w-4 h-4 text-ink-3" />
                    <span>My Offers</span>
                  </Link>
                  <Link href="/buyer/viewings" className="user-dropdown-item">
                    <CalendarDays className="w-4 h-4 text-ink-3" />
                    <span>My Viewings</span>
                  </Link>
                  <Link href="/buyer/saved" className="user-dropdown-item">
                    <Bookmark className="w-4 h-4 text-ink-3" />
                    <span>Saved Properties</span>
                  </Link>

                  {/* Agent Portal Navigation (for AGENT or ADMIN) */}
                  {isAgent && (
                    <>
                      <div className="user-dropdown-section-title">Agent Portal</div>
                      <Link href="/agent" className="user-dropdown-item is-portal">
                        <LayoutDashboard className="w-4 h-4 text-sage" />
                        <span>Agent Dashboard</span>
                      </Link>
                      <Link href="/agent/listings" className="user-dropdown-item">
                        <Building2 className="w-4 h-4 text-ink-3" />
                        <span>My Listings</span>
                      </Link>
                      <Link href="/agent/calendar" className="user-dropdown-item">
                        <CalendarDays className="w-4 h-4 text-ink-3" />
                        <span>Viewing Calendar</span>
                      </Link>
                      <Link href="/agent/offers" className="user-dropdown-item">
                        <HandCoins className="w-4 h-4 text-ink-3" />
                        <span>Incoming Offers</span>
                      </Link>
                      <Link href="/agent/messages" className="user-dropdown-item">
                        <MessageSquare className="w-4 h-4 text-ink-3" />
                        <span>Client Inquiries</span>
                      </Link>
                    </>
                  )}

                  {/* Admin Portal (for ADMIN only) */}
                  {isAdmin && (
                    <>
                      <div className="user-dropdown-section-title">Admin Governance</div>
                      <Link href="/admin" className="user-dropdown-item is-portal">
                        <ShieldCheck className="w-4 h-4 text-navy-900" />
                        <span>Dashboard Overview</span>
                      </Link>
                      <Link href="/admin/moderation" className="user-dropdown-item">
                        <ClipboardList className="w-4 h-4 text-ink-3" />
                        <span>Listing Moderation</span>
                      </Link>
                      <Link href="/admin/verification" className="user-dropdown-item">
                        <BadgeCheck className="w-4 h-4 text-ink-3" />
                        <span>Agent Verification</span>
                      </Link>
                    </>
                  )}

                  <div className="user-dropdown-footer">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="user-dropdown-item w-full text-error hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
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

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-white px-4 py-5 space-y-4 shadow-xl">
          {/* User Profile Card on Mobile */}
          {!isPending && session?.user && (
            <div className="rounded-xl border border-line bg-canvas p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-navy-900">{session.user.name}</div>
                  <div className="text-xs text-ink-3">{session.user.email}</div>
                </div>
                <span
                  className={`user-dropdown-role-badge ${
                    role === "ADMIN"
                      ? "role-badge-admin"
                      : role === "AGENT"
                        ? "role-badge-agent"
                        : "role-badge-buyer"
                  }`}
                >
                  {role === "ADMIN" ? "Admin" : role === "AGENT" ? "Agent" : "Buyer"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/buyer"
                  className="rounded-lg bg-white p-2 text-center text-xs font-semibold text-navy-900 border border-line"
                >
                  Buyer Portal
                </Link>
                {isAgent && (
                  <Link
                    href="/agent"
                    className="rounded-lg bg-navy-900 p-2 text-center text-xs font-semibold text-white"
                  >
                    Agent Portal
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="col-span-2 rounded-lg bg-navy-800 p-2 text-center text-xs font-semibold text-white"
                  >
                    Admin Console
                  </Link>
                )}
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-1.5">
            <Link
              href="/search"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname === "/search"
                  ? "bg-brass-050 text-brass-600 font-bold"
                  : "text-navy-900 hover:bg-canvas"
              }`}
            >
              Buy Properties
            </Link>
            <Link
              href="/areas"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname.startsWith("/areas")
                  ? "bg-brass-050 text-brass-600 font-bold"
                  : "text-navy-900 hover:bg-canvas"
              }`}
            >
              Districts &amp; GIS Radar
            </Link>
            <Link
              href="/how-it-works"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname === "/how-it-works"
                  ? "bg-brass-050 text-brass-600 font-bold"
                  : "text-navy-900 hover:bg-canvas"
              }`}
            >
              How It Works
            </Link>
            <Link
              href="/compare"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname === "/compare"
                  ? "bg-brass-050 text-brass-600 font-bold"
                  : "text-navy-900 hover:bg-canvas"
              }`}
            >
              Compare Residences
            </Link>
            <Link
              href="/market-insights"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname === "/market-insights"
                  ? "bg-brass-050 text-brass-600 font-bold"
                  : "text-navy-900 hover:bg-canvas"
              }`}
            >
              Market Insights
            </Link>
            <Link
              href="/agents"
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                pathname.startsWith("/agents")
                  ? "bg-brass-050 text-brass-600 font-bold"
                  : "text-navy-900 hover:bg-canvas"
              }`}
            >
              Verified Agents
            </Link>
            {!isPending && session?.user && (
              <Link
                href="/buyer/saved"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  pathname === "/buyer/saved"
                    ? "bg-brass-050 text-brass-600 font-bold"
                    : "text-navy-900 hover:bg-canvas"
                }`}
              >
                Saved Properties
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-line">
            {!isPending && session?.user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-1.5 py-2.5 text-center text-xs font-semibold text-error hover:underline"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  className="py-2.5 text-center rounded-lg border border-line text-navy-900 font-semibold text-xs hover:bg-canvas"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="py-2.5 text-center rounded-lg bg-navy-900 text-white font-semibold text-xs hover:bg-brass hover:text-navy-950"
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
