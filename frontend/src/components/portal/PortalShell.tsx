"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  Compass,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Scale,
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
      title: "Fiduciary Suite",
      items: [
        { href: "/buyer", label: "Overview", icon: LayoutDashboard },
        { href: "/buyer/offers", label: "My Offers", icon: HandCoins },
        { href: "/buyer/viewings", label: "Viewings", icon: CalendarDays },
        { href: "/buyer/messages", label: "Messages", icon: MessageSquare },
        { href: "/search", label: "Browse Catalog", icon: Compass },
      ],
    },
    {
      title: "Account & System",
      items: [
        { href: "/buyer/notifications", label: "Notifications", icon: Bell },
        { href: "/buyer/settings", label: "Account Settings", icon: Settings },
      ],
    },
  ],
  agent: [
    {
      title: "Operational Suite",
      items: [
        { href: "/agent", label: "Overview", icon: LayoutDashboard },
        { href: "/agent/offers", label: "Offers Review", icon: HandCoins },
        { href: "/agent/calendar", label: "Calendar & Tours", icon: CalendarClock },
        { href: "/agent/messages", label: "Messages", icon: MessageSquare },
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

function isActive(pathname: string, href: string, portalRoot: string) {
  return href === portalRoot ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalSwitcher({ current }: { current: Portal }) {
  const { data: session } = authClient.useSession();
  const userRole = roleOf(session?.user);
  const portals: Portal[] = userRole === "ADMIN" ? ["buyer", "agent", "admin"] : ["buyer", "agent"];

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

  // Determine current active section name for breadcrumbs
  const allItems = groups.flatMap((g) => g.items);
  const currentItem = allItems.find((item) => isActive(pathname, item.href, `/${portal}`));
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
                  const active = isActive(pathname, href, `/${portal}`);
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
          </div>

          {/* Footer User Strip */}
          <div className="sidebar-footer">
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
                <Link href="/" className="breadcrumb-node">Settly</Link>
                <span>/</span>
                <Link href={`/${portal}`} className="breadcrumb-node">{PORTAL_LABEL[portal]}</Link>
                <span>/</span>
                <span className="breadcrumb-active">{currentTitle}</span>
              </nav>
            </div>

            <div className="header-end">
              {cairoTime && (
                <div className="cairo-clock-pill">
                  <span className="cairo-clock-dot" />
                  <span>Cairo {cairoTime} EET</span>
                </div>
              )}

              <PortalSwitcher current={portal} />

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
                  <span className="user-name-txt">{session?.user?.name?.split(" ")[0] || "User"}</span>
                  <span className="user-role-lbl">{PORTAL_LABEL[portal]}</span>
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
        </div>
      </div>
    </VerificationProvider>
  );
}
