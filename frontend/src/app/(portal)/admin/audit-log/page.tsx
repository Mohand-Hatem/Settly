"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  FileText,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AuditEntry {
  id: string;
  actorType: "ADMIN" | "AGENT" | "USER" | "SYSTEM";
  actorId: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// Sample events demonstrating real schema models (Decision #42, Prisma model AuditLog)
const INITIAL_LOG_ENTRIES: AuditEntry[] = [
  {
    id: "0192e21b-4f11-7001-9a1c-3b91fa000001",
    actorType: "ADMIN",
    actorId: "usr_admin_governance",
    actorName: "System Administrator",
    action: "AGENT_VERIFICATION_APPROVED",
    entityType: "Agent",
    entityId: "0192d83a-8742-7001-9c6a-6cfa73500001",
    ipAddress: "197.34.12.8",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    metadata: {
      licenseNumber: "RE-EG-2024-0891",
      brokerageName: "Heliopolis Premier Realty",
      notes: "Valid syndicate license authenticated via Egyptian Real Estate Authority registry.",
      decisionNumber: 56,
    },
  },
  {
    id: "0192e20f-3a22-7002-8d2b-4c82fa000002",
    actorType: "ADMIN",
    actorId: "usr_admin_governance",
    actorName: "Compliance Desk",
    action: "PROPERTY_REVIEW_APPROVED",
    entityType: "Property",
    entityId: "0192ce91-4e78-7001-8b3a-9922a9000001",
    ipAddress: "197.34.12.8",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    metadata: {
      slug: "luxury-duplex-in-katameya-heights",
      propertyType: "DUPLEX",
      priceEgp: "1850000000",
      complianceStatus: "PUBLISHED",
      decisionNumber: 94,
    },
  },
  {
    id: "0192e1f5-1100-7003-7a3c-1b73fa000003",
    actorType: "ADMIN",
    actorId: "usr_admin_governance",
    actorName: "Compliance Desk",
    action: "PROPERTY_REVIEW_REJECTED",
    entityType: "Property",
    entityId: "0192cd45-6677-7002-9a1b-8811b7000002",
    ipAddress: "197.34.12.8",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    metadata: {
      reasonCode: "PRICE_INCONSISTENCY",
      details: "Reported price deviates significantly from area benchmark without valuation justification.",
      decisionNumber: 94,
    },
  },
  {
    id: "0192e1e0-9821-7004-6b4d-0a64fa000004",
    actorType: "SYSTEM",
    actorId: "sys_escrow_engine",
    actorName: "Settly Paymob Gateway",
    action: "DEPOSIT_HOLD_ACQUIRED",
    entityType: "Payment",
    entityId: "0192cb12-9900-7003-8c2d-7700c6000003",
    ipAddress: "196.205.14.92",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    metadata: {
      amountPiastres: 5000000,
      currency: "EGP",
      holdDurationMinutes: 15,
      provider: "PAYMOB_SANDBOX",
      decisionNumber: 13,
    },
  },
  {
    id: "0192e1c9-7733-7005-5c5e-9f55fa000005",
    actorType: "ADMIN",
    actorId: "usr_admin_governance",
    actorName: "Conveyance Auditor",
    action: "SALE_CONVEYANCE_CONFIRMED",
    entityType: "Offer",
    entityId: "0192ca55-4411-7004-7b1e-6699d5000004",
    ipAddress: "197.34.12.8",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    metadata: {
      buyerConfirmation: true,
      agentConfirmation: true,
      deadlineDays: 30,
      decisionNumber: 77,
      status: "SOLD",
    },
  },
];

type CategoryFilter = "ALL" | "IDENTITY" | "PROPERTIES" | "SALES" | "SYSTEM";

function formatCairoDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-EG", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return isoString;
  }
}

