"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Award,
  ArrowRight,
  Send,
} from "lucide-react";
import { authClient, roleOf } from "@/lib/auth-client";
import {
  myProfileQuery,
  myAgentProfileQuery,
  useUpdateProfileMutation,
  useSaveAgentProfileMutation,
} from "@/lib/query/identity";
import { toast } from "@/components/ui/Toaster";
import { problemMessage } from "@/api/errors";

interface SettingsViewProps {
  portal: "buyer" | "agent";
}

type TabKey = "profile" | "security" | "broker";

export function SettingsView({ portal }: SettingsViewProps) {
  const { data: session } = authClient.useSession();
  const profile = useQuery(myProfileQuery());
  const agentProfile = useQuery(myAgentProfileQuery());
  const updateProfileMutation = useUpdateProfileMutation();
  const saveAgentMutation = useSaveAgentProfileMutation();

  const userRole = roleOf(session?.user);
  const isAgent = userRole === "AGENT" || portal === "agent";

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<"en" | "ar">("en");

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeSessions, setRevokeSessions] = useState(true);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Agent Form state
  const [licenseNumber, setLicenseNumber] = useState("");
  const [brokerageName, setBrokerageName] = useState("");
  const [bioEn, setBioEn] = useState("");
  const [bioAr, setBioAr] = useState("");



  // Populate profile form when query returns
  useEffect(() => {
    if (profile.data) {
      setFullName(profile.data.name ?? "");
      setPhoneNumber(profile.data.phone ?? "");
      setPreferredLocale(profile.data.preferredLocale === "ar" ? "ar" : "en");
    } else if (session?.user) {
      setFullName(session.user.name ?? "");
      setPhoneNumber((session.user as { phone?: string })?.phone ?? "");
    }
  }, [profile.data, session?.user]);

  // Populate agent profile form when query returns
  useEffect(() => {
    if (agentProfile.data) {
      setLicenseNumber(agentProfile.data.licenseNumber ?? "");
      setBrokerageName(agentProfile.data.brokerageName ?? "");
      setBioEn(agentProfile.data.bioEn ?? "");
      setBioAr(agentProfile.data.bioAr ?? "");
    }
  }, [agentProfile.data]);

  const initials = (fullName || session?.user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isEmailVerified = session?.user?.emailVerified ?? profile.data?.emailVerified ?? false;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please provide your full name");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        name: fullName.trim(),
        phone: phoneNumber.trim() || undefined,
        preferredLocale,
      });
      // Also update Better Auth session
      await authClient.updateUser({
        name: fullName.trim(),
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(problemMessage(err) || "Failed to update profile attributes");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeSessions,
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to change password");
      } else {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNumber.trim()) {
      toast.error("Please enter your Egyptian brokerage license number");
      return;
    }

    try {
      await saveAgentMutation.mutateAsync({
        licenseNumber: licenseNumber.trim(),
        brokerageName: brokerageName.trim() || null,
        bioEn: bioEn.trim() || null,
        bioAr: bioAr.trim() || null,
      });
      toast.success("Broker credentials saved successfully");
    } catch (err) {
      toast.error(problemMessage(err) || "Failed to save broker credentials");
    }
  };

  const handleResendVerification = async () => {
    if (!session?.user?.email) return;
    try {
      const res = await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: `/${portal}/settings`,
      });
      if (res.error) {
        toast.error(res.error.message || "Could not send verification email");
      } else {
        toast.success(`Verification email sent to ${session.user.email}`);
      }
    } catch {
      toast.error("Failed to send verification link");
    }
  };

  return (
    <div className="portal-content">
      {/* Welcome Bar */}
      <section className="welcome-bar">
        <div className="welcome-title-wrap">
          <h1>Account Settings & Credentials</h1>
          <p>
            Personal identity, security credentials, and Egyptian market communication preferences
          </p>
        </div>
      </section>

      {/* Hero Profile Plate */}
      <section className="profile-plate-card" aria-label="User Account Summary">
        <div className="profile-plate-main">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar-lg" aria-hidden="true">
              {initials}
            </div>
          </div>
          <div className="profile-title-block">
            <div className="profile-name-row">
              <h2 className="profile-name">{fullName || "Settly Member"}</h2>
              <span className="buyer-tier-badge">
                {isAgent ? "LICENSED AGENT" : userRole === "ADMIN" ? "ADMINISTRATOR" : "VERIFIED BUYER"}
              </span>
            </div>
            <p className="profile-occupation">
              {session?.user?.email}
            </p>
          </div>
        </div>

        <div className="profile-checks-strip">
          <div className="check-item">
            <div
              className={`check-icon ${
                isEmailVerified
                  ? "bg-sage-bg text-sage"
                  : "bg-brass-050 text-brass-600"
              }`}
            >
              {isEmailVerified ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </div>
            <div className="check-text">
              <span className="check-label">Email Status</span>
              <span className="check-val">
                {isEmailVerified ? "Verified" : "Pending Verification"}
              </span>
            </div>
          </div>

          <div className="check-item">
            <div className="check-icon bg-canvas-2 text-navy-900">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="check-text">
              <span className="check-label">Direct Phone</span>
              <span className="check-val font-mono">
                {phoneNumber || "Not configured"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="settings-workspace">
        {/* Navigation Tabs */}
        <div className="settings-nav-tabs" role="tablist" aria-label="Settings Sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            <span>Profile & Contact</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "security"}
            onClick={() => setActiveTab("security")}
            className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Security & Authentication</span>
          </button>

          {isAgent ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "broker"}
              onClick={() => setActiveTab("broker")}
              className={`settings-tab-btn ${activeTab === "broker" ? "active" : ""}`}
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span>Brokerage Credentials</span>
            </button>
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "broker"}
              onClick={() => setActiveTab("broker")}
              className={`settings-tab-btn ${activeTab === "broker" ? "active" : ""}`}
            >
              <Award className="h-4 w-4" aria-hidden="true" />
              <span>Agent Accreditation</span>
            </button>
          )}
        </div>

        {/* TAB 1: Profile & Contact */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="settings-card">
            <div className="settings-card-hdr">
              <h3 className="settings-card-title">Personal Profile & Contact Information</h3>
              <p className="settings-card-subtitle">
                Update how your identity appears on verified viewing invitations and purchase offers.
              </p>
            </div>

            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label htmlFor="settings-name" className="settings-label">
                  <span>Full Legal Name</span>
                </label>
                <input
                  id="settings-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Hana Kamel"
                  className="settings-input"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="settings-email" className="settings-label">
                  <span>Account Email</span>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-sage">
                      <CheckCircle2 className="h-3 w-3" /> VERIFIED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-brass-600">
                      <AlertCircle className="h-3 w-3" /> UNVERIFIED
                    </span>
                  )}
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="settings-email"
                    type="email"
                    disabled
                    value={session?.user?.email ?? ""}
                    className="settings-input pr-10"
                  />
                  <Mail className="absolute right-3.5 h-4 w-4 text-ink-3" aria-hidden="true" />
                </div>
                {!isEmailVerified && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-ink-3">Email confirmation pending.</span>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="inline-flex items-center gap-1 font-semibold text-brass-600 hover:underline"
                    >
                      <Send className="h-3 w-3" /> Resend verification email
                    </button>
                  </div>
                )}
              </div>

              <div className="settings-form-group">
                <label htmlFor="settings-phone" className="settings-label">
                  <span>Direct Mobile Phone</span>
                  <span className="settings-hint">Egyptian E.164 (+20)</span>
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="settings-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+201001234567"
                    className="settings-input"
                  />
                </div>
                <p className="text-[11.5px] text-ink-3">
                  Per Settly privacy rules (#60), phone numbers are never published openly. They are only shared when viewing visits are confirmed.
                </p>
              </div>

              <div className="settings-form-group">
                <label htmlFor="settings-locale" className="settings-label">
                  <span>Language Preference</span>
                  <span className="settings-hint">Settly V1</span>
                </label>
                <select
                  id="settings-locale"
                  value={preferredLocale}
                  onChange={(e) => setPreferredLocale(e.target.value as "en" | "ar")}
                  className="settings-input"
                >
                  <option value="en">English (Default)</option>
                  <option value="ar">Arabic (Upcoming in V2)</option>
                </select>
                <p className="text-[11.5px] text-ink-3">
                  Per Decision #99, Settly V1 is English only end-to-end. Locale preference is stored for future bilingual releases.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-line">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="btn-portal-primary"
              >
                {updateProfileMutation.isPending ? "Saving changes…" : "Save Profile Changes"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Security & Password */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordSubmit} className="settings-card">
            <div className="settings-card-hdr">
              <h3 className="settings-card-title">Security & Password Authentication</h3>
              <p className="settings-card-subtitle">
                Ensure your Settly credentials use a strong passphrase to safeguard transaction negotiations and deposits.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div className="settings-form-group">
                <label htmlFor="sec-current" className="settings-label">
                  <span>Current Password</span>
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="sec-current"
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="settings-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 text-ink-3 hover:text-navy-900"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="sec-new" className="settings-label">
                  <span>New Password</span>
                  <span className="settings-hint">Minimum 8 characters</span>
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="sec-new"
                    type={showNew ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="settings-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 text-ink-3 hover:text-navy-900"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="sec-confirm" className="settings-label">
                  <span>Confirm New Password</span>
                </label>
                <div className="settings-input-wrap">
                  <input
                    id="sec-confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="settings-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 text-ink-3 hover:text-navy-900"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 text-xs text-navy-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={revokeSessions}
                    onChange={(e) => setRevokeSessions(e.target.checked)}
                    className="rounded border-line-2 text-navy-900 focus:ring-navy-700"
                  />
                  <span>Sign out of all other active browser sessions across your devices</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-line">
              <button
                type="submit"
                disabled={passwordLoading}
                className="btn-portal-primary"
              >
                {passwordLoading ? "Updating password…" : "Update Password"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Broker Credentials (if Agent) OR Accreditation Callout (if Buyer) */}
        {activeTab === "broker" && isAgent && (
          <form onSubmit={handleAgentSubmit} className="settings-card">
            <div className="settings-card-hdr">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="settings-card-title">Egyptian Brokerage License & Advisory Bio</h3>
                  <p className="settings-card-subtitle">
                    Official regulatory credentials submitted to Settly Compliance for listing authorization.
                  </p>
                </div>
                {agentProfile.data?.isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-bg px-3 py-1 font-mono text-xs font-bold text-sage">
                    <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED BROKER
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brass-050 px-3 py-1 font-mono text-xs font-bold text-brass-600">
                    <Award className="h-3.5 w-3.5" /> COMPLIANCE REVIEW
                  </span>
                )}
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label htmlFor="agent-license" className="settings-label">
                  <span>Egyptian Brokerage License</span>
                  <span className="settings-hint">Official Registry ID</span>
                </label>
                <input
                  id="agent-license"
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. EGY-RE-2026-9042"
                  className="settings-input font-mono uppercase"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="agent-brokerage" className="settings-label">
                  <span>Agency / Brokerage Firm Name</span>
                  <span className="settings-hint">Commercial Entity</span>
                </label>
                <input
                  id="agent-brokerage"
                  type="text"
                  value={brokerageName}
                  onChange={(e) => setBrokerageName(e.target.value)}
                  placeholder="e.g. Sotheby's International Realty Cairo"
                  className="settings-input"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="settings-form-group">
                <label htmlFor="agent-bio-en" className="settings-label">
                  <span>Professional Bio (English)</span>
                </label>
                <textarea
                  id="agent-bio-en"
                  rows={3}
                  value={bioEn}
                  onChange={(e) => setBioEn(e.target.value)}
                  placeholder="Specialist in luxury residential properties across New Cairo and Golden Square..."
                  className="settings-textarea"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="agent-bio-ar" className="settings-label">
                  <span>Professional Bio (Arabic)</span>
                </label>
                <textarea
                  id="agent-bio-ar"
                  rows={3}
                  dir="rtl"
                  value={bioAr}
                  onChange={(e) => setBioAr(e.target.value)}
                  placeholder="خبير في العقارات الفاخرة بالقاهرة الجديدة والمربع الذهبي..."
                  className="settings-textarea"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-line">
              <button
                type="submit"
                disabled={saveAgentMutation.isPending}
                className="btn-portal-primary"
              >
                {saveAgentMutation.isPending ? "Saving credentials…" : "Save Broker Credentials"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Agent Accreditation Callout (if Buyer user) */}
        {activeTab === "broker" && !isAgent && (
          <div className="settings-card">
            <div className="settings-card-hdr">
              <h3 className="settings-card-title">Become a Settly Verified Real Estate Advisor</h3>
              <p className="settings-card-subtitle">
                Licensed Egyptian real estate agents and brokers can represent sellers and manage property viewings.
              </p>
            </div>

            <div className="rounded-xl border border-brass-200 bg-brass-050/60 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-brass shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-navy-900">
                    Agent Verification Standards
                  </h4>
                  <p className="mt-1 text-xs text-ink-2 leading-relaxed">
                    Settly enforces strict compliance standards. To list properties and conduct client viewings, you must hold an active Egyptian real estate license or be affiliated with a certified commercial brokerage firm.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-3 border border-line">
                  <span className="font-mono text-[11px] font-bold text-navy-900 uppercase block mb-1">
                    1. Identity
                  </span>
                  <span className="text-xs text-ink-3">
                    Verified national identity and commercial registry credentials.
                  </span>
                </div>
                <div className="rounded-lg bg-white p-3 border border-line">
                  <span className="font-mono text-[11px] font-bold text-navy-900 uppercase block mb-1">
                    2. License Check
                  </span>
                  <span className="text-xs text-ink-3">
                    Validation against official Egyptian Ministry of Housing broker records.
                  </span>
                </div>
                <div className="rounded-lg bg-white p-3 border border-line">
                  <span className="font-mono text-[11px] font-bold text-navy-900 uppercase block mb-1">
                    3. Moderation
                  </span>
                  <span className="text-xs text-ink-3">
                    Compliance team review before listing publication permissions activate.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-ink-3">
                  Need agent access for your team? Contact compliance@settly.estate.
                </span>
                <a
                  href="mailto:compliance@settly.estate?subject=Agent%20Accreditation%20Request"
                  className="btn-portal-primary text-xs"
                >
                  <span>Apply for Accreditation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
