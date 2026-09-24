"use client";

import React, { Suspense, useState, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Ban,
  Building,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  IdCard,
  Search,
  ShieldCheck,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { problemMessage } from "@/api/errors";
import {
  adminAgentsQuery,
  useVerifyAgentMutation,
} from "@/lib/query/admin";
import type { AgentListItem } from "@/api/admin";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/components/ui/Toaster";

type VerificationFilter = "PENDING" | "VERIFIED" | "ALL";

const PRESET_AUDIT_NOTES = [
  "Valid syndicate license authenticated via Egyptian Real Estate Authority registry.",
  "Commercial register & broker mandate verified.",
  "License expired or could not be authenticated.",
  "Discrepancy between stated broker name and official syndicate records.",
];

function AdminVerificationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = (params.get("tab") as VerificationFilter) || "PENDING";
  const [selectedAgent, setSelectedAgent] = useState<AgentListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const verifiedParam =
    currentTab === "PENDING" ? "false" : currentTab === "VERIFIED" ? "true" : undefined;

  const query = useQuery(adminAgentsQuery(verifiedParam));
  const rawAgents = useMemo(() => query.data?.items ?? [], [query.data]);

  const agents = useMemo(() => {
    if (!searchQuery.trim()) return rawAgents;
    const q = searchQuery.toLowerCase();
    return rawAgents.filter((a) => {
      const name = (a.user.name || "").toLowerCase();
      const email = (a.user.email || "").toLowerCase();
      const license = (a.licenseNumber || "").toLowerCase();
      const agency = (a.brokerageName || "").toLowerCase();
      return name.includes(q) || email.includes(q) || license.includes(q) || agency.includes(q);
    });
  }, [rawAgents, searchQuery]);

  const verifiedCount = rawAgents.filter((a) => a.isVerified).length;
  const pendingCount = rawAgents.filter((a) => !a.isVerified).length;

  const handleTabChange = (tab: VerificationFilter) => {
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
            <BadgeCheck className="h-6 w-6 text-brass-600" aria-hidden />
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900 tracking-tight">
              Agent &amp; Broker Accreditation Desk
            </h1>
          </div>
          <p className="mt-1 text-xs text-ink-3">
            Egyptian Real Estate Regulatory Authority License Accreditation (`ADM-04`, `ADM-05`, Decision #56).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-3 bg-canvas px-3 py-1.5 rounded-full border border-line">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">Cadastral &amp; Identity Verification (#42)</span>
        </div>
      </div>

      {/* 4-Metric Executive Telemetry Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Pending Accreditation</span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
              Review
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              {pendingCount}
            </span>
            <span className="text-xs text-ink-3">applications</span>
          </div>
          <p className="text-[11px] text-ink-4">Turnaround target: &lt; 24h</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Accredited Agents</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
              Active
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              {verifiedCount}
            </span>
            <span className="text-xs text-ink-3">good standing</span>
          </div>
          <p className="text-[11px] text-ink-4">Licensed to submit resale mandates</p>
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
            <span className="text-xs text-ink-3">strict audit</span>
          </div>
          <p className="text-[11px] text-ink-4">Syndicate ID + Liveness checked</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-3 font-mono uppercase tracking-wider">
            <span>Revocation Policy</span>
            <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold">
              ADM-05
            </span>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
              5-Day
            </span>
            <span className="text-xs text-ink-3">escrow freeze</span>
          </div>
          <p className="text-[11px] text-ink-4">Suspends listings upon revocation</p>
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
            <span>Pending Applications</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-400 text-navy-900 px-1.5 py-0.5 text-[10px] font-mono font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentTab === "VERIFIED"}
            onClick={() => handleTabChange("VERIFIED")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              currentTab === "VERIFIED"
                ? "bg-navy-900 text-white shadow-sm"
                : "bg-canvas border border-line text-ink-2 hover:bg-white hover:text-navy-900"
            }`}
          >
            <span>Verified Agents</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-ink-2">
              {verifiedCount}
            </span>
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
            <span>All Profiles</span>
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name, license, agency..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-line bg-canvas text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:border-brass focus:outline-none transition"
          />
        </div>
      </div>

      {/* Agent List */}
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
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<BadgeCheck className="h-6 w-6 text-brass-600" />}
            title={
              searchQuery
                ? "No agents match search"
                : currentTab === "PENDING"
                ? "No pending agent applications"
                : "No agent profiles found"
            }
            description={
              currentTab === "PENDING"
                ? "All registered agents have been verified or resolved."
                : "No registered agent records match the current filter."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {agents.map((agent, idx) => (
              <AgentModerationRow
                key={agent.id}
                agent={agent}
                index={idx + 1}
                isSelected={agent.id === selectedAgent?.id}
                onSelect={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Drawer */}
      {selectedAgent && (
        <AgentVerificationDrawer
          agent={selectedAgent}
          onClose={() => {
            setSelectedAgent(null);
            query.refetch();
          }}
        />
      )}
    </div>
  );
}

function AgentModerationRow({
  agent,
  index,
  isSelected,
  onSelect,
}: {
  agent: AgentListItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const initials = agent.user.name
    ? agent.user.name
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AG";

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
        {/* Left: Avatar & Info */}
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
                {agent.user.name}
              </span>

              <span className="rounded bg-canvas border border-line px-1.5 py-0.5 font-mono text-[10px] font-bold text-brass-700">
                #{agent.id.slice(0, 8).toUpperCase()}
              </span>

              {agent.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 font-mono">
                  <ShieldCheck className="h-3 w-3" />
                  ACCREDITED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 font-mono">
                  <Clock className="h-3 w-3" />
                  PENDING KYC
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
              <span className="font-mono font-medium text-navy-900">
                Lic: {agent.licenseNumber}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3 text-ink-4" />
                {agent.brokerageName || "Independent Broker"}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-ink-4 truncate">
                {agent.user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-7 px-3 group-hover:border-brass group-hover:text-brass-700"
          >
            <Eye className="mr-1 h-3 w-3" />
            Inspect Dossier
          </Button>
        </div>
      </div>
    </div>
  );
}

function AgentVerificationDrawer({
  agent,
  onClose,
}: {
  agent: AgentListItem;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [showRevokeForm, setShowRevokeForm] = useState(false);

  const verifyMutation = useVerifyAgentMutation();

  const handleApprove = () => {
    verifyMutation.mutate(
      {
        id: agent.id,
        input: {
          verified: true,
          notes: notes.trim() || "Approved by administrator after license verification.",
        },
      },
      {
        onSuccess: () => {
          toast.success(`Agent ${agent.user.name} accredited successfully.`);
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleReject = () => {
    if (notes.trim().length < 3) {
      toast.error("Please provide a note or reason for rejection.");
      return;
    }

    verifyMutation.mutate(
      {
        id: agent.id,
        input: {
          verified: false,
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Agent application rejected.");
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  const handleRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    if (revokeReason.trim().length < 3) return;

    verifyMutation.mutate(
      {
        id: agent.id,
        input: {
          verified: false,
          notes: `REVOCATION: ${revokeReason.trim()}`,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Agent ${agent.user.name}'s accreditation revoked.`);
          onClose();
        },
        onError: (err) => {
          toast.error(problemMessage(err));
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-brass-600" />
              <h2 className="font-display text-lg text-navy-900">
                Agent Accreditation Dossier
              </h2>
            </div>
            <span className="text-xs text-ink-3 font-mono">
              Profile ID: #{agent.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-canvas hover:text-navy-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Fiduciary Syndicate License Card (Navy & Brass Reference Design) */}
          <div className="rounded-2xl border border-brass/40 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-5 text-white space-y-4 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brass via-emerald-400 to-brass" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-brass" />
                <span className="font-mono text-[11px] font-bold text-brass uppercase tracking-wider">
                  Egyptian Syndicate Accreditation
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold">
                {agent.isVerified ? "AUTHENTICATED" : "UNDER AUDIT"}
              </span>
            </div>

            <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-white/60">Syndicate License:</span>
                <span className="font-mono font-bold text-brass-200 text-sm">
                  {agent.licenseNumber}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-white/60">Professional Name:</span>
                <span className="font-semibold text-white">
                  {agent.user.name}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-white/60">Brokerage Entity:</span>
                <span className="text-white">
                  {agent.brokerageName || "Independent Broker"}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-white/60">Official Email:</span>
                <span className="font-mono text-white/80 text-[11px]">
                  {agent.user.email}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-white/60">Filing Date:</span>
                <span className="font-mono text-white/80 text-[11px]">
                  {new Date(agent.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[10px] font-mono text-white/50">
              <span>Egyptian Law #119 Regulatory Framework</span>
              <span className="text-brass">Settly Registry</span>
            </div>
          </div>

          {/* Decision #56: National ID & Live Biometric Selfie Side by Side */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900">
                Identity Credentials (#56)
              </h3>
              <span className="text-[11px] text-ink-4">National ID &amp; Biometric Liveness</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* National ID Plate */}
              <div className="rounded-xl border border-line bg-canvas p-3 space-y-2 text-center">
                <div className="relative flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-line bg-white">
                  <div className="flex flex-col items-center gap-1 text-ink-4">
                    <IdCard className="h-8 w-8 text-brass-600" />
                    <span className="text-[10px] font-semibold text-navy-900">National ID</span>
                    <span className="text-[9px] font-mono text-ink-4">EGY-CIVIL-RECORD</span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-navy-900">
                  Egyptian Civil Registry
                </div>
              </div>

              {/* Live Selfie Plate */}
              <div className="rounded-xl border border-line bg-canvas p-3 space-y-2 text-center">
                <div className="relative flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-line bg-white">
                  <div className="flex flex-col items-center gap-1 text-ink-4">
                    <UserCheck className="h-8 w-8 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-navy-900">Biometric Liveness</span>
                    <span className="text-[9px] font-mono text-emerald-600">Match Confirmed</span>
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-navy-900">
                  Facial Match Verification
                </div>
              </div>
            </div>
          </div>

          {/* Biographies */}
          {agent.bioEn && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-navy-900">Agent Professional Biography:</span>
              <p className="rounded-xl border border-line bg-canvas p-3 text-ink-2 leading-relaxed">
                {agent.bioEn}
              </p>
            </div>
          )}

          {/* Determination Console */}
          <div className="pt-2 border-t border-line space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900">
              Registrar Determination Console
            </h3>

            {!agent.isVerified ? (
              <div className="space-y-3">
                {/* Preset Chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-ink-3">
                    Fast Notes Presets:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_AUDIT_NOTES.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNotes(preset)}
                        className="rounded-lg border border-line bg-canvas hover:bg-white hover:border-brass px-2.5 py-1 text-[11px] text-ink-2 transition text-left"
                      >
                        {preset.slice(0, 45)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-900">
                    Registrar Audit Note / Resolution Justification
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter audit notes or required reason if rejecting..."
                    className="w-full mt-1 rounded-xl border border-line p-2.5 text-xs text-navy-900 focus:border-brass focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    isLoading={verifyMutation.isPending}
                    onClick={handleApprove}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Approve Accreditation
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    isLoading={verifyMutation.isPending}
                    onClick={handleReject}
                    className="border-red-300 text-red-700 hover:bg-red-50 font-semibold text-xs py-2.5"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Reject Application
                  </Button>
                </div>
              </div>
            ) : (
              /* ADM-05: Revocation Section */
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Agent is fully accredited and in good standing.</span>
                  </div>
                  {agent.verifiedAt && (
                    <span className="font-mono text-[11px] text-emerald-700">
                      Since {new Date(agent.verifiedAt).toLocaleDateString("en-US")}
                    </span>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRevokeForm(!showRevokeForm)}
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 font-semibold text-xs py-2.5"
                >
                  <Ban className="mr-1.5 h-4 w-4" />
                  Revoke Agent Accreditation (ADM-05)
                </Button>

                {showRevokeForm && (
                  <form onSubmit={handleRevoke} className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3 animate-in fade-in">
                    <div className="rounded-lg bg-red-100 p-2.5 text-[11px] text-red-900 leading-relaxed">
                      <strong>Consequence Warning (#65, #69, #70):</strong> Revoking accreditation automatically suspends all active mandates published by this agent. Any reserved transactions immediately enter the 5-business-day compliance adjudication period.
                    </div>

                    <label className="text-xs font-semibold text-red-900">
                      Revocation Justification (required, min 3 characters)
                    </label>
                    <textarea
                      required
                      minLength={3}
                      rows={2}
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="e.g. Syndicate license expired or revoked by regulatory authorities..."
                      className="w-full rounded-xl border border-line bg-white p-2.5 text-xs text-navy-900 focus:border-brass focus:outline-none"
                    />

                    <Button
                      type="submit"
                      disabled={revokeReason.trim().length < 3}
                      isLoading={verifyMutation.isPending}
                      className="w-full bg-red-700 hover:bg-red-800 text-white font-semibold text-xs py-2"
                    >
                      Confirm Immediate Revocation
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
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
