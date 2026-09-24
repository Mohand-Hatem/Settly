"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { adminStatsQuery } from "@/lib/query/admin";
import { problemMessage } from "@/api/errors";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

function StatCard({
  title,
  count,
  description,
  href,
  badgeText,
  badgeVariant = "neutral",
  icon: Icon,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  badgeText?: string;
  badgeVariant?: "neutral" | "warning" | "danger" | "success";
  icon: React.ElementType;
}) {
  const badgeClasses = {
    neutral: "bg-navy-50 text-navy-800 border-navy-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  }[badgeVariant];

  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-5 transition-all hover:border-brass hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold tracking-wider text-ink-3 uppercase">
            {title}
          </span>
          <div className="rounded-xl border border-line bg-canvas p-2.5 text-navy-900 group-hover:border-brass group-hover:text-brass-600 transition-colors">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
            {count}
          </span>
          {badgeText && (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${badgeClasses}`}
            >
              {badgeText}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-ink-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-1.5 pt-3 border-t border-line/60 text-xs font-semibold text-brass-600 group-hover:text-brass-700 transition-colors">
        <span>Enter Governance Queue</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function AdminDashboardContent() {
  const { data, isPending, isError, error, refetch } = useQuery(adminStatsQuery());
  const [cairoTime, setCairoTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: "Africa/Cairo",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date());
        setCairoTime(`${timeStr} CLT`);
      } catch {
        setCairoTime("12:00:00 CLT");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isPending) {
    return (
      <div className="mx-auto max-w-[1540px] space-y-8" aria-busy="true" aria-label="Loading admin dashboard">
        <div className="space-y-2 border-b border-line pb-5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="portal-content max-w-[1440px]">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-xs text-red-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Failed to load operational dashboard</span>
          </div>
          <p>{problemMessage(error)}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const {
    pendingListings = 0,
    pendingAgentApplications = 0,
    salesNearDeadline = 0,
    failedRefundAlerts = 0,
  } = data || {};

  const totalActionRequired =
    pendingListings + pendingAgentApplications + salesNearDeadline + failedRefundAlerts;

  return (
    <div className="portal-content max-w-[1440px] space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brass-600" aria-hidden />
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900 tracking-tight">
              Central Oversight &amp; Governance
            </h1>
          </div>
          <p className="mt-1 text-xs text-ink-3">
            Real-time fiduciary oversight across listing compliance, broker accreditation, and transaction integrity (Decision #28).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {cairoTime && (
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-mono text-ink-3">
              <span className="h-2 w-2 rounded-full bg-brass animate-pulse" />
              <span>{cairoTime}</span>
              <span className="text-ink-4">· Africa/Cairo</span>
            </div>
          )}

          {totalActionRequired === 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>All queues clear</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 font-mono">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                <strong>{totalActionRequired}</strong> action{totalActionRequired === 1 ? "" : "s"} required
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="space-y-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-navy-900 font-mono">
          Load-Bearing Governance Queues
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Listing Moderation"
            count={pendingListings}
            description="Properties submitted by accredited brokers waiting for cadastral and title compliance."
            href="/admin/moderation"
            badgeText={pendingListings > 0 ? "Review Required" : "Clear"}
            badgeVariant={pendingListings > 0 ? "warning" : "success"}
            icon={ClipboardList}
          />

          <StatCard
            title="Agent Accreditation"
            count={pendingAgentApplications}
            description="Brokerage and agent verification requests with Egyptian regulatory authority license credentials."
            href="/admin/verification"
            badgeText={pendingAgentApplications > 0 ? "Pending KYC" : "Clear"}
            badgeVariant={pendingAgentApplications > 0 ? "warning" : "success"}
            icon={BadgeCheck}
          />

          <StatCard
            title="Conveyance Deadlines"
            count={salesNearDeadline}
            description="Two-party sale confirmations requiring adjudication or approaching the 30-day timeline."
            href="/admin/sales?tab=ACTION_REQUIRED"
            badgeText={salesNearDeadline > 0 ? "Urgent Case" : "Nominal"}
            badgeVariant={salesNearDeadline > 0 ? "danger" : "success"}
            icon={Scale}
          />

          <StatCard
            title="Refund Alerts"
            count={failedRefundAlerts}
            description="Deposit refunds that encountered gateway anomalies requiring manual administrative intervention."
            href="/admin/sales"
            badgeText={failedRefundAlerts > 0 ? "Intervene" : "Zero"}
            badgeVariant={failedRefundAlerts > 0 ? "danger" : "neutral"}
            icon={failedRefundAlerts > 0 ? ShieldAlert : CheckCircle2}
          />
        </div>
      </div>

      {/* Primary Governance Desks */}
      <div className="space-y-4">
        <h2 className="font-bold text-xs uppercase tracking-wider text-navy-900 font-mono">
          Operational Desks &amp; Workspaces
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Moderation Desk */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 transition-all hover:border-brass hover:shadow-md">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-line bg-canvas p-2.5 text-brass-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-900">Listing Moderation Queue</h3>
                  <span className="font-mono text-[10px] text-ink-3">ADM-02 · Transitions P3, P4, P12</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-2 leading-relaxed">
                Review submitted listings in FIFO submission order. Inspect photos, structural dimensions, and developer deed verification. Approve into public catalog or reject with required explanation.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-line/60">
              <Link
                href="/admin/moderation"
                className="inline-flex items-center justify-center w-full rounded-xl bg-navy-900 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 transition"
              >
                Launch Moderation Workspace
              </Link>
            </div>
          </div>

          {/* Verification Desk */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 transition-all hover:border-brass hover:shadow-md">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-line bg-canvas p-2.5 text-brass-600">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-900">Agent Accreditation Desk</h3>
                  <span className="font-mono text-[10px] text-ink-3">ADM-04, ADM-05 · Decision #56</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-2 leading-relaxed">
                Review real estate professional registrations. Cross-examine Egyptian authority license number, agency identity, and verification status. Revoke accreditation with automatic mandate freeze when required.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-line/60">
              <Link
                href="/admin/verification"
                className="inline-flex items-center justify-center w-full rounded-xl bg-navy-900 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 transition"
              >
                Launch Accreditation Desk
              </Link>
            </div>
          </div>

          {/* Conveyance Desk */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 transition-all hover:border-brass hover:shadow-md">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl border border-line bg-canvas p-2.5 text-brass-600">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy-900">Sales &amp; Adjudication</h3>
                  <span className="font-mono text-[10px] text-ink-3">ADM-07 · Transitions P9, P10</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-2 leading-relaxed">
                Adjudicate conveyance cases that reach the 30-day deadline or report mutual disputes. Confirm sale completion to mark SOLD, or relist under §7 deposit refund governance.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-line/60">
              <Link
                href="/admin/sales"
                className="inline-flex items-center justify-center w-full rounded-xl bg-navy-900 py-2.5 text-xs font-semibold text-white hover:bg-navy-800 transition"
              >
                Launch Conveyance Desk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-content max-w-[1440px] space-y-6" aria-busy="true" aria-label="Loading dashboard">
          <Skeleton className="h-8 w-48 font-display" />
          <Skeleton className="h-4 w-72" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
