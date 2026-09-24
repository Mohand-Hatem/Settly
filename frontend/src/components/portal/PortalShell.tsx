"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  Building2,
  CalendarDays,
  ClipboardList,
  Compass,
  FileText,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { authClient, roleOf } from "@/lib/auth-client";
import { VerificationBanner, VerificationProvider } from "./EmailVerification";
import { NotificationBell } from "../notifications/NotificationBell";
import "@/styles/settly/portal.css";

export type Portal = "buyer" | "agent" | "admin";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: string };

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: Record<Portal, NavGroup[]> = {
  buyer: [
    {
      title: "My Portfolio",
      items: [
        { href: "/buyer", label: "Overview", icon: LayoutDashboard },
        { href: "/buyer/saved", label: "Favorites & Collections", icon: Bookmark },
        { href: "/buyer/saved?tab=searches", label: "Saved Searches", icon: Compass },
      ],
    },
    {
      title: "Activity & Offers",
      items: [
        { href: "/buyer/viewings", label: "My Viewings", icon: CalendarDays },
        { href: "/buyer/offers", label: "My Offers", icon: HandCoins },
        { href: "/buyer/messages", label: "Messages", icon: MessageSquare },
        { href: "/buyer/notifications", label: "Notifications", icon: Bell },
      ],
    },
    {
      title: "Account & Documents",
      items: [
        { href: "/buyer/documents", label: "My Documents", icon: FileText },
        { href: "/buyer/settings", label: "Account Settings", icon: Settings },
      ],
    },
  ],
  agent: [
    {
      title: "Listing & Pipeline",
      items: [
        { href: "/agent", label: "Overview", icon: LayoutDashboard },
        { href: "/agent/listings", label: "My Listings", icon: Building2 },
        { href: "/agent/calendar", label: "Viewing Calendar", icon: CalendarDays },
        { href: "/agent/offers", label: "Offers Review", icon: HandCoins },
        { href: "/agent/messages", label: "Client Inquiries", icon: MessageSquare },
      ],
    },
    {
      title: "Account & System",
      items: [
        { href: "/agent/notifications", label: "Notifications", icon: Bell },
        { href: "/agent/settings", label: "Account Settings", icon: Settings },
      ],
    },
  ],
  admin: [
    {
      title: "Governance Suite",
      items: [
        { href: "/admin", label: "Overview", icon: ShieldCheck },
        { href: "/admin/moderation", label: "Listing Moderation", icon: ClipboardList },
        { href: "/admin/verification", label: "Agent Verification", icon: BadgeCheck },
        { href: "/admin/sales", label: "Sales & Closings", icon: Scale },
        { href: "/buyer", label: "Buyer Portal", icon: LayoutDashboard },
      ],
    },
    {
      title: "Account & System",
      items: [
        { href: "/admin/notifications", label: "Notifications", icon: Bell },
      ],
    },
  ],
};

const PORTAL_LABEL: Record<Portal, string> = { buyer: "Buyer", agent: "Agent", admin: "Admin" };

export function PortalSwitcher({ current }: { current: Portal }) {
  const { data: session } = authClient.useSession();
  const userRole = roleOf(session?.user);
  const portals: Portal[] = userRole === "ADMIN" ? ["buyer", "admin"] : ["buyer", "agent"];


  return (
    <nav aria-label="Switch portal" className="portal-switcher-pill">
      {portals.map((p) => (
        <Link
          key={p}
          href={`/${p}`}
          aria-current={p === current ? "page" : undefined}
          className={`portal-switch-btn ${p === current ? "active" : ""}`}
        >
          {PORTAL_LABEL[p]} View
        </Link>
      ))}
    </nav>
  );
}

function NoAccessNotice() {
  const params = useSearchParams();
  if (params.get("notice") !== "no-access") return null;
  return (
    <p role="alert" className="mb-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink-2">
      You don&apos;t have access to that portal, so we brought you to your buyer dashboard.
    </p>
  );
}

