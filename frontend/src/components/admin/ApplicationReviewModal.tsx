"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CheckCircle2,
  IdCard,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
  XCircle,
  ExternalLink,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";
import { adminAgentApplicationDetailQuery, useReviewAgentApplicationMutation } from "@/lib/query/admin";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toaster";
import { problemMessage } from "@/api/errors";

const PROOF_TYPE_LABELS = {
  BROKER_LICENSE: "Syndicate Broker License",
  BROKERAGE_AUTHORIZATION: "Brokerage Authorization / POA",
  COMMERCIAL_REGISTRATION: "Commercial Registration (Sijil Tijari)",
  OTHER: "Other Official Certificate",
} as const;

const PRESET_REJECTION_REASONS = [
  "License number could not be authenticated in the official syndicate registry.",
  "National ID image is illegible, cropped, or expired.",
  "Biometric selfie does not match the National ID holder photo.",
  "Brokerage authorization mandate is missing corporate seal or signature.",
  "Document resolution too low for cadastral compliance verification.",
];

interface ApplicationReviewModalProps {
  applicationId: string | null;
  onClose: () => void;
}

export function ApplicationReviewModal({
  applicationId,
  onClose,
}: ApplicationReviewModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const query = useQuery(adminAgentApplicationDetailQuery(applicationId || ""));
  const reviewMutation = useReviewAgentApplicationMutation();

  if (!applicationId) return null;

  const app = query.data;

  const handleApprove = async () => {
    setConflictError(null);
    try {
      await reviewMutation.mutateAsync({
        id: applicationId,
        body: { decision: "APPROVED" },
      });
      toast.success(`Accreditation approved for ${app?.user.name || "agent"}!`);
      onClose();
    } catch (err: unknown) {
      const msg = problemMessage(err);
      if (msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("own")) {
        setConflictError("Conflict of Interest: Administrators cannot review or approve their own accreditation application (Decision #67). Another administrator must review this dossier.");
      } else {
        toast.error(msg || "Failed to approve application");
      }
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    if (rejectionReason.trim().length < 5) {
      toast.error("Rejection reason must be at least 5 characters (Decision #57).");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: applicationId,
        body: {
          decision: "REJECTED",
          rejectionReason: rejectionReason.trim(),
        },
      });
      toast.success("Application rejected and notice sent to applicant.");
      onClose();
    } catch (err: unknown) {
      const msg = problemMessage(err);
      if (msg.toLowerCase().includes("conflict") || msg.toLowerCase().includes("own")) {
        setConflictError("Conflict of Interest: Administrators cannot review or reject their own accreditation application (Decision #67). Another administrator must review this dossier.");
      } else {
        toast.error(msg || "Failed to reject application");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy-900/60 backdrop-blur-sm animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="dossier-title">
      <div className="relative flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-brass">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="dossier-title" className="font-display text-lg font-bold text-navy-900">
                  Accreditation Inspection Dossier
                </h2>
                {app && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                      app.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : app.status === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {app.status === "APPROVED"
                      ? "ACCREDITED"
                      : app.status === "REJECTED"
                      ? "REJECTED"
                      : "PENDING KYC"}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-ink-3">
                Dossier #{applicationId.slice(0, 8).toUpperCase()} · Filed {app ? new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-3 hover:bg-canvas hover:text-navy-900 transition-colors"
            aria-label="Close dossier"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {query.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
                <Skeleton className="h-44 rounded-xl" />
              </div>
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : query.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-900">
              {problemMessage(query.error)}
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => query.refetch()}>
                  Retry Loading
                </Button>
              </div>
            </div>
          ) : !app ? null : (
            <>
              {/* Conflict of Interest Warning Alert Banner */}
              {conflictError && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3" role="alert">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950">Governance Conflict Detected</h4>
                    <p className="mt-0.5 leading-relaxed">{conflictError}</p>
                  </div>
                </div>
              )}

              {/* Fiduciary Syndicate License Card (Navy & Brass Reference Design) */}
              <div className="rounded-2xl border border-brass/40 bg-gradient-to-br from-navy-900 via-navy-850 to-navy-950 p-5 text-white space-y-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brass via-emerald-400 to-brass" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-brass" />
                    <span className="font-mono text-[11px] font-bold text-brass uppercase tracking-wider">
                      Syndicate &amp; Commercial Accreditation
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-white/60">
                    Law #119 Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-3 text-xs">
                  <div>
                    <span className="font-mono text-[11px] text-white/50 block">Syndicate License</span>
                    <span className="font-mono text-sm font-bold text-brass-200">
                      {app.licenseNumber}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] text-white/50 block">Brokerage Entity</span>
                    <span className="font-semibold text-white">
                      {app.brokerageName || "Independent Broker"}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] text-white/50 block">Applicant Name</span>
                    <span className="font-semibold text-white">
                      {app.user.name}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-[11px] text-white/50 block">Official Contact</span>
                    <span className="font-mono text-[11px] text-white/80 block">
                      {app.user.email}
                    </span>
                    {app.user.phone && (
                      <span className="font-mono text-[11px] text-white/70 block">
                        {app.user.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-white/50">
                  <span>Proof Type: {PROOF_TYPE_LABELS[app.proofType] || app.proofType}</span>
                  <span className="text-brass">Settly Registry</span>
                </div>
              </div>

              {/* KYC Document Previews (Decision #56: National ID, Selfie, Proof) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900">
                    Accreditation KYC Artifacts (Decision #56)
                  </h3>
                  <span className="text-[11px] text-ink-3">
                    Click any artifact to view full-resolution source
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* 1. National ID Card */}
                  <div className="rounded-xl border border-line bg-canvas p-3 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-ink-3 uppercase">National ID</span>
                        <IdCard className="h-4 w-4 text-brass-600" />
                      </div>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-white flex items-center justify-center group">
                        {app.nationalIdUrl.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.nationalIdUrl}
                            alt="Egyptian National ID"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              // Fallback placeholder on image load error
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                          <IdCard className="h-6 w-6 text-brass-600 mb-1" />
                          <span className="font-mono text-[10px] font-semibold text-navy-900">Civil Registry ID</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={app.nationalIdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-brass-700 hover:text-brass-800 pt-1"
                    >
                      <span>Open Document</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* 2. Biometric Live Selfie */}
                  <div className="rounded-xl border border-line bg-canvas p-3 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-ink-3 uppercase">Biometric Liveness</span>
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-white flex items-center justify-center group">
                        {app.selfieUrl.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.selfieUrl}
                            alt="Verification Selfie"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                          <UserCheck className="h-6 w-6 text-emerald-600 mb-1" />
                          <span className="font-mono text-[10px] font-semibold text-navy-900">Live Face Match</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={app.selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-brass-700 hover:text-brass-800 pt-1"
                    >
                      <span>Open Selfie</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* 3. Proof Document */}
                  <div className="rounded-xl border border-line bg-canvas p-3 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-ink-3 uppercase">Broker Proof</span>
                        <FileCheck2 className="h-4 w-4 text-navy-900" />
                      </div>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-white flex items-center justify-center group">
                        {app.proofDocumentUrl.startsWith("http") && !app.proofDocumentUrl.endsWith(".pdf") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.proofDocumentUrl}
                            alt="Proof Document"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                          <FileCheck2 className="h-6 w-6 text-navy-900 mb-1" />
                          <span className="font-mono text-[10px] font-semibold text-navy-900 truncate max-w-[90%]">
                            {PROOF_TYPE_LABELS[app.proofType] || "Official Certificate"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={app.proofDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-brass-700 hover:text-brass-800 pt-1"
                    >
                      <span>Inspect Certificate</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {app.proofDescription && (
                  <div className="rounded-xl border border-line bg-canvas p-3 text-xs">
                    <span className="font-semibold text-navy-900 block mb-0.5">Proof Description / Mandate Notes:</span>
                    <p className="text-ink-2">{app.proofDescription}</p>
                  </div>
                )}
              </div>

              {/* Bilingual Bios */}
              {(app.bioEn || app.bioAr) && (
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900">
                    Applicant Professional Bio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {app.bioEn && (
                      <div className="rounded-xl border border-line bg-canvas p-3 space-y-1">
                        <span className="font-mono text-[10px] font-bold text-ink-3 uppercase block">
                          English Bio
                        </span>
                        <p className="text-xs text-ink-2 leading-relaxed">{app.bioEn}</p>
                      </div>
                    )}
                    {app.bioAr && (
                      <div className="rounded-xl border border-line bg-canvas p-3 space-y-1 text-right" dir="rtl">
                        <span className="font-mono text-[10px] font-bold text-ink-3 uppercase block text-left">
                          Arabic Bio (العربية)
                        </span>
                        <p className="text-xs text-ink-2 leading-relaxed">{app.bioAr}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Specific Review Console */}
              <div className="border-t border-line pt-4 space-y-4">
                {app.status === "PENDING" ? (
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900">
                      Compliance Determination Console
                    </h3>

                    {!showRejectForm ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          isLoading={reviewMutation.isPending}
                          onClick={handleApprove}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-3 rounded-xl shadow-sm"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          <span>Approve &amp; Grant Agent Role</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRejectForm(true)}
                          className="border-red-300 text-red-700 hover:bg-red-50 font-semibold text-xs py-3 rounded-xl"
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          <span>Reject Application...</span>
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleReject} className="rounded-2xl border border-red-200 bg-red-50/50 p-4 space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-bold text-red-950">
                            Reject Application with Mandatory Justification (Decision #57)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="text-xs text-ink-3 hover:text-navy-900 underline"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Preset chips */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-red-900 block">
                            Quick Rejection Reasons:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_REJECTION_REASONS.map((preset, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setRejectionReason(preset)}
                                className="rounded-lg border border-red-200 bg-white hover:bg-red-50 px-2 py-0.5 text-[10px] text-red-900 text-left transition"
                              >
                                {preset.slice(0, 48)}...
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-red-950 block">
                            Rejection Reason (Visible to applicant for re-application, min 5 chars):
                          </label>
                          <textarea
                            required
                            minLength={5}
                            rows={3}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Clearly describe required correction or why the credentials failed authentication..."
                            className="w-full mt-1 rounded-xl border border-red-200 bg-white p-2.5 text-xs text-navy-900 focus:border-red-400 focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRejectForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={rejectionReason.trim().length < 5}
                            isLoading={reviewMutation.isPending}
                            className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs"
                          >
                            Confirm Rejection
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : app.status === "APPROVED" ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          Application Approved &amp; Agent Accredited
                        </span>
                        <span className="text-emerald-800 text-[11px]">
                          Reviewed on {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}.
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                      ACTIVE AGENT
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs text-red-900 space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                      <span className="font-bold text-red-950">
                        Application Rejected
                      </span>
                    </div>
                    <p className="text-red-900 text-xs pl-7">
                      Reason: &ldquo;{app.rejectionReason || "Credentials failed verification."}&rdquo;
                    </p>
                    {app.reviewedAt && (
                      <span className="text-[10px] text-red-700 pl-7 block font-mono">
                        Reviewed on {new Date(app.reviewedAt).toLocaleDateString("en-US")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
