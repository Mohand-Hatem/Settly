"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

type TargetType = "LISTING" | "AGENT" | "USER";
type ReportStatus = "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

interface ReportItem {
  id: string;
  targetType: TargetType;
  targetId: string;
  targetTitle: string;
  reason: string;
  details?: string;
  priority: Priority;
  status: ReportStatus;
  reporterName: string;
  reporterEmail: string;
  createdAt: string;
}

const INITIAL_REPORTS: ReportItem[] = [
  {
    id: "rep-0192e220-77a1",
    targetType: "LISTING",
    targetId: "0192cd45-6677-7002-9a1b-8811b7000002",
    targetTitle: "Secluded Villa with Private Lagoon in New Giza",
    reason: "Discrepancy in advertised square meters vs compound layout",
    details: "Buyer reports the advertised BUA of 450 m² does not match the actual master plan for this cluster (which caps at 360 m²).",
    priority: "HIGH",
    status: "PENDING",
    reporterName: "Tarek Mansour",
    reporterEmail: "tarek.m@outlook.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "rep-0192e215-66b2",
    targetType: "AGENT",
    targetId: "0192d83a-8742-7001-9c6a-6cfa73500001",
    targetTitle: "Agent Hana Khalil (Heliopolis Premier)",
    reason: "Requested offline cash transaction outside platform",
    details: "Buyer alleges agent suggested skipping the formal reservation deposit on Settly in exchange for a direct bank deposit.",
    priority: "CRITICAL",
    status: "INVESTIGATING",
    reporterName: "Mariam El-Shenawy",
    reporterEmail: "m.shenawy@gmail.com",
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
  {
    id: "rep-0192e190-55c3",
    targetType: "LISTING",
    targetId: "0192ce91-4e78-7001-8b3a-9922a9000001",
    targetTitle: "Ultra-Modern Townhouse in Mivida New Cairo",
    reason: "Duplicate listing detected by automated catalog fingerprint",
    details: "Identical exterior photography uploaded by two separate broker accounts within 48 hours.",
    priority: "MEDIUM",
    status: "PENDING",
    reporterName: "Settly Catalog Guard",
    reporterEmail: "system@settly.estate",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: "rep-0192e140-44d4",
    targetType: "USER",
    targetId: "usr_buyer_repeat_noshow",
    targetTitle: "Registered User Karim Z.",
    reason: "Multiple consecutive viewing no-shows",
    details: "Agent reported 3 confirmed private viewings where client failed to attend without notice.",
    priority: "LOW",
    status: "RESOLVED",
    reporterName: "Youssef Nabil",
    reporterEmail: "youssef.n@settly.estate",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

function formatCairoDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-EG", {
      timeZone: "Africa/Cairo",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return isoString;
  }
}

function ReportsContent() {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [activeTab, setActiveTab] = useState<"ALL" | TargetType>("ALL");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [search, setSearch] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
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

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (activeTab !== "ALL" && r.targetType !== activeTab) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.targetTitle.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.targetId.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q)
      );
    });
  }, [reports, activeTab, search]);

  const handleResolve = (action: "DISMISS" | "UPHOLD" | "SUSPEND") => {
    if (!selectedReport) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? {
              ...r,
              status: action === "DISMISS" ? "DISMISSED" : "RESOLVED",
            }
          : r
      )
    );
    setSelectedReport(null);
    setResolutionNotes("");
  };

  const priorityClasses: Record<Priority, string> = {
    CRITICAL: "bg-red-50 text-red-700 border-red-200",
    HIGH: "bg-amber-50 text-amber-800 border-amber-200",
    MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
    LOW: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const statusClasses: Record<ReportStatus, string> = {
    PENDING: "bg-amber-50 text-amber-800 border-amber-200",
    INVESTIGATING: "bg-blue-50 text-blue-700 border-blue-200",
    RESOLVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    DISMISSED: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const openCount = reports.filter((r) => r.status === "PENDING" || r.status === "INVESTIGATING").length;
  const criticalCount = reports.filter((r) => r.priority === "CRITICAL" && r.status !== "RESOLVED" && r.status !== "DISMISSED").length;

  return (
    <div className="portal-content max-w-[1540px] space-y-6">
      {/* Header */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <div className="flex items-center gap-2">
            <Flag className="h-6 w-6 text-brass-600" aria-hidden />
            <h1>Abuse &amp; Compliance Reports</h1>
          </div>
          <p>
            Central moderation triage for reported listings, broker code-of-conduct violations, and transaction disputes (Decision #28).
          </p>
        </div>
        <div className="welcome-actions-row">
          {cairoTime && (
            <div className="cairo-clock-pill">
              <span className="cairo-clock-dot" />
              <span>{cairoTime}</span>
            </div>
          )}
          <div className="portal-trust-chip">
            <span className="trust-chip-dot" />
            <span>Fiduciary Review Active</span>
          </div>
        </div>
      </section>

      {/* 4-Metric Executive Telemetry Ribbon */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Reports Telemetry">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Open Reports</span>
            <span className={`metric-badge-tag ${openCount > 0 ? "brass" : ""}`}>
              {openCount > 0 ? "TRIAGE NEEDED" : "CLEAR"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">{openCount}</span>
            <span className="font-mono text-xs text-ink-3">active</span>
          </div>
          <div className="metric-footnote-txt">
            <Clock className="h-3.5 w-3.5 text-brass-600" />
            <span>Target response SLA: &lt; 24h</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Critical Priority</span>
            <span className={`metric-badge-tag ${criticalCount > 0 ? "brass" : ""}`}>
              {criticalCount > 0 ? "ACTION REQUIRED" : "NONE"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">{criticalCount}</span>
            <span className="font-mono text-xs text-ink-3">urgent</span>
          </div>
          <div className="metric-footnote-txt">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span>Escrow &amp; offline fee bypass</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Listing Integrity</span>
            <span className="metric-badge-tag sage">PROTECTED</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-navy-900">Cadastral Guard</span>
          </div>
          <div className="metric-footnote-txt">
            <ShieldCheck className="h-3.5 w-3.5 text-sage" />
            <span>Duplicate &amp; spec validation</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Governance Mandate</span>
            <span className="metric-badge-tag">DECISION #28</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-navy-900">Neutral Fiduciary</span>
          </div>
          <div className="metric-footnote-txt">
            <CheckCircle2 className="h-3.5 w-3.5 text-ink-3" />
            <span>Two-sided dispute audit</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-line pb-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { key: "ALL", label: "All Reports" },
              { key: "LISTING", label: "Listings" },
              { key: "AGENT", label: "Brokers & Agents" },
              { key: "USER", label: "Buyer Accounts" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                activeTab === t.key
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-canvas border border-line text-ink-2 hover:border-line-2 hover:bg-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-3" />
          <input
            type="text"
            placeholder="Search report reason, target, or reporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-1.5 text-xs text-navy-900 placeholder:text-ink-3 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
      </section>

      {/* Reports Table */}
      <section className="rounded-2xl border border-line bg-white overflow-hidden shadow-settly">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-canvas/60 font-mono text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Alleged Violation</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Date (CLT)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-3">
                    No reports match the current filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-canvas/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border ${priorityClasses[report.priority]}`}
                      >
                        {report.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-display font-bold text-navy-900 block truncate max-w-[200px]">
                          {report.targetTitle}
                        </span>
                        <span className="font-mono text-[10px] text-ink-3">
                          {report.targetType} · {report.targetId.slice(0, 14)}...
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-navy-900 line-clamp-1 max-w-[240px]">
                        {report.reason}
                      </p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div>
                        <span className="text-ink-2 font-medium block">
                          {report.reporterName}
                        </span>
                        <span className="font-mono text-[10px] text-ink-3">
                          {report.reporterEmail}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-ink-2 whitespace-nowrap">
                      {formatCairoDate(report.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border ${statusClasses[report.status]}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1 text-xs font-semibold text-ink-2 transition hover:border-line-2 hover:bg-white hover:text-navy-900"
                      >
                        <Eye className="h-3.5 w-3.5 text-brass-600" />
                        <span>Adjudicate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Adjudication Modal */}
      {selectedReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-line bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line p-5 bg-canvas/50">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-brass-600" />
                <div>
                  <h3 className="font-display text-base font-bold text-navy-900">
                    Report Adjudication Desk
                  </h3>
                  <p className="font-mono text-[10px] text-ink-3">
                    ID: {selectedReport.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-canvas hover:text-navy-900 transition"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="rounded-xl border border-line p-4 bg-canvas/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-ink-3 uppercase">
                    Target {selectedReport.targetType}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold border ${priorityClasses[selectedReport.priority]}`}
                  >
                    {selectedReport.priority} PRIORITY
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold text-navy-900">
                  {selectedReport.targetTitle}
                </h4>
                <p className="font-mono text-xs text-ink-3">
                  Entity ID: {selectedReport.targetId}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-xs font-bold text-navy-900">
                  Alleged Violation / Claim
                </span>
                <p className="text-xs font-semibold text-navy-900 bg-amber-50/50 border border-amber-200/60 rounded-xl p-3">
                  {selectedReport.reason}
                </p>
                {selectedReport.details && (
                  <p className="text-xs text-ink-2 bg-canvas border border-line rounded-xl p-3 leading-relaxed">
                    {selectedReport.details}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs font-bold text-navy-900 block">
                  Adjudication Findings &amp; Resolution Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record formal reasons for upholding or dismissing this report (recorded in AuditLog per Decision #42)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white p-3 text-xs text-navy-900 placeholder:text-ink-3 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-line p-4 bg-canvas/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolve("DISMISS")}
                className="w-full sm:w-auto text-xs text-ink-3 hover:text-navy-900"
              >
                Dismiss (No Violation)
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve("UPHOLD")}
                  className="w-full sm:w-auto text-xs text-amber-800 border-amber-200 hover:bg-amber-50"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600 mr-1" />
                  Uphold &amp; Warn
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleResolve("SUSPEND")}
                  className="w-full sm:w-auto text-xs bg-red-600 text-white hover:bg-red-700"
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Suspend Entity
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-content max-w-[1540px] space-y-6">
          <div className="h-8 w-64 bg-canvas-2 rounded animate-pulse" />
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