export function PortalShell({ portal, children }: { portal: Portal; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cairoTime, setCairoTime] = useState("");

  const groups = NAV_GROUPS[portal];

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        setCairoTime(
          now.toLocaleTimeString("en-US", {
            timeZone: "Africa/Cairo",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      } catch {
        setCairoTime("12:00 PM");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const signOut = async () => {
    await authClient.signOut();
    router.replace("/");
  };

  const userRole = roleOf(session?.user);
  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const isItemActive = (href: string) => {
    const [baseHref, query] = href.split("?");
    const matchesPath =
      baseHref === `/${portal}`
        ? pathname === baseHref
        : pathname === baseHref || pathname.startsWith(`${baseHref}/`);
    if (!matchesPath) return false;
    if (query) {
      if (typeof window !== "undefined") {
        const currentParams = new URLSearchParams(window.location.search);
        return currentParams.get("tab") === "searches";
      }
      return false;
    }
    if (baseHref === "/buyer/saved" && typeof window !== "undefined") {
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get("tab") === "searches") return false;
    }
    return true;
  };

  // Determine current active section name for breadcrumbs
  const allItems = groups.flatMap((g) => g.items);
  const currentItem = allItems.find((item) => isItemActive(item.href));
  const currentTitle = currentItem?.label || "Overview";

  return (
    <VerificationProvider>
      <div className="portal-layout">
        {/* Mobile Backdrop Overlay */}
        <div
          className={`sidebar-backdrop ${mobileOpen ? "active" : ""}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar Navigation */}
        <aside
          className={`portal-sidebar ${mobileOpen ? "open" : ""}`}
          aria-label={`${PORTAL_LABEL[portal]} navigation`}
        >
          {/* Brand Plate Row */}
          <div className="sidebar-brand-row">
            <Link href="/" className="sidebar-brand">
              <div className="brand-plate">
                <Image src="/images/logo.png" alt="Settly Logo" width={28} height={28} priority />
              </div>
              <div className="brand-text">
                <span className="brand-name">Settly</span>
                <span className="brand-portal">{PORTAL_LABEL[portal]} Portal</span>
              </div>
            </Link>
            <button
              type="button"
              className="sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items grouped */}
          <div className="sidebar-scroll">
            {groups.map((group) => (
              <div key={group.title} className="nav-group">
                <div className="nav-group-label">{group.title}</div>
                {group.items.map(({ href, label, icon: Icon, badge }) => {
                  const active = isItemActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`nav-link ${active ? "active" : ""}`}
                    >
                      <Icon className="nav-icon" aria-hidden="true" />
                      <span>{label}</span>
                      {badge && <span className="nav-badge">{badge}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Private Advisor Desk Widget (Buyer Portal only - Category 2/3 Reference Component) */}
            {portal === "buyer" && (
              <div className="sidebar-advisor">
                <div className="advisor-header">
                  <div className="advisor-avatar-box bg-white p-1">
                    <Image
                      src="/images/logo.png"
                      alt="Settly Advisory Desk"
                      width={32}
                      height={32}
                      className="advisor-avatar object-contain"
                    />
                  </div>
                  <div className="advisor-info">
                    <span className="advisor-name">Settly Advisory Desk</span>
                    <span className="advisor-meta">
                      <span className="advisor-status-dot" />
                      Licensed Support
                    </span>
                  </div>
                </div>
                <div className="advisor-actions">
                  <Link href="/buyer/messages" className="btn-advisor-action btn-advisor-msg">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>In-Platform Message</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer User Strip */}
          <div className="sidebar-footer">
            <div className="sidebar-trust-marks">
              <div>VERIFIED LISTINGS &amp; SECURE DEPOSITS</div>
              <div>LICENSED INDEPENDENT BROKERS</div>
            </div>
            <div className="sidebar-user-strip">
              <div className="sidebar-user-info">
                <div className="sidebar-user-avatar">
                  {initials}
                </div>
                <div className="sidebar-user-details">
                  <span className="sidebar-user-name">
                    {session?.user?.name || "Client"}
                  </span>
                  <span className="sidebar-user-role">
                    {userRole === "ADMIN" ? "Admin" : userRole === "AGENT" ? "Agent" : "Private Buyer"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="btn-sidebar-logout"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <div className="portal-main">
          {/* Sticky Topbar */}
          <header className="portal-header">
            <div className="header-start">
              <button
                type="button"
                className="mobile-menu-trigger"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <nav className="header-breadcrumb" aria-label="Breadcrumb">
                <Link href={`/${portal}`} className="breadcrumb-node">
                  {PORTAL_LABEL[portal].toUpperCase()} PORTAL
                </Link>
                <span className="text-ink-4">/</span>
                <span className="breadcrumb-active">{currentTitle.toUpperCase()}</span>
              </nav>
            </div>

            <div className="header-end">
              <div className="portal-trust-chip hidden xl:inline-flex" title="Egyptian Real Estate Regulatory Compliance">
                <span className="pulse-dot-green" />
                <span>FRA COMPLIANT REGISTRATION</span>
              </div>

              <div className="sovereign-rate-pill hidden md:inline-flex" title="Sovereign Reference Exchange Rate (USD/EGP)">
                <span>USD/EGP 48.98</span>
              </div>

              {cairoTime && (
                <div className="cairo-clock-pill">
                  <span className="cairo-clock-dot" />
                  <span>Cairo {cairoTime} EET</span>
                </div>
              )}

              <PortalSwitcher current={portal} />

              <Link
                href="/search"
                className="header-icon-btn hidden sm:inline-flex"
                title="Search Properties (⌘K)"
                aria-label="Search Catalog"
              >
                <Search className="w-4 h-4 text-ink-2" />
              </Link>

              <NotificationBell portal={portal} />

              <Link
                href={`/${portal}/settings`}
                className="user-profile-badge"
                title="Account Settings"
              >
                <div className="user-avatar-initials">
                  {initials}
                </div>
                <div className="user-meta-col">
                  <span className="user-name-txt">{session?.user?.name || "Client"}</span>
                  <span className="user-role-lbl">VERIFIED CLIENT</span>
                </div>
              </Link>
            </div>
          </header>

          <VerificationBanner />

          <main className="min-w-0 flex-1">
            <React.Suspense fallback={null}>
              <NoAccessNotice />
            </React.Suspense>
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar (SH-12) */}
          <nav className="portal-mobile-bottom-nav" aria-label="Quick mobile navigation">
            {portal === "buyer" && (
              <>
                <Link
                  href="/buyer"
                  className={`mobile-bottom-nav-item ${pathname === "/buyer" ? "active" : ""}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Overview</span>
                </Link>
                <Link
                  href="/buyer/offers"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/buyer/offers") ? "active" : ""}`}
                >
                  <HandCoins className="w-5 h-5" />
                  <span>Offers</span>
                </Link>
                <Link
                  href="/buyer/viewings"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/buyer/viewings") ? "active" : ""}`}
                >
                  <CalendarDays className="w-5 h-5" />
                  <span>Viewings</span>
                </Link>
                <Link
                  href="/buyer/messages"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/buyer/messages") ? "active" : ""}`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Messages</span>
                </Link>
                <button
                  type="button"
                  className="mobile-bottom-nav-item"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open portal menu"
                >
                  <Menu className="w-5 h-5" />
                  <span>More</span>
                </button>
              </>
            )}
            {portal === "agent" && (
              <>
                <Link
                  href="/agent"
                  className={`mobile-bottom-nav-item ${pathname === "/agent" ? "active" : ""}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Overview</span>
                </Link>
                <Link
                  href="/agent/listings"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/agent/listings") ? "active" : ""}`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>Listings</span>
                </Link>
                <Link
                  href="/agent/calendar"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/agent/calendar") ? "active" : ""}`}
                >
                  <CalendarDays className="w-5 h-5" />
                  <span>Calendar</span>
                </Link>
                <Link
                  href="/agent/offers"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/agent/offers") ? "active" : ""}`}
                >
                  <HandCoins className="w-5 h-5" />
                  <span>Offers</span>
                </Link>
                <button
                  type="button"
                  className="mobile-bottom-nav-item"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open portal menu"
                >
                  <Menu className="w-5 h-5" />
                  <span>More</span>
                </button>
              </>
            )}
            {portal === "admin" && (
              <>
                <Link
                  href="/admin"
                  className={`mobile-bottom-nav-item ${pathname === "/admin" ? "active" : ""}`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Overview</span>
                </Link>
                <Link
                  href="/admin/moderation"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/admin/moderation") ? "active" : ""}`}
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>Moderation</span>
                </Link>
                <Link
                  href="/admin/verification"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/admin/verification") ? "active" : ""}`}
                >
                  <BadgeCheck className="w-5 h-5" />
                  <span>Verification</span>
                </Link>
                <Link
                  href="/admin/sales"
                  className={`mobile-bottom-nav-item ${pathname.startsWith("/admin/sales") ? "active" : ""}`}
                >
                  <Scale className="w-5 h-5" />
                  <span>Sales</span>
                </Link>
                <button
                  type="button"
                  className="mobile-bottom-nav-item"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open portal menu"
                >
                  <Menu className="w-5 h-5" />
                  <span>More</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </VerificationProvider>
  );
}
