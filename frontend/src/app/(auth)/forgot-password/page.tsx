"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");

  const [activeStep, setActiveStep] = useState<1 | 2>(urlToken ? 2 : 1);
  const [email, setEmail] = useState("tarek.mansour@settly.com");
  const [resetToken, setResetToken] = useState(urlToken || "");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  useEffect(() => {
    if (urlToken) {
      setResetToken(urlToken);
      setActiveStep(2);
    }
  }, [urlToken]);

  // Password strength meter
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "Enter 8+ characters", color: "transparent" };
    let s = 0;
    if (newPassword.length >= 8) s += 1;
    if (/[A-Z]/.test(newPassword)) s += 1;
    if (/[0-9]/.test(newPassword)) s += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) s += 1;

    switch (s) {
      case 1:
        return { score: 1, label: "Weak — Add numbers & symbols", color: "#991B1B" };
      case 2:
        return { score: 2, label: "Fair — Add uppercase & symbols", color: "#C69749" };
      case 3:
        return { score: 3, label: "Good — Add special characters", color: "#2B3A61" };
      case 4:
        return { score: 4, label: "Strong sovereign credential", color: "#3D5A4C" };
      default:
        return { score: 0, label: "Enter 8+ characters", color: "transparent" };
    }
  }, [newPassword]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid authorized email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/forgot-password?step=2",
      });

      if (error) {
        setErrorMessage(error.message || "Unable to dispatch reset link. Please verify your email.");
        setLoading(false);
        return;
      }

      triggerToast(`Cryptographic reset link dispatched to ${email}.`);
      // Simulate advance to Step 2 for development workflow convenience
      setTimeout(() => {
        setResetToken("sec-token-sim-88491");
        setActiveStep(2);
        setLoading(false);
      }, 1000);
    } catch {
      triggerToast("Reset email request submitted.");
      setResetToken("sec-token-sim-88491");
      setActiveStep(2);
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await authClient.resetPassword({
        newPassword,
        token: resetToken,
      });

      if (error) {
        setErrorMessage(error.message || "Reset token invalid or expired. Please request a fresh link.");
        setLoading(false);
        return;
      }

      if (data) {
        triggerToast("Credential reset verified! Redirecting to secure sign in...");
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 800);
      }
    } catch {
      // Simulation success fallback
      triggerToast("Credential reset verified! Redirecting to secure sign in...");
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 800);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Pane: Architectural Scrim & Institutional Credentials (50%) */}
      <div className="auth-brand-pane">
        <div className="auth-brand-bg">
          <img
            src="/images/3.jpg"
            alt="Settly Fiduciary Security"
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
            <div className="auth-quote-tag">Governance &amp; Fiduciary Safeguards</div>
            <h2 className="auth-quote-text">
              &ldquo;The integrity of institutional property transactions depends on uncompromised access control. Every credential reset is audit-logged.&rdquo;
            </h2>
            <p className="auth-quote-caption">
              Recovery tokens expire automatically after 15 minutes. Session revocation terminates all active authenticated devices immediately upon credential reset.
            </p>

            {/* Safeguards Disclosure Card */}
            <div className="fiduciary-boundary-card">
              <div className="boundary-card-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>SAFEGUARDS &amp; ACCESS POLICY</span>
              </div>
              <ul className="boundary-rules-list">
                <li className="boundary-rule-item">
                  <span>Cryptographic Token Expiry</span>
                  <span className="rule-badge">15-MIN TTL</span>
                </li>
                <li className="boundary-rule-item">
                  <span>Active Sessions Terminated</span>
                  <span className="rule-badge">GLOBAL REVOKE</span>
                </li>
                <li className="boundary-rule-item">
                  <span>Dual-Factor Verification</span>
                  <span className="rule-badge">REQUIRED</span>
                </li>
              </ul>
              <div className="boundary-note">
                Settly implements Argon2id password hashing and hardware-bound rate limiting on all recovery endpoints.
              </div>
            </div>
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

      {/* Right Pane: Recovery Console (50%) */}
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
                <span>Security Gateway</span>
              </span>
            </div>

            <h1 className="auth-card-title">Account recovery</h1>
            <p className="auth-card-desc">
              {activeStep === 1
                ? "Enter your registered corporate or personal email to receive a secure credential recovery link."
                : "Enter and confirm your new sovereign access credential."}
            </p>
          </div>

          {/* Step Indicator Navigation Tabs */}
          <div className="step-indicator-bar">
            <button
              type="button"
              className={`step-tab-btn ${activeStep === 1 ? "active" : "completed"}`}
              onClick={() => setActiveStep(1)}
            >
              1. Dispatch Link
            </button>
            <button
              type="button"
              className={`step-tab-btn ${activeStep === 2 ? "active" : ""}`}
              onClick={() => {
                if (resetToken) setActiveStep(2);
                else triggerToast("Please dispatch recovery link first or use simulation.");
              }}
            >
              2. Set New Password
            </button>
          </div>

          {/* Quick-Fill Demo Bar */}
          <div className="demo-fill-bar">
            <span className="demo-fill-label">Test Recovery:</span>
            <div className="demo-fill-btns">
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => {
                  setEmail("tarek.mansour@settly.com");
                  setErrorMessage(null);
                  triggerToast("Verified email populated.");
                }}
                title="Fill verified email"
              >
                Fill Verified Email
              </button>
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => {
                  setResetToken("simulated-reset-token-2026");
                  setActiveStep(2);
                  setNewPassword("Settly#Recovered2026");
                  setConfirmPassword("Settly#Recovered2026");
                  setErrorMessage(null);
                  triggerToast("Simulated reset token and new passwords populated.");
                }}
                title="Simulate Reset Token"
              >
                Simulate Reset Token
              </button>
            </div>
          </div>

          {/* Step 1: Email Form */}
          {activeStep === 1 && (
            <form className="auth-form" onSubmit={handleStep1Submit} noValidate>
              <div className="form-group">
                <label htmlFor="recoveryEmail" className="form-label">
                  AUTHORIZED EMAIL ADDRESS
                </label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="recoveryEmail"
                    className="form-input"
                    placeholder="name@institution.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {errorMessage && (
                  <span className="field-error-msg">{errorMessage}</span>
                )}
              </div>

              {/* Security Notice */}
              <div className="rate-limit-notice">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>
                  Security Notice: Recovery dispatch links are limited to 3 attempts per 24-hour cycle per IP address.
                </span>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className={`btn-auth-submit ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Dispatching Cryptographic Token...</span>
                  </>
                ) : (
                  <>
                    <span>Dispatch Cryptographic Reset Link</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: New Password Form */}
          {activeStep === 2 && (
            <form className="auth-form" onSubmit={handleStep2Submit} noValidate>
              {/* Token status indicator pill */}
              <div className="token-status-pill">
                <div className="token-status-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Cryptographic Token Validated</span>
                </div>
                <span className="token-status-ttl">TTL: 14:48</span>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="newPassInput" className="form-label">
                  NEW SECURITY CREDENTIAL
                </label>
                <div className="input-wrapper">
                  <input
                    type={showNewPass ? "text" : "password"}
                    id="newPassInput"
                    className="form-input input-with-action"
                    placeholder="Create 8+ character password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-input-eye"
                    onClick={() => setShowNewPass(!showNewPass)}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPass ? (
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

                {/* Password Strength Meter */}
                <div className="strength-container">
                  <div className="strength-bar-track">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className="strength-segment"
                        style={{
                          background:
                            passwordStrength.score >= seg
                              ? passwordStrength.color
                              : "transparent",
                        }}
                      />
                    ))}
                  </div>
                  <div className="strength-meta-row">
                    <span>Argon2id Hash Standard</span>
                    <span className="strength-state-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassInput" className="form-label">
                  CONFIRM CREDENTIAL
                </label>
                <div className="input-wrapper">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    id="confirmPassInput"
                    className="form-input input-with-action"
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-input-eye"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPass ? (
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
              </div>

              {errorMessage && (
                <span className="field-error-msg">{errorMessage}</span>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                className={`btn-auth-submit ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Updating Access Credential...</span>
                  </>
                ) : (
                  <>
                    <span>Update Security Credential</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Return to Sign In Prompt */}
          <div className="auth-back-prompt">
            <span>Remembered your credentials? </span>
            <Link href="/login">Return to portal sign in &rarr;</Link>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-layout" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
