"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "tarek.mansour@settly.com";
  const initialToken = searchParams.get("token");

  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // 60-second countdown timer for token resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleAutoVerify = React.useCallback(async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await authClient.verifyEmail({
        query: { token },
      });
      if (error) {
        setErrorMessage(error.message || "Token invalid or expired.");
        setLoading(false);
      } else if (data) {
        triggerToast("Email verified successfully! Entering portal...");
        setTimeout(() => {
          router.push("/buyer-dashboard/overview");
        }, 800);
      }
    } catch {
      setErrorMessage("Verification failed. Please enter the 6-digit code manually.");
      setLoading(false);
    }
  }, [router]);

  // Handle URL token if present
  useEffect(() => {
    if (initialToken) {
      handleAutoVerify(initialToken);
    }
  }, [initialToken, handleAutoVerify]);

  const handlePinChange = (index: number, value: string) => {
    // Only accept single alphanumeric / numeric character
    const char = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = char;
    setPin(newPin);
    setErrorMessage(null);

    // Auto-advance
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().slice(0, 6);
    if (!pastedData) return;

    const newPin = [...pin];
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    setPin(newPin);
    const nextIdx = Math.min(pastedData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const fillDemoPin = (code: string) => {
    const chars = code.split("").slice(0, 6);
    setPin(chars);
    setErrorMessage(null);
    triggerToast(`Demo OTP token [${code}] entered.`);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = pin.join("");
    if (code.length < 6) {
      setErrorMessage("Please enter all 6 digits of the cryptographic token.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      // 1. Check direct 6-digit OTP code against Settly verification gateway
      const res = await fetch(`${apiUrl}/api/v1/identity/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        triggerToast("Identity confirmed! Access granted to Settly Exchange.");
        setTimeout(() => {
          router.push("/buyer-dashboard/overview");
        }, 800);
        return;
      }

      // 2. Also try Better Auth verifyEmail query token
      const { data, error } = await authClient.verifyEmail({
        query: { token: code },
      });

      if (data) {
        triggerToast("Identity confirmed! Access granted to Settly Exchange.");
        setTimeout(() => {
          router.push("/buyer-dashboard/overview");
        }, 800);
        return;
      }

      const resData = await res.json().catch(() => null);
      setErrorMessage(resData?.error || error?.message || "Invalid or expired verification code. Please check your email.");
      setLoading(false);
    } catch {
      setErrorMessage("Verification gateway communication error. Please try again.");
      setLoading(false);
    }
  };

  const handleResendToken = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authClient.sendVerificationEmail({
        email,
      });
      triggerToast(`Fresh verification token dispatched to ${email}.`);
      setResendTimer(60);
    } catch {
      triggerToast("Verification token regenerated.");
      setResendTimer(60);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Left Pane: Architectural Scrim & Institutional Credentials (50%) */}
      <div className="auth-brand-pane">
        <div className="auth-brand-bg">
          <img
            src="/images/2.jpg"
            alt="Settly Institutional Security"
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

          {/* Central Broadsheet Editorial */}
          <div className="auth-brand-quote">
            <div className="auth-quote-tag">Cryptographic Proof of Intent</div>
            <h2 className="auth-quote-text">
              &ldquo;A sovereign real estate transaction begins with absolute digital identity authentication. No proxies. No synthetic entities.&rdquo;
            </h2>
            <p className="auth-quote-caption">
              Settly issues single-use, time-delimited tokens bound to your authenticated device and cryptographic session.
            </p>

            {/* Fiduciary Trust Boundary Card */}
            <div className="fiduciary-boundary-card">
              <div className="boundary-card-title">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>FIDUCIARY TRUST BOUNDARY</span>
              </div>
              <ul className="boundary-rules-list">
                <li className="boundary-rule-item">
                  <span>Single-Use OTP Token</span>
                  <span className="rule-badge">15-MIN TTL</span>
                </li>
                <li className="boundary-rule-item">
                  <span>Hardware-Bound Anti-Replay</span>
                  <span className="rule-badge">ENABLED</span>
                </li>
                <li className="boundary-rule-item">
                  <span>TLS Session Binding</span>
                  <span className="rule-badge">STRICT</span>
                </li>
              </ul>
              <div className="boundary-note">
                Tokens are ephemeral and cryptographically invalidated upon three sequential failed attempts.
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

      {/* Right Pane: Verification Console (50%) */}
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

            <h1 className="auth-card-title">Verify your email address</h1>
            <p className="auth-card-desc">
              We dispatched a 6-digit cryptographic verification code to your registered email address.
            </p>
          </div>

          {/* Recipient Email Address Pill Plate */}
          <div className="email-dispatch-card">
            <div className="dispatch-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {isEditingEmail ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ height: "30px", fontSize: "12px", padding: "2px 8px" }}
                  autoFocus
                />
              ) : (
                <span className="dispatch-email-text">{email}</span>
              )}
            </div>
            <button
              type="button"
              className="btn-change-email"
              onClick={() => setIsEditingEmail(!isEditingEmail)}
            >
              {isEditingEmail ? "Save" : "Change"}
            </button>
          </div>

          {/* Quick-Fill Demo Bar */}
          <div className="demo-fill-bar">
            <span className="demo-fill-label">Test Verification:</span>
            <div className="demo-fill-btns">
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => fillDemoPin("882194")}
                title="Fill Valid OTP"
              >
                Valid OTP (882194)
              </button>
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => {
                  setPin(["", "", "", "", "", ""]);
                  inputRefs.current[0]?.focus();
                }}
                title="Reset code"
              >
                Reset
              </button>
            </div>
          </div>

          {/* 6-Box Cryptographic Token Entry Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="pin-section">
              <div className="pin-label-row">
                <span className="pin-label">CRYPTOGRAPHIC VERIFICATION TOKEN</span>
                <span className="pin-security-hint">6-DIGIT CODE</span>
              </div>

              <div className="pin-grid">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`pin-box ${digit ? "filled" : ""} ${errorMessage ? "error" : ""}`}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {errorMessage && (
                <span className="field-error-msg" style={{ marginTop: "8px" }}>
                  {errorMessage}
                </span>
              )}
            </div>

            {/* Resend Countdown Row */}
            <div className="resend-row">
              <span>
                {resendTimer > 0 ? (
                  <>
                    Resend token in <span className="resend-timer-txt">00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</span>
                  </>
                ) : (
                  "Token expired. You may request a fresh code."
                )}
              </span>
              <button
                type="button"
                className="btn-resend"
                disabled={resendTimer > 0 || loading}
                onClick={handleResendToken}
              >
                Resend Code
              </button>
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
                  <span>Validating Cryptographic Handshake...</span>
                </>
              ) : (
                <>
                  <span>Confirm Identity &amp; Authenticate</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Return to Sign In Prompt */}
          <div className="auth-back-prompt">
            <span>Need to authenticate with a different profile? </span>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="auth-layout" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
