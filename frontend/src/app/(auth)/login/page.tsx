"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "agent">("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleRoleChange = (newRole: "buyer" | "agent") => {
    setRole(newRole);
    setErrorMessage(null);
  };

  const fillDemoCredentials = (demoEmail: string, demoPass: string, demoRole: "buyer" | "agent") => {
    setRole(demoRole);
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
    triggerToast(`Demo ${demoRole === "buyer" ? "Buyer" : "Advisor"} credentials populated.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid authorized email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Please enter your portal password (minimum 6 characters).");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: rememberDevice,
      });

      if (error) {
        setErrorMessage(error.message || "Invalid authentication credentials. Please check your email and password.");
        setLoading(false);
        return;
      }

      if (data) {
        triggerToast("Authentication handshake verified. Entering portal...");
        setTimeout(() => {
          if (role === "agent") {
            router.push("/agent-dashboard/overview");
          } else {
            router.push("/buyer-dashboard/overview");
          }
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  const handleGoogleSso = async () => {
    triggerToast("Initiating encrypted Google SSO session...");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: role === "agent" ? "/agent-dashboard/overview" : "/buyer-dashboard/overview",
      });
    } catch {
      triggerToast("Google SSO authentication gateway redirecting...");
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Pane: Architectural Scrim & Institutional Credentials (50%) */}
      <div className="auth-brand-pane">
        <div className="auth-brand-bg">
          <img
            src="/images/hero.jpg"
            alt="Settly Luxury Architecture"
            loading="lazy"
          />
        </div>
        <div className="auth-brand-scrim" />

        <div className="auth-brand-content">
          {/* Top Link */}
          <div className="auth-top-nav">
            <Link href="/" className="brand-link-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Return to Public Exchange</span>
            </Link>

            <span
              className="auth-security-badge"
              style={{
                background: "rgba(61, 90, 76, 0.35)",
                color: "#FFFFFF",
                border: "1px solid rgba(61, 90, 76, 0.5)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              TLS 1.3 256-BIT
            </span>
          </div>

          {/* Central Broadsheet Quote */}
          <div className="auth-brand-quote">
            <div className="auth-quote-tag">Verified Real Estate Platform</div>
            <h2 className="auth-quote-text">
              &ldquo;Every listing verified. Every title deed authenticated. Every reservation deposit protected with a 48-hour refund policy.&rdquo;
            </h2>
            <p className="auth-quote-caption">
              Settly connects discerning buyers with Egypt&apos;s most exclusive properties and licensed independent brokers.
            </p>
          </div>

          {/* Bottom Telemetry Ribbon */}
          <div className="auth-pillars-grid">
            <div className="pillar-item">
              <span className="pillar-val">EGP 14.8B</span>
              <span className="pillar-lbl">Audited Volume</span>
            </div>
            <div className="pillar-item">
              <span className="pillar-val">48-Hour</span>
              <span className="pillar-lbl">Refund Window</span>
            </div>
            <div className="pillar-item">
              <span className="pillar-val">100%</span>
              <span className="pillar-lbl">Licensed Brokers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Fiduciary Access Form (50%) */}
      <div className="auth-form-pane">
        <div className="auth-card">
          {/* Card Header */}
          <div className="auth-card-header">
            <div className="auth-logo-row">
              <Link href="/" className="auth-logo-link">
                <img
                  src="/images/logo.png"
                  alt="Settly Mark"
                  className="auth-logo-img"
                />
                <span className="auth-logo-text">Settly</span>
              </Link>
              <span className="auth-security-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="badge-txt-long">Verified Portal</span>
                <span className="badge-txt-short">Verified</span>
              </span>
            </div>

            <h1 className="auth-card-title">Sign in to your account</h1>
            <p className="auth-card-desc">
              Enter your credentials to access your saved properties, scheduled viewings, active offers, and account.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="role-tabs" role="tablist" aria-label="Portal Access Role">
            <button
              type="button"
              className={`role-tab-btn ${role === "buyer" ? "active" : ""}`}
              role="tab"
              aria-selected={role === "buyer"}
              onClick={() => handleRoleChange("buyer")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="role-txt-long">Private Client</span>
              <span className="role-txt-short">Buyer</span>
            </button>
            <button
              type="button"
              className={`role-tab-btn ${role === "agent" ? "active" : ""}`}
              role="tab"
              aria-selected={role === "agent"}
              onClick={() => handleRoleChange("agent")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span className="role-txt-long">Certified Advisor</span>
              <span className="role-txt-short">Advisor</span>
            </button>
          </div>

          {/* Quick-Fill Demo Bar */}
          <div className="demo-fill-bar">
            <span className="demo-fill-label">Test Access:</span>
            <div className="demo-fill-btns">
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => fillDemoCredentials("tarek.mansour@settly.com", "ClientSecret#2026", "buyer")}
                title="Fill Buyer credentials"
              >
                Buyer Demo
              </button>
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => fillDemoCredentials("karim.sayed@settly-advisors.eg", "AdvisorSecret#2026", "agent")}
                title="Fill Advisor credentials"
              >
                Advisor Demo
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="emailInput" className="form-label">
                {role === "buyer" ? "PORTAL EMAIL ADDRESS" : "LICENSED ADVISOR EMAIL"}
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="emailInput"
                  className="form-input"
                  placeholder={role === "buyer" ? "name@institution.com" : "karim.sayed@settly-advisors.eg"}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="passwordInput" className="form-label">
                  <span className="lbl-txt-long">SECURITY CREDENTIAL</span>
                  <span className="lbl-txt-short">CREDENTIAL</span>
                </label>
                <Link href="/forgot-password" className="form-link-forgot">
                  <span className="forgot-txt-long">Forgot credential?</span>
                  <span className="forgot-txt-short">Forgot?</span>
                </Link>
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="passwordInput"
                  className="form-input input-with-action"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errorMessage && (
                <span className="field-error-msg">{errorMessage}</span>
              )}
            </div>

            {/* Remember Device */}
            <div className="form-check-row">
              <input
                type="checkbox"
                id="rememberDevice"
                className="custom-checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              <label htmlFor="rememberDevice" className="checkbox-label">
                Remember this authorized device (30-day session cap)
              </label>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className={`btn-auth-submit ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  <span>Authenticating TLS Handshake...</span>
                </>
              ) : (
                <>
                  <span>Enter Secure Portal</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">OR ACCESS VIA ENTERPRISE SSO</div>

          {/* SSO Google Button */}
          <button type="button" className="btn-sso" onClick={handleGoogleSso}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="sso-txt-long">Continue with Google Corporate SSO</span>
            <span className="sso-txt-short">Continue with Google SSO</span>
          </button>

          {/* Register Prompt */}
          <div className="auth-register-prompt">
            <span>New to Settly? </span>
            <Link href="/register">Create your confidential account &rarr;</Link>
          </div>

          {/* Escrow & Security Trustline */}
          <div className="auth-card-footer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Verified Listings &amp; Secure Deposit Protection</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      <div className={`auth-toast ${toastMessage ? "show" : ""}`}>
        <svg className="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