function AuditLogContent() {
  const [entries] = useState<AuditEntry[]>(INITIAL_LOG_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [search, setSearch] = useState("");
  const [cairoTime, setCairoTime] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (category === "IDENTITY" && e.entityType !== "Agent" && e.entityType !== "User") return false;
      if (category === "PROPERTIES" && e.entityType !== "Property") return false;
      if (category === "SALES" && e.entityType !== "Offer" && e.entityType !== "Payment") return false;
      if (category === "SYSTEM" && e.actorType !== "SYSTEM") return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        e.entityId.toLowerCase().includes(q) ||
        (e.actorName || "").toLowerCase().includes(q) ||
        (e.ipAddress || "").includes(q)
      );
    });
  }, [entries, category, search]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const actorBadgeClasses = {
    ADMIN: "bg-navy-900 text-white border-navy-950",
    AGENT: "bg-brass-050 text-brass-700 border-brass-200",
    USER: "bg-canvas border-line text-ink-2",
    SYSTEM: "bg-sage-bg text-sage border-sage/30",
  };

  return (
    <div className="portal-content max-w-[1540px] space-y-6">
      {/* Header */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-brass-600" aria-hidden />
            <h1>Immutable Audit Log</h1>
          </div>
          <p>
            Append-only fiduciary ledger tracking administrative verifications, listing reviews, and conveyance milestones (Decision #42).
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
            <span>audit_log_immutable_trg active</span>
          </div>
        </div>
      </section>

      {/* 4-Metric Executive Telemetry Ribbon */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Audit Telemetry">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Total Audit Records</span>
            <span className="metric-badge-tag sage">PROTECTED</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">{entries.length}</span>
            <span className="font-mono text-xs text-ink-3">events</span>
          </div>
          <div className="metric-footnote-txt">
            <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
            <span>PostgreSQL append-only constraint</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Governance Interventions</span>
            <span className="metric-badge-tag brass">ADMIN</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="metric-num-val">
              {entries.filter((e) => e.actorType === "ADMIN").length}
            </span>
            <span className="font-mono text-xs text-ink-3">adjudications</span>
          </div>
          <div className="metric-footnote-txt">
            <ShieldCheck className="h-3.5 w-3.5 text-brass-600" />
            <span>Manual human audit trials</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Database Guard</span>
            <span className="metric-badge-tag sage">ENFORCED</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-navy-900">NO UPDATE / DELETE</span>
          </div>
          <div className="metric-footnote-txt">
            <ShieldAlert className="h-3.5 w-3.5 text-navy-800" />
            <span>Trigger blocks tampering</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-card-label">Time Standard</span>
            <span className="metric-badge-tag">UTC +2</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-navy-900">Africa/Cairo</span>
          </div>
          <div className="metric-footnote-txt">
            <Clock className="h-3.5 w-3.5 text-ink-3" />
            <span>Statutory Egyptian timestamps</span>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-line pb-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { key: "ALL", label: "All Events" },
              { key: "IDENTITY", label: "Agent Identity" },
              { key: "PROPERTIES", label: "Properties" },
              { key: "SALES", label: "Sales & Escrow" },
              { key: "SYSTEM", label: "System Gateway" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setCategory(t.key)}
              className={`rounded-full px-3 py-1 font-mono text-xs font-semibold transition ${
                category === t.key
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-canvas border border-line text-ink-2 hover:border-line-2 hover:bg-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-3" />
          <input
            type="text"
            placeholder="Search action, entity ID, or actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-1.5 text-xs text-navy-900 placeholder:text-ink-3 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
          />
        </div>
      </section>

      {/* Ledger Table */}
      <section className="rounded-2xl border border-line bg-white overflow-hidden shadow-settly">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-canvas/60 font-mono text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (CLT)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Network IP</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-3">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-canvas/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedEntry(log)}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-ink-2 whitespace-nowrap">
                      {formatCairoDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-navy-900">
                        <span className="h-1.5 w-1.5 rounded-full bg-brass" />
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold border ${actorBadgeClasses[log.actorType]}`}
                        >
                          {log.actorType}
                        </span>
                        <span className="text-ink-2 font-medium truncate max-w-[120px]">
                          {log.actorName ?? log.actorId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-canvas border border-line px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-2">
                          {log.entityType}
                        </span>
                        <span className="font-mono text-[11px] text-ink-3 truncate max-w-[120px]">
                          {log.entityId}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-ink-3 whitespace-nowrap">
                      {log.ipAddress ?? "internal"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(log);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-2 transition hover:border-line-2 hover:bg-white hover:text-navy-900"
                      >
                        <Code2 className="h-3 w-3 text-brass-600" />
                        <span>Payload</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* JSON Payload Inspection Drawer */}
      {selectedEntry && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-line bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line p-5 bg-canvas/50">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-brass-600" />
                <div>
                  <h3 className="font-display text-base font-bold text-navy-900">
                    Audit Payload Inspector
                  </h3>
                  <p className="font-mono text-[10px] text-ink-3">
                    ID: {selectedEntry.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-canvas hover:text-navy-900 transition"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-line p-3 bg-canvas/30">
                  <span className="font-mono text-[10px] font-bold text-ink-3 uppercase block mb-1">
                    Event Action
                  </span>
                  <span className="font-mono font-bold text-navy-900">
                    {selectedEntry.action}
                  </span>
                </div>
                <div className="rounded-xl border border-line p-3 bg-canvas/30">
                  <span className="font-mono text-[10px] font-bold text-ink-3 uppercase block mb-1">
                    Cairo Timestamp
                  </span>
                  <span className="font-mono text-ink-2">
                    {formatCairoDateTime(selectedEntry.createdAt)}
                  </span>
                </div>
                <div className="rounded-xl border border-line p-3 bg-canvas/30">
                  <span className="font-mono text-[10px] font-bold text-ink-3 uppercase block mb-1">
                    Target Entity
                  </span>
                  <span className="font-mono text-ink-2">
                    {selectedEntry.entityType} ({selectedEntry.entityId})
                  </span>
                </div>
                <div className="rounded-xl border border-line p-3 bg-canvas/30">
                  <span className="font-mono text-[10px] font-bold text-ink-3 uppercase block mb-1">
                    Actor Information
                  </span>
                  <span className="font-mono text-ink-2">
                    {selectedEntry.actorType} — {selectedEntry.actorName ?? selectedEntry.actorId}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-navy-900">
                    Immutable Metadata Record
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(selectedEntry.metadata, null, 2),
                        selectedEntry.id
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-brass-600 hover:text-brass-700"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedId === selectedEntry.id ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="rounded-xl border border-navy-900/10 bg-navy-950 p-4 font-mono text-xs text-brass-200 overflow-x-auto leading-relaxed">
                  {JSON.stringify(selectedEntry.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line p-4 bg-canvas/40">
              <span className="text-[11px] text-ink-3">
                Protected by PostgreSQL row trigger (<code className="font-mono">audit_log_immutable_trg</code>)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEntry(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAuditLogPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-content max-w-[1540px] space-y-6">
          <div className="h-8 w-64 bg-canvas-2 rounded animate-pulse" />
        </div>
      }
    >
      <AuditLogContent />
    </Suspense>
  );
}
