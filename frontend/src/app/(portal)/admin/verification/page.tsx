"use client";

import React, { Suspense, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building,
  Clock,
  Eye,
  Search,
  ShieldCheck,
  ShieldAlert,
  Users,
} from "lucide-react";
import { problemMessage } from "@/api/errors";
import { adminAgentApplicationsQuery } from "@/lib/query/admin";
import type { AgentApplicationItem } from "@/api/identity";
import type { AgentApplicationStatus } from "@/api/admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApplicationReviewModal } from "@/components/admin/ApplicationReviewModal";

type TabFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const PROOF_TYPE_LABELS: Record<string, string> = {
  BROKER_LICENSE: "Syndicate License",
  BROKERAGE_AUTHORIZATION: "Brokerage Mandate / POA",
  COMMERCIAL_REGISTRATION: "Commercial Registration",
  OTHER: "Other Certificate",
};

function AdminVerificationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = (params.get("tab") as TabFilter) || "PENDING";
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const statusParam: AgentApplicationStatus | undefined =
    currentTab === "ALL" ? undefined : currentTab;

  // Query applications with current tab status filter
  const query = useQuery(adminAgentApplicationsQuery(statusParam));

  // Also query pending to have reliable counter badge
  const pendingQuery = useQuery(adminAgentApplicationsQuery("PENDING"));

  const rawApplications = useMemo(() => query.data?.items ?? [], [query.data]);
  const pendingCount = pendingQuery.data?.items?.length ?? 0;

  // Filter client-side by search query
  const applications = useMemo(() => {
    if (!searchQuery.trim()) return rawApplications;
    const q = searchQuery.toLowerCase();
    return rawApplications.filter((app) => {
      const name = (app.user.name || "").toLowerCase();
      const email = (app.user.email || "").toLowerCase();
      const license = (app.licenseNumber || "").toLowerCase();
      const brokerage = (app.brokerageName || "").toLowerCase();
      return name.includes(q) || email.includes(q) || license.includes(q) || brokerage.includes(q);
    });
  }, [rawApplications, searchQuery]);

  const handleTabChange = (tab: TabFilter) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", tab);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="portal-content max-w-[1540px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-brass-600" aria-hidden="true" />
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900 tracking-tight font-bold">
              Agent Accreditation Review Desk
            </h1>
          </div>
          <p className="mt-1 text-xs text-ink-3">
            Egyptian Real Estate Regulatory Authority License Accreditation (`ADM-04`, `ADM-05`, Decisions #56, #57).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-3 bg-canvas px-3 py-1.5 rounded-full border border-line">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">National ID &amp; Selfie Liveness Verification (#56)</span>
        </div>
      </div>

      {/* 4-Metric Executive Telemetry Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Pending Review</span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
              Awaiting KYC
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              {pendingCount}
            </span>
            <span className="text-xs text-ink-3">dossiers</span>
          </div>
          <p className="text-[11px] text-ink-4">SLA target: &lt; 24 business hours</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Current Filter</span>
            <span className="rounded-full bg-navy-100 text-navy-900 px-2 py-0.5 text-[10px] font-bold">
              {currentTab}
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              {rawApplications.length}
            </span>
            <span className="text-xs text-ink-3">in view</span>
          </div>
          <p className="text-[11px] text-ink-4">
            {currentTab === "PENDING"
              ? "Actionable queue requiring review"
              : "Historical compliance records"}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Regulatory Standard</span>
            <span className="rounded-full bg-canvas text-navy-900 px-2 py-0.5 text-[10px] font-bold">
              Law #119
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              100%
            </span>
            <span className="text-xs text-ink-3">audit trail</span>
          </div>
          <p className="text-[11px] text-ink-4">Decision logged with reviewer ID</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Governance Rule</span>
            <span className="rounded-full bg-brass-050 text-brass-800 px-2 py-0.5 text-[10px] font-bold">
              #67 Sentinel
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              Zero
            </span>
            <span className="text-xs text-ink-3">self-review</span>
          </div>
          <p className="text-[11px] text-ink-4">Conflict-of-interest strictly enforced</p>
        </div>
      </div>

      {/* Tabs & Search Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={currentTab === "PENDING"}
            onClick={() => handleTabChange("PENDING")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              currentTab === "PENDING"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas border border-line text-ink-2 hover:bg-white hover:text-navy-900"
            }`}
          >
            <span>Pending KYC</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-400 text-navy-900 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === "APPROVED"}
            onClick={() => handleTabChange("APPROVED")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              currentTab === "APPROVED"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas border border-line text-ink-2 hover:bg-white hover:text-navy-900"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Approved Applications</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === "REJECTED"}
            onClick={() => handleTabChange("REJECTED")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              currentTab === "REJECTED"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas border border-line text-ink-2 hover:bg-white hover:text-navy-900"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
            <span>Rejected Applications</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === "ALL"}
            onClick={() => handleTabChange("ALL")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              currentTab === "ALL"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas border border-line text-ink-2 hover:bg-white hover:text-navy-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Submissions</span>
          </button>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicant, license, brokerage..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line bg-canvas text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:border-brass focus:outline-none transition"
          />
        </div>
      </div>

      {/* Application List */}
      <div className="space-y-3">
        {query.isPending ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-line bg-white p-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-xs text-red-900">
            {problemMessage(query.error)}{" "}
            <button
              type="button"
              className="font-semibold underline text-navy-900 ml-2"
              onClick={() => query.refetch()}
            >
              Try again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<BadgeCheck className="h-8 w-8 text-brass-600" />}
            title={
              searchQuery
                ? "No applications match your search"
                : currentTab === "PENDING"
                ? "No pending agent applications"
                : "No applications found"
            }
            description={
              currentTab === "PENDING"
                ? "All accreditation dossiers have been reviewed and resolved."
                : "No application records match the current filter criteria."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {applications.map((app, idx) => (
              <ApplicationRow
                key={app.id}
                application={app}
                index={idx + 1}
                isSelected={app.id === selectedApplicationId}
                onSelect={() => setSelectedApplicationId(app.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal / Drawer */}
      <ApplicationReviewModal
        applicationId={selectedApplicationId}
        onClose={() => setSelectedApplicationId(null)}
      />
    </div>
  );
}

function ApplicationRow({
  application,
  index,
  isSelected,
  onSelect,
}: {
  application: AgentApplicationItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const initials = application.user.name
    ? application.user.name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AP";

  const isPending = application.status === "PENDING";
  const isApproved = application.status === "APPROVED";
  const isRejected = application.status === "REJECTED";

  return (
    <div
      onClick={onSelect}
      className={`group relative cursor-pointer rounded-2xl border p-4 transition-all ${
        isSelected
          ? "border-brass bg-brass-050/30 ring-1 ring-brass shadow-sm"
          : "border-line bg-white hover:border-brass/70 hover:shadow-sm"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Avatar & Applicant Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="hidden sm:inline-flex font-mono text-[11px] font-bold text-ink-4 w-5 shrink-0">
            #{index}
          </span>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 font-display font-semibold text-white shadow-sm">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-navy-900 group-hover:text-brass-600 transition-colors truncate">
                {application.user.name}
              </span>

              <span className="rounded bg-canvas border border-line px-1.5 py-0.5 font-mono text-[10px] font-bold text-brass-700">
                #{application.id.slice(0, 8).toUpperCase()}
              </span>

              {isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 font-mono">
                  <ShieldCheck className="h-3 w-3" />
                  ACCREDITED
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 font-mono">
                  <Clock className="h-3 w-3" />
                  PENDING KYC
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 font-mono">
                  <ShieldAlert className="h-3 w-3" />
                  REJECTED
                </span>
              )}

              <span className="rounded-full bg-navy-50 border border-navy-100 px-2 py-0.5 font-mono text-[10px] text-navy-800">
                {PROOF_TYPE_LABELS[application.proofType] || application.proofType}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
              <span className="font-mono font-medium text-navy-900">
                Lic: {application.licenseNumber}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3 text-ink-4" />
                {application.brokerageName || "Independent Broker"}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-ink-4 truncate">
                {application.user.email}
              </span>
              <span>•</span>
              <span className="text-ink-4 text-[11px]">
                Filed {new Date(application.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Inspection Action */}
        <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-8 px-3.5 group-hover:border-brass group-hover:text-brass-700 font-semibold"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Inspect Dossier
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1540px] space-y-6" aria-busy="true" aria-label="Loading verification desk">
          <Skeleton className="h-8 w-64 font-display" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      }
    >
      <AdminVerificationContent />
    </Suspense>
  );
}
