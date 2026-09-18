"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, CalendarDays, LayoutDashboard, LogOut, ShieldCheck, type LucideIcon } from "lucide-react";
import { authClient, roleOf, type Role } from "@/lib/auth-client";
import { VerificationBanner, VerificationProvider } from "./EmailVerification";

export type Portal = "buyer" | "agent" | "admin";

type NavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Only screens that exist are listed (#106: no links to unbuilt screens). Items are added as their
 * phases ship (inventory 05, spec S1-01).
 */
const NAV: Record<Portal, NavItem[]> = {
  buyer: [
    { href: "/buyer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/buyer/viewings", label: "Viewings", icon: CalendarDays },
  ],
  agent: [
    { href: "/agent", label: "Dashboard", icon: LayoutDashboard },
    { href: "/agent/calendar", label: "Calendar", icon: CalendarClock },
  ],
  admin: [{ href: "/admin", label: "Dashboard", icon: ShieldCheck }],
};

const PORTAL_LABEL: Record<Portal, string> = { buyer: "Buyer", agent: "Agent", admin: "Admin" };

/** Portals each role may use (#97): USER none to switch; AGENT Buyer↔Agent; ADMIN Buyer↔Admin. */
const PORTALS_FOR: Record<Role, Portal[]> = {
  USER: ["buyer"],
  AGENT: ["buyer", "agent"],
  ADMIN: ["buyer", "admin"],
};

function isActive(pathname: string, href: string, portalRoot: string) {
  return href === portalRoot ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalSwitcher({ current }: { current: Portal }) {
  const { data: session } = authClient.useSession();
  const portals = PORTALS_FOR[roleOf(session?.user)];
  if (portals.length < 2) return null;
  return (
    <nav aria-label="Switch portal" className="flex rounded-lg border border-line bg-canvas p-0.5 text-xs font-semibold">
      {portals.map((p) => (
        <Link
          key={p}
          href={`/${p}`}
          aria-current={p === current ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            p === current ? "bg-navy-900 text-white shadow-sm" : "text-ink-2 hover:text-navy-900"
          }`}
        >
          {PORTAL_LABEL[p]}
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
  const { data: session, isPending } = authClient.useSession();
  const items = NAV[portal];

  const signOut = async () => {
    await authClient.signOut();
    router.replace("/");
  };

  return (
    <VerificationProvider>
      <div className="flex min-h-screen flex-col bg-canvas">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg text-navy-900">
              <img src="/images/logo.png" alt="" width={28} height={28} />
              <span>Settly</span>
            </Link>
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-ink-3 sm:inline">
              {PORTAL_LABEL[portal]} portal
            </span>
            <div className="ml-auto flex items-center gap-3">
              <PortalSwitcher current={portal} />
              {isPending ? (
                <span className="h-8 w-24 animate-pulse rounded-md bg-canvas-2" aria-hidden />
              ) : (
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink sm:inline">
                  {session?.user?.name}
                </span>
              )}
              <button
                type="button"
                onClick={signOut}
                className="rounded-md p-2 text-ink-3 transition-colors hover:bg-canvas hover:text-navy-900"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <VerificationBanner />
        </header>

        <div className="flex flex-1">
          <aside className="hidden w-56 shrink-0 border-r border-line bg-white md:block" aria-label={`${PORTAL_LABEL[portal]} navigation`}>
            <nav className="flex flex-col gap-1 p-3">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href, `/${portal}`);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-brass-50 text-navy-900" : "text-ink-2 hover:bg-canvas hover:text-navy-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-brass-600" : ""}`} aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-10">
            <React.Suspense fallback={null}>
              <NoAccessNotice />
            </React.Suspense>
            {children}
          </main>
        </div>

        <nav
          aria-label={`${PORTAL_LABEL[portal]} navigation`}
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white md:hidden"
        >
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href, `/${portal}`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
                  active ? "text-navy-900" : "text-ink-3"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-brass-600" : ""}`} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </VerificationProvider>
  );
}
