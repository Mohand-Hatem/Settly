"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building,
  CheckCircle2,
  Clock,
  IdCard,
  ShieldAlert,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { authClient, roleOf } from "@/lib/auth-client";
import {
  myAgentApplicationQuery,
  useSubmitAgentApplicationMutation,
} from "@/lib/query/identity";
import type { AgentApplicationSubmitInput } from "@/api/identity";
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

type ProofType = keyof typeof PROOF_TYPE_LABELS;

export default function BecomeAgentPage() {
  const { data: session } = authClient.useSession();
  const userRole = roleOf(session?.user);

  const { data: application, isLoading, refetch } = useQuery(myAgentApplicationQuery());
  const submitMutation = useSubmitAgentApplicationMutation();

  const [form, setForm] = useState<AgentApplicationSubmitInput>({
    licenseNumber: "",
    brokerageName: "",
    proofType: "BROKER_LICENSE",
    proofDescription: "",
    proofDocumentUrl: "",
    nationalIdUrl: "",
    selfieUrl: "",
    bioEn: "",
    bioAr: "",
  });

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Pre-fill form if revising after rejection
  useEffect(() => {
    if (application && application.status === "REJECTED" && !isEditing) {
      setForm((prev) => ({
        ...prev,
        licenseNumber: application.licenseNumber || "",
        brokerageName: application.brokerageName || "",
        proofType: (application.proofType as ProofType) || "BROKER_LICENSE",
        proofDescription: application.proofDescription || "",
        bioEn: application.bioEn || "",
        bioAr: application.bioAr || "",
      }));
    }
  }, [application, isEditing]);

  const loadDemoFixture = () => {
    setForm({
      licenseNumber: "EGY-RE-2026-" + Math.floor(1000 + Math.random() * 9000),
      brokerageName: "Sovereign Cairo Partners",
      proofType: "BROKER_LICENSE",
      proofDescription: "",
      proofDocumentUrl: "https://storage.settly.estate/kyc/demo-broker-license.pdf",
      nationalIdUrl: "https://storage.settly.estate/kyc/demo-national-id.jpg",
      selfieUrl: "https://storage.settly.estate/kyc/demo-verification-selfie.jpg",
      bioEn: "Licensed Cairo real estate specialist advising prime residential buyers in New Cairo, Golden Square, and Sheikh Zayed.",
      bioAr: "وسيط عقاري معتمد متخصص في مجمعات القاهرة الجديدة والشيخ زايد.",
    });
    setClientErrors({});
    toast.success("Loaded verified demo accreditation fixture");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.licenseNumber?.trim() || form.licenseNumber.trim().length < 3) {
      errs.licenseNumber = "License number must be at least 3 characters";
    }
    if (!form.brokerageName?.trim() || form.brokerageName.trim().length < 2) {
      errs.brokerageName = "Brokerage or agency name is required";
    }
    if (!form.nationalIdUrl?.trim() || form.nationalIdUrl.trim().length < 5) {
      errs.nationalIdUrl = "Egyptian National ID document URL is required";
    }
    if (!form.selfieUrl?.trim() || form.selfieUrl.trim().length < 5) {
      errs.selfieUrl = "Live verification selfie URL is required for biometric face match";
    }
    if (!form.proofDocumentUrl?.trim() || form.proofDocumentUrl.trim().length < 5) {
      errs.proofDocumentUrl = "Professional proof document URL is required";
    }
    if (form.proofType === "OTHER" && (!form.proofDescription?.trim() || form.proofDescription.trim().length < 3)) {
      errs.proofDescription = "Description is required when selecting 'Other Official Certificate' (Decision #55)";
    }
    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all mandatory accreditation requirements.");
      return;
    }

    try {
      await submitMutation.mutateAsync(form);
      toast.success("Accreditation application submitted successfully!");
      setIsEditing(false);
      refetch();
    } catch (err: unknown) {
      toast.error(problemMessage(err) || "Failed to submit application");
    }
  };

  if (isLoading) {
    return (
      <div className="portal-content max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-2/5 rounded-xl" />
        <Skeleton className="h-4 w-3/5 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  // Case A: User already holds AGENT or ADMIN role
  if (userRole === "AGENT" || userRole === "ADMIN") {
    return (
      <div className="portal-content max-w-3xl mx-auto space-y-6">
        <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-settly space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <BadgeCheck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-navy-900">
              You are an Accredited Agent
            </h1>
            <p className="text-sm text-ink-3">
              Your account has full brokerage management authority on Settly.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Link href="/agent" className="btn-portal-brass inline-flex items-center gap-2">
              <span>Enter Agent Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/agent/listings" className="btn-portal-outline">
              Manage Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case B: Application is PENDING (APP-03)
  if (application && application.status === "PENDING" && !isEditing) {
    return (
      <div className="portal-content max-w-4xl mx-auto space-y-8">
        <header className="space-y-2 border-b border-line pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brass-600">
            <ShieldCheck className="h-4 w-4" />
            <span>Identity &amp; Syndicate Compliance Desk</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-navy-900 tracking-tight">
            Accreditation Application Status
          </h1>
          <p className="text-sm text-ink-3">
            Tracking application <span className="font-mono text-navy-900">{application.id.slice(0, 8)}</span> submitted on{" "}
            {new Date(application.createdAt).toLocaleDateString("en-EG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </header>

        {/* Status Card (APP-03) */}
        <div className="rounded-3xl border-2 border-amber-200 bg-amber-50/50 p-6 sm:p-8 space-y-6 shadow-settly">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-800">
                    Status
                  </span>
                  <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-900 border border-amber-300">
                    PENDING ADMINISTRATIVE REVIEW
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-navy-900 mt-0.5">
                  Your credentials are in the Cairo review queue
                </h2>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-ink-3 uppercase tracking-wider font-mono">
                Estimated Decision
              </span>
              <p className="font-mono text-xs font-bold text-navy-900">
                Within 24 business hours
              </p>
            </div>
          </div>

          <p className="text-xs text-ink-2 leading-relaxed bg-white/80 p-4 rounded-xl border border-amber-200">
            An administrator from the Egyptian Real Estate Regulatory accreditation team is currently verifying your
            National ID and biometric selfie against official syndicate records (Decisions #49, #56). You will receive an
            in-platform notification and email once accredited.
          </p>

          {/* Submitted dossier summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            <div className="rounded-2xl border border-line bg-white p-4 space-y-1">
              <span className="text-[11px] font-mono text-ink-3 uppercase">Brokerage Firm</span>
              <p className="font-bold text-sm text-navy-900">{application.brokerageName || "Independent"}</p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4 space-y-1">
              <span className="text-[11px] font-mono text-ink-3 uppercase">License Number</span>
              <p className="font-mono font-bold text-sm text-brass-700">{application.licenseNumber}</p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4 space-y-1">
              <span className="text-[11px] font-mono text-ink-3 uppercase">Proof Category</span>
              <p className="font-bold text-sm text-navy-900">
                {PROOF_TYPE_LABELS[application.proofType as ProofType] || application.proofType}
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="border-t border-amber-200 pt-6">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-ink-3">
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 1. Dossier Submitted
              </span>
              <span className="text-amber-800 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 animate-pulse" /> 2. KYC Verification
              </span>
              <span className="text-ink-4">3. Agent Role Granted</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/buyer" className="btn-portal-outline">
            Return to Buyer Overview
          </Link>
        </div>
      </div>
    );
  }

  // Case C: Application is REJECTED (APP-04)
  const isRejected = application && application.status === "REJECTED";

  return (
    <div className="portal-content max-w-4xl mx-auto space-y-8">
      <header className="space-y-2 border-b border-line pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brass-600">
          <BadgeCheck className="h-4 w-4" />
          <span>Accreditation &amp; KYC Onboarding</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-navy-900 tracking-tight">
          {isRejected ? "Revise Agent Accreditation Application" : "Apply to Become an Accredited Agent"}
        </h1>
        <p className="text-sm text-ink-3">
          {isRejected
            ? "Your previous submission required corrections. Review the compliance notice below and resubmit immediately (Decision #74)."
            : "Verified brokers and agents list resale residential properties, receive viewing requests, and manage negotiated offers on Settly."}
        </p>
      </header>

      {/* Rejection Alert Box if applicable (APP-04, Decision #57) */}
      {isRejected && (
        <div className="rounded-3xl border-2 border-red-200 bg-red-50/70 p-6 space-y-3 shadow-settly">
          <div className="flex items-center gap-3 text-red-800">
            <ShieldAlert className="h-6 w-6 shrink-0 text-red-600" />
            <div>
              <h3 className="font-display text-lg font-bold">
                Application Rejected by Compliance Officer
              </h3>
              <p className="text-xs text-red-700">
                Reason recorded on{" "}
                {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString("en-EG") : "recent review"}
                :
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-red-200 bg-white p-4 font-mono text-xs text-red-900 leading-relaxed">
            &ldquo;{application.rejectionReason || "Credentials could not be verified."}&rdquo;
          </div>
          <p className="text-[11px] text-red-700">
            Please correct the flagged documentation below and submit your revised dossier. You can re-apply immediately (Decision #74).
          </p>
        </div>
      )}

      {/* Quick Demo Pre-fill Toolbar */}
      <div className="flex items-center justify-between rounded-2xl border border-brass/40 bg-[#FAF8F4] p-4 text-xs">
        <div className="flex items-center gap-2.5 text-navy-900">
          <Sparkles className="h-4 w-4 text-brass-600" />
          <span className="font-semibold">Need test credentials for evaluation?</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadDemoFixture}
          className="text-xs font-mono font-bold text-navy-900 border-brass-600/50 hover:bg-brass-50"
        >
          Load Verified Demo Fixture
        </Button>
      </div>

      {/* Main Application Form (APP-02) */}
      <form onSubmit={handleSubmit} className="space-y-8 rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-settly">
        {/* Section 1: Professional Licensing */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <Building className="h-4 w-4 text-brass-600" />
            <h2 className="font-display text-lg font-bold text-navy-900">
              1. Professional Brokerage &amp; Syndicate License
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">
                Syndicate License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-xl border bg-canvas px-3.5 py-2.5 font-mono text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass ${
                  clientErrors.licenseNumber ? "border-red-500" : "border-line"
                }`}
                placeholder="e.g. EGY-RE-2026-9912"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              />
              {clientErrors.licenseNumber && (
                <p className="text-[11px] text-red-600">{clientErrors.licenseNumber}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">
                Brokerage / Agency Firm Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-xl border bg-canvas px-3.5 py-2.5 text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass ${
                  clientErrors.brokerageName ? "border-red-500" : "border-line"
                }`}
                placeholder="e.g. Sovereign Cairo Partners"
                value={form.brokerageName || ""}
                onChange={(e) => setForm({ ...form, brokerageName: e.target.value })}
              />
              {clientErrors.brokerageName && (
                <p className="text-[11px] text-red-600">{clientErrors.brokerageName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">
                Professional Proof Category <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs text-navy-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass"
                value={form.proofType}
                onChange={(e) => setForm({ ...form, proofType: e.target.value as ProofType })}
              >
                {Object.entries(PROOF_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">
                Proof Document URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-xl border bg-canvas px-3.5 py-2.5 font-mono text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass ${
                  clientErrors.proofDocumentUrl ? "border-red-500" : "border-line"
                }`}
                placeholder="https://storage.settly.estate/kyc/license.pdf"
                value={form.proofDocumentUrl}
                onChange={(e) => setForm({ ...form, proofDocumentUrl: e.target.value })}
              />
              {clientErrors.proofDocumentUrl && (
                <p className="text-[11px] text-red-600">{clientErrors.proofDocumentUrl}</p>
              )}
            </div>
          </div>

          {form.proofType === "OTHER" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">
                Proof Description <span className="text-red-500">* (Mandatory for &apos;Other&apos;, Decision #55)</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-xl border bg-canvas px-3.5 py-2.5 text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass ${
                  clientErrors.proofDescription ? "border-red-500" : "border-line"
                }`}
                placeholder="Describe your credentials (e.g. Chamber of Commerce accreditation)"
                value={form.proofDescription || ""}
                onChange={(e) => setForm({ ...form, proofDescription: e.target.value })}
              />
              {clientErrors.proofDescription && (
                <p className="text-[11px] text-red-600">{clientErrors.proofDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Identity & Biometric Verification */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <IdCard className="h-4 w-4 text-brass-600" />
            <h2 className="font-display text-lg font-bold text-navy-900">
              2. Egyptian Identity Verification &amp; Biometric Audit (Decisions #49, #56)
            </h2>
          </div>

          <div className="rounded-xl border border-line bg-canvas p-3.5 text-xs text-ink-3 space-y-1">
            <p className="font-bold text-navy-900">Personal Data Protection Notice (Law 151/2020)</p>
            <p>
              Your National ID and live verification selfie are strictly restricted to audited administrative compliance
              review. They are never published, never shown to buyers, and never ingested into AI models.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">
                Egyptian National ID Document URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-xl border bg-canvas px-3.5 py-2.5 font-mono text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass ${
                  clientErrors.nationalIdUrl ? "border-red-500" : "border-line"
                }`}
                placeholder="https://storage.settly.estate/kyc/national-id.jpg"
                value={form.nationalIdUrl}
                onChange={(e) => setForm({ ...form, nationalIdUrl: e.target.value })}
              />
              {clientErrors.nationalIdUrl && (
                <p className="text-[11px] text-red-600">{clientErrors.nationalIdUrl}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy-900">
                Live Verification Selfie URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full rounded-xl border bg-canvas px-3.5 py-2.5 font-mono text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass ${
                  clientErrors.selfieUrl ? "border-red-500" : "border-line"
                }`}
                placeholder="https://storage.settly.estate/kyc/selfie.jpg"
                value={form.selfieUrl}
                onChange={(e) => setForm({ ...form, selfieUrl: e.target.value })}
              />
              {clientErrors.selfieUrl && (
                <p className="text-[11px] text-red-600">{clientErrors.selfieUrl}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Professional Biography */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <User className="h-4 w-4 text-brass-600" />
            <h2 className="font-display text-lg font-bold text-navy-900">
              3. Broker Biography &amp; Market Specialties
            </h2>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-navy-900">English Bio &amp; Specialties</label>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass"
              placeholder="Tell buyers about your transaction track record, prime compound specialties, and experience..."
              value={form.bioEn || ""}
              onChange={(e) => setForm({ ...form, bioEn: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-navy-900">Arabic Bio &amp; Specialties (Optional)</label>
            <textarea
              rows={2}
              dir="rtl"
              className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-navy-900 placeholder:text-ink-4 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass"
              placeholder="نبذة عن خبرتك وتخصصك في السوق العقاري..."
              value={form.bioAr || ""}
              onChange={(e) => setForm({ ...form, bioAr: e.target.value })}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-line">
          <Link href="/buyer" className="btn-portal-outline w-full sm:w-auto text-center">
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            className="btn-portal-brass w-full sm:w-auto"
          >
            {submitMutation.isPending ? "Submitting Dossier..." : "Submit Accreditation Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
